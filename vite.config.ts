import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  root: 'app',
  base: './',
  envDir: '..',
  plugins: [preact()],
  // uma só fonte de versão (auditoria T13): a `version` do package.json
  define: { __VERSAO__: JSON.stringify(pkg.version) },
  build: { outDir: '../dist', emptyOutDir: true },
  test: { root: '.', include: ['src/**/*.test.ts'] },
} as never);
