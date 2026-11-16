import { baralhar } from '../../core/ids';

/** Pensa-Dores: regras em info/jogos/respostas-rapidas.md */

export interface DefPensa {
  rondas: number;
  final: boolean;
  escrever: number; // s
  votar: number; // s
  mostrarVotos: boolean;
}

export const DEF_PADRAO_PENSA: DefPensa = { rondas: 2, final: true, escrever: 90, votar: 15, mostrarVotos: true };
export const OPCOES_PENSA = {
  rondas: [1, 2, 3],
  escrever: [60, 90, 120],
  votar: [10, 15, 30],
};
export const MIN_JOGADORES = 4;
export const MAX_JOGADORES = 16;
export const MIN_LIGADOS = 3; // abaixo disto o jogo pausa
export const MAX_RESPOSTA = 150;
export const MAX_FINAL_GRANDE = 80; // final com mais de 8 jogadores
export const T_ESCREVER_FINAL = 60;
export const T_REVELAR = 6;
export const T_PLACAR = 8;
export const T_REVELAR_FINAL = 10;
export const VOTOS_FINAL = 3;
export const PONTOS_VOTO_FINAL = 300;
export const BONUS_ARRASOU = 250;

export interface Pergunta {
  id: string;
  pt: string;
  en: string;
}

export interface Duelo {
  pergunta: Pergunta;
  autores: string[]; // 2 (ou 3 no duelo a 3)
  /** autores com resposta, baralhados (ordem A/B/C); feito ao fechar a escrita */
  ordem: string[];
}

export interface ResOpcao {
  autor: string;
  texto: string;
  votos: string[];
  pontos: number;
  arrasou: boolean;
}

export interface ResDuelo {
  pergunta: Pergunta;
  opcoes: ResOpcao[];
  semAdversario: boolean;
  ronda: number;
}

export type FasePensa = 'escrever' | 'votar' | 'revelar' | 'placar' | 'final_escrever' | 'final_votar' | 'final_revelar' | 'fim';

export interface EstadoPensa {
  def: DefPensa;
  fase: FasePensa;
  ronda: number;
  terminaEm: number;
  pausaRestante: number | null;
  participantes: string[];
  audiencia: string[];
  ligados: string[];
  duelos: Duelo[];
  respostas: Record<number, Record<string, string>>; // duelo → autor → texto
  atual: number;
  votos: Record<string, string>; // votante → autor escolhido
  resultados: ResDuelo[];
  final: Pergunta | null;
  respostasFinal: Record<string, string>;
  ordemFinal: string[];
  votosFinal: Record<string, Record<string, number>>; // votante → autor → nº de votos
  resultadoFinal: ResOpcao[];
  pontos: Record<string, number>;
  usadas: string[];
  normais: Pergunta[];
  finais: Pergunta[];
}

export type AcaoPensa =
  | { tipo: 'responder'; id: string; duelo: number; texto: string }
  | { tipo: 'votar'; id: string; autor: string }
  | { tipo: 'votos_final'; id: string; votos: Record<string, number> }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'tick' };

/** 4–8: n perguntas, a i vai para i e i+1; 9–16: pares (ímpar = um duelo a 3) */
export function distribuir(ids: string[], seed: number): string[][] {
  const p = baralhar(ids, seed);
  const n = p.length;
  if (n <= 8) return p.map((_, i) => [p[i], p[(i + 1) % n]]);
  const g: string[][] = [];
  for (let i = 0; i + 1 < n; i += 2) g.push([p[i], p[i + 1]]);
  if (n % 2) g[g.length - 1].push(p[n - 1]);
  return g;
}

function escolher(pool: Pergunta[], usadas: string[], k: number, seed: number): Pergunta[] {
  const livres = pool.filter((q) => !usadas.includes(q.id));
  const base = baralhar(livres.length >= k ? livres : pool, seed);
  const out: Pergunta[] = [];
  for (let i = 0; i < k && base.length; i++) out.push(base[i % base.length]);
  return out;
}

function prepararRonda(e: EstadoPensa, agora: number): EstadoPensa {
  const grupos = distribuir(e.participantes, agora + e.ronda);
  const qs = escolher(e.normais, e.usadas, grupos.length, agora + e.ronda * 7);
  const duelos = grupos.map((autores, i) => ({ pergunta: qs[i] ?? { id: '?', pt: '?', en: '?' }, autores, ordem: [] }));
  return {
    ...e,
    fase: 'escrever',
    terminaEm: agora + e.def.escrever * 1000,
    duelos,
    respostas: {},
    atual: 0,
    votos: {},
    usadas: [...e.usadas, ...qs.map((q) => q.id).filter((id) => !e.usadas.includes(id))],
  };
}

export function novoPensa(
  ids: string[],
  def: Partial<DefPensa>,
  agora: number,
  normais: Pergunta[],
  finais: Pergunta[],
  usadas: string[] = [],
): EstadoPensa {
  const participantes = ids.slice(0, MAX_JOGADORES);
  const base: EstadoPensa = {
    def: { ...DEF_PADRAO_PENSA, ...def },
    fase: 'escrever',
    ronda: 1,
    terminaEm: 0,
    pausaRestante: null,
    participantes,
    audiencia: ids.slice(MAX_JOGADORES),
    ligados: [...ids],
    duelos: [],
    respostas: {},
    atual: 0,
    votos: {},
    resultados: [],
    final: null,
    respostasFinal: {},
    ordemFinal: [],
    votosFinal: {},
    resultadoFinal: [],
    pontos: Object.fromEntries(participantes.map((id) => [id, 0])),
    usadas,
    normais,
    finais,
  };
  return prepararRonda(base, agora);
}

/** ronda dupla: a última ronda normal (com 2+ rondas) vale ×2 */
export function multiplicador(e: Pick<EstadoPensa, 'ronda' | 'def'>): number {
  return e.def.rondas >= 2 && e.ronda === e.def.rondas ? 2 : 1;
}

/** 1000 × % de votos; 100% = +250 "Arrasou"; tudo × mult */
export function pontosDuelo(votos: number[], mult: number): { pontos: number[]; arrasou: boolean[] } {
  const total = votos.reduce((a, b) => a + b, 0);
  const arrasou = votos.map((v) => total > 0 && v === total);
  const pontos = votos.map((v, i) => (total ? Math.round((1000 * v) / total) : 0) + (arrasou[i] ? BONUS_ARRASOU : 0)).map((p) => p * mult);
  return { pontos, arrasou };
}

export function maxFinal(e: Pick<EstadoPensa, 'participantes'>): number {
  return e.participantes.length > 8 ? MAX_FINAL_GRANDE : MAX_RESPOSTA;
}

const todos = (e: EstadoPensa) => [...e.participantes, ...e.audiencia];

/** quem vota no duelo atual: ligado e não autor */
export function votantes(e: EstadoPensa): string[] {
  const d = e.duelos[e.atual];
  return todos(e).filter((id) => e.ligados.includes(id) && !d?.autores.includes(id));
}

export function votantesFinal(e: EstadoPensa): string[] {
  return todos(e).filter((id) => e.ligados.includes(id));
}

/** já respondeu a todas as perguntas que lhe calharam */
export function acabouEscrever(e: EstadoPensa, id: string): boolean {
  if (e.fase === 'final_escrever') return !!e.respostasFinal[id];
  return e.duelos.every((d, i) => !d.autores.includes(id) || !!e.respostas[i]?.[id]);
}

function irPara(e: EstadoPensa, fase: FasePensa, segundos: number, agora: number): EstadoPensa {
  return { ...e, fase, terminaEm: fase === 'fim' ? 0 : agora + segundos * 1000 };
}

function somar(pontos: Record<string, number>, opcoes: ResOpcao[]): Record<string, number> {
  const p = { ...pontos };
  for (const o of opcoes) p[o.autor] = (p[o.autor] ?? 0) + o.pontos;
  return p;
}

/** procura o próximo duelo jogável a partir de `de` (saltando os sem respostas) */
function irParaDuelo(e: EstadoPensa, de: number, agora: number): EstadoPensa {
  for (let i = de; i < e.duelos.length; i++) {
    const d = e.duelos[i];
    if (d.ordem.length === 0) continue; // nenhum respondeu: salta-se
    const s = { ...e, atual: i, votos: {} };
    if (d.ordem.length === 1) {
      // adversário sem resposta: ganha 100% sem bónus, não se vota
      const autor = d.ordem[0];
      const op: ResOpcao = { autor, texto: e.respostas[i][autor], votos: [], pontos: 1000 * multiplicador(e), arrasou: false };
      const r: ResDuelo = { pergunta: d.pergunta, opcoes: [op], semAdversario: true, ronda: e.ronda };
      return irPara({ ...s, resultados: [...e.resultados, r], pontos: somar(e.pontos, [op]) }, 'revelar', T_REVELAR, agora);
    }
    return irPara(s, 'votar', e.def.votar, agora);
  }
  return irPara({ ...e, votos: {} }, 'placar', T_PLACAR, agora);
}

function fecharEscrever(e: EstadoPensa, agora: number): EstadoPensa {
  const duelos = e.duelos.map((d, i) => ({
    ...d,
    ordem: baralhar(
      d.autores.filter((a) => e.respostas[i]?.[a]),
      agora + i,
    ),
  }));
  return irParaDuelo({ ...e, duelos }, 0, agora);
}

function fecharVotar(e: EstadoPensa, agora: number): EstadoPensa {
  const d = e.duelos[e.atual];
  const validos = votantes(e);
  const votos = d.ordem.map((a) => validos.filter((v) => e.votos[v] === a));
  const { pontos, arrasou } = pontosDuelo(
    votos.map((v) => v.length),
    multiplicador(e),
  );
  const opcoes = d.ordem.map((autor, i) => ({ autor, texto: e.respostas[e.atual][autor], votos: votos[i], pontos: pontos[i], arrasou: arrasou[i] }));
  const r: ResDuelo = { pergunta: d.pergunta, opcoes, semAdversario: false, ronda: e.ronda };
  return irPara({ ...e, resultados: [...e.resultados, r], pontos: somar(e.pontos, opcoes) }, 'revelar', T_REVELAR, agora);
}

function iniciarFinal(e: EstadoPensa, agora: number): EstadoPensa {
  const [q] = escolher(e.finais, e.usadas, 1, agora);
  if (!q) return irPara(e, 'fim', 0, agora);
  return irPara(
    { ...e, final: q, usadas: e.usadas.includes(q.id) ? e.usadas : [...e.usadas, q.id], respostasFinal: {}, votosFinal: {}, ordemFinal: [] },
    'final_escrever',
    T_ESCREVER_FINAL,
    agora,
  );
}

function fecharFinal(e: EstadoPensa, agora: number): EstadoPensa {
  const validos = votantesFinal(e);
  const opcoes: ResOpcao[] = e.ordemFinal.map((autor) => {
    const votos: string[] = [];
    for (const v of validos) for (let k = 0; k < (e.votosFinal[v]?.[autor] ?? 0); k++) votos.push(v);
    return { autor, texto: e.respostasFinal[autor], votos, pontos: votos.length * PONTOS_VOTO_FINAL, arrasou: false };
  });
  return irPara({ ...e, resultadoFinal: opcoes, pontos: somar(e.pontos, opcoes) }, 'final_revelar', T_REVELAR_FINAL, agora);
}

/** tempo para distribuir os 3 votos da final */
export function tempoVotarFinal(def: DefPensa): number {
  return def.votar * 2;
}

function avancar(e: EstadoPensa, agora: number): EstadoPensa {
  switch (e.fase) {
    case 'escrever':
      return fecharEscrever(e, agora);
    case 'votar':
      return fecharVotar(e, agora);
    case 'revelar':
      return irParaDuelo(e, e.atual + 1, agora);
    case 'placar':
      if (e.ronda < e.def.rondas) return prepararRonda({ ...e, ronda: e.ronda + 1 }, agora);
      return e.def.final ? iniciarFinal(e, agora) : irPara(e, 'fim', 0, agora);
    case 'final_escrever': {
      const ordem = baralhar(
        e.participantes.filter((id) => e.respostasFinal[id]),
        agora,
      );
      if (!ordem.length) return irPara(e, 'fim', 0, agora);
      return irPara({ ...e, ordemFinal: ordem }, 'final_votar', tempoVotarFinal(e.def), agora);
    }
    case 'final_votar':
      return fecharFinal(e, agora);
    case 'final_revelar':
      return irPara(e, 'fim', 0, agora);
    default:
      return e;
  }
}

const somaVotos = (v: Record<string, number> | undefined) => Object.values(v ?? {}).reduce((a, b) => a + b, 0);

function todosResponderam(e: EstadoPensa): boolean {
  if (e.fase === 'escrever' || e.fase === 'final_escrever') {
    const l = e.participantes.filter((id) => e.ligados.includes(id));
    return l.length > 0 && l.every((id) => acabouEscrever(e, id));
  }
  if (e.fase === 'votar') {
    const v = votantes(e);
    return v.length > 0 && v.every((id) => e.votos[id]);
  }
  if (e.fase === 'final_votar') {
    const v = votantesFinal(e);
    // quem só tem a própria resposta para votar não fica à espera
    return v.length > 0 && v.every((id) => somaVotos(e.votosFinal[id]) >= (e.ordemFinal.some((a) => a !== id) ? VOTOS_FINAL : 0));
  }
  return false;
}

/** o telemóvel não sabe os autores: manda a posição `#i` (A=0, B=1…) */
function porPosicao(ordem: string[], chave: string): string {
  return chave.startsWith('#') ? (ordem[Number(chave.slice(1))] ?? '') : chave;
}

export function pausadoPensa(e: EstadoPensa): boolean {
  return e.pausaRestante !== null;
}

export function reduzPensa(e: EstadoPensa, acao: AcaoPensa, agora: number): EstadoPensa {
  switch (acao.tipo) {
    case 'ligados': {
      let s: EstadoPensa = { ...e, ligados: acao.ids };
      const n = todos(s).filter((id) => acao.ids.includes(id)).length;
      if (s.fase !== 'fim') {
        if (n < MIN_LIGADOS && s.pausaRestante === null) s = { ...s, pausaRestante: Math.max(0, s.terminaEm - agora) };
        else if (n >= MIN_LIGADOS && s.pausaRestante !== null) s = { ...s, terminaEm: agora + s.pausaRestante, pausaRestante: null };
      }
      return s;
    }
    case 'responder': {
      if (pausadoPensa(e)) return e;
      if (e.fase === 'final_escrever') {
        if (!e.participantes.includes(acao.id)) return e;
        const texto = acao.texto.trim().slice(0, maxFinal(e));
        if (!texto) return e;
        const s = { ...e, respostasFinal: { ...e.respostasFinal, [acao.id]: texto } };
        return todosResponderam(s) ? avancar(s, agora) : s;
      }
      if (e.fase !== 'escrever' || !e.duelos[acao.duelo]?.autores.includes(acao.id)) return e;
      const texto = acao.texto.trim().slice(0, MAX_RESPOSTA);
      if (!texto) return e;
      const s = { ...e, respostas: { ...e.respostas, [acao.duelo]: { ...e.respostas[acao.duelo], [acao.id]: texto } } };
      return todosResponderam(s) ? avancar(s, agora) : s;
    }
    case 'votar': {
      if (e.fase !== 'votar' || pausadoPensa(e) || !votantes(e).includes(acao.id)) return e;
      const autor = porPosicao(e.duelos[e.atual].ordem, acao.autor);
      if (!e.duelos[e.atual].ordem.includes(autor)) return e;
      const s = { ...e, votos: { ...e.votos, [acao.id]: autor } };
      return todosResponderam(s) ? avancar(s, agora) : s;
    }
    case 'votos_final': {
      if (e.fase !== 'final_votar' || pausadoPensa(e) || !votantesFinal(e).includes(acao.id)) return e;
      const limpo: Record<string, number> = {};
      let soma = 0;
      for (const [chave, n] of Object.entries(acao.votos)) {
        const autor = porPosicao(e.ordemFinal, chave);
        const k = Math.max(0, Math.floor(n));
        if (!k) continue;
        if (autor === acao.id || !e.ordemFinal.includes(autor)) return e; // a própria não se vota
        limpo[autor] = k;
        soma += k;
      }
      if (soma > VOTOS_FINAL) return e;
      const s = { ...e, votosFinal: { ...e.votosFinal, [acao.id]: limpo } };
      return todosResponderam(s) ? avancar(s, agora) : s;
    }
    case 'tick':
      if (pausadoPensa(e) || e.fase === 'fim') return e;
      return agora >= e.terminaEm ? avancar(e, agora) : e;
  }
}

export interface PodioPensa {
  id: string;
  pontos: number;
  lugar: number;
}

export function podioPensa(e: Pick<EstadoPensa, 'participantes' | 'pontos'>): PodioPensa[] {
  const lista = e.participantes.map((id) => ({ id, pontos: e.pontos[id] ?? 0 })).sort((x, y) => y.pontos - x.pontos);
  return lista.map((p) => ({ ...p, lugar: lista.findIndex((q) => q.pontos === p.pontos) + 1 }));
}

/** vista pública: os autores só aparecem na revelação (antes só vai a tag secreta, para "é a tua") */
export interface OpcaoVista {
  texto: string;
  tag?: string;
}

export interface VistaPensa {
  def: DefPensa;
  fase: FasePensa;
  ronda: number;
  terminaEm: number;
  restante: number | null;
  participantes: string[];
  audiencia: string[];
  /** escrever: a pergunta de cada duelo e quem responde */
  duelos: { pergunta: Pergunta; autores: string[] }[];
  enviaram: string[];
  votaram: string[];
  votantes: string[];
  atual: number;
  pergunta?: Pergunta;
  opcoes: OpcaoVista[]; // votar (A/B/C) ou final_votar (grelha)
  resultado?: ResDuelo;
  resultadoFinal: ResOpcao[];
  maxFinal: number;
  pontos: Record<string, number>;
  podio: PodioPensa[];
  usadas: string[];
}

export function vistaPensa(e: EstadoPensa, tagDe: (id: string) => string | undefined): VistaPensa {
  const d = e.duelos[e.atual];
  const emDuelo = e.fase === 'votar' || e.fase === 'revelar';
  const final = e.fase.startsWith('final');
  let opcoes: OpcaoVista[] = [];
  if (e.fase === 'votar' && d) opcoes = d.ordem.map((a) => ({ texto: e.respostas[e.atual][a], tag: tagDe(a) }));
  if (e.fase === 'final_votar') opcoes = e.ordemFinal.map((a) => ({ texto: e.respostasFinal[a], tag: tagDe(a) }));
  const votaram =
    e.fase === 'final_votar'
      ? Object.entries(e.votosFinal)
          .filter(([, v]) => somaVotos(v) >= VOTOS_FINAL)
          .map(([id]) => id)
      : Object.keys(e.votos);
  return {
    def: e.def,
    fase: e.fase,
    ronda: e.ronda,
    terminaEm: e.terminaEm,
    restante: e.pausaRestante,
    participantes: e.participantes,
    audiencia: e.audiencia,
    duelos: e.fase === 'escrever' ? e.duelos.map((x) => ({ pergunta: x.pergunta, autores: x.autores })) : [],
    enviaram: e.participantes.filter((id) => (e.fase === 'escrever' || e.fase === 'final_escrever') && acabouEscrever(e, id)),
    votaram,
    votantes: e.fase === 'votar' ? votantes(e) : e.fase === 'final_votar' ? votantesFinal(e) : [],
    atual: e.atual,
    pergunta: final ? (e.final ?? undefined) : emDuelo ? d?.pergunta : undefined,
    opcoes,
    resultado: e.fase === 'revelar' ? e.resultados[e.resultados.length - 1] : undefined,
    resultadoFinal: e.fase === 'final_revelar' || e.fase === 'fim' ? e.resultadoFinal : [],
    maxFinal: maxFinal(e),
    pontos: e.pontos,
    podio: podioPensa(e),
    usadas: e.usadas,
  };
}
