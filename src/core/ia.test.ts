import { describe, expect, it } from 'vitest';
import { LISTA, jogoEmCurso } from './registo';
import { novaSala, reduzSala, vistaSala, type AcaoSala, type EstadoSala } from './sala';

/** Fase 8 do feedback (20/11): "IA jogável" dos bots */
const r = (s: EstadoSala, a: AcaoSala, t = 100) => reduzSala(s, a, t);

function sala(bots: number): EstadoSala {
  let s = r(novaSala('ABCD', 'pt-BR'), { tipo: 'entrar', id: 'eu', nome: 'Eu', avatar: 0, tag: 'te' });
  for (let i = 1; i <= bots; i++) s = r(s, { tipo: 'bot_add', id: 'eu', bot: `bot-${i}`, tag: `tb${i}` });
  return s;
}

describe('IA dos bots', () => {
  it('ligada por defeito; só o líder a muda; vai na vista', () => {
    let s = r(sala(1), { tipo: 'entrar', id: 'ana', nome: 'Ana', avatar: 5, tag: 'ta' });
    expect(s.jogadores.find((j) => j.id === 'bot-1')?.ia).toBe(true);
    expect(r(s, { tipo: 'bot_ia', id: 'ana', bot: 'bot-1', ia: false })).toBe(s);
    expect(r(s, { tipo: 'bot_ia', id: 'eu', bot: 'ana', ia: false })).toBe(s);
    s = r(s, { tipo: 'bot_ia', id: 'eu', bot: 'bot-1', ia: false });
    expect(vistaSala(s).jogadores.find((j) => j.id === 'bot-1')?.ia).toBe(false);
    expect(vistaSala(s).jogadores.find((j) => j.id === 'ana')?.ia).toBeUndefined();
  });

  it('com a IA ligada, o líder já não joga como esse bot', () => {
    let s = sala(2);
    s = r(s, { tipo: 'bot_ia', id: 'eu', bot: 'bot-2', ia: false });
    const pronto = (bot: string) => r(s, { tipo: 'como', id: 'eu', bot, acao: { tipo: 'pronto', id: '', pronto: true } });
    expect(pronto('bot-1')).toBe(s);
    expect(pronto('bot-2').jogadores.find((j) => j.id === 'bot-2')?.pronto).toBe(true);
  });

  it('50/50: os bots escrevem e votam sozinhos (com a IA desligada, não)', () => {
    const correr = (ia: boolean) => {
      let s = sala(3);
      if (!ia) for (const b of ['bot-1', 'bot-2', 'bot-3']) s = r(s, { tipo: 'bot_ia', id: 'eu', bot: b, ia: false });
      s = r(s, { tipo: 'comecar', id: 'eu' }, 1000);
      for (let t = 1000; t < 21_000; t += 250) s = r(s, { tipo: 'tick' }, t);
      return s;
    };
    expect(Object.keys(correr(true).jogo!.enviados).sort()).toEqual(['bot-1', 'bot-2', 'bot-3']);
    expect(Object.keys(correr(false).jogo!.enviados)).toEqual([]);
  });

  // cada jogo, com o líder parado e bots com IA: os bots fazem jogadas e nada rebenta
  for (const j of LISTA) {
    it(`${j.id}: os bots jogam sozinhos`, () => {
      const n = Math.max(j.min, 4) - 1;
      let s = r(sala(n), { tipo: 'comecar', id: 'eu', jogo: j.id }, 1000);
      expect(jogoEmCurso(s)?.j.id).toBe(j.id);
      if (j.id === 'wifi') s = r(s, { tipo: 'jogo', acao: { tipo: 'fechar_equipas', id: 'eu' } }, 1000);
      // o que só o líder (humano) faz: fechar equipas, avançar, ver a identidade, desenhar (os bots não desenham)
      if (j.id === 'rei') for (let k = 0; k < 2; k++) s = r(s, { tipo: 'jogo', acao: { tipo: 'rd_avancar', id: 'eu' } }, 1000);
      if (j.id === 'maquinas') s = r(s, { tipo: 'jogo', acao: { tipo: 'rm_vi', id: 'eu' } }, 1000);
      if (j.id === 'mona') s = r(s, { tipo: 'jogo', acao: { tipo: 'ml_desenho', id: 'eu', tracos: [{ c: 0, g: 0, p: [1, 1, 5, 5] }] } }, 1000);
      const fases = new Set<string>();
      for (let t = 1000; t < 240_000; t += 250) {
        s = r(s, { tipo: 'tick' }, t);
        const g = jogoEmCurso(s)?.g;
        if (!g) break;
        fases.add(g.fase);
      }
      expect(Object.keys(s.iaBots ?? {}).length).toBeGreaterThan(0);
      expect(fases.size).toBeGreaterThan(1);
    });
  }
});
