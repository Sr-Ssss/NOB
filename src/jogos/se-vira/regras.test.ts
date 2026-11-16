import { describe, expect, it } from 'vitest';
import {
  T_ENTRE_REACOES,
  T_NOTA,
  T_PREPARAR,
  T_TEMA,
  apresentador,
  extraTv,
  gerarSlides,
  novoSevira,
  plateia,
  podioSevira,
  pontosDe,
  quantosApresentam,
  reduzSevira,
  sortearOrdem,
  vistaSevira,
  type AcaoSevira,
  type Conteudo,
  type EstadoSevira,
  type Txt,
} from './regras';
import { conteudoSevira } from './conteudo';

const txt = (p: string, n: number): Txt[] => Array.from({ length: n }, (_, i) => ({ id: `${p}${i}`, pt: `${p}-pt-${i}`, en: `${p}-en-${i}` }));
const C: Conteudo = { titulos: txt('t', 30), legendas: txt('l', 30), topicos: txt('o', 30), citacoes: txt('c', 30), rotulos: txt('r', 30), conclusoes: txt('f', 10) };
const T = 1_000_000;
const ids = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);
const ap = (e: EstadoSevira, as: AcaoSevira[], agora = T) => as.reduce((s, a) => reduzSevira(s, a, agora), e);
const tick = (e: EstadoSevira) => reduzSevira(e, { tipo: 'tick' }, e.terminaEm);
const GIF = { tipo: 'giphy' as const, url: 'https://media.giphy.com/x.gif' };

/** todos enviam → fase tema */
function preparado(n: number, def = {}): EstadoSevira {
  const e = novoSevira(ids(n), def, T, C);
  return ap(e, e.participantes.map((id) => ({ tipo: 'sv_enviar', id, titulo: null })));
}

describe('Se Vira! — preparar', () => {
  it('3 jogadores (mínimo): todos apresentam, ninguém fica com o próprio deck', () => {
    const e = novoSevira(ids(3), {}, T, C);
    expect(e.fase).toBe('preparar');
    expect(e.terminaEm).toBe(T + T_PREPARAR * 1000);
    expect(e.apresentadores).toHaveLength(3);
    for (const a of e.apresentadores) expect(e.dono[a]).not.toBe(a);
    expect(new Set(Object.values(e.dono)).size).toBe(3);
  });

  it('16 jogadores (máximo): por defeito apresentam 8 sorteados; "todos" = 16', () => {
    const e = novoSevira(ids(16), {}, T, C);
    expect(e.apresentadores).toHaveLength(8);
    for (const a of e.apresentadores) expect(e.dono[a]).not.toBe(a);
    expect(new Set(Object.values(e.dono)).size).toBe(8);
    expect(novoSevira(ids(16), { quem: 'todos' }, T, C).apresentadores).toHaveLength(16);
    expect(quantosApresentam({ tempo: 90, slides: 6, quem: 'auto' }, 8)).toBe(8);
    expect(quantosApresentam({ tempo: 90, slides: 6, quem: 'sorteados' }, 5)).toBe(5);
  });

  it('derangement para qualquer seed', () => {
    for (let s = 1; s < 50; s++) {
      const { apresentadores, dono } = sortearOrdem(ids(5), 5, s);
      expect(apresentadores.every((a) => dono[a] !== a)).toBe(true);
    }
  });

  it('cada um tem um tema sorteado diferente; a vista mostra-o pela tag', () => {
    const e = novoSevira(ids(4), {}, T, C);
    expect(new Set(Object.values(e.temas).map((t) => t.id)).size).toBe(4);
    const v = vistaSevira(e, (id) => 'tag-' + id);
    expect(v.temas['tag-j1']).toEqual(e.temas.j1);
    expect(v.temas.j1).toBeUndefined();
  });

  it('imagens: valida o tipo e o tamanho; não aceita depois de enviar', () => {
    let e = novoSevira(ids(3), {}, T, C);
    e = ap(e, [
      { tipo: 'sv_imagem', id: 'j1', i: 0, img: GIF },
      { tipo: 'sv_imagem', id: 'j1', i: 1, img: { tipo: 'link', url: 'javascript:alert(1)' } },
      { tipo: 'sv_imagem', id: 'j1', i: 2, img: { tipo: 'galeria', url: 'data:image/webp;base64,' + 'A'.repeat(200_000) } },
      { tipo: 'sv_imagem', id: 'j1', i: 3, img: GIF },
      { tipo: 'sv_imagem', id: 'j2', i: 1, img: { tipo: 'galeria', url: 'data:image/webp;base64,AAAA' } },
    ]);
    expect(e.rascunhos.j1).toEqual([GIF, null, null]);
    expect(e.rascunhos.j2[1]?.tipo).toBe('galeria');
    e = ap(e, [{ tipo: 'sv_enviar', id: 'j1', titulo: 'O meu' }, { tipo: 'sv_imagem', id: 'j1', i: 1, img: GIF }]);
    expect(e.rascunhos.j1).toEqual([GIF, null, null]);
    expect(e.enviaram).toEqual(['j1']);
  });

  it('acaba quando todos enviam; o título editado e as imagens vão para quem apresenta', () => {
    let e = novoSevira(ids(3), {}, T, C);
    e = ap(e, [{ tipo: 'sv_imagem', id: 'j1', i: 2, img: GIF }, { tipo: 'sv_enviar', id: 'j1', titulo: '  Patos no escritório  ' }, { tipo: 'sv_enviar', id: 'j2', titulo: '' }]);
    expect(e.fase).toBe('preparar');
    e = reduzSevira(e, { tipo: 'sv_enviar', id: 'j3', titulo: null }, T + 5);
    expect(e.fase).toBe('tema');
    expect(e.terminaEm).toBe(T + 5 + T_TEMA * 1000);
    const quem = Object.keys(e.dono).find((a) => e.dono[a] === 'j1')!;
    expect(e.decks[quem].titulo).toBe('Patos no escritório');
    expect(e.decks[quem].slides.filter((s) => s.tipo === 'imagem')).toHaveLength(1);
    const outro = Object.keys(e.dono).find((a) => e.dono[a] === 'j2')!;
    expect(e.decks[outro].titulo).toBe(e.temas.j2.pt);
  });

  it('tempo esgotado: quem não enviou fica com o tema sorteado e sem as suas imagens', () => {
    let e = novoSevira(ids(3), {}, T, C);
    e = ap(e, [{ tipo: 'sv_imagem', id: 'j2', i: 0, img: GIF }]);
    e = tick(e);
    expect(e.fase).toBe('tema');
    const quem = Object.keys(e.dono).find((a) => e.dono[a] === 'j2')!;
    expect(e.decks[quem].titulo).toBe(e.temas.j2.pt);
    expect(e.decks[quem].slides.some((s) => s.tipo === 'imagem')).toBe(false);
  });

  it('em inglês o tema sorteado vem em inglês', () => {
    const e = tick(novoSevira(ids(3), {}, T, C, 'en'));
    const a = e.apresentadores[0];
    expect(e.decks[a].titulo).toBe(e.temas[e.dono[a]].en);
  });
});

describe('Se Vira! — slides', () => {
  it('nº de slides certo; conclusão no fim; as 3 imagens entram sempre', () => {
    for (const n of [4, 6, 8]) {
      const s = gerarSlides(n, [GIF, GIF, GIF], C, new Set(), 42 + n);
      expect(s).toHaveLength(n);
      expect(s[n - 1].tipo).toBe('conclusao');
      expect(s.filter((x) => x.tipo === 'imagem')).toHaveLength(3);
    }
  });

  it('as posições das imagens são sorteadas', () => {
    const pos = new Set<number>();
    for (let seed = 1; seed < 30; seed++) pos.add(gerarSlides(6, [GIF], C, new Set(), seed).findIndex((x) => x.tipo === 'imagem'));
    expect(pos.size).toBeGreaterThan(2);
  });

  it('lista tem 3 tópicos; gráfico tem valores', () => {
    const s = gerarSlides(8, [], C, new Set(), 7);
    const lista = s.find((x) => x.tipo === 'lista');
    if (lista?.tipo === 'lista') expect(lista.itens).toHaveLength(3);
    const g = s.find((x) => x.tipo === 'grafico');
    if (g?.tipo === 'grafico') expect(g.valores.every((v) => v > 0)).toBe(true);
  });
});

describe('Se Vira! — apresentar', () => {
  it('tema → apresentar (tempo das definições); só o apresentador muda de slide, sem passar dos limites', () => {
    let e = tick(preparado(3, { tempo: 60, slides: 4 }));
    expect(e.fase).toBe('apresentar');
    expect(e.terminaEm - T).toBeGreaterThanOrEqual(60_000);
    const a = apresentador(e)!;
    const outro = e.participantes.find((x) => x !== a)!;
    e = ap(e, [{ tipo: 'sv_slide', id: outro, dir: 1 }]);
    expect(e.slide).toBe(0);
    e = ap(e, [{ tipo: 'sv_slide', id: a, dir: -1 }]);
    expect(e.slide).toBe(0);
    e = ap(e, Array.from({ length: 6 }, () => ({ tipo: 'sv_slide' as const, id: a, dir: 1 })));
    expect(e.slide).toBe(3);
  });

  it('reações: o apresentador não reage; spam não conta; só emojis válidos', () => {
    let e = tick(preparado(3));
    const a = apresentador(e)!;
    const [x, y] = e.participantes.filter((i) => i !== a);
    e = ap(e, [{ tipo: 'sv_reagir', id: a, r: '😂' }, { tipo: 'sv_reagir', id: x, r: '💩' }, { tipo: 'sv_reagir', id: x, r: '😂' }, { tipo: 'sv_reagir', id: x, r: '👏' }]);
    e = reduzSevira(e, { tipo: 'sv_reagir', id: y, r: '🤯' }, T + 1);
    e = reduzSevira(e, { tipo: 'sv_reagir', id: x, r: '😴' }, T + T_ENTRE_REACOES);
    expect(e.contaReacoes[a]).toBe(3);
    expect(extraTv(e).reacoes.map((r) => r.r)).toEqual(['😂', '🤯', '😴']);
    // as reações não vão no canal
    expect(JSON.stringify(vistaSevira(e, () => undefined))).not.toContain('🤯');
  });

  it('a galeria não vai no canal, só para a TV', () => {
    let e = novoSevira(ids(3), { slides: 4 }, T, C);
    const dados = 'data:image/webp;base64,QUJD';
    const autor = e.dono[e.apresentadores[0]];
    e = ap(e, [0, 1, 2].map((i) => ({ tipo: 'sv_imagem' as const, id: autor, i, img: { tipo: 'galeria' as const, url: dados } })));
    e = tick(tick(ap(e, [{ tipo: 'sv_enviar', id: autor, titulo: null }])));
    expect(e.fase).toBe('apresentar');
    // 4 slides: 3 imagens + conclusão → o 1.º é imagem
    expect(extraTv(e).imagem).toBe(dados);
    const v = vistaSevira(e, () => undefined);
    expect(JSON.stringify(v)).not.toContain('QUJD');
    expect(v.slideAtual?.tipo).toBe('imagem');
  });
});

describe('Se Vira! — nota e pontos', () => {
  const ateNota = (n: number) => tick(tick(preparado(n)));

  it('ninguém se avalia a si próprio; 1–5 apenas; uma nota por pessoa; acaba quando todos dão', () => {
    let e = ateNota(3);
    expect(e.fase).toBe('nota');
    expect(e.terminaEm - T).toBeGreaterThanOrEqual(T_NOTA * 1000);
    const a = apresentador(e)!;
    const [x, y] = plateia(e);
    e = ap(e, [{ tipo: 'sv_nota', id: a, estrelas: 5 }, { tipo: 'sv_nota', id: x, estrelas: 9 }, { tipo: 'sv_nota', id: x, estrelas: 2.5 }, { tipo: 'sv_nota', id: x, estrelas: 4 }, { tipo: 'sv_nota', id: x, estrelas: 1 }]);
    expect(e.notas[a]).toEqual({ [x]: 4 });
    expect(vistaSevira(e, () => undefined).deram).toEqual([x]);
    e = ap(e, [{ tipo: 'sv_nota', id: y, estrelas: 5 }]);
    expect(e.fase).toBe('tema');
    expect(e.atual).toBe(1);
    expect(e.pontos[a]).toBe(900);
  });

  it('pontos: média × 200 + 5 por reação, até +200', () => {
    expect(pontosDe({ a: 5, b: 5 }, 0)).toBe(1000);
    expect(pontosDe({ a: 3, b: 4 }, 3)).toBe(715);
    expect(pontosDe({ a: 1 }, 100)).toBe(400);
    expect(pontosDe({}, 2)).toBe(10);
  });

  it('tempo esgotado na nota: conta só quem deu', () => {
    let e = ateNota(4);
    const a = apresentador(e)!;
    e = ap(e, [{ tipo: 'sv_nota', id: plateia(e)[0], estrelas: 2 }]);
    e = tick(e);
    expect(e.pontos[a]).toBe(400);
  });

  it('jogo completo até ao pódio; empates no mesmo lugar', () => {
    let e = preparado(3);
    while (e.fase !== 'fim') e = tick(e);
    expect(e.apresentadores.every((a) => e.pontos[a] === 0)).toBe(true);
    const p = podioSevira(e);
    expect(p.every((x) => x.lugar === 1)).toBe(true);
    expect(podioSevira({ participantes: ['a', 'b', 'c'], pontos: { a: 500, b: 900, c: 500 } })).toEqual([
      { id: 'b', pontos: 900, lugar: 1 },
      { id: 'a', pontos: 500, lugar: 2 },
      { id: 'c', pontos: 500, lugar: 2 },
    ]);
    expect(vistaSevira(e, () => undefined).podio).toHaveLength(3);
  });
});

describe('Se Vira! — ligações', () => {
  it('desligar abaixo de 3 pausa; voltar retoma com o tempo que faltava', () => {
    let e = novoSevira(ids(3), {}, T, C);
    e = reduzSevira(e, { tipo: 'ligados', ids: ['j1', 'j2'] }, T + 10_000);
    expect(e.pausaRestante).toBe(50_000);
    expect(reduzSevira(e, { tipo: 'tick' }, T + 999_999).fase).toBe('preparar');
    expect(ap(e, [{ tipo: 'sv_enviar', id: 'j1', titulo: null }]).enviaram).toEqual([]);
    e = reduzSevira(e, { tipo: 'ligados', ids: ['j1', 'j2', 'j3'] }, T + 20_000);
    expect(e.pausaRestante).toBeNull();
    expect(e.terminaEm).toBe(T + 70_000);
  });

  it('com 4, um desligado não pausa e não é esperado no preparar nem na nota', () => {
    let e = novoSevira(ids(4), {}, T, C);
    e = reduzSevira(e, { tipo: 'ligados', ids: ['j1', 'j2', 'j3'] }, T);
    expect(e.pausaRestante).toBeNull();
    e = ap(e, ['j1', 'j2', 'j3'].map((id) => ({ tipo: 'sv_enviar' as const, id, titulo: null })));
    expect(e.fase).toBe('tema');
    e = tick(tick(e));
    const falta = plateia(e).filter((id) => id !== 'j4');
    e = ap(e, falta.map((id) => ({ tipo: 'sv_nota' as const, id, estrelas: 3 })));
    expect(e.fase === 'tema' || e.fase === 'fim').toBe(true);
  });

  it('o apresentador desliga e volta: continua no mesmo slide', () => {
    let e = tick(preparado(4));
    const a = apresentador(e)!;
    e = ap(e, [{ tipo: 'sv_slide', id: a, dir: 1 }, { tipo: 'ligados', ids: e.participantes.filter((x) => x !== a) }, { tipo: 'ligados', ids: e.participantes }]);
    expect(e.slide).toBe(1);
    e = ap(e, [{ tipo: 'sv_slide', id: a, dir: 1 }]);
    expect(e.slide).toBe(2);
  });
});

describe('Se Vira! — conteúdo', () => {
  it('lê conteudo/se-vira.json', () => {
    const c = conteudoSevira();
    expect(c.titulos.length).toBeGreaterThanOrEqual(100);
    expect(c.legendas.length).toBeGreaterThanOrEqual(100);
    expect(c.topicos.length).toBeGreaterThanOrEqual(100);
    expect(c.citacoes.length).toBeGreaterThan(50);
    expect(c.rotulos.length).toBeGreaterThan(50);
    expect(c.conclusoes.length).toBeGreaterThanOrEqual(20);
  });
});
