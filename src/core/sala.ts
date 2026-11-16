import {
  DEF_PADRAO,
  MIN_LIGADOS,
  novoJogo,
  reduz5050,
  vista5050,
  type Acao5050,
  type Def5050,
  type Estado5050,
  type Vista5050,
} from '../jogos/5050/regras';
import {
  DEF_PADRAO_PENSA,
  MIN_JOGADORES as MIN_PENSA,
  novoPensa,
  reduzPensa,
  vistaPensa,
  type AcaoPensa,
  type DefPensa,
  type EstadoPensa,
  type VistaPensa,
} from '../jogos/pensa-dores/regras';
import { perguntasPensa } from '../jogos/pensa-dores/conteudo';
import {
  DEF_PADRAO_WIFI,
  MIN_JOGADORES as MIN_WIFI,
  SO_LIDER_WIFI,
  TIPOS_WIFI,
  novoWifi,
  reduzWifi,
  vistaWifi,
  type AcaoWifi,
  type DefWifi,
  type EstadoWifi,
  type VistaWifi,
} from '../jogos/senha-wifi/regras';
import { palavrasWifi } from '../jogos/senha-wifi/conteudo';
import {
  DEF_PADRAO_SEVIRA,
  MIN_JOGADORES as MIN_SEVIRA,
  TIPOS_SEVIRA,
  novoSevira,
  reduzSevira,
  vistaSevira,
  type AcaoSevira,
  type DefSevira,
  type EstadoSevira,
  type VistaSevira,
} from '../jogos/se-vira/regras';
import { conteudoSevira } from '../jogos/se-vira/conteudo';
import {
  DEF_PADRAO_MONA,
  MIN_JOGADORES as MIN_MONA,
  TIPOS_MONA,
  novoMona,
  reduzMona,
  vistaMona,
  type AcaoMona,
  type DefMona,
  type EstadoMona,
  type VistaMona,
} from '../jogos/mona-lixa/regras';
import { conteudoMona } from '../jogos/mona-lixa/conteudo';
import {
  DEF_PADRAO_IDEIAS,
  MIN_JOGADORES as MIN_IDEIAS,
  TIPOS_IDEIAS,
  novoIdeias,
  reduzIdeias,
  vistaIdeias,
  type AcaoIdeias,
  type DefIdeias,
  type EstadoIdeias,
  type VistaIdeias,
} from '../jogos/ideias-mirabolantes/regras';
import { conteudoIdeias } from '../jogos/ideias-mirabolantes/conteudo';
import {
  DEF_PADRAO_PIRATA,
  MIN_JOGADORES as MIN_PIRATA,
  MAX_JOGADORES as MAX_PIRATA,
  SO_LIDER_PIRATA,
  TIPOS_PIRATA,
  novoPirata,
  privadoPirata,
  reduzPirata,
  vistaPirata,
  type AcaoPirata,
  type DefPirata,
  type EstadoPirata,
  type VistaPirata,
} from '../jogos/pirata/regras';

export const ID_TV = 'tv';
export const MAX_NOME = 12;
export const N_AVATARES = 18;
export const TEMPO_DESLIGADO = 5 * 60 * 1000;
/** duração do tutorial antes do jogo (os vídeos ficam para o fim do projeto) */
export const T_TUTORIAL = 15 * 1000;

export type Idioma = 'pt-BR' | 'en';
export type Tecla = 'cima' | 'baixo' | 'esq' | 'dir' | 'ok' | 'voltar' | 'menu' | 'recarregar';

/** o comando só vale se vier do líder */
export function comandoValido(s: EstadoSala, id: string): boolean {
  return id === s.vipId;
}

export interface Jogador {
  id: string;
  nome: string;
  avatar: number;
  /** segredo do jogador: deixa o telemóvel saber "és tu o autor" sem revelar o autor aos outros */
  tag: string;
  ligado: boolean;
  desligadoEm: number | null;
  /** carregou em "Pronto" no lobby */
  pronto: boolean;
  /** jogador falso criado pelo líder para testar sozinho: está sempre ligado e só age pelo líder */
  bot?: boolean;
}

export interface EstadoSala {
  codigo: string;
  idioma: Idioma;
  jogadores: Jogador[]; // por ordem de entrada
  vipId: string | null;
  def: Def5050;
  jogo: Estado5050 | null;
  defPensa: DefPensa;
  pensa: EstadoPensa | null;
  defWifi?: DefWifi;
  wifi?: EstadoWifi | null;
  defSevira?: DefSevira;
  sevira?: EstadoSevira | null;
  defMona?: DefMona;
  mona?: EstadoMona | null;
  defIdeias?: DefIdeias;
  ideias?: EstadoIdeias | null;
  defPirata?: DefPirata;
  pirata?: EstadoPirata | null;
  /** criada no telemóvel, sem TV */
  semTv?: boolean;
  /** tutorial a passar para todos antes do jogo (null = nenhum) */
  tutorial?: { jogo: string; ate: number } | null;
  /** id do dispositivo → id do jogador */
  aliases: Record<string, string>;
}

export type AcaoSala =
  | { tipo: 'entrar'; id: string; nome: string; avatar: number; tag: string }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'definir'; id: string; def: Partial<Def5050> }
  | { tipo: 'idioma'; id: string; idioma: Idioma }
  | { tipo: 'definir_pensa'; id: string; def: Partial<DefPensa> }
  | { tipo: 'definir_wifi'; id: string; def: Partial<DefWifi> }
  | { tipo: 'definir_sevira'; id: string; def: Partial<DefSevira> }
  | { tipo: 'definir_mona'; id: string; def: Partial<DefMona> }
  | { tipo: 'definir_ideias'; id: string; def: Partial<DefIdeias> }
  | { tipo: 'definir_pirata'; id: string; def: Partial<DefPirata> }
  /** jogo: '5050' (padrão), 'pensa', 'wifi', 'sevira', 'mona', 'ideias' ou 'pirata' */
  | { tipo: 'comecar'; id: string; jogo?: string; tutorial?: boolean }
  | { tipo: 'outra_vez'; id: string }
  | { tipo: 'menu'; id: string }
  /** o líder salta o tutorial: o jogo começa já */
  | { tipo: 'saltar'; id: string }
  | { tipo: 'lideranca'; id: string; para: string }
  | { tipo: 'pronto'; id: string; pronto: boolean }
  /** tecla do comando virtual da TV (só o líder); não muda o estado, a TV trata-a */
  | { tipo: 'comando'; id: string; tecla: Tecla }
  | { tipo: 'jogo'; acao: Extract<Acao5050 | AcaoPensa | AcaoWifi | AcaoSevira | AcaoMona | AcaoIdeias | AcaoPirata, { id: string }> }
  /** o líder cria um bot (id e tag gerados no telemóvel do líder, que guarda a tag) */
  | { tipo: 'bot_add'; id: string; bot: string; tag: string }
  | { tipo: 'bot_del'; id: string; bot: string }
  /** o líder age como um bot (só ações de jogo e "Pronto") */
  | { tipo: 'como'; id: string; bot: string; acao: AcaoSala }
  | { tipo: 'tick' };

export const PREFIXO_BOT = 'bot-';

export function novaSala(codigo: string, idioma: Idioma): EstadoSala {
  return { codigo, idioma, jogadores: [], vipId: null, def: { ...DEF_PADRAO }, jogo: null, defPensa: { ...DEF_PADRAO_PENSA }, pensa: null, defWifi: { ...DEF_PADRAO_WIFI }, wifi: null, defSevira: { ...DEF_PADRAO_SEVIRA }, sevira: null, defMona: { ...DEF_PADRAO_MONA }, mona: null, defIdeias: { ...DEF_PADRAO_IDEIAS }, ideias: null, defPirata: { ...DEF_PADRAO_PIRATA }, pirata: null, aliases: {} };
}

export function ligados(s: EstadoSala): string[] {
  return s.jogadores.filter((j) => j.ligado).map((j) => j.id);
}

function escolherVip(s: EstadoSala): EstadoSala {
  const atual = s.jogadores.find((j) => j.id === s.vipId);
  if (atual?.ligado && !atual.bot) return s;
  const prox = s.jogadores.find((j) => j.ligado && !j.bot);
  return { ...s, vipId: prox ? prox.id : (atual?.id ?? null) };
}

function manda(s: EstadoSala, id: string): boolean {
  return id === ID_TV || id === s.vipId;
}

const SO_PENSA = ['responder', 'votos_final'];

function passarAoJogo(s: EstadoSala, acao: Acao5050 | AcaoPensa | AcaoWifi | AcaoSevira | AcaoMona | AcaoIdeias | AcaoPirata, agora: number): EstadoSala {
  if (s.pirata) {
    if (acao.tipo !== 'ligados' && acao.tipo !== 'tick' && !TIPOS_PIRATA.includes(acao.tipo)) return s;
    if ('id' in acao && SO_LIDER_PIRATA.includes(acao.tipo) && !manda(s, acao.id)) return s;
    return { ...s, pirata: reduzPirata(s.pirata, acao as AcaoPirata, agora) };
  }
  if (TIPOS_PIRATA.includes(acao.tipo)) return s;
  if (s.ideias) {
    if (acao.tipo !== 'ligados' && acao.tipo !== 'tick' && !TIPOS_IDEIAS.includes(acao.tipo)) return s;
    return { ...s, ideias: reduzIdeias(s.ideias, acao as AcaoIdeias, agora) };
  }
  if (TIPOS_IDEIAS.includes(acao.tipo)) return s;
  if (s.mona) {
    if (acao.tipo !== 'ligados' && acao.tipo !== 'tick' && !TIPOS_MONA.includes(acao.tipo)) return s;
    return { ...s, mona: reduzMona(s.mona, acao as AcaoMona, agora) };
  }
  if (TIPOS_MONA.includes(acao.tipo)) return s;
  if (s.sevira) {
    if (acao.tipo !== 'ligados' && acao.tipo !== 'tick' && !TIPOS_SEVIRA.includes(acao.tipo)) return s;
    return { ...s, sevira: reduzSevira(s.sevira, acao as AcaoSevira, agora) };
  }
  if (TIPOS_SEVIRA.includes(acao.tipo)) return s;
  if (s.wifi) {
    if ('id' in acao && SO_LIDER_WIFI.includes(acao.tipo) && !manda(s, acao.id)) return s;
    return { ...s, wifi: reduzWifi(s.wifi, acao as AcaoWifi, agora) };
  }
  if (TIPOS_WIFI.includes(acao.tipo)) return s;
  if (s.pensa) return acao.tipo === 'enviar' || 'lado' in acao ? s : { ...s, pensa: reduzPensa(s.pensa, acao as AcaoPensa, agora) };
  if (s.jogo) return SO_PENSA.includes(acao.tipo) || (acao.tipo === 'votar' && !('lado' in acao)) ? s : { ...s, jogo: reduz5050(s.jogo, acao as Acao5050, agora) };
  return s;
}

/** o jogo em curso (qualquer um) */
export function jogoAtivo(s: Pick<EstadoSala, 'jogo' | 'pensa' | 'wifi' | 'sevira' | 'mona' | 'ideias' | 'pirata'>): { fase: string; participantes: string[]; audiencia: string[]; usadas: string[] } | null {
  return s.pirata ?? s.ideias ?? s.mona ?? s.sevira ?? s.wifi ?? s.pensa ?? s.jogo;
}

function comecarPensa(s: EstadoSala, agora: number, usadas: string[]): EstadoSala {
  if (ligados(s).length < MIN_PENSA) return s;
  const { normais, finais } = perguntasPensa();
  return { ...s, jogo: null, pensa: novoPensa(ligados(s), s.defPensa, agora, normais, finais, usadas) };
}

function comecarWifi(s: EstadoSala, agora: number, usadas: string[]): EstadoSala {
  if (ligados(s).length < MIN_WIFI) return s;
  return { ...s, jogo: null, pensa: null, wifi: novoWifi(ligados(s), s.defWifi ?? DEF_PADRAO_WIFI, agora, palavrasWifi(), s.idioma, usadas) };
}

/** só com TV (info/arquitetura.md → Modo sem TV) */
function comecarSevira(s: EstadoSala, agora: number, usadas: string[]): EstadoSala {
  if (s.semTv || ligados(s).length < MIN_SEVIRA) return s;
  return { ...s, jogo: null, pensa: null, wifi: null, sevira: novoSevira(ligados(s), s.defSevira ?? DEF_PADRAO_SEVIRA, agora, conteudoSevira(), s.idioma, usadas) };
}

/** com ou sem TV (sem TV, os desenhos aparecem no telemóvel) */
function comecarMona(s: EstadoSala, agora: number, usadas: string[]): EstadoSala {
  if (ligados(s).length < MIN_MONA) return s;
  return { ...s, jogo: null, pensa: null, wifi: null, sevira: null, mona: novoMona(ligados(s), s.defMona ?? DEF_PADRAO_MONA, agora, conteudoMona(), s.idioma, usadas) };
}

/** com ou sem TV (sem TV, os desenhos aparecem no telemóvel) */
function comecarIdeias(s: EstadoSala, agora: number, usadas: string[]): EstadoSala {
  if (ligados(s).length < MIN_IDEIAS) return s;
  return { ...s, jogo: null, pensa: null, wifi: null, sevira: null, mona: null, ideias: novoIdeias(ligados(s), s.defIdeias ?? DEF_PADRAO_IDEIAS, agora, conteudoIdeias(), s.idioma, usadas) };
}

/** com ou sem TV; 5–16 jogadores (os papéis vão pelo canal privado) */
function comecarPirata(s: EstadoSala, agora: number, usadas: string[]): EstadoSala {
  const n = ligados(s).length;
  if (n < MIN_PIRATA || n > MAX_PIRATA) return s;
  return { ...s, jogo: null, pensa: null, wifi: null, sevira: null, mona: null, ideias: null, pirata: novoPirata(ligados(s), s.defPirata ?? DEF_PADRAO_PIRATA, agora, usadas) };
}

/** começa o jogo pedido */
function comecarJogo(s: EstadoSala, jogo: string | undefined, agora: number): EstadoSala {
  if (jogo === 'pirata') return comecarPirata(s, agora, []);
  if (jogo === 'ideias') return comecarIdeias(s, agora, []);
  if (jogo === 'pensa') return comecarPensa(s, agora, []);
  if (jogo === 'wifi') return comecarWifi(s, agora, []);
  if (jogo === 'sevira') return comecarSevira(s, agora, []);
  if (jogo === 'mona') return comecarMona(s, agora, []);
  return { ...s, jogo: novoJogo(ligados(s), s.def, agora, []) };
}

export function podeComecar(s: EstadoSala): boolean {
  return ligados(s).length >= MIN_LIGADOS;
}

const igual = (x: string, y: string) => x.trim().toLowerCase() === y.trim().toLowerCase();

/** troca ids de dispositivo pelo id do jogador (quem voltou pelo nome noutro telemóvel) */
function traduzir(s: EstadoSala, a: AcaoSala): AcaoSala {
  const r = (id: string) => s.aliases[id] ?? id;
  if (a.tipo === 'ligados') return { ...a, ids: [...new Set(a.ids.map(r))] };
  if (a.tipo === 'jogo') return { ...a, acao: { ...a.acao, id: r(a.acao.id) } };
  if (a.tipo === 'tick') return a;
  if (a.tipo === 'como') return { ...a, id: r(a.id) };
  return { ...a, id: r(a.id) };
}

export function reduzSala(s: EstadoSala, acao: AcaoSala, agora: number): EstadoSala {
  const a = traduzir(s, acao);
  switch (a.tipo) {
    case 'entrar': {
      let nome = a.nome.trim().slice(0, MAX_NOME) || '?';
      let avatar = Math.abs(Math.floor(a.avatar)) % N_AVATARES;
      const mesmoNome = s.jogadores.find((j) => j.id !== a.id && igual(j.nome, nome));
      if (mesmoNome && !mesmoNome.ligado && !s.jogadores.some((j) => j.id === a.id)) {
        // voltou pelo nome noutro dispositivo: passa a ser essa pessoa
        const r: EstadoSala = { ...s, aliases: { ...s.aliases, [a.id]: mesmoNome.id } };
        return reduzSala(r, { ...a, nome: mesmoNome.nome, avatar: mesmoNome.avatar }, agora);
      }
      if (mesmoNome) {
        let h = 0;
        for (const c of a.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
        const n = String(2 + (h % 98));
        nome = nome.slice(0, MAX_NOME - n.length - 1) + ' ' + n;
      }
      // cada boneco só uma vez por party: se já está escolhido, fica o primeiro livre
      const ocupados = new Set(s.jogadores.filter((j) => j.id !== a.id).map((j) => j.avatar));
      if (ocupados.has(avatar) && ocupados.size < N_AVATARES) {
        avatar = Array.from({ length: N_AVATARES }, (_, i) => i).find((i) => !ocupados.has(i))!;
      }
      const existe = s.jogadores.find((j) => j.id === a.id);
      let r: EstadoSala;
      if (existe) {
        r = {
          ...s,
          jogadores: s.jogadores.map((j) =>
            j.id === a.id ? { ...j, nome, avatar, tag: a.tag, ligado: true, desligadoEm: null } : j,
          ),
        };
      } else {
        const novo: Jogador = { id: a.id, nome, avatar, tag: a.tag, ligado: true, desligadoEm: null, pronto: false };
        r = { ...s, jogadores: [...s.jogadores, novo] };
        // entrou a meio: vota como audiência
        if (r.jogo && r.jogo.fase !== 'fim') r = { ...r, jogo: { ...r.jogo, audiencia: [...r.jogo.audiencia, a.id] } };
        if (r.pensa && r.pensa.fase !== 'fim') r = { ...r, pensa: { ...r.pensa, audiencia: [...r.pensa.audiencia, a.id] } };
        if (r.wifi && r.wifi.fase !== 'fim') r = { ...r, wifi: { ...r.wifi, audiencia: [...r.wifi.audiencia, a.id] } };
        if (r.sevira && r.sevira.fase !== 'fim') r = { ...r, sevira: { ...r.sevira, audiencia: [...r.sevira.audiencia, a.id] } };
        if (r.mona && r.mona.fase !== 'fim') r = { ...r, mona: { ...r.mona, audiencia: [...r.mona.audiencia, a.id] } };
        if (r.pirata && r.pirata.fase !== 'fim') r = { ...r, pirata: { ...r.pirata, audiencia: [...r.pirata.audiencia, a.id] } };
        if (r.ideias && r.ideias.fase !== 'fim') r = { ...r, ideias: { ...r.ideias, audiencia: [...r.ideias.audiencia, a.id] } };
      }
      r = escolherVip(r);
      return passarAoJogo(r, { tipo: 'ligados', ids: ligados(r) }, agora);
    }
    case 'ligados': {
      const r = escolherVip({
        ...s,
        jogadores: s.jogadores.map((j) => {
          const on = !!j.bot || a.ids.includes(j.id);
          if (on === j.ligado) return j;
          return { ...j, ligado: on, desligadoEm: on ? null : agora };
        }),
      });
      return passarAoJogo(r, { tipo: 'ligados', ids: ligados(r) }, agora);
    }
    case 'definir':
      if (!manda(s, a.id) || jogoAtivo(s)) return s;
      return { ...s, def: { ...s.def, ...a.def } };
    case 'definir_pensa':
      if (!manda(s, a.id) || jogoAtivo(s)) return s;
      return { ...s, defPensa: { ...s.defPensa, ...a.def } };
    case 'definir_wifi':
      if (!manda(s, a.id) || jogoAtivo(s)) return s;
      return { ...s, defWifi: { ...(s.defWifi ?? DEF_PADRAO_WIFI), ...a.def } };
    case 'definir_sevira':
      if (!manda(s, a.id) || jogoAtivo(s)) return s;
      return { ...s, defSevira: { ...(s.defSevira ?? DEF_PADRAO_SEVIRA), ...a.def } };
    case 'definir_mona':
      if (!manda(s, a.id) || jogoAtivo(s)) return s;
      return { ...s, defMona: { ...(s.defMona ?? DEF_PADRAO_MONA), ...a.def } };
    case 'definir_ideias':
      if (!manda(s, a.id) || jogoAtivo(s)) return s;
      return { ...s, defIdeias: { ...(s.defIdeias ?? DEF_PADRAO_IDEIAS), ...a.def } };
    case 'definir_pirata':
      if (!manda(s, a.id) || jogoAtivo(s)) return s;
      return { ...s, defPirata: { ...(s.defPirata ?? DEF_PADRAO_PIRATA), ...a.def } };
    case 'idioma':
      if (!manda(s, a.id) || jogoAtivo(s)) return s;
      return { ...s, idioma: a.idioma };
    case 'comecar':
      if (!manda(s, a.id) || jogoAtivo(s) || s.tutorial || !podeComecar(s)) return s;
      if (a.tutorial) return { ...s, tutorial: { jogo: a.jogo ?? '5050', ate: agora + T_TUTORIAL } };
      return comecarJogo(s, a.jogo, agora);
    case 'outra_vez': {
      const j = jogoAtivo(s);
      if (!manda(s, a.id) || j?.fase !== 'fim' || !podeComecar(s)) return s;
      if (s.pensa) return comecarPensa(s, agora, s.pensa.usadas);
      if (s.wifi) return comecarWifi(s, agora, s.wifi.usadas);
      if (s.sevira) return comecarSevira(s, agora, s.sevira.usadas);
      if (s.mona) return comecarMona(s, agora, s.mona.usadas);
      if (s.ideias) return comecarIdeias(s, agora, s.ideias.usadas);
      if (s.pirata) return comecarPirata(s, agora, s.pirata.usadas);
      return { ...s, jogo: novoJogo(ligados(s), s.def, agora, j.usadas) };
    }
    case 'menu': {
      const j = jogoAtivo(s);
      if (!manda(s, a.id) || (j && j.fase !== 'fim')) return s;
      return { ...s, jogo: null, pensa: null, wifi: null, sevira: null, mona: null, ideias: null, pirata: null, jogadores: s.jogadores.map((j) => ({ ...j, pronto: false })) };
    }
    case 'saltar':
      if (!manda(s, a.id) || !s.tutorial) return s;
      return reduzSala({ ...s, tutorial: { ...s.tutorial, ate: agora } }, { tipo: 'tick' }, agora);
    case 'comando':
      return s;
    case 'pronto':
      return { ...s, jogadores: s.jogadores.map((j) => (j.id === a.id ? { ...j, pronto: a.pronto } : j)) };
    case 'lideranca': {
      const alvo = s.jogadores.find((j) => j.id === a.para);
      if (!manda(s, a.id) || !alvo?.ligado || alvo.bot) return s;
      return { ...s, vipId: alvo.id };
    }
    case 'jogo':
      return passarAoJogo(s, a.acao, agora);
    case 'bot_add': {
      if (!manda(s, a.id) || jogoAtivo(s) || !a.bot.startsWith(PREFIXO_BOT) || s.jogadores.some((j) => j.id === a.bot)) return s;
      const nomes = new Set(s.jogadores.map((j) => j.nome.toLowerCase()));
      let n = 1;
      while (nomes.has('bot ' + n)) n++;
      const ocupados = new Set(s.jogadores.map((j) => j.avatar));
      const avatar = Array.from({ length: N_AVATARES }, (_, i) => i).find((i) => !ocupados.has(i)) ?? 0;
      const novo: Jogador = { id: a.bot, nome: 'Bot ' + n, avatar, tag: a.tag, ligado: true, desligadoEm: null, pronto: false, bot: true };
      return { ...s, jogadores: [...s.jogadores, novo] };
    }
    case 'bot_del':
      if (!manda(s, a.id) || jogoAtivo(s) || !s.jogadores.some((j) => j.id === a.bot && j.bot)) return s;
      return { ...s, jogadores: s.jogadores.filter((j) => j.id !== a.bot) };
    case 'como': {
      const bot = s.jogadores.find((j) => j.id === a.bot && j.bot);
      if (!manda(s, a.id) || !bot) return s;
      if (a.acao.tipo === 'jogo') return passarAoJogo(s, { ...a.acao.acao, id: bot.id }, agora);
      if (a.acao.tipo === 'pronto') return reduzSala(s, { ...a.acao, id: bot.id }, agora);
      return s;
    }
    case 'tick': {
      const j = jogoAtivo(s);
      const emJogo = new Set(j ? [...j.participantes, ...j.audiencia] : []);
      const ficam = s.jogadores.filter(
        (j) => j.ligado || j.desligadoEm === null || agora - j.desligadoEm < TEMPO_DESLIGADO || emJogo.has(j.id),
      );
      const r = ficam.length === s.jogadores.length ? s : escolherVip({ ...s, jogadores: ficam });
      if (r.tutorial && agora >= r.tutorial.ate) {
        const jogo = r.tutorial.jogo;
        const sem = { ...r, tutorial: null };
        if (!podeComecar(sem)) return sem;
        return comecarJogo(sem, jogo, agora);
      }
      return passarAoJogo(r, { tipo: 'tick' }, agora);
    }
  }
}

/** o que a TV publica no canal */
export interface VistaSala {
  codigo: string;
  idioma: Idioma;
  jogadores: Omit<Jogador, 'tag'>[];
  vipId: string | null;
  def: Def5050;
  jogo: Vista5050 | null;
  defPensa: DefPensa;
  pensa: VistaPensa | null;
  defWifi?: DefWifi;
  wifi?: VistaWifi | null;
  defSevira?: DefSevira;
  sevira?: VistaSevira | null;
  defMona?: DefMona;
  mona?: VistaMona | null;
  defIdeias?: DefIdeias;
  ideias?: VistaIdeias | null;
  defPirata?: DefPirata;
  pirata?: VistaPirata | null;
  semTv: boolean;
  tutorial: { jogo: string; ate: number } | null;
  aliases: Record<string, string>;
}

export function vistaSala(s: EstadoSala): VistaSala {
  const tags = new Map(s.jogadores.map((j) => [j.id, j.tag]));
  return {
    codigo: s.codigo,
    idioma: s.idioma,
    jogadores: s.jogadores.map(({ id, nome, avatar, ligado, desligadoEm, pronto, bot }) => ({ id, nome, avatar, ligado, desligadoEm, pronto, ...(bot ? { bot } : {}) })),
    vipId: s.vipId,
    def: s.def,
    jogo: s.jogo ? vista5050(s.jogo, (id) => tags.get(id)) : null,
    defPensa: s.defPensa,
    pensa: s.pensa ? vistaPensa(s.pensa, (id) => tags.get(id)) : null,
    defWifi: s.defWifi ?? DEF_PADRAO_WIFI,
    wifi: s.wifi ? vistaWifi(s.wifi, (id) => tags.get(id)) : null,
    defSevira: s.defSevira ?? DEF_PADRAO_SEVIRA,
    sevira: s.sevira ? vistaSevira(s.sevira, (id) => tags.get(id)) : null,
    defMona: s.defMona ?? DEF_PADRAO_MONA,
    mona: s.mona ? vistaMona(s.mona, (id) => tags.get(id)) : null,
    defIdeias: s.defIdeias ?? DEF_PADRAO_IDEIAS,
    ideias: s.ideias ? vistaIdeias(s.ideias, (id) => tags.get(id)) : null,
    defPirata: s.defPirata ?? DEF_PADRAO_PIRATA,
    pirata: s.pirata ? vistaPirata(s.pirata) : null,
    semTv: !!s.semTv,
    tutorial: s.tutorial ?? null,
    aliases: s.aliases,
  };
}

/**
 * Canal privado (jogos de papéis secretos): o que só o telemóvel do jogador `id` pode receber.
 * null = nada de privado (o host não abre canal). Jogos novos ligam-se aqui.
 */
export function privadoSala(s: EstadoSala, id: string): unknown {
  if (s.pirata) return privadoPirata(s.pirata, id);
  return null;
}
