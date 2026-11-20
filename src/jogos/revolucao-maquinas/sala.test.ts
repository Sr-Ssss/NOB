import { describe, expect, it } from 'vitest';
import { CATALOGO, motivo } from '../../core/jogos';
import { PREFIXO_BOT, novaSala, privadoSala, reduzSala, vistaSala, type EstadoSala } from '../../core/sala';
import type { PrivadoMaquinas } from './regras';

function com(n: number): EstadoSala {
  let s = novaSala('ABCD', 'pt-BR');
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `N${i}`, avatar: i, tag: `t${i}` }, 0);
  return s;
}

describe('Revolução das Máquinas na sala', () => {
  it('5–10 jogadores; a vista não leva papéis nem tags; cada um recebe o seu papel', () => {
    expect(reduzSala(com(4), { tipo: 'comecar', id: 'j1', jogo: 'maquinas' }, 100).maquinas).toBeFalsy();
    expect(reduzSala(com(11), { tipo: 'comecar', id: 'j1', jogo: 'maquinas' }, 100).maquinas).toBeFalsy();
    const s = reduzSala(com(7), { tipo: 'comecar', id: 'j1', jogo: 'maquinas' }, 100);
    expect(s.maquinas?.fase).toBe('carta');
    const txt = JSON.stringify(vistaSala(s));
    expect(txt).not.toMatch(/"(tripulacao|amotinado|ia)"/);
    expect(txt).not.toContain('"t1"');
    for (let i = 1; i <= 7; i++) expect((privadoSala(s, 'j' + i) as PrivadoMaquinas).papel).toBe(s.maquinas!.papeis['j' + i]);
    const j = CATALOGO.find((x) => x.id === 'maquinas')!;
    expect(motivo(j, 5, true)).toBeNull();
    expect(motivo(j, 11)?.tipo).toBe('muitos');
  });

  it('bots: o líder vota por eles; só o líder pode "Seguir"; ações de outros jogos são ignoradas', () => {
    let s = com(1);
    for (const b of ['1', '2', '3', '4']) s = reduzSala(reduzSala(s, { tipo: 'bot_add', id: 'j1', bot: PREFIXO_BOT + b, tag: 'tb' + b }, 0), { tipo: 'bot_ia', id: 'j1', bot: PREFIXO_BOT + b, ia: false }, 0); // IA desligada: o líder joga por eles
    s = reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'maquinas' }, 100);
    s = reduzSala(s, { tipo: 'jogo', acao: { tipo: 'rm_vi', id: 'j1' } }, 150); // bots contam como vistos
    expect(s.maquinas!.fase).toBe('nomear');
    const c = s.maquinas!.comandante;
    const alvo = s.maquinas!.vivos.find((x) => x !== c)!;
    const como = (id: string, acao: Record<string, unknown>) =>
      id === 'j1' ? { tipo: 'jogo' as const, acao: { id: 'j1', ...acao } as never } : { tipo: 'como' as const, id: 'j1', bot: id, acao: { tipo: 'jogo' as const, acao: { id: '', ...acao } as never } };
    s = reduzSala(s, como(c, { tipo: 'rm_piloto', alvo }), 200);
    expect(s.maquinas!.fase).toBe('votar');
    s = reduzSala(s, { tipo: 'jogo', acao: { tipo: 'pr_votar', id: 'j1', alvo: null } }, 200);
    for (const id of s.maquinas!.vivos) s = reduzSala(s, como(id, { tipo: 'rm_votar', sim: true }), 300);
    expect(s.maquinas!.ultimaVotacao?.aprovado).toBe(true);
    // até à discussão
    let n = 0;
    while (s.maquinas!.fase !== 'discussao' && s.maquinas!.fase !== 'fim' && n++ < 20) s = reduzSala(s, { tipo: 'tick' }, s.maquinas!.terminaEm);
    if (s.maquinas!.fase === 'discussao') {
      expect(reduzSala(s, { tipo: 'como', id: 'j1', bot: PREFIXO_BOT + '1', acao: { tipo: 'jogo', acao: { id: '', tipo: 'rm_seguir' } } }, 400).maquinas!.fase).toBe('discussao');
      expect(reduzSala(s, { tipo: 'jogo', acao: { id: 'j1', tipo: 'rm_seguir' } }, 400).maquinas!.fase).toBe('nomear');
    }
  });
});
