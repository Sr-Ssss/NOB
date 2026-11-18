import { describe, expect, it } from 'vitest';
import {
  DEF_PADRAO_REI,
  EXTRAS,
  T_REFENS,
  acabar,
  candidatosRefem,
  distribuir,
  equipaDe,
  novoRei,
  privadoRei,
  reduzRei,
  vistaRei,
  type AcaoRei,
  type CartaR,
  type EstadoRei,
  type PapelR,
} from './regras';

const T = 1_000_000;
const ids = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);
const ap = (e: EstadoRei, ...a: AcaoRei[]) => a.reduce((s, x) => reduzRei(s, x, T), e);
const tick = (e: EstadoRei) => reduzRei(e, { tipo: 'tick' }, e.terminaEm);

/** até à 1.ª ronda: todos Pronto, todos OK, mostrar líderes */
function emRonda(n: number, def = {}): EstadoRei {
  let e = novoRei(ids(n), def, T);
  e = ap(e, ...e.participantes.map((id) => ({ tipo: 'rd_pronto' as const, id })));
  e = ap(e, ...e.participantes.map((id) => ({ tipo: 'rd_ok' as const, id })));
  return tick(e);
}

/** põe cartas e salas à mão */
function montar(e: EstadoRei, papeis: [PapelR, CartaR['cor'], 0 | 1][]): EstadoRei {
  const cartas: Record<string, CartaR> = {};
  const sala: Record<string, 0 | 1> = {};
  e.participantes.forEach((id, i) => {
    const [papel, cor, k] = papeis[i] ?? ['corte', 'azul', (i % 2) as 0 | 1];
    cartas[id] = { papel, cor };
    sala[id] = k;
  });
  return { ...e, cartas, sala, batata: e.participantes.find((id) => cartas[id].papel === 'batata') ?? null };
}

describe('O Rei e o Dragão — distribuição', () => {
  it('6 e 24 jogadores: Rei + Dragão sempre, extras até metade, pares juntos, equipas equilibradas', () => {
    for (const n of [6, 7, 10, 11, 15, 24]) {
      for (let seed = 0; seed < 20; seed++) {
        const c = Object.values(distribuir(ids(n), DEF_PADRAO_REI, seed * 37));
        expect(c).toHaveLength(n);
        expect(c.filter((x) => x.papel === 'rei')).toEqual([{ papel: 'rei', cor: 'azul' }]);
        expect(c.filter((x) => x.papel === 'dragao')).toEqual([{ papel: 'dragao', cor: 'vermelho' }]);
        const extras = c.filter((x) => !['rei', 'dragao', 'corte', 'rebelde'].includes(x.papel));
        expect(extras.length).toBeLessThanOrEqual(Math.floor((n - 2) / 2));
        for (const p of ['gemeo', 'rival'] as const) {
          const par = c.filter((x) => x.papel === p);
          expect([0, 2]).toContain(par.length);
          if (par.length) expect(par.map((x) => x.cor).sort()).toEqual(['azul', 'vermelho']);
        }
        const trio = ['arqueiro', 'alvo', 'isco'].map((p) => c.filter((x) => x.papel === p).length);
        expect([[0, 0, 0], [1, 1, 1]]).toContainEqual(trio);
        const az = c.filter((x) => equipaDe(x) === 'azul').length;
        const vm = c.filter((x) => equipaDe(x) === 'vermelho').length;
        expect(Math.abs(az - vm)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('com 24 cabem todos os 16 papéis; extras desligados não entram; ajuste dá mais 🔴', () => {
    const todos = new Set<string>();
    for (let seed = 0; seed < 30; seed++) Object.values(distribuir(ids(24), DEF_PADRAO_REI, seed)).forEach((c) => todos.add(c.papel));
    for (const p of ['rei', 'dragao', 'escudeiro', 'domador', 'traidor', 'gemeo', 'rival', 'medroso', 'curioso', 'pajem', 'duque', 'apostador', 'arqueiro', 'alvo', 'isco', 'batata']) expect(todos).toContain(p);
    const sem = { ...DEF_PADRAO_REI, extras: Object.fromEntries(EXTRAS.map((x) => [x, false])) as typeof DEF_PADRAO_REI.extras };
    const c = Object.values(distribuir(ids(8), sem, 1));
    expect(c.every((x) => ['rei', 'dragao', 'corte', 'rebelde'].includes(x.papel))).toBe(true);
    expect(c.filter((x) => x.cor === 'vermelho')).toHaveLength(4);
    const mais = Object.values(distribuir(ids(8), { ...sem, ajuste: 2 }, 1));
    expect(mais.filter((x) => x.cor === 'vermelho')).toHaveLength(6);
  });

  it('Traidor: a carta tem uma cor e joga pela outra', () => {
    expect(equipaDe({ papel: 'traidor', cor: 'azul' })).toBe('vermelho');
    expect(equipaDe({ papel: 'traidor', cor: 'vermelho' })).toBe('azul');
    expect(equipaDe({ papel: 'batata', cor: 'cinza' })).toBeNull();
  });
});

describe('O Rei e o Dragão — fluxo', () => {
  it('rondas e reféns por n.º de jogadores; 2 salas metade/metade', () => {
    expect([6, 10, 11, 14, 15, 24].map((n) => [novoRei(ids(n), {}, T).rondas, novoRei(ids(n), {}, T).refensPorLider])).toEqual([
      [3, 1],
      [3, 1],
      [4, 2],
      [4, 2],
      [5, 2],
      [5, 2],
    ]);
    const v = vistaRei(novoRei(ids(9), {}, T));
    expect([v.salas[0].length, v.salas[1].length].sort()).toEqual([4, 5]);
  });

  it('Pronto → carta → OK → líderes sorteados (um por sala) → ronda', () => {
    let e = novoRei(ids(6), {}, T);
    expect(e.fase).toBe('ir');
    e = ap(e, ...ids(5).map((id) => ({ tipo: 'rd_pronto' as const, id })));
    expect(e.fase).toBe('ir');
    e = ap(e, { tipo: 'rd_pronto', id: 'j6' });
    expect(e.fase).toBe('carta');
    e = ap(e, ...ids(6).map((id) => ({ tipo: 'rd_ok' as const, id })));
    expect(e.fase).toBe('lider');
    expect(e.sala[e.lideres[0]]).toBe(0);
    expect(e.sala[e.lideres[1]]).toBe(1);
    e = tick(e);
    expect(e.fase).toBe('ronda');
    expect(e.ronda).toBe(1);
  });

  it('privacidade: a vista não leva cartas nem a batata até ao fim; cada um só vê a sua', () => {
    const e = emRonda(10);
    const txt = JSON.stringify(vistaRei(e));
    expect(txt).not.toMatch(/"papel"|"(rei|dragao|corte|rebelde)"/);
    for (const id of e.participantes) expect(privadoRei(e, id)!.carta).toEqual(e.cartas[id]);
    expect(privadoRei(e, 'x')).toBeNull();
  });

  it('reféns: só o líder, só nos últimos 30 s, não a si próprio; sem escolha = sorteio; trocam de sala', () => {
    let e = emRonda(8);
    const l0 = e.lideres[0];
    const alvo = candidatosRefem(e, 0)[0];
    expect(ap(e, { tipo: 'rd_refens', id: l0, ids: [alvo] }).refens[0]).toBeNull(); // cedo demais
    const tarde = e.terminaEm - (T_REFENS - 1) * 1000;
    expect(reduzRei(e, { tipo: 'rd_refens', id: l0, ids: [l0] }, tarde).refens[0]).toBeNull();
    expect(reduzRei(e, { tipo: 'rd_refens', id: alvo, ids: [l0] }, tarde).refens[0]).toBeNull();
    e = reduzRei(e, { tipo: 'rd_refens', id: l0, ids: [alvo] }, tarde);
    expect(e.refens[0]).toEqual([alvo]);
    e = tick(e);
    expect(e.fase).toBe('troca');
    expect(e.sala[alvo]).toBe(1);
    expect(e.mudando).toHaveLength(2); // o da sala 2 foi sorteado
    expect(e.mudando).not.toContain(e.lideres[1]);
    // "Cheguei" de todos acaba a troca mais cedo
    e = ap(e, ...e.mudando.map((id) => ({ tipo: 'rd_cheguei' as const, id })));
    expect(e.fase).toBe('ronda');
    expect(e.ronda).toBe(2);
    expect(e.lideres[0]).toBe(l0);
  });

  it('trocar líder: 1× por ronda por sala; maioria absoluta da sala; sem maioria fica o atual', () => {
    let e = emRonda(8);
    const sala0 = e.participantes.filter((id) => e.sala[id] === 0);
    const cand = sala0.find((id) => id !== e.lideres[0])!;
    const outra = e.participantes.find((id) => e.sala[id] === 1)!;
    e = ap(e, { tipo: 'rd_votacao', id: sala0[0] });
    expect(e.votacao[0]).toEqual({});
    expect(ap(e, { tipo: 'rd_votar', id: sala0[0], alvo: outra }).votacao[0]).toEqual({}); // de outra sala
    e = ap(e, { tipo: 'rd_votar', id: sala0[0], alvo: cand }, { tipo: 'rd_votar', id: sala0[1], alvo: cand });
    expect(e.lideres[0]).not.toBe(cand); // 2 de 4 não é maioria
    e = ap(e, { tipo: 'rd_votar', id: sala0[2], alvo: cand });
    expect(e.lideres[0]).toBe(cand);
    expect(e.votacao[0]).toBeNull();
    expect(ap(e, { tipo: 'rd_votacao', id: sala0[0] }).votacao[0]).toBeNull(); // já usada
    // na outra sala: abre, não chega a maioria, o tempo acaba
    const l1 = e.lideres[1];
    e = ap(e, { tipo: 'rd_votacao', id: outra });
    e = tick(e);
    expect(e.lideres[1]).toBe(l1);
  });

  it('🥔 batata: só quem a tem pede (depois de mostrar a carta); se o outro aceitar, fica com a batata', () => {
    let e = emRonda(8);
    e = montar(e, [
      ['batata', 'cinza', 0],
      ['corte', 'azul', 0],
      ['rei', 'azul', 1],
      ['dragao', 'vermelho', 1],
      ['rebelde', 'vermelho', 0],
      ['corte', 'azul', 1],
      ['rebelde', 'vermelho', 0],
      ['rebelde', 'vermelho', 1],
    ]);
    expect(ap(e, { tipo: 'rd_pedir', id: 'j2', alvo: 'j5' }).trocas).toHaveLength(0); // não tem a batata
    expect(ap(e, { tipo: 'rd_pedir', id: 'j1', alvo: 'j3' }).trocas).toHaveLength(0); // outra sala
    e = ap(e, { tipo: 'rd_pedir', id: 'j1', alvo: 'j2' });
    expect(privadoRei(e, 'j2')!.pedido).toBe('j1');
    expect(privadoRei(e, 'j1')!.pedi).toBe('j2');
    expect(vistaRei(e).batata).toBeNull(); // continua secreta
    // recusar: nada muda
    let r = ap(e, { tipo: 'rd_responder', id: 'j2', aceita: false });
    expect(r.batata).toBe('j1');
    expect(r.trocas).toHaveLength(0);
    // quem pediu pode cancelar
    r = ap(e, { tipo: 'rd_fechar', id: 'j1' }, { tipo: 'rd_responder', id: 'j2', aceita: true });
    expect(r.batata).toBe('j1');
    // aceitar: passa
    e = ap(e, { tipo: 'rd_responder', id: 'j2', aceita: true });
    expect(e.batata).toBe('j2');
    expect(e.trocas).toHaveLength(0);
    expect(privadoRei(e, 'j2')!.batata).toBe(true);
  });

  it('desligar e voltar: pausa abaixo de 3 e retoma; quem sai não bloqueia o Pronto', () => {
    let e = novoRei(ids(6), {}, T);
    e = ap(e, ...ids(4).map((id) => ({ tipo: 'rd_pronto' as const, id })));
    e = reduzRei(e, { tipo: 'ligados', ids: ids(4) }, T);
    expect(e.fase).toBe('carta');
    e = emRonda(6);
    const fim = e.terminaEm;
    e = reduzRei(e, { tipo: 'ligados', ids: ['j1', 'j2'] }, T + 1000);
    expect(e.pausaRestante).toBe(fim - T - 1000);
    expect(reduzRei(e, { tipo: 'tick' }, fim + 99999).fase).toBe('ronda');
    e = reduzRei(e, { tipo: 'ligados', ids: ids(6) }, T + 5000);
    expect(e.pausaRestante).toBeNull();
    expect(e.terminaEm).toBe(fim + 4000);
  });

  it('partida inteira sem ninguém tocar (como bots parados): chega ao fim', () => {
    let e = emRonda(12);
    let n = 0;
    while (e.fase !== 'fim' && n++ < 50) e = tick(e);
    expect(e.fase).toBe('fim');
    expect(e.vencedor).not.toBeNull();
    expect(vistaRei(e).cartas).toEqual(e.cartas);
  });
});

describe('O Rei e o Dragão — meia-noite e pontos', () => {
  const base = (papeis: [PapelR, CartaR['cor'], 0 | 1][], extra: Partial<EstadoRei> = {}) => acabar({ ...montar(emRonda(papeis.length), papeis), ...extra }, T);

  it('Rei com o Dragão = 🔴 ganha; separados = 🔵 ganha; Rei/Dragão vencedor +500', () => {
    const junto = base([
      ['rei', 'azul', 0],
      ['dragao', 'vermelho', 0],
      ['corte', 'azul', 1],
      ['rebelde', 'vermelho', 1],
      ['corte', 'azul', 1],
      ['rebelde', 'vermelho', 0],
    ]);
    expect(junto.vencedor).toBe('vermelho');
    expect(junto.pontos.j2).toBe(1500);
    expect(junto.pontos.j4).toBe(1000);
    expect(junto.pontos.j1).toBe(0);
    expect(junto.ganhou.j3).toBe(false);
    const sep = base([
      ['rei', 'azul', 0],
      ['dragao', 'vermelho', 1],
      ['corte', 'azul', 1],
      ['rebelde', 'vermelho', 1],
      ['corte', 'azul', 1],
      ['rebelde', 'vermelho', 0],
    ]);
    expect(sep.vencedor).toBe('azul');
    expect(sep.pontos.j1).toBe(1500);
  });

  it('extras: objetivo +500 (com a equipa a ganhar, exceto Escudeiro/Domador); Traidor pela outra equipa', () => {
    const e = base([
      ['rei', 'azul', 0],
      ['dragao', 'vermelho', 1],
      ['escudeiro', 'azul', 0], // com o Rei: +500 + equipa
      ['domador', 'vermelho', 1], // com o Dragão: +500 (equipa perdeu)
      ['traidor', 'vermelho', 0], // joga 🔵: +1000
      ['medroso', 'azul', 0], // longe do Dragão: +500 + 1000
      ['curioso', 'vermelho', 1], // com o Dragão mas a equipa perdeu: 0
      ['pajem', 'azul', 1], // longe do Rei: só equipa
      ['duque', 'vermelho', 1], // longe do Rei, equipa perdeu: 0
      ['gemeo', 'azul', 0],
      ['gemeo', 'vermelho', 0], // juntos; 🔵 ganha → só o azul +500
    ]);
    expect(e.vencedor).toBe('azul');
    expect(e.pontos).toMatchObject({ j3: 1500, j4: 500, j5: 1000, j6: 1500, j7: 0, j8: 1000, j9: 0, j10: 1500, j11: 0 });
  });

  it('rivais: ganha quem não foi chamuscado e o outro sim', () => {
    const e = base([
      ['rei', 'azul', 0],
      ['dragao', 'vermelho', 0],
      ['rival', 'azul', 1],
      ['rival', 'vermelho', 0],
      ['corte', 'azul', 1],
      ['rebelde', 'vermelho', 1],
    ]);
    expect(e.vencedor).toBe('vermelho');
    expect(e.pontos.j3).toBe(0); // objetivo cumprido mas 🔵 perdeu
    expect(e.pontos.j4).toBe(1000); // chamuscado: só equipa
  });

  it('neutros: Apostador, Arqueiro, Alvo, Isco, Batata (+1000); quem fica com a batata perde tudo', () => {
    const papeis: [PapelR, CartaR['cor'], 0 | 1][] = [
      ['rei', 'azul', 0],
      ['dragao', 'vermelho', 1],
      ['apostador', 'cinza', 0],
      ['arqueiro', 'cinza', 1],
      ['alvo', 'cinza', 0],
      ['isco', 'cinza', 1],
      ['batata', 'cinza', 0],
      ['corte', 'azul', 1],
    ];
    const e = base(papeis, { aposta: 'azul', apontado: 'j6', batata: 'j8' });
    expect(e.pontos).toMatchObject({ j3: 1000, j4: 0, j5: 1000, j6: 1000, j7: 1000, j8: 0 });
    expect(e.ganhou.j8).toBe(false);
    const f = base(papeis, { aposta: 'vermelho', apontado: 'j5' });
    expect(f.pontos).toMatchObject({ j3: 0, j4: 1000, j5: 0, j6: 0, j7: 0 });
  });

  it('antes da meia-noite: só o Apostador aposta e só o Arqueiro aponta; acaba cedo quando os dois escolheram', () => {
    let e = emRonda(8);
    e = montar(e, [
      ['rei', 'azul', 0],
      ['dragao', 'vermelho', 1],
      ['apostador', 'cinza', 0],
      ['arqueiro', 'cinza', 1],
      ['alvo', 'cinza', 0],
      ['isco', 'cinza', 1],
      ['corte', 'azul', 0],
      ['rebelde', 'vermelho', 1],
    ]);
    e = { ...e, ronda: e.rondas };
    e = tick(tick(e));
    expect(e.fase).toBe('aposta');
    expect(ap(e, { tipo: 'rd_apostar', id: 'j1', equipa: 'azul' }).aposta).toBeNull();
    e = ap(e, { tipo: 'rd_apostar', id: 'j3', equipa: 'azul' });
    expect(e.fase).toBe('aposta');
    e = ap(e, { tipo: 'rd_apontar', id: 'j4', alvo: 'j5' });
    expect(e.fase).toBe('fim');
    expect(e.apontado).toBe('j5');
  });
});
