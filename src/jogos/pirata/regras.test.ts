import { describe, expect, it } from 'vitest';
import {
  T_ARTILHEIRO,
  T_CARTA,
  T_NOITE,
  contarPapeis,
  expulsoDia,
  limiarVigia,
  novoPirata,
  privadoPirata,
  reduzPirata,
  vistaPirata,
  DEF_PADRAO_PIRATA,
  type AcaoPirata,
  type EstadoPirata,
  type Papel,
} from './regras';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);
const de = (e: EstadoPirata, p: Papel) => e.participantes.filter((id) => e.papeis[id] === p);
const r = (e: EstadoPirata, a: AcaoPirata, t = 0) => reduzPirata(e, a, t);
const fimFase = (e: EstadoPirata) => reduzPirata(e, { tipo: 'tick' }, e.terminaEm);

/** começa e passa a carta: fica na 1.ª noite */
function noite(n: number, def = {}): EstadoPirata {
  const e = novoPirata(ids(n), def, 0);
  return fimFase(e);
}

/** papéis fixos para testes */
function com(papeis: Papel[], def = {}): EstadoPirata {
  const e = noite(papeis.length, def);
  return { ...e, papeis: Object.fromEntries(e.participantes.map((id, i) => [id, papeis[i]])) };
}

describe('Pirata', () => {
  it('distribuição de papéis por nº de jogadores (5 e 16)', () => {
    expect(contarPapeis(5)).toEqual({ piratas: 1, artilheiro: false });
    expect(contarPapeis(7)).toEqual({ piratas: 2, artilheiro: true });
    expect(contarPapeis(11).piratas).toBe(3);
    expect(contarPapeis(16).piratas).toBe(4);
    expect(contarPapeis(8, false).artilheiro).toBe(false);
    for (const n of [5, 6, 7, 10, 11, 14, 15, 16]) {
      const e = novoPirata(ids(n), {}, n * 13);
      const conta = (p: Papel) => Object.values(e.papeis).filter((x) => x === p).length;
      expect(Object.keys(e.papeis).length).toBe(n);
      expect(conta('pirata')).toBe(contarPapeis(n).piratas);
      expect(conta('vigia')).toBe(1);
      expect(conta('medico')).toBe(1);
      expect(conta('artilheiro')).toBe(n >= 7 ? 1 : 0);
    }
    const e = novoPirata(ids(18), {}, 0);
    expect(e.participantes.length).toBe(16);
    expect(e.audiencia).toEqual(['j17', 'j18']);
  });

  it('limiar da vigia: 2 com 6, senão 3; a definição manda', () => {
    expect(limiarVigia(DEF_PADRAO_PIRATA, 6)).toBe(2);
    expect(limiarVigia({ ...DEF_PADRAO_PIRATA, vigiar: 2 }, 5)).toBe(2);
    expect(limiarVigia(DEF_PADRAO_PIRATA, 7)).toBe(3);
    expect(limiarVigia({ ...DEF_PADRAO_PIRATA, vigiar: 5 }, 6)).toBe(5);
  });

  it('a vista pública nunca leva papéis; cada privado só leva o seu', () => {
    const e = noite(8);
    const txt = JSON.stringify(vistaPirata(e));
    for (const p of ['pirata', 'vigia', 'medico', 'artilheiro', 'marinheiro']) expect(txt).not.toContain(`:"${p}"`);
    for (const id of e.participantes) {
      const p = privadoPirata(e, id)!;
      expect(p.papel).toBe(e.papeis[id]);
      const outros = JSON.stringify(p);
      // nenhum privado nomeia o papel de outra pessoa, salvo os companheiros piratas de um pirata
      if (p.papel !== 'pirata') expect(p.companheiros).toEqual([]);
      else expect(p.companheiros.sort()).toEqual(de(e, 'pirata').filter((x) => x !== id).sort());
      expect(outros).not.toContain('papeis');
    }
    expect(privadoPirata(e, 'ninguem')).toBeNull();
  });

  it('carta 20 s, noite sempre 45 s completos mesmo com todos escolhidos', () => {
    const e = novoPirata(ids(5), {}, 0);
    expect(e.fase).toBe('carta');
    expect(e.terminaEm).toBe(T_CARTA * 1000);
    let s = fimFase(e);
    expect(s.fase).toBe('noite');
    expect(s.terminaEm).toBe(T_CARTA * 1000 + T_NOITE * 1000);
    for (const id of s.participantes) s = r(s, { tipo: 'pr_noite', id, alvo: s.participantes.find((x) => x !== id)! });
    expect(s.fase).toBe('noite');
    expect(fimFase(s).fase).toBe('amanhecer');
  });

  it('piratas: maioria; empate = sorteio entre os empatados; ninguém = ninguém sai', () => {
    let e = com(['pirata', 'pirata', 'vigia', 'medico', 'marinheiro', 'marinheiro', 'marinheiro']);
    e = r(e, { tipo: 'pr_noite', id: 'j1', alvo: 'j5' });
    e = r(e, { tipo: 'pr_noite', id: 'j2', alvo: 'j6' });
    // o pirata vê o voto do outro, só no seu privado
    expect(privadoPirata(e, 'j1')!.votosPiratas).toEqual({ j2: 'j6' });
    expect(privadoPirata(e, 'j5')!.votosPiratas).toEqual({});
    const s = fimFase(e);
    expect(['j5', 'j6']).toContain(s.historico[0].vitima);
    expect(s.vivos.length).toBe(6);
    const vazio = fimFase(com(['pirata', 'vigia', 'medico', 'marinheiro', 'marinheiro']));
    expect(vazio.historico[0].vitima).toBeNull();
    expect(vistaPirata(vazio).vitima).toBeNull();
  });

  it('médico salva; não repete na noite seguinte; pode proteger-se', () => {
    let e = com(['pirata', 'vigia', 'medico', 'marinheiro', 'marinheiro', 'marinheiro']);
    e = r(e, { tipo: 'pr_noite', id: 'j1', alvo: 'j4' });
    e = r(e, { tipo: 'pr_noite', id: 'j3', alvo: 'j4' });
    e = fimFase(e);
    expect(e.historico[0]).toMatchObject({ alvo: 'j4', salvo: true, vitima: null });
    expect(e.vivos.length).toBe(6);
    // amanhecer → discussão → votar (ninguém) → resultado → noite 2
    e = fimFase(fimFase(fimFase(fimFase(e))));
    expect(e.fase).toBe('noite');
    expect(privadoPirata(e, 'j3')!.bloqueado).toBe('j4');
    expect(r(e, { tipo: 'pr_noite', id: 'j3', alvo: 'j4' })).toBe(e);
    expect(r(e, { tipo: 'pr_noite', id: 'j3', alvo: 'j3' }).escolhas.j3).toBe('j3');
    // os outros não podem escolher a si próprios
    expect(r(e, { tipo: 'pr_noite', id: 'j2', alvo: 'j2' })).toBe(e);
  });

  it('vigia descobre se é pirata (só no seu privado, só no amanhecer)', () => {
    let e = com(['pirata', 'vigia', 'medico', 'marinheiro', 'marinheiro']);
    e = r(e, { tipo: 'pr_noite', id: 'j2', alvo: 'j1' });
    e = fimFase(e);
    expect(privadoPirata(e, 'j2')!.resultado).toEqual({ tipo: 'vigia', alvo: 'j1', pirata: true });
    for (const id of ['j1', 'j3', 'j4', 'j5']) expect(privadoPirata(e, id)!.resultado).toBeNull();
    expect(JSON.stringify(vistaPirata(e))).not.toContain('"pirata":true');
    expect(privadoPirata(fimFase(e), 'j2')!.resultado).toBeNull();
    // mas fica no histórico privado ("Noite 1: …"), só do próprio
    expect(privadoPirata(fimFase(e), 'j2')!.diario).toEqual([{ tipo: 'vigia', alvo: 'j1', pirata: true, n: 1 }]);
    expect(privadoPirata(fimFase(e), 'j4')!.diario).toEqual([]);
    expect(JSON.stringify(vistaPirata(fimFase(e)))).not.toContain('diario');
  });

  it('limiar da vigia: nenhuma em jogos de 5; com 6 → 2; conta pelos vivos', () => {
    expect(limiarVigia(DEF_PADRAO_PIRATA, 5)).toBeNull();
    expect(limiarVigia(DEF_PADRAO_PIRATA, 8, 6)).toBe(2);
    expect(limiarVigia(DEF_PADRAO_PIRATA, 8, 7)).toBe(3);
    // 5 jogadores: 2 marinheiros no mesmo alvo não descobrem nada
    let e = com(['pirata', 'vigia', 'medico', 'marinheiro', 'marinheiro']);
    for (const id of ['j4', 'j5']) e = r(e, { tipo: 'pr_noite', id, alvo: 'j1' });
    e = fimFase(e);
    expect(privadoPirata(e, 'j4')!.resultado).toBeNull();
  });

  it('vigia dos marinheiros: só com ≥ N no mesmo alvo, só esses sabem; pode haver 2 alvos', () => {
    // 10 jogadores → N = 3
    let e = com(['pirata', 'pirata', 'vigia', 'medico', 'artilheiro', 'marinheiro', 'marinheiro', 'marinheiro', 'marinheiro', 'marinheiro']);
    // 3 marinheiros vigiam j3 (vigia: sai), 2 vigiam j5 (artilheiro: não chega a N)
    for (const id of ['j6', 'j7', 'j8']) e = r(e, { tipo: 'pr_noite', id, alvo: 'j3' });
    for (const id of ['j9', 'j10']) e = r(e, { tipo: 'pr_noite', id, alvo: 'j5' });
    // escolhas de piratas e especiais não contam para a vigia
    e = r(e, { tipo: 'pr_noite', id: 'j1', alvo: 'j5' });
    e = fimFase(e);
    for (const id of ['j6', 'j7', 'j8']) expect(privadoPirata(e, id)!.resultado).toEqual({ tipo: 'vigiar', alvo: 'j3', saiu: true });
    for (const id of ['j9', 'j10']) expect(privadoPirata(e, id)!.resultado).toBeNull();
    // dois alvos a chegar a N (6 jogadores → N = 2)
    let f = com(['pirata', 'vigia', 'medico', 'marinheiro', 'marinheiro', 'marinheiro']);
    f = { ...f, papeis: { ...f.papeis, j1: 'marinheiro', j2: 'marinheiro', j3: 'pirata' } };
    // marinheiros: j1, j2, j4, j5, j6 · pirata j3 · vigia/medico substituídos
    for (const id of ['j1', 'j2']) f = r(f, { tipo: 'pr_noite', id, alvo: 'j3' });
    for (const id of ['j4', 'j5']) f = r(f, { tipo: 'pr_noite', id, alvo: 'j6' });
    f = fimFase(f);
    expect(privadoPirata(f, 'j1')!.resultado).toEqual({ tipo: 'vigiar', alvo: 'j3', saiu: true });
    expect(privadoPirata(f, 'j4')!.resultado).toEqual({ tipo: 'vigiar', alvo: 'j6', saiu: false });
  });

  it('votação do dia: mais votado; "ninguém" conta; empate = ninguém; acaba quando todos votam', () => {
    expect(expulsoDia({ a: 'x', b: 'x', c: 'y' })).toBe('x');
    expect(expulsoDia({ a: 'x', b: 'y' })).toBeNull();
    expect(expulsoDia({ a: null, b: null, c: 'x' })).toBeNull();
    expect(expulsoDia({})).toBeNull();
    let e = com(['pirata', 'vigia', 'medico', 'marinheiro', 'marinheiro', 'marinheiro']);
    e = fimFase(fimFase(fimFase(e))); // amanhecer, discussão → votar
    expect(e.fase).toBe('votar');
    e = r(e, { tipo: 'pr_votar', id: 'j2', alvo: 'j2' });
    expect(e.votos).toEqual({});
    e = r(e, { tipo: 'pr_votar', id: 'j2', alvo: 'j1' });
    expect(r(e, { tipo: 'pr_votar', id: 'j2', alvo: 'j3' })).toBe(e); // só uma vez
    expect(vistaPirata(e).votaram).toEqual(['j2']);
    for (const id of ['j3', 'j4', 'j5']) e = r(e, { tipo: 'pr_votar', id, alvo: 'j1' });
    e = r(e, { tipo: 'pr_votar', id: 'j6', alvo: null });
    expect(e.fase).toBe('votar');
    e = r(e, { tipo: 'pr_votar', id: 'j1', alvo: 'j2' });
    expect(e.fase).toBe('resultado');
    expect(vistaPirata(e).expulso).toBe('j1');
    expect(vistaPirata(e).contagem).toEqual({ j1: 4, j2: 1, '': 1 });
    // sem piratas → tripulação ganha
    e = fimFase(e);
    expect(e.fase).toBe('fim');
    expect(e.vencedor).toBe('tripulacao');
  });

  it('piratas ganham quando são ≥ os outros; pontos: equipa +1000, vivo +300; fim revela tudo', () => {
    let e = com(['pirata', 'vigia', 'medico', 'marinheiro', 'marinheiro']);
    e = { ...e, vivos: ['j1', 'j2', 'j4'] };
    e = r(e, { tipo: 'pr_noite', id: 'j1', alvo: 'j2' });
    e = fimFase(fimFase(e));
    expect(e.fase).toBe('fim');
    expect(e.vencedor).toBe('piratas');
    expect(e.pontos.j1).toBe(1300);
    expect(e.pontos.j4).toBe(300);
    expect(e.pontos.j2).toBe(0);
    const v = vistaPirata(e);
    expect(v.papeis.j1).toBe('pirata');
    expect(v.historico.length).toBe(1);
    expect(v.podio[0].id).toBe('j1');
  });

  it('artilheiro: ao sair à noite escolhe quem leva (20 s); sem escolha não leva ninguém', () => {
    const base = com(['pirata', 'pirata', 'vigia', 'medico', 'artilheiro', 'marinheiro', 'marinheiro', 'marinheiro']);
    let e = r(base, { tipo: 'pr_noite', id: 'j1', alvo: 'j5' });
    e = r(e, { tipo: 'pr_noite', id: 'j2', alvo: 'j5' });
    e = fimFase(fimFase(e)); // amanhecer → artilheiro
    expect(e.fase).toBe('artilheiro');
    expect(e.terminaEm - T_ARTILHEIRO * 1000).toBeGreaterThan(0);
    expect(vistaPirata(e).artilheiro).toEqual({ id: 'j5', levou: null });
    expect(r(e, { tipo: 'pr_levar', id: 'j6', alvo: 'j1' })).toBe(e);
    const levou = r(e, { tipo: 'pr_levar', id: 'j5', alvo: 'j1' });
    expect(levou.fase).toBe('disparo');
    expect(vistaPirata(levou).artilheiro).toEqual({ id: 'j5', levou: 'j1' });
    expect(levou.vivos).not.toContain('j1');
    expect(fimFase(levou).fase).toBe('discussao');
    const nada = fimFase(fimFase(e));
    expect(nada.vivos.length).toBe(7);
    expect(nada.fase).toBe('discussao');
  });

  it('artilheiro expulso de dia leva alguém e pode acabar o jogo', () => {
    let e = com(['pirata', 'vigia', 'medico', 'artilheiro', 'marinheiro', 'marinheiro', 'marinheiro']);
    e = fimFase(fimFase(fimFase(e))); // votar
    for (const id of ['j1', 'j2', 'j3', 'j5', 'j6', 'j7']) e = r(e, { tipo: 'pr_votar', id, alvo: 'j4' });
    e = r(e, { tipo: 'pr_votar', id: 'j4', alvo: null });
    expect(e.expulso).toBe('j4');
    e = fimFase(e);
    expect(e.fase).toBe('artilheiro');
    e = r(e, { tipo: 'pr_levar', id: 'j4', alvo: 'j1' });
    e = fimFase(e);
    expect(e.fase).toBe('fim');
    expect(e.vencedor).toBe('tripulacao');
  });

  it('sem artilheiro nas definições ninguém o recebe', () => {
    const e = novoPirata(ids(8), { artilheiro: false }, 3);
    expect(Object.values(e.papeis)).not.toContain('artilheiro');
  });

  it('os que saem não agem; o líder pode encurtar a discussão', () => {
    let e = com(['pirata', 'vigia', 'medico', 'marinheiro', 'marinheiro', 'marinheiro']);
    e = { ...e, vivos: e.vivos.filter((x) => x !== 'j6') };
    expect(r(e, { tipo: 'pr_noite', id: 'j6', alvo: 'j1' })).toBe(e);
    expect(r(e, { tipo: 'pr_noite', id: 'j1', alvo: 'j6' })).toBe(e);
    e = fimFase(fimFase(e));
    expect(e.fase).toBe('discussao');
    expect(r(e, { tipo: 'pr_votar_ja', id: 'j2' }).fase).toBe('votar');
    expect(privadoPirata(e, 'j6')!.vivo).toBe(false);
  });

  it('desligar e voltar: pausa abaixo de 3 ligados e retoma com o tempo que faltava', () => {
    let e = noite(5);
    const falta = e.terminaEm - 1000;
    e = r(e, { tipo: 'ligados', ids: ['j1', 'j2'] }, 1000);
    expect(e.pausaRestante).toBe(falta);
    expect(r(e, { tipo: 'tick' }, 999999)).toBe(e);
    expect(r(e, { tipo: 'pr_noite', id: 'j1', alvo: 'j2' })).toBe(e);
    e = r(e, { tipo: 'ligados', ids: ids(5) }, 5000);
    expect(e.pausaRestante).toBeNull();
    expect(e.terminaEm).toBe(5000 + falta);
    // o papel continua o mesmo depois de voltar
    expect(privadoPirata(e, 'j3')!.papel).toBe(e.papeis.j3);
  });
});
