import { describe, expect, it } from 'vitest';
import {
  distribuir,
  novoPensa,
  podioPensa,
  pontosDuelo,
  reduzPensa,
  votantes,
  vistaPensa,
  type AcaoPensa,
  type EstadoPensa,
  type Pergunta,
} from './regras';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);
const perguntas = (n: number, p: string): Pergunta[] => Array.from({ length: n }, (_, i) => ({ id: `${p}${i}`, pt: `P${i}`, en: `Q${i}` }));
const NORMAIS = perguntas(50, 'n');
const FINAIS = perguntas(5, 'f');
const T0 = 1_000_000;

const novo = (n: number, def = {}) => novoPensa(ids(n), def, T0, NORMAIS, FINAIS);
const aplicar = (e: EstadoPensa, acoes: AcaoPensa[], agora = T0) => acoes.reduce((s, a) => reduzPensa(s, a, agora), e);

/** cada um responde a todas as suas perguntas (menos os de `falta`) */
function responderTodos(e: EstadoPensa, falta: string[] = []): EstadoPensa {
  const acoes: AcaoPensa[] = [];
  e.duelos.forEach((d, i) => d.autores.filter((a) => !falta.includes(a)).forEach((a) => acoes.push({ tipo: 'responder', id: a, duelo: i, texto: `${a} em ${i}` })));
  return aplicar(e, acoes);
}

/** todos votam na opção escolhida por `qual` (índice na ordem) */
function votarTodos(e: EstadoPensa, qual: (id: string, k: number) => number = () => 0): EstadoPensa {
  const ordem = e.duelos[e.atual].ordem;
  return aplicar(e, votantes(e).map((id, k) => ({ tipo: 'votar', id, autor: ordem[qual(id, k) % ordem.length] })));
}

const tick = (e: EstadoPensa) => reduzPensa(e, { tipo: 'tick' }, e.terminaEm);

/** joga a ronda inteira e devolve o estado no placar */
function jogarRonda(e: EstadoPensa): EstadoPensa {
  let s = responderTodos(e);
  while (s.fase === 'votar' || s.fase === 'revelar') s = s.fase === 'votar' ? votarTodos(s) : tick(s);
  return s;
}

describe('distribuição', () => {
  it.each([4, 8])('%i jogadores: n perguntas, cada um responde a 2', (n) => {
    const g = distribuir(ids(n), 1);
    expect(g).toHaveLength(n);
    for (const id of ids(n)) expect(g.filter((x) => x.includes(id))).toHaveLength(2);
    expect(g.every((x) => x.length === 2 && x[0] !== x[1])).toBe(true);
  });

  it('9 jogadores: 1 pergunta por jogador, um duelo a 3', () => {
    const g = distribuir(ids(9), 1);
    expect(g.map((x) => x.length).sort()).toEqual([2, 2, 2, 3]);
    for (const id of ids(9)) expect(g.filter((x) => x.includes(id))).toHaveLength(1);
  });

  it('16 jogadores: 8 pares', () => {
    const g = distribuir(ids(16), 1);
    expect(g).toHaveLength(8);
    expect(g.every((x) => x.length === 2)).toBe(true);
    expect(new Set(g.flat()).size).toBe(16);
  });

  it('a partir do 17.º = audiência', () => {
    const e = novo(18);
    expect(e.participantes).toHaveLength(16);
    expect(e.audiencia).toEqual(['j17', 'j18']);
  });
});

describe('pontos', () => {
  it('1000 × % de votos; 100% = +250', () => {
    expect(pontosDuelo([1, 1], 1)).toEqual({ pontos: [500, 500], arrasou: [false, false] });
    expect(pontosDuelo([2, 0], 1)).toEqual({ pontos: [1250, 0], arrasou: [true, false] });
    expect(pontosDuelo([2, 0], 2).pontos).toEqual([2500, 0]);
    expect(pontosDuelo([0, 0], 1).pontos).toEqual([0, 0]);
  });

  it('unanimidade na sala dá +250 "Arrasou"', () => {
    let s = responderTodos(novo(4));
    expect(s.fase).toBe('votar');
    s = votarTodos(s, () => 0);
    expect(s.fase).toBe('revelar');
    const r = s.resultados[0];
    expect(r.opcoes[0]).toMatchObject({ pontos: 1250, arrasou: true });
    expect(r.opcoes[1].pontos).toBe(0);
  });

  it('ronda 2 vale ×2 e quem vota não pontua', () => {
    let s = jogarRonda(novo(4));
    expect(s.fase).toBe('placar');
    const p1 = { ...s.pontos };
    s = tick(s);
    expect(s.ronda).toBe(2);
    s = responderTodos(s);
    const d = s.duelos[s.atual];
    s = votarTodos(s, () => 0);
    expect(s.pontos[d.ordem[0]] - p1[d.ordem[0]]).toBe(2500);
    expect(s.pontos[d.ordem[1]]).toBe(p1[d.ordem[1]]);
  });
});

describe('jogo completo', () => {
  it.each([4, 8, 9, 16])('%i jogadores chegam ao pódio pela final', (n) => {
    let s = novo(n);
    s = tick(jogarRonda(s));
    s = tick(jogarRonda(s));
    expect(s.fase).toBe('final_escrever');
    s = aplicar(s, s.participantes.map((id) => ({ tipo: 'responder', id, duelo: 0, texto: `final de ${id}` })));
    expect(s.fase).toBe('final_votar');
    s = aplicar(
      s,
      s.participantes.map((id) => {
        const outro = s.ordemFinal.find((a) => a !== id)!;
        return { tipo: 'votos_final', id, votos: { [outro]: 3 } };
      }),
    );
    expect(s.fase).toBe('final_revelar');
    expect(s.resultadoFinal.reduce((a, o) => a + o.pontos, 0)).toBe(n * 3 * 300);
    s = tick(s);
    expect(s.fase).toBe('fim');
    expect(podioPensa(s)[0].lugar).toBe(1);
  });

  it('com 9 jogadores o duelo a 3 tem 3 opções', () => {
    let s = responderTodos(novo(9));
    while (s.duelos[s.atual].ordem.length !== 3) s = tick(votarTodos(s));
    expect(s.fase).toBe('votar');
    expect(vistaPensa(s, (id) => 't' + id).opcoes).toHaveLength(3);
    expect(votantes(s)).toHaveLength(6);
  });

  it('final com mais de 8 jogadores corta em 80 caracteres', () => {
    let s = tick(jogarRonda(tick(jogarRonda(novo(9)))));
    expect(s.fase).toBe('final_escrever');
    s = reduzPensa(s, { tipo: 'responder', id: 'j1', duelo: 0, texto: 'x'.repeat(200) }, T0);
    expect(s.respostasFinal.j1).toHaveLength(80);
  });

  it('sem final: placar da última ronda → fim', () => {
    const s = tick(jogarRonda(novo(4, { rondas: 1, final: false })));
    expect(s.fase).toBe('fim');
  });
});

describe('sem resposta', () => {
  it('o adversário ganha 100% sem bónus, sem votação', () => {
    const e = novo(4);
    const d0 = e.duelos[0];
    // só o primeiro autor do duelo 0 responde a esse duelo; os outros duelos completos
    const acoes: AcaoPensa[] = [];
    e.duelos.forEach((d, i) => d.autores.forEach((a) => (i === 0 && a === d0.autores[1] ? null : acoes.push({ tipo: 'responder', id: a, duelo: i, texto: 'ok' }))));
    let s = tick(aplicar(e, acoes)); // tempo esgotado
    expect(s.fase).toBe('revelar');
    expect(s.resultados[0]).toMatchObject({ semAdversario: true });
    expect(s.resultados[0].opcoes).toHaveLength(1);
    expect(s.pontos[d0.autores[0]]).toBe(1000);
    s = tick(s);
    expect(s.fase).toBe('votar');
    expect(s.atual).toBe(1);
  });

  it('nenhum dos dois respondeu: o duelo salta-se', () => {
    const e = novo(4);
    const acoes: AcaoPensa[] = [];
    e.duelos.forEach((d, i) => i !== 0 && d.autores.forEach((a) => acoes.push({ tipo: 'responder', id: a, duelo: i, texto: 'ok' })));
    const s = tick(aplicar(e, acoes));
    expect(s.fase).toBe('votar');
    expect(s.atual).toBe(1);
  });

  it('ninguém respondeu: vai direto ao placar', () => {
    expect(tick(novo(4)).fase).toBe('placar');
  });

  it('não responde a perguntas que não são suas', () => {
    const e = novo(4);
    const fora = ids(4).find((id) => !e.duelos[0].autores.includes(id))!;
    expect(reduzPensa(e, { tipo: 'responder', id: fora, duelo: 0, texto: 'x' }, T0)).toBe(e);
  });
});

describe('votar', () => {
  it('autores não votam; pode mudar-se o voto', () => {
    let s = responderTodos(novo(5));
    const d = s.duelos[s.atual];
    expect(reduzPensa(s, { tipo: 'votar', id: d.autores[0], autor: d.ordem[1] }, T0)).toBe(s);
    const v = votantes(s)[0];
    s = reduzPensa(s, { tipo: 'votar', id: v, autor: d.ordem[0] }, T0);
    s = reduzPensa(s, { tipo: 'votar', id: v, autor: d.ordem[1] }, T0);
    expect(s.votos[v]).toBe(d.ordem[1]);
  });

  it('a vista não revela autores ao votar', () => {
    const s = responderTodos(novo(4));
    const v = vistaPensa(s, (id) => 'tag-' + id);
    expect(JSON.stringify(v.opcoes)).not.toMatch(/"j\d"/);
    expect(v.resultado).toBeUndefined();
  });
});

describe('final', () => {
  function naFinal(): EstadoPensa {
    let s = tick(jogarRonda(novo(4, { rondas: 1 })));
    s = aplicar(s, s.participantes.map((id) => ({ tipo: 'responder', id, duelo: 0, texto: `f ${id}` })));
    expect(s.fase).toBe('final_votar');
    return s;
  }

  it('não se vota na própria resposta', () => {
    const s = naFinal();
    expect(reduzPensa(s, { tipo: 'votos_final', id: 'j1', votos: { j1: 1 } }, T0)).toBe(s);
  });

  it('o telemóvel vota pela posição (#i), sem saber o autor', () => {
    let s = naFinal();
    const alvo = s.ordemFinal[0];
    const quem = s.participantes.find((id) => id !== alvo)!;
    s = reduzPensa(s, { tipo: 'votos_final', id: quem, votos: { '#0': 3 } }, T0);
    expect(s.votosFinal[quem]).toEqual({ [alvo]: 3 });
    expect(reduzPensa(s, { tipo: 'votos_final', id: alvo, votos: { '#0': 1 } }, T0)).toBe(s);
    let d = responderTodos(novo(4));
    const v = votantes(d)[0];
    d = reduzPensa(d, { tipo: 'votar', id: v, autor: '#1' }, T0);
    expect(d.votos[v]).toBe(d.duelos[d.atual].ordem[1]);
  });

  it('3 votos no máximo, podem ir todos na mesma; +300 cada', () => {
    let s = naFinal();
    expect(reduzPensa(s, { tipo: 'votos_final', id: 'j1', votos: { j2: 4 } }, T0)).toBe(s);
    s = reduzPensa(s, { tipo: 'votos_final', id: 'j1', votos: { j2: 2, j3: 1 } }, T0);
    const antes = s.pontos.j2;
    s = tick(s);
    expect(s.fase).toBe('final_revelar');
    expect(s.pontos.j2 - antes).toBe(600);
  });
});

describe('desligar e voltar', () => {
  it('pausa abaixo de 3 ligados e retoma com o tempo que faltava', () => {
    let s = novo(4);
    s = reduzPensa(s, { tipo: 'ligados', ids: ['j1', 'j2'] }, T0 + 10_000);
    expect(s.pausaRestante).toBe(80_000);
    expect(tick(s)).toBe(s);
    s = reduzPensa(s, { tipo: 'ligados', ids: ids(4) }, T0 + 50_000);
    expect(s.pausaRestante).toBeNull();
    expect(s.terminaEm).toBe(T0 + 130_000);
  });

  it('quem desliga não trava a escrita; ao voltar ainda pode responder', () => {
    let s = reduzPensa(novo(5), { tipo: 'ligados', ids: ['j1', 'j2', 'j3', 'j4'] }, T0);
    s = responderTodos(s, ['j5']);
    expect(s.fase).toBe('votar'); // não ficou à espera do j5
    let t = reduzPensa(novo(5), { tipo: 'ligados', ids: ['j1', 'j2', 'j3', 'j4'] }, T0);
    t = reduzPensa(t, { tipo: 'ligados', ids: ids(5) }, T0);
    const i = t.duelos.findIndex((d) => d.autores.includes('j5'));
    t = reduzPensa(t, { tipo: 'responder', id: 'j5', duelo: i, texto: 'voltei' }, T0);
    expect(t.respostas[i].j5).toBe('voltei');
  });

  it('voto de quem desligou não conta', () => {
    let s = responderTodos(novo(6));
    const [v1, v2] = votantes(s);
    const d = s.duelos[s.atual];
    s = reduzPensa(s, { tipo: 'votar', id: v1, autor: d.ordem[0] }, T0);
    s = reduzPensa(s, { tipo: 'votar', id: v2, autor: d.ordem[1] }, T0);
    s = reduzPensa(s, { tipo: 'ligados', ids: ids(6).filter((x) => x !== v1) }, T0);
    s = tick(s);
    const r = s.resultados[s.resultados.length - 1];
    expect(r.opcoes.find((o) => o.autor === d.ordem[1])).toMatchObject({ arrasou: true, pontos: 1250 });
  });
});
