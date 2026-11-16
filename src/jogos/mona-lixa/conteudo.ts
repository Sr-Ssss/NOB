import { conteudoDe } from '../../core/conteudo';
import type { ConteudoMona } from './regras';

/** títulos de `conteudo/mona-lixa.json` (tags: desenho | falso) */
export function conteudoMona(): ConteudoMona {
  const itens = conteudoDe('mona-lixa');
  const p = (tag: string) => itens.filter((i) => i.tags.includes(tag)).map(({ id, pt, en }) => ({ id, pt, en }));
  return { desenhos: p('desenho'), falsos: p('falso') };
}
