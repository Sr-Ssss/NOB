import { describe, expect, it } from 'vitest';
import { novaSala, reduzSala, semFotos, vistaSala, privadoSala, type EstadoSala } from '../../core/sala';
import { conteudoSemJuizo } from './conteudo';
import { PECAS_CENA } from './desenhos';
import {
  MAO,
  T_EXPLICAR,
  aVotar,
  contar,
  importanteSemJuizo,
  ladoDaVez,
  novoSemJuizo,
  pesoJuiz,
  privadoSemJuizo,
  quotaJurado,
  reduzSemJuizo,
  sairSemJuizo,
  vistaSemJuizo,
  type AcaoSemJuizo,
  type EstadoSemJuizo,
  type FaseSemJuizo,
} from './regras';

const T = 1_000_000;
const C = conteudoSemJuizo();
const ids = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);
const novo = (n: number, provas: 'aleatorias' | 'juri' = 'aleatorias', fotos = {}) => novoSemJuizo(ids(n), { provas }, T, C, fotos);
const r = (e: EstadoSemJuizo, a: AcaoSemJuizo, t = e.terminaEm - 1) => reduzSemJuizo(e, a, t);
const tempo = (e: EstadoSemJuizo) => reduzSemJuizo(e, { tipo: 'tick' }, e.terminaEm);
function ate(e: EstadoSemJuizo, ok: (x: EstadoSemJuizo) => boolean) {
  for (let k = 0; k < 500 && !ok(e) && e.fase !== 'fim'; k++) e = tempo(e);
  return e;
}
const fase = (e: EstadoSemJuizo, f: FaseSemJuizo, mesa = 0) => ate(e, (x) => x.fase === f && x.mesa.length >= mesa);
const votar = (e: EstadoSemJuizo, sim: boolean) => aVotar(e).reduce((s, id) => r(s, { tipo: 'sj_votar', id, sim }), e);
const privado = (e: EstadoSemJuizo, id: string) => privadoSemJuizo(e, id, { semTv: false, bot: false })!;

describe('Sem Juízo: julgamentos', () => {
  it('3 a 10: metade dos jogadores em julgamentos, cada um com 1 papel, juiz fora do júri', () => {
    for (let n = 3; n <= 10; n++) {
      let e = novo(n);
      expect(e.total).toBe(Math.ceil(n / 2));
      const papeis: string[] = [];
      for (let k = 0; k < e.total; k++) {
        expect(e.julgamento).toBe(k);
        expect(new Set([e.reu, e.acusador, e.juiz, ...e.juri]).size).toBe(n);
        expect(e.juri).toHaveLength(n - 3);
        papeis.push(e.reu, e.acusador);
        e = ate(e, (x) => x.julgamento > k);
      }
      expect(e.fase).toBe('fim');
      expect(new Set(papeis).size).toBe(n);
      expect(papeis).toHaveLength(2 * Math.ceil(n / 2));
    }
  });

  it('ímpar: quem falta joga contra quem tem menos pontos, que faz o outro papel e conta o melhor', () => {
    let e = ate(novo(5), (x) => x.julgamento === 1 && x.fase === 'revelar');
    const antes = { ...e.papel };
    const jogaram = Object.keys(antes);
    const min = Math.min(...jogaram.map((id) => e.pontos[id]));
    e = tempo(e);
    expect(e.julgamento).toBe(2);
    const rival = [e.reu, e.acusador].find((id) => jogaram.includes(id))!;
    expect(e.pontos[rival]).toBe(min);
    expect(e.reu === rival ? 'reu' : 'acusador').not.toBe(antes[rival]);
    e = ate(e, (x) => x.fase === 'revelar');
    expect(e.ganhos[rival]).toHaveLength(2);
    expect(e.pontos[rival]).toBe(Math.max(...e.ganhos[rival]));
  });

  it('o juiz roda: ninguém repete enquanto há quem o foi menos', () => {
    let e = novo(6);
    const juizes: string[] = [];
    for (let k = 0; k < 3; k++) {
      juizes.push(e.juiz!);
      e = ate(e, (x) => x.julgamento > k);
    }
    expect(new Set(juizes).size).toBe(3);
  });

  it('bots nunca são juiz nem júri; sem humanos que votem, acaba na mesma', () => {
    let e = novoSemJuizo(['a', 'b', 'c', 'bot-1', 'bot-2'], {}, T, C);
    for (let k = 0; k < 300 && e.fase !== 'fim'; k++) {
      for (const id of [e.juiz, ...e.juri]) expect(id?.startsWith('bot-') ?? false).toBe(false);
      e = tempo(e);
    }
    expect(e.fase).toBe('fim');
    expect(ate(novoSemJuizo(['a', 'bot-1', 'bot-2'], {}, T, C), () => false).fase).toBe('fim');
  });
});

describe('Sem Juízo: provas', () => {
  it('cada lado recebe 5 e joga 3, alternado, ligadas a uma já jogada', () => {
    let e = novo(4);
    expect(e.maos[e.reu]).toHaveLength(MAO);
    expect(e.maos[e.acusador]).toHaveLength(MAO);
    e = fase(e, 'juri');
    expect(e.mesa.map((m) => m.lado)).toEqual(['acusador', 'reu', 'acusador', 'reu', 'acusador', 'reu']);
    e.mesa.forEach((m, i) => (i ? expect(m.liga!).toBeLessThan(i) : expect(m.liga).toBeNull()));
    expect(e.maos[e.reu]).toHaveLength(2);
  });

  it('só quem tem a vez joga, com prova da mão e ligação válida', () => {
    let e = fase(novo(4), 'escolher');
    const p = e.maos[e.acusador][1].id;
    expect(r(e, { tipo: 'sj_jogar', id: e.reu, prova: e.maos[e.reu][0].id, liga: null })).toBe(e);
    expect(r(e, { tipo: 'sj_jogar', id: e.acusador, prova: 'x', liga: null })).toBe(e);
    e = r(e, { tipo: 'sj_jogar', id: e.acusador, prova: p, liga: null });
    expect([e.fase, e.mesa[0].prova.id]).toEqual(['explicar', p]);
    e = tempo(e);
    const q = e.maos[e.reu][0].id;
    for (const liga of [null, 1, -1, 0.5]) expect(r(e, { tipo: 'sj_jogar', id: e.reu, prova: q, liga })).toBe(e);
    expect(r(e, { tipo: 'sj_jogar', id: e.reu, prova: q, liga: 0 }).mesa[1].liga).toBe(0);
  });

  it('o júri escolhe: partes iguais, o resto vem à sorte; com 3 são sempre aleatórias', () => {
    expect([1, 2, 3, 5, 7].map(quotaJurado)).toEqual([5, 2, 1, 1, 1]);
    expect(tempo(novo(3, 'juri')).fase).toBe('escolher');
    let e = tempo(novo(5, 'juri'));
    expect(e.fase).toBe('provas');
    const [a, b] = e.juri;
    const dar = (id: string, lado: 'reu' | 'acusador') => (e = r(e, { tipo: 'sj_dar', id, prova: e.ofertas[id][0].id, lado }));
    dar(a, 'reu');
    dar(a, 'reu');
    const s = e;
    expect(dar(a, 'reu')).toBe(s); // a parte dele acabou
    expect(r(e, { tipo: 'sj_dar', id: e.reu, prova: e.ofertas[a][0].id, lado: 'reu' })).toBe(e);
    expect(privado(e, b).oferta).toHaveLength(6);
    expect(JSON.stringify(vistaSemJuizo(e))).not.toContain(JSON.stringify(e.ofertas[b][0]));
    e = tempo(e);
    expect(e.maos[e.reu]).toHaveLength(MAO);
    expect(e.maos[e.acusador]).toHaveLength(MAO);
    for (let n = 4; n <= 10; n++) {
      let x = tempo(novo(n, 'juri'));
      for (const id of x.juri) for (const lado of ['reu', 'acusador'] as const) for (let k = 0; k < quotaJurado(x.juri.length); k++) if (x.fase === 'provas') x = r(x, { tipo: 'sj_dar', id, prova: x.ofertas[id][0].id, lado });
      x = fase(x, 'escolher');
      expect(x.maos[x.reu]).toHaveLength(MAO);
      expect(x.maos[x.acusador]).toHaveLength(MAO);
    }
  });

  it('a galeria entra no monte (no máx. 3 por julgamento) e nunca na vista', () => {
    const e = novo(4, 'aleatorias', { j1: ['data:image/webp;base64,AAA1', 'data:image/webp;base64,AAA2'], j2: ['data:image/webp;base64,AAA3', 'data:image/webp;base64,AAA4'] });
    const fotos = [...e.maos[e.reu], ...e.maos[e.acusador]].filter((p) => p.foto);
    expect(fotos).toHaveLength(3);
    const f = fase(e, 'juri');
    expect(JSON.stringify(vistaSemJuizo(f))).not.toContain('base64');
    const naMesa = f.mesa.filter((m) => m.prova.foto).length;
    expect(Object.keys(privado(f, f.juiz!).fotos)).toHaveLength(naMesa);
    expect(privadoSemJuizo(f, f.reu, { semTv: true, bot: true })!.fotos).toEqual({});
  });
});

describe('Sem Juízo: interrupções', () => {
  it('protesto: troca a prova do outro, +10 s, uma vez, só na vez do outro', () => {
    const e = fase(novo(4), 'explicar', 1);
    expect(r(e, { tipo: 'sj_protesto', id: e.acusador })).toBe(e);
    expect(r(e, { tipo: 'sj_protesto', id: e.juiz! })).toBe(e);
    const s = r(e, { tipo: 'sj_protesto', id: e.reu });
    expect(s.mesa[0].prova.id).not.toBe(e.mesa[0].prova.id);
    expect(s.terminaEm).toBe(e.terminaEm + 10_000);
    expect(r(s, { tipo: 'sj_protesto', id: e.reu })).toBe(s);
  });

  it('contradição: votada como o veredito; se falhar, a mais recente perde a estrela; a explicação retoma', () => {
    const e = fase(novo(6), 'explicar', 4);
    expect(r(e, { tipo: 'sj_contradicao', id: e.reu, a: 0, b: 1 })).toBe(e);
    let s = r(e, { tipo: 'sj_contradicao', id: e.reu, a: 2, b: 0 }, e.terminaEm - 7000);
    expect(s.fase).toBe('contra_fala');
    expect(r(s, { tipo: 'sj_testemunha', id: s.acusador })).toBe(s); // uma de cada vez
    s = votar(votar(tempo(s), true), true);
    expect([s.fase, s.contra?.falhou]).toEqual(['contra_res', true]);
    expect(s.mesa.map((m) => !!m.semEstrela)).toEqual([false, false, true, false]);
    const t = s.terminaEm;
    s = tempo(s);
    expect([s.fase, s.terminaEm, s.votos]).toEqual(['explicar', t + 7000, {}]);
    s = fase(s, 'estrela');
    expect(r(s, { tipo: 'sj_estrela', id: s.juiz!, i: 2 })).toBe(s);
    const safou = votar(votar(tempo(r(e, { tipo: 'sj_contradicao', id: e.reu, a: 0, b: 2 })), false), false);
    expect(safou.mesa.some((m) => m.semEstrela)).toBe(false);
  });

  it('testemunha: juiz ou jurado à sorte, 15 s, continua a votar', () => {
    const e = fase(novo(5), 'explicar', 1);
    let s = r(e, { tipo: 'sj_testemunha', id: e.acusador }, e.terminaEm - T_EXPLICAR * 500);
    expect([s.juiz, ...s.juri]).toContain(s.testemunha);
    s = tempo(s);
    expect(s.fase).toBe('explicar');
    expect(r(s, { tipo: 'sj_testemunha', id: s.acusador })).toBe(s);
    s = fase(s, 'juri');
    expect(aVotar(s)).toEqual(s.juri);
  });
});

describe('Sem Juízo: veredito e pontos', () => {
  it('peso do juiz da tabela: o total é sempre ímpar (nunca há empate)', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(pesoJuiz)).toEqual([1, 2, 1, 2, 1, 2, 1, 2]);
    for (let j = 0; j <= 7; j++) expect((j + pesoJuiz(j)) % 2).toBe(1);
  });

  it('com 4, o juiz decide sempre; só ele vê os votos, e a vista não os leva', () => {
    let e = votar(fase(novo(4), 'juri'), true);
    expect(e.fase).toBe('juiz');
    expect(privado(e, e.juiz!).votosJuri).toEqual({ [e.juri[0]]: true });
    for (const id of [e.reu, e.acusador, e.juri[0]]) expect(privado(e, id).votosJuri).toBeNull();
    expect(JSON.stringify(vistaSemJuizo(e))).not.toContain('"votos"');
    expect(r(e, { tipo: 'sj_votar', id: e.juri[0], sim: false })).toBe(e);
    e = votar(e, false);
    e = tempo(e);
    expect(e.resultado!.culpado).toBe(false);
    // réu: 2/3 de 100 + 50; acusador: 1/3
    expect(e.resultado!.pontos).toEqual({ reu: 117, acusador: 33 });
  });

  it('sem votos: jurado à sorte, juiz segue a maioria; 3 jogadores sem júri', () => {
    const e = fase(novo(7), 'estrela');
    const sim = e.juri.filter((id) => e.votos[id]).length;
    if (sim * 2 !== e.juri.length) expect(e.votos[e.juiz!]).toBe(sim * 2 > e.juri.length);
    const { total } = contar(e);
    expect(total).toBe(5);
    let t = fase(novo(3), 'juiz');
    expect(t.juri).toEqual([]);
    t = tempo(votar(t, true));
    expect(t.resultado!.pontos).toEqual({ reu: 0, acusador: 150 });
    expect(Object.values(t.pontos).reduce((a, b) => a + b, 0)).toBe(150);
  });

  it('desligado não trava a votação: o voto dele vem à sorte', () => {
    let e = fase(novo(5), 'juri');
    const fora = e.juri[1];
    e = r(e, { tipo: 'ligados', ids: ids(5).filter((x) => x !== fora) });
    e = r(e, { tipo: 'sj_votar', id: e.juri[0], sim: true });
    expect(e.fase).toBe('juiz');
    expect(fora in e.votos).toBe(true);
  });

  it('estrelas: +25 cada, máximo 50 por julgamento, 1 por pessoa', () => {
    let e = fase(novo(10), 'estrela');
    const base = { ...e, votos: { ...Object.fromEntries(e.juri.map((id) => [id, true])), [e.juiz!]: true } };
    e = aVotar(base).reduce((s, id) => r(r(s, { tipo: 'sj_estrela', id, i: 0 }), { tipo: 'sj_estrela', id, i: 1 }), base as EstadoSemJuizo);
    expect(e.fase).toBe('revelar');
    expect(e.resultado!.estrelas).toEqual([8, 0, 0, 0, 0, 0]);
    expect(e.resultado!.pontos).toEqual({ reu: 0, acusador: 200 });
  });
});

describe('Sem Juízo: saídas, pausa e conteúdo', () => {
  it('menos de 3 ligados pausa e retoma', () => {
    const e = fase(novo(4), 'explicar');
    const p = r(e, { tipo: 'ligados', ids: ['j1', 'j2'] }, e.terminaEm - 5000);
    expect(p.pausaRestante).toBe(5000);
    expect(reduzSemJuizo(p, { tipo: 'tick' }, e.terminaEm + 99_000)).toBe(p);
    const v = reduzSemJuizo(p, { tipo: 'ligados', ids: ids(4) }, T + 900_000);
    expect([v.terminaEm, v.pausaRestante]).toEqual([T + 905_000, null]);
  });

  it('o réu saiu e o líder segue sem ele: o julgamento anula-se, sem pontos', () => {
    const e = fase(novo(6), 'explicar', 2);
    expect(importanteSemJuizo(e, e.reu)).toBe(true);
    expect(importanteSemJuizo(e, e.juiz!)).toBe(false);
    const s = sairSemJuizo(e, e.reu, T + 60_000);
    expect([s.julgamento, s.fase]).toEqual([1, 'caso']);
    expect(Object.values(s.pontos).every((x) => x === 0)).toBe(true);
    expect([s.juiz, ...s.juri]).not.toContain(e.reu);
    // quem ainda ia jogar: o julgamento dele salta-se
    const futuro = e.ordem[2];
    const f = ate(sairSemJuizo(e, futuro, T), (x) => x.julgamento > 0);
    expect(f.julgamento).toBe(2);
  });

  it('pela sala: fotos só de humanos na sala de espera, com limites, fora da vista e das cópias; pausa quando o réu sai', () => {
    let s: EstadoSala = novaSala('ABCD', 'pt-BR');
    for (const id of ids(4)) s = reduzSala(s, { tipo: 'entrar', id, nome: id, avatar: 1, tag: id }, T);
    const url = 'data:image/webp;base64,UklGRmerdA';
    for (let k = 0; k < 5; k++) s = reduzSala(s, { tipo: 'sj_foto', id: 'j2', url }, T);
    expect(s.fotos?.j2).toEqual([url, url, url]);
    expect(reduzSala(s, { tipo: 'sj_foto', id: 'j1', url: 'https://x.pt/a.png' }, T)).toBe(s);
    expect(reduzSala(s, { tipo: 'sj_foto', id: 'j1', url: 'data:image/webp;base64,' + 'A'.repeat(60_000) }, T)).toBe(s);
    expect(reduzSala(s, { tipo: 'sj_foto', id: 'estranho', url }, T)).toBe(s);
    expect(vistaSala(s).nFotos).toEqual({ j2: 3 });
    s = reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'semjuizo' }, T);
    expect(Object.keys(s.semjuizo!.fotos)).toHaveLength(3);
    expect(reduzSala(s, { tipo: 'sj_foto', id: 'j2', url: null }, T)).toBe(s);
    expect(JSON.stringify(vistaSala(s))).not.toContain('base64');
    expect(JSON.stringify(semFotos(s))).not.toContain('base64');
    expect((privadoSala(s, s.semjuizo!.reu) as { mao: unknown[] }).mao).toHaveLength(MAO);
    const reu = s.semjuizo!.reu;
    s = reduzSala(s, { tipo: 'ligados', ids: ids(4).filter((x) => x !== reu) }, T + 1000);
    s = reduzSala(s, { tipo: 'tick' }, T + 12_000);
    expect(s.pausaSaida).toBe(true);
    s = reduzSala(s, { tipo: 'ausente_seguir', id: s.vipId!, alvo: reu }, T + 13_000);
    expect([s.pausaSaida, s.semjuizo!.julgamento, s.semjuizo!.pausaRestante]).toEqual([false, 1, null]);
    expect(s.semjuizo!.terminaEm).toBe(T + 23_000);
  });

  it('3 a 10 pela sala', () => {
    for (const [n, da] of [[2, false], [3, true], [10, true], [11, false]] as const) {
      let s: EstadoSala = novaSala('ABCD', 'pt-BR');
      for (const id of ids(n)) s = reduzSala(s, { tipo: 'entrar', id, nome: id, avatar: 1, tag: id }, T);
      expect(!!reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'semjuizo' }, T).semjuizo).toBe(da);
    }
  });

  it('conteúdo: casos, sentenças e provas que chegam, com desenhos que existem', () => {
    expect(C.casos.length).toBeGreaterThanOrEqual(20);
    expect(C.provas.length).toBeGreaterThanOrEqual(42);
    for (const x of [...C.casos, ...C.culpado, ...C.inocente]) for (const c of x.cena) expect(PECAS_CENA).toContain(c);
    expect(ladoDaVez({ fase: 'escolher', mesa: [] })).toBe('acusador');
  });
});
