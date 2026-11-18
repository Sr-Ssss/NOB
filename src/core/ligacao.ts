import { useEffect, useRef, useState } from 'preact/hooks';
import { abrirCanal, type Canal } from './canal';
import { chaveValida, guardadas, impressao as impressaoChave, novasChavesDispositivo, novasChavesHost, parValido, type ChavesHost, type ParChaves } from './cripto';
import { codigoSala, definirSal, novoSal, obterSal, paramsHash } from './ids';
import { BATIMENTO, CHAVE_ESTADO, CHAVE_SEQ, COPIA_MAX, ESPERA_HERDEIRO, INTERVALO_COPIA, escolherHerdeiro, gravarEstado, guardarAssumir, horaRetoma, lerEstado, rotaCom, tirarAssumir } from './passagem';
import { privadosPorAparelho } from './privado';
import { ProtocoloCliente, ProtocoloHost, publicas, type ChavesPublicasHost, type CopiaHost, type MsgPedir, type Passagem } from './protocolo';
import { ID_TV, comandoValido, novaSala, privadoSala, reduzSala, vistaSala, type AcaoSala, type EstadoSala, type Idioma, type Tecla, type VistaSala } from './sala';

export type { MsgAcao, MsgVista } from './protocolo';

/** força o id da ação a ser o de quem a enviou */
function comId(a: AcaoSala, de: string): AcaoSala {
  if (a.tipo === 'jogo') return { ...a, acao: { ...a.acao, id: de } };
  if ('id' in a) return { ...a, id: de } as AcaoSala;
  return a;
}

const sessao = () => sessionStorage;
const local = () => localStorage;

/** o código, as chaves e as chaves fixadas da TV sobrevivem a "Recarregar" (os telemóveis voltam a entrar sozinhos) */
function codigoTv(): string {
  try {
    const c = sessionStorage.getItem('nob.tv.codigo') ?? codigoSala();
    sessionStorage.setItem('nob.tv.codigo', c);
    return c;
  } catch {
    return codigoSala();
  }
}

const chavesHostValidas = (x: unknown) => !!x && parValido((x as ChavesHost).assina) && parValido((x as ChavesHost).ecdh);

function fixadasTv(): Record<string, string> {
  try {
    const f = JSON.parse(sessionStorage.getItem('nob.tv.fixadas') ?? '{}') as Record<string, unknown>;
    return Object.fromEntries(Object.entries(f).filter((e): e is [string, string] => chaveValida(e[1])));
  } catch {
    return {};
  }
}

const CHAVES_TV = ['nob.tv.codigo', 'nob.tv.chaves', 'nob.tv.fixadas', 'nob.tv.cadeia', CHAVE_ESTADO, CHAVE_SEQ];

function guardarSessao(chave: string, valor: unknown) {
  try {
    sessionStorage.setItem(chave, typeof valor === 'string' ? valor : JSON.stringify(valor));
  } catch {
    /* sem armazenamento */
  }
}

function cadeiaTv(): Passagem[] {
  try {
    const c = JSON.parse(sessionStorage.getItem('nob.tv.cadeia') ?? '[]') as unknown;
    return Array.isArray(c) ? (c as Passagem[]) : [];
  } catch {
    return [];
  }
}

/** sem TV: o herdeiro está a assumir a party? (src/core/passagem.ts) A cópia passa a ser o código, as chaves e as fixadas deste separador. */
function herdar(): { copia: CopiaHost; hora: number } | null {
  const a = tirarAssumir();
  if (!a || !definirSal(a.copia.sal)) return null;
  const k = a.copia;
  guardarSessao('nob.tv.codigo', k.estado.codigo);
  guardarSessao('nob.tv.chaves', k.chaves);
  guardarSessao('nob.tv.fixadas', k.fixadas);
  guardarSessao('nob.tv.cadeia', k.cadeia);
  return { copia: k, hora: horaRetoma(a) };
}

/** de onde o anfitrião arranca, se não for de uma party nova */
interface Arranque {
  estado: EstadoSala;
  /** hora do anfitrião em que retoma */
  hora: number;
  seq: number;
}

/** sem TV, a cópia do herdeiro que está a assumir; senão, a gravação deste separador (recarregou a página) */
function arrancar(semTv: boolean): Arranque | null {
  const h = semTv ? herdar() : null;
  if (h) return { estado: { ...h.copia.estado, semTv: true }, hora: h.hora, seq: h.copia.seq };
  try {
    const g = lerEstado(sessionStorage, codigoTv());
    if (!g || !definirSal(g.sal) || !!g.estado.semTv !== semTv) return null;
    return { estado: g.estado, hora: g.agora, seq: Number(sessionStorage.getItem(CHAVE_SEQ)) || 0 };
  } catch {
    return null; // sem armazenamento
  }
}

/**
 * A TV: dona do estado. Reduz ações, corre o relógio e publica a vista.
 * Sem TV (`semTv`), é o telemóvel do criador, que também joga; manda cópias ao herdeiro e, se outro assumir, passa a jogador.
 */
export function useHost(idioma: Idioma, aoComando?: (t: Tecla) => void, semTv?: { eu: string }) {
  const inicio = useRef<Arranque | null | undefined>(undefined);
  if (inicio.current === undefined) inicio.current = arrancar(!!semTv);
  /**
   * relógio do anfitrião: quem assume continua a hora do antigo desde a última vista, e quem recarregou desde a gravação
   * (os temporizadores retomam onde estavam)
   */
  const desvio = useRef(inicio.current ? inicio.current.hora - Date.now() : 0);
  const agora = () => Date.now() + desvio.current;
  const [estado, setEstado] = useState<EstadoSala>(() => {
    if (inicio.current) return inicio.current.estado;
    novoSal(); // sorteios que os telemóveis não conseguem recalcular
    return { ...novaSala(codigoTv(), idioma), semTv: !!semTv };
  });
  const comando = useRef(aoComando);
  comando.current = aoComando;
  const [ligado, setLigado] = useState<boolean | null>(null);
  const ref = useRef(estado);
  const canal = useRef<Canal | null>(null);
  const seq = useRef(inicio.current?.seq ?? 0);
  const ultima = useRef('');
  /** hora (local) da última vista publicada (batimento) */
  const publicadaEm = useRef(0);
  /** última gravação no separador (para sobreviver a recarregar) */
  const gravado = useRef<{ em: number; estado: EstadoSala | null }>({ em: 0, estado: null });
  /** outro telemóvel assumiu: este já não grava nada */
  const deixou = useRef(false);
  const proto = useRef<ProtocoloHost | null>(null);
  /** último privado enviado a cada aparelho */
  const enviados = useRef(new Map<string, string>());
  /** sem TV: quem está no canal, o herdeiro (aparelho + chaves novas que vai receber) e a última cópia enviada */
  const presentes = useRef<string[]>([]);
  const herdeiro = useRef<{ ap: string; chaves: ChavesHost; prox: string } | null>(null);
  const copiada = useRef<{ em: number; estado: EstadoSala | null }>({ em: 0, estado: null });
  if (!proto.current) {
    const chaves = guardadas(sessao, 'nob.tv.chaves', novasChavesHost, chavesHostValidas);
    proto.current = new ProtocoloHost(estado.codigo, chaves, fixadasTv(), (f) => guardarSessao('nob.tv.fixadas', f), semTv ? cadeiaTv() : []);
    // expulsos de antes de recarregar / da cópia herdada (src/core/membros.ts)
    proto.current.barrar(estado.expulsos ?? []);
  }

  const despachar = (a: AcaoSala) => {
    const novo = reduzSala(ref.current, a, agora());
    if (novo !== ref.current) {
      // alguém foi expulso: o protocolo deixa de abrir as ações desse aparelho (id e chave)
      if (novo.expulsos !== ref.current.expulsos) proto.current!.barrar(novo.expulsos ?? []);
      ref.current = novo;
      setEstado(novo);
    }
  };

  const publicar = (forcar = false) => {
    const v = vistaSala(ref.current);
    const txt = JSON.stringify(v);
    if (!forcar && txt === ultima.current) return;
    ultima.current = txt;
    publicadaEm.current = Date.now();
    canal.current?.enviar('vista', proto.current!.vista(++seq.current, agora(), v, herdeiro.current?.prox));
    guardarSessao(CHAVE_SEQ, String(seq.current)); // ao recarregar, as vistas continuam a subir
  };

  /** grava o estado no separador (sobrevive a recarregar); `ja` = agora, sem esperar o intervalo */
  const gravar = (ja = false) => {
    const g = gravado.current;
    if (deixou.current || g.estado === ref.current || (!ja && Date.now() - g.em < INTERVALO_COPIA)) return;
    gravarEstado(sessionStorage, { estado: ref.current, sal: obterSal(), agora: agora() });
    gravado.current = { em: Date.now(), estado: ref.current };
  };

  /** sem TV: escolhe o herdeiro e manda-lhe a cópia (quando o estado muda, no máximo a cada INTERVALO_COPIA) */
  const passagem = () => {
    if (!semTv) return;
    const p = proto.current!;
    const ap = escolherHerdeiro(ref.current, presentes.current, p.fixadas, semTv.eu);
    const mudou = (herdeiro.current?.ap ?? null) !== ap;
    if (mudou) {
      const chaves = novasChavesHost();
      herdeiro.current = ap ? { ap, chaves, prox: impressaoChave(chaves.assina.pub) } : null;
      copiada.current = { em: 0, estado: null };
    }
    const h = herdeiro.current;
    const t = Date.now();
    const c = copiada.current;
    if (h && (mudou || (c.estado !== ref.current && t - c.em >= INTERVALO_COPIA) || t - c.em >= COPIA_MAX)) {
      // a chave do próprio anfitrião vai junto: se voltar como jogador, o novo anfitrião já o conhece
      const fixadas = { ...p.fixadas, [semTv.eu]: chavesAparelho(semTv.eu).pub };
      const m = p.copia(h.ap, { seq: seq.current, agora: agora(), estado: ref.current, sal: obterSal(), fixadas, chaves: h.chaves, cadeia: [...p.cadeia, p.passar(publicas(h.chaves))] });
      if (m) {
        canal.current?.enviar('copia', m);
        copiada.current = { em: t, estado: ref.current };
      }
    }
    if (mudou) publicar(true); // anuncia o herdeiro novo (`prox`)
  };

  /** sem TV: outro telemóvel assumiu a party (este separador voltou depois de fechado, ou ficou sem rede): passa a jogador */
  const substituido = (novo: ChavesPublicasHost) => {
    const codigo = ref.current.codigo;
    deixou.current = true;
    guardarHost(codigo, novo);
    for (const k of CHAVES_TV) {
      try {
        sessionStorage.removeItem(k);
      } catch {
        /* sem armazenamento */
      }
    }
    location.hash = rotaCom('/jogar', { sala: codigo }, paramsHash().get('eu'));
  };

  /** cada aparelho só recebe o seu (papéis secretos, cartas, palavras da equipa), cifrado só para ele */
  const enviarPrivados = (so?: string) => {
    const p = proto.current!;
    const aparelhos = so ? [so] : Object.keys(p.fixadas);
    const porAparelho = privadosPorAparelho(ref.current, aparelhos.filter((a) => a !== semTv?.eu));
    for (const [ap, dados] of Object.entries(porAparelho)) {
      const txt = JSON.stringify(dados);
      const antes = enviados.current.get(ap);
      if (!so && (txt === antes || (antes === undefined && txt === '{}'))) continue;
      const m = p.privado(ap, dados);
      if (!m) continue;
      enviados.current.set(ap, txt);
      canal.current?.enviar('privado', m);
    }
  };

  useEffect(() => {
    let c: Canal;
    try {
      c = abrirCanal(ref.current.codigo, ID_TV);
    } catch {
      setLigado(false);
      return;
    }
    canal.current = c;
    c.aoLigar((ok) => {
      setLigado(ok);
      if (ok) publicar(true);
    });
    // sem TV, o criador é o host e também joga: está sempre ligado
    c.aoMudarPresenca((ids) => {
      presentes.current = ids;
      despachar({ tipo: 'ligados', ids: [...ids.filter((i) => i !== ID_TV), ...(semTv ? [semTv.eu] : [])] });
      passagem();
    });
    if (semTv)
      c.ouvir('vista', (d) => {
        const novo = proto.current!.substituidoPor(d);
        if (novo) substituido(novo);
      });
    c.ouvir('acao', (d) => {
      const m = proto.current!.abrir(d);
      if (!m) return;
      if (m.acao.tipo === 'comando') {
        const real = ref.current.aliases[m.de] ?? m.de;
        if (comandoValido(ref.current, real)) comando.current?.(m.acao.tecla);
        return;
      }
      // sem TV, o anfitrião é um jogador: ninguém o expulsa (a party vive no telemóvel dele)
      if (semTv && m.acao.tipo === 'expulsar') {
        const al = ref.current.aliases;
        if ((al[m.acao.alvo] ?? m.acao.alvo) === (al[semTv.eu] ?? semTv.eu)) return;
      }
      despachar(comId(m.acao, m.de));
    });
    c.ouvir('pedir', (d) => {
      publicar(true);
      const de = (d as MsgPedir | null)?.de;
      if (typeof de === 'string' && proto.current!.fixadas[de]) enviarPrivados(de);
    });
    const relogio = setInterval(() => despachar({ tipo: 'tick' }), 250);
    // batimento (o herdeiro sabe que o anfitrião está vivo, mesmo sem mudanças) e cópias ao herdeiro
    const vivo = setInterval(() => {
      if (Date.now() - publicadaEm.current >= BATIMENTO) publicar(true);
      passagem();
      gravar();
    }, 1000);
    // F5 / fechar: grava já (no Android, se o sistema matar a app, fica a última gravação)
    const aoSair = () => gravar(true);
    window.addEventListener('pagehide', aoSair);
    return () => {
      clearInterval(relogio);
      clearInterval(vivo);
      window.removeEventListener('pagehide', aoSair);
      // saiu do ecrã (ex.: "voltar" do Android a meio): se regressar a este ecrã, a party continua
      gravar(true);
      c.sair();
    };
  }, []);

  useEffect(() => {
    publicar();
    enviarPrivados();
  }, [estado]);

  return {
    estado,
    ligado,
    /** impressão digital da chave da TV (vai no link do QR) */
    impressao: proto.current.impressao,
    acao: (a: AcaoSala) => despachar(comId(a, ID_TV)),
    /** ação do próprio criador como jogador (modo sem TV) */
    acaoDe: (de: string, a: AcaoSala) => despachar(comId(a, de)),
    /** sem TV: o privado do próprio criador (e dos bots dele) lê-se direto do estado */
    privadoDe: (id: string) => privadoSala(estado, id),
    /** hora do anfitrião (depois de uma passagem, continua a do antigo) */
    agora,
  };
}

export type EstadoLigacao = 'a_ligar' | 'ok' | 'sem_sala' | 'erro';

export interface Entrada {
  nome: string;
  avatar: number;
  tag: string;
}

/** chaves do aparelho: uma por id (o `?eu=2` dos testes tem as suas) */
export function chavesAparelho(eu: string): ParChaves {
  return guardadas(local, 'nob.chaves.' + eu, novasChavesDispositivo, parValido);
}

const DIA = 24 * 60 * 60 * 1000;
const chaveHostGuardada = (codigo: string) => 'nob.host.' + codigo;

function hostGuardado(codigo: string): ChavesPublicasHost | null {
  try {
    const h = JSON.parse(localStorage.getItem(chaveHostGuardada(codigo)) ?? 'null') as (ChavesPublicasHost & { em: number }) | null;
    if (h && chaveValida(h.assina) && chaveValida(h.ecdh) && Date.now() - h.em < DIA) return { assina: h.assina, ecdh: h.ecdh };
  } catch {
    /* nada guardado */
  }
  return null;
}

function guardarHost(codigo: string, h: ChavesPublicasHost) {
  try {
    localStorage.setItem(chaveHostGuardada(codigo), JSON.stringify({ ...h, em: Date.now() }));
  } catch {
    /* sem armazenamento */
  }
}

/**
 * O telemóvel: envia intenções, recebe vistas.
 * Sem `entrada` só observa (para mostrar que bonecos já estão escolhidos antes de entrar).
 * `impressao`: a do link do QR (se veio por lá), para só aceitar essa TV.
 */
export function useCliente(codigo: string, eu: string, entrada: Entrada | null, impressao: string | null = null) {
  const [vista, setVista] = useState<VistaSala | null>(null);
  const [estado, setEstado] = useState<EstadoLigacao>('a_ligar');
  /** id do jogador → o seu privado (o meu e, no líder, o dos bots) */
  const [privados, setPrivados] = useState<Record<string, unknown>>({});
  const desvio = useRef(0);
  const canal = useRef<Canal | null>(null);
  const proto = useRef<ProtocoloCliente | null>(null);
  const seq = useRef(0);
  const ent = useRef(entrada);
  ent.current = entrada;
  const entrarAgora = useRef<() => void>(() => {});

  /** false = ainda não se conhece a TV (a ação perde-se) */
  const enviar = (a: AcaoSala): boolean => {
    const m = proto.current?.acao(a);
    if (m) canal.current?.enviar('acao', m);
    return !!m;
  };

  useEffect(() => {
    if (entrada) entrarAgora.current();
  }, [entrada?.nome, entrada?.avatar, entrada?.tag]);

  useEffect(() => {
    let c: Canal;
    try {
      c = abrirCanal(codigo, eu);
    } catch {
      setEstado('erro');
      return;
    }
    canal.current = c;
    proto.current = new ProtocoloCliente(codigo, eu, chavesAparelho(eu), impressao, impressao ? null : hostGuardado(codigo), (h) => guardarHost(codigo, h));
    setPrivados({});
    /** sem TV: a cópia do estado, se o anfitrião me escolheu como herdeiro (src/core/passagem.ts) */
    let copia: CopiaHost | null = null;
    let ultimaVista = Date.now();
    let recebeu = false;
    let ultimaEntrada = 0;
    const enviarEntrada = () => {
      if (ent.current && enviar({ tipo: 'entrar', id: eu, ...ent.current })) ultimaEntrada = Date.now();
    };
    const entrar = () => {
      if (Date.now() - ultimaEntrada >= 3000) enviarEntrada();
    };
    entrarAgora.current = enviarEntrada;
    c.ouvir('vista', (d) => {
      const m = proto.current!.lerVista(d);
      if (!m) return; // não assinada pela nossa TV
      // ignora mensagens antigas (seq 1 = a TV acabou de ligar; `trocou` = outro telemóvel assumiu a party)
      if (m.seq <= seq.current && m.seq !== 1 && !m.trocou) return;
      seq.current = m.seq;
      ultimaVista = Date.now();
      // a cópia só serve enquanto este aparelho for o herdeiro anunciado
      if (m.trocou || (copia && m.prox !== impressaoChave(copia.chaves.assina.pub))) copia = null;
      desvio.current = m.agora - Date.now();
      recebeu = true;
      setVista(m.vista);
      setEstado('ok');
      const real = m.vista.aliases[eu] ?? eu;
      if (!m.vista.jogadores.some((j) => j.id === real && j.ligado)) entrar();
    });
    c.ouvir('privado', (d) => {
      const p = proto.current!.lerPrivado(d);
      if (p) setPrivados(p);
    });
    c.ouvir('copia', (d) => {
      const k = proto.current!.lerCopia(d);
      if (k) copia = k;
    });
    // o anfitrião calou-se: o herdeiro assume a party com a cópia (vira `#/criar`, que lê a cópia)
    const vigia = setInterval(() => {
      if (!copia || Date.now() - ultimaVista < ESPERA_HERDEIRO) return;
      try {
        // o relógio continua o que os jogadores viam: os segundos sem anfitrião contam (sem salto para trás)
        guardarAssumir(copia, Date.now() + desvio.current);
      } catch {
        return; // sem armazenamento no separador
      }
      copia = null;
      location.hash = rotaCom('/criar', {}, paramsHash().get('eu'));
    }, 1000);
    c.aoLigar((ok) => {
      if (!ok) return setEstado('erro');
      entrar();
      c.enviar('pedir', { de: eu } satisfies MsgPedir);
    });
    const t = setTimeout(() => !recebeu && setEstado('sem_sala'), 6000);
    return () => {
      clearTimeout(t);
      clearInterval(vigia);
      c.sair();
    };
  }, [codigo, eu, impressao]);

  return {
    vista,
    estado,
    privados,
    /** pede outra vez o privado (se uma mensagem se perdeu) */
    pedirPrivado: () => canal.current?.enviar('pedir', { de: eu } satisfies MsgPedir),
    /** hora da TV, para os temporizadores */
    agoraTv: () => Date.now() + desvio.current,
    acao: enviar,
  };
}
