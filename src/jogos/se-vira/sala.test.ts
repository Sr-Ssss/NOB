import { describe, expect, it } from 'vitest';
import { CATALOGO, motivo } from '../../core/jogos';
import { novaSala, reduzSala, vistaSala, type EstadoSala } from '../../core/sala';

function com(n: number, semTv = false): EstadoSala {
  let s: EstadoSala = { ...novaSala('ABCD', 'pt-BR'), semTv };
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `N${i}`, avatar: i, tag: `t${i}` }, 0);
  return s;
}

describe('Se Vira! na sala', () => {
  it('começa com 3+ e usa conteudo/se-vira.json; só com TV', () => {
    expect(reduzSala(com(2), { tipo: 'comecar', id: 'j1', jogo: 'sevira' }, 100).sevira).toBeFalsy();
    expect(reduzSala(com(3, true), { tipo: 'comecar', id: 'j1', jogo: 'sevira' }, 100).sevira).toBeFalsy();
    const s = reduzSala(com(3), { tipo: 'comecar', id: 'j1', jogo: 'sevira' }, 100);
    expect(s.sevira?.fase).toBe('preparar');
    expect(s.sevira?.conteudo.titulos.length).toBeGreaterThanOrEqual(100);
    expect(Object.keys(vistaSala(s).sevira!.temas).sort()).toEqual(['t1', 't2', 't3']);
    const j = CATALOGO.find((x) => x.id === 'sevira')!;
    expect(motivo(j, 3)).toBeNull();
    expect(motivo(j, 3, true)).toEqual({ tipo: 'tv' });
  });

  it('definições só pelo líder; ações do Se Vira! não partem os outros jogos', () => {
    expect(reduzSala(com(3), { tipo: 'definir_sevira', id: 'j2', def: { tempo: 60 } }, 0).defSevira?.tempo).toBe(90);
    expect(reduzSala(com(3), { tipo: 'definir_sevira', id: 'j1', def: { tempo: 60 } }, 0).defSevira?.tempo).toBe(60);
    const w = reduzSala(com(4), { tipo: 'comecar', id: 'j1', jogo: 'wifi' }, 100);
    expect(reduzSala(w, { tipo: 'jogo', acao: { tipo: 'sv_enviar', id: 'j1', titulo: 'x' } }, 100)).toBe(w);
    const s = reduzSala(com(3), { tipo: 'comecar', id: 'j1', jogo: 'sevira' }, 100);
    expect(reduzSala(s, { tipo: 'jogo', acao: { tipo: 'responder', id: 'j1', duelo: 0, texto: 'x' } }, 100)).toBe(s);
  });

  it('quem entra a meio fica na audiência; "menu" no fim limpa; "outra vez" recomeça', () => {
    let s = reduzSala(com(3), { tipo: 'comecar', id: 'j1', jogo: 'sevira' }, 100);
    s = reduzSala(s, { tipo: 'entrar', id: 'j9', nome: 'Novo', avatar: 9, tag: 't9' }, 100);
    expect(s.sevira?.audiencia).toEqual(['j9']);
    expect(reduzSala(s, { tipo: 'menu', id: 'j1' }, 100).sevira).toBe(s.sevira);
    let agora = 100;
    while (s.sevira!.fase !== 'fim') {
      agora = s.sevira!.terminaEm;
      s = reduzSala(s, { tipo: 'tick' }, agora);
    }
    const nova = reduzSala(s, { tipo: 'outra_vez', id: 'j1' }, agora);
    expect(nova.sevira?.fase).toBe('preparar');
    expect(reduzSala(s, { tipo: 'menu', id: 'j1' }, agora).sevira).toBeNull();
  });
});
