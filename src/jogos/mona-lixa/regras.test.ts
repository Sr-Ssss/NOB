import { describe, expect, it } from 'vitest';
import { bytesTracos, limparTracos, MAX_BYTES, simplificar } from '../../ui/tracos';
import {
  MAX_OPCOES,
  autorAtual,
  escolhedores,
  novoMona,
  reduzMona,
  rondasPadrao,
  vistaMona,
  type AcaoMona,
  type ConteudoMona,
  type EstadoMona,
} from './regras';

const T = 1_000;
const C: ConteudoMona = {
  desenhos: Array.from({ length: 40 }, (_, i) => ({ id: `d${i}`, pt: `Desenho ${i}`, en: `Drawing ${i}` })),
  falsos: Array.from({ length: 10 }, (_, i) => ({ id: `f${i}`, pt: `Casa ${i}`, en: `House ${i}` })),
};
const ids = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);
const TR = [{ c: 0, g: 0, p: [10, 10, 50, 50] }];

function ap(e: EstadoMona, acoes: AcaoMona[], agora = T): EstadoMona {
  return acoes.reduce((s, a) => reduzMona(s, a, agora), e);
}
function desenharTodos(e: EstadoMona): EstadoMona {
  return ap(
    e,
    e.participantes.map((id) => ({ tipo: 'ml_desenho' as const, id, tracos: TR })),
  );
}
/** cada inventor manda "falso de <id>" */
function inventarTodos(e: EstadoMona): EstadoMona {
  const a = autorAtual(e);
  return ap(
    e,
    e.participantes.filter((id) => id !== a).map((id) => ({ tipo: 'ml_falso' as const, id, texto: 'falso de ' + id })),
  );
}
const iVerdadeiro = (e: EstadoMona) => e.opcoes.findIndex((o) => o.verdadeiro);
const iDe = (e: EstadoMona, id: string) => e.opcoes.findIndex((o) => o.autores.includes(id) && !o.verdadeiro);
const iCasa = (e: EstadoMona) => e.opcoes.findIndex((o) => o.casa);

describe('Mona Lixa: regras', () => {
  it('3 jogadores: desenhar → inventar → escolher → revelar → placar → … → fim', () => {
    let e = novoMona(ids(3), {}, T, C);
    expect(e.fase).toBe('desenhar');
    expect(e.rondas).toBe(2);
    expect(Object.keys(e.sorteados)).toHaveLength(3);
    e = desenharTodos(e);
    expect(e.fase).toBe('inventar');
    expect(e.ordem).toHaveLength(3);
    for (let ronda = 1; ronda <= 2; ronda++) {
      for (let k = 0; k < 3; k++) {
        e = inventarTodos(e);
        expect(e.fase).toBe('escolher');
        // verdadeiro + 2 falsos + 1 da casa
        expect(e.opcoes).toHaveLength(4);
        e = ap(
          e,
          escolhedores(e).map((id) => ({ tipo: 'ml_escolher' as const, id, i: iVerdadeiro(e) })),
        );
        expect(e.fase).toBe('revelar');
        e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
      }
      expect(e.fase).toBe('placar');
      e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
      if (ronda === 1) {
        expect(e.fase).toBe('desenhar');
        e = desenharTodos(e);
      }
    }
    expect(e.fase).toBe('fim');
    // todos acertaram em tudo: +1000 por desenho alheio; autor fica com 0
    for (const id of ids(3)) expect(e.pontos[id]).toBe(2 * 2 * 1000);
  });

  it('pontos: acertar +1000, enganar +500 por pessoa, autor +500 por acerto', () => {
    let e = desenharTodos(novoMona(ids(4), {}, T, C));
    const a = autorAtual(e)!;
    const [x, y, z] = e.participantes.filter((id) => id !== a);
    e = inventarTodos(e);
    e = ap(e, [
      { tipo: 'ml_escolher', id: x, i: iVerdadeiro(e) },
      { tipo: 'ml_escolher', id: y, i: iDe(e, z) },
      { tipo: 'ml_escolher', id: z, i: iCasa(e) },
    ]);
    expect(e.fase).toBe('revelar');
    expect(e.pontos[x]).toBe(1000);
    expect(e.pontos[z]).toBe(500);
    expect(e.pontos[y]).toBe(0);
    expect(e.pontos[a]).toBe(500);
    // revelação: o verdadeiro no fim
    expect(e.revelacao[e.revelacao.length - 1].verdadeiro).toBe(true);
  });

  it('ninguém escolhe o próprio título; o autor não escolhe; só uma escolha', () => {
    let e = inventarTodos(desenharTodos(novoMona(ids(3), {}, T, C)));
    const a = autorAtual(e)!;
    const x = e.participantes.find((id) => id !== a)!;
    expect(reduzMona(e, { tipo: 'ml_escolher', id: x, i: iDe(e, x) }, T)).toBe(e);
    expect(reduzMona(e, { tipo: 'ml_escolher', id: a, i: iVerdadeiro(e) }, T)).toBe(e);
    e = reduzMona(e, { tipo: 'ml_escolher', id: x, i: iCasa(e) }, T);
    expect(reduzMona(e, { tipo: 'ml_escolher', id: x, i: iVerdadeiro(e) }, T)).toBe(e);
  });

  it('falso igual ao verdadeiro: recusado, pede outro', () => {
    let e = desenharTodos(novoMona(ids(3), {}, T, C));
    const a = autorAtual(e)!;
    const x = e.participantes.find((id) => id !== a)!;
    const verdadeiro = e.desenhos[a].titulo;
    e = reduzMona(e, { tipo: 'ml_falso', id: x, texto: '  ' + verdadeiro.toUpperCase() + '!' }, T);
    expect(e.falsos[x]).toBeUndefined();
    expect(e.recusados).toEqual([x]);
    expect(vistaMona(e, (id) => 't' + id).recusados).toEqual(['t' + x]);
    e = reduzMona(e, { tipo: 'ml_falso', id: x, texto: 'outro' }, T);
    expect(e.falsos[x]).toBe('outro');
    expect(e.recusados).toEqual([]);
  });

  it('falsos iguais juntam-se e os dois autores ganham', () => {
    let e = desenharTodos(novoMona(ids(4), {}, T, C));
    const a = autorAtual(e)!;
    const [x, y, z] = e.participantes.filter((id) => id !== a);
    e = ap(e, [
      { tipo: 'ml_falso', id: x, texto: 'Um gato' },
      { tipo: 'ml_falso', id: y, texto: 'um  gato' },
      { tipo: 'ml_falso', id: z, texto: 'outra coisa' },
    ]);
    const i = e.opcoes.findIndex((o) => o.autores.length === 2);
    expect(e.opcoes[i].autores.sort()).toEqual([x, y].sort());
    // nenhum dos dois pode escolher o título partilhado
    expect(reduzMona(e, { tipo: 'ml_escolher', id: y, i }, T)).toBe(e);
    e = reduzMona(e, { tipo: 'ml_escolher', id: z, i }, T);
    e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.pontos[x]).toBe(500);
    expect(e.pontos[y]).toBe(500);
  });

  it('título editável; desenho vazio não conta; sem título = o sorteado', () => {
    let e = novoMona(ids(3), {}, T, C);
    expect(reduzMona(e, { tipo: 'ml_desenho', id: 'j1', tracos: [] }, T)).toBe(e);
    e = reduzMona(e, { tipo: 'ml_desenho', id: 'j1', tracos: TR, titulo: '  O meu título  ' }, T);
    e = reduzMona(e, { tipo: 'ml_desenho', id: 'j2', tracos: TR }, T);
    expect(e.desenhos.j1.titulo).toBe('O meu título');
    expect(e.desenhos.j2.titulo).toBe(e.sorteados.j2.pt);
  });

  it('tempo esgotado: quem não desenhou fica fora da ronda; sem falsos ainda há a casa', () => {
    let e = novoMona(ids(4), {}, T, C);
    e = reduzMona(e, { tipo: 'ml_desenho', id: 'j2', tracos: TR }, T);
    e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.fase).toBe('inventar');
    expect(e.ordem).toEqual(['j2']);
    e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.fase).toBe('escolher');
    expect(e.opcoes).toHaveLength(2);
    e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.fase).toBe('revelar');
    expect(e.pontos.j2).toBe(0);
    e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.fase).toBe('placar');
  });

  it('ninguém desenhou: salta para o placar', () => {
    let e = novoMona(ids(3), {}, T, C);
    e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.fase).toBe('placar');
  });

  it('16 jogadores: 1 ronda por padrão; no máximo 8 opções com o verdadeiro', () => {
    expect(rondasPadrao(8)).toBe(2);
    expect(rondasPadrao(9)).toBe(1);
    let e = novoMona(ids(16), {}, T, C);
    expect(e.rondas).toBe(1);
    expect(novoMona(ids(16), { rondas: 3 }, T, C).rondas).toBe(3);
    e = inventarTodos(desenharTodos(e));
    expect(e.fase).toBe('escolher');
    expect(e.opcoes).toHaveLength(MAX_OPCOES);
    expect(e.opcoes.filter((o) => o.verdadeiro)).toHaveLength(1);
  });

  it('17+: os a mais são audiência — escolhem, contam como enganados, não pontuam', () => {
    let e = desenharTodos(novoMona(ids(17), {}, T, C));
    expect(e.audiencia).toEqual(['j17']);
    e = inventarTodos(e);
    const a = autorAtual(e)!;
    const alvo = e.opcoes.findIndex((o) => !o.verdadeiro && !o.casa);
    const dono = e.opcoes[alvo].autores[0];
    e = reduzMona(e, { tipo: 'ml_escolher', id: 'j17', i: alvo }, T);
    e = reduzMona(e, { tipo: 'ml_escolher', id: e.participantes.find((x) => x !== a && x !== dono)!, i: iVerdadeiro(e) }, T);
    e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.pontos.j17).toBeUndefined();
    expect(e.pontos[dono]).toBe(500);
  });

  it('desligar pausa abaixo de 3; voltar retoma com o tempo que faltava; o desenho fica', () => {
    let e = novoMona(ids(3), {}, T, C);
    e = reduzMona(e, { tipo: 'ml_desenho', id: 'j3', tracos: TR }, T);
    e = reduzMona(e, { tipo: 'ligados', ids: ['j1', 'j2'] }, T + 5000);
    expect(e.pausaRestante).toBe(70_000);
    expect(reduzMona(e, { tipo: 'tick' }, T + 999_999)).toBe(e);
    expect(reduzMona(e, { tipo: 'ml_desenho', id: 'j1', tracos: TR }, T)).toBe(e);
    e = reduzMona(e, { tipo: 'ligados', ids: ['j1', 'j2', 'j3'] }, T + 10_000);
    expect(e.pausaRestante).toBeNull();
    expect(e.terminaEm).toBe(T + 80_000);
    expect(e.desenhos.j3).toBeTruthy();
  });

  it('a audiência não conta para a pausa (2 jogadores + 1 audiência pausam)', () => {
    const e = { ...novoMona(ids(3), {}, T, C), audiencia: ['a1'] };
    expect(reduzMona(e, { tipo: 'ligados', ids: ['j1', 'j2', 'a1'] }, T + 5000).pausaRestante).toBe(70_000);
  });

  it('quem está desligado não trava a fase', () => {
    let e = novoMona(ids(4), {}, T, C);
    e = reduzMona(e, { tipo: 'ligados', ids: ['j1', 'j2', 'j3'] }, T);
    e = ap(e, ['j1', 'j2', 'j3'].map((id) => ({ tipo: 'ml_desenho' as const, id, tracos: TR })));
    expect(e.fase).toBe('inventar');
  });

  it('empates no pódio: mesmo lugar', () => {
    const e = novoMona(ids(3), {}, T, C);
    const v = vistaMona({ ...e, pontos: { j1: 1000, j2: 1000, j3: 0 } }, () => undefined);
    expect(v.podio.map((p) => p.lugar)).toEqual([1, 1, 3]);
  });

  it('vista: autor escondido até revelar; sorteados por tag; desenho só com desenho em jogo', () => {
    let e = novoMona(ids(3), {}, T, C);
    const tag = (id: string) => 't' + id;
    let v = vistaMona(e, tag);
    expect(Object.keys(v.sorteados).sort()).toEqual(['tj1', 'tj2', 'tj3']);
    expect(v.desenho).toBeNull();
    e = inventarTodos(desenharTodos(e));
    v = vistaMona(e, tag);
    expect(v.autor).toBeUndefined();
    expect(v.autorTag).toBe(tag(autorAtual(e)!));
    expect(v.desenho).toEqual(TR);
    expect(v.opcoes).toHaveLength(4);
    expect(JSON.stringify(v)).not.toContain('"verdadeiro"');
    e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
    expect(vistaMona(e, tag).autor).toBe(autorAtual(e));
  });
});

describe('traços', () => {
  it('limpa valores e corta acima de 30 KB', () => {
    expect(limparTracos('x')).toEqual([]);
    expect(limparTracos([{ c: 99, g: -3, p: [-5, 999, 10.6, 20] }])).toEqual([{ c: 7, g: 0, p: [0, 300, 11, 20] }]);
    const enorme = Array.from({ length: 2000 }, () => ({ c: 1, g: 1, p: Array.from({ length: 40 }, (_, i) => 100 + i) }));
    const l = limparTracos(enorme);
    expect(bytesTracos(l)).toBeLessThanOrEqual(MAX_BYTES);
    expect(l.length).toBeGreaterThan(0);
  });
  it('simplificar tira pontos em linha reta', () => {
    expect(simplificar([0, 0, 1, 1, 2, 2, 3, 3, 10, 10])).toEqual([0, 0, 10, 10]);
  });
});
