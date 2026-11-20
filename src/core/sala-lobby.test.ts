import { describe, expect, it } from 'vitest';
import { ID_TV, T_CARREGAR, T_TUTORIAL, assumirSemTv, novaSala, reduzSala, todosProntos, virarTv, vistaSala, type EstadoSala } from './sala';

/** party sem TV com `n` jogadores (j1 = líder) */
function com(n: number, semTv = true): EstadoSala {
  let s: EstadoSala = { ...novaSala('ABCD', 'pt-BR'), semTv };
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `Nome${i}`, avatar: i, tag: `t${i}` }, i);
  return s;
}
const prontos = (s: EstadoSala, ...ids: string[]) => ids.reduce((r, id) => reduzSala(r, { tipo: 'pronto', id, pronto: true }, 50), s);

describe('Jogar → prontos → abertura (20/11)', () => {
  it('"Jogar" espera que todos estejam prontos; o último a ficar pronto abre o jogo', () => {
    let s = reduzSala(com(3), { tipo: 'jogar', id: 'j1', jogo: '5050' }, 100);
    expect(s.preparar).toEqual({ jogo: '5050', tutorial: false });
    expect(s.tutorial).toBeFalsy();
    s = prontos(s, 'j1', 'j2');
    expect(s.preparar).not.toBeNull();
    s = reduzSala(s, { tipo: 'pronto', id: 'j3', pronto: true }, 200);
    expect(s.preparar).toBeNull();
    expect(s.tutorial).toEqual({ jogo: '5050', ate: 200 + T_CARREGAR, fase: 'carregar', ver: false });
    expect(vistaSala(s).tutorial?.fase).toBe('carregar');
  });

  it('todos já prontos: "Jogar" abre logo; os bots contam como prontos', () => {
    let s = prontos(com(3), 'j1', 'j2', 'j3');
    s = reduzSala(s, { tipo: 'bot_add', id: 'j1', bot: 'bot-1', tag: 'b' }, 60);
    expect(todosProntos(s)).toBe(true);
    s = reduzSala(s, { tipo: 'jogar', id: 'j1', jogo: '5050' }, 100);
    expect(s.tutorial?.fase).toBe('carregar');
  });

  it('só o líder (ou a TV) joga, cancela e força', () => {
    const s = reduzSala(com(3), { tipo: 'jogar', id: 'j1', jogo: '5050', tutorial: true }, 100);
    expect(reduzSala(com(3), { tipo: 'jogar', id: 'j2', jogo: '5050' }, 100).preparar).toBeFalsy();
    expect(reduzSala(s, { tipo: 'forcar', id: 'j2' }, 150)).toBe(s);
    expect(reduzSala(s, { tipo: 'preparar_cancelar', id: 'j2' }, 150)).toBe(s);
    expect(reduzSala(s, { tipo: 'preparar_cancelar', id: 'j1' }, 150).preparar).toBeNull();
    const f = reduzSala(s, { tipo: 'forcar', id: ID_TV }, 150);
    expect(f.tutorial).toEqual({ jogo: '5050', ate: 150 + T_CARREGAR, fase: 'carregar', ver: true });
  });

  it('sem TV joga-se tudo (Fase 10: Se Vira! e Ragerob também)', () => {
    for (const jogo of ['sevira', 'ragerob']) {
      expect(reduzSala(com(3), { tipo: 'jogar', id: 'j1', jogo }, 100).preparar?.jogo).toBe(jogo);
      expect(reduzSala(com(3, false), { tipo: 'jogar', id: 'j1', jogo }, 100).preparar?.jogo).toBe(jogo);
    }
  });

  it('barra de 5 s → tutorial (se pedido) → jogo', () => {
    let s = prontos(com(3), 'j1', 'j2', 'j3');
    s = reduzSala(s, { tipo: 'jogar', id: 'j1', jogo: '5050', tutorial: true }, 100);
    s = reduzSala(s, { tipo: 'tick' }, 100 + T_CARREGAR - 1);
    expect(s.tutorial?.fase).toBe('carregar');
    s = reduzSala(s, { tipo: 'tick' }, 100 + T_CARREGAR);
    expect(s.tutorial).toEqual({ jogo: '5050', ate: 100 + T_CARREGAR + T_TUTORIAL, fase: 'tutorial' });
    expect(s.jogo).toBeNull();
    s = reduzSala(s, { tipo: 'tick' }, 100 + T_CARREGAR + T_TUTORIAL);
    expect(s.tutorial).toBeNull();
    expect(s.jogo).not.toBeNull();
  });

  it('sem tutorial, o jogo começa no fim da barra; "saltar" na barra tira só o tutorial', () => {
    let s = prontos(com(3), 'j1', 'j2', 'j3');
    s = reduzSala(s, { tipo: 'jogar', id: 'j1', jogo: '5050', tutorial: true }, 100);
    s = reduzSala(s, { tipo: 'saltar', id: 'j1' }, 200);
    expect(s.tutorial).toMatchObject({ fase: 'carregar', ver: false });
    expect(s.jogo).toBeNull();
    s = reduzSala(s, { tipo: 'tick' }, 100 + T_CARREGAR);
    expect(s.tutorial).toBeNull();
    expect(s.jogo).not.toBeNull();
  });

  it('quem não estava pronto saiu: os que ficaram abrem o jogo', () => {
    let s = reduzSala(com(4), { tipo: 'jogar', id: 'j1', jogo: '5050' }, 100);
    s = prontos(s, 'j1', 'j2', 'j3');
    expect(s.preparar).not.toBeNull();
    s = reduzSala(s, { tipo: 'ligados', ids: ['j1', 'j2', 'j3'] }, 300);
    s = reduzSala(s, { tipo: 'tick' }, 400);
    expect(s.tutorial?.fase).toBe('carregar');
  });
});

describe('Tornar TV (20/11)', () => {
  it('só o líder escolhe; fica pelo menos uma pessoa a jogar; nunca a meio do jogo', () => {
    const s = com(3);
    expect(reduzSala(s, { tipo: 'tornar_tv', id: 'j2', alvo: 'j3' }, 100)).toBe(s);
    expect(reduzSala(s, { tipo: 'tornar_tv', id: 'j1', alvo: 'j3' }, 100).novaTv).toBe('j3');
    expect(reduzSala(s, { tipo: 'tornar_tv', id: 'j1', alvo: 'j1' }, 100).novaTv).toBe('j1');
    expect(reduzSala(com(1), { tipo: 'tornar_tv', id: 'j1', alvo: 'j1' }, 100).novaTv).toBeFalsy();
    const bot = reduzSala(s, { tipo: 'bot_add', id: 'j1', bot: 'bot-1', tag: 'b' }, 50);
    expect(reduzSala(bot, { tipo: 'tornar_tv', id: 'j1', alvo: 'bot-1' }, 100).novaTv).toBeFalsy();
    const jogo = reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: '5050' }, 100);
    expect(reduzSala(jogo, { tipo: 'tornar_tv', id: 'j1', alvo: 'j3' }, 100).novaTv).toBeFalsy();
    // desistir (o anfitrião não conseguiu passar a party)
    const p = reduzSala(s, { tipo: 'tornar_tv', id: 'j1', alvo: 'j3' }, 100);
    expect(reduzSala(p, { tipo: 'tornar_tv', id: ID_TV, alvo: null }, 100).novaTv).toBeNull();
  });

  it('virarTv: a pessoa sai da party, a liderança passa e a party passa a ter TV', () => {
    let s = com(3);
    s = { ...s, aliases: { outro: 'j1', ap3: 'j3' } };
    const r = virarTv(s, 'j1', 200);
    expect(r.semTv).toBe(false);
    expect(r.jogadores.map((j) => j.id)).toEqual(['j2', 'j3']);
    expect(r.vipId).toBe('j2');
    expect(r.aliases).toEqual({ ap3: 'j3' });
    expect(r.novaTv).toBeNull();
  });

  it('assumirSemTv: o telemóvel que assume sem TV continua o jogo (já nenhum precisa de TV)', () => {
    const tv = com(3, false);
    const sv = reduzSala(tv, { tipo: 'comecar', id: 'j1', jogo: 'sevira' }, 100);
    expect(sv.sevira).not.toBeNull();
    const r = assumirSemTv(sv, 200);
    expect(r.semTv).toBe(true);
    expect(r.sevira).toBe(sv.sevira);
    const j = reduzSala(tv, { tipo: 'comecar', id: 'j1', jogo: '5050' }, 100);
    expect(assumirSemTv(j, 200).jogo).not.toBeNull();
  });
});
