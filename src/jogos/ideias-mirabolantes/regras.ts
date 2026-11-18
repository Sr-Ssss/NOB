import { baralhar } from '../../core/ids';
import { irPara, pausaPorFalta, podio, quantosLigados, type Podio } from '../../core/jogo';
import type { Idioma } from '../../core/sala';
import { limparTracos, type Traco } from '../../ui/tracos';

/** Ideias Mirabolantes: regras em info/jogos/invencoes-inuteis.md */

export interface DefIdeias {
  inventar: number; // s
  pitch: number; // s
  /** null = padrão (≤8: todos; >8: 8 sorteados) */
  quem: 'todos' | 'sorteados' | null;
}

export const DEF_PADRAO_IDEIAS: DefIdeias = { inventar: 120, pitch: 45, quem: null };
export const OPCOES_IDEIAS = { inventar: [90, 120, 180], pitch: [30, 45, 60] };
export const MIN_JOGADORES = 3;
export const MAX_JOGADORES = 16;
export const MIN_LIGADOS = 3; // abaixo disto o jogo pausa
export const MAX_SORTEADOS = 8;
export const MAX_PROBLEMA = 80;
export const MAX_NOME = 40;
export const MAX_SLOGAN = 80;
export const T_PROBLEMA = 45;
export const T_INVESTIR = 30;
export const T_REVELAR = 12;
export const NOTAS = 3;
export const VALOR_NOTA = 100; // €
export const PONTOS_POR_EURO = 10;
export const BONUS_VENCEDORA = 1000;
export const BONUS_PROBLEMA = 300;
export const ETAPAS = 3; // problema → desenho → nome + slogan
export const TIPOS_IDEIAS = ['im_problema', 'im_invencao', 'im_etapa', 'im_acabei', 'im_investir'];

export interface Problema {
  id: string;
  pt: string;
  en: string;
}

export interface Invencao {
  tracos: Traco[];
  nome: string;
  slogan: string;
}

export type FaseIdeias = 'problema' | 'inventar' | 'pitch' | 'investir' | 'revelar' | 'fim';

export interface EstadoIdeias {
  def: DefIdeias;
  fase: FaseIdeias;
  terminaEm: number;
  pausaRestante: number | null;
  participantes: string[];
  audiencia: string[];
  ligados: string[];
  idioma: Idioma;
  /** quem apresenta (todos ou 8 sorteados) */
  apresentadores: string[];
  /** problema sorteado para cada participante */
  sorteados: Record<string, Problema>;
  /** problema enviado (editado) de cada participante */
  problemas: Record<string, string>;
  /** apresentador → autor do problema que recebeu (derangement) */
  recebeu: Record<string, string>;
  invencoes: Record<string, Invencao>;
  /** quem apresenta, pela ordem do pitch (só quem enviou) */
  ordem: string[];
  atual: number;
  etapa: number;
  /** investidor → (inventor → nº de notas) */
  investimentos: Record<string, Record<string, number>>;
  confirmados: string[];
  pontos: Record<string, number>;
  usadas: string[];
  conteudo: Problema[];
}

export type AcaoIdeias =
  | { tipo: 'im_problema'; id: string; texto: string }
  | { tipo: 'im_invencao'; id: string; tracos: Traco[]; nome: string; slogan: string }
  | { tipo: 'im_etapa'; id: string; etapa: number }
  | { tipo: 'im_acabei'; id: string }
  | { tipo: 'im_investir'; id: string; notas: Record<string, number>; confirmar?: boolean }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'tick' };

const textoP = (p: Problema, i: Idioma) => (i === 'en' ? p.en : p.pt);

export function sorteiaApresentadores(n: number, quem: DefIdeias['quem']): boolean {
  return n > MAX_SORTEADOS && quem !== 'todos';
}

export function novoIdeias(ids: string[], def: Partial<DefIdeias>, agora: number, conteudo: Problema[], idioma: Idioma = 'pt-BR', usadas: string[] = []): EstadoIdeias {
  const participantes = ids.slice(0, MAX_JOGADORES);
  const d = { ...DEF_PADRAO_IDEIAS, ...def };
  const apresentadores = sorteiaApresentadores(participantes.length, d.quem) ? baralhar(participantes, agora + 5).slice(0, MAX_SORTEADOS) : [...participantes];
  const livres = conteudo.filter((p) => !usadas.includes(p.id));
  const base = baralhar(livres.length >= participantes.length ? livres : conteudo, agora + 17);
  const sorteados: Record<string, Problema> = {};
  participantes.forEach((id, i) => (sorteados[id] = base[i % Math.max(1, base.length)] ?? { id: '?', pt: '?', en: '?' }));
  // roda sorteada: cada um recebe o problema do seguinte (nunca o seu)
  const roda = baralhar(participantes, agora + 29);
  const recebeu: Record<string, string> = {};
  roda.forEach((id, k) => {
    if (apresentadores.includes(id)) recebeu[id] = roda[(k + 1) % roda.length];
  });
  return irPara(
    {
      def: d,
      fase: 'problema',
      terminaEm: 0,
      pausaRestante: null,
      participantes,
      audiencia: ids.slice(MAX_JOGADORES),
      ligados: [...ids],
      idioma,
      apresentadores,
      sorteados,
      problemas: {},
      recebeu,
      invencoes: {},
      ordem: [],
      atual: 0,
      etapa: 0,
      investimentos: {},
      confirmados: [],
      pontos: Object.fromEntries(participantes.map((id) => [id, 0])),
      usadas: [...usadas, ...Object.values(sorteados).map((p) => p.id).filter((x, i, a) => a.indexOf(x) === i && !usadas.includes(x))],
      conteudo,
    },
    'problema',
    T_PROBLEMA,
    agora,
  );
}

const todos = (e: EstadoIdeias) => [...e.participantes, ...e.audiencia];

/** o problema (texto) de um autor: o enviado, ou o sorteado */
export function problemaDe(e: EstadoIdeias, autor: string): string {
  const s = e.sorteados[autor];
  return e.problemas[autor] ?? (s ? textoP(s, e.idioma) : '?');
}

export const inventorAtual = (e: EstadoIdeias): string | undefined => e.ordem[e.atual];

/** quem pode investir: ligados (jogadores e audiência) com pelo menos uma invenção que não é sua */
export function investidores(e: EstadoIdeias): string[] {
  return todos(e).filter((id) => e.ligados.includes(id) && e.ordem.some((x) => x !== id));
}

/** valida as notas: só em invenções dos outros, inteiras, no máximo 3 no total */
export function notasValidas(e: EstadoIdeias, id: string, notas: Record<string, number>): Record<string, number> | null {
  const out: Record<string, number> = {};
  let soma = 0;
  for (const [inv, n] of Object.entries(notas ?? {})) {
    const k = Math.floor(Number(n) || 0);
    if (k <= 0) continue;
    if (inv === id || !e.ordem.includes(inv)) return null;
    out[inv] = k;
    soma += k;
  }
  return soma <= NOTAS ? out : null;
}

/** € recebidos por cada invenção */
export function dinheiro(e: EstadoIdeias): Record<string, number> {
  const d: Record<string, number> = Object.fromEntries(e.ordem.map((id) => [id, 0]));
  for (const [inv, notas] of Object.entries(e.investimentos)) {
    if (!todos(e).includes(inv)) continue;
    for (const [alvo, n] of Object.entries(notas)) if (alvo in d) d[alvo] += n * VALOR_NOTA;
  }
  return d;
}

/** as mais financiadas (empatadas, todas); nenhuma se ninguém investiu */
export function vencedoras(e: EstadoIdeias): string[] {
  const d = dinheiro(e);
  const max = Math.max(0, ...Object.values(d));
  return max > 0 ? e.ordem.filter((id) => d[id] === max) : [];
}

/** pontos da partida (ver invencoes-inuteis.md → Pontos) */
export function pontuar(e: EstadoIdeias): Record<string, number> {
  const g: Record<string, number> = Object.fromEntries(e.participantes.map((id) => [id, 0]));
  const somar = (id: string, n: number) => {
    if (id in g) g[id] += n;
  };
  const d = dinheiro(e);
  for (const [id, eur] of Object.entries(d)) somar(id, eur * PONTOS_POR_EURO);
  for (const v of vencedoras(e)) {
    somar(v, BONUS_VENCEDORA);
    const autor = e.recebeu[v];
    if (autor) somar(autor, BONUS_PROBLEMA);
  }
  return g;
}

function fecharProblema(e: EstadoIdeias, agora: number): EstadoIdeias {
  return irPara(e, 'inventar', e.def.inventar, agora);
}

function fecharInventar(e: EstadoIdeias, agora: number): EstadoIdeias {
  // quem não enviou não apresenta
  const ordem = baralhar(
    e.apresentadores.filter((id) => e.invencoes[id]),
    agora + 7,
  );
  const s = { ...e, ordem, atual: 0, etapa: 0 };
  if (!ordem.length) return irParaRevelar(s, agora);
  return irPara(s, 'pitch', e.def.pitch, agora);
}

function irParaRevelar(e: EstadoIdeias, agora: number): EstadoIdeias {
  const g = pontuar(e);
  const pontos = { ...e.pontos };
  for (const [id, n] of Object.entries(g)) pontos[id] = (pontos[id] ?? 0) + n;
  return irPara({ ...e, pontos }, 'revelar', T_REVELAR, agora);
}

function proximoPitch(e: EstadoIdeias, agora: number): EstadoIdeias {
  const i = e.atual + 1;
  if (i < e.ordem.length) return irPara({ ...e, atual: i, etapa: 0 }, 'pitch', e.def.pitch, agora);
  // investir só faz sentido se alguém puder investir
  return irPara({ ...e, investimentos: {}, confirmados: [] }, 'investir', T_INVESTIR, agora);
}

function avancar(e: EstadoIdeias, agora: number): EstadoIdeias {
  switch (e.fase) {
    case 'problema':
      return fecharProblema(e, agora);
    case 'inventar':
      return fecharInventar(e, agora);
    case 'pitch':
      return proximoPitch(e, agora);
    case 'investir':
      return irParaRevelar(e, agora);
    case 'revelar':
      return irPara(e, 'fim', 0, agora);
    default:
      return e;
  }
}

function todosResponderam(e: EstadoIdeias): boolean {
  if (e.fase === 'problema') {
    const l = e.participantes.filter((id) => e.ligados.includes(id));
    return l.length > 0 && l.every((id) => e.problemas[id] !== undefined);
  }
  if (e.fase === 'inventar') {
    const l = e.apresentadores.filter((id) => e.ligados.includes(id));
    return l.length > 0 && l.every((id) => e.invencoes[id]);
  }
  if (e.fase === 'investir') {
    const l = investidores(e);
    return l.length > 0 && l.every((id) => e.confirmados.includes(id));
  }
  return false;
}

export function pausadoIdeias(e: EstadoIdeias): boolean {
  return e.pausaRestante !== null;
}

export function reduzIdeias(e: EstadoIdeias, acao: AcaoIdeias, agora: number): EstadoIdeias {
  switch (acao.tipo) {
    case 'ligados': {
      const s: EstadoIdeias = { ...e, ligados: acao.ids };
      if (s.fase === 'fim') return s;
      return pausaPorFalta(s, quantosLigados(todos(s), acao.ids) < MIN_LIGADOS, agora);
    }
    case 'im_problema': {
      if (e.fase !== 'problema' || pausadoIdeias(e) || !e.participantes.includes(acao.id)) return e;
      const texto = String(acao.texto ?? '').trim().slice(0, MAX_PROBLEMA);
      const s0 = e.sorteados[acao.id];
      const s = { ...e, problemas: { ...e.problemas, [acao.id]: texto || (s0 ? textoP(s0, e.idioma) : '?') } };
      return todosResponderam(s) ? avancar(s, agora) : s;
    }
    case 'im_invencao': {
      if (e.fase !== 'inventar' || pausadoIdeias(e) || !e.apresentadores.includes(acao.id)) return e;
      const tracos = limparTracos(acao.tracos);
      const nome = String(acao.nome ?? '').trim().slice(0, MAX_NOME);
      const slogan = String(acao.slogan ?? '').trim().slice(0, MAX_SLOGAN);
      if (!tracos.length || !nome) return e;
      const s = { ...e, invencoes: { ...e.invencoes, [acao.id]: { tracos, nome, slogan } } };
      return todosResponderam(s) ? avancar(s, agora) : s;
    }
    case 'im_etapa': {
      if (e.fase !== 'pitch' || pausadoIdeias(e) || inventorAtual(e) !== acao.id) return e;
      const etapa = Math.max(0, Math.min(ETAPAS - 1, Math.floor(Number(acao.etapa) || 0)));
      return { ...e, etapa };
    }
    case 'im_acabei': {
      if (e.fase !== 'pitch' || pausadoIdeias(e) || inventorAtual(e) !== acao.id || e.etapa < ETAPAS - 1) return e;
      return proximoPitch(e, agora);
    }
    case 'im_investir': {
      if (e.fase !== 'investir' || pausadoIdeias(e) || !investidores(e).includes(acao.id) || e.confirmados.includes(acao.id)) return e;
      const notas = notasValidas(e, acao.id, acao.notas);
      if (!notas) return e;
      const soma = Object.values(notas).reduce((a, b) => a + b, 0);
      const confirmar = !!acao.confirmar && soma === NOTAS;
      const s = { ...e, investimentos: { ...e.investimentos, [acao.id]: notas }, confirmados: confirmar ? [...e.confirmados, acao.id] : e.confirmados };
      return todosResponderam(s) ? avancar(s, agora) : s;
    }
    case 'tick':
      if (pausadoIdeias(e) || e.fase === 'fim') return e;
      return agora >= e.terminaEm ? avancar(e, agora) : e;
  }
}

export type PodioIdeias = Podio;

export function podioIdeias(e: Pick<EstadoIdeias, 'participantes' | 'pontos'>): PodioIdeias[] {
  return podio(e.participantes, e.pontos);
}

export interface CartaoInvencao {
  inventor: string;
  nome: string;
  slogan: string;
  problema: string;
}

export interface LinhaRanking extends CartaoInvencao {
  euros: number;
  vencedora: boolean;
  /** autor do problema */
  autor: string;
  tracos: Traco[];
}

/** vista pública (sem os investimentos antes da revelação) */
export interface VistaIdeias {
  def: DefIdeias;
  fase: FaseIdeias;
  terminaEm: number;
  restante: number | null;
  participantes: string[];
  audiencia: string[];
  apresentadores: string[];
  /** problema: o sorteado de cada um, pela tag */
  sorteados: Record<string, Problema>;
  /** inventar: o problema que cada apresentador recebeu, pela tag */
  recebidos: Record<string, string>;
  enviaram: string[];
  espera: string[];
  atual: number;
  total: number;
  etapa: number;
  /** pitch: a invenção em palco, até à etapa atual */
  pitch: { inventor: string; problema: string; tracos: Traco[] | null; nome: string | null; slogan: string | null } | null;
  /** investir: cartões das invenções */
  cartoes: CartaoInvencao[];
  /** revelar e fim: ranking por € */
  ranking: LinhaRanking[];
  pontos: Record<string, number>;
  podio: PodioIdeias[];
  usadas: string[];
}

export function vistaIdeias(e: EstadoIdeias, tagDe: (id: string) => string | undefined): VistaIdeias {
  const porTag = <T,>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).flatMap(([id, x]) => (tagDe(id) ? [[tagDe(id)!, x]] : [])));
  let enviaram: string[] = [];
  let espera: string[] = [];
  if (e.fase === 'problema') {
    espera = e.participantes;
    enviaram = Object.keys(e.problemas);
  } else if (e.fase === 'inventar') {
    espera = e.apresentadores;
    enviaram = Object.keys(e.invencoes);
  } else if (e.fase === 'investir') {
    espera = investidores(e);
    enviaram = e.confirmados;
  }
  const inv = inventorAtual(e);
  const cartao = (id: string): CartaoInvencao => ({ inventor: id, nome: e.invencoes[id].nome, slogan: e.invencoes[id].slogan, problema: problemaDe(e, e.recebeu[id]) });
  const d = e.fase === 'revelar' || e.fase === 'fim' ? dinheiro(e) : {};
  const venc = e.fase === 'revelar' || e.fase === 'fim' ? vencedoras(e) : [];
  return {
    def: e.def,
    fase: e.fase,
    terminaEm: e.terminaEm,
    restante: e.pausaRestante,
    participantes: e.participantes,
    audiencia: e.audiencia,
    apresentadores: e.apresentadores,
    sorteados: e.fase === 'problema' ? porTag(e.sorteados) : {},
    recebidos: e.fase === 'inventar' ? porTag(Object.fromEntries(Object.entries(e.recebeu).map(([id, a]) => [id, problemaDe(e, a)]))) : {},
    enviaram,
    espera,
    atual: e.atual,
    total: e.ordem.length,
    etapa: e.etapa,
    pitch:
      e.fase === 'pitch' && inv
        ? {
            inventor: inv,
            problema: problemaDe(e, e.recebeu[inv]),
            tracos: e.etapa >= 1 ? e.invencoes[inv].tracos : null,
            nome: e.etapa >= 2 ? e.invencoes[inv].nome : null,
            slogan: e.etapa >= 2 ? e.invencoes[inv].slogan : null,
          }
        : null,
    cartoes: e.fase === 'investir' ? e.ordem.map(cartao) : [],
    ranking:
      e.fase === 'revelar' || e.fase === 'fim'
        ? e.ordem
            .map((id) => ({ ...cartao(id), euros: d[id] ?? 0, vencedora: venc.includes(id), autor: e.recebeu[id], tracos: venc.includes(id) ? e.invencoes[id].tracos : [] }))
            .sort((x, y) => y.euros - x.euros)
        : [],
    pontos: e.pontos,
    podio: podioIdeias(e),
    usadas: e.usadas,
  };
}
