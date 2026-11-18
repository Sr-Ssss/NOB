import { describe, expect, it } from 'vitest';
import { novaSala, privadoSala, reduzSala, vistaSala, type AcaoSala, type EstadoSala } from './sala';
import { TOLERANCIA } from './saidas';
import type { PrivadoPirata } from '../jogos/pirata/regras';

const T0 = 1_000_000;

function com(n: number): EstadoSala {
  let s = novaSala('ABCD', 'pt-BR');
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `N${i}`, avatar: i, tag: `t${i}` }, T0);
  return s;
}
const r = (s: EstadoSala, a: AcaoSala, t: number) => reduzSala(s, a, t);
const todosMenos = (s: EstadoSala, ...fora: string[]) => s.jogadores.map((j) => j.id).filter((id) => !fora.includes(id));

/** Pirata com 6 jogadores já na noite */
function pirataNaNoite(): EstadoSala {
  let s = r(com(6), { tipo: 'comecar', id: 'j1', jogo: 'pirata' }, T0);
  s = r(s, { tipo: 'tick' }, s.pirata!.terminaEm);
  expect(s.pirata!.fase).toBe('noite');
  return s;
}

describe('saídas e entradas a meio do jogo', () => {
  it('desligar não é sair: só depois da tolerância; quem faz falta pausa o jogo e retoma ao voltar', () => {
    let s = pirataNaNoite();
    const t = T0 + 30_000;
    const fim = s.pirata!.terminaEm;
    s = r(s, { tipo: 'ligados', ids: todosMenos(s, 'j3') }, t);
    expect(s.pausaSaida).toBeFalsy();
    expect(s.pirata!.pausaRestante).toBeNull();
    s = r(s, { tipo: 'tick' }, t + TOLERANCIA);
    expect(s.pausaSaida).toBe(true);
    expect(s.pirata!.pausaRestante).toBe(fim - (t + TOLERANCIA));
    expect(vistaSala(s).ausentes).toEqual([{ id: 'j3', desde: t, importante: true, podeSeguir: true }]);
    // o tempo não corre durante a pausa
    s = r(s, { tipo: 'tick' }, fim + 60_000);
    expect(s.pirata!.fase).toBe('noite');
    // voltou: continua de onde estava
    s = r(s, { tipo: 'ligados', ids: todosMenos(s) }, fim + 61_000);
    expect(s.pausaSaida).toBe(false);
    expect(s.pirata!.pausaRestante).toBeNull();
    expect(s.pirata!.terminaEm).toBe(fim + 61_000 + (fim - (t + TOLERANCIA)));
    expect(vistaSala(s).ausentes).toEqual([]);
  });

  it('jogos onde ninguém faz falta (50/50) não pausam, mas o líder vê quem saiu', () => {
    let s = r(com(4), { tipo: 'comecar', id: 'j1', jogo: '5050' }, T0);
    s = r(s, { tipo: 'ligados', ids: todosMenos(s, 'j4') }, T0 + 1);
    s = r(s, { tipo: 'tick' }, T0 + 1 + TOLERANCIA);
    expect(s.pausaSaida).toBeFalsy();
    expect(s.jogo!.pausaRestante).toBeNull();
    expect(vistaSala(s).ausentes?.map((a) => a.id)).toEqual(['j4']);
  });

  it('o líder segue sem ele: o jogo trata a saída e retoma', () => {
    let s = pirataNaNoite();
    s = r(s, { tipo: 'ligados', ids: todosMenos(s, 'j3') }, T0 + 1);
    s = r(s, { tipo: 'tick' }, T0 + 1 + TOLERANCIA);
    expect(s.pausaSaida).toBe(true);
    // só o líder decide
    expect(r(s, { tipo: 'ausente_seguir', id: 'j2', alvo: 'j3' }, T0 + 20_000)).toBe(s);
    s = r(s, { tipo: 'ausente_seguir', id: 'j1', alvo: 'j3' }, T0 + 20_000);
    expect(s.pausaSaida).toBe(false);
    expect(s.pirata!.vivos).not.toContain('j3');
    expect(s.pirata!.fora.at(-1)).toMatchObject({ id: 'j3', quando: 'saiu' });
    expect(vistaSala(s).ausentes).toEqual([]);
    // volta mais tarde: é espectador, não volta a pausar nada
    s = r(s, { tipo: 'ligados', ids: todosMenos(s) }, T0 + 30_000);
    expect(vistaSala(s).pausaSaida).toBe(false);
  });

  it('quem entra a meio é espectador e o líder pode pô-lo no lugar de quem saiu (herda o papel)', () => {
    let s = pirataNaNoite();
    const papel = s.pirata!.papeis.j3;
    s = r(s, { tipo: 'entrar', id: 'novo', nome: 'Zé', avatar: 9, tag: 'tz' }, T0 + 1);
    expect(s.pirata!.participantes).not.toContain('novo');
    expect(vistaSala(s).espectadores).toEqual(['novo']);
    s = r(s, { tipo: 'ligados', ids: todosMenos(s, 'j3') }, T0 + 2);
    s = r(s, { tipo: 'tick' }, T0 + 2 + TOLERANCIA);
    expect(s.pausaSaida).toBe(true);
    // não se troca por quem já joga
    expect(r(s, { tipo: 'ausente_trocar', id: 'j1', alvo: 'j3', por: 'j2' }, T0 + 20_000)).toBe(s);
    s = r(s, { tipo: 'ausente_trocar', id: 'j1', alvo: 'j3', por: 'novo' }, T0 + 20_000);
    expect(s.pausaSaida).toBe(false);
    expect(s.pirata!.papeis.novo).toBe(papel);
    expect(s.pirata!.papeis.j3).toBeUndefined();
    expect(s.pirata!.vivos).toContain('novo');
    expect(s.pirata!.audiencia).not.toContain('novo');
    expect((privadoSala(s, 'novo') as PrivadoPirata).papel).toBe(papel);
    expect(privadoSala(s, 'j3')).toBeNull();
  });

  it('O Rei e o Dragão: sem o Rei não se pode seguir (só esperar, trocar ou acabar)', () => {
    let s = r(com(6), { tipo: 'comecar', id: 'j1', jogo: 'rei' }, T0);
    const rei = s.rei!.participantes.find((id) => s.rei!.cartas[id].papel === 'rei')!;
    const lider = s.vipId === rei ? 'j2' : s.vipId!;
    if (s.vipId === rei) s = r(s, { tipo: 'lideranca', id: rei, para: lider }, T0);
    s = r(s, { tipo: 'ligados', ids: todosMenos(s, rei) }, T0 + 1);
    s = r(s, { tipo: 'tick' }, T0 + 1 + TOLERANCIA);
    expect(s.pausaSaida).toBe(true);
    expect(vistaSala(s).ausentes![0]).toMatchObject({ id: rei, podeSeguir: false });
    expect(r(s, { tipo: 'ausente_seguir', id: lider, alvo: rei }, T0 + 20_000)).toBe(s);
    // acabar a meio: só o líder, volta ao menu
    expect(r(s, { tipo: 'acabar', id: rei === 'j3' ? 'j4' : 'j3' }, T0 + 20_000).rei).toBeTruthy();
    const menu = r(s, { tipo: 'acabar', id: lider }, T0 + 20_000);
    expect(menu.rei).toBeNull();
    expect(menu.pausaSaida).toBe(false);
  });

  it('Senha do Wi-Fi: o Criptógrafo é o 1.º ligado da vez; se sair, o líder passa a vez ao seguinte', () => {
    let s = r(com(6), { tipo: 'comecar', id: 'j1', jogo: 'wifi' }, T0);
    const w = s.wifi!;
    const daVez = w.equipas.b[0]; // ronda 1
    s = r(s, { tipo: 'ligados', ids: todosMenos(s, daVez) }, T0 + 1);
    s = r(s, { tipo: 'tick' }, T0 + 1 + TOLERANCIA);
    // na preparação ainda não faz falta (não pausa)
    expect(s.pausaSaida).toBeFalsy();
    for (const id of [...w.equipas.b, ...w.equipas.p]) s = r(s, { tipo: 'jogo', acao: { tipo: 'prontas', id } }, T0 + 20_000);
    expect(s.wifi!.fase).toBe('pistas');
    // a ronda 1 começou com o seguinte ligado, não com o desligado
    const c2 = vistaSala(s).wifi!.criptografos.b;
    expect(c2).not.toBe(daVez);
    expect(w.equipas.b).toContain(c2);
    // agora sai o novo Criptógrafo a meio das pistas: pausa; o líder segue sem ele e a vez passa
    s = r(s, { tipo: 'ligados', ids: todosMenos(s, daVez, c2) }, T0 + 21_000);
    s = r(s, { tipo: 'tick' }, T0 + 21_000 + TOLERANCIA);
    expect(s.pausaSaida).toBe(true);
    const lider = s.vipId!;
    s = r(s, { tipo: 'ausente_seguir', id: lider, alvo: c2 }, T0 + 40_000);
    expect(s.pausaSaida).toBe(false);
    const c3 = vistaSala(s).wifi!.criptografos.b;
    expect(c3).not.toBe(c2);
    expect(s.wifi!.equipas.b).toContain(c3);
  });
});

describe('encravos', () => {
  it('O Rei e o Dragão: o líder avança se alguém não carrega em Pronto/OK; os outros não', () => {
    let s = r(com(6), { tipo: 'comecar', id: 'j1', jogo: 'rei' }, T0);
    expect(s.rei!.fase).toBe('ir');
    s = r(s, { tipo: 'jogo', acao: { tipo: 'rd_pronto', id: 'j2' } }, T0 + 1);
    expect(r(s, { tipo: 'jogo', acao: { tipo: 'rd_avancar', id: 'j2' } }, T0 + 2).rei!.fase).toBe('ir');
    s = r(s, { tipo: 'jogo', acao: { tipo: 'rd_avancar', id: 'j1' } }, T0 + 2);
    expect(s.rei!.fase).toBe('carta');
    s = r(s, { tipo: 'jogo', acao: { tipo: 'rd_avancar', id: 'j1' } }, T0 + 3);
    expect(s.rei!.fase).toBe('lider');
  });

  it('50/50: com 10+ jogadores o padrão são 2 rondas; se o líder escolher, vale a escolha', () => {
    expect(r(com(10), { tipo: 'comecar', id: 'j1', jogo: '5050' }, T0).jogo!.def.rondas).toBe(2);
    expect(r(com(4), { tipo: 'comecar', id: 'j1', jogo: '5050' }, T0).jogo!.def.rondas).toBe(3);
    const s = r(com(10), { tipo: 'definir', id: 'j1', def: { rondas: 3, rondasAuto: false } }, T0);
    expect(r(s, { tipo: 'comecar', id: 'j1', jogo: '5050' }, T0).jogo!.def.rondas).toBe(3);
  });
});
