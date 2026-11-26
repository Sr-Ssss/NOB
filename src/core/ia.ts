/**
 * "IA jogável" dos bots (Fase 8 do feedback, 20/11): com a IA ligada, o bot joga sozinho em todos os jogos.
 * Bem simples, de propósito: escolhe ao acaso entre as opções; nos textos manda o texto que já existe,
 * uma palavra ao acaso ou um placeholder; não desenha. Serve para testar sem o líder jogar por cada bot.
 *
 * Cada jogo dá `jogadas` candidatas (sem validar); a sala (`jogarBots` em sala.ts) experimenta-as no reducer
 * por ordem aleatória e fica com a primeira que muda o estado. Uma jogada por `chave` (por defeito: fase + fim
 * do tempo), para não repetir votos; os jogos com várias jogadas seguidas metem o progresso na chave.
 */
import type { Acao5050, Estado5050 } from '../jogos/5050/regras';
import { aVotar } from '../jogos/5050/regras';
import type { AcaoPensa, EstadoPensa } from '../jogos/pensa-dores/regras';
import { VOTOS_FINAL } from '../jogos/pensa-dores/regras';
import type { AcaoWifi, EstadoWifi } from '../jogos/senha-wifi/regras';
import type { AcaoSevira, EstadoSevira } from '../jogos/se-vira/regras';
import { apresentador } from '../jogos/se-vira/regras';
import type { AcaoMona, EstadoMona } from '../jogos/mona-lixa/regras';
import type { AcaoIdeias, EstadoIdeias } from '../jogos/ideias-mirabolantes/regras';
import { ETAPAS, NOTAS } from '../jogos/ideias-mirabolantes/regras';
import type { AcaoPirata, EstadoPirata } from '../jogos/pirata/regras';
import type { AcaoMaquinas, EstadoMaquinas } from '../jogos/revolucao-maquinas/regras';
import type { AcaoRei, EstadoRei } from '../jogos/rei-dragao/regras';
import { candidatosRefem, nRefens } from '../jogos/rei-dragao/regras';
import type { AcaoRagerob, EstadoRagerob } from '../jogos/ragerob/regras';
import type { AcaoSemJuizo, EstadoSemJuizo } from '../jogos/semjuizo/regras';
import { CABECAS,CORPOS, LOCOS, PRECO } from '../jogos/ragerob/pecas';
import { vistaDuelo, type AcaoDuelo, type EstadoDuelo } from '../jogos/duelo-rabiscos/regras';
import { chaveBot, jogadaBot } from '../jogos/duelo-rabiscos/bot';
import { ALTURA, LARGURA } from '../ui/tracos';

export type Sorte = () => number;
/** ação de jogo sem o `id` (a sala põe o do bot) */
export type SemId<A> = A extends { id: string } ? Omit<A, 'id'> : never;

export interface BotJogo<G, A> {
  jogadas(g: G, id: string, r: Sorte): SemId<A>[];
  /** o que conta como "já joguei aqui" (por defeito: fase + fim do tempo) */
  chave?(g: G, id: string): string;
}

/** gerador pseudo-aleatório (mulberry32): a sala é determinística dado `agora` */
export function sorteDe(seed: number): Sorte {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashTexto(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const umDe = <T>(l: readonly T[], r: Sorte): T => l[Math.floor(r() * l.length)];
export const int = (n: number, r: Sorte) => Math.floor(r() * n);
export function baralharR<T>(l: readonly T[], r: Sorte): T[] {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const k = int(i + 1, r);
    [c[i], c[k]] = [c[k], c[i]];
  }
  return c;
}

/** palavras que servem nas duas línguas (nomes próprios / palavras internacionais) */
const PALAVRAS = ['Banana', 'Pizza', 'Robô', 'Taco', 'Panda', 'Ninja', 'Pirata', 'Dragão', 'Foguete', 'Pinguim', 'Disco', 'Yoga', 'Karaokê', 'Sushi', 'Gorila', 'Zumbi'];
export const palavra = (r: Sorte) => umDe(PALAVRAS, r);

/** "não desenha": um ponto só, para os jogos que não aceitam desenho vazio */
const PONTO = [{ c: 0, g: 1, p: [LARGURA / 2, ALTURA / 2] }];

const outro = (l: string[], eu: string, r: Sorte) => {
  const o = l.filter((x) => x !== eu);
  return o.length ? umDe(o, r) : eu;
};

export const BOT_5050: BotJogo<Estado5050, Acao5050> = {
  jogadas: (e, id, r) => [
    { tipo: 'enviar', texto: `${palavra(r)} ${palavra(r)}?`, a: palavra(r), b: palavra(r) },
    ...(aVotar(e).includes(id) ? [{ tipo: 'votar' as const, lado: r() < 0.5 ? ('a' as const) : ('b' as const) }] : []),
  ],
};

export const BOT_PENSA: BotJogo<EstadoPensa, AcaoPensa> = {
  jogadas: (e, id, r) => {
    const texto = palavra(r);
    const duelos = e.duelos.map((d, i) => (d.autores.includes(id) ? i : -1)).filter((i) => i >= 0);
    const atual = e.duelos[e.atual];
    return [
      // escrever: um duelo de cada vez (a chave muda com as respostas dadas)
      ...duelos.filter((i) => !e.respostas[i]?.[id]).map((duelo) => ({ tipo: 'responder' as const, duelo, texto })),
      // fora da final não: reescrevia o duelo 0 e gastava a jogada do outro
      ...(e.fase === 'final_escrever' ? [{ tipo: 'responder' as const, duelo: 0, texto }] : []),
      ...(atual ? [{ tipo: 'votar' as const, autor: umDe(atual.ordem.length ? atual.ordem : [id], r) }] : []),
      { tipo: 'votos_final', votos: { [outro(e.ordemFinal, id, r)]: VOTOS_FINAL } },
    ];
  },
  chave: (e, id) => `${e.fase}:${e.terminaEm}:${e.duelos.filter((_, i) => e.respostas[i]?.[id]).length}`,
};

export const BOT_WIFI: BotJogo<EstadoWifi, AcaoWifi> = {
  jogadas: (e, _id, r) => {
    const nums = e.resposta.nums;
    const livre = nums.findIndex((n) => n === null);
    const usados = nums.filter((n): n is number => n !== null);
    const resta = [1, 2, 3, 4].filter((n) => !usados.includes(n));
    return [
      { tipo: 'prontas' },
      { tipo: 'pistas', pistas: [palavra(r), palavra(r), palavra(r)] },
      { tipo: 'pistas', pistas: [palavra(r), palavra(r), palavra(r)] },
      ...(livre >= 0 && resta.length ? [{ tipo: 'resposta' as const, linha: livre, num: umDe(resta, r) }] : [{ tipo: 'confirmar' as const }]),
    ];
  },
  chave: (e) => `${e.fase}:${e.terminaEm}:${e.resposta.nums.join(',')}:${e.resposta.confirmados.length}`,
};

export const BOT_SEVIRA: BotJogo<EstadoSevira, AcaoSevira> = {
  jogadas: (_e, _id, r) => [{ tipo: 'sv_enviar', titulo: null }, { tipo: 'sv_slide', dir: 1 }, { tipo: 'sv_terminar' }, { tipo: 'sv_nota', estrelas: 1 + int(5, r) }],
  // a apresentar: um slide de cada vez
  chave: (e) => `${e.fase}:${e.terminaEm}:${e.fase === 'apresentar' ? apresentador(e) + ':' + e.slide : ''}`,
};

export const BOT_MONA: BotJogo<EstadoMona, AcaoMona> = {
  // só um ponto (decisão do utilizador, 25/11): sem ele, todos esperavam o tempo inteiro do desenho
  jogadas: (e, _id, r) => [{ tipo: 'ml_desenho', tracos: PONTO }, { tipo: 'ml_falso', texto: palavra(r) }, { tipo: 'ml_escolher', i: int(Math.max(1, e.opcoes.length), r) }],
  // falso igual ao verdadeiro: a app pede outro
  chave: (e, id) => `${e.fase}:${e.terminaEm}:${e.atual}:${e.recusados.includes(id)}`,
};

export const BOT_IDEIAS: BotJogo<EstadoIdeias, AcaoIdeias> = {
  jogadas: (e, id, r) => {
    const outros = e.ordem.filter((x) => x !== id);
    const notas: Record<string, number> = {};
    for (let k = 0; k < NOTAS && outros.length; k++) {
      const x = umDe(outros, r);
      notas[x] = (notas[x] ?? 0) + 1;
    }
    return [
      // texto vazio = o problema sorteado (o que já existe)
      { tipo: 'im_problema', texto: '' },
      { tipo: 'im_invencao', tracos: PONTO, nome: palavra(r), slogan: '' },
      // na última etapa não: "muda" para a mesma e gastava a jogada do "acabei"
      ...(e.etapa < ETAPAS - 1 ? [{ tipo: 'im_etapa' as const, etapa: e.etapa + 1 }] : []),
      { tipo: 'im_acabei' },
      { tipo: 'im_investir', notas, confirmar: true },
    ];
  },
  chave: (e) => `${e.fase}:${e.terminaEm}:${e.fase === 'pitch' ? e.atual + ':' + e.etapa : ''}`,
};

export const BOT_PIRATA: BotJogo<EstadoPirata, AcaoPirata> = {
  jogadas: (e, id, r) => [
    { tipo: 'pr_noite', alvo: outro(e.vivos, id, r) },
    { tipo: 'pr_noite', alvo: umDe(e.vivos, r) },
    { tipo: 'pr_votar', alvo: r() < 0.15 ? null : outro(e.vivos, id, r) },
    { tipo: 'pr_levar', alvo: outro(e.vivos, id, r) },
  ],
};

export const BOT_MAQUINAS: BotJogo<EstadoMaquinas, AcaoMaquinas> = {
  jogadas: (e, id, r) => [
    { tipo: 'rm_piloto', alvo: outro(e.vivos, id, r) },
    { tipo: 'rm_piloto', alvo: outro(e.vivos, id, r) },
    { tipo: 'rm_votar', sim: r() < 0.6 },
    { tipo: 'rm_descartar', i: int(3, r) },
    { tipo: 'rm_escolher', i: int(2, r) },
    { tipo: 'rm_veto', aceita: r() < 0.5 },
    { tipo: 'rm_poder', alvo: outro(e.vivos, id, r) },
    { tipo: 'rm_visto' },
  ],
};

export const BOT_REI: BotJogo<EstadoRei, AcaoRei> = {
  jogadas: (e, id, r) => {
    const k = e.sala[id] ?? 0;
    const daSala = e.participantes.filter((x) => e.sala[x] === k);
    const cand = candidatosRefem(e, k);
    return [
      { tipo: 'rd_pronto' },
      { tipo: 'rd_ok' },
      { tipo: 'rd_responder', aceita: r() < 0.5 },
      { tipo: 'rd_votar', alvo: umDe(daSala, r) },
      { tipo: 'rd_refens', ids: baralharR(cand, r).slice(0, nRefens(e, k)) },
      { tipo: 'rd_cheguei' },
      { tipo: 'rd_apostar', equipa: r() < 0.5 ? 'azul' : 'vermelho' },
      { tipo: 'rd_apontar', alvo: outro(e.participantes, id, r) },
    ];
  },
  chave: (e, id) => {
    const k = e.sala[id] ?? 0;
    return `${e.fase}:${e.terminaEm}:${e.trocas.length}:${!!e.votacao[k]}:${e.refens[k] ? 1 : 0}:${e.lideres[k]}`;
  },
};

/** nunca são juiz nem júri: só jogam provas (sem interrupções) */
export const BOT_SEMJUIZO: BotJogo<EstadoSemJuizo, AcaoSemJuizo> = {
  jogadas: (e, id, r) => {
    const mao = e.fase === 'escolher' ? (e.maos[id] ?? []) : [];
    return mao.length ? [{ tipo: 'sj_jogar', prova: umDe(mao, r).id, liga: e.mesa.length ? int(e.mesa.length, r) : null }] : [];
  },
};

/** leilão: cada bot só quer alguns módulos e cobre até um limite (fixos por bot, ronda e módulo; `r` muda a cada tick) */
function lanceRagerob(e: EstadoRagerob, id: string): SemId<AcaoRagerob>[] {
  const l = e.leilao;
  if (!l || l.martelo) return [];
  const h = hashTexto(`${id}:${e.ronda}:${l.item}:${e.seed}`) >>> 8;
  const preco = PRECO[e.loja[l.item]];
  const limite = Math.min(preco + 50 * (h % 5), (e.carteira[id] ?? 0) / 2);
  const valor = l.lance ? l.lance.valor + 50 : preco;
  return (h >> 4) % 2 || valor > limite ? [] : [{ tipo: 'rr_lance', item: l.item, valor }];
}

export const BOT_RAGEROB: BotJogo<EstadoRagerob, AcaoRagerob> = {
  // sem instalar módulos nem conduzir: só o essencial para o jogo andar
  jogadas: (e, id, r) => [
    { tipo: 'rr_montar', corpo: umDe(CORPOS, r), loco: umDe(LOCOS, r), cabeca: umDe(CABECAS, r) },
    ...lanceRagerob(e, id),
    { tipo: 'rr_comprar', item: int(Math.max(1, e.lojaPrivada[id]?.length ?? 1), r) },
    { tipo: 'rr_pronto' },
    // escolhe um robô e fica com ele
    ...(e.fase === 'aposta' ? [{ tipo: 'rr_apostar' as const, robo: umDe(e.grupos[e.combateIdx] ?? [''], r) }] : []),
  ],
  // leilão: uma jogada por lance (o terminaEm nem sempre muda com ele)
  chave: (e, id) => (e.fase === 'loja' && e.leilao ? `leilao:${e.ronda}:${e.leilao.item}:${e.leilao.lance?.valor ?? 0}` : `${e.fase}:${e.terminaEm}:${e.inventario[id]?.length ?? 0}`),
};

/** Duelo de Rabiscos: a melhor jogada que o bot vê (src/jogos/duelo-rabiscos/bot.ts) */
export const BOT_DUELO: BotJogo<EstadoDuelo, AcaoDuelo> = {
  jogadas: (e, id, r) => {
    const a = jogadaBot(vistaDuelo(e), id, r);
    return a ? [a as SemId<AcaoDuelo>] : [];
  },
  chave: (e, id) => chaveBot(e, id),
};
