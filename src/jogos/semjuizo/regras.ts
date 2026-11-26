import { baralhar } from '../../core/ids';
import { irPara, pausaPorFalta, podio, quantosLigados, type Podio } from '../../core/jogo';

/** Sem Juízo: regras em info/jogos/sem-juizo.md */

export interface DefSemJuizo {
  provas: 'aleatorias' | 'juri';
}
export const DEF_PADRAO_SEMJUIZO: DefSemJuizo = { provas: 'aleatorias' };

export const MIN_JOGADORES = 3;
export const MAX_JOGADORES = 10;
export const MAO = 5;
export const RONDAS = 3;
export const T_CASO = 10;
export const T_PROVAS = 20;
/** escolher a prova e a ligação (a explicação tem os seus 20 s) */
export const T_ESCOLHER = 15;
export const T_EXPLICAR = 20;
export const T_PROTESTO = 10;
export const T_CONTRA = 10;
export const T_CONTRA_RES = 4;
export const T_TESTEMUNHA = 15;
export const T_JURI = 15;
export const T_JUIZ = 20;
export const T_ESTRELA = 15;
export const T_REVELAR = 12;
export const PONTOS_VOTOS = 100;
export const PONTOS_VEREDITO = 50;
export const PONTOS_ESTRELA = 25;
export const MAX_ESTRELAS = 50;

/** galeria da sala de espera */
export const MAX_FOTOS = 3;
/** WebP de 800 px reduzido a isto (o limite do jogo é 100 KB): várias cabem numa mensagem cifrada do canal */
export const BYTES_FOTO = 35_000;
export const MAX_URL_FOTO = 50_000;
/** fotos da galeria por julgamento (pelo mesmo motivo) */
export const FOTOS_POR_JULGAMENTO = 3;

export interface Txt {
  id: string;
  pt: string;
  en: string;
}
/** `cena`: as peças do desenho (src/jogos/semjuizo/desenhos.tsx) */
export interface Caso extends Txt {
  cena: string[];
}
export interface ProvaNet extends Txt {
  emoji: string;
}
export interface Conteudo {
  casos: Caso[];
  provas: ProvaNet[];
  culpado: Caso[];
  inocente: Caso[];
}

/** uma prova: da net (`busca`) ou da galeria (`foto`, a chave em `fotos`) */
export interface Prova {
  id: string;
  busca: string;
  emoji: string;
  foto?: string;
}
export type Lado = 'reu' | 'acusador';
export interface NaMesa {
  prova: Prova;
  lado: Lado;
  /** posição na mesa a que se liga (null = a primeira) */
  liga: number | null;
  semEstrela?: boolean;
}
export type Poder = 'protesto' | 'contradicao' | 'testemunha';
export type FaseSemJuizo =
  | 'caso'
  | 'provas'
  | 'escolher'
  | 'explicar'
  | 'contra_fala'
  | 'contra_juri'
  | 'contra_juiz'
  | 'contra_res'
  | 'testemunha'
  | 'juri'
  | 'juiz'
  | 'estrela'
  | 'revelar'
  | 'fim';

export interface Resultado {
  culpado: boolean;
  votos: Record<string, boolean>;
  juiz: string | null;
  pesoJuiz: number;
  /** pontos deste julgamento */
  pontos: Record<Lado, number>;
  /** posição na mesa → estrelas */
  estrelas: number[];
  sentenca: Caso;
}

interface Contra {
  quem: Lado;
  a: number;
  b: number;
  falhou?: boolean;
}

export interface EstadoSemJuizo {
  def: DefSemJuizo;
  fase: FaseSemJuizo;
  terminaEm: number;
  pausaRestante: number | null;
  participantes: string[];
  audiencia: string[];
  ligados: string[];
  /** quem o líder deixou para trás */
  fora: string[];
  /** ordem sorteada: os julgamentos são os pares seguidos */
  ordem: string[];
  julgamento: number;
  total: number;
  reu: string;
  acusador: string;
  juiz: string | null;
  juri: string[];
  vezesJuiz: Record<string, number>;
  /** papel que cada um já fez */
  papel: Record<string, Lado>;
  caso: Caso;
  /** por tirar do monte deste julgamento */
  monte: Prova[];
  maos: Record<string, Prova[]>;
  ofertas: Record<string, Prova[]>;
  /** o que cada jurado já deu a cada lado */
  dadas: Record<string, Record<Lado, number>>;
  mesa: NaMesa[];
  usados: Record<Lado, Poder[]>;
  /** tempo que faltava à explicação quando foi interrompida */
  resto: number;
  contra: Contra | null;
  testemunha: string | null;
  votos: Record<string, boolean>;
  estrelas: Record<string, number>;
  resultado: Resultado | null;
  /** pontos por julgamento de cada jogador: vale o melhor */
  ganhos: Record<string, number[]>;
  pontos: Record<string, number>;
  /** a chave da foto → data URL (nunca na vista) */
  fotos: Record<string, string>;
  fotosUsadas: string[];
  conteudo: Conteudo;
  usadas: string[];
  seed: number;
  n: number;
}

export type AcaoSemJuizo =
  | { tipo: 'sj_dar'; id: string; prova: string; lado: Lado }
  | { tipo: 'sj_jogar'; id: string; prova: string; liga: number | null }
  | { tipo: 'sj_protesto'; id: string }
  | { tipo: 'sj_contradicao'; id: string; a: number; b: number }
  | { tipo: 'sj_testemunha'; id: string }
  /** sim = culpado (na contradição: não se safou) */
  | { tipo: 'sj_votar'; id: string; sim: boolean }
  | { tipo: 'sj_estrela'; id: string; i: number }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'tick' };

export const TIPOS_SEMJUIZO = ['sj_dar', 'sj_jogar', 'sj_protesto', 'sj_contradicao', 'sj_testemunha', 'sj_votar', 'sj_estrela'];

const ehBot = (id: string) => id.startsWith('bot-');
export const pausado = (e: EstadoSemJuizo) => e.pausaRestante !== null;
export const ladoDe = (e: Pick<EstadoSemJuizo, 'reu' | 'acusador'>, id: string): Lado | null => (id === e.reu ? 'reu' : id === e.acusador ? 'acusador' : null);
const donoDe = (e: Pick<EstadoSemJuizo, 'reu' | 'acusador'>, l: Lado) => (l === 'reu' ? e.reu : e.acusador);
const outro = (l: Lado): Lado => (l === 'reu' ? 'acusador' : 'reu');

/** quem fala (ou escolhe) agora: na explicação a última prova da mesa, na escolha a seguinte */
export function ladoDaVez(e: Pick<EstadoSemJuizo, 'fase' | 'mesa'>): Lado {
  const i = e.fase === 'escolher' ? e.mesa.length : e.mesa.length - 1;
  return i % 2 === 0 ? 'acusador' : 'reu';
}

/** o juiz vale 2 se o total de votantes for par: nunca há empate */
export const pesoJuiz = (nJuri: number): number => ((nJuri + 1) % 2 === 0 ? 2 : 1);

/** quantas provas cada jurado dá a cada lado */
export const quotaJurado = (nJuri: number): number => Math.max(1, Math.floor(MAO / Math.max(1, nJuri)));

/** cada sorteio usa uma semente nova */
function sorteio<T>(e: EstadoSemJuizo, lista: T[]): [EstadoSemJuizo, T[]] {
  return [{ ...e, n: e.n + 1 }, baralhar(lista, e.seed + e.n * 7919)];
}

export function novoSemJuizo(ids: string[], def: Partial<DefSemJuizo>, agora: number, conteudo: Conteudo, fotos: Record<string, string[]> = {}, usadas: string[] = []): EstadoSemJuizo {
  const seed = (agora ^ (ids.length * 2654435761)) >>> 0;
  const lista: Record<string, string> = {};
  for (const id of ids) (fotos[id] ?? []).forEach((url, i) => (lista[`${id}/${i}`] = url));
  const e: EstadoSemJuizo = {
    def: { ...DEF_PADRAO_SEMJUIZO, ...def },
    fase: 'caso',
    terminaEm: 0,
    pausaRestante: null,
    participantes: [...ids],
    audiencia: [],
    ligados: [...ids],
    fora: [],
    ordem: baralhar(ids, seed),
    julgamento: -1,
    total: Math.ceil(ids.length / 2),
    reu: '',
    acusador: '',
    juiz: null,
    juri: [],
    vezesJuiz: {},
    papel: {},
    caso: conteudo.casos[0],
    monte: [],
    maos: {},
    ofertas: {},
    dadas: {},
    mesa: [],
    usados: { reu: [], acusador: [] },
    resto: 0,
    contra: null,
    testemunha: null,
    votos: {},
    estrelas: {},
    resultado: null,
    ganhos: {},
    pontos: Object.fromEntries(ids.map((id) => [id, 0])),
    fotos: lista,
    fotosUsadas: [],
    conteudo,
    usadas: [...usadas],
    seed,
    n: 1,
  };
  return proximo(e, agora);
}

/** réu e acusador do julgamento `k`; no último de um nº ímpar, quem falta joga contra quem tem menos pontos */
function par(e: EstadoSemJuizo, k: number): [EstadoSemJuizo, { reu: string; acusador: string } | null] {
  const a = e.ordem[2 * k];
  const b = e.ordem[2 * k + 1];
  if (b !== undefined) {
    if (e.fora.includes(a) || e.fora.includes(b)) return [e, null];
    return [e, { reu: a, acusador: b }];
  }
  if (e.fora.includes(a)) return [e, null];
  const jogaram = e.participantes.filter((id) => e.papel[id] && !e.fora.includes(id));
  if (!jogaram.length) return [e, null];
  const min = Math.min(...jogaram.map((id) => e.pontos[id] ?? 0));
  const [r, l] = sorteio(e, jogaram.filter((id) => (e.pontos[id] ?? 0) === min));
  const rival = l[0];
  return [r, e.papel[rival] === 'reu' ? { reu: a, acusador: rival } : { reu: rival, acusador: a }];
}

/** começa o julgamento seguinte que se possa fazer, ou acaba */
function proximo(e0: EstadoSemJuizo, agora: number): EstadoSemJuizo {
  let e = e0;
  for (let k = e.julgamento + 1; k < e.total; k++) {
    const [r, p] = par(e, k);
    e = r;
    if (p) return comecarJulgamento(e, k, p.reu, p.acusador, agora);
  }
  return { ...e, fase: 'fim', terminaEm: 0, resultado: null };
}

function comecarJulgamento(e0: EstadoSemJuizo, julgamento: number, reu: string, acusador: string, agora: number): EstadoSemJuizo {
  // juiz e júri: sempre humanos; o juiz é quem o foi menos vezes
  let e = e0;
  const votantes = e.participantes.filter((id) => id !== reu && id !== acusador && !ehBot(id) && !e.fora.includes(id));
  const on = votantes.filter((id) => e.ligados.includes(id));
  const cand = on.length ? on : votantes;
  const menos = Math.min(...cand.map((id) => e.vezesJuiz[id] ?? 0));
  const lS = sorteio(e, cand.filter((id) => (e.vezesJuiz[id] ?? 0) === menos));
  e = lS[0];
  const l = lS[1];
  const juiz = l[0] ?? null;
  const juri = votantes.filter((id) => id !== juiz);

  const livres = e.conteudo.casos.filter((c) => !e.usadas.includes(c.id));
  const casosS = sorteio(e, livres.length ? livres : e.conteudo.casos);
  e = casosS[0];
  const casos = casosS[1];
  const caso = casos[0];

  // o monte: as da net + até 3 da galeria, à sorte, nas primeiras (as que saem de certeza)
  const netsS = sorteio(e, e.conteudo.provas);
  e = netsS[0];
  const nets = netsS[1];
  const novas = Object.keys(e.fotos).filter((f) => !e.fotosUsadas.includes(f));
  const chavesS = sorteio(e, novas);
  e = chavesS[0];
  const chaves = chavesS[1];
  const daGaleria = chaves.slice(0, FOTOS_POR_JULGAMENTO);
  const galeria: Prova[] = daGaleria.map((foto, i) => ({ id: `${julgamento}g${i}`, busca: '', emoji: '🖼️', foto }));
  const net: Prova[] = nets.map((p, i) => ({ id: `${julgamento}n${i}`, busca: p.en, emoji: p.emoji }));
  let monte: Prova[];
  const primeiras = 2 * MAO - galeria.length;
  [e, monte] = sorteio(e, [...net.slice(0, primeiras), ...galeria]);
  monte = [...monte, ...net.slice(primeiras)];

  e = {
    ...e,
    julgamento,
    reu,
    acusador,
    juiz,
    juri,
    vezesJuiz: juiz ? { ...e.vezesJuiz, [juiz]: (e.vezesJuiz[juiz] ?? 0) + 1 } : e.vezesJuiz,
    papel: { ...e.papel, [reu]: 'reu', [acusador]: 'acusador' },
    caso,
    usadas: [...e.usadas, caso.id],
    fotosUsadas: [...e.fotosUsadas, ...daGaleria],
    monte,
    maos: { [reu]: [], [acusador]: [] },
    ofertas: {},
    dadas: {},
    mesa: [],
    usados: { reu: [], acusador: [] },
    resto: 0,
    contra: null,
    testemunha: null,
    votos: {},
    estrelas: {},
    resultado: null,
  };
  if (!juriEscolhe(e)) e = completarMaos(e);
  return irPara(e, 'caso', T_CASO, agora);
}

const juriEscolhe = (e: EstadoSemJuizo) => e.def.provas === 'juri' && e.juri.length > 0;

function tirar(e: EstadoSemJuizo, k: number): [EstadoSemJuizo, Prova[]] {
  return [{ ...e, monte: e.monte.slice(k) }, e.monte.slice(0, k)];
}

/** o que falta nas mãos vem à sorte */
function completarMaos(e0: EstadoSemJuizo): EstadoSemJuizo {
  let e = e0;
  for (const id of [e.reu, e.acusador]) {
    const pS = tirar(e, MAO - e.maos[id].length);
    e = pS[0];
    const p = pS[1];
    e = { ...e, maos: { ...e.maos, [id]: [...e.maos[id], ...p] } };
  }
  return e;
}

function abrirProvas(e0: EstadoSemJuizo, agora: number): EstadoSemJuizo {
  let e = e0;
  const q = quotaJurado(e.juri.length);
  for (const id of e.juri) {
    const pS = tirar(e, 2 * q + 2);
    e = pS[0];
    const p = pS[1];
    e = { ...e, ofertas: { ...e.ofertas, [id]: p }, dadas: { ...e.dadas, [id]: { reu: 0, acusador: 0 } } };
  }
  return irPara(e, 'provas', T_PROVAS, agora);
}

/** já não pode dar mais nada (a quota dele ou as mãos cheias) */
export function juradoAcabou(e: EstadoSemJuizo, id: string): boolean {
  const q = quotaJurado(e.juri.length);
  const cheio = (l: Lado) => (e.dadas[id]?.[l] ?? q) >= q || (e.maos[donoDe(e, l)]?.length ?? MAO) >= MAO;
  return cheio('reu') && cheio('acusador');
}

const aEscolher = (e: EstadoSemJuizo, agora: number) => irPara(e, 'escolher', T_ESCOLHER, agora);

function porNaMesa(e: EstadoSemJuizo, prova: Prova, liga: number | null, agora: number): EstadoSemJuizo {
  const lado = ladoDaVez(e);
  const dono = donoDe(e, lado);
  const maos = { ...e.maos, [dono]: e.maos[dono].filter((p) => p.id !== prova.id) };
  return irPara({ ...e, maos, mesa: [...e.mesa, { prova, lado, liga: e.mesa.length ? liga : null }] }, 'explicar', T_EXPLICAR, agora);
}

function aSorte(e0: EstadoSemJuizo, agora: number): EstadoSemJuizo {
  let e = e0;
  const maoS = sorteio(e, e.maos[donoDe(e, ladoDaVez(e))]);
  e = maoS[0];
  const mao = maoS[1];
  const ligasS = sorteio(e, e.mesa.map((_, i) => i));
  e = ligasS[0];
  const ligas = ligasS[1];
  return porNaMesa(e, mao[0], ligas[0] ?? null, agora);
}

const voltarAExplicar = (e: EstadoSemJuizo, agora: number): EstadoSemJuizo => ({ ...e, fase: 'explicar', terminaEm: agora + e.resto, contra: null, testemunha: null, votos: {} });

/** quem ainda vota nesta fase */
export function aVotar(e: Pick<EstadoSemJuizo, 'fase' | 'juiz' | 'juri'>): string[] {
  if (e.fase === 'juri' || e.fase === 'contra_juri') return e.juri;
  if (e.fase === 'juiz' || e.fase === 'contra_juiz') return e.juiz ? [e.juiz] : [];
  if (e.fase === 'estrela') return [...(e.juiz ? [e.juiz] : []), ...e.juri];
  return [];
}

/** abre a votação (sem júri, vai logo ao juiz) */
function abrirVoto(e: EstadoSemJuizo, contra: boolean, agora: number): EstadoSemJuizo {
  const s = { ...e, votos: {} };
  return s.juri.length ? irPara(s, contra ? 'contra_juri' : 'juri', T_JURI, agora) : irPara(s, contra ? 'contra_juiz' : 'juiz', T_JUIZ, agora);
}

/** jurado sem voto: à sorte */
function fecharJuri(e0: EstadoSemJuizo): EstadoSemJuizo {
  let e = e0;
  for (const id of e.juri) {
    if (id in e.votos) continue;
    const mS = sorteio(e, [true, false]);
    e = mS[0];
    const m = mS[1];
    e = { ...e, votos: { ...e.votos, [id]: m[0] } };
  }
  return e;
}

/** chave do voto do juiz quando não há juiz humano (partidas de teste com bots) */
const SEM_JUIZ = '#juiz';
const idJuiz = (e: EstadoSemJuizo) => e.juiz ?? SEM_JUIZ;

/** juiz sem voto: segue a maioria; empate ou sem júri, à sorte */
function fecharJuiz(e0: EstadoSemJuizo): EstadoSemJuizo {
  let e = e0;
  const j = idJuiz(e);
  if (j in e.votos) return e;
  const sim = e.juri.filter((id) => e.votos[id]).length;
  const nao = e.juri.length - sim;
  const mS = sorteio(e, [true, false]);
  e = mS[0];
  const m = mS[1];
  return { ...e, votos: { ...e.votos, [j]: sim === nao ? m[0] : sim > nao } };
}

/** peso de "sim" e o total */
export function contar(e: Pick<EstadoSemJuizo, 'votos' | 'juri' | 'juiz'>): { sim: number; total: number } {
  const p = pesoJuiz(e.juri.length);
  const sim = e.juri.filter((id) => e.votos[id]).length + (e.votos[e.juiz ?? SEM_JUIZ] ? p : 0);
  return { sim, total: e.juri.length + p };
}

/** estrelas de cada prova na mesa */
const estrelasDe = (e: EstadoSemJuizo): number[] => e.mesa.map((_, i) => Object.values(e.estrelas).filter((x) => x === i).length);

function revelar(e0: EstadoSemJuizo, agora: number): EstadoSemJuizo {
  let e = e0;
  const { sim, total } = contar(e);
  const culpado = sim * 2 > total;
  const estrelas = estrelasDe(e);
  const bonus = (l: Lado) => Math.min(MAX_ESTRELAS, PONTOS_ESTRELA * e.mesa.reduce((s, m, i) => s + (m.lado === l ? estrelas[i] : 0), 0));
  const parteReu = Math.round((PONTOS_VOTOS * (total - sim)) / total);
  const pontosJ: Record<Lado, number> = {
    reu: parteReu + (culpado ? 0 : PONTOS_VEREDITO) + bonus('reu'),
    acusador: PONTOS_VOTOS - parteReu + (culpado ? PONTOS_VEREDITO : 0) + bonus('acusador'),
  };
  const lista = culpado ? e.conteudo.culpado : e.conteudo.inocente;
  const livres = lista.filter((x) => !e.usadas.includes(x.id));
  const sS = sorteio(e, livres.length ? livres : lista);
  e = sS[0];
  const s = sS[1];
  const ganhos = { ...e.ganhos, [e.reu]: [...(e.ganhos[e.reu] ?? []), pontosJ.reu], [e.acusador]: [...(e.ganhos[e.acusador] ?? []), pontosJ.acusador] };
  // quem fez dois julgamentos conta só o melhor
  const pontos = { ...e.pontos, [e.reu]: Math.max(...ganhos[e.reu]), [e.acusador]: Math.max(...ganhos[e.acusador]) };
  const resultado: Resultado = { culpado, votos: e.votos, juiz: e.juiz, pesoJuiz: pesoJuiz(e.juri.length), pontos: pontosJ, estrelas, sentenca: s[0] };
  return irPara({ ...e, ganhos, pontos, resultado, usadas: [...e.usadas, s[0].id] }, 'revelar', T_REVELAR, agora);
}

function avancar(e: EstadoSemJuizo, agora: number): EstadoSemJuizo {
  switch (e.fase) {
    case 'caso':
      return juriEscolhe(e) ? abrirProvas(e, agora) : aEscolher(e, agora);
    case 'provas':
      return aEscolher({ ...completarMaos(e), ofertas: {} }, agora);
    case 'escolher':
      return aSorte(e, agora);
    case 'explicar':
      return e.mesa.length >= 2 * RONDAS ? abrirVoto(e, false, agora) : aEscolher(e, agora);
    case 'contra_fala':
      return abrirVoto(e, true, agora);
    case 'contra_juri':
      return irPara(fecharJuri(e), 'contra_juiz', T_JUIZ, agora);
    case 'contra_juiz': {
      const s = fecharJuiz(e);
      const { sim, total } = contar(s);
      const falhou = sim * 2 > total;
      const c = s.contra!;
      const recente = Math.max(c.a, c.b);
      const mesa = falhou ? s.mesa.map((m, i) => (i === recente ? { ...m, semEstrela: true } : m)) : s.mesa;
      return irPara({ ...s, mesa, contra: { ...c, falhou } }, 'contra_res', T_CONTRA_RES, agora);
    }
    case 'contra_res':
    case 'testemunha':
      return voltarAExplicar(e, agora);
    case 'juri':
      return irPara(fecharJuri(e), 'juiz', T_JUIZ, agora);
    case 'juiz':
      return irPara(fecharJuiz(e), 'estrela', T_ESTRELA, agora);
    case 'estrela':
      return revelar(e, agora);
    case 'revelar':
      return proximo(e, agora);
    default:
      return e;
  }
}

/** acaba antes do tempo quando todos os ligados já fizeram a sua parte */
function todosFeito(e: EstadoSemJuizo): boolean {
  if (e.fase === 'provas') {
    const l = e.juri.filter((id) => e.ligados.includes(id));
    return l.length > 0 && l.every((id) => juradoAcabou(e, id));
  }
  const ids = aVotar(e).filter((id) => e.ligados.includes(id));
  const feitos: object = e.fase === 'estrela' ? e.estrelas : e.votos;
  return ids.length > 0 && ids.every((id) => id in feitos);
}

const seTodos = (e: EstadoSemJuizo, agora: number) => (todosFeito(e) ? avancar(e, agora) : e);

/** as interrupções só se usam durante uma explicação, 1 de cada por lado e por julgamento */
export function podeInterromper(e: Pick<EstadoSemJuizo, 'fase' | 'mesa' | 'usados' | 'juiz' | 'juri'>, lado: Lado, p: Poder): boolean {
  if (e.fase !== 'explicar' || e.usados[lado].includes(p)) return false;
  if (p === 'protesto') return ladoDaVez(e) !== lado;
  if (p === 'contradicao') return e.mesa.filter((m) => m.lado !== lado).length >= 2;
  return !!e.juiz || e.juri.length > 0;
}

const gastar = (e: EstadoSemJuizo, lado: Lado, p: Poder): EstadoSemJuizo => ({ ...e, usados: { ...e.usados, [lado]: [...e.usados[lado], p] } });

export function reduzSemJuizo(e: EstadoSemJuizo, acao: AcaoSemJuizo, agora: number): EstadoSemJuizo {
  if (acao.tipo === 'ligados') {
    const s = { ...e, ligados: acao.ids };
    return pausaPorFalta(s, s.fase !== 'fim' && quantosLigados(s.participantes, s.ligados) < MIN_JOGADORES, agora);
  }
  if (pausado(e) || e.fase === 'fim') return e;
  if (acao.tipo === 'tick') return agora >= e.terminaEm ? avancar(e, agora) : seTodos(e, agora);
  const lado = ladoDe(e, acao.id);
  switch (acao.tipo) {
    case 'sj_dar': {
      if (e.fase !== 'provas' || !e.juri.includes(acao.id) || (acao.lado !== 'reu' && acao.lado !== 'acusador')) return e;
      const p = e.ofertas[acao.id]?.find((x) => x.id === acao.prova);
      const dono = donoDe(e, acao.lado);
      const d = e.dadas[acao.id];
      if (!p || !d || d[acao.lado] >= quotaJurado(e.juri.length) || e.maos[dono].length >= MAO) return e;
      return seTodos(
        {
          ...e,
          ofertas: { ...e.ofertas, [acao.id]: e.ofertas[acao.id].filter((x) => x !== p) },
          dadas: { ...e.dadas, [acao.id]: { ...d, [acao.lado]: d[acao.lado] + 1 } },
          maos: { ...e.maos, [dono]: [...e.maos[dono], p] },
        },
        agora,
      );
    }
    case 'sj_jogar': {
      if (e.fase !== 'escolher' || lado !== ladoDaVez(e)) return e;
      const p = e.maos[acao.id].find((x) => x.id === acao.prova);
      if (!p) return e;
      if (e.mesa.length && (!Number.isInteger(acao.liga) || acao.liga! < 0 || acao.liga! >= e.mesa.length)) return e;
      return porNaMesa(e, p, acao.liga, agora);
    }
    case 'sj_protesto': {
      if (!lado || !podeInterromper(e, lado, 'protesto')) return e;
      const [s, novas] = tirar(e, 1);
      if (!novas.length) return e;
      const mesa = s.mesa.map((m, i) => (i === s.mesa.length - 1 ? { ...m, prova: novas[0] } : m));
      return { ...gastar(s, lado, 'protesto'), mesa, terminaEm: s.terminaEm + T_PROTESTO * 1000 };
    }
    case 'sj_contradicao': {
      if (!lado || !podeInterromper(e, lado, 'contradicao')) return e;
      const { a, b } = acao;
      if (a === b || e.mesa[a]?.lado !== outro(lado) || e.mesa[b]?.lado !== outro(lado)) return e;
      const s = { ...gastar(e, lado, 'contradicao'), resto: Math.max(0, e.terminaEm - agora), contra: { quem: lado, a, b } };
      return irPara(s, 'contra_fala', T_CONTRA, agora);
    }
    case 'sj_testemunha': {
      if (!lado || !podeInterromper(e, lado, 'testemunha')) return e;
      const todos = [...(e.juiz ? [e.juiz] : []), ...e.juri];
      const on = todos.filter((id) => e.ligados.includes(id));
      const [s, l] = sorteio(e, on.length ? on : todos);
      return irPara({ ...gastar(s, lado, 'testemunha'), resto: Math.max(0, e.terminaEm - agora), testemunha: l[0] }, 'testemunha', T_TESTEMUNHA, agora);
    }
    case 'sj_votar': {
      if (e.fase === 'estrela' || !aVotar(e).includes(acao.id) || acao.id in e.votos || typeof acao.sim !== 'boolean') return e;
      return seTodos({ ...e, votos: { ...e.votos, [acao.id]: acao.sim } }, agora);
    }
    case 'sj_estrela': {
      if (e.fase !== 'estrela' || !aVotar(e).includes(acao.id) || acao.id in e.estrelas) return e;
      const m = Number.isInteger(acao.i) ? e.mesa[acao.i] : undefined;
      if (!m || m.semEstrela) return e;
      return seTodos({ ...e, estrelas: { ...e.estrelas, [acao.id]: acao.i } }, agora);
    }
  }
}

export interface VistaSemJuizo {
  def: DefSemJuizo;
  fase: FaseSemJuizo;
  terminaEm: number;
  restante: number | null;
  participantes: string[];
  audiencia: string[];
  usadas: string[];
  julgamento: number;
  total: number;
  reu: string;
  acusador: string;
  juiz: string | null;
  juri: string[];
  pesoJuiz: number;
  caso: Caso;
  mesa: NaMesa[];
  usados: Record<Lado, Poder[]>;
  contra: Contra | null;
  testemunha: string | null;
  /** quem já votou / deu a estrela / acabou de dar provas */
  feitos: string[];
  resultado: Resultado | null;
  pontos: Record<string, number>;
  podio: Podio[];
}

export function vistaSemJuizo(e: EstadoSemJuizo): VistaSemJuizo {
  const feitos = e.fase === 'estrela' ? Object.keys(e.estrelas) : e.fase === 'provas' ? e.juri.filter((id) => juradoAcabou(e, id)) : aVotar(e).filter((id) => id in e.votos);
  return {
    def: e.def,
    fase: e.fase,
    terminaEm: e.terminaEm,
    restante: e.pausaRestante,
    participantes: e.participantes,
    audiencia: e.audiencia,
    usadas: e.usadas,
    julgamento: e.julgamento,
    total: e.total,
    reu: e.reu,
    acusador: e.acusador,
    juiz: e.juiz,
    juri: e.juri,
    pesoJuiz: pesoJuiz(e.juri.length),
    caso: e.caso,
    mesa: e.mesa,
    usados: e.usados,
    contra: e.contra,
    testemunha: e.testemunha,
    feitos,
    resultado: e.fase === 'revelar' ? e.resultado : null,
    pontos: e.pontos,
    podio: e.fase === 'fim' ? podio(e.participantes, e.pontos) : [],
  };
}

/** só deste telemóvel: a mão, a oferta do jurado, o próprio voto e, só o juiz, os votos do júri */
export interface PrivadoSemJuizo {
  /** de que julgamento é (o privado pode chegar antes ou depois da vista) */
  julgamento: number;
  mao: Prova[];
  oferta: Prova[];
  dadas: Record<Lado, number> | null;
  maos: Record<Lado, number> | null;
  quota: number;
  voto: boolean | null;
  estrela: number | null;
  votosJuri: Record<string, boolean> | null;
  /** fotos da galeria que este telemóvel pode ver: as suas e as da mesa */
  fotos: Record<string, string>;
}

const fotosDe = (e: EstadoSemJuizo, provas: Prova[]): Record<string, string> =>
  Object.fromEntries(provas.filter((p) => p.foto && e.fotos[p.foto]).map((p) => [p.foto!, e.fotos[p.foto!]]));

export function privadoSemJuizo(e: EstadoSemJuizo, id: string, ctx: { semTv: boolean; bot: boolean }): PrivadoSemJuizo | null {
  if (e.fase === 'fim') return null;
  const mao = e.maos[id] ?? [];
  const oferta = e.fase === 'provas' ? (e.ofertas[id] ?? []) : [];
  return {
    julgamento: e.julgamento,
    mao,
    oferta,
    dadas: oferta.length ? (e.dadas[id] ?? null) : null,
    maos: oferta.length ? { reu: e.maos[e.reu].length, acusador: e.maos[e.acusador].length } : null,
    quota: quotaJurado(e.juri.length),
    voto: e.votos[id] ?? null,
    estrela: e.estrelas[id] ?? null,
    votosJuri: id === e.juiz && (e.fase === 'juiz' || e.fase === 'contra_juiz') ? Object.fromEntries(e.juri.map((x) => [x, e.votos[x]])) : null,
    // aos bots não: o líder recebia-as uma vez por bot
    fotos: ctx.bot ? {} : fotosDe(e, [...mao, ...oferta, ...e.mesa.map((m) => m.prova)]),
  };
}

/** a TV (host) vê as fotos da mesa direto do estado */
export const fotosMesa = (e: EstadoSemJuizo): Record<string, string> => fotosDe(e, e.mesa.map((m) => m.prova));

/* ---------- saídas a meio (src/core/saidas.ts) ---------- */

/** o réu e o acusador da vez fazem falta */
export const importanteSemJuizo = (e: EstadoSemJuizo, id: string): boolean => e.fase !== 'revelar' && e.fase !== 'fim' && ladoDe(e, id) !== null;

/** o líder decidiu seguir sem ele: se era réu ou acusador, o julgamento anula-se (sem pontos) */
export function sairSemJuizo(e: EstadoSemJuizo, id: string, agora: number): EstadoSemJuizo {
  if (e.fase === 'fim' || e.fora.includes(id)) return e;
  const s = { ...e, fora: [...e.fora, id] };
  if (!importanteSemJuizo(e, id)) return s;
  const r = proximo(s, agora);
  // em pausa (ainda à espera dele): o relógio novo começa quando ela acabar
  return r.pausaRestante !== null && r.fase !== 'fim' ? { ...r, pausaRestante: r.terminaEm - agora } : r;
}
