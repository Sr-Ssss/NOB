const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sem I/O

/** número aleatório seguro em [0, 1) */
export function aleatorio(): number {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return b[0] / 2 ** 32;
}

/** letras do código de uma sala nova: 24⁵ ≈ 8 milhões (auditoria T8; com 4 eram só 332 mil) */
export const LETRAS_CODIGO = 5;

/** códigos que os telemóveis aceitam: 4 a 6 caracteres (os links antigos, de 4, continuam a funcionar) */
export const CODIGO_VALIDO = /^[A-Z0-9]{4,6}$/;

export function codigoSala(rnd: () => number = aleatorio): string {
  let s = '';
  for (let i = 0; i < LETRAS_CODIGO; i++) s += LETRAS[Math.floor(rnd() * LETRAS.length)];
  return s;
}

export function idAleatorio(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

/** parâmetros depois de `#/rota?` */
export function paramsHash(): URLSearchParams {
  return new URLSearchParams(location.hash.split('?')[1] ?? '');
}

/** id do jogador guardado no dispositivo; `?eu=2` permite vários jogadores em separadores (testes). */
export function meuId(): string {
  const chave = 'nob.id' + (paramsHash().get('eu') ?? '');
  let id = localStorage.getItem(chave);
  if (!id) {
    id = idAleatorio();
    localStorage.setItem(chave, id);
  }
  return id;
}

/**
 * Sal secreto dos sorteios (128 bits). Os jogos baralham com `agora + k`, e `agora` chega aos telemóveis
 * (pelo `terminaEm`); sem o sal, qualquer um recalculava papéis, cartas e códigos.
 * O host chama `novoSal()` ao arrancar; nos testes fica a zero (determinístico).
 */
let sal: [number, number, number, number] = [0, 0, 0, 0];

export function novoSal(): void {
  const b = new Uint32Array(4);
  crypto.getRandomValues(b);
  sal = [b[0], b[1], b[2], b[3]];
}

/** passagem do anfitrião (src/core/passagem.ts): o sal vai na cópia cifrada para o herdeiro */
export const obterSal = (): [number, number, number, number] => [...sal];

export function definirSal(s: unknown): boolean {
  if (!Array.isArray(s) || s.length !== 4 || !s.every((x) => Number.isInteger(x) && x >= 0 && x < 2 ** 32)) return false;
  sal = [s[0], s[1], s[2], s[3]];
  return true;
}

/** splitmix32: espalha a seed por 32 bits */
function mistura(x: number): number {
  x = (x + 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

/** baralha de forma determinística (seed numérica + sal secreto); sfc32, usa os bits altos */
export function baralhar<T>(lista: T[], seed: number): T[] {
  const a = [...lista];
  const s0 = Math.floor(seed / 2 ** 32) >>> 0;
  const s1 = seed >>> 0;
  let x = (mistura(s1) ^ sal[0]) >>> 0;
  let y = (mistura(s1 ^ 0x6a09e667) ^ mistura(s0) ^ sal[1]) >>> 0;
  let z = (mistura(s0 ^ 0xbb67ae85) ^ sal[2]) >>> 0;
  let c = (mistura(s1 + s0) ^ sal[3]) >>> 0;
  const prox = () => {
    const t = (((x + y) >>> 0) + c) >>> 0;
    c = (c + 1) >>> 0;
    x = (y ^ (y >>> 9)) >>> 0;
    y = (z + (z << 3)) >>> 0;
    z = ((z << 21) | (z >>> 11)) >>> 0;
    z = (z + t) >>> 0;
    return t / 2 ** 32;
  };
  for (let k = 0; k < 12; k++) prox();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(prox() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
