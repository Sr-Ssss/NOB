import { expect, test } from '@playwright/test';

/** Fase 5 (modos): torneio sem TV — roleta, jogo sorteado, botão do fim leva ao placar; sair acaba o torneio. */
test.use({ viewport: { width: 390, height: 780 }, locale: 'pt-BR' });

test('torneio sem TV: roleta → jogo → acabar → menu; aleatório só com os marcados', async ({ page }) => {
  await page.goto('/#/criar');
  await page.fill('input', 'Ana');
  await page.click('text=Entrar');
  await expect(page.locator('.codigo-btn')).toBeVisible({ timeout: 15_000 });
  for (let i = 0; i < 3; i++) await page.click('text=+🤖');
  await page.click('text=Pronto');
  await page.click('text=Escolher jogo');
  await page.click('text=🎲 Aleatório · 🏆 Torneio');
  // só o 50/50 marcado → aleatório cai nele
  const lista = page.locator('.modos-lista input[type=checkbox]');
  const n = await lista.count();
  expect(n).toBeGreaterThan(1);
  for (let i = 0; i < n; i++) await lista.nth(i).uncheck();
  await expect(page.locator('text=🎲 Sortear')).toBeDisabled();
  await page.locator('.modos-lista label', { hasText: '50/50' }).locator('input').check();
  await page.click('text=🎲 Sortear');
  await expect(page.locator('.roleta h2')).toContainText('50/50', { timeout: 5_000 });
  await expect(page.locator('.abertura .abertura-nome')).toHaveText('50/50', { timeout: 8_000 });
  // ⏹ acaba a partida: volta ao lobby
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 12_000 });
  await page.click('.acabar-partida');
  await page.click('.popup >> text=Sim');
  await page.click('text=Pronto');

  // torneio de 3 jogos
  await page.click('text=Escolher jogo');
  await page.click('text=🎲 Aleatório · 🏆 Torneio');
  await page.click('text=🏆 Começar torneio');
  await expect(page.locator('.roleta')).toContainText('Jogo 1 de 3');
  await expect(page.locator('.abertura')).toBeVisible({ timeout: 8_000 });
});
