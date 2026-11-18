import { describe, expect, it } from 'vitest';
import {
  calcularPontos,
  autorAtual,
  novoJogo,
  podio,
  premios,
  reduz5050,
  vista5050,
  votantes,
  type Acao5050,
  type Estado5050,
} from './regras';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);

function aplicar(e: Estado5050, acoes: Acao5050[], agora: number): Estado5050 {
  return acoes.reduce((s, a) => reduz5050(s, a, agora), e);
}

function todosEnviam(e: Estado5050, agora: number, quem = e.participantes): Estado5050 {
  return aplicar(
    e,
    quem.map((id) => ({ tipo: 'enviar', id, texto: `Pergunta de ${id}?`, a: 'Sim', b: 'Não' })),
    agora,
  );
}

/** joga um dilema: tick de mostrar → votar, votos dados por `lados` */
function votarDilema(e: Estado5050, agora: number, lado: (id: string, i: number) => 'a' | 'b'): Estado5050 {
  let s = reduz5050(e, { tipo: 'tick' }, e.terminaEm); // mostrar → votar
  expect(s.fase).toBe('votar');
  const autor = autorAtual(s);
  const vs = s.participantes.filter((id) => id !== autor && s.ligados.includes(id));
  // o autor também carrega (vê o mesmo ecrã), mas não conta
  s = aplicar(s, [{ tipo: 'votar', id: autor!, lado: 'a' }, ...vs.map((id, i) => ({ tipo: 'votar' as const, id, lado: lado(id, i) }))], agora);
  return s;
}

describe('pontos', () => {
  it('divisão perfeita dá 1000 + 500', () => {
    expect(calcularPontos(2, 2, false)).toEqual({ pontos: 1500, perfeito: true });
  });
  it('número ímpar de votos: d = 1 conta como perfeito', () => {
    expect(calcularPontos(2, 1, false)).toEqual({ pontos: Math.round(1000 * (1 - 1 / 3)) + 500, perfeito: true });
  });
  it('unanimidade dá 0', () => {
    expect(calcularPontos(4, 0, false).pontos).toBe(0);
  });
  it('0 votos dá 0', () => {
    expect(calcularPontos(0, 0, true)).toEqual({ pontos: 0, perfeito: false });
  });
  it('última ronda vale o dobro', () => {
    expect(calcularPontos(3, 2, true).pontos).toBe(2 * (800 + 500));
  });
});

describe('50/50 com 3 jogadores', () => {
  it('ronda completa: todos enviam, votam e o autor pontua', () => {
    let e = novoJogo(ids(3), { rondas: 2 }, 0);
    e = todosEnviam(e, 1000);
    expect(e.fase).toBe('mostrar');
    expect(e.fila).toHaveLength(3);
    for (let k = 0; k < 3; k++) {
      e = votarDilema(e, e.terminaEm, (_, i) => (i === 0 ? 'a' : 'b')); // 1-1 com 2 votantes
      expect(e.fase).toBe('revelar');
      expect(e.resultados.at(-1)!.pontos).toBe(1500);
      e = reduz5050(e, { tipo: 'tick' }, e.terminaEm);
    }
    expect(e.fase).toBe('placar');
    expect(Object.values(e.pontos)).toEqual([1500, 1500, 1500]);
    e = reduz5050(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.fase).toBe('escrever');
    expect(e.ronda).toBe(2);
  });

  it('o autor carrega como os outros (anónimo), mas o voto dele não conta', () => {
    let e = todosEnviam(novoJogo(ids(3), {}, 0), 0);
    e = reduz5050(e, { tipo: 'tick' }, e.terminaEm);
    const autor = autorAtual(e)!;
    // na vista o autor aparece a votar como os outros
    expect(vista5050(e, () => '').votantes).toContain(autor);
    e = reduz5050(e, { tipo: 'votar', id: autor, lado: 'a' }, e.terminaEm - 1);
    expect(vista5050(e, () => '').votaram).toContain(autor);
    const vs = votantes(e);
    expect(vs).not.toContain(autor);
    e = aplicar(e, vs.map((id) => ({ tipo: 'votar', id, lado: 'b' }) as Acao5050), e.terminaEm - 1);
    expect(e.fase).toBe('revelar');
    expect(e.resultados[0].votosA).toEqual([]);
  });

  it('se o autor não carregar, a votação acaba no tempo', () => {
    let e = todosEnviam(novoJogo(ids(3), {}, 0), 0);
    e = reduz5050(e, { tipo: 'tick' }, e.terminaEm);
    e = aplicar(e, votantes(e).map((id) => ({ tipo: 'votar', id, lado: 'b' }) as Acao5050), e.terminaEm - 1);
    expect(e.fase).toBe('votar');
    expect(reduz5050(e, { tipo: 'tick' }, e.terminaEm).fase).toBe('revelar');
  });

  it('pode mudar o voto enquanto falta alguém (o ecrã não o promete)', () => {
    let e = todosEnviam(novoJogo(ids(3), {}, 0), 0);
    e = reduz5050(e, { tipo: 'tick' }, e.terminaEm);
    const v = e.participantes.find((id) => id !== autorAtual(e))!;
    e = reduz5050(e, { tipo: 'votar', id: v, lado: 'a' }, e.terminaEm - 5000);
    e = reduz5050(e, { tipo: 'votar', id: v, lado: 'b' }, e.terminaEm - 4000);
    expect(e.votos[v]).toBe('b');
  });
});

describe('50/50 com 4 jogadores', () => {
  it('voto ímpar (3 votantes, 2-1) é divisão perfeita', () => {
    let e = todosEnviam(novoJogo(ids(4), {}, 0), 0);
    e = votarDilema(e, e.terminaEm, (_, i) => (i < 2 ? 'a' : 'b'));
    const r = e.resultados[0];
    expect(r.votosA.length + r.votosB.length).toBe(3);
    expect(r.perfeito).toBe(true);
    expect(r.pontos).toBe(Math.round(1000 * (2 / 3)) + 500);
  });

  it('jogo de 2 rondas acaba no fim com pódio e a última ronda a dobrar', () => {
    let e = novoJogo(ids(4), { rondas: 2 }, 0);
    for (let ronda = 1; ronda <= 2; ronda++) {
      e = todosEnviam(e, e.terminaEm - 30000);
      for (let k = 0; k < 4; k++) {
        e = votarDilema(e, e.terminaEm, () => 'a'); // unanimidade
        e = reduz5050(e, { tipo: 'tick' }, e.terminaEm);
      }
      e = reduz5050(e, { tipo: 'tick' }, e.terminaEm);
    }
    expect(e.fase).toBe('fim');
    expect(podio(e).every((p) => p.lugar === 1)).toBe(true); // empate partilha o lugar
    expect(premios(e).unanimidade).toBeDefined();
  });
});

describe('50/50 com 8 jogadores', () => {
  it('7 votantes, 4-3: perfeito', () => {
    let e = todosEnviam(novoJogo(ids(8), {}, 0), 0);
    expect(e.fila).toHaveLength(8);
    e = votarDilema(e, e.terminaEm, (_, i) => (i < 4 ? 'a' : 'b'));
    expect(e.fase).toBe('revelar');
    expect(e.resultados[0].perfeito).toBe(true);
  });

  it('com 10+ jogadores o padrão passa a 2 rondas', () => {
    expect(novoJogo(ids(10), {}, 0).def.rondas).toBe(2);
    expect(novoJogo(ids(8), {}, 0).def.rondas).toBe(3);
  });

  it('a partir do 17.º entra como audiência: vota mas não pontua', () => {
    const e = novoJogo(ids(18), {}, 0);
    expect(e.participantes).toHaveLength(16);
    expect(e.audiencia).toEqual(['j17', 'j18']);
    expect(e.pontos.j17).toBeUndefined();
  });
});

describe('tempo esgotado', () => {
  it('quem não enviou não conta', () => {
    let e = novoJogo(ids(4), {}, 0);
    e = todosEnviam(e, 1000, ['j1', 'j2']);
    expect(e.fase).toBe('escrever');
    e = reduz5050(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.fase).toBe('mostrar');
    expect(e.fila.sort()).toEqual(['j1', 'j2']);
  });

  it('ninguém enviou: salta para o placar', () => {
    let e = novoJogo(ids(3), {}, 0);
    e = reduz5050(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.fase).toBe('placar');
  });

  it('votação a acabar sem votos dá 0 pontos', () => {
    let e = todosEnviam(novoJogo(ids(3), {}, 0), 0);
    e = reduz5050(e, { tipo: 'tick' }, e.terminaEm); // votar
    e = reduz5050(e, { tipo: 'tick' }, e.terminaEm); // tempo esgotado
    expect(e.fase).toBe('revelar');
    expect(e.resultados[0].pontos).toBe(0);
  });

  it('envio nos últimos 5 s marca "último segundo"', () => {
    let e = novoJogo(ids(3), {}, 0);
    e = reduz5050(e, { tipo: 'enviar', id: 'j1', texto: 'x?', a: 'S', b: 'N' }, e.terminaEm - 2000);
    expect(e.enviados.j1.ultimoSegundo).toBe(true);
  });

  it('texto limitado a 150 caracteres e texto vazio ignorado', () => {
    let e = novoJogo(ids(3), {}, 0);
    e = reduz5050(e, { tipo: 'enviar', id: 'j1', texto: 'a'.repeat(300), a: 'S', b: 'N' }, 1);
    e = reduz5050(e, { tipo: 'enviar', id: 'j2', texto: '   ', a: 'S', b: 'N' }, 1);
    expect(e.enviados.j1.texto).toHaveLength(150);
    expect(e.enviados.j2).toBeUndefined();
  });
});

describe('desligar', () => {
  it('votante que desliga não conta para n', () => {
    let e = todosEnviam(novoJogo(ids(5), {}, 0), 0);
    e = reduz5050(e, { tipo: 'tick' }, e.terminaEm); // votar
    const autor = autorAtual(e)!;
    const vs = e.participantes.filter((id) => id !== autor);
    e = reduz5050(e, { tipo: 'votar', id: vs[0], lado: 'a' }, e.terminaEm - 1000);
    e = reduz5050(e, { tipo: 'ligados', ids: e.participantes.filter((id) => id !== vs[0]) }, e.terminaEm - 900);
    e = aplicar(e, [autor, ...vs.slice(1)].map((id, i) => ({ tipo: 'votar', id, lado: i > 0 && i < 3 ? 'a' : 'b' }) as Acao5050), e.terminaEm - 500);
    expect(e.fase).toBe('revelar');
    const r = e.resultados[0];
    expect(r.votosA.length + r.votosB.length).toBe(3);
    expect(r.votosA).not.toContain(vs[0]);
  });

  it('escrever acaba quando todos os ligados enviaram', () => {
    let e = novoJogo(ids(4), {}, 0);
    e = reduz5050(e, { tipo: 'ligados', ids: ['j1', 'j2', 'j3'] }, 10);
    e = todosEnviam(e, 20, ['j1', 'j2', 'j3']);
    expect(e.fase).toBe('mostrar');
  });

  it('menos de 3 ligados pausa e retoma com o tempo que faltava', () => {
    let e = novoJogo(ids(3), { escrever: 60 }, 0);
    e = reduz5050(e, { tipo: 'ligados', ids: ['j1', 'j2'] }, 20000);
    expect(e.pausaRestante).toBe(40000);
    e = reduz5050(e, { tipo: 'tick' }, 999999);
    expect(e.fase).toBe('escrever');
    e = reduz5050(e, { tipo: 'enviar', id: 'j1', texto: 'x', a: 's', b: 'n' }, 999999);
    expect(e.enviados.j1).toBeUndefined();
    e = reduz5050(e, { tipo: 'ligados', ids: ['j1', 'j2', 'j3'] }, 1000000);
    expect(e.pausaRestante).toBeNull();
    expect(e.terminaEm).toBe(1040000);
  });
});

describe('vista pública', () => {
  it('esconde o autor até à revelação, mas mostra a tag secreta', () => {
    let e = todosEnviam(novoJogo(ids(3), {}, 0), 0);
    const v = vista5050(e, (id) => `tag-${id}`);
    expect(v.dilema?.autorTag).toBe(`tag-${autorAtual(e)}`);
    expect(JSON.stringify(v.dilema)).not.toContain(`"${autorAtual(e)}"`);
    e = reduz5050(e, { tipo: 'tick' }, e.terminaEm);
    e = reduz5050(e, { tipo: 'tick' }, e.terminaEm);
    expect(vista5050(e, () => undefined).resultado?.autor).toBe(autorAtual(e));
  });

  it('com "Mostrar quem votou = Não" só manda contagens', () => {
    let e = todosEnviam(novoJogo(ids(4), { mostrarVotos: false }, 0), 0);
    e = votarDilema(e, e.terminaEm, (_, i) => (i < 2 ? 'a' : 'b'));
    const r = vista5050(e, () => undefined).resultado!;
    expect(r.votosA.length + r.votosB.length).toBe(3);
    expect([...r.votosA, ...r.votosB].every((x) => x === '')).toBe(true);
    expect(e.resultados[0].votosA.every((x) => x !== '')).toBe(true);
  });
});
