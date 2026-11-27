import { baralhar } from '../../core/ids';
import { CABECAS, CORES, CORPOS, ENCAIXES, LOCOS, MODULOS, PERIGOS, PRECO, type Cabeca, type Corpo, type Loco, type Modulo, type Perigo, type Robo } from './pecas';
import { quadroValido, type Quadro } from './quadro';

/**
 * Ragerob: regras em info/jogos/rinha-de-robos.md. A física corre só no host (a TV ou, sem TV, o telemóvel que tem a sala),
 * que manda o fim do combate (`rr_fim`), as vidas (`rr_vidas`) e, sem TV, os quadros da arena (`rr_quadro`). Este reducer só trata dinheiro, loja, apostas,
 * torneio/liga e quem conduz.
 * Leilão ao vivo (27/11): os 5 módulos ao mesmo tempo, um só relógio, lances públicos; quem lidera não pode prometer mais do que tem
 * (soma dos lances em que lidera ≤ carteira); o dinheiro só sai ao bater o martelo.
 * Apostas por pódio (25/11, modo normal): escolhe-se um robô, sem pôr dinheiro; paga-se dinheiro novo pelo lugar dele.
 * Decisões do utilizador (17/11): loja privada 30 s, apostas 20 s, instalar 20 s, combate 90 s; depois a arena encolhe
 * a arder até sobrar um (ou nenhum); colocação = ordem de KO (KO ao mesmo tempo = empate); Pilotos: cada um escolhe
 * carroçaria + locomoção + cabeça (sem escolha = sorteio); bots e quem não conduz = IA; 9–10 pilotos = 12 robôs.
 */

export type Modo = 'normal' | 'pilotos';
export type Loja = 'leilao' | 'privada';
export type FaseRR = 'montar' | 'loja' | 'aposta' | 'instalar' | 'combate' | 'resultado' | 'fim';

export interface DefRagerob {
  modo: Modo;
  /** modo normal: 2 (4 robôs), 3 (8) ou 4 (16) */
  rondas: number;
  /** modo Pilotos (liga) */
  rondasPilotos: number;
  loja: Loja;
}

export const DEF_PADRAO_RAGEROB: DefRagerob = { modo: 'normal', rondas: 3, rondasPilotos: 4, loja: 'leilao' };
export const OPCOES_RAGEROB = { rondas: [2, 3, 4], rondasPilotos: [2, 3, 4, 5, 6] };
export const MIN_JOGADORES = 2;
export const MAX_JOGADORES = 10;
export const CAPITAL = 500;
export const CAPITAL_PILOTOS = 1500;
export const PRECO_CONTROLO = 100;
export const T_CONTROLO = 15;
/** loja privada */
export const T_LOJA = 30;
/** leilão (os 5 ao mesmo tempo): tempo total, mínimo garantido depois de um lance, martelo */
export const T_LEILAO = 30;
export const T_LANCE_EXTRA = 5;
export const T_MARTELO = 2;
export const PASSOS_LANCE = [50, 100];
export const T_APOSTA = 20;
export const T_INSTALAR = 20;
export const T_MONTAR = 20;
/** depois disto a arena encolhe a arder (a TV acaba o combate quando sobra 1) */
export const T_COMBATE = 90;
/** rede de segurança: se a TV não mandar o fim, acaba pela vida */
export const T_COMBATE_MAX = 200;
export const T_RESULTADO = 8;
export const ITENS_LOJA = 5;
/** Pilotos: dinheiro por combate */
export const P_PARTICIPAR = 200;
export const P_KO = 100;
export const TETO_DANO = 300;
export const P_COLOCACAO = [300, 200, 100, 0];
export const PONTOS = [3, 2, 1, 0];
/** modo normal: prémio de quem escolheu o robô, pelo lugar dele (1.º, 2.º…); empatados recebem o do melhor lugar do grupo */
export const PREMIOS = [250, 150, 100, 50];
export const PREMIOS_FINAL = [400, 150];
export const P_RECUPERACAO = 100;
export const TIPOS_RAGEROB = ['rr_montar', 'rr_lance', 'rr_comprar', 'rr_apostar', 'rr_instalar', 'rr_pronto', 'rr_controlar', 'rr_conduzir', 'rr_vidas', 'rr_quadro', 'rr_fim'];
/** só o host (a TV ou, sem TV, o telemóvel que tem a sala) as manda */
export const SO_TV_RAGEROB = ['rr_vidas', 'rr_quadro', 'rr_fim'];

export interface Comando {
  /** 1 = frente, −1 = trás */
  f: number;
  /** 1 = rodar para a direita */
  r: number;
  em: number;
}

export type AcaoRagerob =
  | { tipo: 'rr_montar'; id: string; corpo: Corpo; loco: Loco; cabeca: Cabeca }
  /** leilão: `valor` absoluto (dois toques ao mesmo tempo nunca fazem pagar mais do que se viu) */
  | { tipo: 'rr_lance'; id: string; item: number; valor: number }
  | { tipo: 'rr_comprar'; id: string; item: number }
  /** escolher o robô (pode mudar até o tempo acabar) */
  | { tipo: 'rr_apostar'; id: string; robo: string }
  | { tipo: 'rr_instalar'; id: string; inv: number; encaixe: number }
  | { tipo: 'rr_pronto'; id: string }
  | { tipo: 'rr_controlar'; id: string }
  | { tipo: 'rr_conduzir'; id: string; f: number; r: number }
  | { tipo: 'rr_vidas'; id: string; vidas: Record<string, number> }
  /** sem TV: a arena num instante, para os telemóveis a desenharem (src/jogos/ragerob/quadro.ts) */
  | { tipo: 'rr_quadro'; id: string; q: Quadro }
  /** ordem = grupos por colocação (o 1.º grupo é o vencedor; KO ao mesmo tempo = mesmo grupo) */
  | { tipo: 'rr_fim'; id: string; ordem: string[][]; dano: Record<string, number>; kos: Record<string, number> }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'tick' };

/** os 5 módulos em palco: quem lidera cada um (id = jogador ou, nos Pilotos, o robô da IA) */
export interface Leilao {
  lances: ({ id: string; valor: number } | null)[];
  /** o martelo bateu: mostra-se quem levou */
  martelo: boolean;
}

export interface Combate {
  n: number;
  robos: string[];
  perigos: Perigo[];
  seed: number;
  inicio: number;
  vidas: Record<string, number>;
  /** modo normal: quem conduz cada robô agora */
  condutor: Record<string, { id: string; ate: number }>;
  fila: Record<string, string[]>;
  comandos: Record<string, Comando>;
  /** sem TV: o último quadro da arena mandado pelo host */
  quadro?: Quadro;
}

export interface Resultado {
  ordem: string[][];
  /** robô vencedor (null = KO de todos ao mesmo tempo) */
  vencedor: string | null;
  /** dinheiro ganho (positivo) ou perdido (negativo) por jogador neste combate */
  ganhos: Record<string, number>;
  dano: Record<string, number>;
  kos: Record<string, number>;
  /** normal: quem passa à ronda seguinte */
  passam: string[];
}

export interface EstadoRagerob {
  def: DefRagerob;
  fase: FaseRR;
  terminaEm: number;
  pausaRestante: number | null;
  participantes: string[];
  audiencia: string[];
  ligados: string[];
  usadas: string[];
  seed: number;
  ronda: number;
  rondas: number;
  robos: Robo[];
  /** normal: robôs ainda no torneio */
  vivos: string[];
  /** combates da ronda (grupos de robôs) */
  grupos: string[][];
  combateIdx: number;
  combate: Combate | null;
  /** dinheiro por jogador (Pilotos: também os robôs da IA, pelo id do robô) */
  carteira: Record<string, number>;
  inventario: Record<string, Modulo[]>;
  /** leilão: os 5 da ronda; loja privada: 5 por jogador */
  loja: Modulo[];
  lojaPrivada: Record<string, (Modulo | null)[]>;
  leilao: Leilao | null;
  enviaram: string[];
  /** quem levou cada módulo já leiloado (null = ninguém) */
  vendidos: ({ id: string; valor: number } | null)[];
  /** normal: jogador → robô que escolheu neste combate */
  apostas: Record<string, string>;
  prontos: string[];
  montados: string[];
  resultado: Resultado | null;
  /** Pilotos */
  pontos: Record<string, number>;
  danoTotal: Record<string, number>;
  campeao: string | null;
}

const rnd = (seed: number) => baralhar(Array.from({ length: 1000 }, (_, i) => i), seed)[0] / 1000;
const escolhe = <T>(lista: T[], seed: number): T => baralhar(lista, seed)[0];

function novoRobo(id: string, cor: number, seed: number, dono?: string): Robo {
  const corpo = escolhe(CORPOS, seed + 1);
  return { id, corpo, loco: escolhe(LOCOS, seed + 2), cabeca: escolhe(CABECAS, seed + 3), cor, modulos: Array(ENCAIXES[corpo]).fill(null), ...(dono ? { dono } : {}) };
}

export function nRobos(def: DefRagerob, jogadores: number): number {
  if (def.modo === 'pilotos') return jogadores > 8 ? 12 : 8;
  return 2 ** Math.max(2, Math.min(4, def.rondas));
}

export function novoRagerob(jogadores: string[], def: DefRagerob, agora: number, usadas: string[] = [], seed = agora): EstadoRagerob {
  const pilotos = def.modo === 'pilotos';
  const n = nRobos(def, jogadores.length);
  const cores = baralhar(CORES.map((_, i) => i), seed + 5);
  const robos: Robo[] = Array.from({ length: n }, (_, i) => novoRobo('r' + (i + 1), cores[i], seed + 100 * i, pilotos ? jogadores[i] : undefined));
  const carteira: Record<string, number> = {};
  for (const j of jogadores) carteira[j] = pilotos ? CAPITAL_PILOTOS : CAPITAL;
  if (pilotos) for (const r of robos) if (!r.dono) carteira[r.id] = CAPITAL_PILOTOS;
  const base: EstadoRagerob = {
    def, fase: pilotos ? 'montar' : 'loja', terminaEm: agora + (pilotos ? T_MONTAR : T_LOJA) * 1000, pausaRestante: null,
    participantes: [...jogadores], audiencia: [], ligados: [...jogadores], usadas, seed,
    ronda: 1, rondas: pilotos ? def.rondasPilotos : Math.max(2, Math.min(4, def.rondas)),
    robos, vivos: robos.map((r) => r.id), grupos: [], combateIdx: 0, combate: null,
    carteira, inventario: Object.fromEntries(jogadores.map((j) => [j, []])), loja: [], lojaPrivada: {}, leilao: null, enviaram: [], vendidos: [],
    apostas: {}, prontos: [], montados: [], resultado: null,
    pontos: Object.fromEntries(robos.map((r) => [r.id, 0])), danoTotal: Object.fromEntries(robos.map((r) => [r.id, 0])), campeao: null,
  };
  const g = { ...base, grupos: gruposDaRonda(base) };
  return pilotos ? g : abrirLoja(g, agora);
}

/** grupos da ronda: normal = os vivos em grupos de 4 (final 1 contra 1); Pilotos = todos, sorteados em grupos de 4 */
function gruposDaRonda(s: EstadoRagerob): string[][] {
  const lista = baralhar(s.vivos, s.seed + 31 * s.ronda);
  const tam = lista.length <= 2 ? 2 : 4;
  const g: string[][] = [];
  for (let i = 0; i < lista.length; i += tam) g.push(lista.slice(i, i + tam));
  return g;
}

/** quem pode gastar: participante com dinheiro (para escolher robô não é preciso) */
export function ativos(s: Pick<EstadoRagerob, 'participantes' | 'carteira'>): string[] {
  return s.participantes.filter((j) => (s.carteira[j] ?? 0) > 0);
}

/** robô do jogador no combate atual (normal: aquele em que apostou; Pilotos: o seu) */
export function roboDe(s: Pick<EstadoRagerob, 'def' | 'robos' | 'apostas'>, id: string): string | null {
  if (s.def.modo === 'pilotos') return s.robos.find((r) => r.dono === id)?.id ?? null;
  return s.apostas[id] ?? null;
}

function abrirLoja(s: EstadoRagerob, agora: number): EstadoRagerob {
  const sorteio = (k: number) => baralhar(MODULOS, s.seed + 1000 * s.ronda + k).slice(0, ITENS_LOJA);
  const privada = s.def.loja === 'privada';
  const r: EstadoRagerob = {
    ...s, fase: 'loja', terminaEm: agora + T_LOJA * 1000, leilao: null, enviaram: [], vendidos: [], prontos: [],
    loja: privada ? [] : sorteio(0),
    lojaPrivada: privada ? Object.fromEntries(s.participantes.map((j, i) => [j, sorteio(i + 1)])) : {},
  };
  return privada ? r : abrirLeilao(r, agora);
}

/** até quanto a IA (robôs sem dono no modo Pilotos) licita neste módulo: um módulo ao calhas por ronda, se couber e tiver encaixe livre */
function limiteIa(s: EstadoRagerob, i: number, item: number): number {
  const robo = s.robos[i];
  if (s.def.modo !== 'pilotos' || robo.dono || !robo.modulos.includes(null)) return 0;
  if (Math.floor(rnd(s.seed + 7 * s.ronda + i) * s.loja.length) !== item) return 0;
  return Math.min(s.carteira[robo.id] ?? 0, PRECO[s.loja[item]] + 50 * Math.floor(rnd(s.seed + 13 * s.ronda + i) * 5));
}

/** põe os 5 em palco ao mesmo tempo (se ninguém puder pagar nenhum, fecha logo a loja) */
function abrirLeilao(s: EstadoRagerob, agora: number): EstadoRagerob {
  const alguem = (n: number) => s.participantes.some((j) => (s.carteira[j] ?? 0) >= PRECO[s.loja[n]]) || s.robos.some((_, i) => limiteIa(s, i, n) >= PRECO[s.loja[n]]);
  if (!s.loja.some((_, k) => alguem(k))) return fecharLoja({ ...s, vendidos: s.loja.map(() => null) }, agora);
  return { ...s, leilao: { lances: s.loja.map(() => null), martelo: false }, terminaEm: agora + T_LEILAO * 1000 };
}

/** o menor lance que se aceita agora neste módulo */
export function lanceMinimo(s: Pick<EstadoRagerob, 'leilao' | 'loja'>, item: number): number {
  const l = s.leilao!.lances[item];
  return l ? l.valor + 1 : PRECO[s.loja[item]];
}

/** quanto `id` já prometeu nos módulos em que lidera (menos `fora`) */
export function prometido(s: Pick<EstadoRagerob, 'leilao'>, id: string, fora = -1): number {
  return (s.leilao?.lances ?? []).reduce((t, l, k) => (l?.id === id && k !== fora ? t + l.valor : t), 0);
}

function darLance(s: EstadoRagerob, id: string, item: number, valor: number, agora: number): EstadoRagerob {
  const l = s.leilao;
  if (!l || l.martelo || !Number.isInteger(item) || item < 0 || item >= l.lances.length || l.lances[item]?.id === id) return s;
  if (!Number.isInteger(valor) || valor < lanceMinimo(s, item) || valor + prometido(s, id, item) > (s.carteira[id] ?? 0)) return s;
  return { ...s, leilao: { ...l, lances: l.lances.map((x, k) => (k === item ? { id, valor } : x)) }, terminaEm: Math.max(s.terminaEm, agora + T_LANCE_EXTRA * 1000) };
}

/** a IA dá lances ao vivo: espera um bocado (pelo tempo que falta, para a pausa não a baralhar) e cobre até ao limite */
function lanceIa(s: EstadoRagerob, agora: number): EstadoRagerob {
  let r = s;
  for (let item = 0; item < r.loja.length; item++) {
    const l = r.leilao!.lances[item];
    const valor = l ? l.valor + PASSOS_LANCE[0] : PRECO[r.loja[item]];
    const quando = (l ? 1500 : 5000) + 3000 * rnd(r.seed + 19 * r.ronda + 5 * item + valor);
    if (r.terminaEm - agora > quando) continue;
    const querem = r.robos.filter((x, i) => x.id !== l?.id && limiteIa(r, i, item) >= valor).map((x) => x.id);
    if (querem.length) r = darLance(r, escolhe(querem, r.seed + 23 * r.ronda + item + valor), item, valor, agora);
  }
  return r;
}

/** bate o martelo nos 5: só agora sai o dinheiro */
function baterMartelo(s: EstadoRagerob, agora: number): EstadoRagerob {
  const l = s.leilao!;
  let r: EstadoRagerob = { ...s, leilao: { ...l, martelo: true }, vendidos: [...l.lances], terminaEm: agora + T_MARTELO * 1000 };
  l.lances.forEach((x, k) => {
    if (!x) return;
    const m = s.loja[k];
    r = gastar(r, x.id, x.valor);
    const robo = r.robos.find((y) => y.id === x.id && !y.dono);
    // a IA instala logo no 1.º encaixe livre
    if (robo && !r.participantes.includes(x.id)) {
      if (robo.modulos.includes(null)) r = instalarNoRobo(r, x.id, m, robo.modulos.indexOf(null));
    } else r = { ...r, inventario: { ...r.inventario, [x.id]: [...(r.inventario[x.id] ?? []), m] } };
  });
  return r;
}

/** o dinheiro gasto some (o que entra é novo) */
function gastar(s: EstadoRagerob, id: string, valor: number): EstadoRagerob {
  return { ...s, carteira: { ...s.carteira, [id]: (s.carteira[id] ?? 0) - valor } };
}

function instalarNoRobo(s: EstadoRagerob, roboId: string, m: Modulo, encaixe: number): EstadoRagerob {
  return { ...s, robos: s.robos.map((r) => (r.id === roboId ? { ...r, modulos: r.modulos.map((x, k) => (k === encaixe ? m : x)) } : r)) };
}

function fecharLoja(s: EstadoRagerob, agora: number): EstadoRagerob {
  const r = { ...s, leilao: null };
  return s.def.modo === 'pilotos' ? abrirInstalar(r, agora) : abrirAposta(r, agora);
}

function abrirAposta(s: EstadoRagerob, agora: number): EstadoRagerob {
  return { ...s, fase: 'aposta', terminaEm: agora + T_APOSTA * 1000, apostas: {}, enviaram: [], resultado: null };
}

/** quem tem algo para instalar agora */
function instaladores(s: EstadoRagerob): string[] {
  return s.participantes.filter((j) => (s.inventario[j]?.length ?? 0) > 0 && roboDe(s, j) && grupoAtual(s).includes(roboDe(s, j)!));
}

export function grupoAtual(s: EstadoRagerob): string[] {
  if (s.def.modo === 'pilotos' && (s.fase === 'loja' || s.fase === 'instalar' || s.fase === 'montar')) return s.robos.map((r) => r.id);
  return s.grupos[s.combateIdx] ?? [];
}

function abrirInstalar(s: EstadoRagerob, agora: number): EstadoRagerob {
  const r = { ...s, fase: 'instalar' as const, terminaEm: agora + T_INSTALAR * 1000, prontos: [] };
  // sem ninguém com módulos para instalar: salta (menos toques)
  return instaladores(r).length ? r : abrirCombate(r, agora);
}

function abrirCombate(s: EstadoRagerob, agora: number): EstadoRagerob {
  const robos = s.grupos[s.combateIdx];
  const n = 3 + Math.floor(rnd(s.seed + 41 * s.ronda + s.combateIdx) * 2);
  const perigos = baralhar(PERIGOS, s.seed + 43 * s.ronda + s.combateIdx).slice(0, n);
  const combate: Combate = {
    n: s.combateIdx, robos, perigos, seed: (s.seed + 97 * s.ronda + s.combateIdx) >>> 0, inicio: agora,
    vidas: Object.fromEntries(robos.map((r) => [r, 100])), condutor: {}, fila: {}, comandos: {},
  };
  return { ...s, fase: 'combate', terminaEm: agora + T_COMBATE * 1000, combate, resultado: null };
}

/** prémios por lugar deste combate (2 robôs = final) */
export const premiosDe = (n: number) => (n <= 2 ? PREMIOS_FINAL : PREMIOS);

/** posição (0 = 1.º) de cada robô, com empates */
export function posicoes(ordem: string[][]): Record<string, number> {
  const p: Record<string, number> = {};
  let k = 0;
  for (const g of ordem) {
    for (const r of g) p[r] = k;
    k += g.length;
  }
  return p;
}

function somar(c: Record<string, number>, g: Record<string, number>): Record<string, number> {
  const r = { ...c };
  for (const [id, v] of Object.entries(g)) r[id] = (r[id] ?? 0) + v;
  return r;
}

/** ordena os robôs de um combate (ordem de KO; empates pelo dano causado, depois pela ordem) */
function achatar(ordem: string[][], dano: Record<string, number>): string[] {
  return ordem.flatMap((g) => [...g].sort((a, b) => (dano[b] ?? 0) - (dano[a] ?? 0) || a.localeCompare(b)));
}

function fecharCombate(s: EstadoRagerob, ordemTv: string[][], dano: Record<string, number>, kos: Record<string, number>, agora: number): EstadoRagerob {
  const c = s.combate!;
  // só robôs deste combate, cada um uma vez; os que faltam ficam em último
  const vistos = new Set<string>();
  const ordem = ordemTv.map((g) => g.filter((r) => c.robos.includes(r) && !vistos.has(r) && vistos.add(r))).filter((g) => g.length);
  const faltam = c.robos.filter((r) => !vistos.has(r));
  if (faltam.length) ordem.push(faltam);
  const d: Record<string, number> = Object.fromEntries(c.robos.map((r) => [r, Math.max(0, Math.round(dano[r] ?? 0))]));
  const k: Record<string, number> = Object.fromEntries(c.robos.map((r) => [r, Math.max(0, Math.round(kos[r] ?? 0))]));
  const vencedor = ordem[0].length === 1 ? ordem[0][0] : null;
  const pos = posicoes(ordem);
  let r: EstadoRagerob = { ...s, combate: null, danoTotal: somar(s.danoTotal, d) };
  const ganhos: Record<string, number> = {};
  let passam: string[] = [];
  if (s.def.modo === 'normal') {
    for (const [j, robo] of Object.entries(s.apostas)) {
      const premio = premiosDe(c.robos.length)[pos[robo]] ?? 0;
      if (premio) ganhos[j] = premio;
    }
    r = { ...r, carteira: somar(r.carteira, ganhos) };
    passam = achatar(ordem, d).slice(0, c.robos.length <= 2 ? 1 : 2);
  } else {
    const pts: Record<string, number> = {};
    const dinheiro: Record<string, number> = {};
    for (const robo of c.robos) {
      pts[robo] = PONTOS[pos[robo]] ?? 0;
      const quem = s.robos.find((x) => x.id === robo)?.dono ?? robo;
      dinheiro[quem] = P_PARTICIPAR + Math.min(d[robo], TETO_DANO) + P_KO * k[robo] + (P_COLOCACAO[pos[robo]] ?? 0);
      ganhos[quem] = dinheiro[quem];
    }
    r = { ...r, pontos: somar(r.pontos, pts), carteira: somar(r.carteira, dinheiro) };
  }
  const resultado: Resultado = { ordem, vencedor, ganhos, dano: d, kos: k, passam };
  return { ...r, resultado, fase: 'resultado', terminaEm: agora + T_RESULTADO * 1000 };
}

/** tabela do modo Pilotos: pontos, desempate pelo dano total */
export function tabela(s: Pick<EstadoRagerob, 'robos' | 'pontos' | 'danoTotal'>): string[] {
  return s.robos.map((r) => r.id).sort((a, b) => (s.pontos[b] ?? 0) - (s.pontos[a] ?? 0) || (s.danoTotal[b] ?? 0) - (s.danoTotal[a] ?? 0) || a.localeCompare(b));
}

function depoisResultado(s: EstadoRagerob, agora: number): EstadoRagerob {
  const res = s.resultado!;
  const pilotos = s.def.modo === 'pilotos';
  let r = s;
  if (!pilotos) {
    const grupo = s.grupos[s.combateIdx];
    r = { ...r, vivos: r.vivos.filter((v) => !grupo.includes(v) || res.passam.includes(v)) };
  }
  if (r.combateIdx + 1 < r.grupos.length) {
    r = { ...r, combateIdx: r.combateIdx + 1 };
    return pilotos ? abrirCombate(r, agora) : abrirAposta(r, agora);
  }
  // fim da ronda
  if (pilotos) {
    // o último da tabela recebe a recuperação
    const t = tabela(r);
    const ultimo = t[t.length - 1];
    const ultimos = t.filter((id) => r.pontos[id] === r.pontos[ultimo] && r.danoTotal[id] === r.danoTotal[ultimo]);
    const bonus = Object.fromEntries(ultimos.map((id) => [r.robos.find((x) => x.id === id)?.dono ?? id, P_RECUPERACAO]));
    r = { ...r, carteira: somar(r.carteira, bonus) };
  }
  const acabou = pilotos ? r.ronda >= r.rondas : r.vivos.length <= 1;
  if (acabou) return acabar(r, agora);
  r = { ...r, ronda: r.ronda + 1, combateIdx: 0 };
  r = { ...r, grupos: gruposDaRonda(r) };
  return abrirLoja(r, agora);
}

function acabar(s: EstadoRagerob, agora: number): EstadoRagerob {
  let r = s;
  if (s.def.modo === 'normal') {
    r = { ...r, campeao: s.vivos[0] ?? s.resultado?.passam[0] ?? null };
  } else r = { ...r, campeao: tabela(r)[0] };
  return { ...r, fase: 'fim', terminaEm: agora };
}

/** classificação final dos jogadores (normal: dinheiro; Pilotos: pontos do robô de cada um) */
export function classificacao(s: Pick<EstadoRagerob, 'def' | 'participantes' | 'carteira' | 'robos' | 'pontos' | 'danoTotal'>): { id: string; valor: number }[] {
  if (s.def.modo === 'normal') return s.participantes.map((id) => ({ id, valor: s.carteira[id] ?? 0 })).sort((a, b) => b.valor - a.valor);
  const t = tabela(s);
  return s.participantes
    .map((id) => ({ id, robo: s.robos.find((r) => r.dono === id)?.id ?? '' }))
    .sort((a, b) => t.indexOf(a.robo) - t.indexOf(b.robo))
    .map(({ id, robo }) => ({ id, valor: s.pontos[robo] ?? 0 }));
}

function fecharMontar(s: EstadoRagerob, agora: number): EstadoRagerob {
  return abrirLoja({ ...s, montados: [] }, agora);
}

function avancar(s: EstadoRagerob, agora: number): EstadoRagerob {
  switch (s.fase) {
    case 'montar':
      return fecharMontar(s, agora);
    case 'loja':
      if (s.leilao) return s.leilao.martelo ? fecharLoja(s, agora) : baterMartelo(s, agora);
      return fecharLoja(s, agora);
    case 'aposta':
      return abrirInstalar(s, agora);
    case 'instalar':
      return abrirCombate(s, agora);
    case 'combate': {
      // a TV não acabou o combate: ordena pela vida que tem
      const v = s.combate!.vidas;
      const grupos = new Map<number, string[]>();
      for (const r of s.combate!.robos) grupos.set(v[r] ?? 0, [...(grupos.get(v[r] ?? 0) ?? []), r]);
      const ordem = [...grupos.entries()].sort((a, b) => b[0] - a[0]).map(([, g]) => g);
      return fecharCombate(s, ordem, {}, {}, agora);
    }
    case 'resultado':
      return depoisResultado(s, agora);
    default:
      return s;
  }
}

/** quem tem de agir para a fase acabar mais cedo */
function faltam(s: EstadoRagerob): string[] {
  const lig = new Set(s.ligados);
  if (s.fase === 'montar') return s.participantes.filter((j) => lig.has(j) && !s.montados.includes(j));
  // o leilão anda só pelo tempo; nas apostas pode-se mudar até o tempo acabar
  if ((s.fase === 'loja' && s.leilao) || s.fase === 'aposta') return ['∞'];
  if (s.fase === 'loja') return ativos(s).filter((j) => lig.has(j) && !s.enviaram.includes(j));
  if (s.fase === 'instalar') return instaladores(s).filter((j) => lig.has(j) && !s.prontos.includes(j));
  return ['∞'];
}

function talvezAvancar(s: EstadoRagerob, agora: number): EstadoRagerob {
  return faltam(s).length ? s : avancar(s, agora);
}

export function reduzRagerob(s: EstadoRagerob, a: AcaoRagerob, agora: number): EstadoRagerob {
  if (s.fase === 'fim') return a.tipo === 'ligados' ? { ...s, ligados: a.ids } : s;
  switch (a.tipo) {
    case 'tick': {
      if (s.pausaRestante !== null) return s;
      let r = s;
      if (r.fase === 'combate' && r.combate) {
        // controlar (modo normal): passa ao seguinte da fila
        const c = r.combate;
        let mudou = false;
        const condutor = { ...c.condutor };
        const fila = { ...c.fila };
        for (const robo of c.robos) {
          if (condutor[robo] && condutor[robo].ate <= agora) {
            delete condutor[robo];
            mudou = true;
          }
          if (!condutor[robo] && fila[robo]?.length) {
            condutor[robo] = { id: fila[robo][0], ate: agora + T_CONTROLO * 1000 };
            fila[robo] = fila[robo].slice(1);
            mudou = true;
          }
        }
        if (mudou) r = { ...r, combate: { ...c, condutor, fila } };
        if (agora >= c.inicio + T_COMBATE_MAX * 1000) return avancar(r, agora);
        return r;
      }
      if (agora >= r.terminaEm) return avancar(r, agora);
      return r.fase === 'loja' && r.leilao && !r.leilao.martelo && r.def.modo === 'pilotos' ? lanceIa(r, agora) : r;
    }
    case 'ligados': {
      const lig = a.ids.filter((id) => s.participantes.includes(id));
      let r: EstadoRagerob = { ...s, ligados: a.ids };
      // pausa (fora do combate) se ficarem menos de 2 ligados
      const pausa = lig.length < MIN_JOGADORES && s.fase !== 'combate';
      if (pausa && r.pausaRestante === null) r = { ...r, pausaRestante: Math.max(0, r.terminaEm - agora) };
      if (!pausa && r.pausaRestante !== null) r = { ...r, terminaEm: agora + r.pausaRestante, pausaRestante: null };
      return r.pausaRestante === null && s.fase !== 'combate' && s.fase !== 'resultado' ? talvezAvancar(r, agora) : r;
    }
    case 'rr_montar': {
      if (s.fase !== 'montar' || !CORPOS.includes(a.corpo) || !LOCOS.includes(a.loco) || !CABECAS.includes(a.cabeca)) return s;
      const robo = s.robos.find((r) => r.dono === a.id);
      if (!robo) return s;
      const novo: Robo = { ...robo, corpo: a.corpo, loco: a.loco, cabeca: a.cabeca, modulos: Array(ENCAIXES[a.corpo]).fill(null) };
      const r = { ...s, robos: s.robos.map((x) => (x.id === robo.id ? novo : x)), montados: [...new Set([...s.montados, a.id])] };
      return talvezAvancar(r, agora);
    }
    case 'rr_lance':
      if (s.fase !== 'loja' || s.pausaRestante !== null || !s.leilao || !ativos(s).includes(a.id)) return s;
      return darLance(s, a.id, a.item, a.valor, agora);
    case 'rr_comprar': {
      if (s.fase !== 'loja' || s.def.loja !== 'privada') return s;
      const m = s.lojaPrivada[a.id]?.[a.item];
      if (!m || PRECO[m] > (s.carteira[a.id] ?? 0)) return s;
      const r = gastar(s, a.id, PRECO[m]);
      return {
        ...r,
        lojaPrivada: { ...r.lojaPrivada, [a.id]: r.lojaPrivada[a.id].map((x, k) => (k === a.item ? null : x)) },
        inventario: { ...r.inventario, [a.id]: [...(r.inventario[a.id] ?? []), m] },
      };
    }
    case 'rr_pronto': {
      if (s.fase === 'loja' && s.def.loja === 'privada' && ativos(s).includes(a.id)) return talvezAvancar({ ...s, enviaram: [...new Set([...s.enviaram, a.id])] }, agora);
      if (s.fase !== 'instalar') return s;
      return talvezAvancar({ ...s, prontos: [...new Set([...s.prontos, a.id])] }, agora);
    }
    case 'rr_apostar':
      if (s.fase !== 'aposta' || s.def.modo !== 'normal' || s.pausaRestante !== null || !s.participantes.includes(a.id) || s.apostas[a.id] === a.robo || !grupoAtual(s).includes(a.robo)) return s;
      return { ...s, apostas: { ...s.apostas, [a.id]: a.robo } };
    case 'rr_instalar': {
      if (s.fase !== 'instalar') return s;
      const roboId = roboDe(s, a.id);
      const robo = s.robos.find((r) => r.id === roboId);
      const m = s.inventario[a.id]?.[a.inv];
      if (!robo || !m || !grupoAtual(s).includes(robo.id) || a.encaixe < 0 || a.encaixe >= robo.modulos.length) return s;
      // trocar um módulo que já existe custa +50% do preço do novo
      const custo = robo.modulos[a.encaixe] ? Math.ceil(PRECO[m] / 2) : 0;
      if (custo > s.carteira[a.id]) return s;
      let r = custo ? gastar(s, a.id, custo) : s;
      r = instalarNoRobo(r, robo.id, m, a.encaixe);
      return { ...r, inventario: { ...r.inventario, [a.id]: r.inventario[a.id].filter((_, k) => k !== a.inv) } };
    }
    case 'rr_controlar': {
      const c = s.combate;
      if (s.fase !== 'combate' || !c || s.def.modo !== 'normal') return s;
      const robo = s.apostas[a.id];
      if (!robo || !c.robos.includes(robo) || (c.vidas[robo] ?? 0) <= 0 || (s.carteira[a.id] ?? 0) < PRECO_CONTROLO) return s;
      if (c.condutor[robo]?.id === a.id || c.fila[robo]?.includes(a.id)) return s;
      const r = gastar(s, a.id, PRECO_CONTROLO);
      return reduzRagerob({ ...r, combate: { ...c, fila: { ...c.fila, [robo]: [...(c.fila[robo] ?? []), a.id] } } }, { tipo: 'tick' }, agora);
    }
    case 'rr_conduzir': {
      const c = s.combate;
      if (s.fase !== 'combate' || !c) return s;
      const robo = s.def.modo === 'pilotos' ? roboDe(s, a.id) : Object.entries(c.condutor).find(([, x]) => x.id === a.id && x.ate > agora)?.[0];
      if (!robo || !c.robos.includes(robo)) return s;
      const lim = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);
      return { ...s, combate: { ...c, comandos: { ...c.comandos, [robo]: { f: lim(a.f), r: lim(a.r), em: agora } } } };
    }
    case 'rr_vidas': {
      const c = s.combate;
      if (s.fase !== 'combate' || !c) return s;
      const vidas = { ...c.vidas };
      for (const r of c.robos) if (typeof a.vidas[r] === 'number') vidas[r] = Math.max(0, Math.min(100, Math.round(a.vidas[r])));
      return { ...s, combate: { ...c, vidas } };
    }
    case 'rr_quadro': {
      const c = s.combate;
      if (s.fase !== 'combate' || !c || !quadroValido(a.q)) return s;
      return { ...s, combate: { ...c, quadro: a.q } };
    }
    case 'rr_fim':
      if (s.fase !== 'combate' || !s.combate) return s;
      return fecharCombate(s, a.ordem, a.dano, a.kos, agora);
  }
}

export interface VistaRagerob extends Omit<EstadoRagerob, 'seed' | 'usadas'> {
  /** tempo restante quando está em pausa */
  restante: number | null;
}

/** o que vai para os telemóveis: sem a seed */
export function vistaRagerob(s: EstadoRagerob): VistaRagerob {
  const resto: Partial<EstadoRagerob> = { ...s };
  delete resto.seed;
  delete resto.usadas;
  return { ...(resto as Omit<EstadoRagerob, 'seed' | 'usadas'>), restante: s.pausaRestante };
}
