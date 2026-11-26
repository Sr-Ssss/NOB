/** ícones dos jogos: um SVG por jogo em src/ui/icones/<id>.svg (escolhidos um a um com o utilizador) */
const ICONES = import.meta.glob<string>('./icones/*.svg', { eager: true, query: '?url', import: 'default' });

export function IconeJogo({ id }: { id: string }) {
  const src = ICONES[`./icones/${id}.svg`];
  return src ? <img class="icone-jogo" src={src} alt="" aria-hidden="true" /> : null;
}
