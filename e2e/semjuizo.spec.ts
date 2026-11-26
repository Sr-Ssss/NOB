import { expect, test } from '@playwright/test';

const P = 'info/progresso/10-sem-juizo/';

test.describe('Sem Juízo telemóvel', () => {
  test.use({ viewport: { width: 412, height: 915 } });
  for (const semtv of [0, 1])
    for (const [fase, papel, sel] of [
      ['caso', 'reu', '.sj-folha'],
      ['provas', 'juri', '.sj-carta'],
      ['escolher', 'acusador', '.sj-carta'],
      ['explicar', 'reu', '.sj-poder'],
      ['juri', 'juri', '.sj-voto'],
      ['juiz', 'juiz', '.sj-votos-juri'],
      ['estrela', 'juiz', '.sj-prova'],
      ['revelar', 'juri', '.sj-carimbo'],
      ['fim', 'juri', '.placar'],
    ])
      test(`${fase} ${papel} semtv=${semtv}`, async ({ page }) => {
        await page.goto(`/#/demo-semjuizo?fase=${fase}&ecra=tel&papel=${papel}&semtv=${semtv}`);
        await expect(page.locator(sel).first()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await page.waitForTimeout(1200);
        await page.screenshot({ path: `${P}tel-${fase}-${papel}${semtv ? '-semtv' : ''}.png` });
      });
});

test.describe('Sem Juízo TV', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  for (const fase of ['caso', 'explicar', 'contra_fala', 'juiz', 'revelar', 'fim'])
    test(fase, async ({ page }) => {
      await page.goto(`/#/demo-semjuizo?fase=${fase}&ecra=tv&n=10`);
      await expect(page.locator('.jogo-semjuizo')).toBeVisible();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${P}tv-${fase}.png` });
    });
});

test.use({ locale: 'pt-BR' });
test('sala de espera: galeria opcional com aviso', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/#/criar');
  await page.fill('input', 'Ana');
  await page.click('text=Entrar');
  await page.click('text=Provas da galeria');
  await expect(page.locator('.popup')).toContainText('podem aparecer a todos');
});
