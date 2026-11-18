import { describe, expect, it } from 'vitest';
import { Combate } from './fisica';
import { MODULOS, PERIGOS, type Robo } from './pecas';
import { CABECAS, LOCOS } from './pecas';

const robo = (i: number, mods: Robo['modulos']): Robo => ({ id: 'r' + i, corpo: (['quadrado', 'triangulo', 'pentagono', 'bola'] as const)[i % 4], loco: LOCOS[i % 3], cabeca: CABECAS[i % 5], cor: i, modulos: mods });

describe('Ragerob — física', () => {
  it('o combate acaba sempre (a arena encolhe a arder) e a ordem tem todos os robôs', () => {
    for (let s = 1; s <= 4; s++) {
      const robos = [0, 1, 2, 3].map((i) => robo(i + s, [MODULOS[(i + s) % 10], MODULOS[(i * 3 + s) % 10], null, null, null].slice(0, i % 4 === 1 ? 3 : 4)));
      const c = new Combate(robos, PERIGOS.slice(s % 4, (s % 4) + 4), s * 101);
      let n = 0;
      while (!c.acabou && n++ < 60 * 300) c.passo({});
      expect(c.acabou).toBe(true);
      expect(c.ordem().flat().sort()).toEqual(robos.map((r) => r.id).sort());
      expect(c.robos.reduce((a, r) => a + r.dano, 0)).toBeGreaterThan(0);
    }
  });

  it('o humano conduz: frente anda para a frente', () => {
    const c = new Combate([robo(0, [null, null, null, null]), robo(1, [null, null, null])], [], 1);
    const p0 = { ...c.robos[0].corpo.position };
    for (let i = 0; i < 30; i++) c.passo({ r0: { f: 1, r: 0 } });
    expect(Math.hypot(c.robos[0].corpo.position.x - p0.x, c.robos[0].corpo.position.y - p0.y)).toBeGreaterThan(20);
    expect(c.robos[0].humano).toBe(true);
  });
});
