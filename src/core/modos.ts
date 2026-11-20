/**
 * Modos da Fase 5 (info/FASES_FEEDBACK.md): "Aleatório" (roleta entre os jogos marcados pelo líder)
 * e Torneio (3 ou 5 jogos sorteados, pontos por lugar). Funções puras; a sala usa-as (src/core/sala.ts).
 */
import { podio } from './jogo';

/** duração da roleta em todos os ecrãs */
export const T_ROLETA = 3000;
export const N_TORNEIO = [3, 5] as const;

/** a roleta a girar: cai em `jogo` (de entre `opcoes`) em `ate` */
export interface Roleta {
  jogo: string;
  opcoes: string[];
  ate: number;
  tutorial: boolean;
}

/** `jogo`: a jogar (ou a sortear); `placar`: entre jogos; `fim`: pódio do torneio */
export interface Torneio {
  total: number;
  /** os jogos que podem sair (marcados pelo líder) */
  jogos: string[];
  /** os já jogados, por ordem */
  feitos: string[];
  placar: Record<string, number>;
  /** os pontos ganhos no último jogo (para o placar entre jogos) */
  ultimo: Record<string, number>;
  fase: 'jogo' | 'placar' | 'fim';
}

/** pontos por lugar: 1.º = nº de jogadores, 2.º = n−1…; empates partilham o lugar */
export function pontosPorLugar(participantes: string[], pontos: Record<string, number>): Record<string, number> {
  const n = participantes.length;
  return Object.fromEntries(podio(participantes, pontos).map((p) => [p.id, n - p.lugar + 1]));
}

/** soma um jogo ao torneio; com o último jogo passa ao pódio */
export function registarJogo(t: Torneio, jogo: string, ganhos: Record<string, number>): Torneio {
  const placar = { ...t.placar };
  for (const [id, p] of Object.entries(ganhos)) placar[id] = (placar[id] ?? 0) + p;
  const feitos = [...t.feitos, jogo];
  return { ...t, feitos, placar, ultimo: ganhos, fase: feitos.length >= t.total ? 'fim' : 'placar' };
}

/** um ao calhas de `ids` (r() em [0, 1)) */
export const sortear = (ids: string[], r: () => number): string | null => (ids.length ? ids[Math.floor(r() * ids.length) % ids.length] : null);

/** classificação do torneio (com empates) */
export const podioTorneio = (t: Torneio, ids: string[]) => podio(ids, t.placar);
