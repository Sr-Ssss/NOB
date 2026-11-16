import { describe, expect, it } from 'vitest';
import { BONECOS, CARAS, N_BONECOS } from './bonecos';

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
