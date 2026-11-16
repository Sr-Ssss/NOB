/**
 * Os 18 bonecos da party (info/arquitetura.md → "Bonecos"):
 * formas abstratas com cara, ar de rabisco à mão (traço preto grosso e irregular), uma cor base cada.
 * Única animação: piscar os olhos.
 */
import type { JSX } from 'preact';

interface Def {
  nome: string;
  cor: string;
  corpo: (cor: string) => JSX.Element;
  cara: [number, number, number]; // x, y, escala
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
    nome: 'bolhas', cor: '#3CB44B', cara: [42, 62, 0.95],
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
    nome: 'gosma', cor: '#AAFFC3', cara: [50, 46, 1],
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
    nome: 'feijão', cor: '#FFD8B1', cara: [44, 50, 0.95],
    corpo: (c) => p('M30 18 Q60 4 76 28 Q86 48 72 60 Q62 68 68 80 Q62 96 36 90 Q10 82 14 54 Q16 28 30 18 Z', c),
  },
];

export const N_BONECOS = BONECOS.length;

// ===== caras (info/arquitetura.md → Bonecos, tabela de 16/11): olhos piscam, resto fica =====
const ln = (d: string, w = 3.5, c = T) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const fl = (d: string, f = T, w = 3) => `<path d="${d}" fill="${f}" stroke="${T}" stroke-width="${w}" stroke-linejoin="round"/>`;
const olho = (x: number, y: number, rx: number, ry: number, px: number, py: number, pr: number, brilho = false) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${T}" stroke-width="3"/><circle cx="${px}" cy="${py}" r="${pr}" fill="${T}"/>` +
  (brilho ? `<circle cx="${px - pr * 0.4}" cy="${py - pr * 0.4}" r="${Math.max(1.2, pr * 0.35)}" fill="#fff"/>` : '');
/** olho com pálpebra reta a meio (semicerrado / a dormir) */
const meio = (x: number, y: number, px: number, py: number) =>
  `<path d="M${x - 7} ${y} A7 7.5 0 0 0 ${x + 7} ${y} Z" fill="#fff" stroke="${T}" stroke-width="3" stroke-linejoin="round"/><circle cx="${px}" cy="${py}" r="2.6" fill="${T}"/>` + ln(`M${x - 8.5} ${y} L${x + 8.5} ${y}`, 3.5);
/** cada cara: olhos (piscam) e o resto (boca, sobrancelhas…), em coordenadas à volta de (0,0) */
export const CARAS: ((cor: string) => { olhos: string; resto: string })[] = [
  /* 1 amassado */ () => ({ olhos: olho(-10, 0, 8, 9.5, -9, 1, 3.8) + olho(10, 2, 5, 6, 10, 3, 2.6), resto: ln('M-10 16 Q-6 11 -2 16 Q2 21 6 16 Q8 13 10 15') }),
  /* 2 torre */ () => ({ olhos: olho(-9, 3, 6.5, 8, -8, 4, 3.4) + olho(9, -3, 6.5, 8, 10, -2, 3.4), resto: ln('M-9 16 L9 14') + fl('M0 15 L5 14.5 L5.5 20 L0.5 20.5 Z', '#fff', 2.5) }),
  /* 3 pingente */ () => ({ olhos: olho(-9, 0, 6.5, 8, -8, -4, 3.2) + olho(9, 0, 6.5, 8, 10, -4, 3.2), resto: ln('M-4 14 Q0 18 4 14') }),
  /* 4 bolhas (olhos desiguais) */ () => ({ olhos: [[14.7, -33.7, 3.6], [-6.3, -6.3, 6.3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${T}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${(r * 0.35).toFixed(1)}" fill="#fff"/>`).join(''), resto: ln('M-9 11 Q0 21 9 11') + fl('M3 16 Q11 26 13 14', '#E6194B', 2.5) }),
  /* 5 espiral (grande e pequena) */ () => ({ olhos: [[-11, -5, 9.5], [11, 1, 6]].map(([x, y, r]) => { const k = r / 7.5; const q = (a: number, b: number) => `${(x + a * k).toFixed(1)} ${(y + b * k).toFixed(1)}`; return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${T}" stroke-width="3"/>` + ln(`M${q(0, 0)} Q${q(3, -3)} ${q(4, 1)} Q${q(3, 5)} ${q(-1, 4.5)} Q${q(-5, 3)} ${q(-4.5, -1)} Q${q(-3, -5.5)} ${q(1, -5)}`, 2); }).join(''), resto: fl('M-9 13 Q-5 9 -1 13 Q3 17 8 12 Q8 22 0 22 Q-8 22 -9 13 Z') }),
  /* 6 zigue-zague */ () => ({ olhos: olho(-9, 2, 6, 7, -8, 3, 3.2) + olho(9, 2, 6, 7, 8, 3, 3.2), resto: ln('M-17 -10 L-4 -4', 4.5) + ln('M17 -10 L4 -4', 4.5) + fl('M-10 13 L10 13 L10 21 L-10 21 Z', '#fff') + ln('M-10 17 L-6 13 L-2 21 L2 13 L6 21 L10 17', 2.5) }),
  /* 7 tampa */ () => ({ olhos: olho(-9, 0, 6.5, 8, -5.5, 0, 3.4) + olho(9, 0, 6.5, 8, 12.5, 0, 3.4), resto: `<circle cx="4" cy="15" r="3.2" fill="${T}"/>` }),
  /* 8 esticado */ () => ({ olhos: olho(-32, 0, 6, 7.5, -31, 1, 3.2) + olho(32, 0, 6, 7.5, 33, 1, 3.2), resto: ln('M-24 9 Q0 27 24 9') }),
  /* 9 cubo mole */ () => ({ olhos: olho(-10, 0, 7, 8, -12, 4, 3.2) + olho(10, 0, 7, 8, 12, 4, 3.2), resto: ln('M-18 -6 Q-12 -10 -4 -7', 3) + ln('M18 -6 Q12 -10 4 -7', 3) + fl('M-8 12 Q0 10 8 12 Q8 20 2 19 Q1.5 26 -0.5 19 Q-8 21 -8 12 Z') }),
  /* 10 dois bicos */ () => ({ olhos: olho(-10, -1, 8, 10, -9, 0, 4.2, true) + olho(10, -1, 8, 10, 11, 0, 4.2, true), resto: fl('M-9 12 L9 12 Q9 24 0 24 Q-9 24 -9 12 Z') + fl('M-4 20 Q0 17 4 20 Q2 23 0 23 Q-2 23 -4 20 Z', '#E6194B', 0) }),
  /* 11 ondulado */ () => ({ olhos: olho(-9, 0, 6.5, 8, -8, 1, 3.3) + olho(9, 0, 6.5, 8, 10, 1, 3.3) + [-9, 9].map((x) => ln(`M${x - 5} -6 L${x - 8} -11`, 2.5) + ln(`M${x} -8 L${x} -13`, 2.5) + ln(`M${x + 5} -6 L${x + 8} -11`, 2.5)).join(''), resto: `<circle cx="-16" cy="10" r="4" fill="#FF8FB1"/><circle cx="16" cy="10" r="4" fill="#FF8FB1"/>` + ln('M-4 16 Q3 19 9 12') }),
  /* 12 pião */ () => ({ olhos: olho(-9, 0, 6.5, 8, -5.5, 1, 3.2) + olho(9, 0, 6.5, 8, 5.5, 1, 3.2), resto: ln('M-7 14 Q-3 19 1 15 Q4 13 7 16') }),
  /* 13 mordido (pequeno e grande) */ () => ({ olhos: olho(-10, 1, 6.5, 8, -10, 1, 1.4) + olho(12, -3, 10, 12, 12, -3, 1.8), resto: ln('M-16 -10 Q-10 -16 -4 -11', 3) + ln('M4 -19 Q12 -25 20 -19', 3) + ln('M-9 20 Q-6 15 -3 18 Q0 14 3 18 Q6 15 9 20') }),
  /* 14 escadinha */ () => ({ olhos: `<rect x="-16" y="-6" width="12" height="12" fill="#fff" stroke="${T}" stroke-width="3"/><rect x="-11" y="-2" width="5" height="5" fill="${T}"/><rect x="4" y="-6" width="12" height="12" fill="#fff" stroke="${T}" stroke-width="3"/><rect x="9" y="-2" width="5" height="5" fill="${T}"/>`, resto: ln('M-8 15 L8 15', 4.5) }),
  /* 15 gosma */ () => ({ olhos: olho(-17, 0, 6.5, 8, -16, 1, 3.3) + olho(0, -3, 6.5, 8, 1, -2, 3.3) + olho(17, 0, 6.5, 8, 18, 1, 3.3), resto: fl('M-7 13 Q0 10 7 13 Q7 21 0 21 Q-7 21 -7 13 Z') + `<path d="M4 19 Q6 24 5 27" fill="none" stroke="#9fe6ff" stroke-width="3" stroke-linecap="round"/><circle cx="5" cy="28" r="2.4" fill="#9fe6ff" stroke="${T}" stroke-width="1.5"/>` }),
  /* 16 peludo (olhos brancos a espreitar; pelo e boca a creme para se lerem no bordô) */ (cor: string) => ({ olhos: [-7, 7].map((x) => `<circle cx="${x}" cy="3" r="4" fill="#fff"/><circle cx="${x + 0.5}" cy="4.3" r="2.1" fill="${T}"/>`).join(''), resto: `<path d="M-17 -6 L-17 2 L-12 -1 L-8 4 L-4 -1 L0 4 L4 -1 L8 4 L12 -1 L17 2 L17 -6 Z" fill="${cor}" stroke="#FFF3E0" stroke-width="2.5" stroke-linejoin="round"/>` + ln('M-2 14 Q0 16 2 14', 3, '#FFF3E0') }),
  /* 17 polvo DJ (um semicerrado, outro aberto) */ () => ({ olhos: meio(-9, 0, -8, 3.5) + olho(9, 0, 6.5, 8, 10, 1, 3.2), resto: ln('M3 -12 Q9 -17 15 -12', 3) + ln('M-5 15 Q3 19 9 12') }),
  /* 18 feijão */ () => ({ olhos: meio(-9, 0, -9, 4.5) + meio(9, 0, 9, 4.5), resto: ln('M-15 9 Q-9 12 -3 9', 2.5, '#9a6a5a') + ln('M3 9 Q9 12 15 9', 2.5, '#9a6a5a') + `<ellipse cx="0" cy="18" rx="4" ry="5.5" fill="${T}"/>` }),
];

/** cada boneco pisca no seu ritmo (dessincronizados); parado com "reduzir movimento" */
const ESTILO = '.olhos{transform-box:fill-box;transform-origin:center}@media (prefers-reduced-motion: reduce){.olhos{animation:none!important}}';

function Cara({ d, i }: { d: Def; i: number }) {
  const [x, y, s] = d.cara;
  const { olhos, resto } = CARAS[i](d.cor);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g class="olhos" style={{ animationDelay: `${((i * 1.7) % 9).toFixed(1)}s`, animationDuration: `${6 + (i % 4)}s` }} dangerouslySetInnerHTML={{ __html: olhos }} />
      <g dangerouslySetInnerHTML={{ __html: resto }} />
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
      <style>{ESTILO}</style>
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
