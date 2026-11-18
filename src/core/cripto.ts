import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

/**
 * Segredo e autenticação (info/auditoria/2026-11-17.md → T3–T7). Tudo síncrono e em JS puro (@noble),
 * para funcionar também em http:// (dev na rede local), onde o `crypto.subtle` não existe.
 * - Telemóvel: par X25519 guardado no aparelho. A chave pública vai com cada ação; o host fixa-a no 1.º contacto.
 * - Host: par Ed25519 (assina as vistas) + par X25519 (segredo partilhado com cada telemóvel).
 * - Ações e privados: XChaCha20-Poly1305 com a chave partilhada; só quem tem a chave privada do aparelho
 *   consegue cifrar (autentica) ou decifrar (segredo).
 */

export interface ParChaves {
  priv: string;
  pub: string;
}

export interface ChavesHost {
  assina: ParChaves; // Ed25519
  ecdh: ParChaves; // X25519
}

const par = (c: { secretKey: Uint8Array; publicKey: Uint8Array }): ParChaves => ({ priv: bytesToHex(c.secretKey), pub: bytesToHex(c.publicKey) });

export const novasChavesDispositivo = (): ParChaves => par(x25519.keygen());
export const novasChavesHost = (): ChavesHost => ({ assina: par(ed25519.keygen()), ecdh: par(x25519.keygen()) });

const hex64 = /^[0-9a-f]{64}$/;
export const chaveValida = (x: unknown): x is string => typeof x === 'string' && hex64.test(x);

/** lê do armazenamento (ou cria e guarda) */
export function guardadas<T>(armazem: () => Storage, chave: string, criar: () => T, valido: (x: unknown) => boolean): T {
  try {
    const x = JSON.parse(armazem().getItem(chave) ?? 'null');
    if (valido(x)) return x as T;
  } catch {
    /* sem armazenamento ou estragado */
  }
  const novo = criar();
  try {
    armazem().setItem(chave, JSON.stringify(novo));
  } catch {
    /* sem armazenamento: só dura esta página */
  }
  return novo;
}

export const parValido = (x: unknown): boolean => !!x && chaveValida((x as ParChaves).priv) && chaveValida((x as ParChaves).pub);

const partilhadas = new Map<string, Uint8Array>();
/** chave simétrica entre a minha privada X25519 e a pública do outro */
export function partilhada(priv: string, pub: string): Uint8Array {
  const k = priv + pub;
  let s = partilhadas.get(k);
  if (!s) {
    const bruto = x25519.getSharedSecret(hexToBytes(priv), hexToBytes(pub));
    const junto = new Uint8Array(bruto.length + 6);
    junto.set(bruto);
    junto.set(utf8ToBytes('nob-v1'), bruto.length);
    s = sha256(junto);
    partilhadas.set(k, s);
  }
  return s;
}

function paraB64(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

function deB64(s: string): Uint8Array {
  const t = atob(s);
  const b = new Uint8Array(t.length);
  for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i);
  return b;
}

export interface Cifrado {
  n: string; // nonce (24 bytes)
  c: string; // texto cifrado + etiqueta
}

/** `contexto` (ex.: "a:ABCD:<aparelho>") prende a mensagem a quem e para quê: não serve noutro sítio */
export function cifrar(chave: Uint8Array, dados: unknown, contexto: string): Cifrado {
  const n = new Uint8Array(24);
  crypto.getRandomValues(n);
  const c = xchacha20poly1305(chave, n, utf8ToBytes(contexto)).encrypt(utf8ToBytes(JSON.stringify(dados)));
  return { n: paraB64(n), c: paraB64(c) };
}

/** null = falsificado, estragado ou de outra pessoa */
export function decifrar<T>(chave: Uint8Array, m: Partial<Cifrado> | null | undefined, contexto: string): T | null {
  if (!m || typeof m.n !== 'string' || typeof m.c !== 'string') return null;
  try {
    const t = xchacha20poly1305(chave, deB64(m.n), utf8ToBytes(contexto)).decrypt(deB64(m.c));
    return JSON.parse(new TextDecoder().decode(t)) as T;
  } catch {
    return null;
  }
}

export function assinar(priv: string, texto: string): string {
  return bytesToHex(ed25519.sign(utf8ToBytes(texto), hexToBytes(priv)));
}

export function verificar(pub: string, texto: string, assinatura: unknown): boolean {
  if (!chaveValida(pub) || typeof assinatura !== 'string' || !/^[0-9a-f]{128}$/.test(assinatura)) return false;
  try {
    return ed25519.verify(hexToBytes(assinatura), utf8ToBytes(texto), hexToBytes(pub));
  } catch {
    return false;
  }
}

export const resumo = (texto: string): string => bytesToHex(sha256(utf8ToBytes(texto)));

/**
 * Marca de "és tu": o host publica `marca(tag, contexto)` em vez da tag; o telemóvel calcula a sua e compara.
 * Muda com o contexto (fase, ronda…), por isso não liga jogadores entre fases nem serve para mais nada.
 */
export const marca = (tag: string, contexto: string): string => resumo(tag + '|' + contexto).slice(0, 16);

/** impressão digital curta da chave do host (vai no link do QR) */
export const impressao = (pub: string): string => resumo('host|' + pub).slice(0, 12);
