import { Arte, type Camada } from './lapis';

/** forma do dado = tipo: ação quadrado, ataque estrela, defesa escudo; ícone = face */
const ACAO: Camada = ['M14 9Q50 6 87 9Q92 10 92 16Q94 50 91 86Q91 91 85 92Q50 94 14 91Q8 91 8 85Q6 50 9 14Q9 9 14 9Z', '#fffdf2', 5];
const ATAQUE: Camada = ['M50 3L63 17L83 13L83 34L97 48L84 63L85 84L65 83L51 97L37 84L16 86L17 64L3 51L16 36L14 15L35 17Z', '#ffe1d6', 5];
const DEFESA: Camada = ['M50 4Q69 15 92 15Q97 70 50 97Q3 70 8 15Q31 15 50 4Z', '#dcecff', 5];
/** ferimento: redondo e rachado */
const FERIDO: Camada[] = [['M50 5Q80 6 92 34Q99 62 78 84Q52 102 22 84Q0 62 8 34Q20 6 50 5Z', '#eadcf0', 5], ['M50 5L44 15L53 21M22 84L31 77L29 69M92 40L83 43', undefined, 4]];
const VAZIO: Camada = ['M40 50a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', undefined, 4, '4 8'];

export const DADOS = {
  andar: [ACAO, ['M33 18L49 18L49 46Q60 51 71 53Q81 56 79 67L31 67Z', '#cfe8c5', 5], ['M31 67L31 75L80 75L79 67M34 30L48 30M18 34L26 34M15 48L25 48', undefined, 5]],
  fazerAlgo: [ACAO, ['M76 19L81 32L45 68L34 57L68 21Z', '#ffd9a8', 5], ['M27 50L52 75M39 63L23 79M22 22L38 38M22 35L22 22L35 22M62 62L78 78M70 81L80 80L81 70', undefined, 5]],
  habilidade: [ACAO, ['M20 82L56 44', undefined, 9], ['M66 15L71 30L86 35L71 40L66 56L60 40L46 35L60 30Z', '#e2d1ff', 5], ['M28 22L28 38M20 30L36 30M76 66L76 80M69 73L83 73', undefined, 4]],
  coringa: [ACAO, ['M50 14L61 37L86 40L67 57L72 83L50 70L28 83L33 57L14 40L39 37Z', '#fff0a0', 5], ['M41 44Q42 35 51 36Q60 38 57 46Q55 50 50 53L50 57M50 65L50 66', undefined, 5]],
  ataqueVazio: [ATAQUE, VAZIO],
  ataque1: [ATAQUE, ['M70 24L72 38L48 64L36 53L59 26Z', '#e9eef2', 5], ['M30 48L53 70M41 59L28 73', undefined, 7]],
  ataque2: [ATAQUE, ['M28 24L26 36L56 66L65 57L40 26Z', '#e9eef2', 5], ['M69 50L50 71M60 61L72 74', undefined, 6], ['M72 24L74 36L44 66L35 57L60 26Z', '#e9eef2', 5], ['M31 50L50 71M40 61L28 74', undefined, 6]],
  defesaVazio: [DEFESA, VAZIO],
  defesa1: [DEFESA, ['M50 22Q63 29 76 30Q77 61 50 78Q23 61 24 30Q37 29 50 22Z', '#8fbce8', 5], ['M36 49L47 60L65 38', undefined, 8]],
  feridaEspada: [...FERIDO, ['M66 26L70 38L46 66L36 57L60 30Z', '#ffd9a8', 5], ['M31 52L51 70M40 61L28 75', undefined, 6]],
  feridaEscudo: [...FERIDO, ['M50 28Q62 35 74 36Q75 63 50 78Q25 63 26 36Q38 35 50 28Z', '#8fbce8', 6]],
  feridaCoracao: [...FERIDO, ['M50 78Q20 56 24 40Q28 28 40 31Q48 33 50 41Q52 33 60 31Q72 28 76 40Q80 56 50 78Z', '#f7b3b3', 6]],
  feridaGema: [...FERIDO, ['M36 30L64 30L78 47L50 78L22 47Z', '#c9f0e4', 6], ['M22 47L78 47', undefined, 4]],
  feridaVazio: [...FERIDO, VAZIO],
} satisfies Record<string, Camada[]>;
export type FaceDado = keyof typeof DADOS;

export function Dado({ face, tam = 48 }: { face: FaceDado; tam?: number }) {
  return <Arte c={DADOS[face]} tam={tam} class={`dr-dado dr-dado-${face}`} />;
}
