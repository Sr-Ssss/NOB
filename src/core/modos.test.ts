import { describe, expect, it } from 'vitest';
import { T_ROLETA, pontosPorLugar, registarJogo, type Torneio } from './modos';
import { T_CARREGAR, jogoAtivo, novaSala, reduzSala, type AcaoSala, type EstadoSala } from './sala';
import { jogoEmCurso } from './registo';

const r = (s: EstadoSala, a: AcaoSala, t = 100) => reduzSala(s, a, t);

/** líder + 3 bots (IA desligada), com TV */
function sala(): EstadoSala {
  let s = r(novaSala('ABCD', 'pt-BR'), { tipo: 'entrar', id: 'eu', nome: 'Eu', avatar: 0, tag: 'te' });
  for (let i = 1; i <= 3; i++) s = r(r(s, { tipo: 'bot_add', id: 'eu', bot: `bot-${i}`, tag: `tb${i}` }), { tipo: 'bot_ia', id: 'eu', bot: `bot-${i}`, ia: false });
  return r(s, { tipo: 'pronto', id: 'eu', pronto: true });
}

/** roleta → barra de 5 s → jogo */
function ateAoJogo(s: EstadoSala, t: number): { s: EstadoSala; t: number } {
  t += T_ROLETA;
  s = r(s, { tipo: 'tick' }, t);
  t += T_CARREGAR;
  s = r(s, { tipo: 'tick' }, t);
  return { s, t };
}

/** acaba o jogo em curso com estes pontos (o fim de cada jogo é testado nas suas regras) */
function acabar(s: EstadoSala, pontos: Record<string, number>): EstadoSala {
  const a = jogoEmCurso(s)!;
  return { ...s, [a.j.chave]: { ...a.g, fase: 'fim', pontos } };
}

describe('modos', () => {
  it('pontos por lugar: 1.º = nº de jogadores; empates partilham', () => {
    expect(pontosPorLugar(['a', 'b', 'c', 'd'], { a: 10, b: 50, c: 10, d: 0 })).toEqual({ b: 4, a: 3, c: 3, d: 1 });
    const t: Torneio = { total: 2, jogos: ['x', 'y'], feitos: [], placar: { a: 0 }, ultimo: {}, fase: 'jogo' };
    const t1 = registarJogo(t, 'x', { a: 2, b: 1 });
    expect(t1).toMatchObject({ fase: 'placar', placar: { a: 2, b: 1 }, feitos: ['x'] });
    expect(registarJogo(t1, 'y', { a: 1, b: 2 })).toMatchObject({ fase: 'fim', placar: { a: 3, b: 3 } });
  });

  it('aleatório: só o líder, só dos jogos marcados que dão; a roleta acaba no jogo', () => {
    const s0 = sala();
    expect(r(s0, { tipo: 'aleatorio', id: 'bot-1', jogos: ['pensa'] }).roleta).toBeFalsy();
    // o Ragerob não dá a 4? dá (2–8); um id desconhecido nunca sai
    const s = r(s0, { tipo: 'aleatorio', id: 'eu', jogos: ['pensa', 'nada'] });
    expect(s.roleta).toMatchObject({ jogo: 'pensa', opcoes: ['pensa'] });
    const { s: s2 } = ateAoJogo(s, 100);
    expect(s2.roleta).toBeNull();
    expect(jogoEmCurso(s2)?.j.id).toBe('pensa');
  });

  it('torneio de 3: placar entre jogos, sem repetir, pódio no fim; Menu acaba o torneio', () => {
    let s = r(sala(), { tipo: 'torneio', id: 'eu', jogos: ['5050', 'pensa', 'mona', 'ideias'], n: 3 });
    expect(s.torneio).toMatchObject({ total: 3, fase: 'jogo' });
    // outros jogos não começam por fora a meio do torneio
    expect(r(s, { tipo: 'jogar', id: 'eu', jogo: '5050' })).toBe(s);
    let t = 100;
    const vistos: string[] = [];
    for (let i = 0; i < 3; i++) {
      ({ s, t } = ateAoJogo(s, t));
      const id = jogoEmCurso(s)!.j.id;
      vistos.push(id);
      s = acabar(s, { eu: 9, 'bot-1': 5, 'bot-2': 5, 'bot-3': 0 });
      s = r(s, { tipo: 'outra_vez', id: 'eu' }, t);
      expect(jogoAtivo(s)).toBeNull();
      if (i < 2) {
        expect(s.torneio?.fase).toBe('placar');
        s = r(s, { tipo: 'torneio_prox', id: 'eu' }, t);
        expect(s.roleta).toBeTruthy();
      }
    }
    expect(new Set(vistos).size).toBe(3);
    expect(s.torneio).toMatchObject({ fase: 'fim', placar: { eu: 12, 'bot-1': 9, 'bot-2': 9, 'bot-3': 3 } });
    s = r(s, { tipo: 'menu', id: 'eu' }, t);
    expect(s.torneio).toBeNull();
  });

  it('torneio: se nenhum jogo que falta dá, acaba com o pódio', () => {
    let s = r(sala(), { tipo: 'torneio', id: 'eu', jogos: ['pensa', 'ragerob'], n: 3 });
    expect(s.torneio?.total).toBe(2);
    let t = 100;
    ({ s, t } = ateAoJogo(s, t));
    const feito = jogoEmCurso(s)!.j.id;
    s = r(acabar(s, {}), { tipo: 'outra_vez', id: 'eu' }, t);
    // sai um bot: o Pensa-Dores (mín. 4) deixa de dar; se faltava ele, acaba
    s = r(s, { tipo: 'bot_del', id: 'eu', bot: 'bot-3' }, t);
    s = r(s, { tipo: 'torneio_prox', id: 'eu' }, t);
    if (feito === 'ragerob') expect(s.torneio?.fase).toBe('fim');
    else expect(s.roleta?.jogo).toBe('ragerob');
  });
});
