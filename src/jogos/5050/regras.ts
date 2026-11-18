import { baralhar } from '../../core/ids';
import { irPara, pausaPorFalta, podio as podioComum, quantosLigados, type Podio } from '../../core/jogo';

export type Lado = 'a' | 'b';

export interface Def5050 {
  rondas: number;
  /** o líder ainda não escolheu as rondas: com 10+ jogadores passam a 2 (meio-a-meio.md) */
  rondasAuto?: boolean;
  escrever: number; // s
  votar: number; // s
  mostrarVotos: boolean;
  temas: string[]; // vazio = todos
}

export const DEF_PADRAO: Def5050 = { rondas: 3, rondasAuto: true, escrever: 60, votar: 15, mostrarVotos: true, temas: [] };
export const OPCOES = {
  rondas: [2, 3, 5],
  escrever: [30, 60, 90, 120],
  votar: [10, 15, 30],
};
export const T_MOSTRAR = 6;
export const T_REVELAR = 6;
export const T_PLACAR = 8;
export const MAX_TEXTO = 150;
export const MAX_RESPOSTA = 40;
export const MAX_JOGADORES = 16;
export const MIN_LIGADOS = 3;

export interface Dilema {
  autor: string;
  texto: string;
  a: string;
  b: string;
  fraseId?: string;
  enviadoEm: number;
  ultimoSegundo: boolean;
}

export interface Resultado {
  autor: string;
  texto: string;
  a: string;
  b: string;
  votosA: string[];
  votosB: string[];
  pontos: number;
  perfeito: boolean;
  ultimoSegundo: boolean;
  ronda: number;
}

export type Fase = 'escrever' | 'mostrar' | 'votar' | 'revelar' | 'placar' | 'fim';

export interface Estado5050 {
  def: Def5050;
  fase: Fase;
  ronda: number;
  terminaEm: number;
  /** ms que faltavam quando pausou (null = a correr) */
  pausaRestante: number | null;
  participantes: string[]; // pontuam
  audiencia: string[]; // votam, não pontuam
  ligados: string[];
  enviados: Record<string, Dilema>;
  fila: string[]; // autores por ordem de votação
  atual: number;
  votos: Record<string, Lado>;
  resultados: Resultado[];
  pontos: Record<string, number>;
  usadas: string[]; // frases do jogo já usadas nesta sessão
}

export type Acao5050 =
  | { tipo: 'enviar'; id: string; texto: string; a: string; b: string; fraseId?: string }
  | { tipo: 'votar'; id: string; lado: Lado }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'tick' };

export function novoJogo(ids: string[], def: Partial<Def5050>, agora: number, usadas: string[] = []): Estado5050 {
  const d0: Def5050 = { ...DEF_PADRAO, ...def };
  const d: Def5050 = d0.rondasAuto !== false && ids.length >= 10 ? { ...d0, rondas: 2 } : d0;
  const participantes = ids.slice(0, MAX_JOGADORES);
  return {
    def: d,
    fase: 'escrever',
    ronda: 1,
    terminaEm: agora + d.escrever * 1000,
    pausaRestante: null,
    participantes,
    audiencia: ids.slice(MAX_JOGADORES),
    ligados: [...ids],
    enviados: {},
    fila: [],
    atual: 0,
    votos: {},
    resultados: [],
    pontos: Object.fromEntries(participantes.map((id) => [id, 0])),
    usadas,
  };
}

export function calcularPontos(a: number, b: number, ultimaRonda: boolean): { pontos: number; perfeito: boolean } {
  const n = a + b;
  if (n === 0) return { pontos: 0, perfeito: false };
  const d = Math.abs(a - b);
  const perfeito = d <= 1;
  let p = Math.round(1000 * (1 - d / n)) + (perfeito ? 500 : 0);
  if (ultimaRonda) p *= 2;
  return { pontos: p, perfeito };
}

export function autorAtual(e: Estado5050): string | undefined {
  return e.fila[e.atual];
}

/** quem pode votar no dilema atual: ligado e não autor */
export function votantes(e: Estado5050): string[] {
  const autor = autorAtual(e);
  return [...e.participantes, ...e.audiencia].filter((id) => id !== autor && e.ligados.includes(id));
}

/**
 * quem aparece a votar (caixinhas ✅/❌): os votantes + o autor, que vê o mesmo ecrã e "vota" sem contar;
 * assim ninguém descobre o autor por ser o único sem caixinha
 */
export function aVotar(e: Estado5050): string[] {
  const autor = autorAtual(e);
  return [...e.participantes, ...e.audiencia].filter((id) => e.ligados.includes(id) && (id !== autor || e.participantes.includes(id)));
}

function fecharEscrever(e: Estado5050, agora: number): Estado5050 {
  const autores = e.participantes.filter((id) => e.enviados[id]);
  const fila = baralhar(autores, agora + e.ronda);
  const s = { ...e, fila, atual: 0, votos: {} };
  return fila.length ? irPara(s, 'mostrar', T_MOSTRAR, agora) : irPara(s, 'placar', T_PLACAR, agora);
}

function fecharVotar(e: Estado5050, agora: number): Estado5050 {
  const autor = autorAtual(e)!;
  const dil = e.enviados[autor];
  const validos = votantes(e); // quem desligou não conta
  const votosA = validos.filter((id) => e.votos[id] === 'a');
  const votosB = validos.filter((id) => e.votos[id] === 'b');
  const { pontos, perfeito } = calcularPontos(votosA.length, votosB.length, e.ronda === e.def.rondas);
  const r: Resultado = {
    autor,
    texto: dil.texto,
    a: dil.a,
    b: dil.b,
    votosA,
    votosB,
    pontos,
    perfeito,
    ultimoSegundo: dil.ultimoSegundo,
    ronda: e.ronda,
  };
  return irPara(
    { ...e, resultados: [...e.resultados, r], pontos: { ...e.pontos, [autor]: (e.pontos[autor] ?? 0) + pontos } },
    'revelar',
    T_REVELAR,
    agora,
  );
}

function avancar(e: Estado5050, agora: number): Estado5050 {
  switch (e.fase) {
    case 'escrever':
      return fecharEscrever(e, agora);
    case 'mostrar':
      return irPara({ ...e, votos: {} }, 'votar', e.def.votar, agora);
    case 'votar':
      return fecharVotar(e, agora);
    case 'revelar':
      return e.atual + 1 < e.fila.length
        ? irPara({ ...e, atual: e.atual + 1, votos: {} }, 'mostrar', T_MOSTRAR, agora)
        : irPara(e, 'placar', T_PLACAR, agora);
    case 'placar':
      if (e.ronda >= e.def.rondas) return irPara(e, 'fim', 0, agora);
      return irPara({ ...e, ronda: e.ronda + 1, enviados: {}, fila: [], atual: 0, votos: {} }, 'escrever', e.def.escrever, agora);
    default:
      return e;
  }
}

function todosResponderam(e: Estado5050): boolean {
  if (e.fase === 'escrever') {
    const l = e.participantes.filter((id) => e.ligados.includes(id));
    return l.length > 0 && l.every((id) => e.enviados[id]);
  }
  if (e.fase === 'votar') {
    const v = aVotar(e);
    return votantes(e).length > 0 && v.every((id) => e.votos[id]);
  }
  return false;
}

export function pausado(e: Estado5050): boolean {
  return e.pausaRestante !== null;
}

export function reduz5050(e: Estado5050, acao: Acao5050, agora: number): Estado5050 {
  switch (acao.tipo) {
    case 'ligados': {
      const s: Estado5050 = { ...e, ligados: acao.ids };
      if (s.fase === 'fim') return s;
      return pausaPorFalta(s, quantosLigados([...s.participantes, ...s.audiencia], acao.ids) < MIN_LIGADOS, agora);
    }
    case 'enviar': {
      if (e.fase !== 'escrever' || pausado(e) || !e.participantes.includes(acao.id)) return e;
      const texto = acao.texto.trim().slice(0, MAX_TEXTO);
      if (!texto) return e;
      const dil: Dilema = {
        autor: acao.id,
        texto,
        a: acao.a.trim().slice(0, MAX_RESPOSTA) || 'A',
        b: acao.b.trim().slice(0, MAX_RESPOSTA) || 'B',
        fraseId: acao.fraseId,
        enviadoEm: agora,
        ultimoSegundo: e.terminaEm - agora <= 5000,
      };
      const usadas = acao.fraseId && !e.usadas.includes(acao.fraseId) ? [...e.usadas, acao.fraseId] : e.usadas;
      const s = { ...e, enviados: { ...e.enviados, [acao.id]: dil }, usadas };
      return todosResponderam(s) ? avancar(s, agora) : s;
    }
    case 'votar': {
      // o autor também "vota" (não conta: fecharVotar só soma os votantes)
      if (e.fase !== 'votar' || pausado(e) || !aVotar(e).includes(acao.id)) return e;
      const s = { ...e, votos: { ...e.votos, [acao.id]: acao.lado } };
      return todosResponderam(s) ? avancar(s, agora) : s;
    }
    case 'tick': {
      if (pausado(e) || e.fase === 'fim') return e;
      return agora >= e.terminaEm ? avancar(e, agora) : e;
    }
  }
}

export type { Podio };

/** empates partilham o lugar */
export function podio(e: Estado5050): Podio[] {
  return podioComum(e.participantes, e.pontos);
}

export interface Premios {
  mestreDoMeio?: string;
  unanimidade?: string;
  ultimoSegundo?: string;
}

export function premios(e: Estado5050): Premios {
  const perf: Record<string, number> = {};
  for (const r of e.resultados) if (r.perfeito) perf[r.autor] = (perf[r.autor] ?? 0) + 1;
  const mestre = Object.entries(perf).sort((a, b) => b[1] - a[1])[0]?.[0];
  const unan = e.resultados.find(
    (r) => r.votosA.length + r.votosB.length >= 2 && (r.votosA.length === 0 || r.votosB.length === 0),
  );
  const ult = e.resultados.find((r) => r.ultimoSegundo);
  return { mestreDoMeio: mestre, unanimidade: unan?.autor, ultimoSegundo: ult?.autor };
}

/** vista pública: o autor só é revelado na fase revelar (antes só vai a tag secreta dele) */
export interface Vista5050 {
  def: Def5050;
  fase: Fase;
  ronda: number;
  /** dilema em votação (entra no contexto das marcas) */
  atual: number;
  terminaEm: number;
  restante: number | null;
  participantes: string[];
  enviaram: string[];
  votaram: string[];
  votantes: string[];
  dilema?: { texto: string; a: string; b: string; autorTag?: string };
  resultado?: Resultado;
  resultados: Resultado[];
  pontos: Record<string, number>;
  usadas: string[];
  podio: Podio[];
  premios: Premios;
}

/** com "Mostrar quem votou = Não" só vão as contagens (ids trocados por '') */
function anonimo(r: Resultado, mostrar: boolean): Resultado {
  return mostrar ? r : { ...r, votosA: r.votosA.map(() => ''), votosB: r.votosB.map(() => '') };
}

export function vista5050(e: Estado5050, tagDe: (id: string) => string | undefined): Vista5050 {
  const autor = autorAtual(e);
  const mv = e.def.mostrarVotos;
  const ultimo = e.resultados[e.resultados.length - 1];
  const dil = autor && ['mostrar', 'votar', 'revelar'].includes(e.fase) ? e.enviados[autor] : undefined;
  return {
    def: e.def,
    fase: e.fase,
    ronda: e.ronda,
    atual: e.atual,
    terminaEm: e.terminaEm,
    restante: e.pausaRestante,
    participantes: e.participantes,
    enviaram: Object.keys(e.enviados),
    votaram: Object.keys(e.votos),
    votantes: e.fase === 'votar' ? aVotar(e) : [],
    dilema: dil ? { texto: dil.texto, a: dil.a, b: dil.b, autorTag: tagDe(dil.autor) } : undefined,
    resultado: e.fase === 'revelar' && ultimo ? anonimo(ultimo, mv) : undefined,
    resultados: e.fase === 'fim' ? e.resultados.map((r) => anonimo(r, mv)) : [],
    pontos: e.pontos,
    usadas: e.usadas,
    podio: podio(e),
    premios: e.fase === 'fim' ? premios(e) : {},
  };
}
