import { conteudoDe } from '../../core/conteudo';
import type { Pergunta } from './regras';

/** perguntas de `conteudo/pensa-dores.json` (tags: normal | final) */
export function perguntasPensa(): { normais: Pergunta[]; finais: Pergunta[] } {
  const itens = conteudoDe('pensa-dores');
  const p = (tag: string) => itens.filter((i) => i.tags.includes(tag)).map(({ id, pt, en }) => ({ id, pt, en }));
  return { normais: p('normal'), finais: p('final') };
}
