import { describe, expect, it, vi } from 'vitest';
import { BONECOS, CARAS, N_BONECOS, nomeBoneco } from './bonecos';
import { usarIdioma } from '../core/i18n';
import pt from '../i18n/pt-BR.json';
import en from '../i18n/en.json';

describe('bonecos', () => {
  it('18 bonecos, cada um com cor e cara próprias', () => {
    expect(N_BONECOS).toBe(18);
    expect(CARAS).toHaveLength(18);
    expect(new Set(BONECOS.map((b) => b.cor.toLowerCase())).size).toBe(18);
    const caras = BONECOS.map((b, i) => CARAS[i](b.cor));
    expect(new Set(caras.map((c) => c.olhos + c.resto)).size).toBe(18);
  });

  it('todos têm olhos (para piscar) e boca', () => {
    for (const [i, b] of BONECOS.entries()) {
      const c = CARAS[i](b.cor);
      expect(c.olhos.length, b.nome).toBeGreaterThan(20);
      expect(c.resto.length, b.nome).toBeGreaterThan(20);
    }
  });

  it('a gosma tem 3 olhos', () => {
    const i = BONECOS.findIndex((b) => b.nome === 'gosma');
    expect(CARAS[i](BONECOS[i].cor).olhos.match(/<ellipse/g)).toHaveLength(3);
  });
});

describe('nomes dos bonecos (i18n)', () => {
  it('18 nomes diferentes em cada idioma, pela mesma ordem', () => {
    for (const d of [pt, en]) {
      const nomes = d.nomesBonecos.split('|').map((s) => s.trim());
      expect(nomes).toHaveLength(N_BONECOS);
      expect(new Set(nomes).size).toBe(N_BONECOS);
      expect(nomes.every(Boolean)).toBe(true);
    }
    vi.stubGlobal('document', { documentElement: {} });
    usarIdioma('en');
    expect(nomeBoneco(14)).toBe('Goo');
    usarIdioma('pt-BR');
    expect(nomeBoneco(14)).toBe('Gosma');
    expect(nomeBoneco(18)).toBe(nomeBoneco(0));
    vi.unstubAllGlobals();
  });
});
