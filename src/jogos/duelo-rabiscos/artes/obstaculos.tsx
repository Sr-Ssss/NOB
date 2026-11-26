import { Riscos, type Camada } from './lapis';

/** só arte (sem regras); quadro 100×100, cabe num hexágono; 2 versões de cada */
export const OBSTACULOS = {
  pedra: [
    [['M14 78L22 48L42 26L65 31L84 57L88 78Z', '#c9c7c9', 5], ['M42 26L48 50L36 78M48 50L72 58M62 68L76 69', undefined, 3]],
    [['M40 80L48 44L64 22L80 40L90 80Z', '#c9c7c9', 5], ['M10 80L14 60L32 48L46 57L52 80Z', '#dad8d8', 5], ['M64 22L62 48L76 60M22 66L34 64', undefined, 3]],
  ],
  arvore: [
    [['M43 92L45 58L57 58L59 92Z', '#cfa77e', 5], ['M50 10Q72 8 74 28Q92 38 80 54Q68 70 50 62Q30 70 20 54Q8 38 27 28Q30 10 50 10Z', '#b8dba6', 5], ['M37 36Q42 28 50 30M55 48Q63 48 66 41', undefined, 3]],
    [['M44 92L44 74L57 74L57 92Z', '#cfa77e', 5], ['M50 6L70 34L61 34L78 56L66 56L84 77L16 77L33 56L22 56L39 34L30 34Z', '#a5cf9e', 5], ['M46 46L54 46M42 66L60 66', undefined, 3]],
  ],
  poca: [
    [['M14 60Q10 44 32 42Q46 30 63 40Q90 40 88 58Q88 76 62 74Q48 84 34 75Q16 75 14 60Z', '#b7dcf2', 5], ['M30 56Q38 50 46 56M54 62Q62 56 70 62', undefined, 4]],
    [['M20 48Q34 30 58 40Q84 36 86 56Q80 76 54 70Q28 80 18 66Q12 56 20 48Z', '#b7dcf2', 5], ['M44 55a8 4 0 1 0 16 0a8 4 0 1 0 -16 0M36 55a16 9 0 1 0 32 0M72 30Q66 22 72 14Q78 22 72 30Z', undefined, 4]],
  ],
  arbusto: [
    [['M12 80Q4 62 20 56Q20 38 38 40Q50 22 64 38Q82 36 82 56Q96 64 88 80Z', '#c4e0a8', 5], ['M32 60Q38 54 44 60M58 56Q64 50 70 56M44 72Q50 66 56 72', undefined, 3]],
    [['M12 80Q4 62 20 56Q20 38 38 40Q50 22 64 38Q82 36 82 56Q96 64 88 80Z', '#c4e0a8', 5], ['M30 58a5 5 0 1 0 10 0a5 5 0 1 0 -10 0M56 50a5 5 0 1 0 10 0a5 5 0 1 0 -10 0M66 69a5 5 0 1 0 10 0a5 5 0 1 0 -10 0M42 71a5 5 0 1 0 10 0a5 5 0 1 0 -10 0', '#e98a8a', 3]],
  ],
  tronco: [
    [['M24 44L80 40Q92 42 92 58Q91 75 80 76L24 78Z', '#d8b48c', 5], ['M9 61a15 17 0 1 0 30 0a15 17 0 1 0 -30 0', '#f2dcbc', 5], ['M17 61a7 8 0 1 0 14 0M52 53L74 51M48 66L66 65M60 40L66 24L76 26', undefined, 3]],
    [['M26 44Q30 70 16 86Q32 80 40 87Q50 80 60 87Q70 80 86 85Q72 70 74 44Z', '#d8b48c', 5], ['M26 43a24 13 0 1 0 48 0a24 13 0 1 0 -48 0', '#f2dcbc', 5], ['M38 43a12 6 0 1 0 24 0M36 62L35 72M62 62L64 74', undefined, 3]],
  ],
  ruina: [
    [['M18 84L18 34L26 34L26 24L40 26L44 44L54 50L66 60L72 84Z', '#dcd2c2', 5], ['M18 50L50 50M18 67L66 67M32 50L32 67M46 67L46 84M30 34L30 50', undefined, 3], ['M76 84L78 72L90 74L92 84Z', '#dcd2c2', 4]],
    [['M28 80L30 36L26 28L48 18L58 26L72 24L68 36L72 80Z', '#dcd2c2', 5], ['M20 80L80 80L84 90L16 90Z', '#dcd2c2', 5], ['M30 36L68 36M42 44L41 72M56 44L58 72', undefined, 3]],
  ],
} satisfies Record<string, [Camada[], Camada[]]>;
export type TipoObstaculo = keyof typeof OBSTACULOS;

/** centrado em (0,0): usar dentro de <Hexagono> */
export function Obstaculo({ tipo, versao = 0 }: { tipo: TipoObstaculo; versao?: 0 | 1 }) {
  return (
    <g class="dr-obstaculo" transform="scale(.72) translate(-50 -52)">
      <Riscos c={OBSTACULOS[tipo][versao]} />
    </g>
  );
}
