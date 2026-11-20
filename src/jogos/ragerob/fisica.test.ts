import { describe, expect, it } from 'vitest';
import Matter from 'matter-js';
import { Combate, R } from './fisica';
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

  it('IA: rodeia, alinha, ataca e recua (sem empurra-empurra de frente), e cada robô tem a sua personalidade', () => {
    const galos = [0, 1, 2, 3].map((i) => ({ ...robo(i, [null, null, null, null]), corpo: 'quadrado' as const, cabeca: 'galo' as const }));
    const c = new Combate(galos, [], 77);
    const modos: Record<string, number> = {};
    let maxFrente = 0;
    for (let n = 0; n < 60 * 40 && !c.acabou; n++) {
      c.passo({});
      for (const r of c.vivos()) {
        modos[r.ia.modo] = (modos[r.ia.modo] ?? 0) + 1;
        maxFrente = Math.max(maxFrente, r.frenteAFrente);
      }
    }
    for (const m of ['rodear', 'alinhar', 'atacar', 'recuar']) expect(modos[m] ?? 0).toBeGreaterThan(30);
    expect(maxFrente).toBeLessThan(1);
    expect(new Set(c.robos.map((r) => r.pers.distancia.toFixed(0))).size).toBe(4);
  });

  it('crocodilo: morde e arrasta a presa até à serra; a serra é sólida e cospe os robôs', () => {
    const croco = { ...robo(0, [null, null, null, null]), corpo: 'quadrado' as const, loco: 'lagartas' as const, cabeca: 'crocodilo' as const };
    const presa = { ...robo(1, [null, null, null, null]), corpo: 'quadrado' as const, loco: 'rodas' as const, cabeca: 'galo' as const };
    const c = new Combate([croco, presa], ['serra'], 5);
    const serra = c.perigos.find((h) => h.tipo === 'serra')!;
    const [a, b] = c.robos;
    // presa entre o crocodilo e a serra, a 200 px dela
    Matter.Body.setPosition(b.corpo, { x: serra.x + 200, y: serra.y });
    Matter.Body.setPosition(a.corpo, { x: serra.x + 290, y: serra.y });
    Matter.Body.setAngle(a.corpo, -Math.PI / 2); // virado para a presa (para a esquerda)
    let destino = false;
    let perto = Infinity;
    for (let n = 0; n < 60 * 6; n++) {
      c.passo({ [b.id]: { f: 0, r: 0 } });
      if (a.agarra?.destino) destino = true;
      perto = Math.min(perto, Math.hypot(b.corpo.position.x - serra.x, b.corpo.position.y - serra.y));
      // a serra não deixa ninguém passar por dentro
      for (const r of c.vivos()) expect(Math.hypot(r.corpo.position.x - serra.x, r.corpo.position.y - serra.y)).toBeGreaterThan(serra.w / 2 + 8);
    }
    expect(destino).toBe(true);
    expect(perto).toBeLessThan(serra.w / 2 + R + 20);
  });

  it('o humano conduz: frente anda para a frente', () => {
    const c = new Combate([robo(0, [null, null, null, null]), robo(1, [null, null, null])], [], 1);
    const p0 = { ...c.robos[0].corpo.position };
    for (let i = 0; i < 30; i++) c.passo({ r0: { f: 1, r: 0 } });
    expect(Math.hypot(c.robos[0].corpo.position.x - p0.x, c.robos[0].corpo.position.y - p0.y)).toBeGreaterThan(20);
    expect(c.robos[0].humano).toBe(true);
  });
});
