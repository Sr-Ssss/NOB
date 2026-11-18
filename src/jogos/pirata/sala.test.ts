import { describe, expect, it } from 'vitest';
import { CATALOGO, motivo } from '../../core/jogos';
import { privadosPorAparelho } from '../../core/privado';
import { ProtocoloCliente, ProtocoloHost } from '../../core/protocolo';
import { novasChavesDispositivo, novasChavesHost } from '../../core/cripto';
import { PREFIXO_BOT, novaSala, privadoSala, reduzSala, vistaSala, type EstadoSala } from '../../core/sala';
import type { PrivadoPirata } from './regras';

function com(n: number, semTv = false): EstadoSala {
  let s: EstadoSala = { ...novaSala('ABCD', 'pt-BR'), semTv };
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `N${i}`, avatar: i, tag: `t${i}` }, 0);
  return s;
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

  it('cada aparelho só recebe o seu papel, cifrado só para ele', () => {
    const s = reduzSala(com(6), { tipo: 'comecar', id: 'j1', jogo: 'pirata' }, 100);
    const host = new ProtocoloHost('ABCD', novasChavesHost());
    const tels = [1, 2, 3, 4, 5, 6].map((i) => new ProtocoloCliente('ABCD', 'j' + i, novasChavesDispositivo()));
    // cada telemóvel conhece a TV pela vista assinada e fixa a sua chave com uma ação
    const v = host.vista(1, 0, vistaSala(s));
    tels.forEach((t) => {
      expect(t.lerVista(v)).not.toBeNull();
      expect(host.abrir(t.acao({ tipo: 'pronto', id: 't.eu', pronto: true }))?.de).toBe(t.eu);
    });
    const por = privadosPorAparelho(s, Object.keys(host.fixadas));
    const msgs = Object.entries(por).map(([ap, d]) => host.privado(ap, d)!);
    for (const t of tels) {
      const meus = msgs.map((m) => t.lerPrivado(m)).filter(Boolean);
      expect(meus.length).toBe(1); // só decifra o seu
      expect((meus[0]![t.eu] as PrivadoPirata).papel).toBe(s.pirata!.papeis[t.eu]);
    }
    // a mensagem não diz nada a quem a lê no canal
    expect(JSON.stringify(msgs)).not.toMatch(/pirata|vigia|medico|marinheiro|artilheiro/);
  });

  it('ninguém se faz passar por outro aparelho nem pela TV', () => {
    const host = new ProtocoloHost('ABCD', novasChavesHost());
    const outroHost = new ProtocoloHost('ABCD', novasChavesHost());
    const ana = new ProtocoloCliente('ABCD', 'ana', novasChavesDispositivo());
    const ladrao = new ProtocoloCliente('ABCD', 'ana', novasChavesDispositivo());
    const s = com(5);
    const v = host.vista(1, 0, vistaSala(s));
    ana.lerVista(v);
    ladrao.lerVista(v);
    expect(host.abrir(ana.acao({ tipo: 'pronto', id: '', pronto: true }))?.de).toBe('ana');
    // mesmo id, outra chave: recusado
    expect(host.abrir(ladrao.acao({ tipo: 'pronto', id: '', pronto: true }))).toBeNull();
    // mensagem mexida: recusada
    const m = ana.acao({ tipo: 'pronto', id: '', pronto: false })!;
    expect(host.abrir({ ...m, c: m.c.slice(0, -4) + 'AAAA' })).toBeNull();
    // a mesma mensagem repetida mais tarde: recusada
    expect(host.abrir(m)?.de).toBe('ana');
    expect(host.abrir(m)).toBeNull();
    // vista de outra TV: ignorada; vista adulterada: ignorada
    expect(ana.lerVista(outroHost.vista(9, 0, vistaSala(s)))).toBeNull();
    expect(ana.lerVista({ ...host.vista(2, 0, vistaSala(s)), txt: '{}' })).toBeNull();
    expect(ana.lerVista(host.vista(3, 0, vistaSala(s)))).not.toBeNull();
    // com a impressão do link, só aceita essa TV logo à primeira
    const qr = new ProtocoloCliente('ABCD', 'rui', novasChavesDispositivo(), host.impressao);
    expect(qr.lerVista(outroHost.vista(1, 0, vistaSala(s)))).toBeNull();
    expect(qr.lerVista(v)).not.toBeNull();
  });

  it('quem volta noutro aparelho (pelo nome) recebe o papel nesse aparelho', () => {
    let s = reduzSala(com(5), { tipo: 'comecar', id: 'j1', jogo: 'pirata' }, 100);
    const papel = s.pirata!.papeis.j3;
    s = reduzSala(s, { tipo: 'ligados', ids: ['j1', 'j2', 'j4', 'j5'] }, 200);
    s = reduzSala(s, { tipo: 'entrar', id: 'novo', nome: 'N3', avatar: 3, tag: 'nova' }, 300);
    const por = privadosPorAparelho(s, ['novo', 'j1']);
    expect((por.novo.j3 as PrivadoPirata).papel).toBe(papel);
    expect(por.j1.j3).toBeUndefined();
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
