import { describe, expect, it } from 'vitest';
import { CATALOGO, motivo } from '../../core/jogos';
import { PREFIXO_BOT, novaSala, privadoSala, reduzSala, vistaSala, type EstadoSala } from '../../core/sala';
import type { PrivadoRei } from './regras';

function com(n: number): EstadoSala {
  let s = novaSala('ABCD', 'pt-BR');
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `N${i}`, avatar: i, tag: `t${i}` }, 0);
  return s;
}

describe('O Rei e o Dragão na sala', () => {
  it('6–24 jogadores; a vista não leva cartas nem tags; cada um recebe a sua carta', () => {
    expect(reduzSala(com(5), { tipo: 'comecar', id: 'j1', jogo: 'rei' }, 100).rei).toBeFalsy();
    expect(reduzSala(com(25), { tipo: 'comecar', id: 'j1', jogo: 'rei' }, 100).rei).toBeFalsy();
    const s = reduzSala(com(8), { tipo: 'comecar', id: 'j1', jogo: 'rei' }, 100);
    expect(s.rei?.fase).toBe('ir');
    const txt = JSON.stringify(vistaSala(s));
    expect(txt).not.toContain('"papel"');
    expect(txt).not.toContain('"t1"');
    for (let i = 1; i <= 8; i++) expect((privadoSala(s, 'j' + i) as PrivadoRei).carta).toEqual(s.rei!.cartas['j' + i]);
    const j = CATALOGO.find((x) => x.id === 'rei')!;
    expect(motivo(j, 6, true)).toBeNull();
    expect(motivo(j, 25)?.tipo).toBe('muitos');
  });

  it('com bots: o líder carrega Pronto/OK por eles e a partida chega ao fim; ações de outros jogos ignoradas', () => {
    let s = com(1);
    for (const b of ['1', '2', '3', '4', '5']) s = reduzSala(s, { tipo: 'bot_add', id: 'j1', bot: PREFIXO_BOT + b, tag: 'tb' + b }, 0);
    s = reduzSala(s, { tipo: 'definir_rei', id: 'j1', def: { tempo: 120 } }, 0);
    s = reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'rei' }, 100);
    expect(s.rei!.def.tempo).toBe(120);
    const como = (id: string, acao: Record<string, unknown>) =>
      id === 'j1' ? { tipo: 'jogo' as const, acao: { id: 'j1', ...acao } as never } : { tipo: 'como' as const, id: 'j1', bot: id, acao: { tipo: 'jogo' as const, acao: { id: '', ...acao } as never } };
    for (const id of s.rei!.participantes) s = reduzSala(s, como(id, { tipo: 'rd_pronto' }), 200);
    expect(s.rei!.fase).toBe('carta');
    s = reduzSala(s, { tipo: 'jogo', acao: { tipo: 'rm_votar', id: 'j1', sim: true } }, 200);
    for (const id of s.rei!.participantes) s = reduzSala(s, como(id, { tipo: 'rd_ok' }), 300);
    expect(s.rei!.fase).toBe('lider');
    let n = 0;
    while (s.rei!.fase !== 'fim' && n++ < 40) s = reduzSala(s, { tipo: 'tick' }, s.rei!.terminaEm);
    expect(s.rei!.fase).toBe('fim');
    expect(reduzSala(s, { tipo: 'outra_vez', id: 'j1' }, 9e12).rei!.fase).toBe('ir');
    expect(reduzSala(s, { tipo: 'menu', id: 'j1' }, 9e12).rei).toBeNull();
  });
});
