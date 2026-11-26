import { describe, expect, it, vi } from 'vitest';
import { LISTA, jogoEmCurso } from './registo';
import { novaSala, reduzSala, vistaSala, type AcaoSala, type EstadoSala } from './sala';

/** Fase 8 do feedback (20/11): "IA jogável" dos bots */
const r = (s: EstadoSala, a: AcaoSala, t = 100) => reduzSala(s, a, t);

function sala(bots: number): EstadoSala {
  let s = r(novaSala('ABCD', 'pt-BR'), { tipo: 'entrar', id: 'eu', nome: 'Eu', avatar: 0, tag: 'te' });
  for (let i = 1; i <= bots; i++) s = r(s, { tipo: 'bot_add', id: 'eu', bot: `bot-${i}`, tag: `tb${i}` });
  return s;
}

describe('IA dos bots', () => {
  it('ligada por defeito; só o líder a muda; vai na vista', () => {
    let s = r(sala(1), { tipo: 'entrar', id: 'ana', nome: 'Ana', avatar: 5, tag: 'ta' });
    expect(s.jogadores.find((j) => j.id === 'bot-1')?.ia).toBe(true);
    expect(r(s, { tipo: 'bot_ia', id: 'ana', bot: 'bot-1', ia: false })).toBe(s);
    expect(r(s, { tipo: 'bot_ia', id: 'eu', bot: 'ana', ia: false })).toBe(s);
    s = r(s, { tipo: 'bot_ia', id: 'eu', bot: 'bot-1', ia: false });
    expect(vistaSala(s).jogadores.find((j) => j.id === 'bot-1')?.ia).toBe(false);
    expect(vistaSala(s).jogadores.find((j) => j.id === 'ana')?.ia).toBeUndefined();
  });

  it('com a IA ligada, o líder já não joga como esse bot', () => {
    let s = sala(2);
    s = r(s, { tipo: 'bot_ia', id: 'eu', bot: 'bot-2', ia: false });
    const pronto = (bot: string) => r(s, { tipo: 'como', id: 'eu', bot, acao: { tipo: 'pronto', id: '', pronto: true } });
    expect(pronto('bot-1')).toBe(s);
    expect(pronto('bot-2').jogadores.find((j) => j.id === 'bot-2')?.pronto).toBe(true);
  });

  it('50/50: os bots escrevem e votam sozinhos (com a IA desligada, não)', () => {
    const correr = (ia: boolean) => {
      let s = sala(3);
      if (!ia) for (const b of ['bot-1', 'bot-2', 'bot-3']) s = r(s, { tipo: 'bot_ia', id: 'eu', bot: b, ia: false });
      s = r(s, { tipo: 'comecar', id: 'eu' }, 1000);
      for (let t = 1000; t < 21_000; t += 250) s = r(s, { tipo: 'tick' }, t);
      return s;
    };
    expect(Object.keys(correr(true).jogo!.enviados).sort()).toEqual(['bot-1', 'bot-2', 'bot-3']);
    expect(Object.keys(correr(false).jogo!.enviados)).toEqual([]);
  });

  it('recarregar bots: só o líder; os bots parados jogam logo', () => {
    let s = r(sala(3), { tipo: 'comecar', id: 'eu' }, 1000);
    // parados: a jogada desta fase já está marcada como feita
    const k = s.jogo!.fase + ':' + s.jogo!.terminaEm;
    s = { ...s, iaBots: Object.fromEntries(['bot-1', 'bot-2', 'bot-3'].map((b) => [b, { k, n: 1 }])) };
    for (let t = 1000; t < 15_000; t += 250) s = r(s, { tipo: 'tick' }, t);
    expect(Object.keys(s.jogo!.enviados)).toEqual([]);
    expect(r(s, { tipo: 'bots_recarregar', id: 'bot-1' }, 15_000)).toBe(s);
    s = r(s, { tipo: 'bots_recarregar', id: 'eu' }, 15_000);
    expect(Object.keys(s.jogo!.enviados).sort()).toEqual(['bot-1', 'bot-2', 'bot-3']);
  });

  it('bots na audiência também votam (Pensa-Dores com 18)', () => {
    let s = r(sala(17), { tipo: 'comecar', id: 'eu', jogo: 'pensa' }, 1000);
    const aud = s.pensa!.audiencia.filter((x) => x.startsWith('bot-'));
    expect(aud.length).toBeGreaterThan(0);
    const votou = new Set<string>();
    for (let t = 1000; t < 600_000 && s.pensa!.fase !== 'fim'; t += 250) {
      s = r(s, { tipo: 'tick' }, t);
      Object.keys(s.pensa!.votos).forEach((x) => votou.add(x));
    }
    expect(aud.every((x) => votou.has(x))).toBe(true);
  });

  it('Mona Lixa: com o desenho do líder, os bots acabam logo a fase de desenhar', () => {
    let s = r(sala(3), { tipo: 'comecar', id: 'eu', jogo: 'mona' }, 1000);
    const fim = s.mona!.terminaEm;
    s = r(s, { tipo: 'jogo', acao: { tipo: 'ml_desenho', id: 'eu', tracos: [{ c: 0, g: 0, p: [1, 1, 5, 5] }] } }, 1000);
    let t = 1000;
    for (; t < fim && s.mona!.fase === 'desenhar'; t += 250) s = r(s, { tipo: 'tick' }, t);
    expect(s.mona!.fase).toBe('inventar');
    expect(t).toBeLessThan(fim);
  });

  // cada jogo, com o líder parado: a partida chega ao fim e os bots fazem as jogadas esperadas em cada fase.
  // Quantas vezes, no mínimo (o que depende da sorte ou das opções não entra).
  const ESPERADO: Record<string, Record<string, number>> = {
    '5050': { 'escrever/enviar': 3, 'votar/votar': 3 },
    pensa: { 'escrever/responder': 12, 'votar/votar': 4, 'final_escrever/responder': 3, 'final_votar/votos_final': 3 },
    wifi: { 'palavras/prontas': 1, 'pistas/pistas': 1, 'responder/resposta': 3, 'responder/confirmar': 1 },
    sevira: { 'preparar/sv_enviar': 3, 'apresentar/sv_slide': 3, 'apresentar/sv_terminar': 3, 'nota/sv_nota': 3 },
    mona: { 'desenhar/ml_desenho': 3, 'inventar/ml_falso': 9, 'escolher/ml_escolher': 9 },
    ideias: { 'problema/im_problema': 3, 'inventar/im_invencao': 3, 'pitch/im_etapa': 6, 'pitch/im_acabei': 3, 'investir/im_investir': 3 },
    pirata: { 'noite/pr_noite': 1, 'votar/pr_votar': 1 },
    maquinas: { 'nomear/rm_piloto': 1, 'votar/rm_votar': 4, 'comandante/rm_descartar': 1, 'piloto/rm_escolher': 1 },
    rei: { 'ronda/rd_refens': 1, 'troca/rd_cheguei': 1 },
    semjuizo: { 'escolher/sj_jogar': 6 },
    ragerob: { 'loja/rr_lance': 3, 'aposta/rr_apostar': 3 },
    duelo: { 'mago/dr_mago': 3, 'exercito/dr_exercito': 3, 'desenhar/dr_desenho': 3, 'rodar/dr_pronto': 3, 'vez/dr_andar': 3, 'vez/dr_atacar': 2 },
  };
  for (const j of LISTA) {
    it(`${j.id}: partida inteira com os bots a jogar sozinhos`, () => {
      const feitas: Record<string, number> = {};
      const reduz = vi.spyOn(j as { reduz: typeof j.reduz }, 'reduz');
      try {
        let s = r(sala(Math.max(j.min, 4) - 1), { tipo: 'comecar', id: 'eu', jogo: j.id }, 1000);
        expect(jogoEmCurso(s)?.j.id).toBe(j.id);
        // o que só o líder (humano) faz: fechar equipas, avançar, ver a identidade, desenhar
        if (j.id === 'wifi') s = r(s, { tipo: 'jogo', acao: { tipo: 'fechar_equipas', id: 'eu' } }, 1000);
        if (j.id === 'rei') for (let k = 0; k < 2; k++) s = r(s, { tipo: 'jogo', acao: { tipo: 'rd_avancar', id: 'eu' } }, 1000);
        if (j.id === 'maquinas') s = r(s, { tipo: 'jogo', acao: { tipo: 'rm_vi', id: 'eu' } }, 1000);
        if (j.id === 'mona') s = r(s, { tipo: 'jogo', acao: { tipo: 'ml_desenho', id: 'eu', tracos: [{ c: 0, g: 0, p: [1, 1, 5, 5] }] } }, 1000);
        for (let t = 1000; t < 5_400_000 && jogoEmCurso(s)?.g.fase !== 'fim'; t += 250) s = r(s, { tipo: 'tick' }, t);
        expect(jogoEmCurso(s)?.g.fase).toBe('fim');
        reduz.mock.calls.forEach(([g, a], i) => {
          const id = (a as { id?: string }).id;
          if (id?.startsWith('bot-') && reduz.mock.results[i].value !== g) feitas[g.fase + '/' + a.tipo] = (feitas[g.fase + '/' + a.tipo] ?? 0) + 1;
        });
      } finally {
        reduz.mockRestore();
      }
      for (const [k, min] of Object.entries(ESPERADO[j.id])) expect(feitas[k] ?? 0, k).toBeGreaterThanOrEqual(min);
    });
  }
});
