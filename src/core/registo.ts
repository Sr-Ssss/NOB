/**
 * Registo dos jogos: tudo o que a sala (`src/core/sala.ts`) precisa de saber de cada jogo.
 * Jogo novo: a pasta `src/jogos/<jogo>/` + uma entrada aqui + os ecrãs em `src/jogos/ecras.tsx`
 * (o TypeScript obriga a essa entrada) + a linha do menu em `src/core/jogos.ts` (CATALOGO).
 * A ordem daqui é a ordem das opções no lobby do líder.
 */
import type { Idioma } from './sala';
import { DEF_PADRAO, MIN_LIGADOS, novoJogo, reduz5050, vista5050 } from '../jogos/5050/regras';
import { DEF_PADRAO_PENSA, MIN_JOGADORES as MIN_PENSA, novoPensa, reduzPensa, vistaPensa } from '../jogos/pensa-dores/regras';
import { perguntasPensa } from '../jogos/pensa-dores/conteudo';
import { DEF_PADRAO_WIFI, MIN_JOGADORES as MIN_WIFI, SO_LIDER_WIFI, TIPOS_WIFI, importanteWifi, novoWifi, privadoWifi, reduzWifi, sairWifi, vistaWifi } from '../jogos/senha-wifi/regras';
import { palavrasWifi } from '../jogos/senha-wifi/conteudo';
import { DEF_PADRAO_SEVIRA, MIN_JOGADORES as MIN_SEVIRA, TIPOS_SEVIRA, importanteSevira, novoSevira, privadoSevira, reduzSevira, sairSevira, vistaSevira } from '../jogos/se-vira/regras';
import { conteudoSevira } from '../jogos/se-vira/conteudo';
import { DEF_PADRAO_MONA, MIN_JOGADORES as MIN_MONA, TIPOS_MONA, novoMona, reduzMona, vistaMona } from '../jogos/mona-lixa/regras';
import { conteudoMona } from '../jogos/mona-lixa/conteudo';
import { DEF_PADRAO_IDEIAS, MIN_JOGADORES as MIN_IDEIAS, TIPOS_IDEIAS, novoIdeias, reduzIdeias, vistaIdeias } from '../jogos/ideias-mirabolantes/regras';
import { conteudoIdeias } from '../jogos/ideias-mirabolantes/conteudo';
import {
  DEF_PADRAO_PIRATA,
  MAX_JOGADORES as MAX_PIRATA,
  MIN_JOGADORES as MIN_PIRATA,
  SO_LIDER_PIRATA,
  TIPOS_PIRATA,
  foraPirata,
  importantePirata,
  novoPirata,
  privadoPirata,
  reduzPirata,
  sairPirata,
  vistaPirata,
} from '../jogos/pirata/regras';
import {
  DEF_PADRAO_MAQUINAS,
  MAX_JOGADORES as MAX_MAQUINAS,
  MIN_JOGADORES as MIN_MAQUINAS,
  SO_LIDER_MAQUINAS,
  TIPOS_MAQUINAS,
  foraMaquinas,
  importanteMaquinas,
  novoMaquinas,
  privadoMaquinas,
  reduzMaquinas,
  sairMaquinas,
  vistaMaquinas,
} from '../jogos/revolucao-maquinas/regras';
import {
  DEF_PADRAO_REI,
  MAX_JOGADORES as MAX_REI,
  MIN_JOGADORES as MIN_REI,
  SO_LIDER_REI,
  TIPOS_REI,
  importanteRei,
  novoRei,
  podeSeguirSemRei,
  privadoRei,
  reduzRei,
  sairRei,
  vistaRei,
} from '../jogos/rei-dragao/regras';
import {
  DEF_PADRAO_RAGEROB,
  MAX_JOGADORES as MAX_RAGEROB,
  MIN_JOGADORES as MIN_RAGEROB,
  SO_TV_RAGEROB,
  TIPOS_RAGEROB,
  classificacao as classificacaoRagerob,
  novoRagerob,
  reduzRagerob,
  vistaRagerob,
} from '../jogos/ragerob/regras';
import { BOT_5050, BOT_IDEIAS, BOT_MAQUINAS, BOT_MONA, BOT_PENSA, BOT_PIRATA, BOT_RAGEROB, BOT_REI, BOT_SEVIRA, BOT_WIFI, type BotJogo } from './ia';

/** o que todos os estados de jogo têm (a sala e as saídas a meio contam com isto) */
export interface JogoComum {
  fase: string;
  terminaEm: number;
  pausaRestante: number | null;
  participantes: string[];
  audiencia: string[];
  usadas: string[];
}

/** saídas a meio (src/core/saidas.ts): jogos sem ganchos nunca pausam por quem saiu */
export interface Ganchos<G> {
  /** faz falta: sem ele o jogo pausa */
  importante?: (g: G, id: string) => boolean;
  /** já não joga (ex.: foi ao mar): não aparece como "saiu" */
  fora?: (g: G, id: string) => boolean;
  /** dá para seguir sem ele? (ex.: o Rei e o Dragão, não) */
  podeSeguir?: (g: G, id: string) => boolean;
  seguirSem?: (g: G, id: string, agora: number) => G;
}

/**
 * Um jogo, para a sala.
 * - `id`: o do menu e da ação `comecar`; `chave`/`chaveDef`: onde o estado e as opções vivem na sala;
 *   `definir`: a ação do líder que muda as opções.
 * - `aceita`: as ações deste jogo (`ligados` e `tick` vão sempre); `soLider`: só o líder (ou a TV) as manda.
 * - `vista`: o que vai para o canal público (sem segredos: ver registo.test.ts); `privado`: o canal privado.
 */
export interface DefJogo<I extends string, C extends string, CD extends string, T extends string, G extends JogoComum, D, V, A> {
  id: I;
  chave: C;
  chaveDef: CD;
  definir: T;
  padrao: D;
  min: number;
  max?: number;
  /** só com TV (info/arquitetura.md → Modo sem TV) */
  soTv?: boolean;
  novo(ids: string[], def: D, agora: number, usadas: string[], idioma: Idioma): G;
  reduz(g: G, a: A, agora: number): G;
  aceita(a: { tipo: string }): boolean;
  soLider?: readonly string[];
  /** ações que só a TV manda (nem o líder) */
  soTvManda?: readonly string[];
  vista(g: G, marca: (id: string) => string): V;
  /** `semTv`: a party não tem TV (o Se Vira! manda então a imagem da galeria do slide atual a cada telemóvel); `bot`: `id` é um bot */
  privado?(g: G, id: string, ctx: { semTv: boolean; bot: boolean }): unknown;
  ganchos?: Ganchos<G>;
  /** "IA jogável" dos bots (src/core/ia.ts) */
  bot?: BotJogo<G, A>;
  /** torneio (src/core/modos.ts): os pontos finais por jogador (maior = melhor); por defeito `g.pontos` */
  resultado?(g: G): Record<string, number>;
}

const jogo = <I extends string, C extends string, CD extends string, T extends string, G extends JogoComum, D, V, A>(d: DefJogo<I, C, CD, T, G, D, V, A>) => d;
const de = (tipos: readonly string[]) => (a: { tipo: string }) => tipos.includes(a.tipo);

export const JOGOS = [
  jogo({
    id: '5050',
    chave: 'jogo',
    chaveDef: 'def',
    definir: 'definir',
    padrao: DEF_PADRAO,
    min: MIN_LIGADOS,
    novo: (ids, def, agora, usadas) => novoJogo(ids, def, agora, usadas),
    reduz: reduz5050,
    // o "votar" do 50/50 leva um lado (o do Pensa-Dores leva um autor)
    aceita: (a) => a.tipo === 'enviar' || (a.tipo === 'votar' && 'lado' in a),
    vista: vista5050,
    bot: BOT_5050,
  }),
  jogo({
    id: 'pensa',
    chave: 'pensa',
    chaveDef: 'defPensa',
    definir: 'definir_pensa',
    padrao: DEF_PADRAO_PENSA,
    min: MIN_PENSA,
    novo: (ids, def, agora, usadas) => {
      const { normais, finais } = perguntasPensa();
      return novoPensa(ids, def, agora, normais, finais, usadas);
    },
    reduz: reduzPensa,
    aceita: (a) => a.tipo === 'responder' || a.tipo === 'votos_final' || (a.tipo === 'votar' && !('lado' in a)),
    vista: vistaPensa,
    bot: BOT_PENSA,
  }),
  jogo({
    id: 'wifi',
    chave: 'wifi',
    chaveDef: 'defWifi',
    definir: 'definir_wifi',
    padrao: DEF_PADRAO_WIFI,
    min: MIN_WIFI,
    novo: (ids, def, agora, usadas, idioma) => novoWifi(ids, def, agora, palavrasWifi(), idioma, usadas),
    reduz: reduzWifi,
    aceita: de(TIPOS_WIFI),
    soLider: SO_LIDER_WIFI,
    vista: (g) => vistaWifi(g),
    privado: privadoWifi,
    ganchos: { importante: importanteWifi, seguirSem: sairWifi },
    bot: BOT_WIFI,
  }),
  jogo({
    id: 'sevira',
    chave: 'sevira',
    chaveDef: 'defSevira',
    definir: 'definir_sevira',
    padrao: DEF_PADRAO_SEVIRA,
    min: MIN_SEVIRA,
    novo: (ids, def, agora, usadas, idioma) => novoSevira(ids, def, agora, conteudoSevira(), idioma, usadas),
    reduz: reduzSevira,
    aceita: de(TIPOS_SEVIRA),
    vista: vistaSevira,
    privado: privadoSevira,
    ganchos: { importante: importanteSevira, seguirSem: sairSevira },
    bot: BOT_SEVIRA,
  }),
  jogo({
    id: 'mona',
    chave: 'mona',
    chaveDef: 'defMona',
    definir: 'definir_mona',
    padrao: DEF_PADRAO_MONA,
    min: MIN_MONA,
    novo: (ids, def, agora, usadas, idioma) => novoMona(ids, def, agora, conteudoMona(), idioma, usadas),
    reduz: reduzMona,
    aceita: de(TIPOS_MONA),
    vista: vistaMona,
    bot: BOT_MONA,
  }),
  jogo({
    id: 'ideias',
    chave: 'ideias',
    chaveDef: 'defIdeias',
    definir: 'definir_ideias',
    padrao: DEF_PADRAO_IDEIAS,
    min: MIN_IDEIAS,
    novo: (ids, def, agora, usadas, idioma) => novoIdeias(ids, def, agora, conteudoIdeias(), idioma, usadas),
    reduz: reduzIdeias,
    aceita: de(TIPOS_IDEIAS),
    vista: vistaIdeias,
    bot: BOT_IDEIAS,
  }),
  jogo({
    id: 'pirata',
    chave: 'pirata',
    chaveDef: 'defPirata',
    definir: 'definir_pirata',
    padrao: DEF_PADRAO_PIRATA,
    min: MIN_PIRATA,
    max: MAX_PIRATA,
    novo: (ids, def, agora, usadas) => novoPirata(ids, def, agora, usadas),
    reduz: reduzPirata,
    aceita: de(TIPOS_PIRATA),
    soLider: SO_LIDER_PIRATA,
    vista: (g) => vistaPirata(g),
    privado: privadoPirata,
    ganchos: { importante: importantePirata, fora: foraPirata, seguirSem: sairPirata },
    bot: BOT_PIRATA,
  }),
  jogo({
    id: 'maquinas',
    chave: 'maquinas',
    chaveDef: 'defMaquinas',
    definir: 'definir_maquinas',
    padrao: DEF_PADRAO_MAQUINAS,
    min: MIN_MAQUINAS,
    max: MAX_MAQUINAS,
    novo: (ids, def, agora, usadas) => novoMaquinas(ids, def, agora, usadas),
    reduz: reduzMaquinas,
    aceita: de(TIPOS_MAQUINAS),
    soLider: SO_LIDER_MAQUINAS,
    vista: (g) => vistaMaquinas(g),
    privado: privadoMaquinas,
    ganchos: { importante: importanteMaquinas, fora: foraMaquinas, seguirSem: sairMaquinas },
    bot: BOT_MAQUINAS,
  }),
  jogo({
    id: 'rei',
    chave: 'rei',
    chaveDef: 'defRei',
    definir: 'definir_rei',
    padrao: DEF_PADRAO_REI,
    min: MIN_REI,
    max: MAX_REI,
    novo: (ids, def, agora, usadas) => novoRei(ids, def, agora, usadas),
    reduz: reduzRei,
    aceita: de(TIPOS_REI),
    soLider: SO_LIDER_REI,
    vista: (g) => vistaRei(g),
    privado: privadoRei,
    ganchos: { importante: importanteRei, podeSeguir: podeSeguirSemRei, seguirSem: sairRei },
    bot: BOT_REI,
  }),
  jogo({
    id: 'ragerob',
    chave: 'ragerob',
    chaveDef: 'defRagerob',
    definir: 'definir_ragerob',
    padrao: DEF_PADRAO_RAGEROB,
    min: MIN_RAGEROB,
    max: MAX_RAGEROB,
    novo: (ids, def, agora, usadas) => novoRagerob(ids, def, agora, usadas),
    reduz: reduzRagerob,
    aceita: de(TIPOS_RAGEROB),
    // as vidas, os quadros da arena e o fim do combate só vêm do host (a TV ou, sem TV, o telemóvel que tem a sala)
    soTvManda: SO_TV_RAGEROB,
    vista: (g) => vistaRagerob(g),
    bot: BOT_RAGEROB,
    // os pontos são dos robôs: vale a classificação dos jogadores (dinheiro, ou a ordem do robô de cada um no modo Pilotos)
    resultado: (g) => Object.fromEntries(classificacaoRagerob(g).map((c, i, l) => [c.id, g.def.modo === 'normal' ? c.valor : l.length - i])),
  }),
] as const;

// ---- tipos derivados do registo (EstadoSala, VistaSala e AcaoSala usam-nos) ----

export type Registado = (typeof JOGOS)[number];
export type IdJogo = Registado['id'];
export type ChaveJogo = Registado['chave'];
/* eslint-disable @typescript-eslint/no-explicit-any */
export type EstadoDe<J> = J extends DefJogo<any, any, any, any, infer G, any, any, any> ? G : never;
export type DefDe<J> = J extends DefJogo<any, any, any, any, any, infer D, any, any> ? D : never;
export type VistaDe<J> = J extends DefJogo<any, any, any, any, any, any, infer V, any> ? V : never;
type AcaoDe<J> = J extends DefJogo<any, any, any, any, any, any, any, infer A> ? A : never;
/* eslint-enable @typescript-eslint/no-explicit-any */

/** os campos de cada jogo no estado da sala (null/ausente = não está a ser jogado) */
export type EstadosJogos = { [J in Registado as J['chave']]?: EstadoDe<J> | null };
/** as opções de cada jogo no estado da sala */
export type DefsJogos = { [J in Registado as J['chaveDef']]: DefDe<J> };
/** o que vai na vista pública: opções e vista de cada jogo */
export type VistasJogos = { [J in Registado as J['chave']]?: VistaDe<J> | null } & { [J in Registado as J['chaveDef']]?: DefDe<J> };
/** "o líder muda as opções do jogo X" */
export type AcaoDefinir = Registado extends infer J ? (J extends Registado ? { tipo: J['definir']; id: string; def: Partial<DefDe<J>> } : never) : never;
/** ação de um jogador dentro do jogo (as de sistema, `ligados` e `tick`, ficam de fora) */
export type AcaoJogo = Extract<AcaoDe<Registado>, { id: string }>;

/** a mesma entrada sem os tipos de cada jogo, para o código genérico da sala */
export type JogoQualquer = DefJogo<string, string, string, string, JogoComum, unknown, unknown, { tipo: string }>;
export const LISTA = JOGOS as unknown as readonly JogoQualquer[];

export const jogoPorId = (id: string | undefined): JogoQualquer | undefined => LISTA.find((j) => j.id === id);

/** o jogo em curso (só há um de cada vez) */
export function jogoEmCurso(s: object): { j: JogoQualquer; g: JogoComum } | null {
  const r = s as Record<string, unknown>;
  const j = LISTA.find((x) => r[x.chave]);
  return j ? { j, g: r[j.chave] as JogoComum } : null;
}
