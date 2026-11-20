import { expect, test } from '@playwright/test';
import { transbordos } from './medir';

/** Fase 3 (20/11): na TV tudo cabe num ecrã, sem scroll, em todas as fases de todos os jogos. */
const DEMOS: Record<string, string[]> = {
  pensa: ['escrever', 'votar', 'revelar', 'final', 'podio'],
  wifi: ['palavras', 'cripto', 'resposta', 'revelar', 'fim'],
  sevira: ['preparar', 'tema', 'apresentar', 'nota', 'fim'],
  mona: ['desenhar', 'inventar', 'escolher', 'revelar', 'placar', 'fim'],
  ideias: ['problema', 'inventar', 'pitch', 'investir', 'revelar', 'fim'],
  pirata: ['carta', 'noite', 'amanhecer', 'artilheiro', 'disparo', 'discussao', 'votar', 'resultado', 'fim'],
  maquinas: ['carta', 'nomear', 'votar', 'votos', 'comandante', 'piloto', 'poder', 'ver', 'discussao', 'fim'],
  rei: ['ir', 'carta', 'lider', 'ronda', 'refens', 'batata', 'votar', 'troca', 'aposta', 'fim'],
  ragerob: ['montar', 'loja', 'aposta', 'instalar', 'combate', 'resultado', 'fim'],
};
const EXTRA: Record<string, string[]> = {
  sevira: ['fase=apresentar&slide=1', 'fase=apresentar&slide=2', 'fase=apresentar&slide=3', 'fase=apresentar&slide=4', 'fase=apresentar&slide=5'],
  ragerob: ['fase=montar&modo=pilotos', 'fase=combate&modo=pilotos'],
};
const TAMANHOS = [
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
];

const casos: [string, string][] = [];
for (const [jogo, fases] of Object.entries(DEMOS)) {
  for (const f of fases) casos.push([jogo, `fase=${f}`]);
  for (const q of EXTRA[jogo] ?? []) casos.push([jogo, q]);
}

for (const tam of TAMANHOS) {
  test.describe(`TV ${tam.width}x${tam.height}`, () => {
    test.use({ viewport: tam });
    test('lobby da TV (vazio)', async ({ page }) => {
      await page.goto('/#/tv');
      await page.waitForSelector('.tv-lobby');
      await page.waitForTimeout(400);
      expect(await transbordos(page)).toEqual([]);
    });
    for (const [jogo, q] of casos) {
      test(`${jogo} ${q}`, async ({ page }) => {
        await page.goto(`/#/demo-${jogo}?${q}&ecra=tv`);
        await page.waitForSelector('#app *');
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        expect(await transbordos(page)).toEqual([]);
      });
    }
  });
}
