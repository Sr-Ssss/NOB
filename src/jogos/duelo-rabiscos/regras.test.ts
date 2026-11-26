import { describe, expect, it } from 'vitest';
import { bytesTracos } from '../../ui/tracos';
import { CRIATURAS, MAGOS_PODERES, custoExercito, motivoNaoSomar, mudarExercito, exercitosProntos, validarExercito, type Criatura, type Exercito, type RoupaMago } from './criaturas';
import {
  T_VEZ,
  alvosAtaque,
  alvosEspecial,
  casasEspecial,
  casasAndar,
  classificacao,
  cria,
  dadosAtaque,
  dadosDefesa,
  novoDuelo,
  reduzDuelo,
  vistaDuelo,
  vivos,
  type AcaoDuelo,
  type Cria,
  type EstadoDuelo,
  type Face,
} from './regras';
import { MAX_BYTES_DESENHO, foraDuelo, importanteDuelo, limparDesenho, sairDuelo } from './regras';
import { N_OBSTACULOS, distancia, emLinha, ligado, linhaLivre, novoTabuleiro, vizinhas } from './tabuleiro';

const T = 1_000;
const ids = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);
const ap = (e: EstadoDuelo, a: AcaoDuelo, rnd?: () => number) => reduzDuelo(e, a, T, rnd);
/** dados marcados, por ordem; depois repete o último */
const marcados = (...l: number[]) => () => (l.length > 1 ? l.shift()! : l[0]);

function preparar(exercitos: Exercito[], roupas: RoupaMago[] = ['trovoada', 'pijama', 'peles', 'lencol']): EstadoDuelo {
  let e = novoDuelo(ids(exercitos.length), { obstaculos: 'nenhum' }, T, [], 7);
  e.participantes.forEach((id, i) => (e = ap(e, { tipo: 'dr_mago', id, roupa: roupas[i] })));
  e.participantes.forEach((id, i) => (e = ap(e, { tipo: 'dr_exercito', id, exercito: exercitos[i] })));
  e.participantes.forEach((id) => (e = ap(e, { tipo: 'dr_desenho', id, criatura: Object.keys(e.magos[id].exercito!)[0] as Criatura, tracos: [], pronto: true })));
  return e;
}

/** partida na vez do j1, com as criaturas postas à mão: [dono, tipo, casa] */
function cena(postas: [string, Criatura, string][], mais: { gemas?: number; dados?: Face[]; roupas?: RoupaMago[] } = {}): EstadoDuelo {
  const jogadores = Math.max(...postas.map(([d]) => Number(d.slice(1))));
  let e = preparar(Array.from({ length: jogadores }, () => ({ duende: 6 })), mais.roupas);
  const modelo = e.criaturas[0];
  e.criaturas = postas.map(([dono, tipo, casa], i) => ({ ...modelo, id: i + 1, dono, tipo, casa, ferimentos: 0, marcas: [] }));
  e.proximoId = 100;
  for (const id of e.participantes) e.magos[id].dados = mais.dados ? [...mais.dados] : ['coringa', 'coringa', 'coringa', 'coringa'];
  e.comecou = 'j1';
  for (const id of e.participantes) e.magos[id].gemas = mais.gemas ?? 0;
  for (const id of e.participantes) e = ap(e, { tipo: 'dr_pronto', id });
  return e;
}
const c = (e: EstadoDuelo, id: number): Cria => cria(e, id)!;

describe('colmeia', () => {
  it('distância, vizinhas e linha reta', () => {
    expect(vizinhas('3,3')).toHaveLength(6);
    expect(vizinhas('3,3').every((v) => distancia(v, '3,3') === 1)).toBe(true);
    expect(distancia('0,0', '7,0')).toBe(7);
    expect(distancia('3,0', '4,7')).toBeGreaterThanOrEqual(7);
    expect(emLinha('0,0', '3,0')).toBe(true);
    expect(emLinha('0,0', '2,1')).toBe(false);
  });
  it('um obstáculo a meio da linha tapa o tiro', () => {
    expect(linhaLivre('0,0', '3,0', (x) => x === '1,0')).toBe(false);
    expect(linhaLivre('0,0', '3,0', (x) => x === '1,1')).toBe(true);
  });
  it('tabuleiros de 2, 3 e 4: ligados, com cantos livres e nº certo de obstáculos', () => {
    for (const n of [2, 3, 4])
      for (const o of ['nenhum', 'poucos', 'muitos'] as const)
        for (let seed = 1; seed < 8; seed++) {
          const t = novoTabuleiro(n, o, seed);
          expect(t.cantos).toHaveLength(n);
          expect(t.obstaculos).toHaveLength(N_OBSTACULOS[o]);
          expect(t.cantos.every((k) => t.casas.includes(k) && !t.obstaculos.includes(k))).toBe(true);
          expect(ligado(t.casas.filter((x) => !t.obstaculos.includes(x)))).toBe(true);
        }
  });
  it('com 3 e 4 os cantos ficam mais longe do que com 2', () => {
    const perto = (n: number) => {
      const { cantos } = novoTabuleiro(n, 'nenhum', 1);
      return Math.min(...cantos.flatMap((a, i) => cantos.slice(i + 1).map((b) => distancia(a, b))));
    };
    expect(perto(3)).toBeGreaterThan(perto(2));
    expect(perto(4)).toBeGreaterThan(perto(2));
  });
});

describe('preparação', () => {
  it('14 criaturas, 2 por classe, e 6 magos', () => {
    expect(Object.keys(CRIATURAS)).toHaveLength(14);
    expect(new Set(Object.values(CRIATURAS).map((f) => f.classe)).size).toBe(7);
    expect(Object.keys(MAGOS_PODERES)).toHaveLength(6);
  });
  it('exércitos: até 3 classes, 1 variante por classe, dentro da tinta', () => {
    expect(validarExercito({ ogre: 1, elfo: 1, duende: 1 }, 12)).toEqual({ ogre: 1, elfo: 1, duende: 1 });
    expect(validarExercito({ duende: 1, sapinho: 1 }, 12)).toBeNull();
    expect(validarExercito({ duende: 1, lobo: 1, velhoPescador: 1, golem: 1 }, 12)).toBeNull();
    expect(validarExercito({ ogre: 3 }, 12)).toBeNull();
    for (const mau of [{}, null, { toString: 1 }, { duende: -1 }, { duende: 1.5 }]) expect(validarExercito(mau, 12)).toBeNull();
  });
  it('os prontos são válidos com qualquer tinta', () => {
    for (let t = 6; t <= 30; t++) for (const x of exercitosProntos(t)) expect(validarExercito(x, t)).not.toBeNull();
  });
  it('os magos não se repetem', () => {
    let e = novoDuelo(ids(2), {}, T);
    e = ap(e, { tipo: 'dr_mago', id: 'j1', roupa: 'peles' });
    expect(ap(e, { tipo: 'dr_mago', id: 'j2', roupa: 'peles' })).toBe(e);
  });
  it('a tinta que sobra vira gemas e a volta dá +1; começa quem acabou primeiro', () => {
    let e = novoDuelo(ids(2), {}, T);
    e = ap(e, { tipo: 'dr_mago', id: 'j1', roupa: 'peles' });
    e = ap(e, { tipo: 'dr_mago', id: 'j2', roupa: 'lencol' });
    e = ap(e, { tipo: 'dr_exercito', id: 'j1', exercito: { golem: 2, lobo: 1 } });
    e = ap(e, { tipo: 'dr_exercito', id: 'j2', exercito: { ogre: 2 } });
    e = ap(e, { tipo: 'dr_desenho', id: 'j2', criatura: 'ogre', tracos: [], pronto: true });
    e = ap(e, { tipo: 'dr_desenho', id: 'j1', criatura: 'lobo', tracos: [], pronto: true });
    expect(e.fase).toBe('rodar');
    expect([e.magos.j1.gemas, e.magos.j2.gemas]).toEqual([2, 1]);
    expect(e.comecou).toBe('j2');
    expect(new Set(e.criaturas.map((x) => x.casa)).size).toBe(5);
    expect(e.magos.j1.dados).toHaveLength(4);
  });
  it('sem ninguém tocar, os relógios chegam ao jogo', () => {
    let e = novoDuelo(ids(4), { tinta: 30, obstaculos: 'muitos' }, T);
    for (let i = 0; i < 3; i++) e = reduzDuelo(e, { tipo: 'tick' }, e.terminaEm);
    expect(e.fase).toBe('rodar');
    expect(vivos(e)).toHaveLength(4);
    expect(new Set(e.participantes.map((id) => e.magos[id].roupa)).size).toBe(4);
    expect(custoExercito(e.magos.j1.exercito!)).toBeLessThanOrEqual(30);
  });
});

describe('volta e vez', () => {
  it('relança 1 dado de ação por volta', () => {
    const e = preparar([{ duende: 6 }, { duende: 6 }]);
    const f = ap(e, { tipo: 'dr_rodar', id: 'j1', i: 0 }, () => 5);
    expect(f.magos.j1.dados[0]).toBe('coringa');
    expect(ap(f, { tipo: 'dr_rodar', id: 'j1', i: 1 })).toBe(f);
  });
  it('uma ação de cada vez, a alternar; cada criatura anda 1 vez por volta', () => {
    let e = cena([['j1', 'ogre', '0,0'], ['j2', 'ogre', '7,7']]);
    expect(e.vez).toBe('j1');
    e = ap(e, { tipo: 'dr_andar', id: 'j1', i: 0, criatura: 1, casa: '1,0' });
    expect(c(e, 1).casa).toBe('1,0');
    expect(e.vez).toBe('j2');
    expect(casasAndar(e, c(e, 1))).toEqual([]);
    // já ninguém pode usar dados depois deste: perdem-se e começa a volta 2
    e = ap(e, { tipo: 'dr_andar', id: 'j2', i: 0, criatura: 2, casa: '6,7' });
    expect([e.fase, e.volta]).toEqual(['rodar', 2]);
  });
  it('o tempo esgotado perde um dado e passa', () => {
    const e = cena([['j1', 'ogre', '0,0'], ['j2', 'ogre', '7,7']]);
    const f = reduzDuelo(e, { tipo: 'tick' }, T + T_VEZ * 1000);
    expect(f.magos.j1.dados).toHaveLength(3);
    expect(f.vez).toBe('j2');
  });
  it('o dado tem de servir para a ação, e só na própria vez', () => {
    const e = cena([['j1', 'ogre', '0,0'], ['j2', 'ogre', '1,0']], { dados: ['andar', 'fazer', 'fazer', 'fazer'] });
    expect(ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 })).toBe(e);
    expect(ap(e, { tipo: 'dr_andar', id: 'j1', i: 1, criatura: 1, casa: '0,1' })).toBe(e);
    expect(ap(e, { tipo: 'dr_andar', id: 'j2', i: 0, criatura: 2, casa: '2,0' })).toBe(e);
    expect(ap(e, { tipo: 'dr_andar', id: 'j1', i: 0, criatura: 2, casa: '2,0' })).toBe(e);
  });
  it('nas voltas seguintes começa quem tem menos criaturas', () => {
    let e = cena([['j1', 'ogre', '0,0'], ['j1', 'ogre', '2,0'], ['j2', 'ogre', '7,7']], { dados: ['andar'] });
    e = ap(e, { tipo: 'dr_andar', id: 'j1', i: 0, criatura: 1, casa: '1,0' });
    e = ap(e, { tipo: 'dr_andar', id: 'j2', i: 0, criatura: 3, casa: '6,7' });
    expect([e.volta, e.comecou]).toEqual([2, 'j2']);
  });
  it('pausa com menos de 2 ligados e retoma', () => {
    const e = cena([['j1', 'ogre', '0,0'], ['j2', 'ogre', '7,7']]);
    const p = ap(e, { tipo: 'ligados', ids: ['j1'] });
    expect(p.pausaRestante).not.toBeNull();
    expect(ap(p, { tipo: 'dr_passar', id: 'j1', i: 0 })).toBe(p);
    expect(ap(p, { tipo: 'ligados', ids: ['j1', 'j2'] }).pausaRestante).toBeNull();
  });
  it('a vista não leva a semente dos dados', () => {
    expect('semente' in vistaDuelo(preparar([{ duende: 6 }, { duende: 6 }]))).toBe(false);
  });
});

describe('batalha', () => {
  it('corpo a corpo: perde quem tiver menos; empate = morrem os dois', () => {
    let e = cena([['j1', 'minotauro', '0,0'], ['j2', 'golem', '1,0']]);
    e = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(3, 0, 0, 0, 3));
    // o Minotauro fere o Golem ao cair
    expect([cria(e, 1), c(e, 2).ferimentos, e.fase]).toEqual([undefined, 1, 'fim']);
    e = cena([['j1', 'minotauro', '0,0'], ['j1', 'ogre', '7,0'], ['j2', 'golem', '1,0'], ['j2', 'ogre', '7,7']]);
    e = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 3 }, marcados(5, 5, 3, 0, 3));
    expect(e.criaturas.map((x) => x.id)).toEqual([2, 4]);
    expect(e.ultimo).toMatchObject({ morreu: true, morreuQuemAtacou: true });
    e = cena([['j1', 'minotauro', '0,0'], ['j2', 'golem', '1,0'], ['j2', 'ogre', '7,7']]);
    e = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(5, 5, 5, 0, 3));
    expect(cria(e, 2)).toBeUndefined();
    expect(e.ultimo).toMatchObject({ morreu: true, marca: 'soco' });
  });
  it('de longe ninguém morre se não passar da defesa', () => {
    let e = cena([['j1', 'elfo', '0,0'], ['j2', 'golem', '2,0']]);
    e = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(3, 0, 0, 3));
    expect([e.criaturas.length, e.vez]).toEqual([2, 'j2']);
  });
  it('as últimas dos dois caem juntas: acaba empatado', () => {
    let e = cena([['j1', 'duende', '0,0'], ['j2', 'duende', '1,0']]);
    e = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(0));
    expect(e.fase).toBe('fim');
    expect(classificacao(e).map((p) => p.lugar)).toEqual([1, 1]);
  });
  it('cada ferimento troca 1 dado normal por 1 de ferimento, dos dois lados', () => {
    const e = cena([['j1', 'elfo', '0,0'], ['j2', 'golem', '2,0']], { gemas: 1 });
    c(e, 1).ferimentos = 1;
    c(e, 2).ferimentos = 2;
    const f = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(0, 0, 0, 3, 3, 3, 1, 2));
    expect(f.batalha).toMatchObject({ ataque: [0, 0], feridaAtaque: ['espada'], defesa: [1, 1, 1], feridaDefesa: ['escudo', 'coracao'] });
    const g = ap(f, { tipo: 'dr_relancar', id: 'j1', i: 2 }, () => 3);
    expect(g.batalha!.feridaAtaque).toEqual(['gema']);
    // coração cura 1 ao sobrevivente; a gema paga de volta o relançar
    const h = ap(g, { tipo: 'dr_pronto', id: 'j2' });
    expect([c(h, 2).ferimentos, h.magos.j1.gemas]).toEqual([1, 1]);
  });
  it('espada conta no ataque e escudo na defesa, não ao contrário', () => {
    const luta = (a: number, d: number) => {
      const e = cena([['j1', 'elfo', '0,0'], ['j2', 'duende', '2,0'], ['j2', 'ogre', '7,7']]);
      c(e, 1).ferimentos = 1;
      c(e, 2).ferimentos = 2;
      return cria(ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(0, 0, a, d)), 2) === undefined;
    };
    expect([luta(0, 4), luta(0, 1), luta(1, 0), luta(0, 0)]).toEqual([true, false, false, true]);
  });
  it('uma gema relança 1 dado da batalha, do lado certo', () => {
    let e = cena([['j1', 'minotauro', '0,0'], ['j2', 'golem', '1,0']], { gemas: 1 });
    e = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(0));
    expect(e.fase).toBe('batalha');
    e = ap(e, { tipo: 'dr_relancar', id: 'j1', i: 0 }, () => 5);
    expect(e.magos.j1.gemas).toBe(0);
    expect(e.batalha!.ataque).toEqual([2, 0, 0, 0]);
    e = ap(e, { tipo: 'dr_pronto', id: 'j2' });
    expect(e.fase).toBe('fim');
  });
  it('quem perde uma criatura ganha 1 gema; a última acaba o jogo', () => {
    let e = cena([['j1', 'ogre', '0,0'], ['j2', 'duende', '1,0'], ['j2', 'duende', '0,1']]);
    e = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(5, 5, 5, 0));
    expect(cria(e, 2)).toBeUndefined();
    expect(e.magos.j2.gemas).toBe(1);
    const f = cena([['j1', 'ogre', '0,0'], ['j2', 'duende', '1,0']]);
    const g = ap(f, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(5, 5, 5, 0));
    expect(g.fase).toBe('fim');
    expect(classificacao(g).map((p) => [p.id, p.lugar])).toEqual([['j1', 1], ['j2', 2]]);
  });
});

describe('especiais das criaturas', () => {
  it('Duende: +1 com outro Lacaio colado ao alvo', () => {
    const e = cena([['j1', 'duende', '1,0'], ['j1', 'duende', '0,1'], ['j2', 'golem', '0,0']]);
    expect(dadosAtaque(e, c(e, 1), c(e, 3))).toBe(2);
  });
  it('Sapinho: quem o mata leva 1 ferimento', () => {
    let e = cena([['j1', 'ogre', '0,0'], ['j2', 'sapinho', '1,0'], ['j2', 'ogre', '7,7']]);
    e = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(5, 5, 5, 0));
    expect(c(e, 1).ferimentos).toBe(1);
  });
  it('Corvo passa por cima; os outros não', () => {
    const cerco: [string, Criatura, string][] = [['j2', 'golem', '1,0'], ['j2', 'golem', '0,1']];
    const corvo = cena([['j1', 'corvo', '0,0'], ...cerco]);
    const lobo = cena([['j1', 'lobo', '0,0'], ...cerco]);
    expect(casasAndar(corvo, c(corvo, 1))).toContain('2,0');
    expect(casasAndar(corvo, c(corvo, 1))).not.toContain('1,0');
    expect(casasAndar(lobo, c(lobo, 1))).toEqual([]);
  });
  it('Lobo anda mais 1 depois de atacar', () => {
    let e = cena([['j1', 'lobo', '0,0'], ['j2', 'ogre', '1,0'], ['j2', 'ogre', '7,7']]);
    e = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(5, 5, 0));
    expect(e.fase).toBe('lobo');
    e = ap(e, { tipo: 'dr_lobo', id: 'j1', casa: '0,1' });
    expect(c(e, 1).casa).toBe('0,1');
    expect(e.vez).toBe('j2');
  });
  it('Velho Pescador puxa por 1 gema, fere e luta', () => {
    const postas: [string, Criatura, string][] = [['j1', 'velhoPescador', '0,0'], ['j1', 'ogre', '7,0'], ['j2', 'ogre', '3,0'], ['j2', 'ogre', '7,7']];
    let e = cena(postas, { gemas: 1 });
    e.magos.j2.gemas = 1; // pára na batalha, para se ver
    e = ap(e, { tipo: 'dr_especial', id: 'j1', i: 0, criatura: 1, alvo: 3 }, marcados(5));
    expect(distancia(c(e, 3).casa, '0,0')).toBe(1);
    expect([e.magos.j1.gemas, c(e, 3).ferimentos, e.fase]).toEqual([0, 1, 'batalha']);
    expect(e.batalha!.feridaDefesa).toHaveLength(1);
    const pobre = cena(postas);
    expect(alvosEspecial(pobre, c(pobre, 1))).toEqual([]);
  });
  it('Múmia cura 1 ferimento a um amigo até 2, por 1 gema', () => {
    let e = cena([['j1', 'mumia', '0,0'], ['j1', 'ogre', '2,0'], ['j1', 'ogre', '4,0'], ['j2', 'ogre', '7,7']], { gemas: 1 });
    expect(alvosEspecial(e, c(e, 1))).toEqual([]);
    for (const i of [1, 2, 3]) c(e, i).ferimentos = 2;
    expect(alvosEspecial(e, c(e, 1)).map((x) => x.id)).toEqual([2]);
    e = ap(e, { tipo: 'dr_especial', id: 'j1', i: 0, criatura: 1, alvo: 2 });
    expect([c(e, 2).ferimentos, e.magos.j1.gemas]).toEqual([1, 0]);
  });
  it('Elfo atira a 2–3; Dragãozinho luta colado ou a 2', () => {
    const e = cena([['j1', 'elfo', '0,0'], ['j1', 'dragaozinho', '0,2'], ['j2', 'ogre', '1,0'], ['j2', 'ogre', '3,0'], ['j2', 'ogre', '1,2'], ['j2', 'ogre', '2,3']]);
    expect(alvosAtaque(e, c(e, 1)).map((x) => x.id)).toEqual(e.criaturas.filter((x) => x.dono === 'j2' && [2, 3].includes(distancia(x.casa, '0,0'))).map((x) => x.id));
    expect(alvosAtaque(e, c(e, 2)).map((x) => x.id)).toEqual(expect.arrayContaining([5]));
    expect(alvosAtaque(e, c(e, 2)).every((x) => distancia(x.casa, '0,2') <= 2)).toBe(true);
    const m = cena([['j1', 'elfo', '0,0'], ['j2', 'ogre', '3,0']]);
    m.muralhas = [{ casa: '1,0', ate: 9 }];
    expect(alvosAtaque(m, c(m, 1))).toEqual([]);
  });
  it('Dragãozinho: tiro falhado queima; colado luta normal', () => {
    const tiro = (casa: string) => ap(cena([['j1', 'dragaozinho', '0,0'], ['j1', 'ogre', '7,0'], ['j2', 'golem', casa]]), { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 3 }, marcados(0, 0, 3));
    const longe = tiro('2,0');
    expect([c(longe, 1).tipo, c(longe, 3).ferimentos, c(longe, 3).marcas]).toEqual(['dragaozinho', 1, ['queimado']]);
    const perto = tiro('1,0');
    expect([cria(perto, 1), c(perto, 3).ferimentos]).toEqual([undefined, 0]);
  });
  it('Golem dá +1 de defesa aos amigos colados', () => {
    const e = cena([['j1', 'ogre', '7,7'], ['j2', 'golem', '0,0'], ['j2', 'elfo', '1,0'], ['j2', 'elfo', '4,4']]);
    expect([2, 3, 4].map((i) => dadosDefesa(e, c(e, i)))).toEqual([5, 3, 2]);
  });
  it('Carvalho Vivo cria uma parede por 1 gema, que dura 2 voltas', () => {
    let e = cena([['j1', 'carvalho', '0,0'], ['j2', 'ogre', '7,7']], { gemas: 1, dados: ['coringa'] });
    expect(casasEspecial(e, c(e, 1))).toContain('1,0');
    expect(ap(e, { tipo: 'dr_especial', id: 'j1', i: 0, criatura: 1, casa: '5,5' })).toBe(e);
    e = ap(e, { tipo: 'dr_especial', id: 'j1', i: 0, criatura: 1, casa: '1,0' });
    expect([e.magos.j1.gemas, casasAndar(e, c(e, 1)).includes('1,0')]).toEqual([0, false]);
    const volta = () => {
      const v = e.volta;
      while (e.volta === v) e = reduzDuelo(e, { tipo: 'tick' }, e.terminaEm);
      return e.muralhas.length;
    };
    expect([volta(), volta()]).toEqual([1, 0]);
  });
  it('Cavaleiro relança 1 dado vazio, a atacar e a defender', () => {
    const e = cena([['j1', 'cavaleiro', '0,0'], ['j2', 'cavaleiro', '1,0']], { gemas: 1 });
    const f = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(0, 3, 3, 5, 0, 3, 3, 3, 4));
    expect(f.batalha).toMatchObject({ ataque: [2, 1, 1], defesa: [1, 1, 1, 1] });
  });
  it('Raposa sobrevive ao empate corpo a corpo, a atacar e a defender', () => {
    const empate = (a: Criatura, b: Criatura) => {
      const e = cena([['j1', a, '0,0'], ['j2', b, '1,0']]);
      return ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(0)).criaturas.map((x) => x.id);
    };
    expect(empate('raposa', 'golem')).toEqual([1]);
    expect(empate('golem', 'raposa')).toEqual([2]);
    expect(empate('raposa', 'raposa')).toEqual([1, 2]);
  });
  it('Minotauro, ao morrer, fere só os inimigos colados', () => {
    let e = cena([['j1', 'elfo', '0,0'], ['j1', 'golem', '3,1'], ['j2', 'minotauro', '3,0'], ['j2', 'ogre', '4,0']]);
    e = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 3 }, marcados(5, 5, 5, 0));
    expect([c(e, 2).ferimentos, c(e, 4).ferimentos]).toEqual([1, 0]);
    expect(c(e, 2).marcas).toEqual(['soco']);
  });
  it('Ogre: +1 por ferimento; bónus nunca passa de +2', () => {
    const e = cena([['j1', 'ogre', '0,0'], ['j2', 'ogre', '1,0']]);
    c(e, 1).ferimentos = 1;
    expect(dadosAtaque(e, c(e, 1), c(e, 2))).toBe(4);
    c(e, 1).furia = true;
    expect(dadosAtaque(e, c(e, 1), c(e, 2))).toBe(5);
  });
});

describe('poderes dos magos', () => {
  const com = (roupa: RoupaMago, postas: [string, Criatura, string][], gemas = 7) => cena(postas, { gemas, roupas: [roupa, roupa === 'pijama' ? 'peles' : 'pijama'] });
  const par: [string, Criatura, string][] = [['j1', 'ogre', '0,0'], ['j2', 'ogre', '3,0']];

  it('1 por vez, custa gemas, não gasta dado, e só os do mago', () => {
    const e = com('lencol', par);
    const f = ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'escudo', alvo: { criatura: 1 } });
    expect([f.magos.j1.gemas, f.magos.j1.dados.length, f.vez]).toEqual([6, 4, 'j1']);
    expect(dadosDefesa(f, c(f, 1))).toBe(5);
    expect(f.magos.j1.gratis).toBe(1);
    expect(ap(f, { tipo: 'dr_poder', id: 'j1', poder: 'copia', alvo: { casa: '1,0' } })).toBe(f);
    expect(ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'furia', alvo: { criatura: 1 } })).toBe(e);
    const pobre = com('lencol', par, 0);
    expect(ap(pobre, { tipo: 'dr_poder', id: 'j1', poder: 'escudo', alvo: { criatura: 1 } })).toBe(pobre);
  });
  it('Empurrão e Tempestade', () => {
    const e = com('trovoada', [['j1', 'ogre', '0,0'], ['j2', 'golem', '3,0'], ['j2', 'golem', '4,0']]);
    expect(c(ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'empurrao', alvo: { criatura: 2, casa: '2,0' } }), 2).casa).toBe('2,0');
    expect(ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'empurrao', alvo: { criatura: 2, casa: '4,0' } })).toBe(e);
    const t = ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'tempestade', alvo: { criatura: 2 } });
    expect([c(t, 2).ferimentos, c(t, 3).ferimentos]).toEqual([1, 1]);
    c(e, 2).ferimentos = 5;
    expect(cria(ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'tempestade', alvo: { criatura: 2 } }), 2)).toBeUndefined();
  });
  it('Cópia Fantasma: 1 viva, não age na volta em que aparece, some se ficar só', () => {
    const e = com('lencol', par);
    const f = ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'copia', alvo: { casa: '1,0' } });
    const fantasma = f.criaturas.find((x) => x.fantasma)!;
    expect(casasAndar(f, fantasma)).toEqual([]);
    const g = structuredClone(f);
    g.magos.j1.poderUsado = false;
    g.magos.j1.gemas = 7;
    expect(ap(g, { tipo: 'dr_poder', id: 'j1', poder: 'copia', alvo: { casa: '0,1' } })).toBe(g);
    g.vez = 'j2';
    g.magos.j1.gemas = g.magos.j2.gemas = 0;
    c(g, 2).casa = '0,1';
    const fim = ap(g, { tipo: 'dr_atacar', id: 'j2', i: 0, criatura: 2, alvo: 1 }, marcados(5, 5, 5, 0));
    expect(fim.fase).toBe('fim');
    expect(vivos(fim)).toEqual(['j2']);
  });
  it('Retoque tira 1 ferimento', () => {
    const e = com('pijama', par);
    expect(ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'retoque', alvo: { criatura: 1 } })).toBe(e);
    c(e, 1).ferimentos = 3;
    expect(c(ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'retoque', alvo: { criatura: 1 } }), 1).ferimentos).toBe(2);
  });
  it('Sono pára o inimigo e não repete na volta seguinte', () => {
    const e = com('pijama', par);
    const f = ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'sono', alvo: { criatura: 2 } });
    expect(casasAndar(f, c(f, 2))).toEqual([]);
    e.volta = 5;
    c(e, 2).ultimoSono = 4;
    expect(ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'sono', alvo: { criatura: 2 } })).toBe(e);
    c(e, 2).ultimoSono = 3;
    expect(ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'sono', alvo: { criatura: 2 } })).not.toBe(e);
  });
  it('Fúria e +1 ataque valem só no próximo ataque, 1 efeito por criatura', () => {
    const perto: [string, Criatura, string][] = [['j1', 'minotauro', '0,0'], ['j2', 'golem', '1,0']];
    let e = com('peles', perto, 3);
    e = ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'furia', alvo: { criatura: 1 } });
    expect(dadosAtaque(e, c(e, 1), c(e, 2))).toBe(6);
    e.magos.j2.gemas = 0;
    const f = ap(e, { tipo: 'dr_atacar', id: 'j1', i: 0, criatura: 1, alvo: 2 }, marcados(5, 5, 5, 5, 5, 5, 0));
    expect(c(f, 1).furia).toBe(false);
    const g = com('pedreiro', perto);
    c(g, 1).escudo = true;
    expect(ap(g, { tipo: 'dr_poder', id: 'j1', poder: 'maisAtaque', alvo: { criatura: 1 } })).toBe(g);
  });
  it('Muralha: 3 casas livres e juntas, até ao fim da volta', () => {
    const e = com('pedreiro', par);
    expect(ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'muralha', alvo: { casas: ['1,0', '2,0', '6,6'] } })).toBe(e);
    const f = ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'muralha', alvo: { casas: ['1,0', '1,1', '2,0'] } });
    expect(f.muralhas).toHaveLength(3);
    expect(casasAndar(f, c(f, 1))).not.toContain('1,0');
  });
  it('Troca duas criaturas de lugar', () => {
    const e = com('ilusionista', par);
    const f = ap(e, { tipo: 'dr_poder', id: 'j1', poder: 'troca', alvo: { criatura: 1, outra: 2 } });
    expect([c(f, 1).casa, c(f, 2).casa]).toEqual(['3,0', '0,0']);
  });
});

describe('partidas inteiras', () => {
  it('jogadas ao acaso nunca deixam o estado impossível', () => {
    for (let seed = 1; seed <= 12; seed++) {
      let e = novoDuelo(ids(2 + (seed % 3)), { obstaculos: 'muitos' }, T, [], seed);
      let x = seed * 7919;
      const acaso = (n: number) => (x = (x * 1103515245 + 12345) % 2147483648) % n;
      for (let i = 0; i < 400 && e.fase !== 'fim'; i++) {
        const antes = e;
        const meus = e.criaturas.filter((k) => k.dono === e.vez);
        const k = meus[acaso(Math.max(1, meus.length))];
        if (e.fase === 'vez' && k) {
          const i0 = acaso(e.magos[e.vez].dados.length);
          const alvo = alvosAtaque(e, k)[0];
          const onde = casasAndar(e, k);
          if (alvo) e = ap(e, { tipo: 'dr_atacar', id: e.vez, i: i0, criatura: k.id, alvo: alvo.id });
          else if (onde.length) e = ap(e, { tipo: 'dr_andar', id: e.vez, i: i0, criatura: k.id, casa: onde[acaso(onde.length)] });
        }
        if (e === antes) e = reduzDuelo(e, { tipo: 'tick' }, e.terminaEm);
        const casas = e.criaturas.map((q) => q.casa);
        expect(new Set(casas).size).toBe(casas.length);
        expect(casas.every((q) => e.tabuleiro.casas.includes(q) && !e.tabuleiro.obstaculos.includes(q))).toBe(true);
        expect(e.criaturas.every((q) => q.ferimentos >= 0 && q.ferimentos <= CRIATURAS[q.tipo].defesa)).toBe(true);
        expect(e.participantes.every((id) => e.magos[id].gemas >= 0 && e.magos[id].gemas <= 7)).toBe(true);
      }
    }
  });
});

describe('preparação no telemóvel', () => {
  it('+ e −: uma variante por classe, 3 classes, tinta', () => {
    let x = mudarExercito({}, 'duende', 1);
    expect(motivoNaoSomar(x, 'sapinho', 12)).toBe('variante');
    x = mudarExercito(mudarExercito(x, 'corvo', 1), 'golem', 1);
    expect(motivoNaoSomar(x, 'elfo', 30)).toBe('classes');
    expect(motivoNaoSomar(x, 'golem', 12)).toBe('tinta');
    expect(motivoNaoSomar(x, 'corvo', 12)).toBeNull();
    expect(mudarExercito(x, 'golem', -1)).toEqual({ duende: 1, corvo: 1 });
  });

  it('um desenho tem no máximo 8 KB e 12 cabem num só envio', () => {
    const enorme = Array.from({ length: 200 }, () => ({ c: 0, g: 0, p: Array.from({ length: 60 }, (_, i) => 100 + i) }));
    const l = limparDesenho(enorme);
    expect(l.length).toBeGreaterThan(10);
    expect(bytesTracos(l)).toBeLessThanOrEqual(MAX_BYTES_DESENHO);
    expect(limparDesenho('x')).toEqual([]);
    expect(12 * MAX_BYTES_DESENHO).toBeLessThan(100_000);
  });

  it('a vista da preparação diz que há desenho mas não leva os traços', () => {
    let e = novoDuelo(ids(2), {}, T);
    for (const f of ['mago', 'exercito']) if (e.fase === f) e = reduzDuelo(e, { tipo: 'tick' }, e.terminaEm);
    const criatura = Object.keys(e.magos.j1.exercito!)[0] as Criatura;
    e = ap(e, { tipo: 'dr_desenho', id: 'j1', criatura, tracos: [{ c: 0, g: 0, p: [1, 2, 3, 4] }] });
    expect(vistaDuelo(e).magos.j1.desenhos).toEqual({ [criatura]: [] });
    expect(e.magos.j1.desenhos[criatura]).toHaveLength(1);
  });

  it('obstáculos inválidos = padrão', () => {
    expect(novoDuelo(ids(2), { obstaculos: 'x' as never }, T).def.obstaculos).toBe('poucos');
  });
});

describe('saída a meio', () => {
  it('na preparação com 2: acaba e ganha quem ficou', () => {
    const e = sairDuelo(novoDuelo(ids(2), {}, T), 'j1', T);
    expect(e.fase).toBe('fim');
    expect(classificacao(e)[0].id).toBe('j2');
  });

  it('na preparação com 3: sai da mesa, colmeia de 2, e segue se os outros já fizeram', () => {
    let e = novoDuelo(ids(3), {}, T);
    e = ap(e, { tipo: 'dr_mago', id: 'j1', roupa: 'peles' });
    e = ap(e, { tipo: 'dr_mago', id: 'j2', roupa: 'lencol' });
    e = sairDuelo({ ...e, pausaRestante: 100 }, 'j3', T);
    expect(e).toMatchObject({ fase: 'exercito', participantes: ['j1', 'j2'], audiencia: ['j3'], pausaRestante: 60_000 });
    expect(e.tabuleiro.cantos).toHaveLength(2);
    expect(importanteDuelo(e, 'j3')).toBe(false);
  });

  it('na batalha: perde as criaturas; com 3 a vez passa, com 2 acaba', () => {
    let e = preparar([{ lobo: 1 }, { ogre: 1 }, { elfo: 1 }]);
    for (const id of e.participantes) e = ap(e, { tipo: 'dr_pronto', id });
    expect(e.fase).toBe('vez');
    const sai = e.vez;
    const s = sairDuelo(e, sai, T);
    expect(s.criaturas.some((x) => x.dono === sai)).toBe(false);
    expect(s.vez).not.toBe(sai);
    expect(s.fase).not.toBe('fim');
    expect(foraDuelo(s, sai)).toBe(true);
    const [a, b] = s.participantes.filter((x) => x !== sai);
    const f = sairDuelo(s, a, T);
    expect(f.fase).toBe('fim');
    expect(classificacao(f).map((x) => x.id)).toEqual([b, a, sai]);
  });

  it('a meio do combate: o combate pára e a partida segue', () => {
    const e = cena([
      ['j1', 'ogre', '0,0'],
      ['j2', 'golem', '1,0'],
      ['j3', 'elfo', '9,9'],
    ]);
    const b = { ...e, fase: 'batalha' as const, batalha: { de: e.criaturas[0].id, alvo: e.criaturas[1].id, ataque: [1], defesa: [0], feridaAtaque: [], feridaDefesa: [] } };
    const s = sairDuelo(b, 'j2', T);
    expect(s.batalha).toBeNull();
    expect(s.fase).not.toBe('batalha');
    expect(s.criaturas.map((x) => x.dono)).toEqual(['j1', 'j3']);
  });
});
