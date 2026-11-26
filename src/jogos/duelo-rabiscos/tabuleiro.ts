/** Colmeia do Duelo de Rabiscos: hexágonos de bico para cima, linhas ímpares meio passo à direita (como `artes/tabuleiro.tsx`). */
import { baralhar } from '../../core/ids';

/** "coluna,linha" */
export type Casa = string;
export type Obstaculos = 'nenhum' | 'poucos' | 'muitos';
export const N_OBSTACULOS: Record<Obstaculos, number> = { nenhum: 0, poucos: 6, muitos: 12 };

export interface Tabuleiro {
  casas: Casa[];
  /** canto de cada mago */
  cantos: Casa[];
  obstaculos: Casa[];
}

export const casa = (col: number, lin: number): Casa => `${col},${lin}`;
export const ler = (c: Casa): [number, number] => c.split(',').map(Number) as [number, number];
const cubo = (c: Casa): [number, number, number] => {
  const [col, lin] = ler(c);
  const q = col - (lin - (lin & 1)) / 2;
  return [q, lin, -q - lin];
};
const deAxial = (q: number, r: number): Casa => casa(q + (r - (r & 1)) / 2, r);

export function distancia(a: Casa, b: Casa): number {
  const x = cubo(a);
  const y = cubo(b);
  return Math.max(...x.map((v, i) => Math.abs(v - y[i])));
}

/** na mesma linha reta da colmeia */
export function emLinha(a: Casa, b: Casa): boolean {
  const x = cubo(a);
  const y = cubo(b);
  return x.some((v, i) => v === y[i]);
}

export function vizinhas(c: Casa): Casa[] {
  const [q, r] = cubo(c);
  return [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(([dq, dr]) => deAxial(q + dq, r + dr));
}

function arredondar(q: number, r: number): Casa {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const [dq, dr, ds] = [Math.abs(rq - q), Math.abs(rr - r), Math.abs(rs - s)];
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return deAxial(rq, rr);
}

/** há linha de tiro? Quando a linha passa entre dois hexágonos, basta um dos lados estar livre */
export function linhaLivre(a: Casa, b: Casa, tapa: (c: Casa) => boolean): boolean {
  const n = distancia(a, b);
  const [aq, ar] = cubo(a);
  const [bq, br] = cubo(b);
  return [1e-4, -1e-4].some((eps) => {
    for (let i = 1; i < n; i++) {
      const k = i / n;
      if (tapa(arredondar(aq + (bq - aq) * k + eps, ar + (br - ar) * k + eps))) return false;
    }
    return true;
  });
}

/** casas a que se chega com `passos`; `voa` passa por cima de tudo mas não para em cima de nada */
export function alcance(de: Casa, passos: number, existe: (c: Casa) => boolean, ocupada: (c: Casa) => boolean, voa = false): Casa[] {
  const visto = new Set([de]);
  let frente = [de];
  for (let i = 0; i < passos && frente.length; i++) {
    const nova: Casa[] = [];
    for (const c of frente)
      for (const v of vizinhas(c))
        if (!visto.has(v) && existe(v) && (voa || !ocupada(v))) {
          visto.add(v);
          nova.push(v);
        }
    frente = nova;
  }
  visto.delete(de);
  return [...visto].filter((c) => !ocupada(c));
}

export function ligado(casas: Casa[]): boolean {
  const tudo = new Set(casas);
  return alcance(casas[0], casas.length, (c) => tudo.has(c), () => false).length === casas.length - 1;
}

const LADO = 12;

/** 2 magos: 8×8; 3: triângulo; 4: mais (+). Obstáculos sorteados mas simétricos */
export function novoTabuleiro(magos: number, obstaculos: Obstaculos, seed: number): Tabuleiro {
  const casas: Casa[] = [];
  let cantos: Casa[];
  let gira: (c: Casa) => Casa;
  if (magos === 3) {
    for (let r = 0; r < LADO; r++) for (let q = 0; q + r < LADO; q++) casas.push(deAxial(q, r));
    cantos = [deAxial(0, 0), deAxial(0, LADO - 1), deAxial(LADO - 1, 0)];
    gira = (c) => {
      const [q, r] = cubo(c);
      return deAxial(r, LADO - 1 - q - r);
    };
  } else {
    const n = magos === 4 ? LADO : 8;
    const braco = (v: number) => v >= 4 && v <= 7;
    for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) if (magos !== 4 || braco(c) || braco(l)) casas.push(casa(c, l));
    cantos = magos === 4 ? [casa(5, 0), casa(11, 5), casa(6, 11), casa(0, 6)] : [casa(3, 0), casa(4, 7)];
    gira = (c) => {
      const [x, y] = ler(c);
      return casa(n - 1 - x, n - 1 - y);
    };
  }
  let postos: Casa[] = [];
  for (const c of baralhar(casas, seed)) {
    const orbita = [...new Set([c, gira(c), gira(gira(c))])];
    if (postos.length + orbita.length > N_OBSTACULOS[obstaculos]) continue;
    if (orbita.some((o) => postos.includes(o) || cantos.some((k) => distancia(o, k) < 3))) continue;
    const tenta = [...postos, ...orbita];
    if (ligado(casas.filter((x) => !tenta.includes(x)))) postos = tenta;
  }
  return { casas, cantos, obstaculos: postos };
}
