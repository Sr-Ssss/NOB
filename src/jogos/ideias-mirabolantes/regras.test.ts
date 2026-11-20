import { describe, expect, it } from 'vitest';
import { conteudoIdeias } from './conteudo';
import {
  BONUS_PROBLEMA,
  BONUS_VENCEDORA,
  MAX_NOME,
  T_INVESTIR,
  T_PROBLEMA,
  investidores,
  novoIdeias,
  podioIdeias,
  reduzIdeias,
  vistaIdeias,
  type AcaoIdeias,
  type EstadoIdeias,
} from './regras';

const TR = [{ c: 1, g: 0, p: [1, 2, 3, 4] }];
const P = Array.from({ length: 30 }, (_, i) => ({ id: 'p' + i, pt: 'Problema ' + i, en: 'Problem ' + i }));
const ids = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);
const ap = (e: EstadoIdeias, a: AcaoIdeias[], t = 0) => a.reduce((s, x) => reduzIdeias(s, x, t), e);
const fim = (e: EstadoIdeias) => reduzIdeias(e, { tipo: 'tick' }, e.terminaEm);

/** até ao investir: todos enviam problema e invenção; os pitches passam pelo tempo */
function ateInvestir(n: number) {
  let e = novoIdeias(ids(n), {}, 0, P);
  e = ap(e, e.participantes.map((id) => ({ tipo: 'im_problema' as const, id, texto: '' })));
  e = ap(e, e.apresentadores.map((id) => ({ tipo: 'im_invencao' as const, id, tracos: TR, nome: 'Inv ' + id, slogan: 's' })));
  while (e.fase === 'pitch') e = fim(e);
  return e;
}

describe('Ideias Mirabolantes', () => {
  it('conteúdo: 200 problemas', () => {
    expect(conteudoIdeias().length).toBeGreaterThanOrEqual(200);
  });

  it('3 jogadores: todos apresentam; cada um recebe o problema de outro (derangement)', () => {
    const e = novoIdeias(ids(3), {}, 123, P);
    expect(e.fase).toBe('problema');
    expect(e.terminaEm).toBe(123 + T_PROBLEMA * 1000);
    expect(e.apresentadores).toHaveLength(3);
    const autores = Object.values(e.recebeu);
    expect(new Set(autores).size).toBe(3);
    for (const [id, a] of Object.entries(e.recebeu)) expect(a).not.toBe(id);
  });

  it('16 jogadores: 8 sorteados apresentam; "todos" faz todos; os a mais vão para a audiência', () => {
    const e = novoIdeias(ids(18), {}, 9, P);
    expect(e.participantes).toHaveLength(16);
    expect(e.audiencia).toEqual(['j17', 'j18']);
    expect(e.apresentadores).toHaveLength(8);
    expect(new Set(Object.values(e.recebeu)).size).toBe(8);
    expect(novoIdeias(ids(16), { quem: 'todos' }, 9, P).apresentadores).toHaveLength(16);
    expect(novoIdeias(ids(8), {}, 9, P).apresentadores).toHaveLength(8);
  });

  it('problema: editado vale; quem não envia fica com o sorteado; acaba quando todos enviam', () => {
    let e = novoIdeias(ids(3), {}, 0, P);
    e = ap(e, [{ tipo: 'im_problema', id: 'j1', texto: '  Meu problema  ' }]);
    expect(e.problemas.j1).toBe('Meu problema');
    e = fim(e);
    expect(e.fase).toBe('inventar');
    const quem = Object.keys(e.recebeu).find((id) => e.recebeu[id] === 'j2')!;
    expect(vistaIdeias(e, (id) => 't' + id).recebidos['t' + quem]).toBe(e.sorteados.j2.pt);
  });

  it('inventar: sem desenho ou sem nome não conta; nome cortado; quem não envia não apresenta', () => {
    let e = fim(novoIdeias(ids(4), {}, 0, P));
    e = ap(e, [
      { tipo: 'im_invencao', id: 'j1', tracos: [], nome: 'x', slogan: '' },
      { tipo: 'im_invencao', id: 'j2', tracos: TR, nome: '   ', slogan: '' },
      { tipo: 'im_invencao', id: 'j3', tracos: TR, nome: 'N'.repeat(99), slogan: 'S' },
    ]);
    expect(Object.keys(e.invencoes)).toEqual(['j3']);
    expect(e.invencoes.j3.nome).toHaveLength(MAX_NOME);
    e = fim(e);
    expect(e.fase).toBe('pitch');
    expect(e.ordem).toEqual(['j3']);
  });

  it('ninguém inventa: salta para a revelação sem pontos', () => {
    let e = fim(novoIdeias(ids(3), {}, 0, P));
    e = fim(e);
    expect(e.fase).toBe('revelar');
    expect(Object.values(e.pontos).every((x) => x === 0)).toBe(true);
    expect(fim(e).fase).toBe('fim');
  });

  it('pitch: só o inventor passa as etapas; "Acabei" só na última; a vista mostra só até à etapa', () => {
    let e = fim(novoIdeias(ids(3), {}, 0, P));
    e = ap(e, e.apresentadores.map((id) => ({ tipo: 'im_invencao' as const, id, tracos: TR, nome: 'N', slogan: 'S' })));
    expect(e.fase).toBe('pitch');
    const inv = e.ordem[0];
    const outro = e.ordem[1];
    expect(ap(e, [{ tipo: 'im_etapa', id: outro, etapa: 2 }]).etapa).toBe(0);
    let v = vistaIdeias(e, (id) => id).pitch!;
    expect(v.tracos).toBeNull();
    expect(v.nome).toBeNull();
    expect(ap(e, [{ tipo: 'im_acabei', id: inv }]).atual).toBe(0);
    e = ap(e, [{ tipo: 'im_etapa', id: inv, etapa: 1 }]);
    v = vistaIdeias(e, (id) => id).pitch!;
    expect(v.tracos).toEqual(TR);
    expect(v.nome).toBeNull();
    e = ap(e, [{ tipo: 'im_etapa', id: inv, etapa: 9 }]);
    expect(e.etapa).toBe(2);
    e = ap(e, [{ tipo: 'im_acabei', id: inv }], 500);
    expect(e.atual).toBe(1);
    expect(e.etapa).toBe(0);
    expect(e.terminaEm).toBe(500 + 45_000);
  });

  it('investir: não na própria, no máximo 3 notas; todas na mesma vale; confirmar só com as 3', () => {
    let e = ateInvestir(3);
    expect(e.fase).toBe('investir');
    expect(fim(ap(e, [], 0)).fase).toBe('revelar');
    expect(T_INVESTIR).toBe(30);
    expect(ap(e, [{ tipo: 'im_investir', id: 'j1', notas: { j1: 1 } }]).investimentos.j1).toBeUndefined();
    expect(ap(e, [{ tipo: 'im_investir', id: 'j1', notas: { j2: 2, j3: 2 } }]).investimentos.j1).toBeUndefined();
    e = ap(e, [{ tipo: 'im_investir', id: 'j1', notas: { j2: 2 }, confirmar: true }]);
    expect(e.investimentos.j1).toEqual({ j2: 2 });
    expect(e.confirmados).toEqual([]);
    e = ap(e, [
      { tipo: 'im_investir', id: 'j1', notas: { j2: 3 }, confirmar: true },
      { tipo: 'im_investir', id: 'j2', notas: { j1: 1, j3: 2 }, confirmar: true },
    ]);
    expect(e.confirmados).toEqual(['j1', 'j2']);
    expect(vistaIdeias(e, (id) => id).ranking).toEqual([]);
    e = ap(e, [{ tipo: 'im_investir', id: 'j3', notas: { j1: 1, j2: 2 }, confirmar: true }]);
    expect(e.fase).toBe('revelar');
  });

  it('pontos: € × 10; a mais financiada +1000; o autor do problema dela +500; investidores 0', () => {
    let e = ateInvestir(3);
    e = ap(e, [
      { tipo: 'im_investir', id: 'j1', notas: { j2: 3 }, confirmar: true },
      { tipo: 'im_investir', id: 'j2', notas: { j3: 1 }, confirmar: false },
      { tipo: 'im_investir', id: 'j3', notas: { j2: 1, j1: 2 }, confirmar: true },
    ]);
    e = fim(e); // tempo esgotado: as notas não confirmadas contam
    expect(e.fase).toBe('revelar');
    const autor = e.recebeu.j2;
    const esperado: Record<string, number> = { j1: 200 * 10, j2: 400 * 10 + BONUS_VENCEDORA, j3: 100 * 10 };
    esperado[autor] += BONUS_PROBLEMA;
    expect(e.pontos).toEqual(esperado);
    const r = vistaIdeias(e, (id) => id).ranking;
    expect(r.map((x) => x.inventor)).toEqual(['j2', 'j1', 'j3']);
    expect(r[0].vencedora).toBe(true);
    expect(r[0].tracos).toEqual(TR);
    expect(r[1].tracos).toEqual([]);
  });

  it('empate: todos os empatados ganham +1000 e os autores dos problemas +500', () => {
    let e = ateInvestir(4);
    e = ap(e, [
      { tipo: 'im_investir', id: 'j1', notas: { j2: 3 } },
      { tipo: 'im_investir', id: 'j2', notas: { j1: 3 } },
    ]);
    e = fim(e);
    const ganhos: Record<string, number> = { j1: 3000 + BONUS_VENCEDORA, j2: 3000 + BONUS_VENCEDORA, j3: 0, j4: 0 };
    ganhos[e.recebeu.j1] += BONUS_PROBLEMA;
    ganhos[e.recebeu.j2] += BONUS_PROBLEMA;
    expect(e.pontos).toEqual(ganhos);
    const empatados = podioIdeias({ participantes: ['a', 'b', 'c'], pontos: { a: 5, b: 5, c: 1 } });
    expect(empatados.map((p) => p.lugar)).toEqual([1, 1, 3]);
  });

  it('ninguém investe: sem bónus', () => {
    const e = fim(ateInvestir(3));
    expect(Object.values(e.pontos).every((x) => x === 0)).toBe(true);
  });

  it('a audiência investe (conta para o inventor) mas não ganha pontos', () => {
    let e = ateInvestir(17);
    expect(investidores(e)).toContain('j17');
    const alvo = e.ordem[0];
    e = ap(e, [{ tipo: 'im_investir', id: 'j17', notas: { [alvo]: 3 }, confirmar: true }]);
    e = fim(e);
    expect(e.pontos[alvo]).toBeGreaterThanOrEqual(3000 + BONUS_VENCEDORA);
    expect(e.pontos.j17).toBeUndefined();
  });

  it('desligar e voltar: pausa abaixo de 3 ligados e retoma o tempo; quem volta continua', () => {
    let e = novoIdeias(ids(3), {}, 0, P);
    e = reduzIdeias(e, { tipo: 'ligados', ids: ['j1', 'j2'] }, 10_000);
    expect(e.pausaRestante).toBe(35_000);
    expect(reduzIdeias(e, { tipo: 'tick' }, 99_000).fase).toBe('problema');
    expect(ap(e, [{ tipo: 'im_problema', id: 'j1', texto: 'x' }]).problemas.j1).toBeUndefined();
    e = reduzIdeias(e, { tipo: 'ligados', ids: ['j1', 'j2', 'j3'] }, 50_000);
    expect(e.pausaRestante).toBeNull();
    expect(e.terminaEm).toBe(85_000);
  });

  it('a audiência não conta para a pausa', () => {
    const e = { ...novoIdeias(ids(3), {}, 0, P), audiencia: ['a1'] };
    expect(reduzIdeias(e, { tipo: 'ligados', ids: ['j1', 'j2', 'a1'] }, 10_000).pausaRestante).toBe(35_000);
  });

  it('desligado não trava: a fase acaba quando os ligados enviam', () => {
    let e = novoIdeias(ids(4), {}, 0, P);
    e = reduzIdeias(e, { tipo: 'ligados', ids: ['j1', 'j2', 'j3'] }, 0);
    e = ap(e, ['j1', 'j2', 'j3'].map((id) => ({ tipo: 'im_problema' as const, id, texto: '' })));
    expect(e.fase).toBe('inventar');
  });

  it('a vista não mostra investimentos nem invenções antes da hora', () => {
    let e = novoIdeias(ids(3), {}, 0, P);
    const v = vistaIdeias(e, (id) => 't' + id);
    expect(Object.keys(v.sorteados).sort()).toEqual(['tj1', 'tj2', 'tj3']);
    expect(JSON.stringify(v)).not.toContain('investimentos');
    e = ateInvestir(3);
    const vi = vistaIdeias(e, (id) => id);
    expect(vi.cartoes).toHaveLength(3);
    expect(JSON.stringify(vi.cartoes)).not.toContain('"p"');
  });
});
