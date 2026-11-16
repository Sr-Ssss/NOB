import { conteudoDe } from '../../core/conteudo';
import type { Conteudo, Txt } from './regras';

/**
 * palavras gigantes do slide de conclusão: o `conteudo/se-vira.json` não as tem,
 * por isso ficam aqui (lote inicial, família)
 */
const CONCLUSOES: [string, string][] = [
  ['SINERGIA', 'SYNERGY'], ['BANANAS', 'BANANAS'], ['LUCRO?', 'PROFIT?'], ['PATOS', 'DUCKS'], ['SUCESSO', 'SUCCESS'],
  ['SOPA', 'SOUP'], ['FIM', 'THE END'], ['OBRIGADO', 'THANK YOU'], ['PIZZA', 'PIZZA'], ['CALMA', 'RELAX'],
  ['INOVAÇÃO', 'INNOVATION'], ['CHINELOS', 'SLIPPERS'], ['ÓBVIO', 'OBVIOUSLY'], ['TALVEZ', 'MAYBE'], ['GATOS', 'CATS'],
  ['CAFÉ', 'COFFEE'], ['URGENTE', 'URGENT'], ['FOCO', 'FOCUS'], ['QUEIJO', 'CHEESE'], ['UAU', 'WOW'],
  ['COCHILO', 'NAP'], ['META', 'GOALS'], ['DINOSSAUROS', 'DINOSAURS'], ['APROVADO', 'APPROVED'], ['MISTÉRIO', 'MYSTERY'],
  ['PERFEITO', 'PERFECT'], ['BOLO', 'CAKE'], ['PRONTO', 'DONE'], ['PIPOCA', 'POPCORN'], ['VENCEMOS', 'WE WON'],
];

/** conteúdo de `conteudo/se-vira.json` (tags: titulo | legenda | topico | citacao | rotulo) */
export function conteudoSevira(): Conteudo {
  const itens = conteudoDe('se-vira');
  const p = (tag: string): Txt[] => itens.filter((i) => i.tags.includes(tag)).map(({ id, pt, en }) => ({ id, pt, en }));
  return {
    titulos: p('titulo'),
    legendas: p('legenda'),
    topicos: p('topico'),
    citacoes: p('citacao'),
    rotulos: p('rotulo'),
    conclusoes: CONCLUSOES.map(([pt, en], i) => ({ id: `conclusao-${i + 1}`, pt, en })),
  };
}
