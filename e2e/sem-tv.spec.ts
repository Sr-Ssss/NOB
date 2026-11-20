import { expect, test, type Page } from '@playwright/test';

/** Fase 10 do feedback (20/11): Se Vira! e Ragerob só com telemóveis (sem TV). */
test.use({ viewport: { width: 390, height: 780 }, locale: 'pt-BR' });

const semScrollLado = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);

test('Se Vira! sem TV: o slide atual aparece no telemóvel do apresentador e da plateia', async ({ page }) => {
  for (const papel of ['apresentador', 'plateia']) {
    await page.goto('about:blank');
    await page.goto(`/#/demo-sevira?fase=apresentar&ecra=tel&semtv=1&papel=${papel}`);
    await expect(page.locator('.sv-tel-slide .sv-slide')).toBeVisible();
    await expect(page.locator(papel === 'apresentador' ? '.sv-setas' : '.sv-reagir')).toBeVisible();
    // as reações a voar por cima do slide
    await expect(page.locator('.sv-tel-slide .sv-voa').first()).toBeAttached();
    expect(await semScrollLado(page)).toBe(true);
  }
  // com TV, o telemóvel não mostra o slide
  await page.goto('about:blank');
  await page.goto('/#/demo-sevira?fase=apresentar&ecra=tel&papel=plateia');
  await expect(page.locator('.sv-reagir')).toBeVisible();
  await expect(page.locator('.sv-tel-slide')).toHaveCount(0);
});

test('Ragerob sem TV: a arena pequena por cima dos controlos', async ({ page }) => {
  await page.goto('/#/demo-ragerob?fase=combate&ecra=tel&semtv=1&eu=j1');
  const arena = page.locator('.rr-arena-tel svg.rr-arena');
  await expect(arena).toBeVisible();
  expect(await page.locator('.rr-arena-tel .rr-nome-arena').count()).toBeGreaterThanOrEqual(2);
  const controlos = page.locator('.rr-comando, .rr-btn-grande').first();
  await expect(controlos).toBeVisible();
  // a arena fica por cima dos controlos
  expect((await arena.boundingBox())!.y).toBeLessThan((await controlos.boundingBox())!.y);
  expect(await semScrollLado(page)).toBe(true);
  // com TV, não há arena no telemóvel
  await page.goto('about:blank');
  await page.goto('/#/demo-ragerob?fase=combate&ecra=tel&eu=j1');
  await expect(page.locator('.rr-arena-tel')).toHaveCount(0);
});

test('menu sem TV: Se Vira! e Ragerob não estão esbatidos e o Ragerob começa', async ({ page }) => {
  await page.goto('/#/criar');
  await page.fill('input', 'Ana');
  await page.click('text=Entrar');
  await expect(page.locator('.codigo-btn')).toBeVisible({ timeout: 15_000 });
  await page.click('text=+🤖');
  await page.click('text=+🤖');
  await page.click('text=Pronto');
  await page.click('text=Escolher jogo');
  for (const nome of ['Se Vira!', 'Ragerob']) await expect(page.locator('.item-tel', { hasText: nome })).not.toHaveClass(/esbatido/);
  await page.click('.item-tel >> text=Ragerob');
  await page.click('.popup >> text=Jogar');
  await expect(page.locator('.abertura .abertura-nome')).toHaveText('Ragerob');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 12_000 });
  await expect(page.locator('.jogo-ragerob.tel')).toBeVisible();
  expect(await semScrollLado(page)).toBe(true);
});
