import { describe, expect, it } from 'vitest';
import { JOGOS, LISTA, jogoEmCurso } from './registo';
import { novaSala, reduzSala, vistaSala, type EstadoSala } from './sala';
import { ECRAS } from '../jogos/ecras';

const TAG = (i: number) => `TAGSECRETA${i}x`;
const T0 = 1_000_000;

function com(n: number): EstadoSala {
  let s = novaSala('ABCD', 'pt-BR');
  for (let i = 1; i <= n; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `Nome${i}`, avatar: i, tag: TAG(i) }, T0 + i);
  return s;
}

/** `"id":valor` de um mapa por jogador: se aparecer na vista, o segredo saiu */
const pares = (m: Record<string, unknown> | undefined) => Object.entries(m ?? {}).map(([id, v]) => `${JSON.stringify(id)}:${JSON.stringify(v)}`);

/** o que cada jogo guarda em segredo a meio do jogo (além das tags, que nenhum pode mostrar) */
const SEGREDOS: Record<string, (g: Record<string, unknown>) => string[]> = {
  pirata: (g) => pares(g.papeis as Record<string, unknown>),
  maquinas: (g) => [...pares(g.papeis as Record<string, unknown>), ...((g.mao as unknown[]).length ? [JSON.stringify(g.mao)] : [])],
  rei: (g) => pares(g.cartas as Record<string, unknown>),
  wifi: (g) => Object.values(g.palavras as Record<string, unknown[]>).flatMap((l) => l.map((p) => JSON.stringify(p))),
};

/** a sala ao longo de um jogo: começa e vai deixando os relógios acabar (sem ações dos jogadores) */
function aoLongoDoJogo(id: string): EstadoSala[] {
  const j = LISTA.find((x) => x.id === id)!;
  const n = Math.min(Math.max(j.min, 6), j.max ?? 16);
  let s = reduzSala(com(n), { tipo: 'comecar', id: 'j1', jogo: id }, T0 + 100);
  const salas = [s];
  for (let k = 1; k <= 12; k++) {
    s = reduzSala(s, { tipo: 'tick' }, T0 + 100 + k * 400_000);
    salas.push(s);
  }
  return salas;
}

describe('registo de jogos', () => {
  it('cada jogo tem id, chave, opções e ação de opções únicos, e ecrãs', () => {
    for (const campo of ['id', 'chave', 'chaveDef', 'definir'] as const) expect(new Set(LISTA.map((j) => j[campo])).size).toBe(LISTA.length);
    for (const j of JOGOS) expect(ECRAS[j.id]).toBeDefined();
  });

  it('a sala nova tem as opções de origem de todos os jogos e nenhum em curso', () => {
    const s = novaSala('ABCD', 'pt-BR') as unknown as Record<string, unknown>;
    for (const j of LISTA) {
      expect(s[j.chaveDef]).toEqual(j.padrao);
      expect(s[j.chave]).toBeNull();
    }
  });

  for (const j of LISTA) {
    it(`${j.id}: começa pelo registo e a vista pública não leva segredos`, () => {
      const salas = aoLongoDoJogo(j.id);
      expect(jogoEmCurso(salas[0])?.j.id).toBe(j.id);
      let vistos = 0;
      for (const s of salas) {
        const g = jogoEmCurso(s)?.g as unknown as Record<string, unknown> | undefined;
        if (!g || g.fase === 'fim') continue;
        const txt = JSON.stringify(vistaSala(s));
        const host = JSON.stringify(s);
        for (let i = 1; i <= s.jogadores.length; i++) {
          expect(host).toContain(TAG(i)); // o host tem-nas…
          expect(txt).not.toContain(TAG(i)); // …a vista não
        }
        for (const segredo of SEGREDOS[j.id]?.(g) ?? []) {
          expect(host).toContain(segredo);
          expect(txt, `${j.id} na fase ${g.fase}`).not.toContain(segredo);
          vistos++;
        }
      }
      // o teste não passa "em vazio": os jogos com segredos tiveram-nos durante o jogo
      if (SEGREDOS[j.id]) expect(vistos).toBeGreaterThan(0);
    });
  }

  it('Máquinas: os pontos só aparecem no fim', () => {
    const s = aoLongoDoJogo('maquinas')[0];
    const marcado = { ...s, maquinas: { ...s.maquinas!, pontos: { j1: 987654321 } } };
    expect(JSON.stringify(vistaSala(marcado))).not.toContain('987654321');
    const fim = { ...marcado, maquinas: { ...marcado.maquinas, fase: 'fim' as const } };
    expect(JSON.stringify(vistaSala(fim))).toContain('987654321');
  });
});
