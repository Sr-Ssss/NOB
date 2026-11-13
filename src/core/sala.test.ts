import { describe, expect, it } from 'vitest';
import { ID_TV, TEMPO_DESLIGADO, novaSala, reduzSala, vistaSala, type AcaoSala, type EstadoSala } from './sala';

function com(n: number): EstadoSala {
  let s = novaSala('ABCD', 'pt-BR');
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `Nome${i}`, avatar: i, tag: `t${i}` }, i);
  return s;
}

const r = (s: EstadoSala, a: AcaoSala, t = 100) => reduzSala(s, a, t);

describe('sala', () => {
  it('o 1.º a entrar é VIP', () => {
    expect(com(3).vipId).toBe('j1');
  });

  it('nome cortado a 12 e avatar dentro dos 6', () => {
    const s = r(novaSala('ABCD', 'en'), { tipo: 'entrar', id: 'x', nome: 'Nome muito comprido', avatar: 27, tag: 't' });
    expect(s.jogadores[0].nome).toHaveLength(12);
    expect(s.jogadores[0].avatar).toBe(9);
  });

  it('VIP desliga: passa ao seguinte; volta e não recupera', () => {
    let s = com(3);
    s = r(s, { tipo: 'ligados', ids: ['j2', 'j3'] });
    expect(s.vipId).toBe('j2');
    s = r(s, { tipo: 'ligados', ids: ['j1', 'j2', 'j3'] });
    expect(s.vipId).toBe('j2');
  });

  it('só o VIP ou a TV começam, e só com 3 ligados', () => {
    let s = com(2);
    expect(r(s, { tipo: 'comecar', id: ID_TV }).jogo).toBeNull();
    s = com(3);
    expect(r(s, { tipo: 'comecar', id: 'j2' }).jogo).toBeNull();
    expect(r(s, { tipo: 'comecar', id: 'j1' }).jogo?.participantes).toEqual(['j1', 'j2', 'j3']);
    expect(r(s, { tipo: 'comecar', id: ID_TV }).jogo).not.toBeNull();
  });

  it('definições só pelo VIP e antes do jogo', () => {
    let s = com(3);
    s = r(s, { tipo: 'definir', id: 'j3', def: { rondas: 5 } });
    expect(s.def.rondas).toBe(3);
    s = r(s, { tipo: 'definir', id: 'j1', def: { rondas: 5 } });
    expect(s.def.rondas).toBe(5);
    s = r(s, { tipo: 'comecar', id: 'j1' });
    expect(s.jogo?.def.rondas).toBe(5);
  });

  it('quem volta a entrar retoma (mesmo id) sem duplicar', () => {
    let s = r(com(3), { tipo: 'comecar', id: ID_TV });
    s = r(s, { tipo: 'ligados', ids: ['j1', 'j2'] });
    expect(s.jogo?.pausaRestante).not.toBeNull();
    s = r(s, { tipo: 'entrar', id: 'j3', nome: 'Nome3', avatar: 3, tag: 'novo' }, 200);
    expect(s.jogadores).toHaveLength(3);
    expect(s.jogo?.pausaRestante).toBeNull();
  });

  it('quem entra a meio do jogo fica como audiência', () => {
    let s = r(com(3), { tipo: 'comecar', id: ID_TV });
    s = r(s, { tipo: 'entrar', id: 'j9', nome: 'Tarde', avatar: 0, tag: 't9' });
    expect(s.jogo?.audiencia).toEqual(['j9']);
  });

  it('desligado há mais de 5 min sai da lista (fora do jogo)', () => {
    let s = com(4);
    s = r(s, { tipo: 'ligados', ids: ['j1', 'j2', 'j3'] }, 1000);
    s = r(s, { tipo: 'tick' }, 1000 + TEMPO_DESLIGADO - 1);
    expect(s.jogadores).toHaveLength(4);
    s = r(s, { tipo: 'tick' }, 1000 + TEMPO_DESLIGADO);
    expect(s.jogadores).toHaveLength(3);
  });

  it('jogar outra vez não repete frases e menu volta ao lobby', () => {
    let s = r(com(3), { tipo: 'comecar', id: ID_TV });
    s = { ...s, jogo: { ...s.jogo!, fase: 'fim', usadas: ['f1'] } };
    const de_novo = r(s, { tipo: 'outra_vez', id: 'j1' });
    expect(de_novo.jogo?.fase).toBe('escrever');
    expect(de_novo.jogo?.usadas).toEqual(['f1']);
    expect(r(s, { tipo: 'menu', id: 'j1' }).jogo).toBeNull();
  });

  it('o líder passa a liderança a um jogador ligado', () => {
    let s = com(3);
    expect(r(s, { tipo: 'lideranca', id: 'j2', para: 'j3' }).vipId).toBe('j1');
    s = r(s, { tipo: 'lideranca', id: 'j1', para: 'j3' });
    expect(s.vipId).toBe('j3');
  });

  it('nome de alguém ligado recebe um número; nome de um desligado volta a ser essa pessoa', () => {
    let s = com(3);
    s = r(s, { tipo: 'entrar', id: 'novo', nome: 'nome1', avatar: 0, tag: 'x' });
    expect(s.jogadores.at(-1)!.nome).toMatch(/^nome1 \d+$/);
    s = r(com(3), { tipo: 'comecar', id: ID_TV });
    s = r(s, { tipo: 'ligados', ids: ['j1', 'j3'] });
    s = r(s, { tipo: 'entrar', id: 'telemovel2', nome: 'NOME2', avatar: 0, tag: 'y' });
    expect(s.jogadores).toHaveLength(3);
    expect(s.jogadores[1]).toMatchObject({ id: 'j2', nome: 'Nome2', ligado: true });
    s = r(s, { tipo: 'ligados', ids: ['j1', 'j3', 'telemovel2'] });
    expect(s.jogadores[1].ligado).toBe(true);
    expect(vistaSala(s).aliases).toEqual({ telemovel2: 'j2' });
  });

  it('boneco já escolhido na party passa ao primeiro livre; Pronto marca e o menu limpa', () => {
    let s = com(3); // bonecos 1, 2, 3
    s = r(s, { tipo: 'entrar', id: 'j4', nome: 'Dora', avatar: 2, tag: 't4' });
    expect(s.jogadores[3].avatar).toBe(0);
    s = r(s, { tipo: 'pronto', id: 'j2', pronto: true });
    expect(vistaSala(s).jogadores[1].pronto).toBe(true);
    s = r(s, { tipo: 'comecar', id: ID_TV });
    s = { ...s, jogo: { ...s.jogo!, fase: 'fim' } };
    s = r(s, { tipo: 'menu', id: ID_TV });
    expect(s.jogadores.every((j) => !j.pronto)).toBe(true);
  });

  it('a vista pública não leva as tags', () => {
    expect(JSON.stringify(vistaSala(com(3)))).not.toContain('"tag"');
  });
});
