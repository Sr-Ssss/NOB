import { describe, expect, it } from 'vitest';
import { codigoSala, CODIGO_VALIDO } from './ids';
import { novasChavesDispositivo, novasChavesHost } from './cripto';
import { MAX_BARRADOS } from './membros';
import { privadosPorAparelho } from './privado';
import { ProtocoloCliente, ProtocoloHost } from './protocolo';
import { ID_TV, novaSala, reduzSala, vistaSala, type AcaoSala, type EstadoSala } from './sala';
import { TOLERANCIA } from './saidas';

const T0 = 1_000_000;
const r = (s: EstadoSala, a: AcaoSala, t = T0) => reduzSala(s, a, t);
const entrar = (s: EstadoSala, id: string, nome: string, t = T0) => r(s, { tipo: 'entrar', id, nome, avatar: 0, tag: 't' + id }, t);

function com(n: number): EstadoSala {
  let s = novaSala('ABCDE', 'pt-BR');
  for (let i = 1; i <= n; i++) s = entrar(s, `j${i}`, `N${i}`);
  return s;
}
const ids = (s: EstadoSala) => s.jogadores.map((j) => j.id);

describe('código da sala (T8)', () => {
  it('5 letras sem I/O; os telemóveis aceitam 4 a 6 (links antigos)', () => {
    for (let i = 0; i < 50; i++) {
      const c = codigoSala();
      expect(c).toMatch(/^[A-HJ-NP-Z]{5}$/);
    }
    expect(CODIGO_VALIDO.test('ABCD')).toBe(true);
    expect(CODIGO_VALIDO.test('ABCDE')).toBe(true);
    expect(CODIGO_VALIDO.test('ABCDEF')).toBe(true);
    expect(CODIGO_VALIDO.test('ABC')).toBe(false);
    expect(CODIGO_VALIDO.test('ABCDEFG')).toBe(false);
  });
});

describe('fechar a party', () => {
  it('só o líder (ou a TV) fecha e abre', () => {
    const s = com(3);
    expect(r(s, { tipo: 'fechar', id: 'j2', fechada: true }).fechada).toBeFalsy();
    expect(r(s, { tipo: 'fechar', id: 'j1', fechada: true }).fechada).toBe(true);
    expect(r(s, { tipo: 'fechar', id: ID_TV, fechada: true }).fechada).toBe(true);
  });

  it('fechada: quem é novo fica à porta (com aviso na vista); abrir deixa-o entrar', () => {
    let s = r(com(3), { tipo: 'fechar', id: 'j1', fechada: true });
    s = entrar(s, 'novo', 'Intruso');
    expect(ids(s)).not.toContain('novo');
    expect(vistaSala(s).barrados).toEqual(['novo']);
    expect(vistaSala(s).fechada).toBe(true);
    s = r(s, { tipo: 'fechar', id: 'j1', fechada: false });
    expect(s.barrados).toEqual([]);
    s = entrar(s, 'novo', 'Intruso');
    expect(ids(s)).toContain('novo');
  });

  it('fechada: quem já é membro volta (o mesmo id, ou pelo nome se estava desligado)', () => {
    let s = r(com(3), { tipo: 'fechar', id: 'j1', fechada: true });
    // o mesmo id (recarregou a página)
    s = r(s, { tipo: 'ligados', ids: ['j1', 'j3'] }, T0 + 1);
    s = entrar(s, 'j2', 'N2', T0 + 2);
    expect(s.jogadores.find((j) => j.id === 'j2')?.ligado).toBe(true);
    // outro telemóvel, pelo nome, de quem estava desligado
    s = r(s, { tipo: 'ligados', ids: ['j1', 'j2'] }, T0 + 3);
    s = entrar(s, 'telemovel-novo', 'n3', T0 + 4);
    expect(s.aliases['telemovel-novo']).toBe('j3');
    expect(s.jogadores.find((j) => j.id === 'j3')?.ligado).toBe(true);
    // pelo nome de quem está ligado, não: fica à porta
    s = entrar(s, 'outro', 'N1', T0 + 5);
    expect(ids(s)).not.toContain('outro');
    expect(s.barrados).toContain('outro');
  });

  it('a lista de quem ficou à porta não cresce sem fim', () => {
    let s = r(com(1), { tipo: 'fechar', id: 'j1', fechada: true });
    for (let i = 0; i < MAX_BARRADOS + 15; i++) s = entrar(s, 'x' + i, 'X' + i);
    expect(s.barrados).toHaveLength(MAX_BARRADOS);
    expect(s.barrados!.at(-1)).toBe('x' + (MAX_BARRADOS + 14));
  });
});

describe('expulsar', () => {
  it('só o líder; não a si próprio nem a um bot', () => {
    let s = com(3);
    expect(ids(r(s, { tipo: 'expulsar', id: 'j2', alvo: 'j3' }))).toContain('j3');
    expect(r(s, { tipo: 'expulsar', id: 'j1', alvo: 'j1' })).toBe(s);
    s = r(s, { tipo: 'bot_add', id: 'j1', bot: 'bot-1', tag: 'tb' });
    expect(ids(r(s, { tipo: 'expulsar', id: 'j1', alvo: 'bot-1' }))).toContain('bot-1');
  });

  it('no lobby: sai e não volta, nem com outro nome a partir do mesmo aparelho', () => {
    let s = r(com(3), { tipo: 'expulsar', id: 'j1', alvo: 'j3' });
    expect(ids(s)).toEqual(['j1', 'j2']);
    expect(vistaSala(s).expulsos).toEqual(['j3']);
    expect(entrar(s, 'j3', 'N3')).toBe(s);
    expect(entrar(s, 'j3', 'Outro nome')).toBe(s);
    // e as outras ações dele já não contam
    expect(r(s, { tipo: 'pronto', id: 'j3', pronto: true })).toBe(s);
    // a presença no canal não o põe de volta
    s = r(s, { tipo: 'ligados', ids: ['j1', 'j2', 'j3'] });
    expect(ids(s)).toEqual(['j1', 'j2']);
  });

  it('bloqueia também os aparelhos que eram ele (aliases), e ninguém volta pelo nome dele', () => {
    let s = com(3);
    s = r(s, { tipo: 'ligados', ids: ['j1', 'j2'] }, T0 + 1);
    s = entrar(s, 'tel-b', 'N3', T0 + 2); // j3 voltou noutro telemóvel
    expect(s.aliases['tel-b']).toBe('j3');
    s = r(s, { tipo: 'expulsar', id: 'j1', alvo: 'j3' }, T0 + 3);
    expect(s.expulsos).toEqual(expect.arrayContaining(['j3', 'tel-b']));
    expect(entrar(s, 'tel-b', 'Disfarce', T0 + 4)).toBe(s);
  });

  it('a meio de um jogo é uma saída: o jogo segue sem ele e fica na lista como desligado até acabar', () => {
    let s = r(com(6), { tipo: 'comecar', id: 'j1', jogo: 'pirata' });
    s = r(s, { tipo: 'tick' }, s.pirata!.terminaEm);
    const t = T0 + 50_000;
    s = r(s, { tipo: 'expulsar', id: 'j1', alvo: 'j3' }, t);
    const j3 = s.jogadores.find((j) => j.id === 'j3')!;
    expect(j3.ligado).toBe(false);
    expect(j3.desligadoEm).toBeLessThanOrEqual(t - TOLERANCIA);
    expect(s.dispensados).toContain('j3'); // seguirSem: o líder não tem de decidir mais nada
    expect(s.pausaSaida).toBeFalsy();
    expect(vistaSala(s).ausentes).toEqual([]);
    // não recebe mais o privado (papel secreto)
    expect(privadosPorAparelho(s, ['j2', 'j3'])).not.toHaveProperty('j3');
    // acabou o jogo: sai da lista
    s = r(s, { tipo: 'acabar', id: 'j1' }, t + 1);
    s = r(s, { tipo: 'tick' }, t + 10 * 60_000);
    expect(ids(s)).not.toContain('j3');
  });
});

describe('protocolo: o host deixa de abrir as ações de um expulso', () => {
  it('pelo id e pela chave fixada', () => {
    const h = new ProtocoloHost('ABCDE', novasChavesHost());
    const chaves = novasChavesDispositivo();
    const vista = vistaSala(novaSala('ABCDE', 'pt-BR'));
    const cli = (eu: string) => {
      const c = new ProtocoloCliente('ABCDE', eu, chaves);
      c.lerVista(h.vista(1, 0, vista), 0);
      return c;
    };
    const a = cli('j3');
    expect(h.abrir(a.acao({ tipo: 'pronto', id: 'j3', pronto: true }))).not.toBeNull();
    h.barrar(['j3']);
    expect(h.barrado('j3')).toBe(true);
    expect(h.abrir(a.acao({ tipo: 'pronto', id: 'j3', pronto: true }))).toBeNull();
    // o mesmo aparelho (a mesma chave) com outro id
    const b = cli('j3-outro');
    expect(h.abrir(b.acao({ tipo: 'entrar', id: 'j3-outro', nome: 'X', avatar: 0, tag: 't' }))).toBeNull();
    // outro aparelho entra normalmente
    const c = new ProtocoloCliente('ABCDE', 'j4', novasChavesDispositivo());
    c.lerVista(h.vista(2, 0, vista), 0);
    expect(h.abrir(c.acao({ tipo: 'pronto', id: 'j4', pronto: true }))).not.toBeNull();
  });
});
