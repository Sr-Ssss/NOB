/** O que se pode escolher no telemóvel, passo a passo (o reducer volta a validar tudo). */
import { CUSTO, type Poder } from './criaturas';
import { FERE, GEMA, acertos, alvosAtaque, alvosEspecial, alvosLuta, casasAndar, casasEspecial, cria, livre, serve, temEfeito, type AlvoPoder, type Cria, type Face, type FaceFerida, type VistaDuelo } from './regras';
import { alcance, vizinhas, type Casa } from './tabuleiro';
import type { FaceDado } from './artes/dados';

/** lutar = colado, sem dado */
export type Modo = 'andar' | 'atacar' | 'especial' | 'lutar';
/** o que fica aceso no mini-tabuleiro */
export interface Opcoes {
  casas: Casa[];
  alvos: number[];
}

const ids = (l: Cria[]) => l.map((c) => c.id);

export function opcoesModo(v: VistaDuelo, c: Cria, modo: Modo): Opcoes {
  if (modo === 'andar') return { casas: casasAndar(v, c), alvos: [] };
  if (modo === 'atacar') return { casas: [], alvos: ids(alvosAtaque(v, c)) };
  if (modo === 'lutar') return { casas: [], alvos: ids(alvosLuta(v, c)) };
  return { casas: casasEspecial(v, c), alvos: ids(alvosEspecial(v, c)) };
}

const vazias = (o: Opcoes) => !o.casas.length && !o.alvos.length;

/** o que esta criatura pode fazer com este dado (e lutar colado, que não precisa de dado) */
export function modos(v: VistaDuelo, c: Cria, face?: Face): Modo[] {
  const l = (['lutar', 'andar', 'atacar', 'especial'] as Modo[]).filter((m) => m === 'lutar' || (face !== undefined && serve(face, m)));
  return l.filter((m) => !vazias(opcoesModo(v, c, m)));
}

/** a ação depois de confirmar (casa ou alvo tocado) */
export function acaoModo(modo: Modo, i: number, criatura: number, casa: Casa, alvo: number | undefined): Record<string, unknown> {
  if (modo === 'andar') return { tipo: 'dr_andar', i, criatura, casa };
  if (modo === 'atacar') return { tipo: 'dr_atacar', i, criatura, alvo };
  if (modo === 'lutar') return { tipo: 'dr_lutar', criatura, alvo };
  return alvo === undefined ? { tipo: 'dr_especial', i, criatura, casa } : { tipo: 'dr_especial', i, criatura, alvo };
}

/** o próximo toque do poder; listas vazias = não há alvo (ou já está completo) */
export function passoPoder(v: VistaDuelo, id: string, poder: Poder, a: AlvoPoder): Opcoes {
  if (poderCompleto(poder, a)) return { casas: [], alvos: [] };
  const minhas = v.criaturas.filter((c) => c.dono === id);
  const inimigas = v.criaturas.filter((c) => c.dono !== id);
  const livres = (c: Casa) => vizinhas(c).filter((x) => livre(v, x));
  const alvos = (l: Cria[]): Opcoes => ({ casas: [], alvos: ids(l) });
  switch (poder) {
    case 'empurrao': {
      const c = cria(v, a.criatura);
      return c ? { casas: livres(c.casa), alvos: [] } : alvos(v.criaturas.filter((x) => livres(x.casa).length > 0));
    }
    case 'escudo':
    case 'furia':
    case 'maisAtaque':
      return alvos(minhas.filter((c) => !temEfeito(c)));
    case 'retoque':
      return alvos(minhas.filter((c) => c.ferimentos > 0));
    case 'tempestade':
      return alvos(inimigas);
    case 'sono':
      return alvos(inimigas.filter((c) => !temEfeito(c) && !(c.ultimoSono > 0 && v.volta - c.ultimoSono <= 1)));
    case 'copia':
      return { casas: minhas.some((c) => c.fantasma) ? [] : [...new Set(minhas.flatMap((c) => livres(c.casa)))], alvos: [] };
    case 'muralha': {
      const l = a.casas ?? [];
      if (l.length) return { casas: [...new Set(l.flatMap(livres))].filter((c) => !l.includes(c)), alvos: [] };
      // só começa onde cabem as 3
      const cabe = (c: Casa) => alcance(c, 2, (x) => livre(v, x), () => false).length >= 2;
      return { casas: v.tabuleiro.casas.filter((c) => livre(v, c) && cabe(c)), alvos: [] };
    }
    case 'troca':
      return alvos(v.criaturas.length < 2 ? [] : v.criaturas.filter((c) => c.id !== a.criatura));
  }
}

export function poderCompleto(poder: Poder, a: AlvoPoder): boolean {
  if (poder === 'empurrao') return a.criatura !== undefined && a.casa !== undefined;
  if (poder === 'copia') return a.casa !== undefined;
  if (poder === 'muralha') return a.casas?.length === 3;
  if (poder === 'troca') return a.criatura !== undefined && a.outra !== undefined;
  return a.criatura !== undefined;
}

/** junta o toque (casa, ou criatura que lá está) ao que já se escolheu */
export function tocarPoder(poder: Poder, a: AlvoPoder, casa: Casa, criatura: number | undefined): AlvoPoder {
  if (poder === 'muralha') return { casas: [...(a.casas ?? []), casa] };
  if (criatura === undefined) return { ...a, casa };
  return poder === 'troca' && a.criatura !== undefined ? { ...a, outra: criatura } : { ...a, criatura };
}

/** porque é que o poder está a cinzento (null = dá) */
export function motivoPoder(v: VistaDuelo, id: string, poder: Poder): 'usado' | 'gemas' | 'alvo' | null {
  const m = v.magos[id];
  if (m.poderUsado) return 'usado';
  if (m.gemas < CUSTO[poder]) return 'gemas';
  return vazias(passoPoder(v, id, poder, {})) ? 'alvo' : null;
}

export const faceAcao = (f: Face): FaceDado => (f === 'fazer' ? 'fazerAlgo' : f);
export const faceAtaque = (n: number): FaceDado => (n === GEMA ? 'ataqueGema' : n === FERE ? 'ataqueFere' : n === 2 ? 'ataque2' : n === 1 ? 'ataque1' : 'ataqueVazio');
export const faceDefesa = (n: number): FaceDado => (n === GEMA ? 'defesaGema' : n === FERE ? 'defesaFere' : n ? 'defesa1' : 'defesaVazio');
/** o dado fraco de ataque nunca mostra escudo, nem o de defesa espada */
const FERIDAS_A: Record<FaceFerida, FaceDado> = { espada: 'feridaEspada', escudo: 'feridaVazio', coracao: 'feridaCoracao', gema: 'feridaGema', vazio: 'feridaVazio' };
const FERIDAS_D: Record<FaceFerida, FaceDado> = { espada: 'feridaDefVazio', escudo: 'feridaDefEscudo', coracao: 'feridaDefCoracao', gema: 'feridaDefGema', vazio: 'feridaDefVazio' };
/** dados de um lado pela ordem do `dr_relancar` (normais e depois os de ferimento) */
export const facesLado = (normais: number[], feridas: FaceFerida[], ataca: boolean): FaceDado[] => [...normais.map(ataca ? faceAtaque : faceDefesa), ...feridas.map((f) => (ataca ? FERIDAS_A : FERIDAS_D)[f])];
export const total = (normais: number[], feridas: FaceFerida[], ataca: boolean): number =>
  acertos(normais) + feridas.filter((f) => f === (ataca ? 'espada' : 'escudo')).length;
