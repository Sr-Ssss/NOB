import { useEffect, useRef, useState } from 'preact/hooks';
import { abrirCanal, type Canal } from './canal';
import { chaveValida, guardadas, impressao as impressaoChave, novasChavesDispositivo, novasChavesHost, parValido, type ChavesHost, type ParChaves } from './cripto';
import { codigoSala, definirSal, novoSal, obterSal, paramsHash } from './ids';
import { BATIMENTO, CHAVE_ESTADO, CHAVE_SEQ, COPIA_MAX, ESPERA_HERDEIRO, INTERVALO_COPIA, escolherHerdeiro, gravarEstado, guardarAssumir, horaRetoma, lerEstado, rotaCom, tirarAssumir } from './passagem';
import { privadosPorAparelho } from './privado';
import { PASSA_JA, ProtocoloCliente, ProtocoloHost, publicas, type ChavesPublicasHost, type CopiaHost, type MsgPedir, type Passagem } from './protocolo';
import { ID_TV, assumirSemTv, comandoValido, novaSala, privadoSala, reduzSala, virarTv, vistaSala, type AcaoSala, type EstadoSala, type Idioma, type Tecla, type VistaSala } from './sala';

/** quanto o anfitrião tenta passar a party à TV escolhida antes de desistir (ms) */
const ESPERA_TV = 12_000;
/** aviso que o ecrã inicial mostra uma vez (ex.: esta TV foi substituída por outra) */
export const CHAVE_AVISO = 'nob.aviso';

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

/**
 * Este separador está a assumir a party? (src/core/passagem.ts) `tv`: como TV escolhida pelo líder; senão, sem TV (herdeiro).
 * A cópia passa a ser o código, as chaves e as fixadas deste separador.
 */
function herdar(tv: boolean): { copia: CopiaHost; hora: number } | null {
  const a = tirarAssumir();
  if (!a || !!a.copia.tv !== tv || !definirSal(a.copia.sal)) return null;
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

/** a cópia de quem está a assumir (herdeiro sem TV, ou a TV nova); senão, a gravação deste separador (recarregou a página) */
function arrancar(semTv: boolean): Arranque | null {
  const h = herdar(!semTv);
  if (h) return { estado: semTv ? assumirSemTv(h.copia.estado, h.hora) : { ...h.copia.estado, semTv: false, novaTv: null }, hora: h.hora, seq: h.copia.seq };
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
  /** a passar a party ao aparelho que o líder escolheu para TV (jogador, aparelho, chaves novas) */
  const aTv = useRef<{ alvo: string; ap: string; chaves: ChavesHost; prox: string; desde: number } | null>(null);
  if (!proto.current) {
    const chaves = guardadas(sessao, 'nob.tv.chaves', novasChavesHost, chavesHostValidas);
    proto.current = new ProtocoloHost(estado.codigo, chaves, fixadasTv(), (f) => guardarSessao('nob.tv.fixadas', f), cadeiaTv());
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
    // a passar a party à TV escolhida: anuncia-a com PASSA_JA (os telemóveis aceitam-na logo)
    const prox = aTv.current ? aTv.current.prox + PASSA_JA : herdeiro.current?.prox;
    canal.current?.enviar('vista', proto.current!.vista(++seq.current, agora(), v, prox));
    guardarSessao(CHAVE_SEQ, String(seq.current)); // ao recarregar, as vistas continuam a subir
  };

  /** grava o estado no separador (sobrevive a recarregar); `ja` = agora, sem esperar o intervalo */
  const gravar = (ja = false) => {
    const g = gravado.current;
    if (deixou.current || g.estado === ref.current || (!ja && Date.now() - g.em < INTERVALO_COPIA)) return;
    gravarEstado(sessionStorage, { estado: ref.current, sal: obterSal(), agora: agora() });
    gravado.current = { em: Date.now(), estado: ref.current };
  };

  /** a chave do próprio anfitrião sem TV vai nas cópias: se voltar como jogador, o novo anfitrião já o conhece */
  const fixadasCopia = () => (semTv ? { ...proto.current!.fixadas, [semTv.eu]: chavesAparelho(semTv.eu).pub } : proto.current!.fixadas);

  /**
   * Escolhe o herdeiro e manda-lhe a cópia (quando o estado muda, no máximo a cada INTERVALO_COPIA).
   * Também com TV: se a TV se calar, o telemóvel do líder assume a party sem TV.
   */
  const passagem = () => {
    if (aTv.current) return;
    const p = proto.current!;
    const ap = escolherHerdeiro(ref.current, presentes.current, p.fixadas, semTv?.eu ?? ID_TV);
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
      const m = p.copia(h.ap, { seq: seq.current, agora: agora(), estado: ref.current, sal: obterSal(), fixadas: fixadasCopia(), chaves: h.chaves, cadeia: [...p.cadeia, p.passar(publicas(h.chaves))] });
      if (m) {
        canal.current?.enviar('copia', m);
        copiada.current = { em: t, estado: ref.current };
      }
    }
    if (mudou) publicar(true); // anuncia o herdeiro novo (`prox`)
  };

  /**
   * Outro aparelho assumiu a party (este voltou depois de fechado, ficou sem rede, ou passou a party à TV escolhida):
   * sem TV, o criador passa a jogador; a TV volta ao ecrã inicial com um aviso.
   */
  const substituido = (novo: ChavesPublicasHost) => {
    if (deixou.current) return;
    const codigo = ref.current.codigo;
    deixou.current = true;
    aTv.current = null;
    guardarHost(codigo, novo);
    for (const k of CHAVES_TV) {
      try {
        sessionStorage.removeItem(k);
      } catch {
        /* sem armazenamento */
      }
    }
    if (semTv) location.hash = rotaCom('/jogar', { sala: codigo }, paramsHash().get('eu'));
    else {
      guardarSessao(CHAVE_AVISO, 'avisoOutraTv');
      location.hash = rotaCom('/', {}, paramsHash().get('eu'));
    }
  };

  /** o aparelho (no canal, com chave conhecida) do jogador `alvo` */
  const aparelhoDe = (alvo: string) =>
    presentes.current.find((ap) => ap !== ID_TV && (ref.current.aliases[ap] ?? ap) === alvo && !!proto.current!.fixadas[ap]) ?? null;

  /**
   * O líder escolheu quem passa a ser a TV (`novaTv`, pedido de 20/11):
   * - é o próprio anfitrião sem TV: este separador passa a TV (grava e muda de ecrã; as chaves ficam as mesmas);
   * - é outro aparelho: manda-lhe a cópia marcada `tv` (com ele já fora da lista) e anuncia-o com PASSA_JA,
   *   até ver a vista da TV nova (`substituido`); ao fim de ESPERA_TV desiste.
   */
  const passarATv = () => {
    const alvo = ref.current.novaTv;
    if (deixou.current) return;
    if (!alvo) {
      aTv.current = null;
      return;
    }
    if (semTv && (ref.current.aliases[semTv.eu] ?? semTv.eu) === alvo) {
      ref.current = virarTv(ref.current, alvo, agora());
      gravar(true);
      deixou.current = true; // o ecrã da TV continua daqui (mesmo separador, mesma gravação)
      location.hash = rotaCom('/tv', {}, paramsHash().get('eu'));
      return;
    }
    let x = aTv.current;
    if (!x || x.alvo !== alvo) {
      const ap = aparelhoDe(alvo);
      if (!ap) return despachar({ tipo: 'tornar_tv', id: ID_TV, alvo: null });
      const chaves = novasChavesHost();
      x = aTv.current = { alvo, ap, chaves, prox: impressaoChave(chaves.assina.pub), desde: Date.now() };
    }
    if (Date.now() - x.desde > ESPERA_TV) {
      aTv.current = null;
      despachar({ tipo: 'tornar_tv', id: ID_TV, alvo: null });
      publicar(true); // tira o PASSA_JA
      return;
    }
    const p = proto.current!;
    publicar(true);
    const m = p.copia(x.ap, { seq: seq.current, agora: agora(), estado: virarTv(ref.current, alvo, agora()), sal: obterSal(), fixadas: fixadasCopia(), chaves: x.chaves, cadeia: [...p.cadeia, p.passar(publicas(x.chaves))], tv: true });
    if (m) canal.current?.enviar('copia', m);
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
      passarATv();
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

  // o líder acabou de escolher a TV: começa já (depois, a cada segundo, até a TV nova responder)
  useEffect(() => {
    if (estado.novaTv && !aTv.current) passarATv();
  }, [estado.novaTv]);

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
      if (!k) return;
      if (!k.tv) {
        copia = k;
        return;
      }
      // o líder escolheu este aparelho para TV: assume já a party, como TV
      try {
        guardarAssumir(k, Date.now() + desvio.current);
      } catch {
        return; // sem armazenamento no separador
      }
      location.hash = rotaCom('/tv', {}, paramsHash().get('eu'));
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
    /** impressão digital do anfitrião (vai no link do QR que este telemóvel mostra); '' = ainda não se conhece */
    impressaoHost: () => (proto.current?.host ? impressaoChave(proto.current.host.assina) : ''),
    acao: enviar,
  };
}
