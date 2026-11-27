import { describe, expect, it } from 'vitest';
import { PRECO } from './pecas';
import {
  CAPITAL,
  CAPITAL_PILOTOS,
  DEF_PADRAO_RAGEROB,
  PRECO_CONTROLO,
  T_LANCE_EXTRA,
  T_LEILAO,
  T_MARTELO,
  grupoAtual,
  novoRagerob,
  reduzRagerob,
  tabela,
  vistaRagerob,
  type AcaoRagerob,
  type DefRagerob,
  type EstadoRagerob,
} from './regras';

const J = (n: number) => Array.from({ length: n }, (_, i) => 'j' + (i + 1));
const novo = (n: number, def: Partial<DefRagerob> = {}) => novoRagerob(J(n), { ...DEF_PADRAO_RAGEROB, ...def }, 0, [], 7);
const r = (s: EstadoRagerob, a: AcaoRagerob, t = 1000) => reduzRagerob(s, a, t);
const total = (s: EstadoRagerob) => Object.values(s.carteira).reduce((a, b) => a + b, 0);
/** a TV acaba o combate: o 1.º do grupo ganha, os outros caem por ordem */
const fimTv = (s: EstadoRagerob, t = 2000): EstadoRagerob => {
  const g = s.combate!.robos;
  return r(s, { tipo: 'rr_fim', id: 'tv', ordem: g.map((x) => [x]), dano: Object.fromEntries(g.map((x, i) => [x, 100 - i * 20])), kos: { [g[0]]: g.length - 1 } }, t);
};
/** passa a fase pelo tempo */
const tempo = (s: EstadoRagerob) => r(s, { tipo: 'tick' }, s.terminaEm);
/** passa o leilão (ou a loja privada) inteiro sem lances */
const semLoja = (s: EstadoRagerob): EstadoRagerob => (s.fase === 'loja' ? semLoja(tempo(s)) : s);
const lance = (s: EstadoRagerob, id: string, valor: number, t = 1000, item = 0) => r(s, { tipo: 'rr_lance', id, item, valor }, t);

describe('Ragerob — modo normal', () => {
  it('começa com 8 robôs, 500 cada (Pilotos 1500), leilão de 5 módulos; 2 jogadores chegam', () => {
    const s = novo(2);
    expect(s.robos).toHaveLength(8);
    expect(s.fase).toBe('loja');
    expect(s.loja).toHaveLength(5);
    expect(s.carteira).toEqual({ j1: CAPITAL, j2: CAPITAL });
    expect(CAPITAL).toBe(500);
    expect(novo(2, { modo: 'pilotos' }).carteira.j1).toBe(CAPITAL_PILOTOS);
    expect(s.grupos.map((g) => g.length)).toEqual([4, 4]);
    expect(new Set(s.robos.map((x) => x.cor)).size).toBe(8);
    expect(s.robos.every((x) => x.modulos.every((m) => m === null))).toBe(true);
    expect(novo(10, { rondas: 4 }).robos).toHaveLength(16);
  });

  it('leilão ao vivo: os 5 ao mesmo tempo, o lance mais alto substitui o anterior e o dinheiro só sai ao martelo', () => {
    let s = novo(3);
    const p = PRECO[s.loja[0]];
    expect(s.terminaEm).toBe(T_LEILAO * 1000);
    expect(s.leilao).toEqual({ lances: [null, null, null, null, null], martelo: false });
    expect(lance(s, 'j1', p - 1)).toBe(s); // abaixo do preço
    expect(lance(s, 'j1', CAPITAL + 1)).toBe(s); // não cabe na carteira
    expect(lance(s, 'j1', p + 0.5)).toBe(s);
    expect(lance(s, 'j1', NaN)).toBe(s);
    expect(lance(s, 'x', p)).toBe(s);
    expect(lance(s, 'j1', p, 1000, 5)).toBe(s); // módulo que não existe
    s = lance(s, 'j1', p);
    expect(lance(s, 'j1', p + 50)).toBe(s); // já lidera
    expect(lance(s, 'j2', p)).toBe(s); // não supera
    expect(s.terminaEm).toBe(T_LEILAO * 1000); // ainda havia tempo
    s = lance(s, 'j2', p + 50, 28_000);
    expect(s.terminaEm).toBe(28_000 + T_LANCE_EXTRA * 1000);
    // dois toques ao mesmo tempo no mesmo +50: o segundo não paga mais do que viu
    expect(lance(s, 'j3', p + 50, 28_000)).toBe(s);
    expect(vistaRagerob(s).leilao!.lances[0]).toEqual({ id: 'j2', valor: p + 50 });
    expect(s.carteira.j2).toBe(CAPITAL);
    const fim = s.terminaEm;
    s = tempo(s);
    expect(s.leilao!.martelo).toBe(true);
    expect(s.terminaEm).toBe(fim + T_MARTELO * 1000);
    expect(s.carteira.j2).toBe(CAPITAL - p - 50);
    expect(s.inventario.j2).toEqual([s.loja[0]]);
    expect(lance(s, 'j3', p + 100)).toBe(s); // vendido
    s = tempo(s);
    expect(s.fase).toBe('aposta');
    expect(s.leilao).toBeNull();
    expect(s.vendidos).toEqual([{ id: 'j2', valor: p + 50 }, null, null, null, null]);
    expect(total(s)).toBe(3 * CAPITAL - p - 50); // o dinheiro gasto some
  });

  it('leilão: não se promete mais do que se tem (soma dos lances em que lidera)', () => {
    let s = novo(2);
    s = { ...s, loja: ['oleo', 'martelo', 'escudo', 'chamas', 'bobina'], carteira: { j1: 350, j2: 500 } };
    s = lance(s, 'j1', 100, 1000, 0); // óleo
    s = lance(s, 'j1', 200, 1000, 1); // martelo: 100 + 200 = 300 cabe
    expect(lance(s, 'j1', 100, 1000, 2)).toBe(s); // escudo: 400 > 350
    s = lance(s, 'j2', 150, 1000, 0); // a j1 deixa de liderar o óleo: os 100 voltam a contar
    s = lance(s, 'j1', 100, 1000, 2);
    expect(s.leilao!.lances.map((l) => l?.id ?? null)).toEqual(['j2', 'j1', 'j1', null, null]);
    s = tempo(s);
    expect(s.carteira).toEqual({ j1: 50, j2: 350 });
  });

  it('apostas por pódio: um toque, sem pôr dinheiro; muda-se até o tempo acabar; paga 250/150/100/50', () => {
    let s = semLoja(novo(5));
    const [a, b, c, d] = grupoAtual(s);
    expect(r(s, { tipo: 'rr_apostar', id: 'j1', robo: 'r99' })).toBe(s);
    expect(r(s, { tipo: 'rr_apostar', id: 'x', robo: a })).toBe(s);
    s = r(s, { tipo: 'rr_apostar', id: 'j1', robo: b });
    s = r(s, { tipo: 'rr_apostar', id: 'j1', robo: a });
    s = r(s, { tipo: 'rr_apostar', id: 'j2', robo: b });
    s = r(s, { tipo: 'rr_apostar', id: 'j3', robo: c });
    s = r(s, { tipo: 'rr_apostar', id: 'j4', robo: d });
    expect(vistaRagerob(s).apostas).toEqual({ j1: a, j2: b, j3: c, j4: d });
    expect(total(s)).toBe(5 * CAPITAL);
    s = r(s, { tipo: 'rr_apostar', id: 'j5', robo: a });
    expect(s.fase).toBe('aposta'); // todos escolheram: ainda se pode mudar
    s = { ...s, apostas: { j1: a, j2: b, j3: c, j4: d } }; // j5 sem escolha
    s = tempo(s);
    expect(s.fase).toBe('combate'); // ninguém tem módulos: salta o instalar
    s = fimTv(s);
    expect(s.resultado!.vencedor).toBe(a);
    expect(s.resultado!.ganhos).toEqual({ j1: 250, j2: 150, j3: 100, j4: 50 });
    expect(s.carteira).toEqual({ j1: 750, j2: 650, j3: 600, j4: 550, j5: 500 });
    expect(s.resultado!.passam).toHaveLength(2);
  });

  it('final paga 400/150; vários no mesmo robô recebem todos por inteiro', () => {
    let s = semLoja(novo(3));
    s = { ...s, grupos: [grupoAtual(s).slice(0, 2)] };
    const [a, b] = grupoAtual(s);
    for (const [id, robo] of [['j1', a], ['j2', a], ['j3', b]]) s = r(s, { tipo: 'rr_apostar', id, robo });
    s = fimTv(tempo(s));
    expect(s.resultado!.ganhos).toEqual({ j1: 400, j2: 400, j3: 150 });
  });

  it('KO ao mesmo tempo: os empatados recebem o prémio do melhor lugar do grupo', () => {
    const base = semLoja(novo(3));
    const [a, b, c, d] = grupoAtual(base);
    let s = base;
    for (const [id, robo] of [['j1', b], ['j2', c], ['j3', d]]) s = r(s, { tipo: 'rr_apostar', id, robo });
    s = tempo(s);
    const fim = (ordem: string[][]) => r(s, { tipo: 'rr_fim', id: 'tv', ordem, dano: {}, kos: {} }).resultado!.ganhos;
    expect(fim([[a], [b, c], [d]])).toEqual({ j1: 150, j2: 150, j3: 50 });
    expect(fim([[a, b, c, d]])).toEqual({ j1: 250, j2: 250, j3: 250 });
  });

  it('com 0 ainda se escolhe robô', () => {
    let s = semLoja(novo(2));
    s = { ...s, carteira: { j1: 0, j2: 0 } };
    s = r(s, { tipo: 'rr_apostar', id: 'j1', robo: grupoAtual(s)[0] });
    s = tempo(s);
    expect(r(s, { tipo: 'rr_controlar', id: 'j1' })).toBe(s); // não chega para conduzir
    expect(fimTv(s).carteira).toEqual({ j1: 250, j2: 0 });
  });

  it('instalar: só no robô em que apostou; trocar custa +50%', () => {
    let s = novo(2);
    s = { ...s, carteira: { j1: 1500, j2: 1500 } };
    for (let k = 0; k < 2; k++) s = lance(s, 'j1', PRECO[s.loja[k]], 1000, k);
    s = semLoja(s);
    const robo = grupoAtual(s)[0];
    s = r(s, { tipo: 'rr_apostar', id: 'j1', robo });
    s = tempo(s);
    expect(s.fase).toBe('instalar');
    const [m0, m1] = s.inventario.j1;
    expect(r(s, { tipo: 'rr_instalar', id: 'j2', inv: 0, encaixe: 0 })).toBe(s);
    s = r(s, { tipo: 'rr_instalar', id: 'j1', inv: 0, encaixe: 0 });
    const antes = s.carteira.j1;
    s = r(s, { tipo: 'rr_instalar', id: 'j1', inv: 0, encaixe: 0 });
    expect(s.robos.find((x) => x.id === robo)!.modulos[0]).toBe(m1);
    expect(antes - s.carteira.j1).toBe(Math.ceil(PRECO[m1] / 2));
    expect(m0).toBeTruthy();
    s = r(s, { tipo: 'rr_pronto', id: 'j1' });
    expect(s.fase).toBe('combate');
  });

  it('controlar: paga 100, só quem apostou nesse robô, 15 s cada, em fila', () => {
    let s = semLoja(novo(3));
    const robo = grupoAtual(s)[0];
    s = r(s, { tipo: 'rr_apostar', id: 'j1', robo });
    s = r(s, { tipo: 'rr_apostar', id: 'j2', robo });
    s = tempo(s);
    expect(r(s, { tipo: 'rr_controlar', id: 'j3' }, 5000)).toBe(s);
    s = r(s, { tipo: 'rr_controlar', id: 'j1' }, 5000);
    s = r(s, { tipo: 'rr_controlar', id: 'j2' }, 5000);
    expect(s.combate!.condutor[robo]).toEqual({ id: 'j1', ate: 20000 });
    expect(s.combate!.fila[robo]).toEqual(['j2']);
    expect(s.carteira.j1).toBe(CAPITAL - PRECO_CONTROLO);
    s = r(s, { tipo: 'rr_conduzir', id: 'j2', f: 1, r: 0 }, 6000);
    expect(s.combate!.comandos[robo]).toBeUndefined();
    s = r(s, { tipo: 'rr_conduzir', id: 'j1', f: 5, r: -1 }, 6000);
    expect(s.combate!.comandos[robo]).toEqual({ f: 1, r: -1, em: 6000 });
    s = r(s, { tipo: 'tick' }, 20000);
    expect(s.combate!.condutor[robo].id).toBe('j2');
    expect(total(s)).toBe(3 * CAPITAL - 2 * PRECO_CONTROLO); // some
  });

  it('torneio inteiro de 3 rondas: 8 → 4 → 2 → campeão; quem acerta sempre ganha 3 × 250 + 400', () => {
    let s = novo(2);
    let n = 0;
    while (s.fase !== 'fim' && n++ < 100) {
      if (s.fase === 'aposta') s = r(s, { tipo: 'rr_apostar', id: 'j1', robo: grupoAtual(s)[0] });
      if (s.fase === 'combate') s = fimTv(s);
      else s = tempo(s);
    }
    expect(s.fase).toBe('fim');
    expect(s.ronda).toBe(3);
    expect(s.campeao).toBeTruthy();
    expect(s.carteira).toEqual({ j1: CAPITAL + 3 * 250 + 400, j2: CAPITAL });
  });

  it('KO de todos ao mesmo tempo: sem vencedor, empate na colocação', () => {
    let s = tempo(semLoja(novo(2)));
    const g = s.combate!.robos;
    s = r(s, { tipo: 'rr_fim', id: 'tv', ordem: [g], dano: {}, kos: {} });
    expect(s.resultado!.vencedor).toBeNull();
    expect(s.resultado!.passam).toHaveLength(2);
  });

  it('sem fim da TV: acaba sozinho pela vida (rede de segurança)', () => {
    let s = tempo(semLoja(novo(2)));
    const g = s.combate!.robos;
    s = r(s, { tipo: 'rr_vidas', id: 'tv', vidas: { [g[2]]: 80, [g[0]]: 10, [g[1]]: 0, [g[3]]: 0 } });
    s = r(s, { tipo: 'tick' }, 1e6);
    expect(s.fase).toBe('resultado');
    expect(s.resultado!.ordem[0]).toEqual([g[2]]);
  });

  it('desligar e voltar: pausa com menos de 2 ligados e o dinheiro fica', () => {
    let s = novo(2);
    s = r(s, { tipo: 'ligados', ids: ['j1'] }, 5000);
    expect(s.pausaRestante).toBe(T_LEILAO * 1000 - 5000);
    expect(lance(s, 'j1', 500)).toBe(s); // em pausa não se licita
    expect(r(s, { tipo: 'tick' }, 1e9).fase).toBe('loja');
    s = r(s, { tipo: 'ligados', ids: ['j1', 'j2'] }, 9000);
    expect(s.pausaRestante).toBeNull();
    expect(s.terminaEm).toBe(9000 + T_LEILAO * 1000 - 5000);
    expect(s.carteira.j2).toBe(CAPITAL);
  });

  it('loja privada: compra direta a preço fixo, sem leilão', () => {
    let s = novo(2, { loja: 'privada' });
    expect(s.loja).toEqual([]);
    const m = s.lojaPrivada.j1[2]!;
    s = r(s, { tipo: 'rr_comprar', id: 'j1', item: 2 });
    expect(s.inventario.j1).toEqual([m]);
    expect(s.lojaPrivada.j1[2]).toBeNull();
    expect(s.carteira.j1).toBe(CAPITAL - PRECO[m]);
    expect(lance(s, 'j1', 500, 1000, 0)).toBe(s);
  });

});

describe('Ragerob — modo Pilotos (liga)', () => {
  it('cada jogador monta o seu; a IA completa até 8 (12 com 9–10)', () => {
    let s = novo(3, { modo: 'pilotos' });
    expect(s.fase).toBe('montar');
    expect(s.robos.filter((x) => x.dono).map((x) => x.dono)).toEqual(['j1', 'j2', 'j3']);
    expect(novo(9, { modo: 'pilotos' }).robos).toHaveLength(12);
    s = r(s, { tipo: 'rr_montar', id: 'j1', corpo: 'pentagono', loco: 'pernas', cabeca: 'ourico' });
    expect(s.robos[0]).toMatchObject({ corpo: 'pentagono', loco: 'pernas', cabeca: 'ourico', modulos: [null, null, null, null, null] });
    s = r(s, { tipo: 'rr_montar', id: 'j2', corpo: 'bola', loco: 'rodas', cabeca: 'galo' });
    s = r(s, { tipo: 'rr_montar', id: 'j3', corpo: 'bola', loco: 'rodas', cabeca: 'galo' });
    expect(s.fase).toBe('loja');
  });

  it('dinheiro por combate: 200 + dano (teto 300) + 100/KO + colocação; pontos 3/2/1/0', () => {
    let s = tempo(novo(2, { modo: 'pilotos' }));
    s = semLoja(s);
    while (s.fase === 'instalar') s = tempo(s);
    expect(s.fase).toBe('combate');
    const g = s.combate!.robos;
    const antes = { ...s.carteira };
    s = r(s, { tipo: 'rr_fim', id: 'tv', ordem: [[g[0]], [g[1]], [g[2], g[3]]], dano: { [g[0]]: 450, [g[1]]: 40 }, kos: { [g[0]]: 2 } });
    const dono = (id: string) => s.robos.find((x) => x.id === id)!.dono ?? id;
    expect(s.carteira[dono(g[0])] - antes[dono(g[0])]).toBe(200 + 300 + 200 + 300);
    expect(s.carteira[dono(g[1])] - antes[dono(g[1])]).toBe(200 + 40 + 200);
    expect(s.carteira[dono(g[2])] - antes[dono(g[2])]).toBe(200 + 100); // empatados em 3.º
    expect([s.pontos[g[0]], s.pontos[g[1]], s.pontos[g[2]], s.pontos[g[3]]]).toEqual([3, 2, 1, 1]);
  });

  it('cada humano conduz o seu robô o combate todo; não pode controlar outros', () => {
    let s = semLoja(tempo(novo(2, { modo: 'pilotos' })));
    while (s.fase !== 'combate') s = tempo(s);
    const meu = s.combate!.robos.find((x) => s.robos.find((y) => y.id === x)!.dono)!;
    const dono = s.robos.find((y) => y.id === meu)!.dono!;
    s = r(s, { tipo: 'rr_conduzir', id: dono, f: 1, r: 1 });
    expect(s.combate!.comandos[meu]).toBeTruthy();
    expect(r(s, { tipo: 'rr_controlar', id: dono })).toBe(s);
  });

  it('liga inteira: 4 rondas, todos jogam todas, ganha quem tem mais pontos (desempate: dano)', () => {
    let s = novo(5, { modo: 'pilotos' });
    let n = 0;
    const jogos: Record<string, number> = {};
    while (s.fase !== 'fim' && n++ < 200) {
      if (s.fase === 'combate') {
        for (const x of s.combate!.robos) jogos[x] = (jogos[x] ?? 0) + 1;
        s = fimTv(s);
      } else if (s.fase === 'loja') {
        for (let t = s.terminaEm - 10_000; s.fase === 'loja'; t += 250) {
          s = r(s, { tipo: 'tick' }, t);
          for (const l of s.leilao?.lances ?? []) if (l && !s.participantes.includes(l.id) && !s.leilao!.martelo) expect(s.carteira[l.id]).toBeGreaterThanOrEqual(l.valor);
        }
      } else s = tempo(s);
    }
    expect(s.fase).toBe('fim');
    expect(s.ronda).toBe(4);
    expect(Object.values(jogos).every((x) => x === 4)).toBe(true);
    expect(s.campeao).toBe(tabela(s)[0]);
    // a IA também compra (mesma regra)
    expect(s.robos.filter((x) => !x.dono).some((x) => x.modulos.some(Boolean))).toBe(true);
  });

  it('o último da tabela recebe +100 de recuperação no fim da ronda', () => {
    let s = semLoja(tempo(novo(2, { modo: 'pilotos' })));
    while (s.fase !== 'combate') s = tempo(s);
    s = fimTv(s);
    s = tempo(s);
    const ultimo = s.combate!.robos[3];
    s = fimTv(s);
    const c0 = { ...s.carteira };
    s = tempo(s); // fim da ronda 1
    expect(s.pontos[ultimo]).toBe(0); // empatado em último com o do outro combate: ambos recebem
    const quem = s.robos.find((x) => x.id === ultimo)!.dono ?? ultimo;
    expect(s.carteira[quem] - c0[quem]).toBe(100);
  });
});
