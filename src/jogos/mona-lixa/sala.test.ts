import { describe, expect, it } from 'vitest';
import { CATALOGO, motivo } from '../../core/jogos';
import { PREFIXO_BOT, minhaMarca, novaSala, reduzSala, vistaSala, type EstadoSala } from '../../core/sala';

function com(n: number, semTv = false): EstadoSala {
  let s: EstadoSala = { ...novaSala('ABCD', 'pt-BR'), semTv };
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `N${i}`, avatar: i, tag: `t${i}` }, 0);
  return s;
}
const TR = [{ c: 1, g: 0, p: [1, 2, 3, 4] }];

describe('Mona Lixa na sala', () => {
  it('começa com 3+, com e sem TV, e usa conteudo/mona-lixa.json', () => {
    expect(reduzSala(com(2), { tipo: 'comecar', id: 'j1', jogo: 'mona' }, 100).mona).toBeFalsy();
    const s = reduzSala(com(3, true), { tipo: 'comecar', id: 'j1', jogo: 'mona' }, 100);
    expect(s.mona?.fase).toBe('desenhar');
    expect(s.mona?.conteudo.desenhos.length).toBeGreaterThanOrEqual(300);
    expect(s.mona?.conteudo.falsos.length).toBeGreaterThanOrEqual(150);
    // cada um encontra o seu pela marca (a tag nunca sai)
    const v = vistaSala(s);
    expect(Object.keys(v.mona!.sorteados).sort()).toEqual(['t1', 't2', 't3'].map((t) => minhaMarca(v, t)).sort());
    expect(JSON.stringify(v)).not.toMatch(/"t[1-3]"/);
    const j = CATALOGO.find((x) => x.id === 'mona')!;
    expect(motivo(j, 3, true)).toBeNull();
    expect(motivo(j, 20)).toBeNull();
  });

  it('definições só pelo líder; ações de outros jogos não passam', () => {
    expect(reduzSala(com(3), { tipo: 'definir_mona', id: 'j2', def: { desenhar: 45 } }, 0).defMona?.desenhar).toBe(75);
    let s = reduzSala(com(3), { tipo: 'definir_mona', id: 'j1', def: { desenhar: 45, rondas: 1 } }, 0);
    s = reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'mona' }, 100);
    expect(s.mona?.terminaEm).toBe(100 + 45_000);
    expect(s.mona?.rondas).toBe(1);
    expect(reduzSala(s, { tipo: 'jogo', acao: { tipo: 'responder', id: 'j1', duelo: 0, texto: 'x' } }, 100)).toBe(s);
    const p = reduzSala(com(4), { tipo: 'comecar', id: 'j1', jogo: 'pensa' }, 100);
    expect(reduzSala(p, { tipo: 'jogo', acao: { tipo: 'ml_desenho', id: 'j1', tracos: TR } }, 100)).toBe(p);
  });

  it('o líder joga pelos bots; outra vez e menu no fim', () => {
    let s = com(1);
    for (const b of ['1', '2']) s = reduzSala(reduzSala(s, { tipo: 'bot_add', id: 'j1', bot: PREFIXO_BOT + b, tag: 'tb' + b }, 0), { tipo: 'bot_ia', id: 'j1', bot: PREFIXO_BOT + b, ia: false }, 0); // IA desligada: o líder joga por eles
    s = reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'mona' }, 100);
    expect(s.mona?.participantes).toHaveLength(3);
    for (const id of ['bot-1', 'bot-2']) s = reduzSala(s, { tipo: 'como', id: 'j1', bot: id, acao: { tipo: 'jogo', acao: { tipo: 'ml_desenho', id: '', tracos: TR } } }, 100);
    expect(Object.keys(s.mona!.desenhos).sort()).toEqual(['bot-1', 'bot-2']);
    let agora = 100;
    while (s.mona!.fase !== 'fim') {
      agora = s.mona!.terminaEm;
      s = reduzSala(s, { tipo: 'tick' }, agora);
    }
    expect(reduzSala(s, { tipo: 'outra_vez', id: 'j1' }, agora).mona?.fase).toBe('desenhar');
    expect(reduzSala(s, { tipo: 'menu', id: 'j1' }, agora).mona).toBeNull();
  });
});
