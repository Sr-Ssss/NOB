import { conteudoDe, type Item } from '../../core/conteudo';
import type { Caso, Conteudo } from './regras';

/** conteúdo de `conteudo/sem-juizo.json` (tags: caso | culpado | inocente + peças do desenho; prova + emoji) */
export function conteudoSemJuizo(): Conteudo {
  const itens = conteudoDe('sem-juizo');
  const p = (tag: string): Item[] => itens.filter((i) => i.tags[0] === tag);
  const cenas = (tag: string): Caso[] => p(tag).map(({ id, pt, en, tags }) => ({ id, pt, en, cena: tags.slice(1) }));
  return {
    casos: cenas('caso'),
    culpado: cenas('culpado'),
    inocente: cenas('inocente'),
    provas: p('prova').map(({ id, pt, en, tags }) => ({ id, pt, en, emoji: tags[1] ?? '❓' })),
  };
}
