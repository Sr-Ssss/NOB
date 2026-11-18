import { afterEach, describe, expect, it, vi } from 'vitest';
import { chaveSegurar, eventosSegurar, mudarTocarParaMostrar, type ChaveSegurar } from './acessibilidade';
import pt from '../i18n/pt-BR.json';
import en from '../i18n/en.json';

const guardado: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => guardado[k] ?? null,
  setItem: (k: string, v: string) => (guardado[k] = v),
  removeItem: (k: string) => delete guardado[k],
});

function botao(aberto = false) {
  const chamadas: string[] = [];
  const ev = eventosSegurar({ segurar: () => chamadas.push('segurar'), largar: () => chamadas.push('largar'), mostrar: () => chamadas.push('mostrar'), aberto });
  return { ev: ev as unknown as Record<string, (e: unknown) => void>, chamadas };
}

describe('botões de segurar (acessibilidade)', () => {
  afterEach(() => mudarTocarParaMostrar(false));

  it('com o teclado: Espaço/Enter seguro = segurar; largar a tecla = largar; a repetição não conta', () => {
    const { ev, chamadas } = botao();
    ev.onKeyDown({ key: ' ', repeat: false });
    ev.onKeyDown({ key: ' ', repeat: true });
    ev.onKeyDown({ key: 'a', repeat: false });
    ev.onKeyUp({ key: ' ' });
    ev.onKeyDown({ key: 'Enter', repeat: false });
    expect(chamadas).toEqual(['segurar', 'largar', 'segurar']);
  });

  it('"tocar para mostrar": um toque mostra, outro esconde', () => {
    mudarTocarParaMostrar(true);
    const fechado = botao(false);
    expect(fechado.ev.onPointerDown).toBeUndefined();
    fechado.ev.onClick(undefined);
    const aberto = botao(true);
    aberto.ev.onClick(undefined);
    expect([...fechado.chamadas, ...aberto.chamadas]).toEqual(['mostrar', 'largar']);
  });
});

describe('textos "Segure…" / "Toque…"', () => {
  afterEach(() => mudarTocarParaMostrar(false));
  const SEGURAR: ChaveSegurar[] = ['prSegura', 'rmCarta', 'rmVer', 'idSegurar'];
  const AJUDAS = ['ajudaPirata', 'ajudaMaquinas', 'ajudaRei', 'rdInfoRegras'] as const;
  const DICS: Record<string, string>[] = [pt, en];
  const texto = (d: Record<string, string>, c: string) => d[c].replace('{segurar}', d[chaveSegurar('idSegurar')]);

  it('modo normal: chaves de sempre, ajudas dizem "Segure/Hold"', () => {
    for (const c of SEGURAR) expect(chaveSegurar(c)).toBe(c);
    for (const d of DICS) for (const c of AJUDAS) expect(texto(d, c)).toMatch(/Segure|Hold/);
  });

  it('modo tocar: nenhum texto diz "Segure/Hold" (pt-BR e en)', () => {
    mudarTocarParaMostrar(true);
    for (const d of DICS) {
      for (const c of SEGURAR) {
        expect(chaveSegurar(c)).toBe(c + 'Tocar');
        expect(d[chaveSegurar(c)]).toMatch(/Toque|Tap/);
      }
      for (const c of AJUDAS) expect(texto(d, c)).not.toMatch(/Segur|Hold|\{segurar\}/i);
    }
  });
});
