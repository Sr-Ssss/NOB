import { describe, expect, it } from 'vitest';
import { Combate } from './fisica';
import { CABECAS, LOCOS, MODULOS, PERIGOS, type Robo } from './pecas';
import { arenaDe, entre, quadroDe, quadroValido } from './quadro';
import { DEF_PADRAO_RAGEROB, novoRagerob, reduzRagerob, type EstadoRagerob } from './regras';
import { ID_TV, novaSala, reduzSala, type EstadoSala } from '../../core/sala';

const robo = (i: number): Robo => ({ id: 'r' + i, corpo: 'quadrado', loco: LOCOS[i % 3], cabeca: CABECAS[i % 5], cor: i, modulos: [MODULOS[i % 10], null, null, null] });

describe('Ragerob sem TV — quadros da arena (Fase 10)', () => {
  it('um quadro é JSON pequeno e volta a dar uma arena desenhável com os robôs da vista', () => {
    const robos = [robo(0), robo(1), robo(2)];
    const c = new Combate(robos, PERIGOS.slice(0, 3), 5);
    for (let n = 0; n < 60 * 5; n++) c.passo({});
    const q = quadroDe(c);
    const txt = JSON.stringify(q);
    expect(quadroValido(JSON.parse(txt))).toBe(true);
    expect(txt.length).toBeLessThan(12_000);
    const a = arenaDe(JSON.parse(txt), robos);
    expect(a.robos.map((r) => r.id)).toEqual(['r0', 'r1', 'r2']);
    expect(a.robos[0].corpo.position.x).toBeCloseTo(c.robos[0].corpo.position.x, 0);
    expect(a.robos[0].robo).toBe(robos[0]);
    // robô que a vista não conhece fica de fora
    expect(arenaDe(q, robos.slice(0, 2)).robos).toHaveLength(2);
    expect(quadroValido({ t: 1 })).toBe(false);
  });

  it('entre dois quadros: posições a meio, ângulo pelo caminho curto', () => {
    const base = quadroDe(new Combate([robo(0)], [], 1));
    const a = { ...base, t: 1, robos: [{ ...base.robos[0], x: 100, y: 100, a: 3.1 }] };
    const b = { ...base, t: 2, robos: [{ ...base.robos[0], x: 200, y: 300, a: -3.1 }] };
    const m = entre(a, b, 0.5);
    expect(m.t).toBeCloseTo(1.5);
    expect(m.robos[0].x).toBeCloseTo(150);
    expect(m.robos[0].y).toBeCloseTo(200);
    expect(Math.abs(Math.abs(m.robos[0].a) - Math.PI)).toBeLessThan(0.01);
    expect(entre(a, b, 2)).toBe(b);
  });

  it('rr_quadro: só o host (TV ou, sem TV, o telemóvel que tem a sala) o manda, e só em combate', () => {
    let s: EstadoSala = { ...novaSala('ABCD', 'pt-BR'), semTv: true };
    for (const i of [1, 2, 3]) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `N${i}`, avatar: i, tag: `t${i}` }, 0);
    s = reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'ragerob' }, 100);
    expect(s.ragerob).toBeTruthy();
    // leva o jogo até ao combate
    let g = s.ragerob as EstadoRagerob;
    let t = 100;
    for (let n = 0; n < 20 && g.fase !== 'combate'; n++) {
      t = g.terminaEm;
      g = reduzRagerob(g, { tipo: 'tick' }, t);
    }
    expect(g.fase).toBe('combate');
    s = { ...s, ragerob: g };
    const robos = g.combate!.robos.map((id) => g.robos.find((r) => r.id === id)!);
    const q = quadroDe(new Combate(robos, [], 3));
    expect(reduzSala(s, { tipo: 'jogo', acao: { tipo: 'rr_quadro', id: 'j2', q } }, t).ragerob!.combate!.quadro).toBeUndefined();
    expect(reduzSala(s, { tipo: 'jogo', acao: { tipo: 'rr_quadro', id: ID_TV, q } }, t).ragerob!.combate!.quadro).toEqual(q);
    // fora do combate, nada
    const novo = novoRagerob(['j1', 'j2'], DEF_PADRAO_RAGEROB, 0, [], 7);
    expect(reduzRagerob(novo, { tipo: 'rr_quadro', id: ID_TV, q }, 0)).toBe(novo);
  });
});
