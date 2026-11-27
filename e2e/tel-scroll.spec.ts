import { expect, test, type Page } from '@playwright/test';

/** 27/11: no telemóvel (360×640) tudo cabe num ecrã, sem scroll para baixo, em todas as fases (com e sem TV). */
const F: Record<string, string[]> = {
  pensa: ['escrever', 'votar', 'revelar', 'final', 'podio'],
  wifi: ['palavras', 'cripto', 'resposta', 'revelar', 'fim'],
  sevira: ['preparar', 'tema', 'apresentar', 'nota', 'fim'],
  mona: ['desenhar', 'inventar', 'escolher', 'revelar', 'placar', 'fim'],
  ideias: ['problema', 'inventar', 'pitch', 'investir', 'revelar', 'fim'],
  pirata: ['carta', 'noite', 'amanhecer', 'artilheiro', 'disparo', 'discussao', 'votar', 'resultado', 'fim'],
  maquinas: ['carta', 'nomear', 'votar', 'votos', 'comandante', 'piloto', 'poder', 'ver', 'discussao', 'fim'],
  rei: ['ir', 'carta', 'lider', 'ronda', 'refens', 'batata', 'votar', 'troca', 'aposta', 'fim'],
  semjuizo: ['caso', 'provas', 'escolher', 'explicar', 'contra_fala', 'contra_juri', 'contra_juiz', 'contra_res', 'testemunha', 'juri', 'juiz', 'estrela', 'revelar', 'fim'],
};
const EXTRA: Record<string, string[]> = {
  sevira: ['papel=apresentador&fase=apresentar', 'semtv=1&papel=apresentador&fase=apresentar', 'semtv=1&papel=plateia&fase=apresentar'],
  wifi: ['eu=j2&fase=cripto', 'eu=j3&fase=resposta'],
  ideias: ['eu=j3&fase=investir'],
  pirata: ['id=1&fase=noite', 'eu=j3&fase=noite'],
  maquinas: ['eu=j2&fase=comandante', 'eu=j3&fase=piloto'],
  rei: ['eu=j3&fase=refens', 'eu=j5&fase=votar'],
  semjuizo: ['papel=juiz&fase=juiz', 'papel=reu&fase=explicar', 'papel=juri&fase=juri'],
};

/** fundo do conteúdo (sem o padding do `.pag` nem o que é fixo); acaba antes do código da sala e dos botões fixos (Identidade, Mostrar) */
async function fundo(page: Page) {
  return page.evaluate(() => {
    const fixo = (el: Element) => {
      for (let e: Element | null = el; e; e = e.parentElement) if (getComputedStyle(e).position === 'fixed') return true;
      return false;
    };
    let f = 0;
    for (const el of Array.from(document.querySelectorAll('#app *'))) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (!r.height || !r.width || cs.visibility === 'hidden' || fixo(el)) continue;
      f = Math.max(f, el.classList.contains('pag') ? r.bottom - parseFloat(cs.paddingBottom) : r.bottom);
    }
    const id = Array.from(document.querySelectorAll('[class*=botao-id], .rd-mostrar')).find((e) => getComputedStyle(e).position === 'fixed');
    return { fundo: Math.round(f), limite: Math.min(600, id ? Math.round(id.getBoundingClientRect().top) - 4 : 600) };
  });
}

const casos: [string, string][] = [];
for (const [jogo, fases] of Object.entries(F)) {
  for (const f of fases) {
    const n = jogo === 'semjuizo' ? '&n=10' : '';
    casos.push([jogo, `fase=${f}${n}`], [jogo, `fase=${f}${n}&semtv=1`]);
  }
  for (const q of EXTRA[jogo] ?? []) casos.push([jogo, q + (jogo === 'semjuizo' ? '&n=10' : '')]);
}

test.use({ viewport: { width: 360, height: 640 }, locale: 'pt-BR' });
for (const [jogo, q] of casos) {
  test(`telemóvel ${jogo} ${q}`, async ({ page }) => {
    await page.goto(`/#/demo-${jogo}?${q}&ecra=tel`);
    await page.waitForSelector('#app *');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const m = await fundo(page);
    expect(m.fundo).toBeLessThanOrEqual(m.limite);
  });
}
