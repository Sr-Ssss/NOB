import { assinar, chaveValida, cifrar, decifrar, impressao, parValido, partilhada, verificar, type ChavesHost, type Cifrado, type ParChaves } from './cripto';
import type { AcaoSala, EstadoSala, VistaSala } from './sala';

/**
 * Mensagens no canal `sala:CODIGO` (info/arquitetura.md → Protocolo), agora com segredo e autenticação:
 * - `vista`: assinada pelo host (Ed25519); o telemóvel fixa a chave do host no 1.º contacto
 *   (ou confere com a impressão digital do link do QR) e ignora vistas de mais ninguém;
 * - `acao`: cifrada para o host com a chave do aparelho; o host fixa a chave pública de cada aparelho
 *   no 1.º contacto e recusa outra para o mesmo id (ninguém se faz passar por outro);
 * - `privado`: cifrado só para um aparelho.
 * Passagem do anfitrião (sem TV, src/core/passagem.ts):
 * - `copia`: o estado todo, cifrado só para o herdeiro, com chaves novas de anfitrião já assinadas pelo atual;
 * - a vista leva `prox` (impressão das chaves do herdeiro, dentro da assinatura) e a `cadeia` de passagens;
 * - o telemóvel troca de anfitrião só por uma cadeia válida que saia do anfitrião fixado, para o herdeiro que ele
 *   anunciou, e só se o anfitrião fixado estiver calado há `SILENCIO_TROCA`.
 */

export interface ChavesPublicasHost {
  assina: string;
  ecdh: string;
}

/** o anfitrião `de` (chave Ed25519) passa a party a `para` */
export interface Passagem {
  de: string;
  para: ChavesPublicasHost;
  sig: string;
}

export interface MsgVista {
  seq: number;
  agora: number;
  /** a vista em JSON (é o texto assinado) */
  txt: string;
  sig: string;
  host: ChavesPublicasHost;
  /** impressão das chaves do herdeiro (assinada com a vista) */
  prox?: string;
  /** passagens desde o anfitrião original até este (vazia = é o original) */
  cadeia?: Passagem[];
}

/** a cópia que o herdeiro guarda para assumir a party */
export interface CopiaHost {
  /** seq da última vista publicada */
  seq: number;
  /** hora do anfitrião quando fez a cópia */
  agora: number;
  estado: EstadoSala;
  /** sal secreto dos sorteios (src/core/ids.ts) */
  sal: number[];
  /** aparelho → chave pública (as fixadas + a do próprio anfitrião, que também joga) */
  fixadas: Record<string, string>;
  /** as chaves novas de anfitrião, para o herdeiro */
  chaves: ChavesHost;
  /** a cadeia até às chaves novas (a última passagem está assinada pelo anfitrião atual) */
  cadeia: Passagem[];
}

export interface MsgCopia extends Cifrado {
  para: string;
}

/** o telemóvel só aceita outro anfitrião se o fixado estiver calado há este tempo (ms) */
export const SILENCIO_TROCA = 8000;

export const publicas = (c: ChavesHost): ChavesPublicasHost => ({ assina: c.assina.pub, ecdh: c.ecdh.pub });

export interface MsgAcao extends Cifrado {
  de: string;
  /** chave pública X25519 do aparelho */
  chave: string;
}

export interface MsgPrivado extends Cifrado {
  para: string;
}

/** `de`: só o aparelho que pede (o host reenvia-lhe o privado) */
export interface MsgPedir {
  de?: string;
}

const ctxAcao = (codigo: string, de: string) => `a:${codigo}:${de}`;
const ctxPrivado = (codigo: string, para: string) => `p:${codigo}:${para}`;
const ctxCopia = (codigo: string, para: string) => `c:${codigo}:${para}`;
const textoAssinado = (codigo: string, seq: number, agora: number, prox: string, txt: string) => `v:${codigo}:${seq}:${agora}:${prox}:${txt}`;
const textoPassagem = (codigo: string, de: string, para: ChavesPublicasHost) => `h:${codigo}:${de}:${para.assina}:${para.ecdh}`;

/**
 * A cadeia leva da chave `inicio` até `fim`, elo a elo, cada um assinado pelo anterior?
 * Devolve o índice do elo que sai de `inicio`, ou -1.
 */
export function seguirCadeia(codigo: string, inicio: string, cadeia: unknown, fim: ChavesPublicasHost): number {
  if (!Array.isArray(cadeia) || !cadeia.length || cadeia.length > 50) return -1;
  const i = cadeia.findIndex((p) => (p as Passagem | null)?.de === inicio);
  if (i < 0) return -1;
  let atual = inicio;
  let para: ChavesPublicasHost | null = null;
  for (let k = i; k < cadeia.length; k++) {
    const p = cadeia[k] as Partial<Passagem> | null;
    if (!p || p.de !== atual || !p.para || !chaveValida(p.para.assina) || !chaveValida(p.para.ecdh)) return -1;
    if (!verificar(atual, textoPassagem(codigo, atual, p.para), p.sig)) return -1;
    para = p.para;
    atual = p.para.assina;
  }
  return para && para.assina === fim.assina && para.ecdh === fim.ecdh ? i : -1;
}

/** vista bem formada e bem assinada pela chave que diz ter (falta saber se é a chave certa) */
function abrirVista(codigo: string, d: unknown): { m: MsgVista; vista: VistaSala } | null {
  const m = d as Partial<MsgVista> | null;
  if (!m || typeof m.seq !== 'number' || typeof m.agora !== 'number' || typeof m.txt !== 'string' || !m.host) return null;
  const h = m.host;
  if (!chaveValida(h.assina) || !chaveValida(h.ecdh)) return null;
  if (m.prox !== undefined && (typeof m.prox !== 'string' || m.prox.length > 32)) return null;
  if (!verificar(h.assina, textoAssinado(codigo, m.seq, m.agora, m.prox ?? '', m.txt), m.sig)) return null;
  try {
    return { m: m as MsgVista, vista: JSON.parse(m.txt) as VistaSala };
  } catch {
    return null;
  }
}

export class ProtocoloHost {
  constructor(
    readonly codigo: string,
    readonly chaves: ChavesHost,
    /** aparelho → chave pública fixada */
    readonly fixadas: Record<string, string> = {},
    private aoFixar?: (f: Record<string, string>) => void,
    /** passagens até este anfitrião (vazia = é o original) */
    readonly cadeia: Passagem[] = [],
  ) {}

  /** último número de cada aparelho: uma ação gravada e repetida mais tarde é recusada */
  private ultimos: Record<string, number> = {};

  /** aparelhos expulsos (src/core/membros.ts): ids e as chaves que tinham fixadas */
  private idsBarrados = new Set<string>();
  private chavesBarradas = new Set<string>();

  /**
   * Deixa de abrir as ações destes aparelhos: pelo id e pela chave fixada (o mesmo aparelho, com outro id
   * e a mesma chave, também fica de fora). O host chama-o com `EstadoSala.expulsos` sempre que muda.
   */
  barrar(ids: readonly string[]): void {
    for (const id of ids) {
      this.idsBarrados.add(id);
      const k = this.fixadas[id];
      if (k) this.chavesBarradas.add(k);
    }
  }

  barrado(id: string): boolean {
    return this.idsBarrados.has(id) || (!!this.fixadas[id] && this.chavesBarradas.has(this.fixadas[id]));
  }

  get impressao(): string {
    return impressao(this.chaves.assina.pub);
  }

  /** decifra uma ação; null = falsa, de outro aparelho ou estragada */
  abrir(d: unknown): { de: string; acao: AcaoSala } | null {
    const m = d as Partial<MsgAcao> | null;
    if (!m || typeof m.de !== 'string' || !m.de || m.de.length > 80 || !chaveValida(m.chave)) return null;
    if (this.idsBarrados.has(m.de) || this.chavesBarradas.has(m.chave)) return null;
    const fixa = this.fixadas[m.de];
    if (fixa && fixa !== m.chave) return null;
    const corpo = decifrar<{ n: number; a: AcaoSala }>(partilhada(this.chaves.ecdh.priv, m.chave), m, ctxAcao(this.codigo, m.de));
    const acao = corpo?.a;
    if (!corpo || typeof corpo.n !== 'number' || !acao || typeof acao !== 'object' || typeof acao.tipo !== 'string') return null;
    if (corpo.n <= (this.ultimos[m.de] ?? 0)) return null;
    this.ultimos[m.de] = corpo.n;
    if (!fixa) {
      this.fixadas[m.de] = m.chave;
      this.aoFixar?.(this.fixadas);
    }
    return { de: m.de, acao };
  }

  /** `prox`: impressão das chaves do herdeiro (só sem TV) */
  vista(seq: number, agora: number, v: VistaSala, prox?: string): MsgVista {
    const txt = JSON.stringify(v);
    const m: MsgVista = { seq, agora, txt, sig: assinar(this.chaves.assina.priv, textoAssinado(this.codigo, seq, agora, prox ?? '', txt)), host: publicas(this.chaves) };
    if (prox) m.prox = prox;
    if (this.cadeia.length) m.cadeia = this.cadeia;
    return m;
  }

  /** assina as chaves do próximo anfitrião */
  passar(para: ChavesPublicasHost): Passagem {
    return { de: this.chaves.assina.pub, para, sig: assinar(this.chaves.assina.priv, textoPassagem(this.codigo, this.chaves.assina.pub, para)) };
  }

  /** a cópia do estado, cifrada só para o herdeiro; null = aparelho desconhecido */
  copia(para: string, dados: CopiaHost): MsgCopia | null {
    const pub = this.fixadas[para];
    if (!pub) return null;
    return { para, ...cifrar(partilhada(this.chaves.ecdh.priv, pub), dados, ctxCopia(this.codigo, para)) };
  }

  /** uma vista de outro anfitrião que descende de mim (alguém assumiu a party): as chaves dele, ou null */
  substituidoPor(d: unknown): ChavesPublicasHost | null {
    const v = abrirVista(this.codigo, d);
    if (!v || v.m.host.assina === this.chaves.assina.pub) return null;
    return seguirCadeia(this.codigo, this.chaves.assina.pub, v.m.cadeia, v.m.host) >= 0 ? { assina: v.m.host.assina, ecdh: v.m.host.ecdh } : null;
  }

  /** null = aparelho desconhecido */
  privado(para: string, dados: unknown): MsgPrivado | null {
    const pub = this.fixadas[para];
    if (!pub) return null;
    return { para, ...cifrar(partilhada(this.chaves.ecdh.priv, pub), dados, ctxPrivado(this.codigo, para)) };
  }
}

export class ProtocoloCliente {
  constructor(
    readonly codigo: string,
    readonly eu: string,
    readonly chaves: ParChaves,
    /** impressão digital esperada (do link do QR); sem ela, fica a 1.ª chave que aparecer */
    readonly esperado: string | null = null,
    public host: ChavesPublicasHost | null = null,
    private aoFixar?: (h: ChavesPublicasHost) => void,
  ) {}

  /** hora (local) da última vista do anfitrião fixado; -∞ = ainda nenhuma desde que a página abriu */
  ultima = -Infinity;
  /** o herdeiro que o anfitrião fixado anunciou por último */
  prox: string | null = null;

  /**
   * Só aceita vistas assinadas pelo host fixado, ou pelo sucessor dele (passagem do anfitrião):
   * cadeia válida a partir do fixado, para o herdeiro anunciado, e o fixado calado há `SILENCIO_TROCA`.
   * `trocou`: esta vista mudou o anfitrião fixado.
   */
  lerVista(d: unknown, agora = Date.now()): { seq: number; agora: number; vista: VistaSala; prox: string | null; trocou: boolean } | null {
    const v = abrirVista(this.codigo, d);
    if (!v) return null;
    const { m } = v;
    const h = { assina: m.host.assina, ecdh: m.host.ecdh };
    let trocou = false;
    if (this.host && (this.host.assina !== h.assina || this.host.ecdh !== h.ecdh)) {
      const i = seguirCadeia(this.codigo, this.host.assina, m.cadeia, h);
      if (i < 0 || agora - this.ultima < SILENCIO_TROCA) return null;
      if (this.prox && impressao(m.cadeia![i].para.assina) !== this.prox) return null;
      trocou = true;
    } else if (!this.host && this.esperado && impressao(h.assina) !== this.esperado) {
      // entrou pelo QR de um anfitrião que entretanto passou a party
      const i = (m.cadeia ?? []).findIndex((p) => impressao(p.de) === this.esperado);
      if (i < 0 || seguirCadeia(this.codigo, m.cadeia![i].de, m.cadeia, h) < 0) return null;
    }
    if (!this.host || trocou) {
      this.host = h;
      this.aoFixar?.(this.host);
    }
    this.ultima = agora;
    this.prox = m.prox ?? null;
    return { seq: m.seq, agora: m.agora, vista: v.vista, prox: this.prox, trocou };
  }

  /** a cópia do estado para assumir a party, se o anfitrião fixado me escolheu como herdeiro */
  lerCopia(d: unknown): CopiaHost | null {
    const m = d as Partial<MsgCopia> | null;
    if (!this.host || !m || m.para !== this.eu) return null;
    const k = decifrar<CopiaHost>(partilhada(this.chaves.priv, this.host.ecdh), m, ctxCopia(this.codigo, this.eu));
    if (!k || typeof k !== 'object' || typeof k.seq !== 'number' || typeof k.agora !== 'number') return null;
    const e = k.estado as Partial<EstadoSala> | null;
    if (!e || typeof e !== 'object' || e.codigo !== this.codigo || !Array.isArray(e.jogadores) || !e.aliases) return null;
    if (!Array.isArray(k.sal) || k.sal.length !== 4 || !k.fixadas || typeof k.fixadas !== 'object') return null;
    if (!k.chaves || !parValido(k.chaves.assina) || !parValido(k.chaves.ecdh)) return null;
    if (seguirCadeia(this.codigo, this.host.assina, k.cadeia, publicas(k.chaves)) < 0) return null;
    const fixadas = Object.fromEntries(Object.entries(k.fixadas).filter((x): x is [string, string] => chaveValida(x[1]) && x[0].length <= 80));
    return { ...k, fixadas };
  }

  /** sobe sempre (hora em µs), também depois de recarregar a página */
  private n = 0;

  /** null enquanto não se conhece o host */
  acao(a: AcaoSala): MsgAcao | null {
    if (!this.host) return null;
    this.n = Math.max(Date.now() * 1000, this.n + 1);
    return { de: this.eu, chave: this.chaves.pub, ...cifrar(partilhada(this.chaves.priv, this.host.ecdh), { n: this.n, a }, ctxAcao(this.codigo, this.eu)) };
  }

  lerPrivado(d: unknown): Record<string, unknown> | null {
    const m = d as Partial<MsgPrivado> | null;
    if (!this.host || !m || m.para !== this.eu) return null;
    return decifrar<Record<string, unknown>>(partilhada(this.chaves.priv, this.host.ecdh), m, ctxPrivado(this.codigo, this.eu));
  }
}
