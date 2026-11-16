import { describe, expect, it } from 'vitest';
import { contarPapeis, elegiveis, novoMaquinas, poderDe, privadoMaquinas, reduzMaquinas, vistaMaquinas, type AcaoMaquinas, type Carta, type EstadoMaquinas } from './regras';

const T = 1_000_000;
const ids = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);
const novo = (n: number) => novoMaquinas(ids(n), {}, T);
const r = (e: EstadoMaquinas, ...a: AcaoMaquinas[]) => a.reduce((s, x) => reduzMaquinas(s, x, T), e);
const tick = (e: EstadoMaquinas) => reduzMaquinas(e, { tipo: 'tick' }, e.terminaEm);

/** até à votação, com o Piloto dado (ou o 1.º elegível) */
function governo(e: EstadoMaquinas, piloto?: string, sim = true): EstadoMaquinas {
  if (e.fase === 'carta') e = tick(e);
  e = r(e, { tipo: 'rm_piloto', id: e.comandante, alvo: piloto ?? elegiveis(e)[0] });
  e = r(e, ...e.vivos.map((id) => ({ tipo: 'rm_votar' as const, id, sim })));
  return tick(e); // votos revelados → segue
}
/** governo aprovado que mete a carta `c` (força a mão) */
function meter(e: EstadoMaquinas, c: Carta, piloto?: string): EstadoMaquinas {
  e = governo(e, piloto);
  if (e.fase !== 'comandante') return e;
  e = { ...e, mao: [c, c, c] };
  e = r(e, { tipo: 'rm_descartar', id: e.comandante, i: 0 });
  return r(e, { tipo: 'rm_escolher', id: e.piloto!, i: 0 });
}
/** depois de "entrou": passa poder (sorteio) / ver / discussão até nova ronda */
function seguir(e: EstadoMaquinas): EstadoMaquinas {
  while (e.fase !== 'nomear' && e.fase !== 'fim') e = tick(e);
  return e;
}
const sem = (e: EstadoMaquinas, papel: string) => e.participantes.filter((id) => e.papeis[id] !== papel);

describe('Revolução das Máquinas', () => {
  it('papéis por n.º de jogadores (5–10)', () => {
    for (const [n, a] of [[5, 1], [6, 1], [7, 2], [8, 2], [9, 3], [10, 3]]) {
      const e = novo(n);
      const p = Object.values(e.papeis);
      expect(p.filter((x) => x === 'amotinado').length).toBe(a);
      expect(p.filter((x) => x === 'ia').length).toBe(1);
      expect(p.length).toBe(n);
    }
    expect(novoMaquinas(ids(12), {}, T).participantes.length).toBe(10);
    expect(contarPapeis(6).iaSabe).toBe(true);
    expect(contarPapeis(7).iaSabe).toBe(false);
  });

  it('baralho 6 🔧 + 11 💥; a vista nunca leva papéis nem cartas', () => {
    const e = novo(7);
    expect(e.baralho.filter((c) => c === 'R').length).toBe(6);
    expect(e.baralho.length).toBe(17);
    const g = governo(e);
    expect(g.fase).toBe('comandante');
    const txt = JSON.stringify(vistaMaquinas(g));
    expect(txt).not.toMatch(/amotinado|"ia"|"mao"/);
    expect(vistaMaquinas(g).papeis).toEqual({});
  });

  it('privado: Amotinados veem aliados e a IA; IA só sabe com 5–6; mão só para quem a tem', () => {
    for (const n of [6, 8]) {
      const e = governo(novo(n));
      const am = e.participantes.filter((id) => e.papeis[id] === 'amotinado');
      const ia = e.participantes.find((id) => e.papeis[id] === 'ia')!;
      const p = privadoMaquinas(e, am[0])!;
      expect(p.ia).toBe(ia);
      expect(p.aliados).toEqual(am.slice(1));
      expect(privadoMaquinas(e, ia)!.aliados).toEqual(n <= 6 ? am : []);
      const trip = sem(e, 'amotinado').find((id) => e.papeis[id] === 'tripulacao')!;
      expect(privadoMaquinas(e, trip)!.aliados).toEqual([]);
      expect(privadoMaquinas(e, e.comandante)!.mao.length).toBe(3);
      expect(privadoMaquinas(e, e.piloto!)!.mao.length).toBe(0);
    }
  });

  it('bloqueados: o governo anterior não pode ser Piloto', () => {
    let e = meter(novo(7), 'R');
    const antes = [e.comandante, e.piloto];
    e = seguir(e);
    antes.forEach((id) => expect(elegiveis(e)).not.toContain(id));
    expect(vistaMaquinas(e).bloqueados.sort()).toEqual(antes.filter((x) => x !== e.comandante).sort());
  });

  it('empate ou mais Não = falha; 3 falhas = carta do topo sem poder, contador a 0, ninguém bloqueado', () => {
    let e = novo(6);
    const c1 = (e = tick(e)).comandante;
    e = governo(e, undefined, false);
    expect(e.falhas).toBe(1);
    expect(e.comandante).not.toBe(c1);
    // empate: 3 sim, 3 não
    e = r(e, { tipo: 'rm_piloto', id: e.comandante, alvo: elegiveis(e)[0] });
    e = r(e, ...e.vivos.map((id, i) => ({ tipo: 'rm_votar' as const, id, sim: i < 3 })));
    expect(e.ultimaVotacao?.aprovado).toBe(false);
    e = tick(e);
    expect(e.falhas).toBe(2);
    const topo = e.baralho[0];
    e = governo(e, undefined, false);
    expect(e.fase).toBe('entrou');
    expect(e.entrou).toEqual({ carta: topo, caos: true });
    expect(e.falhas).toBe(0);
    expect(e.bloqueados).toEqual([]);
    e = tick(e);
    expect(e.fase).toBe('nomear'); // sem poder
  });

  it('voto em falta = Não; sem escolha = sorteio', () => {
    let e = tick(novo(5));
    e = tick(e); // piloto sorteado
    expect(e.fase).toBe('votar');
    expect(e.piloto).not.toBeNull();
    e = r(e, { tipo: 'rm_votar', id: 'j1', sim: true }, { tipo: 'rm_votar', id: 'j1', sim: false });
    expect(e.votos.j1).toBe(true); // só uma vez
    e = tick(e);
    expect(Object.values(e.ultimaVotacao!.votos).filter((x) => !x).length).toBe(4);
  });

  it('sessão secreta: descarta 1 de 3, escolhe 1 de 2; +100 a quem mete a carta da sua cor', () => {
    let e = governo(novo(7));
    e = { ...e, mao: ['R', 'S', 'S'] };
    e = r(e, { tipo: 'rm_escolher', id: e.comandante, i: 0 }); // não é a vez do Piloto
    expect(e.fase).toBe('comandante');
    e = r(e, { tipo: 'rm_descartar', id: e.comandante, i: 1 });
    expect(e.mao).toEqual(['R', 'S']);
    const [c, p] = [e.comandante, e.piloto!];
    e = r(e, { tipo: 'rm_escolher', id: p, i: 0 });
    expect(e.reparacoes).toBe(1);
    expect(e.descartes.length).toBe(2);
    expect(e.pontos[c]).toBe(e.papeis[c] === 'tripulacao' ? 100 : 0);
    expect(e.pontos[p]).toBe(e.papeis[p] === 'tripulacao' ? 100 : 0);
  });

  it('baralho acaba: volta a baralhar com os descartes', () => {
    let e = governo(novo(7));
    e = { ...e, baralho: ['R'], descartes: ['S', 'S', 'R', 'S'], fase: 'votos', ultimaVotacao: { votos: {}, aprovado: true } };
    e = { ...e, papeis: { ...e.papeis, [e.piloto!]: 'tripulacao' } };
    e = tick(e);
    expect(e.mao.length).toBe(3);
    expect(e.baralho.length + e.mao.length).toBe(5);
    expect(e.descartes).toEqual([]);
  });

  it('poderes por tabela', () => {
    expect([1, 2, 3, 4, 5].map((s) => poderDe(5, s))).toEqual([null, null, 'espiar', 'ejetar', 'ejetar']);
    expect([1, 2, 3, 4, 5].map((s) => poderDe(8, s))).toEqual([null, 'investigar', 'eleger', 'ejetar', 'ejetar']);
    expect([1, 2, 3, 4, 5].map((s) => poderDe(9, s))).toEqual(['investigar', 'investigar', 'eleger', 'ejetar', 'ejetar']);
  });

  it('🔍 investigar: só o Comandante vê a equipa; 📢 eleger: o eleito é o próximo e a rotação continua', () => {
    let e = novo(9);
    e = { ...e, papeis: Object.fromEntries(e.participantes.map((id, i) => [id, i === 8 ? 'ia' : 'tripulacao'])) };
    e = tick(meter(e, 'S'));
    expect(e.fase).toBe('poder');
    const alvo = e.participantes[8];
    e = r(e, { tipo: 'rm_poder', id: e.comandante, alvo });
    expect(e.fase).toBe('ver');
    expect(privadoMaquinas(e, e.comandante)!.resultado).toEqual({ tipo: 'investigar', alvo, equipa: 'amotinados' });
    expect(privadoMaquinas(e, alvo)!.resultado).toBeNull();
    expect(JSON.stringify(vistaMaquinas(e))).not.toContain('amotinados');
    e = seguir(r(e, { tipo: 'rm_visto', id: e.comandante }));
    // 3 sabotagens com 9 → eleger
    e = { ...e, sabotagens: 2 };
    e = tick(meter(e, 'S'));
    expect(e.poder).toBe('eleger');
    const rot = e.rotacao;
    e = r(e, { tipo: 'rm_poder', id: e.comandante, alvo: 'j1' === e.comandante ? 'j2' : 'j1' });
    const eleito = e.eleito;
    e = seguir(e);
    expect(e.comandante).toBe(eleito);
    e = seguir(meter(e, 'R'));
    expect(e.rotacao).toBe((rot + 1) % 9);
  });

  it('👀 espiar mostra as 3 do topo sem as tirar', () => {
    let e = { ...novo(5), sabotagens: 2 };
    e = tick(meter(e, 'S'));
    const topo = e.baralho.slice(0, 3);
    e = r(e, { tipo: 'rm_poder', id: e.comandante, alvo: null });
    expect(privadoMaquinas(e, e.comandante)!.resultado).toEqual({ tipo: 'espiar', cartas: topo });
    expect(e.baralho.slice(0, 3)).toEqual(topo);
  });

  it('🚀 ejetar: deixa de votar e de ser escolhido; ejetar a IA = Tripulação ganha', () => {
    let e = { ...novo(7), sabotagens: 3 };
    const ia = e.participantes.find((id) => e.papeis[id] === 'ia')!;
    const outro = e.participantes.find((id) => e.papeis[id] === 'tripulacao' && id !== e.participantes[0] && id !== e.participantes[1])!;
    e = tick(meter(e, 'S', e.participantes[1] === ia ? e.participantes[2] : e.participantes[1]));
    expect(e.poder).toBe('ejetar');
    const s = r(e, { tipo: 'rm_poder', id: e.comandante, alvo: outro === e.comandante ? ia : outro });
    if (s.fase !== 'fim') {
      expect(s.vivos).not.toContain(outro);
      const n = seguir(s);
      expect(r(n, { tipo: 'rm_piloto', id: n.comandante, alvo: outro }).fase).toBe('nomear');
    }
    if (e.comandante !== ia) {
      const f = r(e, { tipo: 'rm_poder', id: e.comandante, alvo: ia });
      expect(f.vencedor).toBe('tripulacao');
      expect(f.motivo).toBe('ia_ejetada');
    }
  });

  it('veto (≥5 Sabotagens): aceite = falha +1; recusado = o Piloto escolhe', () => {
    let e = { ...novo(7), sabotagens: 4 };
    e = governo(e, sem(e, 'ia').find((id) => id !== e.participantes[1]));
    e = r(e, { tipo: 'rm_descartar', id: e.comandante, i: 0 });
    expect(privadoMaquinas(e, e.piloto!)!.podeVetar).toBe(false);
    e = { ...e, sabotagens: 5 };
    expect(privadoMaquinas(e, e.piloto!)!.podeVetar).toBe(true);
    const v = r(e, { tipo: 'rm_vetar', id: e.piloto! });
    expect(v.fase).toBe('veto');
    const rec = r(v, { tipo: 'rm_veto', id: v.comandante, aceita: false });
    expect(rec.fase).toBe('piloto');
    expect(r(rec, { tipo: 'rm_vetar', id: rec.piloto! }).fase).toBe('piloto');
    const ac = r(v, { tipo: 'rm_veto', id: v.comandante, aceita: true });
    expect(ac.fase).toBe('discussao');
    expect(ac.falhas).toBe(1);
    expect(ac.sabotagens).toBe(5);
    expect(tick(v).fase).toBe('piloto'); // sem resposta = recusado
  });

  it('vitórias e pontos: 5 🔧, 6 💥, IA Piloto com ≥3 💥', () => {
    let e = { ...novo(6), reparacoes: 4 };
    e = meter(e, 'R');
    expect(e.vencedor).toBe('tripulacao');
    e.participantes.forEach((id) => expect(e.pontos[id] >= 1000).toBe(e.papeis[id] === 'tripulacao'));

    let s = { ...novo(6), sabotagens: 5 };
    s = meter(s, 'S');
    expect(s.vencedor).toBe('amotinados');
    const ia = s.participantes.find((id) => s.papeis[id] === 'ia')!;
    expect(s.pontos[ia]).toBeGreaterThanOrEqual(1500);
    expect(vistaMaquinas(s).papeis[ia]).toBe('ia');

    let a = { ...novo(6), sabotagens: 3 };
    a = tick(a);
    const iaA = a.participantes.find((id) => a.papeis[id] === 'ia')!;
    if (iaA !== a.comandante) {
      a = governo(a, iaA);
      expect(a.motivo).toBe('ia_piloto');
    }
  });

  it('desligar e voltar: pausa abaixo de 3 e retoma com o tempo que faltava', () => {
    let e = tick(novo(5));
    e = reduzMaquinas(e, { tipo: 'ligados', ids: ['j1', 'j2'] }, T + 5000);
    expect(e.pausaRestante).toBe(60_000);
    expect(reduzMaquinas(e, { tipo: 'tick' }, T + 999_999).fase).toBe('nomear');
    e = reduzMaquinas(e, { tipo: 'ligados', ids: ids(5) }, T + 60_000);
    expect(e.terminaEm).toBe(T + 120_000);
  });

  it('discussão: o "Seguir" passa ao Comandante seguinte', () => {
    let e = meter(novo(5), 'R');
    e = tick(e);
    expect(e.fase).toBe('discussao');
    const c = e.comandante;
    e = r(e, { tipo: 'rm_seguir', id: 'j1' });
    expect(e.fase).toBe('nomear');
    expect(e.comandante).not.toBe(c);
  });
});
