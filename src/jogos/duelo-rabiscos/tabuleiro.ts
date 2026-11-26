/** Colmeia do Duelo de Rabiscos: hexágonos de bico para cima, linhas ímpares meio passo à direita (como `artes/tabuleiro.tsx`). */
import { baralhar } from '../../core/ids';

/** "coluna,linha" */
export type Casa = string;
export type Obstaculos = 'nenhum' | 'poucos' | 'muitos';
export const N_OBSTACULOS: Record<Obstaculos, number> = { nenhum: 0, poucos: 9, muitos: 18 };

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

/** a casa a seguir a `b` na reta que vem de `a` (coladas) */
export function seguinte(a: Casa, b: Casa): Casa {
  const [aq, ar] = cubo(a);
  const [bq, br] = cubo(b);
  return deAxial(2 * bq - aq, 2 * br - ar);
}

/** casas entre `a` e `b` numa linha reta (vazio se não estão em linha) */
export function entre(a: Casa, b: Casa): Casa[] {
  if (!emLinha(a, b)) return [];
  const n = distancia(a, b);
  const [aq, ar] = cubo(a);
  const [bq, br] = cubo(b);
  return Array.from({ length: n - 1 }, (_, i) => deAxial(aq + ((bq - aq) / n) * (i + 1), ar + ((br - ar) / n) * (i + 1)));
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

/** lado da colmeia (hexágono grande) por nº de magos: os exércitos começam a 7 ou mais, por isso na 1.ª volta nenhuma criatura chega a um inimigo parado (Elfo: anda 3 e atira a 3) */
export const LADO: Record<number, number> = { 2: 6, 3: 7, 4: 8 };
/** em que pontas do hexágono ficam os magos (0 = direita, depois contra os ponteiros: 1 cima-direita, 2 cima-esquerda…) */
const PONTAS: Record<number, number[]> = { 2: [3, 0], 3: [2, 0, 4] };
const DIRECOES = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

/** colmeia em hexágono, sempre; muda o tamanho e em que pontas ficam os magos. Obstáculos sorteados mas simétricos */
export function novoTabuleiro(magos: number, obstaculos: Obstaculos, seed: number): Tabuleiro {
  const n = Math.min(4, Math.max(2, magos));
  const R = LADO[n];
  // centro em (linha R, coluna R): as linhas começam em 0, para a paridade das linhas ímpares ficar certa
  const [qc, rc] = [R - (R - (R & 1)) / 2, R];
  const em = (dq: number, dr: number) => deAxial(qc + dq, rc + dr);
  const casas: Casa[] = [];
  for (let dr = -R; dr <= R; dr++) for (let dq = Math.max(-R, -dr - R); dq <= Math.min(R, -dr + R); dq++) casas.push(em(dq, dr));
  // 4 magos: nas pontas da esquerda e da direita e a meio dos lados de cima e de baixo (em 4 pontas, os vizinhos ficavam perto demais)
  const meio = Math.floor(R / 2);
  const cantos = n === 4 ? [em(-R, 0), em(meio, -R), em(R, 0), em(-meio, R)] : PONTAS[n].map((k) => em(DIRECOES[k][0] * R, DIRECOES[k][1] * R));
  const rel = (c: Casa): [number, number] => {
    const [q, r] = cubo(c);
    return [q - qc, r - rc];
  };
  // 3 magos: roda 120°; 2 e 4: meia volta
  const gira = (c: Casa): Casa => {
    const [q, r] = rel(c);
    return n === 3 ? em(-q - r, q) : em(-q, -r);
  };
  // obstáculos em grupos de 1 a 4 casas coladas (cada grupo é uma coisa só: uma montanha, uma casa partida…), separados entre si
  const N = N_OBSTACULOS[obstaculos];
  const copias = n === 3 ? 3 : 2;
  const ordem = baralhar(casas, seed);
  const existe = new Set(casas);
  const centro = em(0, 0);
  // com 2 e 4 magos tudo vai aos pares; um nº ímpar fecha com uma casa no centro (a única que é a sua própria cópia)
  let postos: Casa[] = N % copias ? [centro] : [];
  for (const [i, c] of ordem.entries()) {
    if (postos.length >= N) break;
    const k = 1 + ((seed + i * 7) % 4);
    const grupo = [c];
    // 4 casas: um bloco compacto (losango), cada casa nova colada a duas das outras
    const cola = (x: Casa) => grupo.filter((g) => distancia(g, x) === 1).length >= (grupo.length >= 2 && k === 4 ? 2 : 1);
    for (const x of ordem) if (grupo.length < k && !grupo.includes(x) && existe.has(x) && cola(x)) grupo.push(x);
    const orbita = [...new Set(grupo.flatMap((g) => [g, gira(g), gira(gira(g))]))];
    // um grupo perto do centro sobrepunha-se à sua cópia
    if (orbita.length !== grupo.length * copias) continue;
    if (postos.length + orbita.length > N) continue;
    if (orbita.some((o) => postos.includes(o) || vizinhas(o).some((v) => postos.includes(v)) || cantos.some((q) => distancia(o, q) < 3))) continue;
    const tenta = [...postos, ...orbita];
    if (ligado(casas.filter((x) => !tenta.includes(x)))) postos = tenta;
  }
  return { casas, cantos, obstaculos: postos };
}
