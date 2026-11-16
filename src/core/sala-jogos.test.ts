import { describe, expect, it } from 'vitest';
import { T_TUTORIAL, novaSala, reduzSala, vistaSala, type EstadoSala } from './sala';

function com(n: number): EstadoSala {
  let s = novaSala('ABCD', 'pt-BR');
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `Nome${i}`, avatar: i, tag: `t${i}` }, i);
  return s;
}

describe('sala com vários jogos', () => {
  it('Pensa-Dores começa com 4+ e usa o conteúdo de conteudo/pensa-dores.json', () => {
    expect(reduzSala(com(3), { tipo: 'comecar', id: 'j1', jogo: 'pensa' }, 100).pensa).toBeNull();
    const s = reduzSala(com(4), { tipo: 'comecar', id: 'j1', jogo: 'pensa' }, 100);
    expect(s.pensa?.duelos).toHaveLength(4);
    expect(s.pensa?.normais.length).toBeGreaterThan(50);
    expect(s.jogo).toBeNull();
    expect(vistaSala(s).pensa?.fase).toBe('escrever');
  });

  it('ações de um jogo não mexem no outro', () => {
    const s = reduzSala(com(4), { tipo: 'comecar', id: 'j1', jogo: 'pensa' }, 100);
    expect(reduzSala(s, { tipo: 'jogo', acao: { tipo: 'enviar', id: 'j1', texto: 'x', a: 'a', b: 'b' } }, 100)).toBe(s);
  });

  it('definições do Pensa-Dores só pelo líder', () => {
    expect(reduzSala(com(4), { tipo: 'definir_pensa', id: 'j2', def: { rondas: 3 } }, 100).defPensa.rondas).toBe(2);
    expect(reduzSala(com(4), { tipo: 'definir_pensa', id: 'j1', def: { rondas: 3 } }, 100).defPensa.rondas).toBe(3);
  });

  it('tutorial: só se pedido, passa para todos e depois o jogo começa', () => {
    let s = reduzSala(com(4), { tipo: 'comecar', id: 'j1', jogo: 'pensa', tutorial: true }, 100);
    expect(s.tutorial).toEqual({ jogo: 'pensa', ate: 100 + T_TUTORIAL });
    expect(s.pensa).toBeNull();
    s = reduzSala(s, { tipo: 'tick' }, 100 + T_TUTORIAL);
    expect(s.tutorial).toBeNull();
    expect(s.pensa).not.toBeNull();
    expect(reduzSala(com(4), { tipo: 'comecar', id: 'j1', jogo: 'pensa' }, 100).tutorial).toBeFalsy();
  });

  it('o líder pode saltar o tutorial', () => {
    let s = reduzSala(com(3), { tipo: 'comecar', id: 'j1', tutorial: true }, 100);
    expect(reduzSala(s, { tipo: 'saltar', id: 'j2' }, 200).tutorial).not.toBeNull();
    s = reduzSala(s, { tipo: 'saltar', id: 'j1' }, 200);
    expect(s.jogo).not.toBeNull();
  });
});
