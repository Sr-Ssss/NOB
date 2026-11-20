import { describe, expect, it } from 'vitest';
import { novaSala, reduzSala, vistaSala, type AcaoSala, type EstadoSala } from './sala';

const r = (s: EstadoSala, a: AcaoSala, t = 100) => reduzSala(s, a, t);

function comBots(n: number): EstadoSala {
  let s = r(novaSala('ABCD', 'pt-BR'), { tipo: 'entrar', id: 'eu', nome: 'Eu', avatar: 0, tag: 'te' });
  for (let i = 1; i <= n; i++) s = r(r(s, { tipo: 'bot_add', id: 'eu', bot: `bot-${i}`, tag: `tb${i}` }), { tipo: 'bot_ia', id: 'eu', bot: `bot-${i}`, ia: false });
  return s;
}

describe('bots', () => {
  it('o líder adiciona bots com nome e boneco livres', () => {
    const s = comBots(2);
    expect(s.jogadores.map((j) => j.nome)).toEqual(['Eu', 'Bot 1', 'Bot 2']);
    expect(new Set(s.jogadores.map((j) => j.avatar)).size).toBe(3);
    expect(vistaSala(s).jogadores[1].bot).toBe(true);
    expect(vistaSala(s).jogadores[0].bot).toBeUndefined();
  });

  it('só o líder adiciona e remove; id tem de começar por bot-', () => {
    let s = r(comBots(1), { tipo: 'entrar', id: 'outro', nome: 'Ana', avatar: 5, tag: 'ta' });
    expect(r(s, { tipo: 'bot_add', id: 'outro', bot: 'bot-9', tag: 'x' }).jogadores).toHaveLength(3);
    expect(r(s, { tipo: 'bot_add', id: 'eu', bot: 'outro2', tag: 'x' }).jogadores).toHaveLength(3);
    expect(r(s, { tipo: 'bot_del', id: 'outro', bot: 'bot-1' }).jogadores).toHaveLength(3);
    expect(r(s, { tipo: 'bot_del', id: 'eu', bot: 'outro' }).jogadores).toHaveLength(3);
    s = r(s, { tipo: 'bot_del', id: 'eu', bot: 'bot-1' });
    expect(s.jogadores.map((j) => j.id)).toEqual(['eu', 'outro']);
  });

  it('bots ficam ligados e nunca são líderes', () => {
    let s = comBots(2);
    s = r(s, { tipo: 'ligados', ids: [] });
    expect(s.jogadores.filter((j) => j.ligado).map((j) => j.id)).toEqual(['bot-1', 'bot-2']);
    expect(s.vipId).toBe('eu');
    expect(r(comBots(1), { tipo: 'lideranca', id: 'eu', para: 'bot-1' }).vipId).toBe('eu');
  });

  it('com 2 bots dá para começar; não se adiciona nem remove a meio', () => {
    const s = r(comBots(2), { tipo: 'comecar', id: 'eu' });
    expect(s.jogo?.participantes).toEqual(['eu', 'bot-1', 'bot-2']);
    expect(r(s, { tipo: 'bot_add', id: 'eu', bot: 'bot-x', tag: 'x' }).jogadores).toHaveLength(3);
    expect(r(s, { tipo: 'bot_del', id: 'eu', bot: 'bot-1' }).jogadores).toHaveLength(3);
  });

  it('o líder age como bot; outros não; só em bots', () => {
    let s = r(comBots(3), { tipo: 'entrar', id: 'ana', nome: 'Ana', avatar: 9, tag: 'ta' });
    s = r(s, { tipo: 'como', id: 'eu', bot: 'bot-1', acao: { tipo: 'pronto', id: '', pronto: true } });
    expect(s.jogadores.find((j) => j.id === 'bot-1')?.pronto).toBe(true);
    expect(s.jogadores.find((j) => j.id === 'eu')?.pronto).toBe(false);
    expect(r(s, { tipo: 'como', id: 'ana', bot: 'bot-2', acao: { tipo: 'pronto', id: '', pronto: true } })).toBe(s);
    expect(r(s, { tipo: 'como', id: 'eu', bot: 'ana', acao: { tipo: 'pronto', id: '', pronto: true } })).toBe(s);
    expect(r(s, { tipo: 'como', id: 'eu', bot: 'bot-1', acao: { tipo: 'menu', id: '' } })).toBe(s);
  });

  it('agir como bot = ação de jogo com o id do bot (Pensa-Dores)', () => {
    const s = r(comBots(3), { tipo: 'comecar', id: 'eu', jogo: 'pensa' });
    const d = s.pensa!.duelos.findIndex((x) => x.autores.includes('bot-1'));
    const como = JSON.stringify(r(s, { tipo: 'como', id: 'eu', bot: 'bot-1', acao: { tipo: 'jogo', acao: { tipo: 'responder', id: '', duelo: d, texto: 'olá' } } }).pensa);
    const direto = JSON.stringify(r(s, { tipo: 'jogo', acao: { tipo: 'responder', id: 'bot-1', duelo: d, texto: 'olá' } }).pensa);
    expect(como).toBe(direto);
    expect(como).toContain('olá');
  });
});
