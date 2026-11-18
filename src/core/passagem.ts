import { ID_TV, type EstadoSala } from './sala';
import type { CopiaHost } from './protocolo';

/**
 * Passagem do anfitrião (modo sem TV, pedido de 17/11): o telemóvel do criador guarda o estado e corre o relógio;
 * se ele fechar a app, outro telemóvel assume a party sem perder pontos nem papéis.
 * - O anfitrião escolhe um herdeiro (`escolherHerdeiro`) e manda-lhe de tempos a tempos uma cópia do estado,
 *   cifrada só para ele, com chaves novas de anfitrião já assinadas pelas suas (src/core/protocolo.ts → `copia`).
 * - Publica uma vista pelo menos a cada `BATIMENTO`, com a impressão das chaves do herdeiro (`prox`).
 * - O herdeiro, se ficar `ESPERA_HERDEIRO` sem vistas, passa a anfitrião com a cópia (`#/criar`).
 * - Os outros telemóveis aceitam o novo anfitrião pela cadeia de passagens assinadas.
 * - Se o anfitrião antigo voltar e vir que foi substituído, passa a jogador normal.
 */

/** sem vistas há este tempo, o herdeiro assume (ms) */
export const ESPERA_HERDEIRO = 15_000;
/** o anfitrião publica a vista pelo menos com este intervalo, mesmo sem mudanças (ms) */
export const BATIMENTO = 3000;
/** cópias ao herdeiro: no máximo uma por este intervalo (ms), e pelo menos uma a cada `COPIA_MAX` */
export const INTERVALO_COPIA = 2000;
export const COPIA_MAX = 10_000;

/**
 * O aparelho que herda a party: o do líder (se não é o anfitrião), senão o do jogador ligado mais antigo,
 * como em `escolherVip`. Só aparelhos presentes no canal e com chave fixada (o anfitrião tem de os conhecer).
 * `euHost`: o aparelho do próprio anfitrião (não herda de si mesmo).
 */
export function escolherHerdeiro(s: EstadoSala, presentes: string[], fixadas: Record<string, string>, euHost: string): string | null {
  const real = (ap: string) => s.aliases[ap] ?? ap;
  const hostId = real(euHost);
  const cand = presentes
    .filter((ap) => ap !== ID_TV && ap !== euHost && !!fixadas[ap] && real(ap) !== hostId)
    .map((ap) => ({ ap, i: s.jogadores.findIndex((j) => j.id === real(ap) && j.ligado && !j.bot) }))
    .filter((c) => c.i >= 0);
  cand.sort((a, b) => Number(real(b.ap) === s.vipId) - Number(real(a.ap) === s.vipId) || a.i - b.i);
  return cand[0]?.ap ?? null;
}

/** o que o herdeiro leva de `#/jogar` para `#/criar` (fica no separador, é lido e apagado ao assumir) */
export interface Assumir {
  copia: CopiaHost;
  /**
   * hora do anfitrião quando o herdeiro decidiu assumir, tal como os telemóveis a viam (última vista + o tempo que passou).
   * O relógio continua daí: os segundos sem anfitrião contam, senão o relógio dos jogos salta para trás (auditoria 17/11).
   */
  ate: number;
  /** hora local em que guardou (o tempo até `#/criar` arrancar também conta) */
  em: number;
}

const CHAVE = 'nob.assumir';

export function guardarAssumir(copia: CopiaHost, ate: number, em = Date.now()): void {
  sessionStorage.setItem(CHAVE, JSON.stringify({ copia, ate, em } satisfies Assumir));
}

const numero = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? x : 0);

/**
 * A hora em que o herdeiro retoma: a que os telemóveis viam ao assumir, mais o que passou desde então
 * (no máximo 1 min, a validade de `tirarAssumir`); nunca antes da cópia.
 */
export function horaRetoma(a: Pick<Assumir, 'copia' | 'ate' | 'em'>, agoraLocal = Date.now()): number {
  const ate = numero(a.ate);
  if (!ate) return a.copia.agora;
  const passou = Math.min(60_000, Math.max(0, agoraLocal - (numero(a.em) || agoraLocal)));
  return Math.max(a.copia.agora, ate + passou);
}

/** lê e apaga; null se não há ou é velho (> 1 min) */
export function tirarAssumir(): Assumir | null {
  try {
    const a = JSON.parse(sessionStorage.getItem(CHAVE) ?? 'null') as Assumir | null;
    sessionStorage.removeItem(CHAVE);
    if (a && a.copia && Date.now() - a.em < 60_000) return a;
  } catch {
    /* sem armazenamento */
  }
  return null;
}

/**
 * Recarregar o anfitrião (F5, ou o Android a matar e reabrir a app) não apaga a party: o anfitrião grava o estado
 * no separador (`sessionStorage`) a cada `INTERVALO_COPIA`, ao sair da página e ao sair do ecrã, e recupera-o ao arrancar.
 * Fechar o separador apaga-a (aí vale a passagem ao herdeiro); passar a jogador (substituído) também.
 */
export interface Gravado {
  estado: EstadoSala;
  sal: number[];
  /** hora do anfitrião quando gravou (o relógio retoma daí) */
  agora: number;
  /** hora local da gravação */
  em: number;
}

export const CHAVE_ESTADO = 'nob.tv.estado';
export const CHAVE_SEQ = 'nob.tv.seq';
/** uma gravação mais velha do que isto já não serve (ms) */
export const VALIDADE_GRAVADO = 60 * 60 * 1000;

export function gravarEstado(arm: Pick<Storage, 'setItem'>, g: Omit<Gravado, 'em'>, em = Date.now()): void {
  try {
    arm.setItem(CHAVE_ESTADO, JSON.stringify({ ...g, em } satisfies Gravado));
  } catch {
    /* sem armazenamento ou cheio */
  }
}

/** a gravação desta party (mesmo código, recente e bem formada), ou null */
export function lerEstado(arm: Pick<Storage, 'getItem'>, codigo: string, agoraLocal = Date.now()): Gravado | null {
  try {
    const g = JSON.parse(arm.getItem(CHAVE_ESTADO) ?? 'null') as Partial<Gravado> | null;
    if (!g || typeof g.agora !== 'number' || typeof g.em !== 'number' || agoraLocal - g.em > VALIDADE_GRAVADO || agoraLocal < g.em) return null;
    const e = g.estado;
    if (!e || e.codigo !== codigo || !Array.isArray(e.jogadores) || !e.aliases || !Array.isArray(g.sal)) return null;
    return g as Gravado;
  } catch {
    return null;
  }
}

/** a rota com o `?eu=` dos testes (vários jogadores em separadores) */
export function rotaCom(rota: string, params: Record<string, string>, eu: string | null): string {
  const p = new URLSearchParams(params);
  if (eu) p.set('eu', eu);
  const q = p.toString();
  return '#' + rota + (q ? '?' + q : '');
}
