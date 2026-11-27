import type { Page } from '@playwright/test';

/**
 * o que transborda: a página e qualquer caixa com scroll próprio; e o palco não pode encolher
 * mais de 15 % para caber (src/ui/palco.tsx), senão o texto fica pequeno demais a 3 m.
 * Menus podem rolar: a lista de jogos do lobby da TV tem scroll próprio de propósito.
 */
export async function transbordos(page: Page) {
  return page.evaluate(() => {
    const d = document.documentElement;
    const r: string[] = [];
    const k = Number(document.querySelector<HTMLElement>('.palco-tv')?.dataset.encolhe ?? 1);
    if (k < 0.85) r.push(`palco encolhido ${k}`);
    if (d.scrollHeight > innerHeight + 1) r.push(`página ${d.scrollHeight}>${innerHeight}`);
    if (d.scrollWidth > innerWidth + 1) r.push(`página larg ${d.scrollWidth}>${innerWidth}`);
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      if (el.matches('.lista-jogos ol')) continue;
      const cs = getComputedStyle(el);
      const rola = /(auto|scroll)/.test(cs.overflowY + cs.overflowX);
      if (rola && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1))
        r.push(`${el.tagName.toLowerCase()}.${el.className} ${el.scrollHeight}>${el.clientHeight}`);
    }
    return r;
  });
}
