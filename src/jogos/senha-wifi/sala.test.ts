import { describe, expect, it } from 'vitest';
import { novaSala, privadoSala, reduzSala, vistaSala, type EstadoSala } from '../../core/sala';

function com(n: number): EstadoSala {
  let s = novaSala('ABCD', 'pt-BR');
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `N${i}`, avatar: i, tag: `t${i}` }, 0);
  return s;
}

describe('Senha do Wi-Fi na sala', () => {
  it('começa com 4+ e usa conteudo/senha-do-wifi.json', () => {
    expect(reduzSala(com(3), { tipo: 'comecar', id: 'j1', jogo: 'wifi' }, 100).wifi).toBeFalsy();
    const s = reduzSala(com(4), { tipo: 'comecar', id: 'j1', jogo: 'wifi' }, 100);
    expect(s.wifi?.fase).toBe('palavras');
    expect(s.wifi?.pool.length).toBeGreaterThanOrEqual(200);
    const v = vistaSala(s);
    expect(JSON.stringify(v)).not.toMatch(/"palavras":|"t[1-4]"/);
    for (const id of ['j1', 'j2', 'j3', 'j4']) expect((privadoSala(s, id) as { palavras: unknown[] }).palavras.length).toBe(4);
  });

  it('equipas à mão: só o líder move; "menu" no fim limpa o jogo', () => {
    let s = reduzSala(com(4), { tipo: 'definir_wifi', id: 'j1', def: { equipas: 'mao' } }, 0);
    s = reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'wifi' }, 100);
    expect(s.wifi?.fase).toBe('equipas');
    const antes = s.wifi!.equipas;
    expect(reduzSala(s, { tipo: 'jogo', acao: { tipo: 'mover', id: 'j2', jogador: 'j3', lado: 'b' } }, 100).wifi!.equipas).toEqual(antes);
    expect(reduzSala(s, { tipo: 'jogo', acao: { tipo: 'mover', id: 'j1', jogador: 'j2', lado: 'b' } }, 100).wifi!.equipas.b).toContain('j2');
    expect(reduzSala(s, { tipo: 'menu', id: 'j1' }, 100).wifi).toBe(s.wifi); // a meio não sai
  });

  it('ações do Wi-Fi não partem os outros jogos', () => {
    const s = reduzSala(com(4), { tipo: 'comecar', id: 'j1', jogo: 'pensa' }, 100);
    expect(reduzSala(s, { tipo: 'jogo', acao: { tipo: 'confirmar', id: 'j1' } }, 100)).toBe(s);
  });
});
