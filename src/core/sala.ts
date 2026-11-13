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

export const ID_TV = 'tv';
export const MAX_NOME = 12;
export const N_AVATARES = 18;
export const TEMPO_DESLIGADO = 5 * 60 * 1000;

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
}

export interface EstadoSala {
  codigo: string;
  idioma: Idioma;
  jogadores: Jogador[]; // por ordem de entrada
  vipId: string | null;
  def: Def5050;
  jogo: Estado5050 | null;
  /** id do dispositivo → id do jogador */
  aliases: Record<string, string>;
}

export type AcaoSala =
  | { tipo: 'entrar'; id: string; nome: string; avatar: number; tag: string }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'definir'; id: string; def: Partial<Def5050> }
  | { tipo: 'idioma'; id: string; idioma: Idioma }
  | { tipo: 'comecar'; id: string }
  | { tipo: 'outra_vez'; id: string }
  | { tipo: 'menu'; id: string }
  | { tipo: 'lideranca'; id: string; para: string }
  | { tipo: 'pronto'; id: string; pronto: boolean }
  /** tecla do comando virtual da TV (só o líder); não muda o estado, a TV trata-a */
  | { tipo: 'comando'; id: string; tecla: Tecla }
  | { tipo: 'jogo'; acao: Extract<Acao5050, { id: string }> }
  | { tipo: 'tick' };

export function novaSala(codigo: string, idioma: Idioma): EstadoSala {
  return { codigo, idioma, jogadores: [], vipId: null, def: { ...DEF_PADRAO }, jogo: null, aliases: {} };
}

export function ligados(s: EstadoSala): string[] {
  return s.jogadores.filter((j) => j.ligado).map((j) => j.id);
}

function escolherVip(s: EstadoSala): EstadoSala {
  const atual = s.jogadores.find((j) => j.id === s.vipId);
  if (atual?.ligado) return s;
  const prox = s.jogadores.find((j) => j.ligado);
  return { ...s, vipId: prox ? prox.id : (atual?.id ?? null) };
}

function manda(s: EstadoSala, id: string): boolean {
  return id === ID_TV || id === s.vipId;
}

function passarAoJogo(s: EstadoSala, acao: Acao5050, agora: number): EstadoSala {
  return s.jogo ? { ...s, jogo: reduz5050(s.jogo, acao, agora) } : s;
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
      }
      r = escolherVip(r);
      return passarAoJogo(r, { tipo: 'ligados', ids: ligados(r) }, agora);
    }
    case 'ligados': {
      const r = escolherVip({
        ...s,
        jogadores: s.jogadores.map((j) => {
          const on = a.ids.includes(j.id);
          if (on === j.ligado) return j;
          return { ...j, ligado: on, desligadoEm: on ? null : agora };
        }),
      });
      return passarAoJogo(r, { tipo: 'ligados', ids: ligados(r) }, agora);
    }
    case 'definir':
      if (!manda(s, a.id) || s.jogo) return s;
      return { ...s, def: { ...s.def, ...a.def } };
    case 'idioma':
      if (!manda(s, a.id) || s.jogo) return s;
      return { ...s, idioma: a.idioma };
    case 'comecar':
      if (!manda(s, a.id) || s.jogo || !podeComecar(s)) return s;
      return { ...s, jogo: novoJogo(ligados(s), s.def, agora, []) };
    case 'outra_vez': {
      if (!manda(s, a.id) || s.jogo?.fase !== 'fim' || !podeComecar(s)) return s;
      return { ...s, jogo: novoJogo(ligados(s), s.def, agora, s.jogo.usadas) };
    }
    case 'menu':
      if (!manda(s, a.id) || (s.jogo && s.jogo.fase !== 'fim')) return s;
      return { ...s, jogo: null, jogadores: s.jogadores.map((j) => ({ ...j, pronto: false })) };
    case 'comando':
      return s;
    case 'pronto':
      return { ...s, jogadores: s.jogadores.map((j) => (j.id === a.id ? { ...j, pronto: a.pronto } : j)) };
    case 'lideranca': {
      const alvo = s.jogadores.find((j) => j.id === a.para);
      if (!manda(s, a.id) || !alvo?.ligado) return s;
      return { ...s, vipId: alvo.id };
    }
    case 'jogo':
      return passarAoJogo(s, a.acao, agora);
    case 'tick': {
      const emJogo = new Set(s.jogo ? [...s.jogo.participantes, ...s.jogo.audiencia] : []);
      const ficam = s.jogadores.filter(
        (j) => j.ligado || j.desligadoEm === null || agora - j.desligadoEm < TEMPO_DESLIGADO || emJogo.has(j.id),
      );
      const r = ficam.length === s.jogadores.length ? s : escolherVip({ ...s, jogadores: ficam });
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
  aliases: Record<string, string>;
}

export function vistaSala(s: EstadoSala): VistaSala {
  const tags = new Map(s.jogadores.map((j) => [j.id, j.tag]));
  return {
    codigo: s.codigo,
    idioma: s.idioma,
    jogadores: s.jogadores.map(({ id, nome, avatar, ligado, desligadoEm, pronto }) => ({ id, nome, avatar, ligado, desligadoEm, pronto })),
    vipId: s.vipId,
    def: s.def,
    jogo: s.jogo ? vista5050(s.jogo, (id) => tags.get(id)) : null,
    aliases: s.aliases,
  };
}
