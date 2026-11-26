import { describe, expect, it } from 'vitest';
import { CUSTO, MAGOS_PODERES, exercitosProntos, type Criatura, type Exercito, type Poder, type RoupaMago } from './criaturas';
import { acaoModo, facesLado, modos, motivoPoder, opcoesModo, passoPoder, poderCompleto, tocarPoder, total } from './jogadas';
import { cria, desenhosDuelo, novoDuelo, privadoDuelo, reduzDuelo, vistaDuelo, type AcaoDuelo, type AlvoPoder, type EstadoDuelo } from './regras';

const T = 1_000;
const RISCO = [{ c: 0, g: 0, p: [10, 10, 60, 60] }];
const ap = (e: EstadoDuelo, a: AcaoDuelo) => reduzDuelo(e, a, T);

function preparar(semente = 7, exercitos: Exercito[] = exercitosProntos(12), roupas: RoupaMago[] = ['trovoada', 'pijama']): EstadoDuelo {
  let e = novoDuelo(['j1', 'j2'], {}, T, [], semente);
  e.participantes.forEach((id, i) => (e = ap(e, { tipo: 'dr_mago', id, roupa: roupas[i] })));
  e.participantes.forEach((id, i) => (e = ap(e, { tipo: 'dr_exercito', id, exercito: exercitos[i] })));
  e.participantes.forEach((id) => (e = ap(e, { tipo: 'dr_desenho', id, criatura: Object.keys(e.magos[id].exercito!)[0] as Criatura, tracos: RISCO, pronto: true })));
  return e;
}

/** vez do j1, com coringas e 7 gemas */
function vez(roupa: RoupaMago = 'trovoada', exercitos?: Exercito[]): EstadoDuelo {
  let e = preparar(7, exercitos, [roupa, roupa === 'pijama' ? 'trovoada' : 'pijama']);
  e.comecou = 'j1';
  for (const id of e.participantes) Object.assign(e.magos[id], { gemas: 7, dados: ['coringa', 'coringa', 'coringa', 'coringa'] });
  for (const id of e.participantes) e = ap(e, { tipo: 'dr_pronto', id });
  expect(e.vez).toBe('j1');
  return e;
}

describe('desenhos uma só vez', () => {
  it('a vista nunca leva traços; o privado leva-os da batalha em diante e não muda', () => {
    const antes = novoDuelo(['j1', 'j2'], {}, T);
    expect(privadoDuelo(antes)).toBeNull();
    const e = vez();
    expect(JSON.stringify(vistaDuelo(e))).not.toContain('"p":[');
    const p = JSON.stringify(privadoDuelo(e));
    expect(p).toContain('"p":[');
    const depois = ap(e, { tipo: 'dr_passar', id: 'j1', i: 0 });
    expect(depois).not.toBe(e);
    expect(JSON.stringify(privadoDuelo(depois))).toBe(p);
  });
  it('só vão os que têm riscos', () => {
    const e = preparar();
    expect(Object.keys(desenhosDuelo(e).j1)).toHaveLength(1);
    e.magos.j1.desenhos = { ogre: [] };
    expect(desenhosDuelo(e).j1).toEqual({});
  });
});

describe('passos da vez', () => {
  it('o dado manda nos modos e tudo o que fica aceso é aceite', () => {
    // linha da frente encostada, para haver ataques e especiais
    const e = vez('trovoada', [{ velhoPescador: 1, carvalho: 1, elfo: 1 }, { duende: 6 }]);
    const [a, b, c] = e.criaturas.filter((x) => x.dono === 'j1');
    const ini = e.criaturas.filter((x) => x.dono === 'j2');
    const livres = e.tabuleiro.casas.filter((x) => !e.tabuleiro.obstaculos.includes(x));
    [a.casa, b.casa, c.casa] = livres.slice(0, 3);
    ini.forEach((x, i) => (x.casa = livres[8 + i * 2]));
    const vistos = new Set<string>();
    for (const x of [a, b, c])
      for (const m of modos(e, x, 'coringa')) {
        const o = opcoesModo(e, x, m);
        for (const casa of o.casas) expect(ap(e, { id: 'j1', ...acaoModo(m, 0, x.id, casa, undefined) } as AcaoDuelo)).not.toBe(e);
        for (const n of o.alvos) expect(ap(e, { id: 'j1', ...acaoModo(m, 0, x.id, cria(e, n)!.casa, n) } as AcaoDuelo)).not.toBe(e);
        vistos.add(m);
      }
    expect([...vistos].sort()).toEqual(['andar', 'atacar', 'especial']);
    expect(modos(e, b, 'andar')).not.toContain('especial');
    expect(modos(e, b, 'fazer')).not.toContain('andar');
    expect(modos(e, b, 'fazer')).not.toContain('especial');
    expect(modos(e, b, 'habilidade')).toEqual(['especial']);
  });
  it('faces e total da batalha, pela ordem do relançar', () => {
    expect(facesLado([0, 2], ['gema'], true)).toEqual(['ataqueVazio', 'ataque2', 'feridaGema']);
    expect(total([0, 2], ['espada', 'escudo'], true)).toBe(3);
    expect(total([1, 1], ['espada', 'escudo'], false)).toBe(3);
  });
});

describe('poderes passo a passo', () => {
  for (const roupa of Object.keys(MAGOS_PODERES) as RoupaMago[])
    for (const poder of MAGOS_PODERES[roupa] as Poder[])
      it(`${roupa}: ${poder} chega ao fim e o reducer aceita qualquer primeiro toque`, () => {
        const e = vez(roupa);
        e.criaturas.forEach((c) => (c.ferimentos = 1));
        expect(motivoPoder(e, 'j1', poder)).toBeNull();
        const toques = (a: AlvoPoder) => {
          const o = passoPoder(e, 'j1', poder, a);
          return [...o.casas.map((x) => tocarPoder(poder, a, x, undefined)), ...o.alvos.map((n) => tocarPoder(poder, a, cria(e, n)!.casa, n))];
        };
        for (const primeiro of toques({})) {
          let a = primeiro;
          while (!poderCompleto(poder, a)) {
            const l = toques(a);
            expect(l.length).toBeGreaterThan(0);
            a = l[l.length - 1];
          }
          expect(toques(a)).toEqual([]);
          expect(ap(e, { tipo: 'dr_poder', id: 'j1', poder, alvo: a })).not.toBe(e);
        }
      });
  it('a cinzento: usado, sem gemas, sem alvo', () => {
    const e = vez('pijama');
    expect(motivoPoder(e, 'j1', 'retoque')).toBe('alvo');
    e.magos.j1.gemas = CUSTO.sono - 1;
    expect(motivoPoder(e, 'j1', 'sono')).toBe('gemas');
    e.magos.j1.poderUsado = true;
    expect(motivoPoder(e, 'j1', 'sono')).toBe('usado');
  });
});
