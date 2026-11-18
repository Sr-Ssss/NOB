/**
 * Logo e ícone NOB (info/arquitetura.md → "Logo e ícone", 18/11):
 * o "O" é um anel coral com a cara só na parte de baixo.
 */
const T = '#1d1b26';
export const CORAL = '#FF6B4A';
export const NOITE = '#26215C';
export const ANEL = 'M14 48 A36 36 0 1 0 86 48 A36 36 0 1 0 14 48 Z M38 48 A12 12 0 1 0 62 48 A12 12 0 1 0 38 48 Z';

/** o "O" coral com cara (viewBox 0–100); `fundo` desenha o quadrado azul-noite do ícone */
export function LetraO({ tam = 64, fundo = false }: { tam?: number; fundo?: boolean }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 100 100" role="img" aria-label="O">
      {fundo && <rect width="100" height="100" rx="22" fill={NOITE} />}
      <path d={ANEL} fill={CORAL} fill-rule="evenodd" stroke={T} stroke-width={5} stroke-linejoin="round" />
      <g class="olhos">
        {[42, 58].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={69} rx={4.6} ry={5.6} fill="#fff" stroke={T} stroke-width={2.5} />
            <circle cx={x + 0.6} cy={70} r={2.4} fill={T} />
          </g>
        ))}
      </g>
      <path d="M45 78 Q50 82 55 78" fill="none" stroke={T} stroke-width={3} stroke-linecap="round" />
    </svg>
  );
}

/** "N" + O + "B" do ecrã inicial */
export function Logo() {
  return (
    <h1 class="logo logo-v2" aria-label="NOB">
      <span aria-hidden="true">N</span>
      <LetraO tam={84} />
      <span aria-hidden="true">B</span>
    </h1>
  );
}
