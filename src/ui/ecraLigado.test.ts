import { describe, expect, it } from 'vitest';
import { manterEcraLigado } from './ecraLigado';
import { medidasPalco, novoEncolhe } from './palco';

function falso(visivel = true) {
  const ouvintes: (() => void)[] = [];
  const doc = {
    visibilityState: visivel ? 'visible' : 'hidden',
    addEventListener: (_: string, f: () => void) => ouvintes.push(f),
    removeEventListener: (_: string, f: () => void) => ouvintes.splice(ouvintes.indexOf(f), 1),
  };
  const pedidos: { released: boolean; release: () => Promise<void> }[] = [];
  const nav = {
    wakeLock: {
      request: async () => {
        const s = { released: false, release: async () => void (s.released = true) };
        pedidos.push(s);
        return s;
      },
    },
  };
  const mudar = (v: boolean) => {
    doc.visibilityState = v ? 'visible' : 'hidden';
    ouvintes.forEach((f) => f());
  };
  return { doc: doc as unknown as Document, nav, pedidos, ouvintes, mudar };
}
const espera = () => new Promise((r) => setTimeout(r, 0));

describe('manterEcraLigado', () => {
  it('pede logo e volta a pedir quando a app volta ao primeiro plano', async () => {
    const f = falso();
    manterEcraLigado(f.nav, f.doc);
    await espera();
    expect(f.pedidos.length).toBe(1);
    f.pedidos[0].released = true; // o sistema soltou-o (segundo plano)
    f.mudar(false);
    await espera();
    expect(f.pedidos.length).toBe(1);
    f.mudar(true);
    await espera();
    expect(f.pedidos.length).toBe(2);
  });

  it('não pede outra vez se o atual ainda está ativo', async () => {
    const f = falso();
    manterEcraLigado(f.nav, f.doc);
    await espera();
    f.mudar(true);
    await espera();
    expect(f.pedidos.length).toBe(1);
  });

  it('em segundo plano espera; parar solta e deixa de ouvir', async () => {
    const f = falso(false);
    const parar = manterEcraLigado(f.nav, f.doc);
    await espera();
    expect(f.pedidos.length).toBe(0);
    f.mudar(true);
    await espera();
    parar();
    await espera();
    expect(f.pedidos[0].released).toBe(true);
    expect(f.ouvintes.length).toBe(0);
  });

  it('sem Wake Lock (WebView, iOS antigo) ou recusado: não rebenta', async () => {
    const f = falso();
    expect(() => manterEcraLigado({}, f.doc)).not.toThrow();
    const recusa = { wakeLock: { request: () => Promise.reject(new Error('NotAllowed')) } };
    manterEcraLigado(recusa as never, f.doc);
    await espera();
  });
});

describe('palco da TV', () => {
  it('720p e 1080p dão o mesmo palco 1920×1080', () => {
    expect(medidasPalco(1280, 720)).toEqual({ escala: 2 / 3, largura: 1920, altura: 1080 });
    expect(medidasPalco(1920, 1080)).toEqual({ escala: 1, largura: 1920, altura: 1080 });
  });
  it('ecrã mais quadrado: mais altura virtual; texto grande compensado', () => {
    const m = medidasPalco(1024, 768);
    expect(m.largura).toBeCloseTo(1920);
    expect(m.altura).toBeCloseTo(1440);
    expect(medidasPalco(1920, 1080, 1.2).escala).toBeCloseTo(1 / 1.2);
  });
  it('encolhe só o que passa da altura e volta a 1 quando cabe', () => {
    expect(novoEncolhe(1, 1080, 1080)).toBe(1);
    expect(novoEncolhe(1, 1200, 1080)).toBe(0.9);
    expect(novoEncolhe(0.9, 1080, 1080)).toBe(0.9); // estável
    expect(novoEncolhe(0.9, 900, 1080)).toBe(1);
  });
});

it('palco: encolhe mesmo que só passe uns px (1085 em 1080); a folga só vale para crescer', () => {
  expect(1085 * novoEncolhe(1, 1085, 1080)).toBeLessThanOrEqual(1080);
  expect(novoEncolhe(0.995, 1076, 1080)).toBe(0.995);
});
