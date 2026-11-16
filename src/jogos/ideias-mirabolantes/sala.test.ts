import { describe, expect, it } from 'vitest';
import { CATALOGO, motivo } from '../../core/jogos';
import { PREFIXO_BOT, novaSala, reduzSala, vistaSala, type EstadoSala } from '../../core/sala';

function com(n: number, semTv = false): EstadoSala {
  let s: EstadoSala = { ...novaSala('ABCD', 'pt-BR'), semTv };
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `N${i}`, avatar: i, tag: `t${i}` }, 0);
  return s;
}
const TR = [{ c: 1, g: 0, p: [1, 2, 3, 4] }];

describe('Ideias Mirabolantes na sala', () => {
  it('começa com 3+, com e sem TV, e usa conteudo/ideias-mirabolantes.json', () => {
    expect(reduzSala(com(2), { tipo: 'comecar', id: 'j1', jogo: 'ideias' }, 100).ideias).toBeFalsy();
    const s = reduzSala(com(3, true), { tipo: 'comecar', id: 'j1', jogo: 'ideias' }, 100);
    expect(s.ideias?.fase).toBe('problema');
    expect(s.ideias?.conteudo.length).toBeGreaterThanOrEqual(200);
    expect(Object.keys(vistaSala(s).ideias!.sorteados).sort()).toEqual(['t1', 't2', 't3']);
    const j = CATALOGO.find((x) => x.id === 'ideias')!;
    expect(motivo(j, 3, true)).toBeNull();
    expect(motivo(j, 20)).toBeNull();
  });

  it('definições só pelo líder; ações de outros jogos não passam', () => {
    expect(reduzSala(com(3), { tipo: 'definir_ideias', id: 'j2', def: { inventar: 90 } }, 0).defIdeias?.inventar).toBe(120);
    let s = reduzSala(com(3), { tipo: 'definir_ideias', id: 'j1', def: { inventar: 90 } }, 0);
    s = reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'ideias' }, 100);
    expect(s.ideias?.def.inventar).toBe(90);
    expect(reduzSala(s, { tipo: 'jogo', acao: { tipo: 'ml_desenho', id: 'j1', tracos: TR } }, 100)).toBe(s);
    const m = reduzSala(com(3), { tipo: 'comecar', id: 'j1', jogo: 'mona' }, 100);
    expect(reduzSala(m, { tipo: 'jogo', acao: { tipo: 'im_problema', id: 'j1', texto: 'x' } }, 100)).toBe(m);
  });

  it('o líder joga pelos bots; partida inteira; outra vez e menu no fim', () => {
    let s = com(1);
    for (const b of ['1', '2']) s = reduzSala(s, { tipo: 'bot_add', id: 'j1', bot: PREFIXO_BOT + b, tag: 'tb' + b }, 0);
    s = reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'ideias' }, 100);
    const como = (bot: string, acao: object) => (s = reduzSala(s, { tipo: 'como', id: 'j1', bot, acao: { tipo: 'jogo', acao: { id: '', ...acao } as never } }, 100));
    for (const id of ['j1', 'bot-1', 'bot-2']) {
      if (id === 'j1') s = reduzSala(s, { tipo: 'jogo', acao: { tipo: 'im_problema', id: 'j1', texto: '' } }, 100);
      else como(id, { tipo: 'im_problema', texto: '' });
    }
    expect(s.ideias!.fase).toBe('inventar');
    for (const id of ['bot-1', 'bot-2']) como(id, { tipo: 'im_invencao', tracos: TR, nome: 'N', slogan: '' });
    expect(Object.keys(s.ideias!.invencoes).sort()).toEqual(['bot-1', 'bot-2']);
    let agora: number;
    s = reduzSala(s, { tipo: 'tick' }, s.ideias!.terminaEm);
    expect(s.ideias!.fase).toBe('pitch');
    while (s.ideias!.fase === 'pitch') s = reduzSala(s, { tipo: 'tick' }, s.ideias!.terminaEm);
    expect(s.ideias!.fase).toBe('investir');
    como('bot-1', { tipo: 'im_investir', notas: { 'bot-2': 3 }, confirmar: true });
    agora = s.ideias!.terminaEm;
    while (s.ideias!.fase !== 'fim') s =reduzSala(s, { tipo: 'tick' }, (agora = s.ideias!.terminaEm));
    expect(s.ideias!.pontos['bot-2']).toBe(3000 + 1000);
    expect(reduzSala(s, { tipo: 'outra_vez', id: 'j1' }, agora).ideias?.fase).toBe('problema');
    expect(reduzSala(s, { tipo: 'menu', id: 'j1' }, agora).ideias).toBeNull();
  });
});
