import { expect, test } from '@playwright/test';

/** Fase 6 do feedback (20/11): Revolução das Máquinas no telemóvel (demo, sem TV). */
test.use({ viewport: { width: 390, height: 780 } });

const abrir = (page: import('@playwright/test').Page, fase: string) => page.goto(`/#/demo-maquinas?fase=${fase}&ecra=tel&semtv=1`);

test('fora de conversar/votar: medidores numa barra fina; a votar: manómetros', async ({ page }) => {
  await abrir(page, 'comandante');
  await expect(page.locator('.rm-painel.fino .rm-fino')).toHaveCount(3);
  await expect(page.locator('.rm-manometro')).toHaveCount(0);
  await abrir(page, 'votar');
  await page.reload();
  await expect(page.locator('.rm-manometro')).toHaveCount(2);
  await expect(page.locator('.rm-painel.fino')).toHaveCount(0);
});

test('segurar a Identidade: a barra enche e só depois mostra; na carta não há tempo', async ({ page }) => {
  await abrir(page, 'carta');
  const botao = page.locator('.rm-botao-id');
  await expect(botao).toBeVisible();
  await expect(page.locator('.topo .tempo, .topo [class*="tempor"]')).toHaveCount(0);
  const caixa = (await botao.boundingBox())!;
  await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
  await page.mouse.down();
  await expect(page.locator('.rm-botao-id .barra-segurar')).toHaveCount(1);
  await expect(page.locator('.rm-segredo')).toHaveCount(0);
  await expect(page.locator('.rm-segredo')).toBeVisible({ timeout: 4000 });
  await page.mouse.up();
  await expect(page.locator('.rm-segredo')).toHaveCount(0);
});
