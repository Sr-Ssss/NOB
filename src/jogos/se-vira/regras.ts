import { baralhar } from '../../core/ids';
import { pausaPorFalta, podio, type Podio } from '../../core/jogo';

/** Se Vira!: regras em info/jogos/apresentacao-surpresa.md */

export interface DefSevira {
  tempo: number; // s de apresentação
  slides: number;
  /** auto = ≤8 todos; >8 sorteados */
  quem: 'auto' | 'todos' | 'sorteados';
  /** links de imagens colados pelos jogadores: sem filtro (podem mostrar qualquer coisa na TV), por isso desligados por defeito */
  links?: boolean;
}

export const DEF_PADRAO_SEVIRA: DefSevira = { tempo: 90, slides: 6, quem: 'auto', links: false };
export const OPCOES_SEVIRA = { tempo: [60, 90, 120], slides: [4, 6, 8] };
export const MIN_JOGADORES = 3;
export const MAX_JOGADORES = 16;
export const MAX_APRESENTAM = 8;
export const T_PREPARAR = 60;
export const T_TEMA = 10;
export const T_NOTA = 12;
export const MAX_TITULO = 80;
export const MAX_IMAGENS = 3;
export const MAX_LINK = 2000;
/** WebP de 800 px ≤100 KB em base64 (com folga) */
export const MAX_GALERIA = 140_000;
export const REACOES = ['😂', '👏', '🤯', '😴'];
/** entre duas reações do mesmo jogador (para não contar "spam") */
export const T_ENTRE_REACOES = 400;
/** para os pontos, cada pessoa conta no máximo 1 reação a cada 5 s (senão o teto de +200 chegava sempre) */
export const T_CONTA_REACAO = 5000;
export const PONTOS_ESTRELA = 200;
export const PONTOS_REACAO = 5;
export const MAX_PONTOS_REACAO = 200;
/** reações guardadas para a TV animar */
const MAX_FILA_REACOES = 40;

export interface Txt {
  id: string;
  pt: string;
  en: string;
}

export interface Imagem {
  tipo: 'galeria' | 'giphy' | 'link';
  /** galeria: data URL (só no host); giphy/link: endereço */
  url: string;
}

/** a imagem de cada slide: a do jogador, ou uma gerada pelo jogo (GIPHY/Pexels; se a pesquisa falhar, o emoji) */
export type Visual = { tipo: 'jogador'; img: Imagem } | { tipo: 'auto'; busca: string; emoji: string };

/** todos os slides têm imagem (`visual`) + um texto: legenda, gráfico, citação, tópico ou conclusão */
export type Slide = { visual: Visual } & (
  | { tipo: 'foto'; legenda: Txt }
  | { tipo: 'grafico'; rotulo: Txt; forma: 'barras' | 'pizza'; valores: number[] }
  | { tipo: 'citacao'; texto: Txt }
  | { tipo: 'lista'; itens: Txt[] } // 1 tópico
  | { tipo: 'conclusao'; palavra: Txt }
);

export type TipoSlide = Slide['tipo'];

export interface Deck {
  autor: string;
  titulo: string;
  slides: Slide[];
}

export interface Conteudo {
  titulos: Txt[];
  legendas: Txt[];
  topicos: Txt[];
  citacoes: Txt[];
  rotulos: Txt[];
  conclusoes: Txt[];
}

export type FaseSevira = 'preparar' | 'tema' | 'apresentar' | 'nota' | 'fim';

export interface Reacao {
  n: number;
  id: string;
  r: string;
}

export interface EstadoSevira {
  def: DefSevira;
  idioma: 'pt-BR' | 'en';
  fase: FaseSevira;
  terminaEm: number;
  pausaRestante: number | null;
  participantes: string[];
  audiencia: string[];
  ligados: string[];
  /** tema sorteado de cada jogador (o título por defeito) */
  temas: Record<string, Txt>;
  rascunhos: Record<string, (Imagem | null)[]>;
  /** título editado ao enviar (null = o sorteado) */
  titulos: Record<string, string | null>;
  enviaram: string[];
  /** por ordem de apresentação */
  apresentadores: string[];
  /** apresentador → quem preparou o deck dele (nunca o próprio) */
  dono: Record<string, string>;
  decks: Record<string, Deck>;
  atual: number;
  slide: number;
  reacoes: Reacao[];
  nReacao: number;
  contaReacoes: Record<string, number>;
  ultimaReacao: Record<string, number>;
  /** última reação de cada um que contou para os pontos */
  contadas?: Record<string, number>;
  notas: Record<string, Record<string, number>>;
  pontos: Record<string, number>;
  conteudo: Conteudo;
  usadas: string[];
  seed: number;
}

export type AcaoSevira =
  | { tipo: 'sv_imagem'; id: string; i: number; img: Imagem | null }
  | { tipo: 'sv_enviar'; id: string; titulo: string | null }
  | { tipo: 'sv_slide'; id: string; dir: number }
  /** o apresentador, no último slide, acaba antes do tempo */
  | { tipo: 'sv_terminar'; id: string }
  | { tipo: 'sv_reagir'; id: string; r: string }
  | { tipo: 'sv_nota'; id: string; estrelas: number }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'tick' };

export const TIPOS_SEVIRA = ['sv_imagem', 'sv_enviar', 'sv_slide', 'sv_terminar', 'sv_reagir', 'sv_nota'];

const prox = (s: number) => (s * 1664525 + 1013904223) >>> 0;

/** quantos apresentam com estas definições */
export function quantosApresentam(def: DefSevira, n: number): number {
  const quem = def.quem === 'auto' ? (n > MAX_APRESENTAM ? 'sorteados' : 'todos') : def.quem;
  return quem === 'sorteados' ? Math.min(n, MAX_APRESENTAM) : n;
}

/**
 * ordem sorteada; apresentam os primeiros `m` e cada um recebe o deck do seguinte na roda
 * (derangement: ninguém apresenta o seu, nem sabe de quem é)
 */
export function sortearOrdem(ids: string[], m: number, seed: number): { apresentadores: string[]; dono: Record<string, string> } {
  const s = baralhar(ids, seed);
  const apresentadores = s.slice(0, m);
  const dono = Object.fromEntries(apresentadores.map((id, k) => [id, s[(k + 1) % s.length]]));
  return { apresentadores, dono };
}

/** tira `k` itens do conteúdo que ainda não saíram (se acabarem, volta a usar) */
function tirar(lista: Txt[], k: number, usadas: Set<string>, seed: number): Txt[] {
  if (!lista.length) return Array.from({ length: k }, (_, i) => ({ id: `vazio-${i}`, pt: '…', en: '…' }));
  const livres = baralhar(lista.filter((x) => !usadas.has(x.id)), seed);
  const resto = baralhar(lista, seed + 7);
  const r: Txt[] = [];
  for (let i = 0; i < k; i++) r.push(livres[i] ?? resto[i % resto.length]);
  r.forEach((x) => usadas.add(x.id));
  return r;
}

const EMOJIS = ['🐟', '🦆', '🐈', '🧦', '🥔', '🦖', '🍕', '🛋️', '🐌', '🎈', '🧀', '🐧', '🌵', '🚀', '🦒'];
/** termos da imagem automática (inglês: a GIPHY e a Pexels dão mais resultados) */
export const BUSCAS = [
  'cat', 'duck', 'office', 'dog', 'surprised', 'dance', 'penguin', 'potato', 'pizza', 'llama', 'robot', 'fail', 'celebrate', 'sloth', 'meeting',
  'goat', 'coffee', 'computer', 'banana', 'hamster', 'chicken', 'confused', 'presentation', 'thumbs up', 'party',
];

/** tipos do corpo (a conclusão é sempre o último) */
const CORPO: TipoSlide[] = ['foto', 'grafico', 'citacao', 'lista'];

/** os tipos do corpo: 1 de cada (os que couberem) e o resto sorteado, tudo por ordem sorteada */
export function sortearTipos(corpo: number, seed: number): TipoSlide[] {
  const obrig = baralhar(CORPO, seed).slice(0, corpo);
  const resto = Array.from({ length: corpo - obrig.length }, (_, i) => baralhar(CORPO, seed + 11 + i)[0]);
  return baralhar([...obrig, ...resto], seed + 5);
}

/**
 * gera os slides: todos com imagem (a do jogador em posições sorteadas do corpo; nos outros, automática),
 * pelo menos 1 de cada tipo (com 4 slides não cabem os 5: fica a conclusão + 3 sorteados); o último é sempre a conclusão
 */
export function gerarSlides(n: number, imagens: Imagem[], c: Conteudo, usadas: Set<string>, seed: number): Slide[] {
  const corpo = n - 1;
  const imgs = imagens.slice(0, Math.min(MAX_IMAGENS, corpo));
  const posicoes = baralhar(Array.from({ length: corpo }, (_, i) => i), seed).slice(0, imgs.length);
  const tipos: TipoSlide[] = [...sortearTipos(corpo, seed + 1), 'conclusao'];
  const buscas = baralhar(BUSCAS, seed + 2);
  const emojis = baralhar(EMOJIS, seed + 3);
  const slides: Slide[] = [];
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = prox(s);
    const k = posicoes.indexOf(i);
    const visual: Visual = k >= 0 ? { tipo: 'jogador', img: imgs[k] } : { tipo: 'auto', busca: buscas[i % buscas.length], emoji: emojis[i % emojis.length] };
    const t = tipos[i];
    if (t === 'foto') slides.push({ visual, tipo: 'foto', legenda: tirar(c.legendas, 1, usadas, s)[0] });
    else if (t === 'grafico') {
      const valores = Array.from({ length: 4 }, (_, q) => 5 + (prox(s + q) % 96));
      slides.push({ visual, tipo: 'grafico', rotulo: tirar(c.rotulos, 1, usadas, s)[0], forma: s % 3 === 0 ? 'pizza' : 'barras', valores });
    } else if (t === 'citacao') slides.push({ visual, tipo: 'citacao', texto: tirar(c.citacoes, 1, usadas, s)[0] });
    else if (t === 'lista') slides.push({ visual, tipo: 'lista', itens: tirar(c.topicos, 1, usadas, s) });
    else slides.push({ visual, tipo: 'conclusao', palavra: tirar(c.conclusoes, 1, usadas, s)[0] });
  }
  return slides;
}

function irPara(e: EstadoSevira, fase: FaseSevira, segundos: number, agora: number): EstadoSevira {
  return { ...e, fase, terminaEm: agora + segundos * 1000 };
}

export function novoSevira(ids: string[], def: Partial<DefSevira>, agora: number, conteudo: Conteudo, idioma: 'pt-BR' | 'en' = 'pt-BR', usadas: string[] = []): EstadoSevira {
  const d = { ...DEF_PADRAO_SEVIRA, ...def };
  const seed = (agora ^ (ids.length * 2654435761)) >>> 0;
  const u = new Set(usadas);
  const temas = tirar(conteudo.titulos, ids.length, u, seed);
  const { apresentadores, dono } = sortearOrdem(ids, quantosApresentam(d, ids.length), seed + 3);
  return {
    def: d,
    idioma,
    fase: 'preparar',
    terminaEm: agora + T_PREPARAR * 1000,
    pausaRestante: null,
    participantes: [...ids],
    audiencia: [],
    ligados: [...ids],
    temas: Object.fromEntries(ids.map((id, i) => [id, temas[i]])),
    rascunhos: {},
    titulos: {},
    enviaram: [],
    apresentadores,
    dono,
    decks: {},
    atual: 0,
    slide: 0,
    reacoes: [],
    nReacao: 0,
    contaReacoes: {},
    ultimaReacao: {},
    notas: {},
    pontos: Object.fromEntries(ids.map((id) => [id, 0])),
    conteudo,
    usadas: [...u],
    seed,
  };
}

export function pausadoSevira(e: EstadoSevira): boolean {
  return e.pausaRestante !== null;
}

export function apresentador(e: EstadoSevira): string | null {
  return e.fase === 'tema' || e.fase === 'apresentar' || e.fase === 'nota' ? e.apresentadores[e.atual] ?? null : null;
}

/** quem pode dar nota (e reagir): todos menos o apresentador */
export function plateia(e: EstadoSevira): string[] {
  const a = apresentador(e);
  return [...e.participantes, ...e.audiencia].filter((id) => id !== a);
}

/** imagens do rascunho, sem buracos */
const imagensDe = (e: EstadoSevira, id: string): Imagem[] => (e.rascunhos[id] ?? []).filter((x): x is Imagem => !!x);

function montarDecks(e: EstadoSevira): EstadoSevira {
  const usadas = new Set(e.usadas);
  let s = e.seed;
  const decks: Record<string, Deck> = {};
  for (const a of e.apresentadores) {
    s = prox(s);
    const autor = e.dono[a];
    const enviou = e.enviaram.includes(autor);
    const tema = e.temas[autor];
    const titulo = (enviou && e.titulos[autor]?.trim()) || (e.idioma === 'en' ? tema.en : tema.pt);
    decks[a] = { autor, titulo, slides: gerarSlides(e.def.slides, enviou ? imagensDe(e, autor) : [], e.conteudo, usadas, s) };
  }
  return { ...e, decks, usadas: [...usadas] };
}

/** média das ⭐ × 200 + 5 por reação (até +200) */
export function pontosDe(notas: Record<string, number>, reacoes: number): number {
  const v = Object.values(notas);
  const media = v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  return Math.round(media * PONTOS_ESTRELA) + Math.min(MAX_PONTOS_REACAO, reacoes * PONTOS_REACAO);
}

function fecharNota(e: EstadoSevira, agora: number): EstadoSevira {
  const a = e.apresentadores[e.atual];
  const p = pontosDe(e.notas[a] ?? {}, e.contaReacoes[a] ?? 0);
  const r = { ...e, pontos: { ...e.pontos, [a]: (e.pontos[a] ?? 0) + p } };
  if (e.atual + 1 >= e.apresentadores.length) return { ...r, fase: 'fim', terminaEm: 0 };
  return irPara({ ...r, atual: e.atual + 1, slide: 0, reacoes: [] }, 'tema', T_TEMA, agora);
}

function avancar(e: EstadoSevira, agora: number): EstadoSevira {
  switch (e.fase) {
    case 'preparar':
      return irPara(montarDecks(e), 'tema', T_TEMA, agora);
    case 'tema':
      return irPara({ ...e, slide: 0 }, 'apresentar', e.def.tempo, agora);
    case 'apresentar':
      return irPara(e, 'nota', T_NOTA, agora);
    case 'nota':
      return fecharNota(e, agora);
    default:
      return e;
  }
}

const ligadosDe = (e: EstadoSevira, ids: string[]) => ids.filter((id) => e.ligados.includes(id));

/** acaba antes do tempo quando todos os ligados já fizeram a sua parte */
function todosFeito(e: EstadoSevira): boolean {
  if (e.fase === 'preparar') {
    const l = ligadosDe(e, e.participantes);
    return l.length > 0 && l.every((id) => e.enviaram.includes(id));
  }
  if (e.fase === 'nota') {
    const l = ligadosDe(e, plateia(e));
    const n = e.notas[e.apresentadores[e.atual]] ?? {};
    return l.length > 0 && l.every((id) => id in n);
  }
  return false;
}

function faltaGente(e: EstadoSevira): boolean {
  return e.fase !== 'fim' && ligadosDe(e, e.participantes).length < MIN_JOGADORES;
}

function validaImagem(img: Imagem, links: boolean): boolean {
  if (typeof img?.url !== 'string') return false;
  if (img.tipo === 'link' && !links) return false;
  if (img.tipo === 'galeria') return img.url.startsWith('data:image/') && img.url.length <= MAX_GALERIA;
  if (img.tipo === 'giphy' || img.tipo === 'link') return /^https?:\/\//i.test(img.url) && img.url.length <= MAX_LINK;
  return false;
}

export function reduzSevira(e: EstadoSevira, acao: AcaoSevira, agora: number): EstadoSevira {
  switch (acao.tipo) {
    case 'ligados': {
      const s: EstadoSevira = { ...e, ligados: acao.ids };
      return pausaPorFalta(s, faltaGente(s), agora);
    }
    case 'sv_imagem': {
      if (e.fase !== 'preparar' || pausadoSevira(e) || !e.participantes.includes(acao.id) || e.enviaram.includes(acao.id)) return e;
      if (!Number.isInteger(acao.i) || acao.i < 0 || acao.i >= MAX_IMAGENS) return e;
      if (acao.img && !validaImagem(acao.img, !!e.def.links)) return e;
      const r = [...(e.rascunhos[acao.id] ?? [null, null, null])];
      r[acao.i] = acao.img ? { tipo: acao.img.tipo, url: acao.img.url } : null;
      return { ...e, rascunhos: { ...e.rascunhos, [acao.id]: r } };
    }
    case 'sv_enviar': {
      if (e.fase !== 'preparar' || pausadoSevira(e) || !e.participantes.includes(acao.id) || e.enviaram.includes(acao.id)) return e;
      const t = typeof acao.titulo === 'string' ? acao.titulo.trim().slice(0, MAX_TITULO) : '';
      const s = { ...e, titulos: { ...e.titulos, [acao.id]: t || null }, enviaram: [...e.enviaram, acao.id] };
      return todosFeito(s) ? avancar(s, agora) : s;
    }
    case 'sv_slide': {
      if (e.fase !== 'apresentar' || pausadoSevira(e) || apresentador(e) !== acao.id) return e;
      const n = e.decks[acao.id]?.slides.length ?? 1;
      const slide = Math.max(0, Math.min(n - 1, e.slide + (acao.dir > 0 ? 1 : -1)));
      return slide === e.slide ? e : { ...e, slide };
    }
    case 'sv_terminar': {
      if (e.fase !== 'apresentar' || pausadoSevira(e) || apresentador(e) !== acao.id) return e;
      if (e.slide < (e.decks[acao.id]?.slides.length ?? 1) - 1) return e;
      return irPara(e, 'nota', T_NOTA, agora);
    }
    case 'sv_reagir': {
      if (e.fase !== 'apresentar' || pausadoSevira(e) || !REACOES.includes(acao.r) || !plateia(e).includes(acao.id)) return e;
      if (agora - (e.ultimaReacao[acao.id] ?? -Infinity) < T_ENTRE_REACOES) return e;
      const a = apresentador(e)!;
      const n = e.nReacao + 1;
      const conta = agora - (e.contadas?.[acao.id] ?? -Infinity) >= T_CONTA_REACAO;
      return {
        ...e,
        nReacao: n,
        reacoes: [...e.reacoes, { n, id: acao.id, r: acao.r }].slice(-MAX_FILA_REACOES),
        ultimaReacao: { ...e.ultimaReacao, [acao.id]: agora },
        ...(conta ? { contaReacoes: { ...e.contaReacoes, [a]: (e.contaReacoes[a] ?? 0) + 1 }, contadas: { ...e.contadas, [acao.id]: agora } } : {}),
      };
    }
    case 'sv_nota': {
      if (e.fase !== 'nota' || pausadoSevira(e) || !plateia(e).includes(acao.id)) return e;
      if (!Number.isInteger(acao.estrelas) || acao.estrelas < 1 || acao.estrelas > 5) return e;
      const a = apresentador(e)!;
      const atuais = e.notas[a] ?? {};
      if (acao.id in atuais) return e;
      const s = { ...e, notas: { ...e.notas, [a]: { ...atuais, [acao.id]: acao.estrelas } } };
      return todosFeito(s) ? avancar(s, agora) : s;
    }
    case 'tick': {
      if (pausadoSevira(e) || e.fase === 'fim') return e;
      if (agora >= e.terminaEm || todosFeito(e)) return avancar(e, agora);
      return e;
    }
  }
}

export type PodioSevira = Podio;

/** pódio com empates (mesmos pontos = mesmo lugar) */
export function podioSevira(e: Pick<EstadoSevira, 'participantes' | 'pontos'>): PodioSevira[] {
  return podio(e.participantes, e.pontos);
}

/** o que vai no canal: sem dados da galeria (vão só para a TV) e sem os decks antes de chegarem */
export interface VistaSevira {
  def: DefSevira;
  fase: FaseSevira;
  terminaEm: number;
  restante: number | null;
  participantes: string[];
  audiencia: string[];
  usadas: string[];
  /** tag do jogador → o seu tema sorteado */
  temas: Record<string, Txt>;
  enviaram: string[];
  apresentadores: string[];
  atual: number;
  apresentador: string | null;
  titulo: string | null;
  slide: number;
  nSlides: number;
  /** o slide atual; imagens da galeria vêm como { tipo: 'galeria', url: '' } */
  slideAtual: Slide | null;
  deram: string[];
  pontos: Record<string, number>;
  podio: PodioSevira[];
  /** as reações a voar, sem quem reagiu (sem TV, aparecem nos telemóveis por cima do slide) */
  reacoes: Pick<Reacao, 'n' | 'r'>[];
}

const semDados = (s: Slide): Slide => (s.visual.tipo === 'jogador' && s.visual.img.tipo === 'galeria' ? { ...s, visual: { tipo: 'jogador', img: { tipo: 'galeria', url: '' } } } : s);

export function vistaSevira(e: EstadoSevira, tagDe: (id: string) => string | undefined): VistaSevira {
  const a = apresentador(e);
  const deck = a ? e.decks[a] : null;
  return {
    def: e.def,
    fase: e.fase,
    terminaEm: e.terminaEm,
    restante: e.pausaRestante,
    participantes: e.participantes,
    audiencia: e.audiencia,
    usadas: e.usadas,
    temas: e.fase === 'preparar' ? Object.fromEntries(Object.entries(e.temas).map(([id, t]) => [tagDe(id) ?? id, t])) : {},
    enviaram: e.enviaram,
    apresentadores: e.apresentadores,
    atual: e.atual,
    apresentador: a,
    titulo: deck?.titulo ?? null,
    slide: e.slide,
    nSlides: deck?.slides.length ?? 0,
    slideAtual: deck && e.fase === 'apresentar' ? semDados(deck.slides[e.slide]) : null,
    deram: a && e.fase === 'nota' ? Object.keys(e.notas[a] ?? {}) : [],
    pontos: e.pontos,
    podio: e.fase === 'fim' ? podioSevira(e) : [],
    // sem quem reagiu
    reacoes: e.fase === 'apresentar' ? e.reacoes.map((r) => ({ n: r.n, r: r.r })) : [],
  };
}

/**
 * Sem TV, o slide aparece em todos os telemóveis: a imagem da galeria (pesada, não vai na vista) segue pelo canal
 * privado, só a do slide atual. Com TV, nada (só a TV a mostra). Bots também não (o líder recebê-la-ia uma vez por bot).
 * `chave` diz de que slide é.
 */
export interface PrivadoSevira {
  chave: string;
  imagem: string;
}
export function privadoSevira(e: EstadoSevira, _id: string, ctx: { semTv: boolean; bot: boolean }): PrivadoSevira | null {
  if (!ctx.semTv || ctx.bot) return null;
  const imagem = extraTv(e).imagem;
  return imagem ? { chave: `${apresentador(e)}:${e.slide}`, imagem } : null;
}

/** o que só a TV vê (não vai no canal): imagens da galeria do slide atual e as reações */
export function extraTv(e: EstadoSevira): { imagem: string | null; reacoes: Reacao[] } {
  const a = apresentador(e);
  const s = a && e.fase === 'apresentar' ? e.decks[a]?.slides[e.slide] : null;
  return { imagem: s?.visual.tipo === 'jogador' ? s.visual.img.url : null, reacoes: e.fase === 'apresentar' ? e.reacoes : [] };
}

/* ---------- saídas a meio (src/core/saidas.ts) ---------- */

/** o apresentador da vez faz falta (passa os slides) */
export const importanteSevira = (e: EstadoSevira, id: string): boolean => (e.fase === 'tema' || e.fase === 'apresentar') && apresentador(e) === id;

/** o líder decidiu seguir sem ele: sai da lista de apresentadores; se era a vez dele, passa ao seguinte */
export function sairSevira(e: EstadoSevira, id: string, agora: number): EstadoSevira {
  const i = e.apresentadores.indexOf(id);
  if (i < 0 || e.fase === 'fim') return e;
  const apresentadores = e.apresentadores.filter((x) => x !== id);
  if (e.fase === 'preparar' || i > e.atual) return { ...e, apresentadores };
  if (i < e.atual) return { ...e, apresentadores, atual: e.atual - 1 };
  if (e.atual >= apresentadores.length) return { ...e, apresentadores, fase: 'fim', terminaEm: 0 };
  return irPara({ ...e, apresentadores, slide: 0, reacoes: [] }, 'tema', T_TEMA, agora);
}
