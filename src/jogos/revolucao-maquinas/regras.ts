import { baralhar } from '../../core/ids';
import { irPara, pausaPorFalta, podio, quantosLigados } from '../../core/jogo';

/**
 * Revolução das Máquinas: regras em info/jogos/motim-em-orbita.md.
 * Papéis, mãos de cartas e resultados de poderes só vão pelo canal privado (`privadoMaquinas`).
 * Decisões do utilizador: 45 s por escolha (sem escolha = sorteio; voto em falta = Não; veto sem resposta = recusado);
 * discussão 60 s + "Seguir" do líder; depois de 3 falhas ninguém fica bloqueado;
 * pontos: equipa vencedora +1000, IA vencedora +500, +100 por carta da tua cor que entra contigo no governo.
 */

export type PapelM = 'tripulacao' | 'amotinado' | 'ia';
export type Carta = 'R' | 'S'; // 🔧 Reparação / 💥 Sabotagem
export type Poder = 'investigar' | 'espiar' | 'eleger' | 'ejetar';
export type FaseM = 'carta' | 'nomear' | 'votar' | 'votos' | 'comandante' | 'piloto' | 'veto' | 'entrou' | 'poder' | 'ver' | 'discussao' | 'fim';

export interface DefMaquinas {
  discussao: number;
}
export const DEF_PADRAO_MAQUINAS: DefMaquinas = { discussao: 60 };
export const OPCOES_MAQUINAS = { discussao: [30, 60, 120, 180] };
export const MIN_JOGADORES = 5;
export const MAX_JOGADORES = 10;
export const MIN_LIGADOS = 3;
export const T_CARTA = 20;
export const T_ESCOLHA = 45;
export const T_VOTOS = 6;
export const T_ENTROU = 5;
export const T_VER = 10;
export const PONTOS_EQUIPA = 1000;
export const PONTOS_IA = 500;
export const PONTOS_CARTA = 100;
export const REP_VENCE = 5;
export const SAB_VENCE = 6;
/**
 * Números próprios (decisão do utilizador, 17/11 — não copiar as tabelas do Secret Hitler):
 * baralho 7 🔧 + 12 💥; veto e "IA eleita Piloto" contam a partir de 4 💥.
 */
export const CARTAS_R = 7;
export const CARTAS_S = 12;
export const VETO_DESDE = 4;
export const IA_PILOTO_DESDE = 4;
export const TIPOS_MAQUINAS = ['rm_piloto', 'rm_votar', 'rm_descartar', 'rm_escolher', 'rm_vetar', 'rm_veto', 'rm_poder', 'rm_visto', 'rm_seguir', 'rm_vi'];
export const SO_LIDER_MAQUINAS = ['rm_seguir'];

export type AcaoMaquinas =
  | { tipo: 'rm_piloto'; id: string; alvo: string }
  | { tipo: 'rm_votar'; id: string; sim: boolean }
  | { tipo: 'rm_descartar'; id: string; i: number }
  | { tipo: 'rm_escolher'; id: string; i: number }
  | { tipo: 'rm_vetar'; id: string }
  | { tipo: 'rm_veto'; id: string; aceita: boolean }
  | { tipo: 'rm_poder'; id: string; alvo: string | null }
  | { tipo: 'rm_visto'; id: string }
  | { tipo: 'rm_seguir'; id: string }
  /** viu a identidade (fase 'carta') */
  | { tipo: 'rm_vi'; id: string }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'tick' };

export type Resultado = { tipo: 'investigar'; alvo: string; equipa: 'amotinados' | 'tripulacao' } | { tipo: 'espiar'; cartas: Carta[] };

export interface EstadoMaquinas {
  def: DefMaquinas;
  fase: FaseM;
  terminaEm: number;
  pausaRestante: number | null;
  participantes: string[]; // ordem da consola
  audiencia: string[];
  ligados: string[];
  papeis: Record<string, PapelM>;
  vivos: string[];
  baralho: Carta[];
  descartes: Carta[];
  mao: Carta[];
  reparacoes: number;
  sabotagens: number;
  falhas: number;
  /** índice (em participantes) do Comandante da rotação normal */
  rotacao: number;
  comandante: string;
  piloto: string | null;
  /** governo anterior aprovado: [Comandante, Piloto] (com ≤ 5 vivos só o Piloto conta) */
  bloqueados: string[];
  /** 📢: próximo Comandante escolhido (a rotação continua depois) */
  eleito: string | null;
  votos: Record<string, boolean>;
  /** votação revelada (fica até à votação seguinte) */
  ultimaVotacao: { votos: Record<string, boolean>; aprovado: boolean } | null;
  vetoRecusado: boolean;
  /** última carta que entrou (caos = 3 falhas ou sem poder) */
  entrou: { carta: Carta; caos: boolean } | null;
  poder: Poder | null;
  alvoPoder: string | null;
  resultado: Resultado | null;
  seed: number;
  vencedor: 'tripulacao' | 'amotinados' | null;
  motivo: 'reparacoes' | 'ia_ejetada' | 'sabotagens' | 'ia_piloto' | null;
  pontos: Record<string, number>;
  usadas: string[];
  /** quem já viu a identidade (a fase 'carta' só acaba quando todos os ligados a viram; bots contam como vistos) */
  viram: string[];
}

/** tabela de papéis do .md */
export function contarPapeis(n: number): { amotinados: number; iaSabe: boolean } {
  return { amotinados: n >= 9 ? 3 : n >= 7 ? 2 : 1, iaSabe: n <= 6 };
}

/** poderes por n.º de Sabotagens (índice 1..5) */
export function poderDe(n: number, sab: number): Poder | null {
  const t: (Poder | null)[] =
    // 🔍 aos 2 💥 em todos os tamanhos; aos 3 💥, 👀 com 5–6 e 📢 com 7–10; 🚀 aos 4 e 5 💥
    n <= 6 ? [null, null, 'investigar', 'espiar', 'ejetar', 'ejetar'] : [null, null, 'investigar', 'eleger', 'ejetar', 'ejetar'];
  return t[sab] ?? null;
}

export const equipaDe = (p: PapelM) => (p === 'tripulacao' ? 'tripulacao' : 'amotinados');

function sorteio<T>(e: EstadoMaquinas, lista: T[]): [T, EstadoMaquinas] {
  return [baralhar(lista, e.seed)[0], { ...e, seed: e.seed + 101 }];
}

export function novoMaquinas(ids: string[], def: Partial<DefMaquinas>, agora: number, usadas: string[] = []): EstadoMaquinas {
  const participantes = baralhar(ids.slice(0, MAX_JOGADORES), agora + 3);
  const { amotinados } = contarPapeis(participantes.length);
  const lista: PapelM[] = ['ia', ...Array(amotinados).fill('amotinado')];
  const papeis: Record<string, PapelM> = {};
  baralhar(participantes, agora + 11).forEach((id, i) => (papeis[id] = lista[i] ?? 'tripulacao'));
  const baralho = baralhar<Carta>([...Array(CARTAS_R).fill('R'), ...Array(CARTAS_S).fill('S')], agora + 17);
  return irPara(
    {
      def: { ...DEF_PADRAO_MAQUINAS, ...def },
      fase: 'carta',
      terminaEm: 0,
      pausaRestante: null,
      participantes,
      audiencia: ids.slice(MAX_JOGADORES),
      ligados: [...ids],
      papeis,
      vivos: [...participantes],
      baralho,
      descartes: [],
      mao: [],
      reparacoes: 0,
      sabotagens: 0,
      falhas: 0,
      rotacao: 0,
      comandante: participantes[0],
      piloto: null,
      bloqueados: [],
      eleito: null,
      votos: {},
      ultimaVotacao: null,
      vetoRecusado: false,
      entrou: null,
      poder: null,
      alvoPoder: null,
      resultado: null,
      seed: agora + 23,
      vencedor: null,
      motivo: null,
      pontos: Object.fromEntries(participantes.map((id) => [id, 0])),
      usadas,
      viram: [],
    },
    'carta',
    T_CARTA,
    agora,
  );
}

/** quem o Comandante pode escolher como Piloto */
export function elegiveis(e: Pick<EstadoMaquinas, 'vivos' | 'comandante' | 'bloqueados'>): string[] {
  const bl = e.vivos.length <= 5 ? e.bloqueados.slice(1) : e.bloqueados;
  const l = e.vivos.filter((id) => id !== e.comandante && !bl.includes(id));
  return l.length ? l : e.vivos.filter((id) => id !== e.comandante);
}

/** alvos de um poder */
export function alvosPoder(e: Pick<EstadoMaquinas, 'vivos' | 'comandante'>): string[] {
  return e.vivos.filter((id) => id !== e.comandante);
}

/** tira n cartas; se faltarem, baralha os descartes de volta */
function tirar(e: EstadoMaquinas, n: number): [Carta[], EstadoMaquinas] {
  let s = e;
  if (s.baralho.length < n) s = { ...s, baralho: [...s.baralho, ...baralhar(s.descartes, s.seed)], descartes: [], seed: s.seed + 7 };
  return [s.baralho.slice(0, n), { ...s, baralho: s.baralho.slice(n) }];
}

function acabar(e: EstadoMaquinas, vencedor: 'tripulacao' | 'amotinados', motivo: EstadoMaquinas['motivo'], agora: number): EstadoMaquinas {
  const pontos = { ...e.pontos };
  e.participantes.forEach((id) => {
    if (equipaDe(e.papeis[id]) === vencedor) pontos[id] += PONTOS_EQUIPA + (e.papeis[id] === 'ia' ? PONTOS_IA : 0);
  });
  return irPara({ ...e, vencedor, motivo, pontos }, 'fim', 0, agora);
}

function novaRonda(e: EstadoMaquinas, agora: number): EstadoMaquinas {
  let comandante: string;
  let rotacao = e.rotacao;
  const n = e.participantes.length;
  if (e.eleito && e.vivos.includes(e.eleito)) comandante = e.eleito;
  else {
    do rotacao = (rotacao + 1) % n;
    while (!e.vivos.includes(e.participantes[rotacao]));
    comandante = e.participantes[rotacao];
  }
  return irPara({ ...e, rotacao, comandante, eleito: null, piloto: null, votos: {}, mao: [], vetoRecusado: false, poder: null, alvoPoder: null, resultado: null }, 'nomear', T_ESCOLHA, agora);
}

/** uma carta entra em jogo */
function entra(e: EstadoMaquinas, carta: Carta, caos: boolean, agora: number): EstadoMaquinas {
  let s: EstadoMaquinas = { ...e, reparacoes: e.reparacoes + (carta === 'R' ? 1 : 0), sabotagens: e.sabotagens + (carta === 'S' ? 1 : 0), entrou: { carta, caos } };
  if (caos) s = { ...s, falhas: 0, bloqueados: [] };
  else {
    const pontos = { ...s.pontos };
    [s.comandante, s.piloto!].forEach((id) => {
      if ((carta === 'R') === (s.papeis[id] === 'tripulacao')) pontos[id] += PONTOS_CARTA;
    });
    s = { ...s, pontos };
  }
  if (s.reparacoes >= REP_VENCE) return acabar(s, 'tripulacao', 'reparacoes', agora);
  if (s.sabotagens >= SAB_VENCE) return acabar(s, 'amotinados', 'sabotagens', agora);
  return irPara(s, 'entrou', T_ENTROU, agora);
}

/** uma falha (governo rejeitado ou veto aceite); à 3.ª entra a carta do topo sem poder */
function falha(e: EstadoMaquinas, agora: number): EstadoMaquinas | null {
  const falhas = e.falhas + 1;
  if (falhas < 3) return null; // quem chama segue com falhas + 1
  const [[c], s] = tirar({ ...e, falhas }, 1);
  return entra(s, c, true, agora);
}

function fimVotacao(e: EstadoMaquinas, agora: number): EstadoMaquinas {
  const votos: Record<string, boolean> = {};
  e.vivos.forEach((id) => (votos[id] = e.votos[id] ?? false));
  const sim = Object.values(votos).filter(Boolean).length;
  const aprovado = sim > e.vivos.length - sim;
  return irPara({ ...e, votos, ultimaVotacao: { votos, aprovado } }, 'votos', T_VOTOS, agora);
}

function depoisVotos(e: EstadoMaquinas, agora: number): EstadoMaquinas {
  if (!e.ultimaVotacao?.aprovado) {
    return falha(e, agora) ?? novaRonda({ ...e, falhas: e.falhas + 1 }, agora);
  }
  if (e.papeis[e.piloto!] === 'ia' && e.sabotagens >= IA_PILOTO_DESDE) return acabar(e, 'amotinados', 'ia_piloto', agora);
  const [mao, s] = tirar({ ...e, falhas: 0, bloqueados: [e.comandante, e.piloto!] }, 3);
  return irPara({ ...s, mao }, 'comandante', T_ESCOLHA, agora);
}

function descartar(e: EstadoMaquinas, i: number, agora: number): EstadoMaquinas {
  const mao = e.mao.filter((_, k) => k !== i);
  return irPara({ ...e, mao, descartes: [...e.descartes, e.mao[i]] }, 'piloto', T_ESCOLHA, agora);
}

function escolher(e: EstadoMaquinas, i: number, agora: number): EstadoMaquinas {
  const c = e.mao[i];
  return entra({ ...e, mao: [], descartes: [...e.descartes, ...e.mao.filter((_, k) => k !== i)] }, c, false, agora);
}

function depoisEntrou(e: EstadoMaquinas, agora: number): EstadoMaquinas {
  if (e.entrou?.carta === 'S' && !e.entrou.caos) {
    const poder = poderDe(e.participantes.length, e.sabotagens);
    if (poder) return irPara({ ...e, poder, alvoPoder: null }, 'poder', T_ESCOLHA, agora);
  }
  if (e.entrou?.caos) return novaRonda(e, agora);
  return irPara(e, 'discussao', e.def.discussao, agora);
}

function usarPoder(e: EstadoMaquinas, alvo: string | null, agora: number): EstadoMaquinas {
  let s = { ...e, alvoPoder: alvo };
  switch (e.poder) {
    case 'espiar': {
      const [cartas, s2] = tirar(s, 3);
      // espreitar não tira do baralho
      return irPara({ ...s2, baralho: [...cartas, ...s2.baralho], resultado: { tipo: 'espiar', cartas } }, 'ver', T_VER, agora);
    }
    case 'investigar':
      return irPara({ ...s, resultado: { tipo: 'investigar', alvo: alvo!, equipa: equipaDe(e.papeis[alvo!]) } }, 'ver', T_VER, agora);
    case 'eleger':
      s = { ...s, eleito: alvo };
      break;
    case 'ejetar':
      s = { ...s, vivos: s.vivos.filter((x) => x !== alvo) };
      if (e.papeis[alvo!] === 'ia') return acabar(s, 'tripulacao', 'ia_ejetada', agora);
      break;
  }
  return irPara(s, 'discussao', e.def.discussao, agora);
}

/** = PREFIXO_BOT de core/sala (não importado: evita o ciclo sala → registo → regras) */
const ehBot = (id: string) => id.startsWith('bot-');

/** todos os jogadores ligados (humanos) já viram a identidade */
export function todosViram(e: Pick<EstadoMaquinas, 'participantes' | 'ligados' | 'viram'>): boolean {
  return e.participantes.every((id) => ehBot(id) || !e.ligados.includes(id) || e.viram.includes(id));
}

function tempoAcabou(e: EstadoMaquinas, agora: number): EstadoMaquinas {
  switch (e.fase) {
    case 'carta':
      return todosViram(e) ? irPara(e, 'nomear', T_ESCOLHA, agora) : e;
    case 'nomear': {
      const [p, s] = sorteio(e, elegiveis(e));
      return irPara({ ...s, piloto: p, votos: {} }, 'votar', T_ESCOLHA, agora);
    }
    case 'votar':
      return fimVotacao(e, agora);
    case 'votos':
      return depoisVotos(e, agora);
    case 'comandante': {
      const [i, s] = sorteio(e, [0, 1, 2]);
      return descartar(s, i, agora);
    }
    case 'piloto': {
      const [i, s] = sorteio(e, [0, 1]);
      return escolher(s, i, agora);
    }
    case 'veto':
      return irPara({ ...e, vetoRecusado: true }, 'piloto', T_ESCOLHA, agora);
    case 'entrou':
      return depoisEntrou(e, agora);
    case 'poder': {
      if (e.poder === 'espiar') return usarPoder(e, null, agora);
      const [a, s] = sorteio(e, alvosPoder(e));
      return usarPoder(s, a, agora);
    }
    case 'ver':
      return irPara(e, 'discussao', e.def.discussao, agora);
    case 'discussao':
      return novaRonda(e, agora);
    default:
      return e;
  }
}

export const pausadoMaquinas = (e: EstadoMaquinas) => e.pausaRestante !== null;

export function reduzMaquinas(e: EstadoMaquinas, a: AcaoMaquinas, agora: number): EstadoMaquinas {
  if (e.fase === 'fim' && a.tipo !== 'ligados') return e;
  if (a.tipo === 'ligados') {
    let s: EstadoMaquinas = { ...e, ligados: a.ids };
    if (s.fase === 'fim') return s;
    s = pausaPorFalta(s, quantosLigados(s.participantes, a.ids) < MIN_LIGADOS, agora);
    // quem faltava ver saiu: pode começar
    if (s.fase === 'carta' && !pausadoMaquinas(s) && todosViram(s)) return tempoAcabou(s, agora);
    return s;
  }
  if (a.tipo === 'tick') return pausadoMaquinas(e) || agora < e.terminaEm ? e : tempoAcabou(e, agora);
  if (pausadoMaquinas(e) || !e.vivos.includes(a.id)) return e;
  const cmd = a.id === e.comandante;
  const pil = a.id === e.piloto;
  switch (a.tipo) {
    case 'rm_piloto':
      if (e.fase !== 'nomear' || !cmd || !elegiveis(e).includes(a.alvo)) return e;
      return irPara({ ...e, piloto: a.alvo, votos: {} }, 'votar', T_ESCOLHA, agora);
    case 'rm_votar': {
      if (e.fase !== 'votar' || a.id in e.votos) return e;
      const s = { ...e, votos: { ...e.votos, [a.id]: a.sim } };
      return s.vivos.every((id) => id in s.votos) ? fimVotacao(s, agora) : s;
    }
    case 'rm_descartar':
      if (e.fase !== 'comandante' || !cmd || !(a.i >= 0 && a.i < e.mao.length)) return e;
      return descartar(e, a.i, agora);
    case 'rm_escolher':
      if (e.fase !== 'piloto' || !pil || !(a.i >= 0 && a.i < e.mao.length)) return e;
      return escolher(e, a.i, agora);
    case 'rm_vetar':
      if (e.fase !== 'piloto' || !pil || e.sabotagens < VETO_DESDE || e.vetoRecusado) return e;
      return irPara(e, 'veto', T_ESCOLHA, agora);
    case 'rm_veto': {
      if (e.fase !== 'veto' || !cmd) return e;
      if (!a.aceita) return irPara({ ...e, vetoRecusado: true }, 'piloto', T_ESCOLHA, agora);
      const s = { ...e, descartes: [...e.descartes, ...e.mao], mao: [] };
      return falha(s, agora) ?? irPara({ ...s, falhas: s.falhas + 1 }, 'discussao', e.def.discussao, agora);
    }
    case 'rm_poder':
      if (e.fase !== 'poder' || !cmd) return e;
      if (e.poder !== 'espiar' && (!a.alvo || !alvosPoder(e).includes(a.alvo))) return e;
      return usarPoder(e, e.poder === 'espiar' ? null : a.alvo, agora);
    case 'rm_visto':
      if (e.fase !== 'ver' || !cmd) return e;
      return irPara(e, 'discussao', e.def.discussao, agora);
    case 'rm_seguir':
      if (e.fase !== 'discussao') return e;
      return novaRonda(e, agora);
    case 'rm_vi': {
      if (e.fase !== 'carta' || e.viram.includes(a.id)) return e;
      const s = { ...e, viram: [...e.viram, a.id] };
      return todosViram(s) ? tempoAcabou(s, agora) : s;
    }
  }
  return e;
}

/* ---------- vistas ---------- */

export interface VistaMaquinas {
  def: DefMaquinas;
  fase: FaseM;
  terminaEm: number;
  restante: number | null;
  participantes: string[];
  audiencia: string[];
  vivos: string[];
  reparacoes: number;
  sabotagens: number;
  falhas: number;
  comandante: string;
  piloto: string | null;
  bloqueados: string[];
  votaram: string[];
  /** fase 'carta': quem já viu a identidade */
  viram: string[];
  ultimaVotacao: { votos: Record<string, boolean>; aprovado: boolean } | null;
  entrou: { carta: Carta; caos: boolean } | null;
  poder: Poder | null;
  /** só eleger/ejetar são públicos */
  alvoPoder: string | null;
  baralho: number;
  vencedor: 'tripulacao' | 'amotinados' | null;
  motivo: EstadoMaquinas['motivo'];
  papeis: Record<string, PapelM>;
  pontos: Record<string, number>;
  podio: { id: string; pontos: number; lugar: number }[];
  usadas: string[];
}

export function vistaMaquinas(e: EstadoMaquinas): VistaMaquinas {
  // os pontos só se veem no fim: o +100 por carta denunciaria a equipa do Comandante e do Piloto
  const fim = e.fase === 'fim';
  return {
    def: e.def,
    fase: e.fase,
    terminaEm: e.terminaEm,
    restante: e.pausaRestante,
    participantes: e.participantes,
    audiencia: e.audiencia,
    vivos: e.vivos,
    reparacoes: e.reparacoes,
    sabotagens: e.sabotagens,
    falhas: e.falhas,
    comandante: e.comandante,
    piloto: e.piloto,
    bloqueados: e.fase === 'nomear' ? e.vivos.filter((id) => id !== e.comandante && !elegiveis(e).includes(id)) : [],
    votaram: e.fase === 'votar' ? Object.keys(e.votos) : [],
    viram: e.fase === 'carta' ? e.viram : [],
    ultimaVotacao: e.ultimaVotacao,
    entrou: e.entrou,
    poder: e.poder,
    alvoPoder: e.poder === 'eleger' || e.poder === 'ejetar' ? e.alvoPoder : null,
    baralho: e.baralho.length,
    vencedor: e.vencedor,
    motivo: e.motivo,
    papeis: e.fase === 'fim' ? e.papeis : {},
    pontos: fim ? e.pontos : {},
    podio: fim ? podio(e.participantes, e.pontos) : [],
    usadas: e.usadas,
  };
}

export interface PrivadoMaquinas {
  papel: PapelM;
  /** Amotinados: os outros Amotinados; IA (5–6): os Amotinados */
  aliados: string[];
  /** Amotinados: quem é a IA */
  ia: string | null;
  /** cartas na mão (Comandante/Piloto na sessão secreta) */
  mao: Carta[];
  podeVetar: boolean;
  voto?: boolean;
  resultado: Resultado | null;
}

export function privadoMaquinas(e: EstadoMaquinas, id: string): PrivadoMaquinas | null {
  const papel = e.papeis[id];
  if (!papel) return null;
  const amotinados = e.participantes.filter((x) => e.papeis[x] === 'amotinado');
  const ia = e.participantes.find((x) => e.papeis[x] === 'ia') ?? null;
  const minha = (e.fase === 'comandante' && id === e.comandante) || (e.fase === 'piloto' && id === e.piloto);
  return {
    papel,
    aliados: papel === 'amotinado' ? amotinados.filter((x) => x !== id) : papel === 'ia' && contarPapeis(e.participantes.length).iaSabe ? amotinados : [],
    ia: papel === 'amotinado' ? ia : null,
    mao: minha ? e.mao : [],
    podeVetar: e.fase === 'piloto' && id === e.piloto && e.sabotagens >= VETO_DESDE && !e.vetoRecusado,
    ...(e.fase === 'votar' && id in e.votos ? { voto: e.votos[id] } : {}),
    resultado: e.fase === 'ver' && id === e.comandante ? e.resultado : null,
  };
}

/* ---------- saídas a meio (src/core/saidas.ts) ---------- */

export const importanteMaquinas = (e: EstadoMaquinas, id: string): boolean => e.vivos.includes(id);
export const foraMaquinas = (e: EstadoMaquinas, id: string): boolean => !e.vivos.includes(id);

/**
 * O líder decidiu seguir sem ele: deixa de votar (como ejetado, mas sem vitória por isso).
 * Se era Comandante ou Piloto a meio do governo, as cartas voltam ao topo do baralho e a ronda recomeça com o Comandante seguinte.
 */
export function sairMaquinas(e: EstadoMaquinas, id: string, agora: number): EstadoMaquinas {
  if (!e.vivos.includes(id) || e.fase === 'fim') return e;
  const votos = { ...e.votos };
  delete votos[id];
  let s: EstadoMaquinas = { ...e, vivos: e.vivos.filter((x) => x !== id), votos, bloqueados: e.bloqueados.map((x) => (x === id ? '' : x)), eleito: e.eleito === id ? null : e.eleito };
  const noGoverno = id === e.comandante || id === e.piloto;
  if (noGoverno && ['nomear', 'votar', 'votos', 'comandante', 'piloto', 'veto', 'poder', 'ver'].includes(e.fase)) {
    s = { ...s, baralho: [...e.mao, ...e.baralho], mao: [] };
    return novaRonda(s, agora);
  }
  if (s.fase === 'votar' && s.vivos.every((x) => x in s.votos)) return fimVotacao(s, agora);
  return s;
}
