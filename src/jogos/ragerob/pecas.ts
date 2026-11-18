/**
 * Ragerob: peças dos robôs (info/jogos/rinha-de-robos.md → "Robô = Carroçaria + Locomoção + Cabeça + Módulos" e "Peças").
 * Só dados: usados pelo reducer, pela física (TV) e pelos desenhos.
 */

export type Corpo = 'triangulo' | 'bola' | 'quadrado' | 'retangulo' | 'pentagono';
export type Loco = 'rodas' | 'lagartas' | 'pernas';
export type Cabeca = 'galo' | 'crocodilo' | 'rino' | 'bode' | 'ourico';
export type Modulo = 'picos' | 'martelo' | 'chamas' | 'escudo' | 'propulsor' | 'oleo' | 'fogos' | 'pistao' | 'agua' | 'bobina';
export type Perigo = 'serra' | 'parede' | 'martelo' | 'espinhos' | 'pistao' | 'tapete' | 'prato';
export type Evento = 'ima' | 'parafusos' | 'encolher';

export const CORPOS: Corpo[] = ['triangulo', 'bola', 'quadrado', 'retangulo', 'pentagono'];
export const LOCOS: Loco[] = ['rodas', 'lagartas', 'pernas'];
export const CABECAS: Cabeca[] = ['galo', 'crocodilo', 'rino', 'bode', 'ourico'];
export const MODULOS: Modulo[] = ['picos', 'martelo', 'chamas', 'escudo', 'propulsor', 'oleo', 'fogos', 'pistao', 'agua', 'bobina'];
export const PERIGOS: Perigo[] = ['serra', 'parede', 'martelo', 'espinhos', 'pistao', 'tapete', 'prato'];

/** número de encaixes (= módulos) de cada carroçaria */
export const ENCAIXES: Record<Corpo, number> = { triangulo: 3, bola: 3, quadrado: 4, retangulo: 4, pentagono: 5 };

/** preços do .md: Óleo/Escudo/Água 100; Picos/Propulsor/Pistão 150; Lança-chamas/Martelo/Fogo de artifício/Bobina 200 */
export const PRECO: Record<Modulo, number> = {
  oleo: 100, escudo: 100, agua: 100,
  picos: 150, propulsor: 150, pistao: 150,
  chamas: 200, martelo: 200, fogos: 200, bobina: 200,
};

export const ICONE_MODULO: Record<Modulo, string> = {
  picos: '🔩', martelo: '🔨', chamas: '🔥', escudo: '🛡️', propulsor: '🚀', oleo: '🛢️', fogos: '🎆', pistao: '🥊', agua: '💧', bobina: '⚡',
};
export const ICONE_CABECA: Record<Cabeca, string> = { galo: '🐓', crocodilo: '🐊', rino: '🦏', bode: '🐐', ourico: '🦔' };
export const ICONE_PERIGO: Record<Perigo, string> = { serra: '⚙️', parede: '🧱', martelo: '🔨', espinhos: '📌', pistao: '🟧', tapete: '➡️', prato: '🌀' };
export const ICONE_EVENTO: Record<Evento, string> = { ima: '🧲', parafusos: '🔩', encolher: '🔥' };

/** cor fixa por animal (a carroçaria é que é sorteada) */
export const COR_CABECA: Record<Cabeca, string> = { galo: '#d93a2b', crocodilo: '#3f9a3a', rino: '#8b8f95', bode: '#e9dcb8', ourico: '#8a5a33' };

/** cor de destaque de cada módulo (a mesma no cartão da loja) */
export const COR_MODULO: Record<Modulo, string> = {
  picos: '#efe3c4', martelo: '#c9ced3', chamas: '#e0412b', escudo: '#2f7de1', propulsor: '#f08a1c', oleo: '#1d1d1d', fogos: '#c43bd1', pistao: '#d93a2b', agua: '#3aa0e0', bobina: '#c8792a',
};

/** cores das carroçarias: cada uma com um nome (o robô também se distingue sem ver cores) */
export const CORES = [
  { hex: '#e0412b', pt: 'Pimenta', en: 'Pepper' },
  { hex: '#4caf3a', pt: 'Couve', en: 'Kale' },
  { hex: '#f2c230', pt: 'Mostarda', en: 'Mustard' },
  { hex: '#2f7de1', pt: 'Mirtilo', en: 'Blueberry' },
  { hex: '#f08a1c', pt: 'Tangerina', en: 'Tangerine' },
  { hex: '#8e4fc9', pt: 'Uva', en: 'Grape' },
  { hex: '#f27fb2', pt: 'Chiclete', en: 'Bubblegum' },
  { hex: '#3cc6c0', pt: 'Hortelã', en: 'Mint' },
  { hex: '#7a4a2a', pt: 'Cacau', en: 'Cocoa' },
  { hex: '#c6e04a', pt: 'Limão', en: 'Lime' },
  { hex: '#e8e2d0', pt: 'Coco', en: 'Coconut' },
  { hex: '#4a5a8a', pt: 'Ameixa', en: 'Plum' },
  { hex: '#9b1b30', pt: 'Cereja', en: 'Cherry' },
  { hex: '#93c47d', pt: 'Pistache', en: 'Pistachio' },
  { hex: '#87c8eb', pt: 'Algodão', en: 'Cotton' },
  { hex: '#b0b6bd', pt: 'Alumínio', en: 'Tinfoil' },
];

export const NOME_CABECA: Record<Cabeca, { pt: string; en: string }> = {
  galo: { pt: 'Galo', en: 'Rooster' },
  crocodilo: { pt: 'Croco', en: 'Croc' },
  rino: { pt: 'Rino', en: 'Rhino' },
  bode: { pt: 'Bode', en: 'Goat' },
  ourico: { pt: 'Ouriço', en: 'Hedgehog' },
};

export interface Robo {
  id: string;
  corpo: Corpo;
  loco: Loco;
  cabeca: Cabeca;
  /** índice em CORES */
  cor: number;
  /** um por encaixe; null = parafuso à vista */
  modulos: (Modulo | null)[];
  /** modo Pilotos: o jogador que o monta e conduz (sem dono = IA) */
  dono?: string;
}

/**
 * Posição de cada encaixe (unidades do robô: raio ≈ 1, frente = −y).
 * O módulo aponta do centro para fora, para esse lado (direção fixa, sem mira automática).
 * Triângulo: 1 à frente, 2 atrás; quadrado 2×2; retângulo 4 em linha (de frente para trás, alternando lados).
 */
export const POS_ENCAIXES: Record<Corpo, [number, number][]> = {
  triangulo: [[0, -0.35], [-0.5, 0.45], [0.5, 0.45]],
  bola: [[-0.6, -0.15], [0.6, -0.15], [0, 0.62]],
  quadrado: [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]],
  retangulo: [[-0.42, -0.75], [0.42, -0.25], [-0.42, 0.25], [0.42, 0.75]],
  pentagono: [[0, -0.6], [0.62, -0.18], [0.4, 0.55], [-0.4, 0.55], [-0.62, -0.18]],
};

/** ângulo (rad) para onde o encaixe aponta, medido a partir da frente (−y), sentido horário */
export function direcaoEncaixe(corpo: Corpo, k: number): number {
  const [x, y] = POS_ENCAIXES[corpo][k];
  return Math.atan2(x, -y);
}
