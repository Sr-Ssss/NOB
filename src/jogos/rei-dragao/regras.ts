import { baralhar } from '../../core/ids';
import { irPara as irParaComum, pausaPorFalta, podio, quantosLigados } from '../../core/jogo';

/**
 * O Rei e o Dragão: regras em info/jogos/dois-lados.md.
 * Cartas, pedidos de troca, a batata e votos de aposta/arqueiro só vão pelo canal privado (`privadoRei`).
 * Decisões do utilizador: Rei e Dragão sempre; o resto é 🔵 Corte ou 🔴 Rebeldes (membros simples), com ajuste nas opções;
 * extras ligam/desligam um a um; Escudeiro/Domador só têm objetivo próprio; não há troca mútua: quem tem a 🥔
 * mostra a carta (segurar 2 s), escolhe a quem mostrou e, se essa pessoa aceitar, fica com a batata; o líder nunca é refém e fica líder;
 * Traidor: carta com uma cor, joga pela outra; Gémeos e Rivais: um 🔵 e um 🔴.
 */

export type Cor = 'azul' | 'vermelho' | 'cinza';
export type Extra = 'escudeiro' | 'domador' | 'traidor' | 'gemeos' | 'rivais' | 'medroso' | 'curioso' | 'pajem' | 'duque' | 'apostador' | 'arqueiro' | 'batata';
export type PapelR = 'rei' | 'dragao' | 'corte' | 'rebelde' | 'escudeiro' | 'domador' | 'traidor' | 'gemeo' | 'rival' | 'medroso' | 'curioso' | 'pajem' | 'duque' | 'apostador' | 'arqueiro' | 'alvo' | 'isco' | 'batata';
export type FaseR = 'ir' | 'carta' | 'lider' | 'ronda' | 'troca' | 'aposta' | 'fim';

/** cor = a da carta (o Traidor mostra esta, mas joga pela outra) */
export interface CartaR {
  papel: PapelR;
  cor: Cor;
}

export const EXTRAS: Extra[] = ['escudeiro', 'domador', 'traidor', 'gemeos', 'rivais', 'medroso', 'curioso', 'pajem', 'duque', 'apostador', 'arqueiro', 'batata'];
/** quantos lugares cada extra ocupa (pares e trios saem juntos) */
const LUGARES: Record<Extra, number> = { escudeiro: 1, domador: 1, traidor: 1, gemeos: 2, rivais: 2, medroso: 1, curioso: 1, pajem: 1, duque: 1, apostador: 1, arqueiro: 3, batata: 1 };

export interface DefRei {
  salas: [string, string];
  tempo: number;
  extras: Record<Extra, boolean>;
  /** 🔴 simples a mais (+) ou a menos (−) em relação ao equilíbrio */
  ajuste: number;
}
export const DEF_PADRAO_REI: DefRei = { salas: ['', ''], tempo: 180, extras: Object.fromEntries(EXTRAS.map((x) => [x, true])) as Record<Extra, boolean>, ajuste: 0 };
export const OPCOES_REI = { tempo: [120, 180, 300], ajuste: [-2, -1, 0, 1, 2] };
export const MIN_JOGADORES = 6;
export const MAX_JOGADORES = 24;
export const MIN_LIGADOS = 3;
export const T_LIDER = 6;
export const T_REFENS = 30;
export const T_TROCA = 30;
export const T_APOSTA = 30;
export const MAX_NOME_SALA = 16;
export const PONTOS_EQUIPA = 1000;
export const PONTOS_CHEFE = 500;
export const PONTOS_EXTRA = 500;
export const PONTOS_NEUTRO = 1000;
export const TIPOS_REI = ['rd_avancar', 'rd_pronto', 'rd_ok', 'rd_pedir', 'rd_responder', 'rd_fechar', 'rd_votacao', 'rd_votar', 'rd_refens', 'rd_cheguei', 'rd_apostar', 'rd_apontar'];
/** só o líder da party: avançar quando alguém não carrega em Pronto/OK (o jogo não encrava) */
export const SO_LIDER_REI: string[] = ['rd_avancar'];

export type AcaoRei =
  | { tipo: 'rd_pronto'; id: string }
  | { tipo: 'rd_ok'; id: string }
  /** quem tem a 🥔 pede troca de carta */
  | { tipo: 'rd_pedir'; id: string; alvo: string }
  | { tipo: 'rd_responder'; id: string; aceita: boolean }
  | { tipo: 'rd_fechar'; id: string }
  | { tipo: 'rd_votacao'; id: string }
  | { tipo: 'rd_votar'; id: string; alvo: string }
  | { tipo: 'rd_refens'; id: string; ids: string[] }
  | { tipo: 'rd_cheguei'; id: string }
  | { tipo: 'rd_avancar'; id: string }
  | { tipo: 'rd_apostar'; id: string; equipa: 'azul' | 'vermelho' }
  | { tipo: 'rd_apontar'; id: string; alvo: string }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'tick' };

export interface Troca {
  de: string;
  para: string;
}

export interface EstadoRei {
  def: DefRei;
  fase: FaseR;
  terminaEm: number;
  pausaRestante: number | null;
  participantes: string[];
  audiencia: string[];
  ligados: string[];
  cartas: Record<string, CartaR>;
  /** sala (0 ou 1) de cada um */
  sala: Record<string, 0 | 1>;
  lideres: [string, string];
  ronda: number;
  rondas: number;
  refensPorLider: number;
  prontos: string[];
  /** reféns escolhidos nesta ronda, por sala */
  refens: [string[] | null, string[] | null];
  /** quem está a mudar de sala (fase troca) */
  mudando: string[];
  chegaram: string[];
  /** votação para trocar de líder, por sala */
  votacao: [Record<string, string> | null, Record<string, string> | null];
  votacaoUsada: [boolean, boolean];
  /** última troca de líder (para a TV) */
  novoLider: { sala: 0 | 1; id: string } | null;
  trocas: Troca[];
  batata: string | null;
  aposta: 'azul' | 'vermelho' | null;
  apontado: string | null;
  seed: number;
  /** muda a cada ação (os telemóveis voltam a pedir o privado) */
  seq: number;
  vencedor: 'azul' | 'vermelho' | null;
  ganhou: Record<string, boolean>;
  pontos: Record<string, number>;
  usadas: string[];
}

export const rondasDe = (n: number) => (n <= 10 ? 3 : n <= 14 ? 4 : 5);
export const refensDe = (n: number) => (n <= 10 ? 1 : 2);
const oposta = (c: 'azul' | 'vermelho'): 'azul' | 'vermelho' => (c === 'azul' ? 'vermelho' : 'azul');

/** equipa real (o Traidor joga pela cor oposta à da carta); null = neutro */
export function equipaDe(c: CartaR): 'azul' | 'vermelho' | null {
  if (c.cor === 'cinza') return null;
  return c.papel === 'traidor' ? oposta(c.cor) : c.cor;
}

/** sorteia as cartas: Rei + Dragão, os extras ligados que couberem (até metade), o resto Corte/Rebeldes */
export function distribuir(ids: string[], def: DefRei, seed: number): Record<string, CartaR> {
  const n = ids.length;
  const cartas: CartaR[] = [
    { papel: 'rei', cor: 'azul' },
    { papel: 'dragao', cor: 'vermelho' },
  ];
  let livres = Math.floor((n - 2) / 2);
  const flex: PapelR[] = [];
  for (const x of baralhar(EXTRAS.filter((x) => def.extras[x]), seed + 5)) {
    if (LUGARES[x] > livres) continue;
    livres -= LUGARES[x];
    if (x === 'escudeiro') cartas.push({ papel: 'escudeiro', cor: 'azul' });
    else if (x === 'domador') cartas.push({ papel: 'domador', cor: 'vermelho' });
    else if (x === 'gemeos' || x === 'rivais') {
      const p = x === 'gemeos' ? 'gemeo' : 'rival';
      cartas.push({ papel: p, cor: 'azul' }, { papel: p, cor: 'vermelho' });
    } else if (x === 'apostador' || x === 'batata') cartas.push({ papel: x, cor: 'cinza' });
    else if (x === 'arqueiro') cartas.push({ papel: 'arqueiro', cor: 'cinza' }, { papel: 'alvo', cor: 'cinza' }, { papel: 'isco', cor: 'cinza' });
    else flex.push(x);
  }
  const neutros = cartas.filter((c) => c.cor === 'cinza').length;
  const comCor = n - neutros;
  const alvoVerm = Math.min(comCor - 1, Math.max(1, Math.floor(comCor / 2) + def.ajuste));
  const conta = (eq: 'azul' | 'vermelho' = 'vermelho') => cartas.filter((c) => equipaDe(c) === eq).length;
  // extras de cor livre: vão para a equipa a que faltam mais (empate = sorteio)
  baralhar(flex, seed + 7).forEach((p, i) => {
    const faltaV = alvoVerm - conta();
    const faltaA = comCor - alvoVerm - conta('azul');
    const equipa: 'azul' | 'vermelho' = faltaV > faltaA || (faltaV === faltaA && (seed + i) % 2 === 0) ? 'vermelho' : 'azul';
    cartas.push({ papel: p, cor: p === 'traidor' ? oposta(equipa) : equipa });
  });
  while (cartas.length < n) cartas.push(conta() < alvoVerm ? { papel: 'rebelde', cor: 'vermelho' } : { papel: 'corte', cor: 'azul' });
  const ordem = baralhar(ids, seed + 11);
  return Object.fromEntries(ordem.map((id, i) => [id, cartas[i]]));
}

function irPara(e: EstadoRei, fase: FaseR, s: number, agora: number): EstadoRei {
  return { ...irParaComum(e, fase, s, agora), seq: e.seq + 1 };
}

const membros = (e: Pick<EstadoRei, 'participantes' | 'sala'>, k: 0 | 1) => e.participantes.filter((id) => e.sala[id] === k);
const ativos = (e: EstadoRei) => e.participantes.filter((id) => e.ligados.includes(id));

export function novoRei(ids: string[], def: Partial<DefRei>, agora: number, usadas: string[] = []): EstadoRei {
  const d: DefRei = { ...DEF_PADRAO_REI, ...def, extras: { ...DEF_PADRAO_REI.extras, ...(def.extras ?? {}) } };
  const participantes = ids.slice(0, MAX_JOGADORES);
  const n = participantes.length;
  const cartas = distribuir(participantes, d, agora + 3);
  const sala: Record<string, 0 | 1> = {};
  baralhar(participantes, agora + 13).forEach((id, i) => (sala[id] = (i % 2) as 0 | 1));
  return {
    def: d,
    fase: 'ir',
    terminaEm: 0,
    pausaRestante: null,
    participantes,
    audiencia: ids.slice(MAX_JOGADORES),
    ligados: [...ids],
    cartas,
    sala,
    lideres: ['', ''],
    ronda: 1,
    rondas: rondasDe(n),
    refensPorLider: refensDe(n),
    prontos: [],
    refens: [null, null],
    mudando: [],
    chegaram: [],
    votacao: [null, null],
    votacaoUsada: [false, false],
    novoLider: null,
    trocas: [],
    batata: participantes.find((id) => cartas[id].papel === 'batata') ?? null,
    aposta: null,
    apontado: null,
    seed: agora + 23,
    seq: 0,
    vencedor: null,
    ganhou: {},
    pontos: Object.fromEntries(participantes.map((id) => [id, 0])),
    usadas,
  };
}

function sortearLideres(e: EstadoRei, agora: number): EstadoRei {
  const l0 = baralhar(membros(e, 0), e.seed)[0];
  const l1 = baralhar(membros(e, 1), e.seed + 1)[0];
  return irPara({ ...e, lideres: [l0, l1], seed: e.seed + 101 }, 'lider', T_LIDER, agora);
}

const novaRonda = (e: EstadoRei, agora: number) =>
  irPara({ ...e, refens: [null, null], votacao: [null, null], votacaoUsada: [false, false], trocas: [], mudando: [], chegaram: [] }, 'ronda', e.def.tempo, agora);

/** quem o líder da sala k pode escolher como refém */
export const candidatosRefem = (e: Pick<EstadoRei, 'participantes' | 'sala' | 'lideres'>, k: 0 | 1) => membros(e, k).filter((id) => id !== e.lideres[k]);
export const nRefens = (e: Pick<EstadoRei, 'participantes' | 'sala' | 'lideres' | 'refensPorLider'>, k: 0 | 1) => Math.min(e.refensPorLider, candidatosRefem(e, k).length);

function fimRonda(e: EstadoRei, agora: number): EstadoRei {
  const refens = ([0, 1] as const).map((k) => e.refens[k] ?? baralhar(candidatosRefem(e, k), e.seed + k).slice(0, nRefens(e, k)));
  const mudando = [...refens[0], ...refens[1]];
  const sala = { ...e.sala };
  mudando.forEach((id) => (sala[id] = (1 - sala[id]) as 0 | 1));
  return irPara({ ...e, refens: [refens[0], refens[1]], mudando, chegaram: [], sala, trocas: [], votacao: [null, null], seed: e.seed + 7 }, 'troca', T_TROCA, agora);
}

function depoisTroca(e: EstadoRei, agora: number): EstadoRei {
  if (e.ronda < e.rondas) return novaRonda({ ...e, ronda: e.ronda + 1 }, agora);
  const precisa = e.participantes.some((id) => ['apostador', 'arqueiro'].includes(e.cartas[id].papel));
  return precisa ? irPara({ ...e, mudando: [] }, 'aposta', T_APOSTA, agora) : acabar({ ...e, mudando: [] }, agora);
}

/** resultado de cada um à meia-noite */
export function acabar(e: EstadoRei, agora: number): EstadoRei {
  const de = (p: PapelR) => e.participantes.find((id) => e.cartas[id].papel === p);
  const rei = de('rei')!;
  const dragao = de('dragao')!;
  const salaDragao = e.sala[dragao];
  const chamuscado = (id: string) => e.sala[id] === salaDragao;
  const vencedor: 'azul' | 'vermelho' = chamuscado(rei) ? 'vermelho' : 'azul';
  const ganhou: Record<string, boolean> = {};
  const pontos = { ...e.pontos };
  for (const id of e.participantes) {
    const c = e.cartas[id];
    const eq = equipaDe(c);
    const ganhaEquipa = eq === vencedor;
    let obj: boolean | null = null; // null = sem objetivo próprio
    const comigo = (outro: string | undefined) => !!outro && e.sala[outro] === e.sala[id];
    const par = e.participantes.find((x) => x !== id && e.cartas[x].papel === c.papel);
    switch (c.papel) {
      case 'escudeiro':
      case 'pajem':
        obj = comigo(rei);
        break;
      case 'duque':
        obj = !comigo(rei);
        break;
      case 'domador':
      case 'curioso':
        obj = comigo(dragao);
        break;
      case 'medroso':
        obj = !chamuscado(id);
        break;
      case 'gemeo':
        obj = comigo(par);
        break;
      case 'rival':
        obj = !!par && chamuscado(par) && !chamuscado(id);
        break;
      case 'apostador':
        obj = e.aposta === vencedor;
        break;
      case 'arqueiro':
        obj = !!e.apontado && e.cartas[e.apontado]?.papel === 'alvo';
        break;
      case 'alvo':
        obj = e.apontado !== id;
        break;
      case 'isco':
        obj = e.apontado === id;
        break;
      case 'batata':
        obj = e.batata !== id;
        break;
    }
    let p = 0;
    let g: boolean;
    if (eq === null) {
      g = !!obj;
      if (g) p += PONTOS_NEUTRO;
    } else {
      g = ganhaEquipa;
      if (ganhaEquipa) p += PONTOS_EQUIPA;
      if (ganhaEquipa && (c.papel === 'rei' || c.papel === 'dragao')) p += PONTOS_CHEFE;
      // 🔵🔴: o objetivo do papel conta se a equipa também ganhou; Escudeiro/Domador só o objetivo próprio
      const precisaEquipa = c.papel !== 'escudeiro' && c.papel !== 'domador';
      if (obj && (!precisaEquipa || ganhaEquipa)) p += PONTOS_EXTRA;
    }
    // quem tiver a batata no fim perde
    if (e.batata === id) {
      g = false;
      p = 0;
    }
    ganhou[id] = g;
    pontos[id] += p;
  }
  return irPara({ ...e, vencedor, ganhou, pontos }, 'fim', 0, agora);
}

function tempoAcabou(e: EstadoRei, agora: number): EstadoRei {
  switch (e.fase) {
    case 'lider':
      return novaRonda(e, agora);
    case 'ronda':
      return fimRonda(e, agora);
    case 'troca':
      return depoisTroca(e, agora);
    case 'aposta':
      return acabar(e, agora);
    default:
      return e;
  }
}

export const pausadoRei = (e: EstadoRei) => e.pausaRestante !== null;
const trocaDe = (e: EstadoRei, id: string) => e.trocas.find((t) => t.de === id || t.para === id);
const semTroca = (e: EstadoRei, id: string): Troca[] => e.trocas.filter((t) => t.de !== id && t.para !== id);

/** todos os ligados fizeram x? */
const todos = (e: EstadoRei, lista: string[]) => ativos(e).every((id) => lista.includes(id));

export function reduzRei(e: EstadoRei, a: AcaoRei, agora: number): EstadoRei {
  if (e.fase === 'fim' && a.tipo !== 'ligados') return e;
  if (a.tipo === 'ligados') {
    let s: EstadoRei = { ...e, ligados: a.ids };
    if (s.fase === 'fim') return s;
    s = pausaPorFalta(s, quantosLigados(s.participantes, a.ids) < MIN_LIGADOS, agora);
    // quem saiu deixa de estar à espera para "Pronto"/"OK"
    if (s.fase === 'ir' && s.prontos.length && todos(s, s.prontos)) return irPara({ ...s, prontos: [] }, 'carta', 0, agora);
    if (s.fase === 'carta' && s.prontos.length && todos(s, s.prontos)) return sortearLideres({ ...s, prontos: [] }, agora);
    return s;
  }
  if (a.tipo === 'tick') {
    if (pausadoRei(e) || e.fase === 'ir' || e.fase === 'carta' || agora < e.terminaEm) return e;
    return tempoAcabou(e, agora);
  }
  if (pausadoRei(e) || !e.participantes.includes(a.id)) return e;
  const k = e.sala[a.id];
  const mesmaSala = (x: string) => e.participantes.includes(x) && e.sala[x] === k;
  const s0 = { ...e, seq: e.seq + 1 };
  switch (a.tipo) {
    case 'rd_avancar':
      // a sala só deixa o líder; avança sem esperar por quem não carregou
      if (e.fase === 'ir') return irPara({ ...s0, prontos: [] }, 'carta', 0, agora);
      if (e.fase === 'carta') return sortearLideres({ ...s0, prontos: [] }, agora);
      return e;
    case 'rd_pronto': {
      if (e.fase !== 'ir' || e.prontos.includes(a.id)) return e;
      const s = { ...s0, prontos: [...e.prontos, a.id] };
      return todos(s, s.prontos) ? irPara({ ...s, prontos: [] }, 'carta', 0, agora) : s;
    }
    case 'rd_ok': {
      if (e.fase !== 'carta' || e.prontos.includes(a.id)) return e;
      const s = { ...s0, prontos: [...e.prontos, a.id] };
      return todos(s, s.prontos) ? sortearLideres({ ...s, prontos: [] }, agora) : s;
    }
    case 'rd_pedir':
      if (e.fase !== 'ronda' || e.batata !== a.id || a.alvo === a.id || !mesmaSala(a.alvo) || trocaDe(e, a.id) || trocaDe(e, a.alvo)) return e;
      return { ...s0, trocas: [...e.trocas, { de: a.id, para: a.alvo }] };
    case 'rd_responder': {
      // quem tem a 🥔 mostrou a carta e pede para passar: aceitar = fica com a batata
      const t = e.trocas.find((x) => x.para === a.id);
      if (e.fase !== 'ronda' || !t) return e;
      return { ...s0, batata: a.aceita && e.batata === t.de ? t.para : e.batata, trocas: semTroca(e, a.id) };
    }
    case 'rd_fechar':
      if (!trocaDe(e, a.id)) return e;
      return { ...s0, trocas: semTroca(e, a.id) };
    case 'rd_votacao': {
      if (e.fase !== 'ronda' || e.votacaoUsada[k] || e.votacao[k]) return e;
      const votacao = [...e.votacao] as EstadoRei['votacao'];
      const usada = [...e.votacaoUsada] as EstadoRei['votacaoUsada'];
      votacao[k] = {};
      usada[k] = true;
      return { ...s0, votacao, votacaoUsada: usada };
    }
    case 'rd_votar': {
      const v = e.votacao[k];
      if (e.fase !== 'ronda' || !v || !mesmaSala(a.alvo)) return e;
      const votos = { ...v, [a.id]: a.alvo };
      const votacao = [...e.votacao] as EstadoRei['votacao'];
      // maioria dos que estão ligados na sala (quem saiu não bloqueia a votação)
      const n = membros(e, k).filter((x) => e.ligados.includes(x)).length;
      const ganha = membros(e, k).find((c) => Object.values(votos).filter((x) => x === c).length * 2 > n);
      if (!ganha) {
        votacao[k] = votos;
        return { ...s0, votacao };
      }
      votacao[k] = null;
      const lideres = [...e.lideres] as [string, string];
      lideres[k] = ganha;
      const refens = [...e.refens] as EstadoRei['refens'];
      refens[k] = null;
      return { ...s0, votacao, lideres, refens, novoLider: { sala: k, id: ganha } };
    }
    case 'rd_refens': {
      if (e.fase !== 'ronda' || e.lideres[k] !== a.id || agora < e.terminaEm - T_REFENS * 1000) return e;
      const ids = [...new Set(a.ids)];
      const cand = candidatosRefem(e, k);
      if (ids.length !== nRefens(e, k) || !ids.every((x) => cand.includes(x))) return e;
      const refens = [...e.refens] as EstadoRei['refens'];
      refens[k] = ids;
      return { ...s0, refens };
    }
    case 'rd_cheguei': {
      if (e.fase !== 'troca' || !e.mudando.includes(a.id) || e.chegaram.includes(a.id)) return e;
      const s = { ...s0, chegaram: [...e.chegaram, a.id] };
      const faltam = s.mudando.filter((id) => s.ligados.includes(id) && !s.chegaram.includes(id));
      return faltam.length ? s : depoisTroca(s, agora);
    }
    case 'rd_apostar': {
      if (e.fase !== 'aposta' || e.cartas[a.id].papel !== 'apostador' || e.aposta) return e;
      return fimAposta({ ...s0, aposta: a.equipa }, agora);
    }
    case 'rd_apontar': {
      if (e.fase !== 'aposta' || e.cartas[a.id].papel !== 'arqueiro' || e.apontado || a.alvo === a.id || !e.participantes.includes(a.alvo)) return e;
      return fimAposta({ ...s0, apontado: a.alvo }, agora);
    }
  }
  return e;
}

/** acaba mais cedo quando o Apostador e o Arqueiro (os que existem) já escolheram */
function fimAposta(e: EstadoRei, agora: number): EstadoRei {
  const tem = (p: PapelR) => e.participantes.some((id) => e.cartas[id].papel === p);
  if ((!tem('apostador') || e.aposta) && (!tem('arqueiro') || e.apontado)) return acabar(e, agora);
  return e;
}

/* ---------- vistas ---------- */

export interface VistaRei {
  def: DefRei;
  fase: FaseR;
  terminaEm: number;
  restante: number | null;
  participantes: string[];
  audiencia: string[];
  salas: [string[], string[]];
  lideres: [string, string];
  ronda: number;
  rondas: number;
  refensPorLider: number;
  prontos: string[];
  mudando: string[];
  chegaram: string[];
  /** votação aberta por sala: votos por candidato */
  votacao: [Record<string, number> | null, Record<string, number> | null];
  votacaoUsada: [boolean, boolean];
  novoLider: { sala: 0 | 1; id: string } | null;
  seq: number;
  vencedor: 'azul' | 'vermelho' | null;
  /** só no fim */
  cartas: Record<string, CartaR>;
  batata: string | null;
  aposta: 'azul' | 'vermelho' | null;
  apontado: string | null;
  ganhou: Record<string, boolean>;
  pontos: Record<string, number>;
  podio: { id: string; pontos: number; lugar: number }[];
  usadas: string[];
}

export function vistaRei(e: EstadoRei): VistaRei {
  const fim = e.fase === 'fim';
  const contar = (v: Record<string, string> | null) => {
    if (!v) return null;
    const r: Record<string, number> = {};
    Object.values(v).forEach((c) => (r[c] = (r[c] ?? 0) + 1));
    return r;
  };
  return {
    def: e.def,
    fase: e.fase,
    terminaEm: e.terminaEm,
    restante: e.pausaRestante,
    participantes: e.participantes,
    audiencia: e.audiencia,
    salas: [membros(e, 0), membros(e, 1)],
    lideres: e.lideres,
    ronda: e.ronda,
    rondas: e.rondas,
    refensPorLider: e.refensPorLider,
    prontos: e.prontos,
    mudando: e.mudando,
    chegaram: e.chegaram,
    votacao: [contar(e.votacao[0]), contar(e.votacao[1])],
    votacaoUsada: e.votacaoUsada,
    novoLider: e.novoLider,
    seq: e.seq,
    vencedor: e.vencedor,
    cartas: fim ? e.cartas : {},
    batata: fim ? e.batata : null,
    aposta: fim ? e.aposta : null,
    apontado: fim ? e.apontado : null,
    ganhou: fim ? e.ganhou : {},
    pontos: e.pontos,
    podio: podio(e.participantes, e.pontos),
    usadas: e.usadas,
  };
}

export interface PrivadoRei {
  carta: CartaR;
  equipa: 'azul' | 'vermelho' | null;
  batata: boolean;
  /** pedido de troca recebido (de quem) */
  pedido: string | null;
  /** troca que pedi e ainda não foi aceite (a quem) */
  pedi: string | null;
  /** voto na votação de líder */
  voto: string | null;
  /** reféns já escolhidos (só o líder) */
  refens: string[] | null;
  aposta: 'azul' | 'vermelho' | null;
  apontado: string | null;
}

export function privadoRei(e: EstadoRei, id: string): PrivadoRei | null {
  const carta = e.cartas[id];
  if (!carta) return null;
  const t = trocaDe(e, id);
  const k = e.sala[id];
  return {
    carta,
    equipa: equipaDe(carta),
    batata: e.batata === id,
    pedido: t && t.para === id ? t.de : null,
    pedi: t && t.de === id ? t.para : null,
    voto: e.votacao[k]?.[id] ?? null,
    refens: e.lideres[k] === id ? e.refens[k] : null,
    aposta: carta.papel === 'apostador' ? e.aposta : null,
    apontado: carta.papel === 'arqueiro' ? e.apontado : null,
  };
}

/* ---------- saídas a meio (src/core/saidas.ts) ---------- */

/** todos fazem falta: a carta de cada um conta para a meia-noite */
export const importanteRei = (e: EstadoRei, id: string): boolean => e.participantes.includes(id);
/** sem o Rei ou o Dragão o jogo não se decide: só esperar, trocar por um espectador ou acabar */
export const podeSeguirSemRei = (e: EstadoRei, id: string): boolean => !['rei', 'dragao'].includes(e.cartas[id]?.papel ?? '');

/** o líder decidiu seguir sem ele: sai das salas; se era líder de sala, sorteia-se outro */
export function sairRei(e: EstadoRei, id: string): EstadoRei {
  if (!podeSeguirSemRei(e, id) || !e.participantes.includes(id) || e.fase === 'fim') return e;
  const participantes = e.participantes.filter((x) => x !== id);
  const k = e.sala[id];
  const lideres = [...e.lideres] as [string, string];
  if (lideres[k] === id) lideres[k] = baralhar(participantes.filter((x) => e.sala[x] === k), e.seed)[0] ?? '';
  const sem = (l: string[]) => l.filter((x) => x !== id);
  const votacao = e.votacao.map((v) => (v ? Object.fromEntries(Object.entries(v).filter(([q, alvo]) => q !== id && alvo !== id)) : v)) as EstadoRei['votacao'];
  return {
    ...e,
    participantes,
    lideres,
    refens: e.refens.map((x) => (x ? sem(x) : x)) as EstadoRei['refens'],
    votacao,
    prontos: sem(e.prontos),
    mudando: sem(e.mudando),
    chegaram: sem(e.chegaram),
    trocas: e.trocas.filter((t) => t.de !== id && t.para !== id),
    batata: e.batata === id ? null : e.batata,
    seed: e.seed + 1,
    seq: e.seq + 1,
  };
}
