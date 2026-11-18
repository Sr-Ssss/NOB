import { describe, expect, it } from 'vitest';
import {
  criptografo,
  decidir,
  ladoDe,
  MAX_RONDAS,
  novoCodigo,
  novoWifi,
  outro,
  pistaBloqueada,
  reduzWifi,
  respondentes,
  sortearEquipas,
  privadoWifi,
  vistaWifi,
  type AcaoWifi,
  type EstadoWifi,
  type Lado,
  type Palavra,
} from './regras';
import { palavrasWifi } from './conteudo';

const POOL: Palavra[] = Array.from({ length: 40 }, (_, i) => ({ id: `w${i}`, pt: `Palavra${String.fromCharCode(65 + (i % 26))}${i}`, en: `Word${i}`, tags: [i < 20 ? 'animais' : 'casa'] }));
const T = 1_000_000;
const ids = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);
const ap = (e: EstadoWifi, as: AcaoWifi[], agora = T) => as.reduce((s, a) => reduzWifi(s, a, agora), e);

/** até à fase de pistas da ronda 1 */
function arrancar(n: number, def = {}): EstadoWifi {
  const e = novoWifi(ids(n), def, T, POOL);
  return ap(e, e.participantes.map((id) => ({ tipo: 'prontas', id })));
}

const pistasDe = (e: EstadoWifi, l: Lado): AcaoWifi => ({ tipo: 'pistas', id: criptografo(e, l), pistas: ['sol', 'mar', 'lua'] });

/** a equipa que responde agora mete `nums` e confirma (metade chega) */
function responder(e: EstadoWifi, nums: number[]): EstadoWifi {
  const r = respondentes(e);
  let s = e;
  nums.forEach((n, linha) => (s = reduzWifi(s, { tipo: 'resposta', id: r[0], linha, num: n }, T)));
  for (const id of r) if (s.fase === 'responder' && s.resposta.confirmados.length < r.length && respondentes(s).includes(id)) s = reduzWifi(s, { tipo: 'confirmar', id }, T);
  return s;
}

const errado = (c: number[]) => [c[1], c[2], c[0]];

/** joga uma ronda inteira; `acertam[l]` = a equipa l acerta no próprio código; `intercetam[l]` = l interceta o código dos outros */
function ronda(e: EstadoWifi, acertam: Record<Lado, boolean>, intercetam: Record<Lado, boolean> = { b: false, p: false }): EstadoWifi {
  let s = ap(e, [pistasDe(e, 'b'), pistasDe(e, 'p')]);
  for (const l of ['b', 'p'] as Lado[]) {
    expect(s.turno).toBe(l);
    const c = s.codigos[l];
    if (s.passo === 'intercetar') s = responder(s, intercetam[outro(l)] ? c : errado(c));
    s = responder(s, acertam[l] ? c : errado(c));
    expect(s.fase).toBe('revelar');
    s = reduzWifi(s, { tipo: 'tick' }, s.terminaEm);
  }
  return s;
}

describe('Senha do Wi-Fi', () => {
  it('conteúdo: 500 palavras com temas', () => {
    const p = palavrasWifi();
    expect(p.length).toBeGreaterThanOrEqual(200);
    expect(p.every((w) => w.pt && w.en && w.tags?.length)).toBe(true);
  });

  it('4 jogadores: 2 equipas de 2, 4 palavras cada, código de 3 números diferentes 1–4', () => {
    const e = arrancar(4);
    expect(e.fase).toBe('pistas');
    expect(e.equipas.b).toHaveLength(2);
    expect(e.equipas.p).toHaveLength(2);
    expect(e.palavras.b).toHaveLength(4);
    expect(new Set([...e.palavras.b, ...e.palavras.p].map((w) => w.id)).size).toBe(8);
    for (let s = 1; s < 200; s++) {
      const c = novoCodigo(s);
      expect(new Set(c).size).toBe(3);
      expect(c.every((n) => n >= 1 && n <= 4)).toBe(true);
    }
  });

  it('16 jogadores: 8 + 8; o 17.º fica na audiência', () => {
    const e = novoWifi(ids(17), {}, T, POOL);
    expect(e.equipas.b.length + e.equipas.p.length).toBe(16);
    expect(e.equipas.b).toHaveLength(8);
    expect(e.audiencia).toEqual(['j17']);
  });

  it('equipas desiguais (5): 3 + 2, e o Criptógrafo roda pela equipa', () => {
    const t = sortearEquipas(ids(5), 7);
    expect([t.b.length, t.p.length]).toEqual([3, 2]);
    let e = arrancar(5);
    const big = e.equipas.b.length === 3 ? 'b' : 'p';
    const vistos = [criptografo(e, big)];
    for (let r = 0; r < 3; r++) {
      e = ronda(e, { b: true, p: true });
      vistos.push(criptografo(e, big));
    }
    expect(vistos.slice(0, 3).sort()).toEqual([...e.equipas[big]].sort());
    expect(vistos[3]).toBe(vistos[0]);
  });

  it('equipas à mão: o líder move e só fecha com 2+ por equipa', () => {
    let e = novoWifi(ids(4), { equipas: 'mao' }, T, POOL);
    expect(e.fase).toBe('equipas');
    e = ap(e, [{ tipo: 'mover', id: 'j1', jogador: 'j2', lado: 'b' }]);
    expect(e.equipas.b).toHaveLength(3);
    expect(reduzWifi(e, { tipo: 'fechar_equipas', id: 'j1' }, T).fase).toBe('equipas');
    e = ap(e, [{ tipo: 'mover', id: 'j1', jogador: 'j1', lado: 'p' }, { tipo: 'fechar_equipas', id: 'j1' }]);
    expect(e.fase).toBe('palavras');
  });

  it('🔄 troca cada palavra só 1×; a preparação acaba com metade de cada equipa Pronta ou com o tempo', () => {
    let e = novoWifi(ids(4), {}, T, POOL);
    const id = e.equipas.b[0];
    const antes = e.palavras.b[2].id;
    e = ap(e, [{ tipo: 'trocar', id, i: 2 }]);
    expect(e.palavras.b[2].id).not.toBe(antes);
    const depois = e.palavras.b[2].id;
    expect(ap(e, [{ tipo: 'trocar', id: e.equipas.b[1], i: 2 }]).palavras.b[2].id).toBe(depois);
    e = ap(e, [{ tipo: 'prontas', id }]);
    expect(e.fase).toBe('palavras');
    expect(reduzWifi(e, { tipo: 'tick' }, e.terminaEm).fase).toBe('pistas');
  });

  it('bloqueia a própria palavra ou uma que a contenha', () => {
    const w: Palavra[] = [{ id: 'a', pt: 'Pipoca', en: 'Popcorn' }];
    expect(pistaBloqueada('pipóca', w, 'pt-BR')).not.toBeNull();
    expect(pistaBloqueada('PIPOCAS', w, 'pt-BR')).not.toBeNull();
    expect(pistaBloqueada('milho', w, 'pt-BR')).toBeNull();
    expect(pistaBloqueada('popcorn', w, 'en')).not.toBeNull();
    const e = arrancar(4);
    const c = criptografo(e, 'b');
    const mal = reduzWifi(e, { tipo: 'pistas', id: c, pistas: [e.palavras.b[0].pt + 's', 'x', 'y'] }, T);
    expect(mal.pistas.b).toBeNull();
    expect(reduzWifi(e, { tipo: 'pistas', id: e.equipas.b.find((x) => x !== c)!, pistas: ['a', 'b', 'c'] }, T).pistas.b).toBeNull();
  });

  it('o código só vai para o Criptógrafo; as palavras só para a própria equipa', () => {
    const e = arrancar(4);
    const v = vistaWifi(e);
    const c = criptografo(e, 'b');
    expect(privadoWifi(e, c)!.codigo).toEqual(e.codigos.b);
    const colega = e.equipas.b.find((x) => x !== c)!;
    expect(privadoWifi(e, colega)!.codigo).toBeUndefined();
    expect(privadoWifi(e, e.equipas.p[0])!.palavras).toEqual(e.palavras.p);
    expect(privadoWifi(e, 'ninguem')).toBeNull();
    // a vista pública não leva palavras nem códigos
    const txt = JSON.stringify(v);
    for (const w of [...e.palavras.b, ...e.palavras.p]) expect(txt).not.toContain(JSON.stringify(w.pt));
    expect(txt).not.toContain('codigo');
    expect(v.pistas.b).toBeNull();
  });

  it('ronda 1 sem interceção: só a própria equipa responde', () => {
    let e = arrancar(4);
    e = ap(e, [pistasDe(e, 'b'), pistasDe(e, 'p')]);
    expect(e.fase).toBe('responder');
    expect(e.passo).toBe('descodificar');
    expect(respondentes(e)).toEqual(e.equipas.b.filter((x) => x !== criptografo(e, 'b')));
    e = ronda(arrancar(4), { b: true, p: true });
    expect(e.ronda).toBe(2);
    e = ap(e, [pistasDe(e, 'b'), pistasDe(e, 'p')]);
    expect(e.passo).toBe('intercetar');
    expect(respondentes(e)).toEqual(e.equipas.p);
  });

  it('resposta partilhada: sem repetidos, mudar limpa as confirmações, fecha com metade', () => {
    let e = arrancar(8); // 4 + 4: descodificam 3, precisa 2
    e = ap(e, [pistasDe(e, 'b'), pistasDe(e, 'p')]);
    const [a, b2] = respondentes(e);
    e = ap(e, [
      { tipo: 'resposta', id: a, linha: 0, num: 1 },
      { tipo: 'resposta', id: a, linha: 1, num: 1 },
    ]);
    expect(e.resposta.nums).toEqual([1, null, null]);
    e = ap(e, [{ tipo: 'confirmar', id: a }]);
    expect(e.resposta.confirmados).toEqual([]); // incompleta
    e = ap(e, [
      { tipo: 'resposta', id: a, linha: 1, num: 2 },
      { tipo: 'resposta', id: b2, linha: 2, num: 3 },
      { tipo: 'confirmar', id: a },
    ]);
    expect(e.resposta.confirmados).toEqual([a]);
    expect(e.resposta.mudouPor[2]).toBe(b2);
    e = ap(e, [{ tipo: 'resposta', id: b2, linha: 2, num: 4 }]);
    expect(e.resposta.confirmados).toEqual([]);
    e = ap(e, [{ tipo: 'confirmar', id: a }, { tipo: 'confirmar', id: b2 }]);
    expect(e.fase).toBe('revelar');
  });

  it('2 🎯 ganha (+200 por 🎯 e +1000 à equipa vencedora)', () => {
    let e = ronda(arrancar(4), { b: true, p: true });
    e = ronda(e, { b: true, p: true }, { b: false, p: true });
    expect(e.fichas.p.alvo).toBe(1);
    e = ronda(e, { b: true, p: true }, { b: false, p: true });
    expect(e.fase).toBe('fim');
    expect(e.vencedor).toBe('p');
    for (const id of e.equipas.p) expect(e.pontos[id]).toBe(1000 + 400);
    for (const id of e.equipas.b) expect(e.pontos[id]).toBe(0);
  });

  it('2 ❌ perde', () => {
    let e = ronda(arrancar(4), { b: false, p: true });
    expect(e.fichas.b.erro).toBe(1);
    e = ronda(e, { b: false, p: true });
    expect(e.vencedor).toBe('p');
  });

  it('as duas na mesma ronda: 🎯 − ❌ desempata; se empatar, ronda extra', () => {
    expect(decidir({ b: { alvo: 2, erro: 0 }, p: { alvo: 2, erro: 1 } }, 3)).toBe('b');
    expect(decidir({ b: { alvo: 2, erro: 1 }, p: { alvo: 2, erro: 1 } }, 3)).toBe('empate');
    // os dois perdem com 2 ❌ na mesma ronda e empatam → mais uma ronda
    let e = ronda(arrancar(4), { b: false, p: false });
    e = ronda(e, { b: false, p: false });
    expect(e.fase).toBe('pistas');
    expect(e.ronda).toBe(3);
    // na ronda extra os Brancos intercetam: 1 − 2 contra 0 − 2
    e = ronda(e, { b: true, p: true }, { b: true, p: false });
    expect(e.vencedor).toBe('b');
  });

  it('limite de 8 rondas: conta 🎯 − ❌; empate continua', () => {
    let e = arrancar(4);
    for (let r = 1; r < MAX_RONDAS; r++) e = ronda(e, { b: true, p: true });
    e = ronda(e, { b: true, p: false });
    expect(e.ronda).toBe(MAX_RONDAS);
    expect(e.vencedor).toBe('b');
    let f = arrancar(4);
    for (let r = 1; r <= MAX_RONDAS; r++) f = ronda(f, { b: true, p: true });
    expect(f.fase).toBe('pistas');
    expect(f.ronda).toBe(MAX_RONDAS + 1);
  });

  it('tempo esgotado: pistas de recurso e resposta vale como está (incompleta = errada)', () => {
    let e = arrancar(4);
    e = ap(e, [pistasDe(e, 'b')]);
    e = reduzWifi(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.fase).toBe('responder');
    expect(e.pistas.p).toEqual(['', '', '']);
    // Brancos não respondem: errado
    e = reduzWifi(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.fase).toBe('revelar');
    expect(e.revelacao?.errou).toBe(true);
    e = reduzWifi(e, { tipo: 'tick' }, e.terminaEm);
    // Pretos metem o código certo mas ninguém confirma: vale
    const r = respondentes(e);
    e = ap(e, e.codigos.p.map((num, linha) => ({ tipo: 'resposta' as const, id: r[0], linha, num })));
    e = reduzWifi(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.revelacao?.errou).toBe(false);
    expect(e.fichas).toEqual({ b: { alvo: 0, erro: 1 }, p: { alvo: 0, erro: 0 } });
  });

  it('desligar e voltar: pausa com menos de 2 numa equipa e retoma o tempo', () => {
    let e = arrancar(4);
    const fora = e.equipas.p[0];
    e = reduzWifi(e, { tipo: 'ligados', ids: e.participantes.filter((x) => x !== fora) }, T + 10_000);
    expect(e.pausaRestante).toBe(80_000);
    expect(reduzWifi(e, { tipo: 'tick' }, T + 999_999).fase).toBe('pistas');
    expect(reduzWifi(e, pistasDe(e, 'b'), T).pistas.b).toBeNull();
    e = reduzWifi(e, { tipo: 'ligados', ids: e.participantes }, T + 50_000);
    expect(e.pausaRestante).toBeNull();
    expect(e.terminaEm).toBe(T + 130_000);
    expect(ladoDe(e, fora)).toBe('p');
  });

  it('confirmar conta só ligados: com 3 a descodificar e 1 desligado, basta 1', () => {
    let e = arrancar(8);
    e = ap(e, [pistasDe(e, 'b'), pistasDe(e, 'p')]);
    const r = respondentes(e);
    e = reduzWifi(e, { tipo: 'ligados', ids: e.participantes.filter((x) => x !== r[2]) }, T);
    e = ap(e, e.codigos.b.map((num, linha) => ({ tipo: 'resposta' as const, id: r[0], linha, num })));
    e = ap(e, [{ tipo: 'confirmar', id: r[0] }]);
    expect(e.fase).toBe('revelar');
  });
});
