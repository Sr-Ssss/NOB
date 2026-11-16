/**
 * Traços do canvas partilhado (Mona Lixa e Ideias Mirabolantes): info/jogos/rabiscos.md → Canvas.
 * Puro (sem DOM), para o reducer e os testes.
 */

/** grelha lógica 4:3 */
export const LARGURA = 400;
export const ALTURA = 300;
export const MAX_BYTES = 30_000;
/** 8 cores (preto primeiro) */
export const CORES = ['#1B1B1B', '#E6194B', '#4363D8', '#3CB44B', '#FFE119', '#F58231', '#911EB4', '#9A6324'];
/** 2 grossuras (em unidades da grelha) */
export const GROSSURAS = [4, 12];

export interface Traco {
  /** índice em CORES */
  c: number;
  /** índice em GROSSURAS */
  g: number;
  /** pontos planos: x0,y0,x1,y1… (inteiros na grelha) */
  p: number[];
}

export function bytesTracos(t: Traco[]): number {
  return JSON.stringify(t).length;
}

const lim = (n: number, max: number) => Math.min(max, Math.max(0, Math.round(Number(n) || 0)));

/** distância de um ponto ao segmento a–b */
function distSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l = dx * dx + dy * dy;
  const k = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
  return Math.hypot(px - (ax + k * dx), py - (ay + k * dy));
}

/** simplifica um traço (Ramer–Douglas–Peucker) */
export function simplificar(p: number[], tol = 1.2): number[] {
  const n = p.length / 2;
  if (n <= 2) return p;
  const manter = new Array<boolean>(n).fill(false);
  manter[0] = manter[n - 1] = true;
  const pilha: [number, number][] = [[0, n - 1]];
  while (pilha.length) {
    const [a, b] = pilha.pop()!;
    let max = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = distSeg(p[2 * i], p[2 * i + 1], p[2 * a], p[2 * a + 1], p[2 * b], p[2 * b + 1]);
      if (d > max) [max, idx] = [d, i];
    }
    if (max > tol && idx > 0) {
      manter[idx] = true;
      pilha.push([a, idx], [idx, b]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (manter[i]) out.push(p[2 * i], p[2 * i + 1]);
  return out;
}

/** valida o que veio do telemóvel: limita valores e corta o que passar de MAX_BYTES */
export function limparTracos(t: unknown): Traco[] {
  if (!Array.isArray(t)) return [];
  const out: Traco[] = [];
  let bytes = 2;
  for (const x of t) {
    if (!x || !Array.isArray((x as Traco).p)) continue;
    const raw = (x as Traco).p;
    const p: number[] = [];
    for (let i = 0; i + 1 < raw.length; i += 2) p.push(lim(raw[i], LARGURA), lim(raw[i + 1], ALTURA));
    if (!p.length) continue;
    const tr: Traco = { c: lim((x as Traco).c, CORES.length - 1), g: lim((x as Traco).g, GROSSURAS.length - 1), p };
    const b = JSON.stringify(tr).length + 1;
    if (bytes + b > MAX_BYTES) break;
    bytes += b;
    out.push(tr);
  }
  return out;
}

/** nº total de pontos (para animar) */
export function totalPontos(t: Traco[]): number {
  return t.reduce((s, x) => s + x.p.length / 2, 0);
}
