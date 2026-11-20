import pt from '../i18n/pt-BR.json';
import en from '../i18n/en.json';
import type { Idioma } from './sala';

export type Chave = keyof typeof pt;
const DIC: Record<Idioma, Record<Chave, string>> = { 'pt-BR': pt, en };

export function idiomaDispositivo(): Idioma {
  const guardado = localStorage.getItem('nob.idioma');
  if (guardado === 'pt-BR' || guardado === 'en') return guardado;
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
}

let atual: Idioma = 'pt-BR';

export function usarIdioma(i: Idioma): void {
  atual = i;
  document.documentElement.lang = i;
}

/** textos trocados enquanto vale um modo (torneio: "Jogar outra vez" → "Placar do torneio" no fim de todos os jogos) */
let trocas: Partial<Record<Chave, Chave>> = {};
export function trocarTextos(m: Partial<Record<Chave, Chave>>): void {
  trocas = m;
}

export function t(chave: Chave, vars: Record<string, string | number> = {}): string {
  return DIC[atual][trocas[chave] ?? chave].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

/** nomes dos jogos (ver info/arquitetura.md) */
export const JOGOS: { id: string; pt: string; en: string; ativo: boolean }[] = [
  { id: '5050', pt: '50/50', en: '50/50', ativo: true },
  { id: 'pensa', pt: 'Pensa-Dores', en: 'Deep Thinkers', ativo: false },
  { id: 'sevira', pt: 'Se Vira!', en: 'Wing It!', ativo: false },
  { id: 'mona', pt: 'Mona Lixa', en: 'Mona Lies', ativo: false },
  { id: 'ideias', pt: 'Ideias Mirabolantes', en: 'Harebrained Ideas', ativo: false },
  { id: 'pirata', pt: 'Pirata', en: 'Pirate', ativo: false },
  { id: 'rei', pt: 'O Rei e o Dragão', en: 'The King and the Dragon', ativo: false },
  { id: 'maquinas', pt: 'Revolução das Máquinas', en: 'Machine Uprising', ativo: false },
  { id: 'wifi', pt: 'Senha do Wi-Fi', en: 'Wi-Fi Password', ativo: false },
  { id: 'ragerob', pt: 'Ragerob', en: 'Ragerob', ativo: false },
];

export function nomeJogo(j: { pt: string; en: string }): string {
  return atual === 'en' ? j.en : j.pt;
}

export const TEMAS: Record<string, { pt: string; en: string }> = {
  comida: { pt: 'Comida', en: 'Food' },
  escola: { pt: 'Escola/Trabalho', en: 'School/Work' },
  animais: { pt: 'Animais', en: 'Animals' },
  poderes: { pt: 'Superpoderes', en: 'Superpowers' },
  ferias: { pt: 'Férias', en: 'Vacation' },
  casa: { pt: 'Casa', en: 'Home' },
};
