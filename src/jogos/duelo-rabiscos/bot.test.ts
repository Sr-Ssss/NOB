import { describe, expect, it } from 'vitest';
import { sorteDe } from '../../core/ia';
import { jogadaBot } from './bot';
import { novoDuelo, reduzDuelo, resultadoDuelo, vistaDuelo, type EstadoDuelo } from './regras';

/** só bots, cada um com a sua vista: tem de acabar e cada jogada tem de ser aceite */
function partida(semente: number, n = 2, def = {}): { e: EstadoDuelo; tipos: Set<string> } {
  const r = sorteDe(semente);
  let e = novoDuelo(Array.from({ length: n }, (_, i) => `b${i}`), def, 1_000, [], semente);
  const tipos = new Set<string>();
  for (let k = 0; e.fase !== 'fim'; k++) {
    expect(k, `semente ${semente}`).toBeLessThan(3_000);
    const v = vistaDuelo(e);
    const a = e.participantes.map((id) => jogadaBot(v, id, r)).find((x) => x);
    expect(a, `${e.fase} sem jogada`).toBeTruthy();
    const novo = reduzDuelo(e, a!, 1_000);
    expect(novo, `${e.fase}: ${JSON.stringify(a)}`).not.toBe(e);
    tipos.add(e.fase + '/' + a!.tipo);
    e = novo;
  }
  return { e, tipos };
}

describe('bot do Duelo', () => {
  it('partidas de 2 até ao fim, só com jogadas aceites', () => {
    const tipos = new Set<string>();
    let voltas = 0;
    for (let s = 1; s <= 30; s++) {
      const p = partida(s, 2, { obstaculos: (['nenhum', 'poucos', 'muitos'] as const)[s % 3], tinta: [12, 6, 30][s % 3] });
      p.tipos.forEach((t) => tipos.add(t));
      voltas += p.e.volta;
      expect(Object.keys(resultadoDuelo(p.e)).sort()).toEqual(['b0', 'b1']);
    }
    for (const t of ['mago/dr_mago', 'exercito/dr_exercito', 'desenhar/dr_desenho', 'rodar/dr_pronto', 'rodar/dr_rodar', 'vez/dr_andar', 'vez/dr_atacar', 'vez/dr_poder', 'batalha/dr_relancar']) expect(tipos, t).toContain(t);
    // partidas razoáveis: nem relâmpago nem infinitas
    expect(voltas / 30).toBeGreaterThan(2);
    expect(voltas / 30).toBeLessThan(25);
  });
  it('também acaba com 3 e 4', () => {
    for (const n of [3, 4]) for (let s = 1; s <= 4; s++) expect(partida(s, n).e.fase).toBe('fim');
  });
});
