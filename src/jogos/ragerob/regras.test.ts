import { describe, expect, it } from 'vitest';
import { PRECO } from './pecas';
import {
  CAPITAL,
  DEF_PADRAO_RAGEROB,
  PRECO_CONTROLO,
  grupoAtual,
  novoRagerob,
  reduzRagerob,
  repartir,
  tabela,
  vistaRagerob,
  type AcaoRagerob,
  type DefRagerob,
  type EstadoRagerob,
} from './regras';

const J = (n: number) => Array.from({ length: n }, (_, i) => 'j' + (i + 1));
const novo = (n: number, def: Partial<DefRagerob> = {}) => novoRagerob(J(n), { ...DEF_PADRAO_RAGEROB, ...def }, 0, [], 7);
const r = (s: EstadoRagerob, a: AcaoRagerob, t = 1000) => reduzRagerob(s, a, t);
const total = (s: EstadoRagerob) => Object.values(s.carteira).reduce((a, b) => a + b, 0) + s.bolo;
/** a TV acaba o combate: o 1.º do grupo ganha, os outros caem por ordem */
const fimTv = (s: EstadoRagerob, t = 2000): EstadoRagerob => {
  const g = s.combate!.robos;
  return r(s, { tipo: 'rr_fim', id: 'tv', ordem: g.map((x) => [x]), dano: Object.fromEntries(g.map((x, i) => [x, 100 - i * 20])), kos: { [g[0]]: g.length - 1 } }, t);
};
/** passa a fase pelo tempo */
const tempo = (s: EstadoRagerob) => r(s, { tipo: 'tick' }, s.terminaEm);

describe('Ragerob — modo normal', () => {
  it('começa com 8 robôs, 1500 cada, leilão de 5 módulos; 2 jogadores chegam', () => {
    const s = novo(2);
    expect(s.robos).toHaveLength(8);
    expect(s.fase).toBe('loja');
    expect(s.loja).toHaveLength(5);
    expect(s.carteira).toEqual({ j1: CAPITAL, j2: CAPITAL });
    expect(s.grupos.map((g) => g.length)).toEqual([4, 4]);
    expect(new Set(s.robos.map((x) => x.cor)).size).toBe(8);
    expect(s.robos.every((x) => x.modulos.every((m) => m === null))).toBe(true);
    expect(novo(10, { rondas: 4 }).robos).toHaveLength(16);
  });

  it('leilão: ganha a oferta mais alta, só no que se consegue pagar, empate = sorteio', () => {
    let s = novo(3);
    const p = PRECO[s.loja[0]];
    expect(r(s, { tipo: 'rr_ofertas', id: 'j1', ofertas: { 0: p - 1 } }).enviaram).toEqual([]); // abaixo do preço
    expect(r(s, { tipo: 'rr_ofertas', id: 'j1', ofertas: { 0: 1000, 1: 600 } }).enviaram).toEqual([]); // não paga tudo
    s = r(s, { tipo: 'rr_ofertas', id: 'j1', ofertas: { 0: p + 50, 1: PRECO[s.loja[1]] } });
    s = r(s, { tipo: 'rr_ofertas', id: 'j2', ofertas: { 0: p + 10, 1: PRECO[s.loja[1]] } });
    expect(vistaRagerob(s)).not.toHaveProperty('ofertas');
    s = r(s, { tipo: 'rr_ofertas', id: 'j3', ofertas: {} });
    expect(s.fase).toBe('aposta'); // todos enviaram: acaba mais cedo
    expect(s.vendidos![0]).toEqual({ id: 'j1', valor: p + 50 });
    expect(['j1', 'j2']).toContain(s.vendidos![1]!.id);
    expect(s.inventario.j1[0]).toBe(s.loja[0]);
    expect(s.bolo).toBe(p + 50 + PRECO[s.loja[1]]);
    expect(total(s)).toBe(3 * CAPITAL);
  });

  it('apostas com entrada obrigatória: mínimo 100, quem não escolhe perde 50, o bolo vai para quem acertou', () => {
    let s = tempo(novo(3));
    expect(s.fase).toBe('aposta');
    const [a, b] = grupoAtual(s);
    expect(r(s, { tipo: 'rr_apostar', id: 'j1', robo: a, valor: 99 }).apostas.j1).toBeUndefined();
    s = r(s, { tipo: 'rr_apostar', id: 'j1', robo: a, valor: 300 });
    s = r(s, { tipo: 'rr_apostar', id: 'j2', robo: b, valor: 100 });
    s = tempo(s); // j3 não escolheu
    expect(s.fase).toBe('combate'); // ninguém tem módulos: salta o instalar
    expect(s.bolo).toBe(450);
    expect(s.carteira).toEqual({ j1: 1200, j2: 1400, j3: 1450 });
    s = fimTv(s); // ganha o 1.º do grupo = a
    expect(s.resultado!.vencedor).toBe(a);
    expect(s.carteira.j1).toBe(1650);
    // j2 apostou no 2.º (antepenúltimo): recebe 30% de metade do bolo (225) = 67, dinheiro novo
    expect(s.resultado!.ganhos).toEqual({ j1: 150, j2: -100 + 67, j3: -50 });
    expect(s.resultado!.passam).toHaveLength(2);
    expect(total(s)).toBe(3 * CAPITAL + 67);
  });

  it('consolação: último 10%, penúltimo 20%, antepenúltimo 30% de metade do bolo, pelo valor apostado', () => {
    let s = tempo(novo(4));
    const [, b, c, d] = grupoAtual(s);
    s = r(s, { tipo: 'rr_apostar', id: 'j1', robo: b, valor: 300 });
    s = r(s, { tipo: 'rr_apostar', id: 'j2', robo: c, valor: 100 });
    s = r(s, { tipo: 'rr_apostar', id: 'j3', robo: d, valor: 100 });
    s = r(s, { tipo: 'rr_apostar', id: 'j4', robo: d, valor: 300 });
    s = tempo(s);
    expect(s.bolo).toBe(800);
    s = fimTv(s); // a ganha; ninguém apostou nele: o bolo acumula
    expect(s.bolo).toBe(800);
    expect(s.resultado!.ganhos).toEqual({ j1: -300 + 120, j2: -100 + 80, j3: -100 + 10, j4: -300 + 30 });
  });

  it('ninguém acertou: o bolo acumula para o combate seguinte', () => {
    let s = tempo(tempo(novo(2)));
    s = fimTv(s);
    expect(s.bolo).toBe(100);
    s = tempo(s);
    expect(s.fase).toBe('aposta');
    expect(s.combateIdx).toBe(1);
  });

  it('quem tem menos de 50 paga o que tem; com 0 fica a assistir', () => {
    let s = tempo(novo(2));
    s = { ...s, carteira: { j1: 30, j2: 0 }, bolo: 2970 };
    expect(r(s, { tipo: 'rr_apostar', id: 'j2', robo: null, valor: 0 }).enviaram).toEqual([]);
    s = r(s, { tipo: 'rr_apostar', id: 'j1', robo: grupoAtual(s)[0], valor: 30 }); // aposta tudo
    expect(s.fase).toBe('combate');
    expect(s.carteira.j1).toBe(0);
  });

  it('instalar: só no robô em que apostou; trocar custa +50%', () => {
    let s = novo(2);
    s = r(s, { tipo: 'rr_ofertas', id: 'j1', ofertas: { 0: PRECO[s.loja[0]], 1: PRECO[s.loja[1]] } });
    s = r(s, { tipo: 'rr_ofertas', id: 'j2', ofertas: {} });
    const robo = grupoAtual(s)[0];
    s = r(s, { tipo: 'rr_apostar', id: 'j1', robo, valor: 100 });
    s = r(s, { tipo: 'rr_apostar', id: 'j2', robo: null, valor: 0 });
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
    expect(total(s)).toBe(2 * CAPITAL);
  });

  it('controlar: paga 100, só quem apostou nesse robô, 5 s cada, em fila', () => {
    let s = tempo(novo(3));
    const robo = grupoAtual(s)[0];
    s = r(s, { tipo: 'rr_apostar', id: 'j1', robo, valor: 100 });
    s = r(s, { tipo: 'rr_apostar', id: 'j2', robo, valor: 100 });
    s = tempo(s);
    expect(r(s, { tipo: 'rr_controlar', id: 'j3' }, 5000)).toBe(s);
    s = r(s, { tipo: 'rr_controlar', id: 'j1' }, 5000);
    s = r(s, { tipo: 'rr_controlar', id: 'j2' }, 5000);
    expect(s.combate!.condutor[robo]).toEqual({ id: 'j1', ate: 10000 });
    expect(s.combate!.fila[robo]).toEqual(['j2']);
    expect(s.carteira.j1).toBe(CAPITAL - 100 - PRECO_CONTROLO);
    s = r(s, { tipo: 'rr_conduzir', id: 'j2', f: 1, r: 0 }, 6000);
    expect(s.combate!.comandos[robo]).toBeUndefined();
    s = r(s, { tipo: 'rr_conduzir', id: 'j1', f: 5, r: -1 }, 6000);
    expect(s.combate!.comandos[robo]).toEqual({ f: 1, r: -1, em: 6000 });
    s = r(s, { tipo: 'tick' }, 10000);
    expect(s.combate!.condutor[robo].id).toBe('j2');
    expect(total(s)).toBe(3 * CAPITAL);
  });

  it('torneio inteiro de 3 rondas: 8 → 4 → 2 → campeão; o dinheiro conserva-se', () => {
    let s = novo(2);
    let n = 0;
    while (s.fase !== 'fim' && n++ < 100) {
      if (s.fase === 'aposta') s = r(s, { tipo: 'rr_apostar', id: 'j1', robo: grupoAtual(s)[0], valor: 100 });
      if (s.fase === 'combate') s = fimTv(s);
      else s = tempo(s);
    }
    expect(s.fase).toBe('fim');
    expect(s.ronda).toBe(3);
    expect(s.campeao).toBeTruthy();
    expect(s.bolo).toBe(0);
    expect(total(s)).toBe(2 * CAPITAL);
    expect(s.carteira.j1).toBeGreaterThan(s.carteira.j2);
  });

  it('KO de todos ao mesmo tempo: sem vencedor, empate na colocação', () => {
    let s = tempo(tempo(novo(2)));
    const g = s.combate!.robos;
    s = r(s, { tipo: 'rr_fim', id: 'tv', ordem: [g], dano: {}, kos: {} });
    expect(s.resultado!.vencedor).toBeNull();
    expect(s.resultado!.passam).toHaveLength(2);
  });

  it('sem fim da TV: acaba sozinho pela vida (rede de segurança)', () => {
    let s = tempo(tempo(novo(2)));
    const g = s.combate!.robos;
    s = r(s, { tipo: 'rr_vidas', id: 'tv', vidas: { [g[2]]: 80, [g[0]]: 10, [g[1]]: 0, [g[3]]: 0 } });
    s = r(s, { tipo: 'tick' }, 1e6);
    expect(s.fase).toBe('resultado');
    expect(s.resultado!.ordem[0]).toEqual([g[2]]);
  });

  it('desligar e voltar: pausa com menos de 2 ligados e o dinheiro fica', () => {
    let s = novo(2);
    s = r(s, { tipo: 'ligados', ids: ['j1'] }, 5000);
    expect(s.pausaRestante).toBe(25000);
    expect(r(s, { tipo: 'tick' }, 1e9).fase).toBe('loja');
    s = r(s, { tipo: 'ligados', ids: ['j1', 'j2'] }, 9000);
    expect(s.pausaRestante).toBeNull();
    expect(s.terminaEm).toBe(34000);
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
    expect(r(s, { tipo: 'rr_ofertas', id: 'j1', ofertas: { 0: 500 } })).toBe(s);
  });

  it('repartir: para baixo, o resto para quem apostou mais', () => {
    expect(repartir(100, { a: 1, b: 2 })).toEqual({ a: 33, b: 67 });
    expect(repartir(0, { a: 1 })).toEqual({});
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
    s = tempo(s); // loja
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
    let s = tempo(tempo(novo(2, { modo: 'pilotos' })));
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
    let s = tempo(tempo(novo(2, { modo: 'pilotos' })));
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
