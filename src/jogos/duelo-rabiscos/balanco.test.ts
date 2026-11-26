import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { it } from 'vitest';
import { sorteDe } from '../../core/ia';
import { jogadaBot } from './bot';
import { CRIATURAS, MAGOS_PODERES, validarExercito, type Criatura, type Exercito, type RoupaMago } from './criaturas';
import { novoDuelo, reduzDuelo, resultadoDuelo, vistaDuelo } from './regras';

/**
 * Simulador de balanço (só corre a pedido): N partidas de 2 bots com exércitos e roupas ao acaso.
 * Mostra quanto ganha cada criatura, roupa e lugar, e as voltas por tinta.
 * Correr (PowerShell): `$env:N=1500; npx vitest run src/jogos/duelo-rabiscos/balanco.test.ts`
 * → escreve balanco-duelo.txt na pasta temporária.
 */

const TODAS = Object.keys(CRIATURAS) as Criatura[];
const ROUPAS = Object.keys(MAGOS_PODERES) as RoupaMago[];

function exercitoAoAcaso(r: () => number, tinta: number): Exercito {
  for (;;) {
    const classes = [...new Set(TODAS.map((c) => CRIATURAS[c].classe))].sort(() => r() - 0.5).slice(0, 1 + Math.floor(r() * 3));
    const tipos = classes.map((cl) => {
      const v = TODAS.filter((c) => CRIATURAS[c].classe === cl);
      return v[Math.floor(r() * v.length)];
    });
    const x: Exercito = {};
    for (const t of tipos) x[t] = 1;
    // enche com cópias ao acaso até não caber
    for (let k = 0; k < 20; k++) {
      const t = tipos[Math.floor(r() * tipos.length)];
      const y = { ...x, [t]: (x[t] ?? 0) + 1 };
      if (validarExercito(y, tinta)) Object.assign(x, y);
    }
    if (validarExercito(x, tinta)) return x;
  }
}

it.skipIf(!process.env.N)('balanço', () => {
  const N = Number(process.env.N);
  const vit: Record<string, [number, number]> = {};
  const conta = (k: string, ganhou: number) => {
    vit[k] ??= [0, 0];
    vit[k][0] += ganhou;
    vit[k][1]++;
  };
  const voltas: Record<number, number[]> = {};
  for (let s = 1; s <= N; s++) {
    const tinta = [6, 12, 20][s % 3];
    const r = sorteDe(s * 7919);
    let e = novoDuelo(['b0', 'b1'], { tinta, obstaculos: (['nenhum', 'poucos', 'muitos'] as const)[(s >> 2) % 3] }, 1_000, [], s);
    const roupas = [...ROUPAS].sort(() => r() - 0.5);
    const ex: Record<string, Exercito> = {};
    e.participantes.forEach((id, i) => (e = reduzDuelo(e, { tipo: 'dr_mago', id, roupa: roupas[i] }, 1_000)));
    for (const id of e.participantes) e = reduzDuelo(e, { tipo: 'dr_exercito', id, exercito: (ex[id] = exercitoAoAcaso(r, tinta)) }, 1_000);
    for (let k = 0; e.fase !== 'fim' && k < 4000; k++) {
      const v = vistaDuelo(e);
      const a = e.participantes.map((id) => jogadaBot(v, id, r)).find((x) => x);
      if (!a) break;
      e = reduzDuelo(e, a, 1_000);
    }
    if (e.fase !== 'fim') continue;
    (voltas[tinta] ??= []).push(e.volta);
    const res = resultadoDuelo(e);
    const max = Math.max(...Object.values(res));
    const vencedores = e.participantes.filter((id) => res[id] === max);
    e.participantes.forEach((id, i) => {
      const g = vencedores.length === 1 ? (vencedores[0] === id ? 1 : 0) : 0.5;
      conta('lugar ' + i, g);
      conta('roupa ' + e.magos[id].roupa, g);
      for (const c of Object.keys(ex[id]) as Criatura[]) conta(c, g);
    });
  }
  const linhas = Object.entries(vit)
    .map(([k, [g, n]]) => `${k.padEnd(22)} ${((100 * g) / n).toFixed(0).padStart(3)}%  (${n})`)
    .sort();
  const out: string[] = [...linhas];
  for (const [t, l] of Object.entries(voltas)) out.push(`tinta ${t}: voltas média ${(l.reduce((a, b) => a + b, 0) / l.length).toFixed(1)}  min ${Math.min(...l)} max ${Math.max(...l)}`);
  writeFileSync(join(tmpdir(), 'balanco-duelo.txt'), out.join('\n'));
}, 900_000);
