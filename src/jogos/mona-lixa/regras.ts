import { baralhar } from '../../core/ids';
import { irPara, normalizar, pausaPorFalta, podio, quantosLigados, type Podio } from '../../core/jogo';
import type { Idioma } from '../../core/sala';
import { limparTracos, type Traco } from '../../ui/tracos';

/** Mona Lixa: regras em info/jogos/rabiscos.md */

export interface DefMona {
  /** null = padrão (2; com ≥9 jogadores, 1) */
  rondas: number | null;
  desenhar: number; // s
  inventar: number; // s
}

export const DEF_PADRAO_MONA: DefMona = { rondas: null, desenhar: 75, inventar: 40 };
export const OPCOES_MONA = {
  rondas: [1, 2, 3],
  desenhar: [45, 75, 120],
  inventar: [30, 40, 60],
};
export const MIN_JOGADORES = 3;
export const MAX_JOGADORES = 16;
export const MIN_LIGADOS = 3; // abaixo disto o jogo pausa
export const MAX_TITULO = 60;
export const MAX_OPCOES = 8;
export const T_ESCOLHER = 20;
export const T_REVELAR = 10;
export const T_PLACAR = 8;
export const PONTOS_ACERTO = 1000;
export const PONTOS_ENGANO = 500;
export const PONTOS_AUTOR = 500;
export const TIPOS_MONA = ['ml_desenho', 'ml_falso', 'ml_escolher'];

export interface Titulo {
  id: string;
  pt: string;
  en: string;
}

export interface ConteudoMona {
  desenhos: Titulo[];
  falsos: Titulo[];
}

export interface Desenho {
  autor: string;
  titulo: string;
  tracos: Traco[];
}

export interface Opcao {
  texto: string;
  verdadeiro: boolean;
  casa: boolean;
  /** quem escreveu este título (o autor do desenho, se verdadeiro; vazio = da casa) */
  autores: string[];
}

export interface OpcaoRevelada extends Opcao {
  escolheram: string[];
  pontos: number;
}

export type FaseMona = 'desenhar' | 'inventar' | 'escolher' | 'revelar' | 'placar' | 'fim';

export interface EstadoMona {
  def: DefMona;
  rondas: number;
  fase: FaseMona;
  ronda: number;
  terminaEm: number;
  pausaRestante: number | null;
  participantes: string[];
  audiencia: string[];
  ligados: string[];
  idioma: Idioma;
  /** título sorteado para cada jogador nesta ronda */
  sorteados: Record<string, Titulo>;
  desenhos: Record<string, Desenho>;
  /** autores dos desenhos desta ronda, pela ordem em que aparecem */
  ordem: string[];
  atual: number;
  falsos: Record<string, string>;
  /** quem mandou um falso igual ao verdadeiro: a app pede outro */
  recusados: string[];
  casa: Titulo | null;
  opcoes: Opcao[];
  escolhas: Record<string, number>;
  revelacao: OpcaoRevelada[];
  pontos: Record<string, number>;
  usadas: string[];
  conteudo: ConteudoMona;
}

export type AcaoMona =
  | { tipo: 'ml_desenho'; id: string; tracos: Traco[]; titulo?: string }
  | { tipo: 'ml_falso'; id: string; texto: string }
  | { tipo: 'ml_escolher'; id: string; i: number }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'tick' };

export const normal = normalizar;

export function rondasPadrao(n: number): number {
  return n >= 9 ? 1 : 2;
}

const textoT = (x: Titulo, i: Idioma) => (i === 'en' ? x.en : x.pt);

function sortear(pool: Titulo[], usadas: string[], k: number, seed: number): Titulo[] {
  const livres = pool.filter((q) => !usadas.includes(q.id));
  const base = baralhar(livres.length >= k ? livres : pool, seed);
  const out: Titulo[] = [];
  for (let i = 0; i < k && base.length; i++) out.push(base[i % base.length]);
  return out;
}

function prepararRonda(e: EstadoMona, agora: number): EstadoMona {
  const ts = sortear(e.conteudo.desenhos, e.usadas, e.participantes.length, agora + e.ronda * 13);
  const sorteados = Object.fromEntries(e.participantes.map((id, i) => [id, ts[i] ?? { id: '?', pt: '?', en: '?' }]));
  return irPara(
    {
      ...e,
      sorteados,
      desenhos: {},
      ordem: [],
      atual: 0,
      falsos: {},
      recusados: [],
      casa: null,
      opcoes: [],
      escolhas: {},
      revelacao: [],
      usadas: [...e.usadas, ...ts.map((x) => x.id).filter((id) => !e.usadas.includes(id))],
    },
    'desenhar',
    e.def.desenhar,
    agora,
  );
}

export function novoMona(ids: string[], def: Partial<DefMona>, agora: number, conteudo: ConteudoMona, idioma: Idioma = 'pt-BR', usadas: string[] = []): EstadoMona {
  const participantes = ids.slice(0, MAX_JOGADORES);
  const d = { ...DEF_PADRAO_MONA, ...def };
  const base: EstadoMona = {
    def: d,
    rondas: d.rondas ?? rondasPadrao(participantes.length),
    fase: 'desenhar',
    ronda: 1,
    terminaEm: 0,
    pausaRestante: null,
    participantes,
    audiencia: ids.slice(MAX_JOGADORES),
    ligados: [...ids],
    idioma,
    sorteados: {},
    desenhos: {},
    ordem: [],
    atual: 0,
    falsos: {},
    recusados: [],
    casa: null,
    opcoes: [],
    escolhas: {},
    revelacao: [],
    pontos: Object.fromEntries(participantes.map((id) => [id, 0])),
    usadas,
    conteudo,
  };
  return prepararRonda(base, agora);
}

const todos = (e: EstadoMona) => [...e.participantes, ...e.audiencia];
export const autorAtual = (e: EstadoMona): string | undefined => e.ordem[e.atual];

/** quem inventa: jogadores ligados, menos o autor */
export function inventores(e: EstadoMona): string[] {
  const a = autorAtual(e);
  return e.participantes.filter((id) => id !== a && e.ligados.includes(id));
}

/** quem escolhe: jogadores e audiência ligados, menos o autor */
export function escolhedores(e: EstadoMona): string[] {
  const a = autorAtual(e);
  return todos(e).filter((id) => id !== a && e.ligados.includes(id));
}

/** pode escolher a opção i? (nunca a própria) */
export function podeEscolher(e: EstadoMona, id: string, i: number): boolean {
  const o = e.opcoes[i];
  return !!o && !o.autores.includes(id);
}

/** desenho seguinte (ou placar) */
function irParaDesenho(e: EstadoMona, i: number, agora: number): EstadoMona {
  const base = { ...e, atual: i, falsos: {}, recusados: [], opcoes: [], escolhas: {}, revelacao: [], casa: null };
  if (i >= e.ordem.length) return irPara(base, 'placar', T_PLACAR, agora);
  return irPara(base, 'inventar', e.def.inventar, agora);
}

function fecharDesenhar(e: EstadoMona, agora: number): EstadoMona {
  // quem não enviou fica fora desta ronda
  const ordem = baralhar(
    e.participantes.filter((id) => e.desenhos[id]),
    agora + 7,
  );
  return irParaDesenho({ ...e, ordem }, 0, agora);
}

/** junta verdadeiro + falsos (iguais juntam-se) + 1 da casa; com mais de 8, o verdadeiro + 7 sorteados */
export function montarOpcoes(e: EstadoMona, agora: number): { opcoes: Opcao[]; casa: Titulo | null } {
  const autor = autorAtual(e)!;
  const d = e.desenhos[autor];
  const verdadeiro: Opcao = { texto: d.titulo, verdadeiro: true, casa: false, autores: [autor] };
  const outras: Opcao[] = [];
  const chave = new Map<string, Opcao>([[normal(d.titulo), verdadeiro]]);
  for (const id of e.participantes) {
    const txt = e.falsos[id];
    if (!txt) continue;
    const k = normal(txt);
    const ja = chave.get(k);
    if (ja) {
      if (!ja.verdadeiro) ja.autores.push(id);
      continue;
    }
    const o: Opcao = { texto: txt, verdadeiro: false, casa: false, autores: [id] };
    chave.set(k, o);
    outras.push(o);
  }
  const usadosCasa = e.usadas;
  const [casa] = sortear(
    e.conteudo.falsos.filter((x) => !chave.has(normal(textoT(x, e.idioma)))),
    usadosCasa,
    1,
    agora + e.atual,
  );
  if (casa) outras.push({ texto: textoT(casa, e.idioma), verdadeiro: false, casa: true, autores: [] });
  const escolhidas = outras.length > MAX_OPCOES - 1 ? baralhar(outras, agora + 3).slice(0, MAX_OPCOES - 1) : outras;
  return { opcoes: baralhar([verdadeiro, ...escolhidas], agora + 11), casa: casa ?? null };
}

function fecharInventar(e: EstadoMona, agora: number): EstadoMona {
  const { opcoes, casa } = montarOpcoes(e, agora);
  const usadas = casa && !e.usadas.includes(casa.id) ? [...e.usadas, casa.id] : e.usadas;
  return irPara({ ...e, opcoes, casa, usadas, escolhas: {} }, 'escolher', T_ESCOLHER, agora);
}

/** pontos de um desenho (ver rabiscos.md → Pontos) */
export function pontuar(e: EstadoMona): { revelacao: OpcaoRevelada[]; ganhos: Record<string, number> } {
  const validos = escolhedores(e).filter((id) => e.escolhas[id] !== undefined);
  const ganhos: Record<string, number> = {};
  const somar = (id: string, n: number) => {
    if (e.participantes.includes(id)) ganhos[id] = (ganhos[id] ?? 0) + n;
  };
  const rev: OpcaoRevelada[] = e.opcoes.map((o, i) => ({ ...o, escolheram: validos.filter((v) => e.escolhas[v] === i), pontos: 0 }));
  const certo = rev.find((o) => o.verdadeiro)!;
  for (const v of certo.escolheram) somar(v, PONTOS_ACERTO);
  for (const o of rev) {
    if (o.verdadeiro || o.casa) continue;
    o.pontos = PONTOS_ENGANO * o.escolheram.length;
    for (const a of o.autores) somar(a, o.pontos);
  }
  const autor = autorAtual(e)!;
  const todos = escolhedores(e);
  const todosAcertaram = todos.length > 0 && certo.escolheram.length === todos.length;
  certo.pontos = todosAcertaram ? 0 : PONTOS_AUTOR * certo.escolheram.length;
  if (certo.pontos) somar(autor, certo.pontos);
  // revelação: um de cada vez, os menos escolhidos primeiro; o verdadeiro no fim
  const falsos = rev.filter((o) => !o.verdadeiro && (o.escolheram.length || !o.casa)).sort((x, y) => x.escolheram.length - y.escolheram.length);
  return { revelacao: [...falsos, certo], ganhos };
}

function fecharEscolher(e: EstadoMona, agora: number): EstadoMona {
  const { revelacao, ganhos } = pontuar(e);
  const pontos = { ...e.pontos };
  for (const [id, n] of Object.entries(ganhos)) pontos[id] = (pontos[id] ?? 0) + n;
  return irPara({ ...e, revelacao, pontos }, 'revelar', T_REVELAR, agora);
}

function avancar(e: EstadoMona, agora: number): EstadoMona {
  switch (e.fase) {
    case 'desenhar':
      return fecharDesenhar(e, agora);
    case 'inventar':
      return fecharInventar(e, agora);
    case 'escolher':
      return fecharEscolher(e, agora);
    case 'revelar':
      return irParaDesenho(e, e.atual + 1, agora);
    case 'placar':
      return e.ronda < e.rondas ? prepararRonda({ ...e, ronda: e.ronda + 1 }, agora) : irPara(e, 'fim', 0, agora);
    default:
      return e;
  }
}

function todosResponderam(e: EstadoMona): boolean {
  if (e.fase === 'desenhar') {
    const l = e.participantes.filter((id) => e.ligados.includes(id));
    return l.length > 0 && l.every((id) => e.desenhos[id]);
  }
  if (e.fase === 'inventar') {
    const l = inventores(e);
    return l.length > 0 && l.every((id) => e.falsos[id]);
  }
  if (e.fase === 'escolher') {
    const l = escolhedores(e);
    return l.length > 0 && l.every((id) => e.escolhas[id] !== undefined);
  }
  return false;
}

export function pausadoMona(e: EstadoMona): boolean {
  return e.pausaRestante !== null;
}

export function reduzMona(e: EstadoMona, acao: AcaoMona, agora: number): EstadoMona {
  switch (acao.tipo) {
    case 'ligados': {
      const s: EstadoMona = { ...e, ligados: acao.ids };
      if (s.fase === 'fim') return s;
      // só os participantes contam (a audiência não segura o jogo)
      return pausaPorFalta(s, quantosLigados(s.participantes, acao.ids) < MIN_LIGADOS, agora);
    }
    case 'ml_desenho': {
      if (e.fase !== 'desenhar' || pausadoMona(e) || !e.participantes.includes(acao.id)) return e;
      const tracos = limparTracos(acao.tracos);
      if (!tracos.length) return e;
      const s0 = e.sorteados[acao.id];
      const titulo = (acao.titulo ?? '').trim().slice(0, MAX_TITULO) || (s0 ? textoT(s0, e.idioma) : '?');
      const s = { ...e, desenhos: { ...e.desenhos, [acao.id]: { autor: acao.id, titulo, tracos } } };
      return todosResponderam(s) ? avancar(s, agora) : s;
    }
    case 'ml_falso': {
      if (e.fase !== 'inventar' || pausadoMona(e) || !inventores(e).includes(acao.id)) return e;
      const texto = acao.texto.trim().slice(0, MAX_TITULO);
      if (!normal(texto)) return e;
      const d = e.desenhos[autorAtual(e)!];
      if (normal(texto) === normal(d.titulo)) {
        // igual ao verdadeiro: pede outro
        const falsos = { ...e.falsos };
        delete falsos[acao.id];
        return { ...e, falsos, recusados: e.recusados.includes(acao.id) ? e.recusados : [...e.recusados, acao.id] };
      }
      const s = { ...e, falsos: { ...e.falsos, [acao.id]: texto }, recusados: e.recusados.filter((x) => x !== acao.id) };
      return todosResponderam(s) ? avancar(s, agora) : s;
    }
    case 'ml_escolher': {
      if (e.fase !== 'escolher' || pausadoMona(e) || !escolhedores(e).includes(acao.id) || e.escolhas[acao.id] !== undefined) return e;
      if (!podeEscolher(e, acao.id, acao.i)) return e;
      const s = { ...e, escolhas: { ...e.escolhas, [acao.id]: acao.i } };
      return todosResponderam(s) ? avancar(s, agora) : s;
    }
    case 'tick':
      if (pausadoMona(e) || e.fase === 'fim') return e;
      return agora >= e.terminaEm ? avancar(e, agora) : e;
  }
}

export type PodioMona = Podio;

export function podioMona(e: Pick<EstadoMona, 'participantes' | 'pontos'>): PodioMona[] {
  return podio(e.participantes, e.pontos);
}

/** vista pública: antes da revelação, os autores só vão como tags secretas ("é a tua") */
export interface VistaMona {
  def: DefMona;
  rondas: number;
  fase: FaseMona;
  ronda: number;
  terminaEm: number;
  restante: number | null;
  participantes: string[];
  audiencia: string[];
  /** desenhar: o título sorteado de cada um, pela tag */
  sorteados: Record<string, Titulo>;
  /** desenhar: quem já enviou; inventar/escolher: quem já respondeu */
  enviaram: string[];
  espera: string[];
  atual: number;
  total: number;
  /** desenho em jogo (inventar, escolher, revelar) */
  desenho: Traco[] | null;
  autorTag?: string;
  /** revelar: quem desenhou */
  autor?: string;
  recusados: string[];
  opcoes: { texto: string; tags: string[] }[];
  revelacao: OpcaoRevelada[];
  pontos: Record<string, number>;
  podio: PodioMona[];
  usadas: string[];
}

export function vistaMona(e: EstadoMona, tagDe: (id: string) => string | undefined): VistaMona {
  const autor = autorAtual(e);
  const emDesenho = e.fase === 'inventar' || e.fase === 'escolher' || e.fase === 'revelar';
  const d = emDesenho && autor ? e.desenhos[autor] : null;
  const tags = (ids: string[]) => ids.map(tagDe).filter((x): x is string => !!x);
  let enviaram: string[] = [];
  let espera: string[] = [];
  if (e.fase === 'desenhar') {
    espera = e.participantes;
    enviaram = e.participantes.filter((id) => e.desenhos[id]);
  } else if (e.fase === 'inventar') {
    espera = inventores(e);
    enviaram = Object.keys(e.falsos);
  } else if (e.fase === 'escolher') {
    espera = escolhedores(e);
    enviaram = Object.keys(e.escolhas);
  }
  return {
    def: e.def,
    rondas: e.rondas,
    fase: e.fase,
    ronda: e.ronda,
    terminaEm: e.terminaEm,
    restante: e.pausaRestante,
    participantes: e.participantes,
    audiencia: e.audiencia,
    sorteados: e.fase === 'desenhar' ? Object.fromEntries(Object.entries(e.sorteados).flatMap(([id, x]) => (tagDe(id) ? [[tagDe(id)!, x]] : []))) : {},
    enviaram,
    espera,
    atual: e.atual,
    total: e.ordem.length,
    desenho: d ? d.tracos : null,
    autorTag: autor && emDesenho ? tagDe(autor) : undefined,
    autor: e.fase === 'revelar' ? autor : undefined,
    recusados: tags(e.recusados),
    // o verdadeiro e o da casa levam marcas falsas (iguais às outras): só o autor do falso reconhece a sua placa
    opcoes: e.fase === 'escolher' ? e.opcoes.map((o, i) => ({ texto: o.texto, tags: o.verdadeiro || o.casa ? tags(['#placa' + i]) : tags(o.autores) })) : [],
    revelacao: e.fase === 'revelar' ? e.revelacao : [],
    pontos: e.pontos,
    podio: podioMona(e),
    usadas: e.usadas,
  };
}
