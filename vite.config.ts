import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  root: 'app',
  base: './',
  envDir: '..',
  plugins: [preact()],
  build: { outDir: '../dist', emptyOutDir: true },
  test: { root: '.', include: ['src/**/*.test.ts'] },
} as never);
