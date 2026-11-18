import { describe, expect, it } from 'vitest';
import { CATALOGO, filtrar, motivo } from './jogos';

const j = (id: string) => CATALOGO.find((x) => x.id === id)!;

describe('menu de jogos', () => {
  it('compatibilidade: o porquê de cada jogo esbatido', () => {
    expect(motivo(j('5050'), 3)).toBeNull();
    expect(motivo(j('5050'), 2)).toEqual({ tipo: 'poucos', precisa: 3, tem: 2 });
    expect(motivo(j('5050'), 20)).toBeNull(); // a mais = audiência
    expect(motivo(j('pirata'), 8)).toBeNull();
    expect(motivo(j('rei'), 8)).toBeNull();
    expect(motivo(j('ragerob'), 8)).toBeNull();
    expect(motivo(j('ragerob'), 8, true)).toEqual({ tipo: 'tv' });
  });

  it('pesquisa e filtros', () => {
    expect(filtrar(CATALOGO, 'pira', [], 4, 'pt-BR').map((x) => x.id)).toEqual(['pirata']);
    expect(filtrar(CATALOGO, '', ['tv'], 4, 'pt-BR').every((x) => x.precisaTv)).toBe(true);
    expect(filtrar(CATALOGO, '', ['pessoas'], 3, 'pt-BR').some((x) => x.id === 'pirata')).toBe(false);
    expect(filtrar(CATALOGO, 'thinkers', [], 4, 'en').map((x) => x.id)).toEqual(['pensa']);
  });
});
