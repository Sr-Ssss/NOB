import { conteudoDe } from '../../core/conteudo';
import type { Problema } from './regras';

/** problemas de `conteudo/ideias-mirabolantes.json` (tag: problema) */
export function conteudoIdeias(): Problema[] {
  return conteudoDe('ideias-mirabolantes')
    .filter((i) => i.tags.includes('problema'))
    .map(({ id, pt, en }) => ({ id, pt, en }));
}
