import type { Cria } from '../regras';
import { TEXTO_PODER } from '../textos';
import { ICONES_STATUS } from './carta';
import { Arte, Riscos, type Camada } from './lapis';

/** efeitos que uma criatura pode ter por cima (dos poderes do mago) */
export type Efeito = 'sono' | 'escudo' | 'furia' | 'maisAtaque' | 'fantasma';
const ORDEM: Efeito[] = ['sono', 'escudo', 'furia', 'maisAtaque', 'fantasma'];

/** arte de cada efeito (100×100, a lápis como o resto) */
export const ARTE_EFEITO: Record<Efeito, Camada[]> = {
  // lua com zzz
  sono: [
    ['M60 12Q26 18 26 52Q28 86 64 90Q40 78 40 52Q40 26 60 12Z', '#c9d4ff', 6],
    ['M58 30L78 30L58 50L78 50', undefined, 7],
    ['M76 62L90 62L76 76L90 76', undefined, 6],
  ],
  escudo: ICONES_STATUS.defesa,
  // chama
  furia: [
    ['M50 94Q18 90 18 62Q18 40 40 22Q38 42 50 46Q48 22 64 6Q66 30 78 44Q88 56 84 70Q78 92 50 94Z', '#ff8a3d', 6],
    ['M50 86Q36 84 38 70Q40 60 48 56Q50 66 58 66Q64 74 60 80Q56 86 50 86Z', '#ffd25a', 5],
  ],
  // espada com um +
  maisAtaque: [...ICONES_STATUS.ataque, ['M20 8L20 34M7 21L33 21', undefined, 9]],
  // fantasminha
  fantasma: [
    ['M22 90L22 44Q22 10 50 10Q78 10 78 44L78 90L67 80L58 90L50 80L42 90L33 80Z', '#f2f0ff', 6],
    ['M35 42a5 5 0 1 0 10 0a5 5 0 1 0 -10 0M55 42a5 5 0 1 0 10 0a5 5 0 1 0 -10 0', '#2b2a33', 2],
  ],
};

const NOME_EFEITO = (e: Efeito) => TEXTO_PODER[e === 'fantasma' ? 'copia' : e].nome;

export const listaEfeitos = (c: Cria): Efeito[] => ORDEM.filter((e) => c[e]);
/** para leitores de ecrã: os nomes dos efeitos */
export const efeitosTexto = (c: Cria) => listaEfeitos(c).map(NOME_EFEITO).join(', ');

/** dentro do SVG da colmeia: bolinhas com a arte, em fila, a começar em (x, y) */
export function EfeitosPeca({ c, x = -30, y = -24 }: { c: Cria; x?: number; y?: number }) {
  return (
    <g>
      {listaEfeitos(c).map((e, k) => (
        <g key={e} transform={`translate(${x + k * 22} ${y})`}>
          <circle r="11" fill="#fffdf2" stroke="#2b2a33" stroke-width="2" />
          <g transform="translate(-8 -8) scale(.16)">
            <Riscos c={ARTE_EFEITO[e]} g={6} />
          </g>
        </g>
      ))}
    </g>
  );
}

/** em HTML (cartas): os ícones em fila */
export function EfeitosHtml({ c, tam = 18, class: cl }: { c: Cria; tam?: number; class?: string }) {
  const l = listaEfeitos(c);
  if (!l.length) return null;
  return (
    <span class={cl} aria-label={efeitosTexto(c)}>
      {l.map((e) => (
        <span key={e} title={NOME_EFEITO(e)}>
          <Arte c={ARTE_EFEITO[e]} tam={tam} />
        </span>
      ))}
    </span>
  );
}
