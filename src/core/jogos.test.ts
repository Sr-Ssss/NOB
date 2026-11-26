import { describe, expect, it } from 'vitest';
import { CATALOGO, motivo, ordenarMenu } from './jogos';

const j = (id: string) => CATALOGO.find((x) => x.id === id)!;

describe('menu de jogos', () => {
  it('compatibilidade: o porquê de cada jogo esbatido', () => {
    expect(motivo(j('5050'), 3)).toBeNull();
    expect(motivo(j('5050'), 2)).toEqual({ tipo: 'poucos', precisa: 3, tem: 2 });
    expect(motivo(j('5050'), 20)).toBeNull(); // a mais = audiência
    expect(motivo(j('pirata'), 8)).toBeNull();
    expect(motivo(j('rei'), 8)).toBeNull();
    expect(motivo(j('ragerob'), 8)).toBeNull();
    // Fase 10 (20/11): todos os jogos dão sem TV
    for (const x of CATALOGO.filter((y) => y.max >= 8)) expect(motivo(x, 8, true)).toBeNull();
    expect(motivo(j('duelo'), 8, true)).toEqual({ tipo: 'muitos', max: 4, tem: 8 });
    expect(CATALOGO.some((x) => x.precisaTv)).toBe(false);
  });

  it('ordem do menu: os que dão primeiro, por duração; os que não dão no fim', () => {
    const l = ordenarMenu(CATALOGO, 4, true);
    expect(l).toHaveLength(CATALOGO.length);
    const da = l.filter((x) => !motivo(x, 4, true));
    // nenhum indisponível antes de um disponível
    expect(l.slice(0, da.length)).toEqual(da);
    expect(da.map((x) => x.minutos)).toEqual([...da.map((x) => x.minutos)].sort((a, b) => a - b));
    expect(da[0].id).toBe('5050'); // 10 min
    // com 4, os de 5+ vão para o fim; sem TV, o Se Vira! e o Ragerob dão (Fase 10)
    expect(l.slice(da.length).map((x) => x.id)).toEqual(expect.arrayContaining(['pirata', 'rei', 'maquinas']));
    expect(da.map((x) => x.id)).toEqual(expect.arrayContaining(['sevira', 'ragerob']));
    expect(ordenarMenu(CATALOGO, 4).slice(0, 6).map((x) => x.id)).toContain('ragerob');
  });
});
