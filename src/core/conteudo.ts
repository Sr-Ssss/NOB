import type { Idioma } from './sala';

/** formato partilhado do conteúdo: `conteudo/<jogo>.json` (escrito pela sessão de conteúdo) */
export interface Item {
  id: string;
  pt: string;
  en: string;
  tags: string[];
}

// lê `conteudo/*.json` se existirem (ficheiros em falta não partem o build)
const externos = import.meta.glob<Item[]>('../../conteudo/*.json', { eager: true, import: 'default' });

export function nomeDoFicheiro(caminho: string): string {
  return caminho.split('/').pop()!.replace(/\.json$/, '');
}

/** conteúdo do jogo: o de `conteudo/<jogo>.json` + o de reserva, sem ids repetidos */
export function conteudoDe(jogo: string, reserva: Item[] = []): Item[] {
  const ext = Object.entries(externos).find(([c]) => nomeDoFicheiro(c) === jogo)?.[1] ?? [];
  const vistos = new Set<string>();
  return [...ext, ...reserva].filter((i) => !vistos.has(i.id) && vistos.add(i.id));
}

export function textoEm(i: Item, idioma: Idioma): string {
  return idioma === 'en' ? i.en : i.pt;
}

/** todos os ficheiros externos (para os testes) */
export function ficheirosExternos(): Record<string, Item[]> {
  return Object.fromEntries(Object.entries(externos).map(([c, v]) => [nomeDoFicheiro(c), v]));
}
