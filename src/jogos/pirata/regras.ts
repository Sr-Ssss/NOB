import { baralhar } from '../../core/ids';
import { irPara, pausaPorFalta, podio, quantosLigados, type Podio } from '../../core/jogo';

/**
 * Pirata: regras em info/jogos/pirata-a-bordo.md.
 * Os papéis e os resultados privados nunca vão na vista pública: só em `privadoPirata` (canal privado).
 */

export type Papel = 'pirata' | 'vigia' | 'medico' | 'artilheiro' | 'marinheiro';

export interface DefPirata {
  discussao: number; // s
  /** marinheiros necessários para vigiar (null = padrão: nenhuma em jogos de 5; depois 2 com ≤ 6 vivos, senão 3) */
  vigiar: number | null;
  artilheiro: boolean;
  revelar: boolean;
}

export const DEF_PADRAO_PIRATA: DefPirata = { discussao: 180, vigiar: null, artilheiro: true, revelar: false };
export const OPCOES_PIRATA = { discussao: [60, 120, 180, 300], vigiar: [2, 3, 4, 5] };
export const MIN_JOGADORES = 5;
export const MAX_JOGADORES = 16;
export const MIN_LIGADOS = 3; // abaixo disto o jogo pausa
export const T_CARTA = 20;
export const T_NOITE = 45;
export const T_AMANHECER = 10;
export const T_VOTAR = 30;
export const T_RESULTADO = 8;
export const T_ARTILHEIRO = 20;
export const T_DISPARO = 8;
export const PONTOS_EQUIPA = 1000;
export const PONTOS_VIVO = 300;
export const TIPOS_PIRATA = ['pr_noite', 'pr_votar', 'pr_levar', 'pr_votar_ja'];
/** só o líder */
export const SO_LIDER_PIRATA = ['pr_votar_ja'];
/** quem "sai da cabine" à noite (o que a vigia dos marinheiros descobre) */
export const SAEM: Papel[] = ['pirata', 'vigia', 'medico'];

export type FasePirata = 'carta' | 'noite' | 'amanhecer' | 'artilheiro' | 'disparo' | 'discussao' | 'votar' | 'resultado' | 'fim';

export interface Noite {
  n: number;
  /** escolhido pelos piratas (null = ninguém) */
  alvo: string | null;
  salvo: boolean;
  vitima: string | null;
  vigia: string | null;
  medico: string | null;
}

export type Privado =
  | { tipo: 'vigia'; alvo: string; pirata: boolean }
  | { tipo: 'vigiar'; alvo: string; saiu: boolean };

export interface EstadoPirata {
  def: DefPirata;
  fase: FasePirata;
  terminaEm: number;
  pausaRestante: number | null;
  participantes: string[];
  audiencia: string[];
  ligados: string[];
  papeis: Record<string, Papel>;
  vivos: string[];
  /** ordem de saída */
  fora: { id: string; quando: 'noite' | 'dia' | 'canhao' | 'saiu'; n: number }[];
  noite: number;
  /** escolhas da noite em curso (qualquer papel) */
  escolhas: Record<string, string>;
  /** quem o Médico protegeu na noite anterior */
  medicoAntes: string | null;
  historico: Noite[];
  /** resultados privados do último amanhecer */
  privados: Record<string, Privado>;
  /** resultados privados de todas as noites, por jogador (histórico no telemóvel) */
  diario: Record<string, (Privado & { n: number })[]>;
  /** votos do dia (null = ninguém) */
  votos: Record<string, string | null>;
  /** expulso no último dia (null = ninguém) */
  expulso: string | null;
  /** o artilheiro que está a escolher e quem levou */
  artilheiro: { id: string; levou: string | null; depois: 'dia' | 'noite' } | null;
  vencedor: 'piratas' | 'tripulacao' | null;
  pontos: Record<string, number>;
  usadas: string[];
}

export type AcaoPirata =
  | { tipo: 'pr_noite'; id: string; alvo: string }
  | { tipo: 'pr_votar'; id: string; alvo: string | null }
  | { tipo: 'pr_levar'; id: string; alvo: string }
  | { tipo: 'pr_votar_ja'; id: string }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'tick' };

/** distribuição de papéis (tabela do .md) */
export function contarPapeis(n: number, artilheiro = true): { piratas: number; artilheiro: boolean } {
  const piratas = n >= 15 ? 4 : n >= 11 ? 3 : n >= 7 ? 2 : 1;
  return { piratas, artilheiro: artilheiro && n >= 7 };
}

/** null = sem vigia dos marinheiros. Padrão: nenhuma em jogos de 5; depois conta pelos vivos (≤ 6 → 2, senão 3) */
export function limiarVigia(def: DefPirata, inicial: number, vivos = inicial): number | null {
  if (def.vigiar !== null) return def.vigiar;
  if (inicial <= 5) return null;
  return vivos <= 6 ? 2 : 3;
}

export function novoPirata(ids: string[], def: Partial<DefPirata>, agora: number, usadas: string[] = []): EstadoPirata {
  const participantes = ids.slice(0, MAX_JOGADORES);
  const d = { ...DEF_PADRAO_PIRATA, ...def };
  const { piratas, artilheiro } = contarPapeis(participantes.length, d.artilheiro);
  const ordem = baralhar(participantes, agora + 7);
  const lista: Papel[] = [...Array(piratas).fill('pirata'), 'vigia', 'medico', ...(artilheiro ? ['artilheiro'] : [])];
  const papeis: Record<string, Papel> = {};
  ordem.forEach((id, i) => (papeis[id] = lista[i] ?? 'marinheiro'));
  return irPara(
    {
      def: d,
      fase: 'carta',
      terminaEm: 0,
      pausaRestante: null,
      participantes,
      audiencia: ids.slice(MAX_JOGADORES),
      ligados: [...ids],
      papeis,
      vivos: [...participantes],
      fora: [],
      noite: 0,
      escolhas: {},
      medicoAntes: null,
      historico: [],
      privados: {},
      diario: {},
      votos: {},
      expulso: null,
      artilheiro: null,
      vencedor: null,
      pontos: Object.fromEntries(participantes.map((id) => [id, 0])),
      usadas,
    },
    'carta',
    T_CARTA,
    agora,
  );
}

const vivosCom = (e: EstadoPirata, p: Papel) => e.vivos.filter((id) => e.papeis[id] === p);

/** pode escolher `alvo` esta noite? */
export function podeEscolher(e: EstadoPirata, id: string, alvo: string): boolean {
  if (!e.vivos.includes(id) || !e.vivos.includes(alvo)) return false;
  if (e.papeis[id] === 'medico') return alvo !== e.medicoAntes;
  return alvo !== id;
}

/** o mais escolhido; empate = sorteio entre os empatados; ninguém = null */
function maisEscolhido(escolhas: string[], seed: number): string | null {
  if (!escolhas.length) return null;
  const c = new Map<string, number>();
  escolhas.forEach((x) => c.set(x, (c.get(x) ?? 0) + 1));
  const max = Math.max(...c.values());
  const topo = [...c.keys()].filter((k) => c.get(k) === max).sort();
  return baralhar(topo, seed)[0];
}

function sai(e: EstadoPirata, id: string | null, quando: 'noite' | 'dia' | 'canhao' | 'saiu'): EstadoPirata {
  if (!id || !e.vivos.includes(id)) return e;
  return { ...e, vivos: e.vivos.filter((x) => x !== id), fora: [...e.fora, { id, quando, n: e.noite }] };
}

export function vencedorPirata(e: Pick<EstadoPirata, 'vivos' | 'papeis'>): 'piratas' | 'tripulacao' | null {
  const p = e.vivos.filter((id) => e.papeis[id] === 'pirata').length;
  if (p === 0) return 'tripulacao';
  if (p >= e.vivos.length - p) return 'piratas';
  return null;
}

function acabar(e: EstadoPirata, vencedor: 'piratas' | 'tripulacao', agora: number): EstadoPirata {
  const pontos = { ...e.pontos };
  e.participantes.forEach((id) => {
    const pirata = e.papeis[id] === 'pirata';
    if ((vencedor === 'piratas') === pirata) pontos[id] += PONTOS_EQUIPA;
    if (e.vivos.includes(id)) pontos[id] += PONTOS_VIVO;
  });
  return irPara({ ...e, vencedor, pontos }, 'fim', 0, agora);
}

/** depois de alguém sair: o Artilheiro escolhe, ou vê-se se acabou, ou segue */
function seguir(e: EstadoPirata, saiu: string | null, depois: 'dia' | 'noite', agora: number): EstadoPirata {
  if (saiu && e.papeis[saiu] === 'artilheiro' && e.def.artilheiro && e.artilheiro?.id !== saiu) {
    return irPara({ ...e, artilheiro: { id: saiu, levou: null, depois } }, 'artilheiro', T_ARTILHEIRO, agora);
  }
  const v = vencedorPirata(e);
  if (v) return acabar(e, v, agora);
  if (depois === 'dia') return irPara({ ...e, votos: {} }, 'discussao', e.def.discussao, agora);
  return comecarNoite(e, agora);
}

function comecarNoite(e: EstadoPirata, agora: number): EstadoPirata {
  return irPara({ ...e, noite: e.noite + 1, escolhas: {}, privados: {}, expulso: null }, 'noite', T_NOITE, agora);
}

function fimDaNoite(e: EstadoPirata, agora: number): EstadoPirata {
  const de = (p: Papel) => vivosCom(e, p).map((id) => e.escolhas[id]).filter((x): x is string => !!x);
  const alvo = maisEscolhido(de('pirata'), agora + e.noite * 31);
  const medico = vivosCom(e, 'medico').map((id) => e.escolhas[id]).find(Boolean) ?? null;
  const vigiaId = vivosCom(e, 'vigia')[0];
  const vigia = vigiaId ? (e.escolhas[vigiaId] ?? null) : null;
  const salvo = !!alvo && alvo === medico;
  const vitima = alvo && !salvo ? alvo : null;
  const privados: Record<string, Privado> = {};
  if (vigiaId && vigia) privados[vigiaId] = { tipo: 'vigia', alvo: vigia, pirata: e.papeis[vigia] === 'pirata' };
  // vigia dos marinheiros: só conta com ≥ N no mesmo alvo
  const n = limiarVigia(e.def, e.participantes.length, e.vivos.length);
  const marinheiros = vivosCom(e, 'marinheiro').filter((id) => e.escolhas[id]);
  const conta = new Map<string, string[]>();
  marinheiros.forEach((id) => conta.set(e.escolhas[id], [...(conta.get(e.escolhas[id]) ?? []), id]));
  conta.forEach((quem, a) => {
    if (n !== null && quem.length >= n) quem.forEach((id) => (privados[id] = { tipo: 'vigiar', alvo: a, saiu: SAEM.includes(e.papeis[a]) }));
  });
  const diario = { ...e.diario };
  for (const [id, p] of Object.entries(privados)) diario[id] = [...(diario[id] ?? []), { ...p, n: e.noite }];
  const r = sai(
    { ...e, privados, diario, medicoAntes: medico, historico: [...e.historico, { n: e.noite, alvo, salvo, vitima, vigia, medico }] },
    vitima,
    'noite',
  );
  return irPara(r, 'amanhecer', T_AMANHECER, agora);
}

/** contagem dos votos do dia: alvo (ou "" = ninguém) → votos */
export function contagemDia(votos: Record<string, string | null>): Record<string, number> {
  const c: Record<string, number> = {};
  Object.values(votos).forEach((a) => (c[a ?? ''] = (c[a ?? ''] ?? 0) + 1));
  return c;
}

/** mais votado (com "Ninguém" como opção); empate no topo = ninguém sai */
export function expulsoDia(votos: Record<string, string | null>): string | null {
  const c = contagemDia(votos);
  const ks = Object.keys(c);
  if (!ks.length) return null;
  const max = Math.max(...Object.values(c));
  const topo = ks.filter((k) => c[k] === max);
  return topo.length === 1 && topo[0] !== '' ? topo[0] : null;
}

function fimDaVotacao(e: EstadoPirata, agora: number): EstadoPirata {
  const expulso = expulsoDia(e.votos);
  return irPara(sai({ ...e, expulso }, expulso, 'dia'), 'resultado', T_RESULTADO, agora);
}

function avancar(e: EstadoPirata, agora: number): EstadoPirata {
  switch (e.fase) {
    case 'carta':
      return comecarNoite(e, agora);
    case 'noite':
      return fimDaNoite(e, agora);
    case 'amanhecer':
      return seguir(e, e.historico[e.historico.length - 1]?.vitima ?? null, 'dia', agora);
    case 'discussao':
      return irPara({ ...e, votos: {} }, 'votar', T_VOTAR, agora);
    case 'votar':
      return fimDaVotacao(e, agora);
    case 'resultado':
      return seguir(e, e.expulso, 'noite', agora);
    case 'artilheiro': {
      const a = e.artilheiro!;
      return irPara(sai(e, a.levou, 'canhao'), 'disparo', T_DISPARO, agora);
    }
    case 'disparo': {
      const a = e.artilheiro!;
      return seguir(e, a.levou, a.depois, agora);
    }
    default:
      return e;
  }
}

export const pausadoPirata = (e: EstadoPirata) => e.pausaRestante !== null;

export function reduzPirata(e: EstadoPirata, acao: AcaoPirata, agora: number): EstadoPirata {
  if (e.fase === 'fim' && acao.tipo !== 'ligados') return e;
  switch (acao.tipo) {
    case 'ligados': {
      const s: EstadoPirata = { ...e, ligados: acao.ids };
      if (s.fase === 'fim') return s;
      return pausaPorFalta(s, quantosLigados(s.participantes, acao.ids) < MIN_LIGADOS, agora);
    }
    case 'pr_noite':
      if (e.fase !== 'noite' || pausadoPirata(e) || !podeEscolher(e, acao.id, acao.alvo)) return e;
      return { ...e, escolhas: { ...e.escolhas, [acao.id]: acao.alvo } };
    case 'pr_votar': {
      if (e.fase !== 'votar' || pausadoPirata(e) || !e.vivos.includes(acao.id) || acao.id in e.votos) return e;
      if (acao.alvo !== null && (!e.vivos.includes(acao.alvo) || acao.alvo === acao.id)) return e;
      const s = { ...e, votos: { ...e.votos, [acao.id]: acao.alvo } };
      // acaba mais cedo quando todos os vivos votaram
      return s.vivos.every((id) => id in s.votos) ? fimDaVotacao(s, agora) : s;
    }
    case 'pr_levar': {
      const a = e.artilheiro;
      if (e.fase !== 'artilheiro' || pausadoPirata(e) || a?.id !== acao.id || !e.vivos.includes(acao.alvo)) return e;
      return avancar({ ...e, artilheiro: { ...a, levou: acao.alvo } }, agora);
    }
    case 'pr_votar_ja':
      if (e.fase !== 'discussao' || pausadoPirata(e)) return e;
      return avancar(e, agora);
    case 'tick':
      if (pausadoPirata(e) || agora < e.terminaEm) return e;
      return avancar(e, agora);
  }
}

/* ---------- vistas ---------- */

export type PodioPirata = Podio;

export function podioPirata(e: Pick<EstadoPirata, 'participantes' | 'pontos'>): PodioPirata[] {
  return podio(e.participantes, e.pontos);
}

/** o que a TV publica: nunca leva papéis (salvo "revelar" de quem sai, e todos no fim) */
export interface VistaPirata {
  def: DefPirata;
  fase: FasePirata;
  terminaEm: number;
  restante: number | null;
  participantes: string[];
  audiencia: string[];
  vivos: string[];
  fora: { id: string; quando: 'noite' | 'dia' | 'canhao' | 'saiu'; n: number; papel: Papel | null }[];
  noite: number;
  /** amanhecer: quem foi atirado ao mar (null = ninguém) */
  vitima: string | null;
  /** votação: quem já votou */
  votaram: string[];
  /** resultado do dia */
  contagem: Record<string, number>;
  expulso: string | null;
  /** artilheiro / disparo */
  artilheiro: { id: string; levou: string | null } | null;
  vencedor: 'piratas' | 'tripulacao' | null;
  /** só no fim */
  papeis: Record<string, Papel>;
  historico: Noite[];
  pontos: Record<string, number>;
  podio: PodioPirata[];
  usadas: string[];
}

export function vistaPirata(e: EstadoPirata): VistaPirata {
  const fim = e.fase === 'fim';
  return {
    def: e.def,
    fase: e.fase,
    terminaEm: e.terminaEm,
    restante: e.pausaRestante,
    participantes: e.participantes,
    audiencia: e.audiencia,
    vivos: e.vivos,
    fora: e.fora.map((f) => ({ ...f, papel: fim || e.def.revelar ? e.papeis[f.id] : null })),
    noite: e.noite,
    vitima: e.historico[e.historico.length - 1]?.vitima ?? null,
    votaram: e.fase === 'votar' ? Object.keys(e.votos) : [],
    contagem: e.fase === 'resultado' ? contagemDia(e.votos) : {},
    expulso: e.fase === 'resultado' ? e.expulso : null,
    artilheiro: (e.fase === 'artilheiro' || e.fase === 'disparo') && e.artilheiro ? { id: e.artilheiro.id, levou: e.fase === 'disparo' ? e.artilheiro.levou : null } : null,
    vencedor: e.vencedor,
    papeis: fim ? e.papeis : {},
    historico: fim ? e.historico : [],
    pontos: e.pontos,
    podio: podioPirata(e),
    usadas: e.usadas,
  };
}

/** o que só um telemóvel recebe (canal privado) */
export interface PrivadoPirata {
  papel: Papel | null;
  vivo: boolean;
  /** os outros piratas (só para piratas) */
  companheiros: string[];
  /** a minha escolha desta noite */
  escolha: string | null;
  /** piratas: votos dos outros piratas esta noite */
  votosPiratas: Record<string, string>;
  /** médico: quem não pode proteger esta noite */
  bloqueado: string | null;
  /** resultado privado do amanhecer */
  resultado: Privado | null;
  /** os meus resultados de todas as noites */
  diario: (Privado & { n: number })[];
  /** o meu voto do dia (undefined = ainda não) */
  voto?: string | null;
}

export function privadoPirata(e: EstadoPirata, id: string): PrivadoPirata | null {
  const papel = e.papeis[id] ?? null;
  if (!papel) return null;
  const pirata = papel === 'pirata';
  return {
    papel,
    vivo: e.vivos.includes(id),
    companheiros: pirata ? e.participantes.filter((x) => x !== id && e.papeis[x] === 'pirata') : [],
    escolha: e.fase === 'noite' ? (e.escolhas[id] ?? null) : null,
    votosPiratas: pirata && e.fase === 'noite' ? Object.fromEntries(vivosCom(e, 'pirata').filter((x) => x !== id && e.escolhas[x]).map((x) => [x, e.escolhas[x]])) : {},
    bloqueado: papel === 'medico' ? e.medicoAntes : null,
    resultado: e.fase === 'amanhecer' ? (e.privados[id] ?? null) : null,
    diario: e.diario?.[id] ?? [],
    ...(id in e.votos && e.fase === 'votar' ? { voto: e.votos[id] } : {}),
  };
}

/* ---------- saídas a meio (src/core/saidas.ts) ---------- */

/** quem está vivo faz falta (vota, tem papel) */
export const importantePirata = (e: EstadoPirata, id: string): boolean => e.vivos.includes(id);
/** quem já foi ao mar já não joga */
export const foraPirata = (e: EstadoPirata, id: string): boolean => !e.vivos.includes(id);

/** o líder decidiu seguir sem ele: sai do barco (como quem vai ao mar) e vê-se se o jogo acabou */
export function sairPirata(e: EstadoPirata, id: string, agora: number): EstadoPirata {
  if (!e.vivos.includes(id) || e.fase === 'fim') return e;
  const escolhas = { ...e.escolhas };
  delete escolhas[id];
  const votos = { ...e.votos };
  delete votos[id];
  const s = sai({ ...e, escolhas, votos }, id, 'saiu');
  const v = vencedorPirata(s);
  if (v) return acabar(s, v, agora);
  if (s.fase === 'votar' && s.vivos.every((x) => x in s.votos)) return fimDaVotacao(s, agora);
  return s;
}
