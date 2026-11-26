import { Arte, GRAFITE, type Camada } from './lapis';

export const ICONES_CLASSE = {
  lacaio: [['M9 48a13 13 0 1 0 26 0a13 13 0 1 0 -26 0M65 48a13 13 0 1 0 26 0a13 13 0 1 0 -26 0M5 85Q6 65 22 65Q33 65 37 80M95 85Q94 65 78 65Q67 65 63 80', '#f0eadb', 6], ['M33 36a17 17 0 1 0 34 0a17 17 0 1 0 -34 0M24 92Q24 60 50 60Q76 60 76 92Z', '#d7ecc0', 6]],
  batedor: [['M8 22Q34 12 60 24Q88 38 92 74Q80 64 70 66Q72 78 64 86Q58 72 46 68Q44 78 36 78Q36 62 26 56Q20 58 16 54Q20 42 8 22Z', '#e3ddf2', 6], ['M28 34Q54 36 72 58M34 50Q48 52 58 64', undefined, 4]],
  pescador: [['M62 32L62 56Q62 86 38 86Q16 84 17 60L30 70M17 60L8 74M52 22a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', undefined, 8], ['M76 36L90 28M78 50L94 50M76 64L90 72', undefined, 5]],
  arqueiro: [['M30 8Q88 50 30 92', undefined, 8], ['M30 8L30 92', undefined, 4], ['M8 50L90 50M76 38L91 50L76 62M8 50L18 41M8 50L18 59', undefined, 6]],
  guardiao: [['M50 6Q68 17 90 17Q94 70 50 95Q6 70 10 17Q32 17 50 6Z', '#cfe2f5', 7], ['M28 42L50 30L72 42M28 60L50 48L72 60', undefined, 8]],
  duelista: [['M50 4L60 18L58 62L42 62L40 18Z', '#e9eef2', 6], ['M26 63L74 63M50 65L50 86M43 92L57 92', undefined, 9]],
  barbaro: [['M30 96L57 46', undefined, 11], ['M46 10Q74 2 90 24Q96 44 80 60Q64 66 48 56Q36 34 46 10Z', '#e8c9a4', 6], ['M58 22L60 26M76 26L78 30M62 44L65 48M80 44L82 47', undefined, 8]],
} satisfies Record<string, Camada[]>;

/** marcas de golpe por classe; Pescador e Arqueiro têm uma por variante */
export const MARCAS = {
  dentada: [['M8 14Q50 40 92 14L84 30L76 48L67 31L58 54L50 34L42 54L33 31L24 48L16 30Z', '#fff', 5], ['M8 90Q50 64 92 90L84 76L76 62L67 76L58 60L50 74L42 60L33 76L24 62L16 76Z', '#fff', 5]],
  garras: [['M30 8Q14 46 22 90Q30 50 30 8Z', GRAFITE, 3], ['M55 6Q40 48 46 94Q54 50 55 6Z', GRAFITE, 3], ['M80 10Q64 48 70 90Q80 52 80 10Z', GRAFITE, 3]],
  // anzol (Velho Pescador)
  anzol: [['M66 10L66 56Q66 86 42 86Q18 84 20 58L34 70M20 58L10 72', undefined, 8], ['M56 14L76 14M78 70L92 78M74 84L82 94', undefined, 6]],
  // ligaduras (Múmia)
  ligaduras: [['M6 30L90 14L94 34L10 50ZM6 62L88 42L94 62L12 82Z', '#f3ead6', 5], ['M30 26L34 45M58 20L62 40M36 55L42 74M64 48L70 67M12 82Q22 96 36 88', undefined, 4]],
  seta: [['M36 64L74 26', undefined, 7], ['M36 64L14 66L6 84L22 78ZM36 64L34 86L16 94L22 78Z', '#f3d7e2', 5], ['M90 10L84 38L62 16Z', GRAFITE, 5]],
  queimado: [['M50 6L58 24L76 16L74 36L94 42L80 56L90 74L68 74L60 94L46 78L28 90L26 70L6 64L20 48L8 28L30 30L34 10Z', '#8b7768', 5], ['M50 28Q68 44 62 58Q58 70 48 70Q34 68 36 54Q40 56 43 52Q42 40 50 28Z', '#ffb45e', 5]],
  amolgadela: [['M18 52Q14 22 48 18Q82 18 84 48Q84 80 50 82Q22 80 18 52Z', '#d8d6da', 6], ['M30 52Q30 34 48 31M66 60Q60 69 50 69', undefined, 4], ['M46 48L38 56L50 56L42 66M8 14L16 22M92 14L84 22M92 88L83 79M8 86L17 78', undefined, 5]],
  corte: [['M86 8Q56 38 12 92Q46 64 86 8Z', GRAFITE, 4], ['M56 28L72 42M42 45L57 59M28 62L42 76', undefined, 6]],
  soco: [['M50 4L60 20L78 12L78 30L96 36L84 50L96 66L78 70L78 90L60 82L48 96L40 80L22 88L22 70L4 62L18 48L6 32L24 30L24 12L40 20Z', '#fff0a0', 5], ['M28 60L28 42Q30 36 37 39Q38 33 45 36Q47 31 54 35Q60 32 63 39Q72 38 72 46L70 62Q67 70 56 70L38 70Q29 68 28 60Z', '#ffdcc2', 5], ['M39 40L39 50M47 38L47 50M55 38L55 50M30 55Q42 52 50 58', undefined, 4]],
} satisfies Record<string, Camada[]>;
export type Classe = keyof typeof ICONES_CLASSE;
export type Marca = keyof typeof MARCAS;

export function IconeClasse({ classe, tam = 48 }: { classe: Classe; tam?: number }) {
  return <Arte c={ICONES_CLASSE[classe]} tam={tam} class="dr-classe" />;
}
export function MarcaGolpe({ marca, tam = 48 }: { marca: Marca; tam?: number }) {
  return <Arte c={MARCAS[marca]} tam={tam} class="dr-marca" />;
}
