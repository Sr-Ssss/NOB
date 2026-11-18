import { afterEach, describe, expect, it } from 'vitest';
import { definirSal, obterSal } from './ids';
import { CHAVE_ESTADO, ESPERA_HERDEIRO, VALIDADE_GRAVADO, escolherHerdeiro, gravarEstado, horaRetoma, lerEstado, rotaCom } from './passagem';
import { ID_TV, novaSala, privadoSala, reduzSala, vistaSala, type AcaoSala, type EstadoSala } from './sala';
import { TOLERANCIA } from './saidas';

const T0 = 1_000_000;
const r = (s: EstadoSala, a: AcaoSala, t: number) => reduzSala(s, a, t);

/** sem TV: j1 é o criador (anfitrião) */
function com(n: number): EstadoSala {
  let s: EstadoSala = { ...novaSala('ABCD', 'pt-BR'), semTv: true };
  for (let i = 1; i <= n; i++) s = r(s, { tipo: 'entrar', id: `j${i}`, nome: `N${i}`, avatar: i, tag: `t${i}` }, T0);
  return s;
}
const fix = (...ids: string[]) => Object.fromEntries(ids.map((i) => [i, 'x']));

afterEach(() => definirSal([0, 0, 0, 0]));

describe('passagem do anfitrião: herdeiro', () => {
  it('o líder, se não é o anfitrião; senão o ligado mais antigo', () => {
    let s = com(4);
    const todos = [ID_TV, 'j2', 'j3', 'j4'];
    expect(escolherHerdeiro(s, todos, fix('j2', 'j3', 'j4'), 'j1')).toBe('j2');
    s = r(s, { tipo: 'lideranca', id: 'j1', para: 'j3' }, T0);
    expect(s.vipId).toBe('j3');
    expect(escolherHerdeiro(s, todos, fix('j2', 'j3', 'j4'), 'j1')).toBe('j3');
  });

  it('só aparelhos presentes, com chave fixada, ligados e que não são bots nem o próprio anfitrião', () => {
    let s = com(4);
    s = r(s, { tipo: 'bot_add', id: 'j1', bot: 'bot-1', tag: 'tb' }, T0);
    expect(escolherHerdeiro(s, [ID_TV, 'j2', 'j3', 'bot-1'], fix('j3', 'bot-1'), 'j1')).toBe('j3');
    expect(escolherHerdeiro(s, [ID_TV, 'j4'], fix('j2', 'j3'), 'j1')).toBeNull();
    expect(escolherHerdeiro(com(1), [ID_TV], {}, 'j1')).toBeNull();
    // quem voltou noutro telemóvel (alias) herda pelo aparelho novo
    s = r(s, { tipo: 'ligados', ids: ['j1', 'j3', 'j4'] }, T0 + 1);
    s = r(s, { tipo: 'entrar', id: 'novo', nome: 'N2', avatar: 2, tag: 't2' }, T0 + 2);
    expect(s.aliases.novo).toBe('j2');
    expect(escolherHerdeiro(s, [ID_TV, 'novo', 'j3'], fix('j2', 'novo', 'j3'), 'j1')).toBe('novo');
  });

  it('o relógio continua o que os telemóveis viam (mais o tempo até arrancar), nunca antes da cópia', () => {
    const copia = { agora: 1000 } as Parameters<typeof horaRetoma>[0]['copia'];
    expect(horaRetoma({ copia, ate: 9000, em: 50 }, 50)).toBe(9000);
    expect(horaRetoma({ copia, ate: 9000, em: 50 }, 350)).toBe(9300);
    // relógio local para trás / muito tempo: não conta mais de 1 min
    expect(horaRetoma({ copia, ate: 9000, em: 50 }, 0)).toBe(9000);
    expect(horaRetoma({ copia, ate: 9000, em: 1 }, 10 * 60_000)).toBe(69_000);
    expect(horaRetoma({ copia, ate: 0, em: 0 })).toBe(1000);
    expect(horaRetoma({ copia, ate: NaN, em: 0 })).toBe(1000);
    expect(horaRetoma({ copia, ate: 500, em: 0 }, 0)).toBe(1000);
  });

  it('50/50 a 3: o criador sai, o herdeiro assume 15 s depois e o relógio não ganha tempo (auditoria 17/11)', () => {
    // anfitrião j1 (criador), j2 (herdeiro) e um bot
    let s = r(com(2), { tipo: 'bot_add', id: 'j1', bot: 'bot-1', tag: 'tb' }, T0);
    s = r(s, { tipo: 'comecar', id: 'j1', jogo: '5050' }, T0);
    const termina = s.jogo!.terminaEm;
    // última vista do anfitrião antigo: faltam 47 s; o relógio do j2 (hora do anfitrião) é local + desvio
    const vista = termina - 47_000;
    const desvio = vista - 5_000_000; // hora local do j2 = 5 000 000
    const restaEm = (agoraHost: number, e: EstadoSala) => (e.jogo!.pausaRestante ?? e.jogo!.terminaEm - agoraHost);
    // 15 s sem vistas: o j2 vê 32 s e assume; arranca 200 ms depois
    const local = 5_000_000 + ESPERA_HERDEIRO;
    expect(termina - (local + desvio)).toBe(32_000);
    const hora = horaRetoma({ copia: { agora: vista - 2000 } as Parameters<typeof horaRetoma>[0]['copia'], ate: local + desvio, em: local }, local + 200);
    // o novo anfitrião: o j1 não está → menos de 3 ligados → pausa
    let h = r(s, { tipo: 'ligados', ids: ['j2'] }, hora);
    expect(h.jogo!.pausaRestante).not.toBeNull();
    expect(restaEm(hora, h)).toBe(31_800);
    // o j1 volta: retoma com o que faltava, sem salto para cima
    h = r(h, { tipo: 'ligados', ids: ['j1', 'j2'] }, hora + 20_000);
    expect(h.jogo!.pausaRestante).toBeNull();
    expect(restaEm(hora + 20_000, h)).toBe(31_800);
  });

  it('rotaCom guarda o ?eu= dos testes', () => {
    expect(rotaCom('/jogar', { sala: 'ABCD' }, '2')).toBe('#/jogar?sala=ABCD&eu=2');
    expect(rotaCom('/criar', {}, null)).toBe('#/criar');
  });
});

describe('passagem do anfitrião: o estado continua no herdeiro', () => {
  it('a cópia (JSON + sal) reduz igual ao original: mesmos papéis, pontos e sorteios', () => {
    definirSal([11, 22, 33, 44]);
    let s = r(com(6), { tipo: 'comecar', id: 'j1', jogo: 'pirata' }, T0);
    s = r(s, { tipo: 'tick' }, s.pirata!.terminaEm);
    // o que vai na cópia
    const copia = JSON.parse(JSON.stringify({ estado: s, sal: obterSal() })) as { estado: EstadoSala; sal: number[] };
    definirSal([0, 0, 0, 0]);
    expect(definirSal(copia.sal)).toBe(true);
    let h = copia.estado;
    for (const id of ['j2', 'j3', 'j4', 'j5', 'j6']) expect(privadoSala(h, id)).toEqual(privadoSala(s, id));
    // os dois seguem a par até ao fim da partida (sorteios com o mesmo sal)
    const passos: [AcaoSala, number][] = [];
    for (let t = s.pirata!.terminaEm, i = 0; i < 12; i++, t += 120_000) passos.push([{ tipo: 'tick' }, t]);
    for (const [a, t] of passos) {
      s = r(s, a, t);
      h = r(h, a, t);
    }
    expect(JSON.stringify(vistaSala(h))).toBe(JSON.stringify(vistaSala(s)));
  });

  it('o criador fecha a app: o herdeiro assume, o criador sai como um jogador qualquer', () => {
    let s = r(com(6), { tipo: 'comecar', id: 'j1', jogo: 'pirata' }, T0);
    s = r(s, { tipo: 'tick' }, s.pirata!.terminaEm);
    const papeis = ['j1', 'j2', 'j3', 'j4', 'j5', 'j6'].map((id) => privadoSala(s, id));
    // o herdeiro (j2) assume com a hora da cópia: a 1.ª presença já não tem o criador
    const t = s.pirata!.terminaEm + 1000;
    let h = JSON.parse(JSON.stringify(s)) as EstadoSala;
    h = r(h, { tipo: 'ligados', ids: ['j2', 'j3', 'j4', 'j5', 'j6'] }, t);
    expect(h.jogadores.find((j) => j.id === 'j1')!.ligado).toBe(false);
    expect(h.pirata!.fase).toBe('noite');
    // depois da tolerância, a liderança passa ao herdeiro e (se o criador fazia falta) o jogo espera pela decisão
    h = r(h, { tipo: 'tick' }, t + TOLERANCIA);
    expect(h.vipId).toBe('j2');
    expect(vistaSala(h).ausentes?.map((a) => a.id)).toEqual(['j1']);
    // ninguém perdeu o papel
    expect(['j1', 'j2', 'j3', 'j4', 'j5', 'j6'].map((id) => privadoSala(h, id))).toEqual(papeis);
    // o criador volta (como jogador): continua com o papel dele
    h = r(h, { tipo: 'ligados', ids: ['j1', 'j2', 'j3', 'j4', 'j5', 'j6'] }, t + TOLERANCIA + 1);
    expect(h.pausaSaida).toBe(false);
    expect(privadoSala(h, 'j1')).toEqual(papeis[0]);
  });

  it('recarregar: a gravação volta igual, só para a mesma party e enquanto é recente', () => {
    const mem = new Map<string, string>();
    const arm = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    definirSal([5, 6, 7, 8]);
    const s = r(com(4), { tipo: 'comecar', id: 'j1', jogo: '5050' }, T0);
    gravarEstado(arm, { estado: s, sal: obterSal(), agora: T0 + 500 }, 100);
    const g = lerEstado(arm, 'ABCD', 200)!;
    expect(g.agora).toBe(T0 + 500);
    expect(g.sal).toEqual([5, 6, 7, 8]);
    expect(JSON.stringify(vistaSala(g.estado))).toBe(JSON.stringify(vistaSala(s)));
    expect(lerEstado(arm, 'ZZZZ', 200)).toBeNull();
    expect(lerEstado(arm, 'ABCD', 100 + VALIDADE_GRAVADO + 1)).toBeNull();
    mem.set(CHAVE_ESTADO, '{lixo');
    expect(lerEstado(arm, 'ABCD', 200)).toBeNull();
    expect(lerEstado({ getItem: () => null }, 'ABCD', 200)).toBeNull();
  });

  it('definirSal recusa lixo', () => {
    expect(definirSal([1, 2, 3])).toBe(false);
    expect(definirSal([1, 2, 3, -1])).toBe(false);
    expect(definirSal('x')).toBe(false);
  });
});
