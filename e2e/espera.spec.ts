import { expect, test } from '@playwright/test';

/** Fases 7 e 11 (20/11): balão de "à espera", sem mensagens repetidas, Rei sem botão de identidade. */
test.use({ viewport: { width: 390, height: 780 } });

const abrir = async (page: import('@playwright/test').Page, q: string) => {
  await page.goto(`/#/demo-${q}`);
  await page.reload();
  await page.waitForSelector('#app *');
};

test('à espera: balão com 3 pontinhos em vez de ❌ (e parado com movimento reduzido)', async ({ page }) => {
  // o Windows pode ter "movimento reduzido" ligado: fixar o ponto de partida
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await abrir(page, 'maquinas?fase=votar&ecra=tel');
  const balao = page.locator('.pensando').first();
  await expect(balao).toBeVisible();
  await expect(balao.locator('i')).toHaveCount(3);
  await expect(balao).toHaveAttribute('aria-label', /.+/);
  expect(await page.locator('#app').innerText()).not.toContain('❌');
  // as demos desligam as animações (`sem-anim`); aqui queremos vê-las
  await page.evaluate(() => document.documentElement.classList.remove('sem-anim'));
  expect(await balao.locator('i').first().evaluate((e) => getComputedStyle(e).animationName)).toBe('pensando-pula');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await balao.locator('i').first().evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
});

test('sem mensagens repetidas: Máquinas (conversa) e Comandante sem TV', async ({ page }) => {
  await abrir(page, 'maquinas?fase=discussao&ecra=tel');
  expect((await page.locator('#app').innerText()).match(/Conversem/g)?.length).toBe(1);
  await abrir(page, 'maquinas?fase=discussao&ecra=tel&semtv=1');
  const txt = await page.locator('#app').innerText();
  expect(txt).not.toContain('TV');
  expect(txt.match(/Conversem/g)?.length).toBe(1);
  await abrir(page, 'maquinas?fase=comandante&ecra=tel&semtv=1');
  expect(await page.locator('#app').innerText()).not.toContain('Esperando o Comandante');
});

test('Rei: sem botão de identidade; sem TV, sem torres na ronda de quem joga', async ({ page }) => {
  await abrir(page, 'rei?fase=ronda&ecra=tel&semtv=1');
  await expect(page.getByRole('button', { name: 'Mostrar carta' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Identidade' })).toHaveCount(0);
  await expect(page.locator('.palco-tel')).toHaveCount(0);
  // fora da ronda, as torres voltam (sem repetir a narração)
  await abrir(page, 'rei?fase=lider&ecra=tel&semtv=1');
  await expect(page.locator('.palco-tel')).toHaveCount(1);
  expect((await page.locator('#app').innerText()).match(/Líderes sorteados/g)?.length).toBe(1);
});
