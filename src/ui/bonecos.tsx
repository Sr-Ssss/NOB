/**
 * Os 18 bonecos da party (info/arquitetura.md → "Bonecos"):
 * formas abstratas com cara, ar de rabisco à mão (traço preto grosso e irregular), uma cor base cada.
 * Única animação: piscar os olhos.
 */
import type { JSX } from 'preact';

type Olhos = 'normal' | 'tres' | 'dormir';
interface Def {
  nome: string;
  cor: string;
  corpo: (cor: string) => JSX.Element;
  cara: [number, number, number]; // x, y, escala
  olhos?: Olhos;
  lingua?: boolean;
}

const T = '#1d1b26'; // tinta do traço
const L = 5; // largura do traço

const p = (d: string, cor: string) => <path d={d} fill={cor} stroke={T} stroke-width={L} stroke-linejoin="round" />;
const linha = (d: string, w = L) => <path d={d} fill="none" stroke={T} stroke-width={w} stroke-linecap="round" stroke-linejoin="round" />;

function picos(cx: number, cy: number, n: number, r1: number, r2: number): string {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const r = i % 2 ? r2 : r1;
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)} `;
  }
  return d + 'Z';
}

export const BONECOS: Def[] = [
  { nome: 'amassado', cor: '#E6194B', cara: [50, 52, 1], corpo: (c) => p('M22 30 L38 18 L52 26 L68 15 L82 32 L76 48 L88 62 L72 82 L54 76 L36 88 L20 72 L26 54 L12 42 Z', c) },
  { nome: 'torre torta', cor: '#4363D8', cara: [52, 40, 0.9], corpo: (c) => p('M34 92 L28 22 Q29 11 41 11 L60 9 Q71 9 71 20 L78 90 Q60 96 34 92 Z', c) },
  {
    nome: 'pingente', cor: '#F58231', cara: [50, 54, 0.95],
    corpo: (c) => (
      <>
        {linha('M50 20 L50 12')}
        <circle cx="50" cy="8" r="5" fill="none" stroke={T} stroke-width={4} />
        {p('M50 20 L82 52 L50 92 L18 52 Z', c)}
      </>
    ),
  },
  {
    nome: 'bolhas', cor: '#3CB44B', cara: [42, 62, 0.95], lingua: true,
    corpo: (c) => (
      <>
        <circle cx="56" cy="30" r="18" fill={c} stroke={T} stroke-width={L} />
        <circle cx="72" cy="60" r="18" fill={c} stroke={T} stroke-width={L} />
        <circle cx="40" cy="62" r="26" fill={c} stroke={T} stroke-width={L} />
      </>
    ),
  },
  {
    nome: 'rabo de espiral', cor: '#911EB4', cara: [44, 50, 1],
    corpo: (c) => (
      <>
        {linha('M72 62 Q92 66 90 50 Q88 36 76 40 Q68 46 76 52 Q82 54 82 48', 6)}
        <circle cx="44" cy="52" r="30" fill={c} stroke={T} stroke-width={L} />
      </>
    ),
  },
  { nome: 'zigue-zague', cor: '#FFE119', cara: [50, 58, 1], corpo: (c) => p('M15 32 L25 14 L35 32 L45 14 L55 32 L65 14 L75 32 L85 14 L85 86 L15 86 Z', c) },
  {
    nome: 'tampa com buraco', cor: '#42D4F4', cara: [40, 54, 0.9],
    corpo: (c) => (
      <>
        {p('M43 24 L43 12 L57 12 L57 24 Z', c)}
        {p('M8 74 Q8 26 50 22 Q92 26 92 74 Z', c)}
        <ellipse cx="72" cy="50" rx="7" ry="9" fill={T} />
      </>
    ),
  },
  { nome: 'esticado de lado', cor: '#F032E6', cara: [50, 51, 0.85], corpo: (c) => p('M5 52 Q8 30 50 33 Q92 30 95 52 Q92 72 50 70 Q8 73 5 52 Z', c) },
  { nome: 'cubo mole', cor: '#BFEF45', cara: [50, 50, 1], corpo: (c) => p('M20 24 Q50 18 80 24 Q85 55 82 80 Q70 90 60 82 Q50 92 40 82 Q28 90 18 80 Q15 55 20 24 Z', c) },
  { nome: 'dois bicos', cor: '#FABED4', cara: [50, 58, 1], corpo: (c) => p('M18 88 Q14 50 26 30 L28 6 L44 26 Q50 24 56 26 L72 6 L74 30 Q86 50 82 88 Z', c) },
  {
    nome: 'ondulado', cor: '#469990', cara: [50, 50, 1],
    corpo: (c) => p('M50 12 Q62 4 68 16 Q82 14 82 28 Q94 36 86 50 Q94 64 82 72 Q82 86 68 84 Q62 96 50 88 Q38 96 32 84 Q18 86 18 72 Q6 64 14 50 Q6 36 18 28 Q18 14 32 16 Q38 4 50 12 Z', c),
  },
  {
    nome: 'pião', cor: '#DCBEFF', cara: [50, 48, 0.95],
    corpo: (c) => (
      <>
        {p('M45 30 L45 10 L55 10 L55 30 Z', c)}
        {p('M50 95 L20 56 Q18 32 50 28 Q82 32 80 56 Z', c)}
      </>
    ),
  },
  { nome: 'mordido', cor: '#9A6324', cara: [44, 56, 1], corpo: (c) => p('M82 30 A40 40 0 1 1 62 13 Q58 22 66 26 Q70 34 78 30 Q82 34 82 30 Z', c) },
  { nome: 'escadinha', cor: '#808000', cara: [64, 58, 0.95], corpo: (c) => p('M10 90 L10 66 L30 66 L30 46 L50 46 L50 26 L70 26 L70 10 L90 10 L90 90 Z', c) },
  {
    nome: 'gosma', cor: '#AAFFC3', cara: [50, 46, 1], olhos: 'tres',
    corpo: (c) => p('M14 70 Q12 24 50 18 Q88 24 86 70 Q84 86 78 74 Q72 94 66 74 Q58 86 52 74 Q44 96 38 74 Q30 86 26 74 Q20 88 14 70 Z', c),
  },
  { nome: 'peludo', cor: '#800000', cara: [50, 54, 0.95], corpo: (c) => p(picos(50, 52, 14, 46, 32), c) },
  {
    nome: 'polvo DJ', cor: '#A9A9A9', cara: [50, 40, 0.9],
    corpo: (c) => (
      <>
        {['M28 54 Q22 74 12 82', 'M40 58 Q38 78 32 92', 'M60 58 Q62 78 68 92', 'M72 54 Q78 74 88 82'].map((d) => (
          <g key={d}>
            {linha(d, 13)}
            <path d={d} fill="none" stroke={c} stroke-width={6} stroke-linecap="round" />
          </g>
        ))}
        {p('M22 58 Q20 16 50 14 Q80 16 78 58 Q50 66 22 58 Z', c)}
        {linha('M16 44 Q14 2 50 2 Q86 2 84 44', 5)}
        <rect x="8" y="34" width="13" height="22" rx="5" fill={T} />
        <rect x="79" y="34" width="13" height="22" rx="5" fill={T} />
      </>
    ),
  },
  {
    nome: 'feijão', cor: '#FFD8B1', cara: [44, 50, 0.95], olhos: 'dormir',
    corpo: (c) => p('M30 18 Q60 4 76 28 Q86 48 72 60 Q62 68 68 80 Q62 96 36 90 Q10 82 14 54 Q16 28 30 18 Z', c),
  },
];

export const N_BONECOS = BONECOS.length;

function Cara({ d, i }: { d: Def; i: number }) {
  const [x, y, s] = d.cara;
  const olho = (ox: number) => (
    <g key={ox}>
      <ellipse cx={ox} cy={0} rx={6.5} ry={8} fill="#fff" stroke={T} stroke-width={3} />
      <circle cx={ox + 1.5} cy={1.5} r={3.4} fill={T} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {d.olhos === 'dormir' ? (
        <>
          {linha('M-15 0 Q-9 6 -3 0', 3.5)}
          {linha('M3 0 Q9 6 15 0', 3.5)}
        </>
      ) : (
        <g class="olhos" style={{ animationDelay: `${(i * 1.7) % 9}s` }}>
          {d.olhos === 'tres' ? [olho(-17), olho(0), olho(17)] : [olho(-9), olho(9)]}
        </g>
      )}
      {linha('M-7 14 Q0 20 7 14', 3.5)}
      {d.lingua && <path d="M3 17 Q10 26 13 17" fill="#E6194B" stroke={T} stroke-width={2.5} />}
    </g>
  );
}

/** boneco n (0–17) */
export function Boneco18({ n, tam = 64 }: { n: number; tam?: number }) {
  const i = ((n % N_BONECOS) + N_BONECOS) % N_BONECOS;
  const d = BONECOS[i];
  const f = `rabisco${i}`;
  return (
    <svg width={tam} height={tam} viewBox="-4 -4 108 108" role="img" aria-label={d.nome}>
      <defs>
        <filter id={f} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={i + 3} />
          <feDisplacementMap in="SourceGraphic" scale="3.5" />
        </filter>
      </defs>
      <g filter={`url(#${f})`}>
        {d.corpo(d.cor)}
        <Cara d={d} i={i} />
      </g>
    </svg>
  );
}
