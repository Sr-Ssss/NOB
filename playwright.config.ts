import { defineConfig } from '@playwright/test';

/**
 * Testes de browser automáticos (`npx playwright test`).
 * Usa o Edge instalado (sem descarregar browsers) e um Vite próprio na porta 5198.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5198/', channel: 'msedge', headless: true },
  webServer: {
    command: 'npx vite --port 5198 --strictPort',
    url: 'http://localhost:5198/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
