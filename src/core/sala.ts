import { MIN_LIGADOS } from '../jogos/5050/regras';
import { LISTA, jogoEmCurso, jogoPorId, type AcaoDefinir, type AcaoJogo, type DefsJogos, type EstadosJogos, type JogoComum, type JogoQualquer, type VistasJogos } from './registo';
import { marca } from './cripto';
import { filtrarTextos } from './filtro';
import { idAleatorio } from './ids';
import { TOLERANCIA, calcularAusentes, espectadores, jogoDe, seguirSem, trocarJogador, type Ausente } from './saidas';
import { barrar, expulsar, expulso, fecharParty, porta } from './membros';

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

/** os campos de cada jogo (`jogo`, `pensa`… e `def`, `defPensa`…) vêm do registo (src/core/registo.ts) */
export interface EstadoSala extends EstadosJogos, DefsJogos {
  codigo: string;
  idioma: Idioma;
  jogadores: Jogador[]; // por ordem de entrada
  vipId: string | null;
  /** criada no telemóvel, sem TV */
  semTv?: boolean;
  /** tutorial a passar para todos antes do jogo (null = nenhum) */
  tutorial?: { jogo: string; ate: number } | null;
  /** id do dispositivo → id do jogador */
  aliases: Record<string, string>;
  /** segredo do host (nunca sai): marcas falsas que não se distinguem das verdadeiras */
  segredo?: string;
  /** quem saiu a meio do jogo e ainda conta (src/core/saidas.ts) */
  ausentes?: Ausente[];
  /** o líder decidiu seguir sem eles (não voltam a pausar o jogo) */
  dispensados?: string[];
  /** o jogo está em pausa porque saiu alguém que faz falta */
  pausaSaida?: boolean;
  /** quem pode entrar (src/core/membros.ts): party fechada pelo líder, aparelhos à porta e expulsos */
  fechada?: boolean;
  barrados?: string[];
  expulsos?: string[];
}

export type AcaoSala =
  | { tipo: 'entrar'; id: string; nome: string; avatar: number; tag: string }
  | { tipo: 'ligados'; ids: string[] }
  /** opções de um jogo: 'definir' (50/50), 'definir_pensa'… (ver `definir` no registo) */
  | AcaoDefinir
  | { tipo: 'idioma'; id: string; idioma: Idioma }
  /** jogo: o `id` do registo ('5050' é o padrão) */
  | { tipo: 'comecar'; id: string; jogo?: string; tutorial?: boolean }
  | { tipo: 'outra_vez'; id: string }
  | { tipo: 'menu'; id: string }
  /** o líder salta o tutorial: o jogo começa já */
  | { tipo: 'saltar'; id: string }
  | { tipo: 'lideranca'; id: string; para: string }
  | { tipo: 'pronto'; id: string; pronto: boolean }
  /** tecla do comando virtual da TV (só o líder); não muda o estado, a TV trata-a */
  | { tipo: 'comando'; id: string; tecla: Tecla }
  | { tipo: 'jogo'; acao: AcaoJogo }
  /** o líder cria um bot (id e tag gerados no telemóvel do líder, que guarda a tag) */
  | { tipo: 'bot_add'; id: string; bot: string; tag: string }
  | { tipo: 'bot_del'; id: string; bot: string }
  /** o líder age como um bot (só ações de jogo e "Pronto") */
  | { tipo: 'como'; id: string; bot: string; acao: AcaoSala }
  /** saídas a meio (src/core/saidas.ts), só o líder: seguir sem quem saiu, ou pôr um espectador no lugar dele */
  | { tipo: 'ausente_seguir'; id: string; alvo: string }
  | { tipo: 'ausente_trocar'; id: string; alvo: string; por: string }
  /** o líder acaba o jogo a meio e volta ao menu */
  | { tipo: 'acabar'; id: string }
  /** quem pode entrar (src/core/membros.ts), só o líder: fechar/abrir a party e expulsar um jogador */
  | { tipo: 'fechar'; id: string; fechada: boolean }
  | { tipo: 'expulsar'; id: string; alvo: string }
  | { tipo: 'tick' };

export const PREFIXO_BOT = 'bot-';

export function novaSala(codigo: string, idioma: Idioma): EstadoSala {
  const jogos = Object.fromEntries(LISTA.flatMap((j) => [[j.chaveDef, { ...(j.padrao as object) }], [j.chave, null]]));
  return { codigo, idioma, jogadores: [], vipId: null, ...(jogos as unknown as DefsJogos), aliases: {}, segredo: idAleatorio() };
}

export function ligados(s: EstadoSala): string[] {
  return s.jogadores.filter((j) => j.ligado).map((j) => j.id);
}

/** se o líder sair, a liderança passa ao membro ligado mais antigo (com `agora`, só depois da tolerância: um ecrã bloqueado não conta) */
function escolherVip(s: EstadoSala, agora?: number): EstadoSala {
  const atual = s.jogadores.find((j) => j.id === s.vipId);
  if (atual?.ligado && !atual.bot) return s;
  if (atual && !atual.bot && agora !== undefined && atual.desligadoEm !== null && agora - atual.desligadoEm < TOLERANCIA) return s;
  const prox = s.jogadores.find((j) => j.ligado && !j.bot);
  const vipId = prox ? prox.id : (atual?.id ?? null);
  return vipId === s.vipId ? s : { ...s, vipId };
}

/** um jogo novo começa sem ninguém "saído" */
const limparSaidas = (s: EstadoSala): EstadoSala => (s.dispensados?.length || s.ausentes?.length || s.pausaSaida ? { ...s, dispensados: [], ausentes: [], pausaSaida: false } : s);

/**
 * Quem saiu a meio (src/core/saidas.ts): atualiza a lista e, se alguém que faz falta saiu, pausa o jogo
 * até ele voltar ou o líder decidir. Devolve o mesmo objeto quando nada muda.
 */
function aplicarSaidas(s: EstadoSala, agora: number): EstadoSala {
  const aus = calcularAusentes(s, agora);
  let r = JSON.stringify(aus) === JSON.stringify(s.ausentes ?? []) ? s : { ...s, ausentes: aus };
  const j = jogoDe(r);
  if (j && aus.some((x) => x.importante)) {
    if (j.g.pausaRestante === null) r = { ...r, [j.chave]: { ...j.g, pausaRestante: Math.max(0, j.g.terminaEm - agora) } };
    if (!r.pausaSaida) r = { ...r, pausaSaida: true };
  } else if (r.pausaSaida) {
    r = { ...r, pausaSaida: false };
    // o jogo decide se continua (pode ter a sua própria pausa, ex.: menos de 3 ligados)
    if (j) r = passarAoJogo(r, { tipo: 'ligados', ids: ligados(r) }, agora);
  }
  return r;
}

function manda(s: EstadoSala, id: string): boolean {
  return id === ID_TV || id === s.vipId;
}

/** o estado da sala como mapa (para ler/escrever os campos de um jogo pela chave do registo) */
const campos = (s: EstadoSala) => s as unknown as Record<string, unknown>;
const com = (s: EstadoSala, chave: string, valor: unknown): EstadoSala => ({ ...s, [chave]: valor });
const opcoesDe = (s: EstadoSala, j: JogoQualquer) => campos(s)[j.chaveDef] ?? j.padrao;

/** passa a ação ao jogo em curso (pelo registo: as ações que ele aceita, as que só o líder manda) */
function passarAoJogo(s: EstadoSala, acao: AcaoJogo | { tipo: 'ligados'; ids: string[] } | { tipo: 'tick' }, agora: number): EstadoSala {
  const ativo = jogoEmCurso(s);
  if (!ativo) return s;
  const { j, g } = ativo;
  if (acao.tipo !== 'ligados' && acao.tipo !== 'tick' && !j.aceita(acao)) return s;
  if ('id' in acao && j.soLider?.includes(acao.tipo) && !manda(s, acao.id)) return s;
  return com(s, j.chave, j.reduz(g, acao, agora));
}

/** o jogo em curso (qualquer um) */
export function jogoAtivo(s: EstadoSala | VistaSala): JogoComum | null {
  return jogoEmCurso(s)?.g ?? null;
}

/** começa `j` com os ligados (respeitando os mínimos/máximos e "só com TV" do registo) */
function comecar(s: EstadoSala, j: JogoQualquer, agora: number, usadas: string[]): EstadoSala {
  const n = ligados(s).length;
  if ((j.soTv && s.semTv) || n < j.min || (j.max !== undefined && n > j.max)) return s;
  return com(s, j.chave, j.novo(ligados(s), opcoesDe(s, j), agora, usadas, s.idioma));
}

/** começa o jogo pedido (desconhecido = o 50/50) */
function comecarJogo(s: EstadoSala, jogo: string | undefined, agora: number): EstadoSala {
  return comecar(s, jogoPorId(jogo) ?? jogoPorId('5050')!, agora, []);
}

export function podeComecar(s: EstadoSala): boolean {
  // o mínimo de cada jogo vê-se ao começar (o Ragerob joga-se a 2)
  return ligados(s).length >= Math.min(MIN_LIGADOS, ...LISTA.map((j) => j.min));
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
  // texto livre dos jogadores passa pelo filtro de palavrões (src/core/filtro.ts) no host
  const a = acao.tipo === 'tick' || acao.tipo === 'ligados' ? acao : filtrarTextos(acao);
  return aplicarSaidas(reduzBase(s, a, agora), agora);
}

/** quem fez a ação (depois dos aliases); null = o próprio host (tick, presença) */
const autor = (a: AcaoSala): string | null => (a.tipo === 'jogo' ? a.acao.id : 'id' in a ? a.id : null);

function reduzBase(s: EstadoSala, acao: AcaoSala, agora: number): EstadoSala {
  const a = traduzir(s, acao);
  // um expulso já não faz nada aqui (o host também deixa de abrir as ações dele: ProtocoloHost.barrar)
  const quem = autor(a);
  if (quem !== null && a.tipo !== 'entrar' && (expulso(s, quem) || expulso(s, autor(acao) ?? ''))) return s;
  switch (a.tipo) {
    case 'entrar': {
      let nome = a.nome.trim().slice(0, MAX_NOME) || '?';
      let avatar = Math.abs(Math.floor(a.avatar)) % N_AVATARES;
      const mesmoNome = s.jogadores.find((j) => j.id !== a.id && igual(j.nome, nome));
      // voltar pelo nome só para quem estava desligado, e nunca para o lugar de um expulso
      const voltaPeloNome = !!mesmoNome && !mesmoNome.ligado && !mesmoNome.bot && !expulso(s, mesmoNome.id) && !s.jogadores.some((j) => j.id === a.id);
      // party fechada / expulso (src/core/membros.ts): `acao.id` é o aparelho, `a.id` o jogador
      const aparelho = (acao as typeof a).id;
      const entrada = porta(s, aparelho, a.id, voltaPeloNome);
      if (entrada === 'expulso') return s;
      if (entrada === 'fechada') return barrar(s, aparelho);
      if (mesmoNome && voltaPeloNome) {
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
        const ativo = jogoEmCurso(r);
        if (ativo && ativo.g.fase !== 'fim') r = com(r, ativo.j.chave, { ...ativo.g, audiencia: [...ativo.g.audiencia, a.id] });
      }
      r = escolherVip(r, agora);
      return passarAoJogo(r, { tipo: 'ligados', ids: ligados(r) }, agora);
    }
    case 'ligados': {
      const r = escolherVip(
        {
        ...s,
        jogadores: s.jogadores.map((j) => {
          // um expulso pode continuar no canal (a ver o aviso), mas para a party está desligado
          const on = !!j.bot || (a.ids.includes(j.id) && !expulso(s, j.id));
          if (on === j.ligado) return j;
          return { ...j, ligado: on, desligadoEm: on ? null : agora };
        }),
        },
        agora,
      );
      return passarAoJogo(r, { tipo: 'ligados', ids: ligados(r) }, agora);
    }
    case 'idioma':
      if (!manda(s, a.id) || jogoAtivo(s)) return s;
      return { ...s, idioma: a.idioma };
    case 'comecar':
      if (!manda(s, a.id) || jogoAtivo(s) || s.tutorial || !podeComecar(s)) return s;
      if (a.tutorial) return { ...s, tutorial: { jogo: a.jogo ?? '5050', ate: agora + T_TUTORIAL } };
      return limparSaidas(comecarJogo(s, a.jogo, agora));
    case 'outra_vez': {
      const j = jogoAtivo(s);
      if (!manda(s, a.id) || j?.fase !== 'fim' || !podeComecar(s)) return s;
      s = limparSaidas(s);
      return comecar(s, jogoEmCurso(s)!.j, agora, j.usadas);
    }
    case 'menu':
    case 'acabar': {
      const j = jogoAtivo(s);
      // "menu" só no fim; "acabar" é a saída do líder a qualquer momento (ex.: saiu alguém de quem o jogo depende)
      if (!manda(s, a.id) || (a.tipo === 'menu' && j && j.fase !== 'fim')) return s;
      const semJogo = Object.fromEntries(LISTA.map((x) => [x.chave, null]));
      return limparSaidas({ ...s, ...semJogo, jogadores: s.jogadores.map((j) => ({ ...j, pronto: false })) });
    }
    case 'fechar':
      return manda(s, a.id) ? fecharParty(s, !!a.fechada) : s;
    case 'expulsar': {
      if (!manda(s, a.id) || a.alvo === a.id) return s;
      const r = expulsar(s, a.alvo, agora);
      // o jogo sabe já quem ficou (ex.: menos de 3 ligados pausa)
      return r !== s && jogoAtivo(r) ? passarAoJogo(r, { tipo: 'ligados', ids: ligados(r) }, agora) : r;
    }
    case 'ausente_seguir':
      if (!manda(s, a.id) || !(s.ausentes ?? []).some((x) => x.id === a.alvo && x.podeSeguir)) return s;
      return seguirSem(s, a.alvo, agora);
    case 'ausente_trocar':
      if (!manda(s, a.id) || !(s.ausentes ?? []).some((x) => x.id === a.alvo)) return s;
      return trocarJogador(s, a.alvo, a.por);
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
      const r = escolherVip(ficam.length === s.jogadores.length ? s : { ...s, jogadores: ficam }, agora);
      if (r.tutorial && agora >= r.tutorial.ate) {
        const jogo = r.tutorial.jogo;
        const sem = { ...r, tutorial: null };
        if (!podeComecar(sem)) return sem;
        return limparSaidas(comecarJogo(sem, jogo, agora));
      }
      return passarAoJogo(r, { tipo: 'tick' }, agora);
    }
    default: {
      // opções de um jogo (`definir` no registo): só o líder, e só fora do jogo
      const j = LISTA.find((x) => x.definir === a.tipo);
      if (!j || !('def' in a) || !manda(s, a.id) || jogoAtivo(s)) return s;
      return com(s, j.chaveDef, { ...(opcoesDe(s, j) as object), ...a.def });
    }
  }
}

/** o que a TV publica no canal; os campos de cada jogo (opções e vista) vêm do registo */
export interface VistaSala extends VistasJogos {
  codigo: string;
  idioma: Idioma;
  jogadores: Omit<Jogador, 'tag'>[];
  vipId: string | null;
  semTv: boolean;
  tutorial: { jogo: string; ate: number } | null;
  aliases: Record<string, string>;
  /** saídas a meio: quem saiu, quem pode entrar no lugar (espectadores) e se o jogo está à espera */
  ausentes?: Ausente[];
  espectadores?: string[];
  pausaSaida?: boolean;
  /** quem pode entrar (src/core/membros.ts): o telemóvel barrado ou expulso mostra o aviso */
  fechada?: boolean;
  barrados?: string[];
  expulsos?: string[];
}

/**
 * Contexto das marcas de "és tu": muda a cada fase/ronda/item, por isso uma marca não liga o jogador
 * a outra fase. O host calcula-o do estado e o telemóvel da vista (os campos são os mesmos).
 */
export function contextoMarca(s: Pick<EstadoSala, 'codigo'>): string {
  const ativo = jogoEmCurso(s);
  if (!ativo) return `${s.codigo}:lobby`;
  const g = ativo.g as JogoComum & { ronda?: number; atual?: number };
  return `${s.codigo}:${ativo.j.id}:${g.fase}:${g.ronda ?? ''}:${g.atual ?? ''}`;
}

/** a marca que este telemóvel procura na vista (com a sua tag secreta) */
export const minhaMarca = (v: VistaSala, tag: string): string => (tag ? marca(tag, contextoMarca(v)) : '');

export function vistaSala(s: EstadoSala): VistaSala {
  const ctx = contextoMarca(s);
  const segredo = s.segredo ?? s.codigo;
  const porId = new Map(s.jogadores.map((j) => [j.id, j.tag]));
  // a tag nunca sai: só a marca dela neste contexto; ids sem tag (ex.: '#verdadeiro') levam uma marca falsa
  const tags = { get: (id: string) => marca(porId.get(id) || segredo + '|' + id, ctx) };
  return {
    codigo: s.codigo,
    idioma: s.idioma,
    jogadores: s.jogadores.map(({ id, nome, avatar, ligado, desligadoEm, pronto, bot }) => ({ id, nome, avatar, ligado, desligadoEm, pronto, ...(bot ? { bot } : {}) })),
    vipId: s.vipId,
    // cada jogo: as opções e a sua vista pública (null = não está a ser jogado)
    ...(Object.fromEntries(
      LISTA.flatMap((j) => {
        const g = campos(s)[j.chave] as JogoComum | null | undefined;
        return [
          [j.chaveDef, opcoesDe(s, j)],
          [j.chave, g ? j.vista(g, (id) => tags.get(id)) : null],
        ];
      }),
    ) as VistasJogos),
    semTv: !!s.semTv,
    tutorial: s.tutorial ?? null,
    aliases: s.aliases,
    ausentes: s.ausentes ?? [],
    espectadores: espectadores(s),
    pausaSaida: !!s.pausaSaida,
    fechada: !!s.fechada,
    barrados: s.barrados ?? [],
    expulsos: s.expulsos ?? [],
  };
}

/**
 * Canal privado (jogos de papéis secretos): o que só o telemóvel do jogador `id` pode receber.
 * null = nada de privado (o host não abre canal). Cada jogo diz o seu (`privado` no registo).
 */
export function privadoSala(s: EstadoSala, id: string): unknown {
  const ativo = jogoEmCurso(s);
  return ativo?.j.privado ? ativo.j.privado(ativo.g, id) : null;
}
