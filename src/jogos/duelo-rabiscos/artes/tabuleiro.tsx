import type { ComponentChildren } from 'preact';
import { Riscos, type Camada } from './lapis';

/** hexágono de bico para cima, centrado em (0,0), raio ~50 */
export const PASSO_X = 88;
export const PASSO_Y = 76;
const FORMA = 'M0 -49Q22 -38 43 -25Q42 0 43 24Q21 37 0 49Q-22 38 -43 25Q-42 0 -43 -24Q-21 -37 0 -49Z';
const DENTRO = 'M0 -39L34 -20L34 19L0 39L-34 20L-34 -19Z';

export const HEXAGONOS = {
  normal: [[FORMA, '#fffdf2', 2.5], ['M-28 22L-22 25M20 -24L26 -21', undefined, 1]],
  aceso: [[FORMA, '#fff0a0', 5], [DENTRO, undefined, 3, '7 7'], ['M-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0', '#2b2a33', 2]],
  alvo: [[FORMA, '#ffd0c4', 5], ['M-20 0a20 20 0 1 0 40 0a20 20 0 1 0 -40 0M0 -32L0 -10M0 10L0 32M-32 0L-10 0M10 0L32 0', undefined, 4]],
  bloqueado: [[FORMA, '#cfccc4', 3], ['M-39 6L4 -41M-39 24L34 -27M-22 34L40 -4M2 42L40 18', undefined, 1.5], ['M-18 -18L18 18M18 -18L-18 18', undefined, 8]],
} satisfies Record<string, Camada[]>;
export type EstadoHex = keyof typeof HEXAGONOS;

export function Hexagono({ estado = 'normal', x = 0, y = 0, children }: { estado?: EstadoHex; x?: number; y?: number; children?: ComponentChildren }) {
  return (
    <g class={`dr-hex dr-hex-${estado}`} transform={`translate(${x} ${y})`}>
      <Riscos c={HEXAGONOS[estado]} />
      {children}
    </g>
  );
}

/** centro de um hexágono (linhas ímpares meio passo à direita) */
export const centroHex = (col: number, lin: number) => ({ x: 46 + col * PASSO_X + (lin % 2) * (PASSO_X / 2), y: 52 + lin * PASSO_Y });

type Casa<T> = (col: number, lin: number) => T;
export function Colmeia({ colunas = 8, linhas = 8, estado, dentro }: { colunas?: number; linhas?: number; estado?: Casa<EstadoHex>; dentro?: Casa<ComponentChildren> }) {
  const casas = Array.from({ length: colunas * linhas }, (_, i) => [i % colunas, Math.floor(i / colunas)]);
  return (
    <svg class="dr-colmeia" viewBox={`0 0 ${92 + (colunas - 0.5) * PASSO_X} ${104 + (linhas - 1) * PASSO_Y}`} width="100%" aria-hidden="true">
      {casas.map(([c, l]) => (
        <Hexagono key={`${c}-${l}`} estado={estado?.(c, l)} {...centroHex(c, l)}>
          {dentro?.(c, l)}
        </Hexagono>
      ))}
    </svg>
  );
}
