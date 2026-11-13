import { useEffect, useRef, useState } from 'preact/hooks';
import { abrirCanal, type Canal } from './canal';
import { codigoSala } from './ids';
import { ID_TV, comandoValido, novaSala, reduzSala, vistaSala, type AcaoSala, type EstadoSala, type Idioma, type Tecla, type VistaSala } from './sala';

/** mensagem da TV para todos */
export interface MsgVista {
  seq: number;
  agora: number;
  vista: VistaSala;
}

/** mensagem de um telemóvel para a TV */
export interface MsgAcao {
  de: string;
  acao: AcaoSala;
}

/** força o id da ação a ser o de quem a enviou */
function comId(a: AcaoSala, de: string): AcaoSala {
  if (a.tipo === 'jogo') return { ...a, acao: { ...a.acao, id: de } };
  if ('id' in a) return { ...a, id: de } as AcaoSala;
  return a;
}

/** o código da TV sobrevive a "Recarregar" (os telemóveis voltam a entrar sozinhos) */
function codigoTv(): string {
  try {
    const c = sessionStorage.getItem('nob.tv.codigo') ?? codigoSala();
    sessionStorage.setItem('nob.tv.codigo', c);
    return c;
  } catch {
    return codigoSala();
  }
}

/** A TV: dona do estado. Reduz ações, corre o relógio e publica a vista. */
export function useHost(idioma: Idioma, aoComando?: (t: Tecla) => void) {
  const [estado, setEstado] = useState<EstadoSala>(() => novaSala(codigoTv(), idioma));
  const comando = useRef(aoComando);
  comando.current = aoComando;
  const [ligado, setLigado] = useState<boolean | null>(null);
  const ref = useRef(estado);
  const canal = useRef<Canal | null>(null);
  const seq = useRef(0);
  const ultima = useRef('');

  const despachar = (a: AcaoSala) => {
    const novo = reduzSala(ref.current, a, Date.now());
    if (novo !== ref.current) {
      ref.current = novo;
      setEstado(novo);
    }
  };

  const publicar = (forcar = false) => {
    const v = vistaSala(ref.current);
    const txt = JSON.stringify(v);
    if (!forcar && txt === ultima.current) return;
    ultima.current = txt;
    const msg: MsgVista = { seq: ++seq.current, agora: Date.now(), vista: v };
    canal.current?.enviar('vista', msg);
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
    c.aoMudarPresenca((ids) => despachar({ tipo: 'ligados', ids: ids.filter((i) => i !== ID_TV) }));
    c.ouvir('acao', (d) => {
      const m = d as MsgAcao;
      if (typeof m?.de !== 'string' || !m.acao) return;
      if (m.acao.tipo === 'comando') {
        const real = ref.current.aliases[m.de] ?? m.de;
        if (comandoValido(ref.current, real)) comando.current?.(m.acao.tecla);
        return;
      }
      despachar(comId(m.acao, m.de));
    });
    c.ouvir('pedir', () => publicar(true));
    const relogio = setInterval(() => despachar({ tipo: 'tick' }), 250);
    return () => {
      clearInterval(relogio);
      c.sair();
    };
  }, []);

  useEffect(() => publicar(), [estado]);

  return { estado, ligado, acao: (a: AcaoSala) => despachar(comId(a, ID_TV)) };
}

export type EstadoLigacao = 'a_ligar' | 'ok' | 'sem_sala' | 'erro';

/** O telemóvel: envia intenções, recebe vistas. */
export interface Entrada {
  nome: string;
  avatar: number;
  tag: string;
}

/**
 * O telemóvel: envia intenções, recebe vistas.
 * Sem `entrada` só observa (para mostrar que bonecos já estão escolhidos antes de entrar).
 */
export function useCliente(codigo: string, eu: string, entrada: Entrada | null) {
  const [vista, setVista] = useState<VistaSala | null>(null);
  const [estado, setEstado] = useState<EstadoLigacao>('a_ligar');
  const desvio = useRef(0);
  const canal = useRef<Canal | null>(null);
  const seq = useRef(0);
  const ent = useRef(entrada);
  ent.current = entrada;
  const entrarAgora = useRef<() => void>(() => {});

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
    let recebeu = false;
    let ultimaEntrada = 0;
    const enviarEntrada = () => {
      if (!ent.current) return;
      ultimaEntrada = Date.now();
      c.enviar('acao', { de: eu, acao: { tipo: 'entrar', id: eu, ...ent.current } } satisfies MsgAcao);
    };
    const entrar = () => {
      if (Date.now() - ultimaEntrada >= 3000) enviarEntrada();
    };
    entrarAgora.current = enviarEntrada;
    c.ouvir('vista', (d) => {
      const m = d as MsgVista;
      // ignora mensagens antigas (seq 1 = a TV acabou de ligar)
      if (m.seq <= seq.current && m.seq !== 1) return;
      seq.current = m.seq;
      desvio.current = m.agora - Date.now();
      recebeu = true;
      setVista(m.vista);
      setEstado('ok');
      const real = m.vista.aliases[eu] ?? eu;
      if (!m.vista.jogadores.some((j) => j.id === real && j.ligado)) entrar();
    });
    c.aoLigar((ok) => {
      if (!ok) return setEstado('erro');
      entrar();
      c.enviar('pedir', {});
    });
    const t = setTimeout(() => !recebeu && setEstado('sem_sala'), 6000);
    return () => {
      clearTimeout(t);
      c.sair();
    };
  }, [codigo, eu]);

  return {
    vista,
    estado,
    /** hora da TV, para os temporizadores */
    agoraTv: () => Date.now() + desvio.current,
    acao: (a: AcaoSala) => canal.current?.enviar('acao', { de: eu, acao: a } satisfies MsgAcao),
  };
}
