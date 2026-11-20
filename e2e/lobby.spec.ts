import { expect, test, type Browser, type Page } from '@playwright/test';
import { transbordos } from './medir';

/**
 * Lobby a sério (Supabase Realtime): criar party, 2.º jogador, prontos, abertura, "Tornar TV".
 * Cada jogador num contexto próprio (localStorage separado), como dois telemóveis.
 */
const TEL = { viewport: { width: 412, height: 860 }, locale: 'pt-BR' };
const TV = { viewport: { width: 1280, height: 720 }, locale: 'pt-BR' };

async function criar(browser: Browser, nome: string): Promise<[Page, string]> {
  const p = await (await browser.newContext(TEL)).newPage();
  await p.goto('/#/criar');
  await p.fill('input', nome);
  await p.click('text=Entrar');
  const codigo = (await p.locator('.codigo-btn').textContent({ timeout: 15_000 }))!.trim();
  return [p, codigo];
}

async function entrar(browser: Browser, codigo: string, nome: string, ctx = TEL): Promise<Page> {
  const p = await (await browser.newContext(ctx)).newPage();
  await p.goto('/');
  await p.fill('#codigo', codigo);
  await p.press('#codigo', 'Enter');
  await p.waitForSelector('text=Escolha seu boneco');
  await p.fill('input', nome);
  await p.click('text=Entrar');
  await expect(p.locator('text=Pronto')).toBeVisible({ timeout: 15_000 });
  return p;
}

test.describe.configure({ mode: 'serial' });

test('criar party, 2.º jogador, prontos e abertura em todos', async ({ browser }) => {
  const [a, codigo] = await criar(browser, 'Ana');
  const b = await entrar(browser, codigo, 'Beto');
  await expect(a.locator('text=Beto')).toBeVisible();
  await a.click('text=+🤖'); // 3.º jogador para o 50/50
  await a.click('text=Pronto');
  await b.click('text=Pronto');
  await a.click('text=Escolher jogo');
  await a.click('.item-tel >> text=50/50');
  await a.click('.popup >> text=Jogar');
  // todos prontos: a abertura (nome + barra de 5 s) aparece logo nos dois
  for (const p of [a, b]) {
    await expect(p.locator('.abertura .abertura-nome')).toHaveText('50/50');
    await expect(p.locator('.barra-abertura')).toBeVisible();
  }
  // e depois o jogo
  await expect(a.locator('.abertura')).toHaveCount(0, { timeout: 12_000 });

  // Fase 9: "Acabar partida" só para o líder; Não fecha, Sim volta todos ao lobby
  await expect(b.locator('.acabar-partida')).toHaveCount(0);
  await a.click('.acabar-partida');
  await expect(a.locator('.popup')).toContainText('O progresso será perdido');
  await a.click('.popup >> text=Não');
  await expect(a.locator('.popup')).toHaveCount(0);
  await a.click('.acabar-partida');
  await a.click('.popup >> text=Sim');
  await expect(a.locator('text=Escolher jogo')).toBeVisible({ timeout: 10_000 });
  await expect(b.locator('text=Esperando Ana começar')).toBeVisible({ timeout: 10_000 });
});

test('bot: "IA jogável" ligada por defeito; desligada, o líder joga por ele (sem a aba "Jogando como")', async ({ browser }) => {
  const [a] = await criar(browser, 'Ana');
  await a.click('text=+🤖');
  await a.click('text=+🤖');
  await a.click('button[aria-label="Bot 1"]');
  const ia = a.locator('.popup [role=switch]');
  await expect(ia).toHaveAttribute('aria-checked', 'true');
  await ia.click();
  await expect(ia).toHaveAttribute('aria-checked', 'false');
  await expect(a.locator('.popup')).toContainText('Expulsar');
  await a.click('.popup >> text=Fechar');
  await a.click('text=Pronto');
  await a.click('text=Escolher jogo');
  await a.click('.item-tel >> text=50/50');
  await a.click('.popup >> text=Jogar');
  await expect(a.locator('.abertura')).toHaveCount(0, { timeout: 12_000 });
  // só o Bot 1 (IA desligada) aparece na troca; o Bot 2 joga sozinho
  await expect(a.locator('.troca-j > span')).toHaveText(['Eu', 'Bot 1']);
  await expect(a.locator('text=Jogando como')).toHaveCount(0);
});

test('início: "Como jogar" no canto superior esquerdo', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.inicio > .topo .livro')).toBeVisible();
  await expect(page.locator('.rodape-inicio .livro')).toHaveCount(0);
});

test('"Tornar TV": o 2.º aparelho passa a TV e o ecrã cabe sem scroll', async ({ browser }) => {
  const [a, codigo] = await criar(browser, 'Ana');
  const tv = await entrar(browser, codigo, 'Tela', TV);
  await a.waitForTimeout(2000); // logo a seguir a entrar, a passagem à TV às vezes falha (ver PROXIMA_SESSAO)
  await a.click('text=Tela');
  await a.click('text=Tornar TV');
  await a.click('.popup >> text=Confirmar');
  await expect(tv.locator('.tv-lobby')).toBeVisible({ timeout: 15_000 });
  await expect(a.locator('text=TV ligada')).toBeVisible();
  await expect(a.locator('text=Tela')).toHaveCount(0);
  expect(await transbordos(tv)).toEqual([]);

  // com TV: abertura na TV também cabe
  await a.click('text=+🤖');
  await a.click('text=+🤖');
  await a.click('text=Pronto');
  await a.click('text=Escolher jogo');
  await a.click('.item-tel >> text=50/50');
  await a.click('.popup >> text=Jogar');
  await expect(tv.locator('.abertura.tv')).toBeVisible();
  expect(await transbordos(tv)).toEqual([]);
  await expect(a.locator('.abertura')).toBeVisible();
});
