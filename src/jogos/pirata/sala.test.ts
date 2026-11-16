import { describe, expect, it } from 'vitest';
import { CATALOGO, motivo } from '../../core/jogos';
import { EmissorPrivado, topicoPrivado } from '../../core/privado';
import type { Canal } from '../../core/canal';
import { PREFIXO_BOT, novaSala, privadoSala, reduzSala, vistaSala, type EstadoSala } from '../../core/sala';
import type { PrivadoPirata } from './regras';

function com(n: number, semTv = false): EstadoSala {
  let s: EstadoSala = { ...novaSala('ABCD', 'pt-BR'), semTv };
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `N${i}`, avatar: i, tag: `t${i}` }, 0);
  return s;
}

/** canal falso: guarda o que foi enviado por tópico */
function canaisFalsos() {
  const enviados: Record<string, unknown[]> = {};
  const fechados: string[] = [];
  const pedir: Record<string, () => void> = {};
  const abrir = (topico: string): Canal => ({
    enviar: (ev, d) => ev === 'privado' && (enviados[topico] = [...(enviados[topico] ?? []), (d as { dados: unknown }).dados]),
    ouvir: (ev, cb) => ev === 'pedir' && (pedir[topico] = () => cb({})),
    aoMudarPresenca: () => {},
    aoLigar: () => {},
    sair: () => fechados.push(topico),
  });
  return { enviados, fechados, pedir, abrir };
}

describe('Pirata na sala + canal privado', () => {
  it('5–16 jogadores, com e sem TV; a vista da sala não leva papéis nem tags', () => {
    expect(reduzSala(com(4), { tipo: 'comecar', id: 'j1', jogo: 'pirata' }, 100).pirata).toBeFalsy();
    expect(reduzSala(com(17), { tipo: 'comecar', id: 'j1', jogo: 'pirata' }, 100).pirata).toBeFalsy();
    const s = reduzSala(com(5, true), { tipo: 'comecar', id: 'j1', jogo: 'pirata' }, 100);
    expect(s.pirata?.fase).toBe('carta');
    const txt = JSON.stringify(vistaSala(s));
    expect(txt).not.toMatch(/:"(pirata|vigia|medico|artilheiro|marinheiro)"/);
    expect(txt).not.toContain('"t1"');
    const j = CATALOGO.find((x) => x.id === 'pirata')!;
    expect(motivo(j, 5, true)).toBeNull();
    expect(motivo(j, 17)?.tipo).toBe('muitos');
  });

  it('cada telemóvel só recebe o seu papel, pelo seu canal (p:<código>:<tag>)', () => {
    const s = reduzSala(com(6), { tipo: 'comecar', id: 'j1', jogo: 'pirata' }, 100);
    const f = canaisFalsos();
    const em = new EmissorPrivado('ABCD', f.abrir);
    em.sincronizar(s.jogadores, (id) => privadoSala(s, id));
    expect(Object.keys(f.enviados).sort()).toEqual(['t1', 't2', 't3', 't4', 't5', 't6'].map((t) => topicoPrivado('ABCD', t)).sort());
    for (let i = 1; i <= 6; i++) {
      const msgs = f.enviados[topicoPrivado('ABCD', 't' + i)] as PrivadoPirata[];
      expect(msgs.length).toBe(1);
      expect(msgs[0].papel).toBe(s.pirata!.papeis['j' + i]);
    }
    // sem mudanças não reenvia; "pedir" reenvia só nesse canal
    em.sincronizar(s.jogadores, (id) => privadoSala(s, id));
    expect(f.enviados[topicoPrivado('ABCD', 't1')].length).toBe(1);
    f.pedir[topicoPrivado('ABCD', 't2')]();
    expect(f.enviados[topicoPrivado('ABCD', 't2')].length).toBe(2);
    expect(f.enviados[topicoPrivado('ABCD', 't1')].length).toBe(1);
    // fim do jogo → menu: fecha os canais
    const menu = { ...s, pirata: null };
    em.sincronizar(menu.jogadores, (id) => privadoSala(menu, id));
    expect(f.fechados.length).toBe(6);
  });

  it('quem volta com outra tag recebe o papel no canal novo', () => {
    let s = reduzSala(com(5), { tipo: 'comecar', id: 'j1', jogo: 'pirata' }, 100);
    const papel = s.pirata!.papeis.j3;
    s = reduzSala(s, { tipo: 'ligados', ids: ['j1', 'j2', 'j4', 'j5'] }, 200);
    s = reduzSala(s, { tipo: 'entrar', id: 'j3', nome: 'N3', avatar: 3, tag: 'nova' }, 300);
    const f = canaisFalsos();
    new EmissorPrivado('ABCD', f.abrir).sincronizar(s.jogadores, (id) => privadoSala(s, id));
    expect((f.enviados[topicoPrivado('ABCD', 'nova')] as PrivadoPirata[])[0].papel).toBe(papel);
    expect(f.enviados[topicoPrivado('ABCD', 't3')]).toBeUndefined();
  });

  it('bots: o líder age por eles e recebe o papel deles; só o líder encurta a discussão', () => {
    let s = com(1);
    for (const b of ['1', '2', '3', '4']) s = reduzSala(s, { tipo: 'bot_add', id: 'j1', bot: PREFIXO_BOT + b, tag: 'tb' + b }, 0);
    s = reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'pirata' }, 100);
    expect((privadoSala(s, 'bot-1') as PrivadoPirata).papel).toBe(s.pirata!.papeis['bot-1']);
    s = reduzSala(s, { tipo: 'tick' }, s.pirata!.terminaEm);
    expect(s.pirata!.fase).toBe('noite');
    s = reduzSala(s, { tipo: 'como', id: 'j1', bot: 'bot-1', acao: { tipo: 'jogo', acao: { tipo: 'pr_noite', id: '', alvo: 'bot-2' } } }, 100);
    expect(s.pirata!.escolhas['bot-1']).toBe('bot-2');
    s = reduzSala(s, { tipo: 'tick' }, s.pirata!.terminaEm);
    s = reduzSala(s, { tipo: 'tick' }, s.pirata!.terminaEm);
    if (s.pirata!.fase === 'discussao') {
      expect(reduzSala(s, { tipo: 'como', id: 'j1', bot: 'bot-1', acao: { tipo: 'jogo', acao: { tipo: 'pr_votar_ja', id: '' } } }, 100)).toBe(s);
      expect(reduzSala(s, { tipo: 'jogo', acao: { tipo: 'pr_votar_ja', id: 'j1' } }, 100).pirata!.fase).toBe('votar');
    }
    // ações de outros jogos não passam
    expect(reduzSala(s, { tipo: 'jogo', acao: { tipo: 'im_problema', id: 'j1', texto: 'x' } }, 100)).toBe(s);
  });

  it('definições só pelo líder; outra vez e menu no fim', () => {
    let s = reduzSala(com(5), { tipo: 'definir_pirata', id: 'j2', def: { discussao: 60 } }, 0);
    expect(s.defPirata?.discussao).toBe(180);
    s = reduzSala(s, { tipo: 'definir_pirata', id: 'j1', def: { discussao: 60, revelar: true } }, 0);
    s = reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'pirata' }, 100);
    expect(s.pirata!.def).toMatchObject({ discussao: 60, revelar: true });
    s = { ...s, pirata: { ...s.pirata!, fase: 'fim' } };
    const outra = reduzSala(s, { tipo: 'outra_vez', id: 'j1' }, 500);
    expect(outra.pirata?.fase).toBe('carta');
    expect(reduzSala(s, { tipo: 'menu', id: 'j1' }, 500).pirata).toBeNull();
  });
});
