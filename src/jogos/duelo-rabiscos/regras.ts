import { irPara, pausaPorFalta, podio, quantosLigados, type Podio } from '../../core/jogo';
import { bytesTracos, limparTracos, type Traco } from '../../ui/tracos';
import { CRIATURAS, CUSTO, MAGOS_PODERES, custoExercito, exercitosProntos, validarExercito, type Criatura, type Exercito, type Marca, type Poder, type RoupaMago } from './criaturas';
import { N_OBSTACULOS, alcance, distancia, linhaLivre, novoTabuleiro, seguinte, vizinhas, type Casa, type Obstaculos, type Tabuleiro } from './tabuleiro';

/** Duelo de Rabiscos: regras em info/jogos/guerra-de-desenhos.md */

export interface DefDuelo {
  tinta: number;
  desenhar: number; // s por criatura
  obstaculos: Obstaculos;
}
export const DEF_PADRAO_DUELO: DefDuelo = { tinta: 12, desenhar: 60, obstaculos: 'poucos' };
export const MIN_JOGADORES = 2;
export const MAX_JOGADORES = 4;
export const MIN_LIGADOS = 2;
export const MIN_TINTA = 6;
export const MAX_TINTA = 30;
export const MIN_DESENHAR = 10;
export const MAX_DESENHAR = 180;
export const MAX_GEMAS = 7;
export const DADOS_ACAO = 4;
export const MAX_BONUS = 2;
/** por desenho (até 12 numa partida de 4): cabem todos numa só mensagem do canal */
export const MAX_BYTES_DESENHO = 8_000;
export const T_MAGO = 30;
export const T_EXERCITO = 60;
export const T_RODAR = 12;
export const T_VEZ = 30;
export const T_BATALHA = 8;
export const T_LOBO = 10;
export const TIPOS_DUELO = ['dr_mago', 'dr_exercito', 'dr_desenho', 'dr_rodar', 'dr_pronto', 'dr_andar', 'dr_atacar', 'dr_especial', 'dr_poder', 'dr_comprar', 'dr_passar', 'dr_lobo', 'dr_lutar'];

/** Habilidade: só para os especiais das criaturas (Velho Pescador, Múmia, Carvalho Vivo); a coringa serve para tudo */
export type Face = 'andar' | 'fazer' | 'habilidade' | 'coringa';
const FACES: Face[] = ['andar', 'andar', 'fazer', 'fazer', 'habilidade', 'coringa'];
/** face de ferimento dos dados de batalha (26/11): não conta como risco/bloqueio, mas fere a criatura inimiga que sobreviver */
export const FERE = 3;
/** face de gema dos dados de batalha (26/11): não conta como risco/bloqueio; dá 1 gema a quem a tirou */
export const GEMA = 4;
const ATAQUE = [0, GEMA, FERE, 1, 1, 2];
// a defesa só bloqueia: sem face de ferimento (26/11)
const DEFESA = [0, GEMA, 0, 1, 1, 1];
/** riscos (ou bloqueios) de uma lista de dados normais */
export const acertos = (l: number[]): number => l.reduce((t, v) => t + (v === FERE || v === GEMA ? 0 : v), 0);
const gemasDe = (l: number[]): number => l.filter((v) => v === GEMA).length;
export const ferimentosDe = (l: number[]): number => l.filter((v) => v === FERE).length;
/** dado de ferimento: substitui um dado normal, no ataque e na defesa, por cada ferimento */
export type FaceFerida = 'espada' | 'escudo' | 'coracao' | 'gema' | 'vazio';
/** dados fracos (26/11): um de ataque (nunca mostra escudo) e um de defesa (nunca mostra espada); mesmas hipóteses de antes */
const FERIDA_ATAQUE: FaceFerida[] = ['espada', 'vazio', 'coracao', 'gema', 'vazio', 'vazio'];
const FERIDA_DEFESA: FaceFerida[] = ['vazio', 'escudo', 'coracao', 'gema', 'vazio', 'vazio'];

export interface Cria {
  id: number;
  dono: string;
  tipo: Criatura;
  ferimentos: number;
  casa: Casa;
  andou: boolean;
  agiu: boolean;
  /** Sono: não age até ao fim da volta */
  sono: boolean;
  /** volta em que foi adormecida pela última vez (0 = nunca) */
  ultimoSono: number;
  furia: boolean;
  maisAtaque: boolean;
  escudo: boolean;
  /** Cópia Fantasma */
  fantasma: boolean;
  /** volta em que apareceu (o fantasma não age nessa volta) */
  nasceu: number;
  marcas: Marca[];
}

export interface Mago {
  roupa: RoupaMago | null;
  exercito: Exercito | null;
  desenhos: Partial<Record<Criatura, Traco[]>>;
  gemas: number;
  dados: Face[];
  relancou: boolean;
  /** pronto nesta fase (rodar, batalha) */
  pronto: boolean;
  poderUsado: boolean;
  /** relançamentos de batalha grátis (2.º poder) */
  gratis: number;
}

export interface Batalha {
  de: number;
  alvo: number;
  /** antes de rolar (26/11): quantos dados cada lado vai rolar (a base + os comprados com gemas) */
  nA: number;
  nD: number;
  rolado: boolean;
  ataque: number[];
  defesa: number[];
  /** dados de ferimento de cada lado */
  feridaAtaque: FaceFerida[];
  feridaDefesa: FaceFerida[];
}

/** a última batalha, para a mostrar depois de resolvida (as criaturas podem já não existir) */
export interface UltimaBatalha {
  /** quantas batalhas já houve */
  n: number;
  de: number;
  alvo: number;
  morreu: boolean;
  morreuQuemAtacou: boolean;
  marca: Marca;
  dados: Batalha;
  quemAtacou: Pick<Cria, 'dono' | 'tipo'>;
  quemDefendeu: Pick<Cria, 'dono' | 'tipo'>;
  /** casas de quem caiu nesta batalha (também em cadeia: Minotauro, ferimentos), para o fumo na colmeia */
  caidas?: Casa[];
}

export type FaseDuelo = 'mago' | 'exercito' | 'desenhar' | 'rodar' | 'vez' | 'batalha' | 'lobo' | 'fim';

export interface EstadoDuelo {
  def: DefDuelo;
  fase: FaseDuelo;
  terminaEm: number;
  pausaRestante: number | null;
  participantes: string[];
  audiencia: string[];
  ligados: string[];
  usadas: string[];
  magos: Record<string, Mago>;
  /** quem acabou os desenhos, por ordem */
  acabaram: string[];
  tabuleiro: Tabuleiro;
  /** bloqueiam até ao fim da volta `ate` */
  muralhas: { casa: Casa; ate: number }[];
  criaturas: Cria[];
  proximoId: number;
  volta: number;
  comecou: string;
  vez: string;
  batalha: Batalha | null;
  /** Lobo que acabou de atacar e pode andar mais 1 */
  lobo: number | null;
  /** a ação em curso foi uma luta colada (não gasta dado): no fim, a vez fica com o mesmo mago */
  semDado: boolean;
  ultimo: UltimaBatalha | null;
  /** por ordem de eliminação (quem cai ao mesmo tempo fica no mesmo grupo) */
  eliminados: string[][];
  semente: number;
}

export interface AlvoPoder {
  criatura?: number;
  outra?: number;
  casa?: Casa;
  casas?: Casa[];
}

type AcaoJogador =
  | { tipo: 'dr_mago'; id: string; roupa: RoupaMago }
  | { tipo: 'dr_exercito'; id: string; exercito: Exercito }
  | { tipo: 'dr_desenho'; id: string; criatura: Criatura; tracos: Traco[]; pronto?: boolean }
  | { tipo: 'dr_rodar'; id: string; i: number }
  | { tipo: 'dr_pronto'; id: string }
  | { tipo: 'dr_andar'; id: string; i: number; criatura: number; casa: Casa }
  | { tipo: 'dr_atacar'; id: string; i: number; criatura: number; alvo: number }
  | { tipo: 'dr_especial'; id: string; i: number; criatura: number; alvo?: number; casa?: Casa }
  | { tipo: 'dr_poder'; id: string; poder: Poder; alvo: AlvoPoder }
  | { tipo: 'dr_comprar'; id: string }
  | { tipo: 'dr_passar'; id: string; i: number }
  | { tipo: 'dr_lutar'; id: string; criatura: number; alvo: number }
  | { tipo: 'dr_lobo'; id: string; casa: Casa | null };
export type AcaoDuelo = AcaoJogador | { tipo: 'ligados'; ids: string[] } | { tipo: 'tick' };

/** dado de 0 a 5; nos testes passa-se outro */
export type Rodar = () => number;

const entre = (n: unknown, min: number, max: number, padrao: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : padrao);
const tem = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** como `limparTracos`, mas corta o que passar de MAX_BYTES_DESENHO */
export function limparDesenho(t: unknown): Traco[] {
  const l = limparTracos(t);
  while (bytesTracos(l) > MAX_BYTES_DESENHO) l.pop();
  return l;
}

export function novoDuelo(ids: string[], def: Partial<DefDuelo>, agora: number, usadas: string[] = [], semente = agora): EstadoDuelo {
  const participantes = ids.slice(0, MAX_JOGADORES);
  const d: DefDuelo = {
    tinta: entre(def.tinta, MIN_TINTA, MAX_TINTA, DEF_PADRAO_DUELO.tinta),
    desenhar: entre(def.desenhar, MIN_DESENHAR, MAX_DESENHAR, DEF_PADRAO_DUELO.desenhar),
    obstaculos: def.obstaculos && tem(N_OBSTACULOS, def.obstaculos) ? def.obstaculos : DEF_PADRAO_DUELO.obstaculos,
  };
  const mago = (): Mago => ({ roupa: null, exercito: null, desenhos: {}, gemas: 0, dados: [], relancou: false, pronto: false, poderUsado: false, gratis: 0 });
  return {
    def: d,
    fase: 'mago',
    terminaEm: agora + T_MAGO * 1000,
    pausaRestante: null,
    participantes,
    audiencia: ids.slice(MAX_JOGADORES),
    ligados: [...ids],
    usadas,
    magos: Object.fromEntries(participantes.map((id) => [id, mago()])),
    acabaram: [],
    tabuleiro: novoTabuleiro(participantes.length, d.obstaculos, semente),
    muralhas: [],
    criaturas: [],
    proximoId: 1,
    volta: 0,
    comecou: '',
    vez: '',
    batalha: null,
    lobo: null,
    semDado: false,
    ultimo: null,
    eliminados: [],
    semente: semente >>> 0,
  };
}

// ---------- consultas (também para os ecrãs e os bots) ----------

export const cria = (e: VistaDuelo, id: number | undefined): Cria | undefined => e.criaturas.find((c) => c.id === id);
export const vivos = (e: VistaDuelo): string[] => e.participantes.filter((id) => e.criaturas.some((c) => c.dono === id));
const existe = (e: VistaDuelo) => (c: Casa) => e.tabuleiro.casas.includes(c);
const tapada = (e: VistaDuelo) => (c: Casa) => e.tabuleiro.obstaculos.includes(c) || e.muralhas.some((m) => m.casa === c);
const ocupada = (e: VistaDuelo) => (c: Casa) => tapada(e)(c) || e.criaturas.some((x) => x.casa === c);
export const livre = (e: VistaDuelo, c: Casa | undefined): boolean => typeof c === 'string' && existe(e)(c) && !ocupada(e)(c);
export const colados = (a: Cria, b: Cria) => distancia(a.casa, b.casa) === 1;
export const temEfeito = (c: Cria) => c.furia || c.maisAtaque || c.escudo || c.sono;
const podeAgir = (e: VistaDuelo, c: Cria) => !c.sono && !(c.fantasma && c.nasceu === e.volta);

/** casas para onde pode andar agora */
export function casasAndar(e: VistaDuelo, c: Cria): Casa[] {
  if (c.andou || !podeAgir(e, c)) return [];
  return alcance(c.casa, CRIATURAS[c.tipo].passos, existe(e), ocupada(e), c.tipo === 'corvo');
}

function chega(e: VistaDuelo, c: Cria, o: Cria, min: number, max: number): boolean {
  const d = distancia(c.casa, o.casa);
  return d >= min && d <= max && linhaLivre(c.casa, o.casa, tapada(e));
}

/** inimigos que pode atingir à distância com o dado Fazer algo (só o Elfo e o Dragãozinho) */
export function alvosAtaque(e: VistaDuelo, c: Cria): Cria[] {
  if (c.agiu || !podeAgir(e, c)) return [];
  return e.criaturas.filter((o) => {
    if (o.dono === c.dono) return false;
    if (c.tipo === 'elfo') return chega(e, c, o, 2, 3);
    if (c.tipo === 'dragaozinho') return chega(e, c, o, 2, 2);
    return false;
  });
}

/** inimigos colados com quem pode lutar sem dado (26/11); o Elfo não luta colado */
export function alvosLuta(e: VistaDuelo, c: Cria): Cria[] {
  if (c.agiu || !podeAgir(e, c) || c.tipo === 'elfo') return [];
  return e.criaturas.filter((o) => o.dono !== c.dono && colados(c, o));
}

/**
 * Corpo a corpo ao andar (26/11): se acabar de andar colada a um inimigo, luta logo com ele (sem gastar outro dado).
 * Com vários, escolhe o mais fraco (menos defesa que lhe resta). O Elfo não luta colado.
 */
export function alvoAoChegar(e: VistaDuelo, c: Cria): Cria | undefined {
  if (c.agiu || !podeAgir(e, c) || c.tipo === 'elfo') return undefined;
  const resta = (o: Cria) => CRIATURAS[o.tipo].defesa - o.ferimentos;
  return e.criaturas.filter((o) => o.dono !== c.dono && colados(c, o)).sort((a, b) => resta(a) - resta(b) || a.id - b.id)[0];
}

/** Sopro do Dragãozinho: a casa colada escolhida e a seguinte na mesma reta (se o fogo lá chegar) */
export function fogoSopro(e: VistaDuelo, c: Cria, casa: Casa): Casa[] {
  const l = [casa];
  const a = seguinte(c.casa, casa);
  if (!tapada(e)(casa) && existe(e)(a)) l.push(a);
  return l;
}

/** casa livre colada ao Velho Pescador, a mais perto de `o` */
function casaPuxar(e: VistaDuelo, c: Cria, o: Cria): Casa | undefined {
  return vizinhas(c.casa).filter((v) => livre(e, v)).sort((a, b) => distancia(a, o.casa) - distancia(b, o.casa))[0];
}

/** o especial gasta o dado Habilidade (ou a coringa) e a ação de atacar dessa volta; não gasta gemas */
const podeEspecial = (e: VistaDuelo, c: Cria) => !c.agiu && podeAgir(e, c);

/** alvos do especial: Velho Pescador (inimigo a puxar), Múmia (amigo ferido a curar), Cavaleiro (ele próprio: em guarda) */
export function alvosEspecial(e: VistaDuelo, c: Cria): Cria[] {
  if (!podeEspecial(e, c)) return [];
  if (c.tipo === 'velhoPescador') return e.criaturas.filter((o) => o.dono !== c.dono && chega(e, c, o, 2, 3) && casaPuxar(e, c, o) !== undefined);
  if (c.tipo === 'mumia') return e.criaturas.filter((o) => o !== c && o.dono === c.dono && o.ferimentos > 0 && distancia(c.casa, o.casa) <= 2);
  if (c.tipo === 'cavaleiro') return c.escudo || c.maisAtaque ? [] : [c];
  return [];
}

/** casas do especial: parede do Carvalho Vivo (casa livre colada); Sopro do Dragãozinho (casa colada, se o fogo apanhar alguém) */
export function casasEspecial(e: VistaDuelo, c: Cria): Casa[] {
  if (!podeEspecial(e, c)) return [];
  if (c.tipo === 'carvalho') return vizinhas(c.casa).filter((v) => livre(e, v));
  if (c.tipo === 'dragaozinho') return vizinhas(c.casa).filter((v) => existe(e)(v) && fogoSopro(e, c, v).some((x) => e.criaturas.some((o) => o.casa === x)));
  return [];
}

/** que face serve para quê */
export const serve = (face: Face, para: 'andar' | 'atacar' | 'especial'): boolean => face === 'coringa' || face === { andar: 'andar', atacar: 'fazer', especial: 'habilidade' }[para];

/** este dado serve para alguma coisa agora? */
export function dadoServe(e: VistaDuelo, id: string, face: Face): boolean {
  return e.criaturas.some(
    (c) =>
      c.dono === id &&
      ((serve(face, 'andar') && casasAndar(e, c).length > 0) || (serve(face, 'atacar') && alvosAtaque(e, c).length > 0) || (serve(face, 'especial') && (alvosEspecial(e, c).length > 0 || casasEspecial(e, c).length > 0))),
  );
}

export function dadosAtaque(e: VistaDuelo, c: Cria, alvo: Cria): number {
  let bonus = 0;
  if (c.tipo === 'duende' && e.criaturas.some((o) => o.id !== c.id && o.dono === c.dono && CRIATURAS[o.tipo].classe === 'lacaio' && colados(o, alvo))) bonus++;
  if (c.tipo === 'ogre') bonus += c.ferimentos;
  if (c.furia) bonus += 2;
  if (c.maisAtaque) bonus++;
  return Math.max(1, CRIATURAS[c.tipo].dados + Math.min(MAX_BONUS, bonus));
}

/** total de dados de defesa, já com os de ferimento */
export function dadosDefesa(e: VistaDuelo, alvo: Cria): number {
  const golem = e.criaturas.some((o) => o.id !== alvo.id && o.dono === alvo.dono && o.tipo === 'golem' && colados(o, alvo));
  return CRIATURAS[alvo.tipo].defesa + (golem ? 1 : 0) + (alvo.escudo ? 1 : 0);
}

/** quanto custa o próximo dado de batalha: os dados que ficam (ter 2 → o 3.º custa 3) */
export function custoDado(e: VistaDuelo, id: string): number {
  const b = e.batalha;
  if (!b) return Infinity;
  return (cria(e, b.de)?.dono === id ? b.nA : b.nD) + 1;
}

/** este mago ainda está a escolher (comprar dados ou ficar) nesta batalha? */
export function podeComprar(e: VistaDuelo, id: string): boolean {
  const b = e.batalha;
  if (!b || b.rolado || (cria(e, b.de)?.dono !== id && cria(e, b.alvo)?.dono !== id)) return false;
  return !e.magos[id].pronto;
}

/** dá para pagar mais um dado agora? (a 1.ª compra é grátis depois do 1.º poder da volta) */
export const chegaParaComprar = (e: VistaDuelo, id: string): boolean => podeComprar(e, id) && (e.magos[id].gratis > 0 || e.magos[id].gemas >= custoDado(e, id));

/** casas para o passo extra do Lobo */
export const casasLobo = (e: VistaDuelo, c: Cria): Casa[] => vizinhas(c.casa).filter((v) => livre(e, v));

/** pódio: o vencedor primeiro; quem caiu mais tarde fica à frente */
export function classificacao(e: VistaDuelo): Podio[] {
  const pontos = Object.fromEntries(e.participantes.map((id) => [id, e.eliminados.length]));
  e.eliminados.forEach((g, i) => g.forEach((id) => (pontos[id] = i)));
  return podio(e.participantes, pontos);
}

// ---------- o que vai para os ecrãs (sem a semente dos dados) ----------

export const PREPARACAO: FaseDuelo[] = ['mago', 'exercito', 'desenhar'];

/** quem já fez a sua parte na preparação (para o progresso) */
export function feitosPreparacao(e: Pick<EstadoDuelo, 'fase' | 'participantes' | 'magos' | 'acabaram'>): string[] {
  if (e.fase === 'desenhar') return e.acabaram;
  return e.participantes.filter((id) => (e.fase === 'mago' ? e.magos[id].roupa !== null : e.magos[id].exercito !== null));
}

/** os traços não vão na vista (só quais existem): a TV lê-os do estado e os telemóveis recebem-nos pelo canal privado */
export type VistaDuelo = Omit<EstadoDuelo, 'semente' | 'usadas'>;
export function vistaDuelo(e: EstadoDuelo): VistaDuelo {
  const v: Partial<EstadoDuelo> = { ...e };
  delete v.semente;
  delete v.usadas;
  v.magos = Object.fromEntries(e.participantes.map((id) => [id, { ...e.magos[id], desenhos: Object.fromEntries(Object.keys(e.magos[id].desenhos).map((c) => [c, []])) }]));
  return v as VistaDuelo;
}

/** desenhos de todos: mago → criatura → traços (só os que têm riscos) */
export type Desenhos = Record<string, Partial<Record<Criatura, Traco[]>>>;
export const desenhosDuelo = (e: EstadoDuelo): Desenhos =>
  Object.fromEntries(e.participantes.map((id) => [id, Object.fromEntries(Object.entries(e.magos[id].desenhos).filter(([, l]) => l.length))]));

/**
 * Canal privado: os desenhos de todos, da batalha em diante. O host só o reenvia quando muda (aqui nunca muda)
 * ou a quem entra ou recarrega, por isso vão uma só vez. Não é segredo: é só para não ir em cada vista.
 */
export const privadoDuelo = (e: EstadoDuelo): Desenhos | null => (PREPARACAO.includes(e.fase) ? null : desenhosDuelo(e));

/** pontos para o torneio */
export const resultadoDuelo = (e: EstadoDuelo): Record<string, number> => Object.fromEntries(classificacao(e).map((p) => [p.id, p.pontos]));

// ---------- reducer: daqui para baixo `s` é uma cópia privada, que se muda à vontade ----------

function dar(s: EstadoDuelo, rnd?: Rodar): number {
  if (rnd) return rnd();
  s.semente = (s.semente + 0x6d2b79f5) >>> 0;
  let t = s.semente;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * 6);
}

const mudarFase = (s: EstadoDuelo, f: FaseDuelo, seg: number, agora: number): void => {
  Object.assign(s, irPara(s, f, seg, agora));
};

function irExercito(s: EstadoDuelo, agora: number): void {
  for (const id of s.participantes) {
    const usadas = s.participantes.map((x) => s.magos[x].roupa);
    s.magos[id].roupa ??= (Object.keys(MAGOS_PODERES) as RoupaMago[]).find((r) => !usadas.includes(r))!;
  }
  mudarFase(s, 'exercito', T_EXERCITO, agora);
}

function irDesenhar(s: EstadoDuelo, agora: number): void {
  for (const id of s.participantes) s.magos[id].exercito ??= exercitosProntos(s.def.tinta)[0];
  const n = Math.max(...s.participantes.map((id) => Object.keys(s.magos[id].exercito!).length));
  mudarFase(s, 'desenhar', s.def.desenhar * n, agora);
}

function porCriatura(s: EstadoDuelo, dono: string, tipo: Criatura, c: Casa, fantasma = false): void {
  s.criaturas.push({
    id: s.proximoId++,
    dono,
    tipo,
    ferimentos: 0,
    casa: c,
    andou: false,
    agiu: false,
    sono: false,
    ultimoSono: 0,
    furia: false,
    maisAtaque: false,
    escudo: false,
    fantasma,
    nasceu: s.volta,
    marcas: [],
  });
}

function comecar(s: EstadoDuelo, agora: number, rnd?: Rodar): void {
  s.participantes.forEach((id, i) => {
    const m = s.magos[id];
    m.gemas = Math.min(MAX_GEMAS, s.def.tinta - custoExercito(m.exercito!));
    const perto = [...s.tabuleiro.casas].sort((a, b) => distancia(a, s.tabuleiro.cantos[i]) - distancia(b, s.tabuleiro.cantos[i]));
    for (const [tipo, n] of Object.entries(m.exercito!) as [Criatura, number][])
      for (let k = 0; k < n; k++) porCriatura(s, id, tipo, perto.find((c) => livre(s, c))!);
  });
  novaVolta(s, agora, rnd);
}

function novaVolta(s: EstadoDuelo, agora: number, rnd?: Rodar): void {
  const ids = vivos(s);
  const quantas = (id: string) => s.criaturas.filter((c) => c.dono === id).length;
  s.volta++;
  if (s.volta === 1) s.comecou = s.acabaram[0] ?? ids[0];
  else {
    const menos = Math.min(...ids.map(quantas));
    const n = s.participantes.length;
    const i = s.participantes.indexOf(s.comecou);
    // empate: o seguinte ao que começou a volta anterior
    for (let k = 1; k <= n; k++) {
      const id = s.participantes[(i + k) % n];
      if (ids.includes(id) && quantas(id) === menos) {
        s.comecou = id;
        break;
      }
    }
  }
  s.muralhas = s.muralhas.filter((m) => m.ate >= s.volta);
  for (const c of s.criaturas) Object.assign(c, { andou: false, agiu: false, sono: false, escudo: false });
  for (const id of s.participantes) {
    const m = s.magos[id];
    const vivo = ids.includes(id);
    Object.assign(m, { dados: [], relancou: false, pronto: !vivo, poderUsado: false, gratis: 0 });
    if (!vivo) continue;
    m.gemas = Math.min(MAX_GEMAS, m.gemas + 1);
    for (let k = 0; k < DADOS_ACAO; k++) m.dados.push(FACES[dar(s, rnd)]);
  }
  mudarFase(s, 'rodar', T_RODAR, agora);
}

/** dá a vez a partir de `id` (inclusive) a quem ainda tem dados; sem ninguém, nova volta */
function darVez(s: EstadoDuelo, id: string, agora: number, rnd?: Rodar): void {
  const n = s.participantes.length;
  const i = Math.max(0, s.participantes.indexOf(id));
  const ids = vivos(s);
  for (let k = 0; k < n; k++) {
    const p = s.participantes[(i + k) % n];
    if (!s.magos[p].dados.length || !ids.includes(p)) continue;
    s.vez = p;
    s.magos[p].poderUsado = false;
    return mudarFase(s, 'vez', T_VEZ, agora);
  }
  novaVolta(s, agora, rnd);
}

function verFim(s: EstadoDuelo, agora: number): boolean {
  const ids = vivos(s);
  const fora = s.eliminados.flat();
  const novos = s.participantes.filter((id) => !ids.includes(id) && !fora.includes(id));
  if (novos.length) s.eliminados.push(novos);
  if (ids.length > 1) return false;
  s.batalha = null;
  s.lobo = null;
  mudarFase(s, 'fim', 0, agora);
  return true;
}

/** fim de uma batalha ou do passo do Lobo: a luta colada não gasta dado, por isso o mesmo mago continua (se tiver dados) */
function depoisDaAcao(s: EstadoDuelo, agora: number, rnd?: Rodar): void {
  if (!s.semDado) return acabarVez(s, agora, rnd);
  s.semDado = false;
  s.batalha = null;
  s.lobo = null;
  if (verFim(s, agora)) return;
  if (vivos(s).includes(s.vez) && s.magos[s.vez].dados.length) return mudarFase(s, 'vez', T_VEZ, agora);
  acabarVez(s, agora, rnd);
}

function acabarVez(s: EstadoDuelo, agora: number, rnd?: Rodar): void {
  s.batalha = null;
  s.lobo = null;
  if (verFim(s, agora)) return;
  darVez(s, s.participantes[(s.participantes.indexOf(s.vez) + 1) % s.participantes.length], agora, rnd);
}

/** tira da mesa; trata mortes em cadeia (Minotauro), gemas, Sapinho e fantasmas sozinhos */
function matar(s: EstadoDuelo, alvo: Cria, autor?: Cria): void {
  if (!s.criaturas.includes(alvo)) return;
  s.criaturas = s.criaturas.filter((c) => c !== alvo);
  const m = s.magos[alvo.dono];
  if (!alvo.fantasma) m.gemas = Math.min(MAX_GEMAS, m.gemas + 1);
  if (alvo.tipo === 'sapinho' && autor) ferir(s, autor, undefined, CRIATURAS.sapinho.marca);
  if (alvo.tipo === 'minotauro') for (const c of s.criaturas.filter((o) => o.dono !== alvo.dono && colados(o, alvo))) ferir(s, c, undefined, CRIATURAS.minotauro.marca);
  if (!s.criaturas.some((c) => c.dono === alvo.dono && !c.fantasma)) s.criaturas = s.criaturas.filter((c) => c.dono !== alvo.dono);
}

/** +1 ferimento; morre se já não tinha dados de defesa normais */
function ferir(s: EstadoDuelo, alvo: Cria, autor?: Cria, marca?: Marca): void {
  if (!s.criaturas.includes(alvo)) return;
  if (alvo.ferimentos >= CRIATURAS[alvo.tipo].defesa) return matar(s, alvo, autor);
  alvo.ferimentos++;
  if (marca) alvo.marcas.push(marca);
}

/** corações curam quem sobreviveu; gemas vão para o dono */
function depoisDoCombate(s: EstadoDuelo, c: Cria, faces: FaceFerida[]): void {
  const n = (f: FaceFerida) => faces.filter((x) => x === f).length;
  const m = s.magos[c.dono];
  m.gemas = Math.min(MAX_GEMAS, m.gemas + n('gema'));
  if (s.criaturas.includes(c)) c.ferimentos = Math.max(0, c.ferimentos - n('coracao'));
}

function resolver(s: EstadoDuelo, agora: number, rnd?: Rodar): void {
  const b = s.batalha!;
  const de = cria(s, b.de)!;
  const alvo = cria(s, b.alvo)!;
  const riscos = acertos(b.ataque) + b.feridaAtaque.filter((f) => f === 'espada').length;
  const bloqueios = acertos(b.defesa) + b.feridaDefesa.filter((f) => f === 'escudo').length;
  // corpo a corpo: perde quem tiver menos e no empate caem os dois; de longe só o alvo arrisca
  const perto = colados(de, alvo);
  const empate = perto && riscos === bloqueios;
  // a Raposa sobrevive ao empate; duas Raposas sobrevivem ambas
  const morreu = riscos > bloqueios || (empate && alvo.tipo !== 'raposa');
  const morreuQuemAtacou = perto && (riscos < bloqueios || (empate && de.tipo !== 'raposa'));
  const { marca } = CRIATURAS[de.tipo];
  const quem = ({ dono, tipo }: Cria) => ({ dono, tipo });
  s.ultimo = { n: (s.ultimo?.n ?? 0) + 1, de: de.id, alvo: alvo.id, morreu, morreuQuemAtacou, marca, dados: b, quemAtacou: quem(de), quemDefendeu: quem(alvo) };
  de.furia = de.maisAtaque = false;
  const antes = s.criaturas.map((c) => [c, c.casa] as const);
  if (morreu) matar(s, alvo, de);
  if (morreuQuemAtacou) matar(s, de, alvo);
  if (!perto && !morreu && de.tipo === 'dragaozinho') ferir(s, alvo, de, marca);
  // cada face de ferimento fere o inimigo que sobreviveu; de longe, o alvo não fere quem atirou
  for (let k = 0; k < ferimentosDe(b.ataque); k++) ferir(s, alvo, de, marca);
  if (perto) for (let k = 0; k < ferimentosDe(b.defesa); k++) ferir(s, de, alvo, CRIATURAS[alvo.tipo].marca);
  depoisDoCombate(s, de, b.feridaAtaque);
  depoisDoCombate(s, alvo, b.feridaDefesa);
  // gemas dos dados normais vão para o dono, viva ou não a criatura
  for (const [c, l] of [[de, b.ataque], [alvo, b.defesa]] as const) s.magos[c.dono].gemas = Math.min(MAX_GEMAS, s.magos[c.dono].gemas + gemasDe(l));
  s.ultimo.caidas = antes.filter(([c]) => !s.criaturas.includes(c)).map(([, casa]) => casa);
  s.batalha = null;
  if (de.tipo === 'lobo' && s.criaturas.includes(de) && vivos(s).length > 1 && casasLobo(s, de).length) {
    s.lobo = de.id;
    return mudarFase(s, 'lobo', T_LOBO, agora);
  }
  depoisDaAcao(s, agora, rnd);
}

/** começa a batalha: antes de rolar, cada lado pode comprar dados com gemas; quem não chega para nenhum fica logo pronto */
function atacar(s: EstadoDuelo, de: Cria, alvo: Cria, agora: number, rnd?: Rodar): void {
  s.batalha = { de: de.id, alvo: alvo.id, nA: dadosAtaque(s, de, alvo), nD: dadosDefesa(s, alvo), rolado: false, ataque: [], defesa: [], feridaAtaque: [], feridaDefesa: [] };
  for (const id of [de.dono, alvo.dono]) s.magos[id].pronto = false;
  for (const id of [de.dono, alvo.dono]) if (!chegaParaComprar(s, id)) s.magos[id].pronto = true;
  mudarFase(s, 'batalha', T_BATALHA, agora);
  if (!podeComprar(s, de.dono) && !podeComprar(s, alvo.dono)) rolarEResolver(s, agora, rnd);
}

/** rola os dados todos (os comprados incluídos) e resolve */
function rolarEResolver(s: EstadoDuelo, agora: number, rnd?: Rodar): void {
  const b = s.batalha!;
  if (!b.rolado) rolarBatalha(s, b, rnd);
  resolver(s, agora, rnd);
}

function rolarBatalha(s: EstadoDuelo, b: Batalha, rnd?: Rodar): void {
  const de = cria(s, b.de)!;
  const alvo = cria(s, b.alvo)!;
  const rodar = <F,>(n: number, faces: F[]) => Array.from({ length: n }, () => faces[dar(s, rnd)]);
  const nAtaque = b.nA;
  const nDefesa = b.nD;
  const fracosA = Math.min(nAtaque, de.ferimentos);
  const fracosD = Math.min(nDefesa, alvo.ferimentos);
  const ataque = rodar(nAtaque - fracosA, ATAQUE);
  // Cavaleiro: relança 1 vazio, a atacar e a defender
  const outraVez = (c: Cria, l: number[], faces: number[]) => {
    const vazio = l.indexOf(0);
    if (c.tipo === 'cavaleiro' && vazio >= 0) l[vazio] = faces[dar(s, rnd)];
  };
  outraVez(de, ataque, ATAQUE);
  const feridaAtaque = rodar(fracosA, FERIDA_ATAQUE);
  const defesa = rodar(nDefesa - fracosD, DEFESA);
  outraVez(alvo, defesa, DEFESA);
  Object.assign(b, { ataque, defesa, feridaAtaque, feridaDefesa: rodar(fracosD, FERIDA_DEFESA), rolado: true });
}

/** aplica o poder; false = alvo inválido */
function aplicarPoder(s: EstadoDuelo, id: string, poder: Poder, a: AlvoPoder): boolean {
  const c = cria(s, a.criatura);
  const minha = c?.dono === id;
  switch (poder) {
    case 'empurrao':
      if (!c || !livre(s, a.casa) || distancia(c.casa, a.casa!) !== 1) return false;
      c.casa = a.casa!;
      return true;
    case 'escudo':
    case 'furia':
    case 'maisAtaque':
      if (!c || !minha || temEfeito(c)) return false;
      c[poder] = true;
      return true;
    case 'retoque':
      if (!c || !minha || c.ferimentos === 0) return false;
      c.ferimentos--;
      return true;
    case 'tempestade':
      if (!c || minha) return false;
      // os atingidos contam-se antes de alguém cair
      for (const o of s.criaturas.filter((x) => x === c || colados(x, c))) ferir(s, o);
      return true;
    case 'copia':
      if (!livre(s, a.casa) || s.criaturas.some((x) => x.fantasma && x.dono === id)) return false;
      if (!s.criaturas.some((x) => x.dono === id && distancia(x.casa, a.casa!) === 1)) return false;
      porCriatura(s, id, 'duende', a.casa!, true);
      return true;
    case 'sono':
      if (!c || minha || temEfeito(c) || (c.ultimoSono > 0 && s.volta - c.ultimoSono <= 1)) return false;
      c.sono = true;
      c.ultimoSono = s.volta;
      return true;
    case 'muralha': {
      const l = Array.isArray(a.casas) ? a.casas : [];
      if (l.length !== 3 || new Set(l).size !== 3 || !l.every((x) => livre(s, x))) return false;
      if (!l.every((x) => l.some((y) => distancia(x, y) === 1))) return false;
      s.muralhas.push(...l.map((casa) => ({ casa, ate: s.volta + 1 })));
      return true;
    }
    case 'troca': {
      const o = cria(s, a.outra);
      if (!c || !o || c === o) return false;
      [c.casa, o.casa] = [o.casa, c.casa];
      return true;
    }
  }
}

/** tira o dado `i` da mão; Habilidade e Fazer algo que não se usam viram 1 gema (26/11) */
function largarDado(m: Mago, i: number): void {
  const [face] = m.dados.splice(i, 1);
  if (face === 'habilidade' || face === 'fazer') m.gemas = Math.min(MAX_GEMAS, m.gemas + 1);
}

function tempoEsgotado(s: EstadoDuelo, agora: number, rnd?: Rodar): void {
  switch (s.fase) {
    case 'mago':
      return irExercito(s, agora);
    case 'exercito':
      return irDesenhar(s, agora);
    case 'desenhar':
      return comecar(s, agora, rnd);
    case 'rodar':
      return darVez(s, s.comecou, agora, rnd);
    case 'vez':
      largarDado(s.magos[s.vez], 0);
      return acabarVez(s, agora, rnd);
    case 'batalha':
      return rolarEResolver(s, agora, rnd);
    case 'lobo':
      return depoisDaAcao(s, agora, rnd);
  }
}

/** dados sem uso possível perdem-se, um por vez (a não ser que ainda dê para pagar um poder) */
function saltarVezesSemUso(s: EstadoDuelo, agora: number, rnd?: Rodar): void {
  while (s.fase === 'vez') {
    const m = s.magos[s.vez];
    if (m.dados.some((f) => dadoServe(s, s.vez, f))) return;
    if (s.criaturas.some((c) => c.dono === s.vez && alvosLuta(s, c).length)) return;
    if (!m.poderUsado && MAGOS_PODERES[m.roupa!].some((p) => CUSTO[p] <= m.gemas)) return;
    largarDado(m, 0);
    acabarVez(s, agora, rnd);
  }
}

/** false = ação recusada */
function agir(s: EstadoDuelo, a: AcaoJogador, agora: number, rnd?: Rodar): boolean {
  if (!s.participantes.includes(a.id)) return false;
  const m = s.magos[a.id];
  const todos = (f: (x: Mago) => boolean) => s.participantes.every((id) => f(s.magos[id]));
  const minhaVez = s.fase === 'vez' && s.vez === a.id;
  switch (a.tipo) {
    case 'dr_mago':
      if (s.fase !== 'mago' || !tem(MAGOS_PODERES, a.roupa) || s.participantes.some((id) => id !== a.id && s.magos[id].roupa === a.roupa)) return false;
      m.roupa = a.roupa;
      if (todos((x) => x.roupa !== null)) irExercito(s, agora);
      return true;
    case 'dr_exercito': {
      const x = s.fase === 'exercito' ? validarExercito(a.exercito, s.def.tinta) : null;
      if (!x) return false;
      m.exercito = x;
      if (todos((y) => y.exercito !== null)) irDesenhar(s, agora);
      return true;
    }
    case 'dr_desenho':
      if (s.fase !== 'desenhar' || s.acabaram.includes(a.id) || !tem(m.exercito!, a.criatura)) return false;
      m.desenhos[a.criatura] = limparDesenho(a.tracos);
      if (a.pronto) s.acabaram.push(a.id);
      if (s.acabaram.length === s.participantes.length) comecar(s, agora, rnd);
      return true;
    case 'dr_rodar':
      // o 1.º é grátis; os seguintes custam 1 gema cada (26/11)
      if (s.fase !== 'rodar' || m.pronto || !m.dados[a.i] || (m.relancou && m.gemas < 1)) return false;
      if (m.relancou) m.gemas--;
      m.dados[a.i] = FACES[dar(s, rnd)];
      m.relancou = true;
      return true;
    case 'dr_pronto':
      if (s.fase === 'rodar' && !m.pronto) {
        m.pronto = true;
        if (todos((x) => x.pronto)) darVez(s, s.comecou, agora, rnd);
        return true;
      }
      if (s.fase !== 'batalha' || !podeComprar(s, a.id)) return false;
      m.pronto = true;
      if (!s.participantes.some((id) => podeComprar(s, id))) rolarEResolver(s, agora, rnd);
      return true;
    case 'dr_andar': {
      const c = cria(s, a.criatura);
      const face = m.dados[a.i];
      if (!minhaVez || !c || c.dono !== a.id || !face || !serve(face, 'andar') || !casasAndar(s, c).includes(a.casa)) return false;
      m.dados.splice(a.i, 1);
      c.casa = a.casa;
      c.andou = true;
      const alvo = alvoAoChegar(s, c);
      if (alvo) {
        c.agiu = true;
        atacar(s, c, alvo, agora, rnd);
      } else acabarVez(s, agora, rnd);
      return true;
    }
    case 'dr_atacar':
    case 'dr_especial': {
      const c = cria(s, a.criatura);
      const alvo = cria(s, a.alvo);
      const face = m.dados[a.i];
      if (!minhaVez || !c || c.dono !== a.id || !face || !serve(face, a.tipo === 'dr_atacar' ? 'atacar' : 'especial')) return false;
      if (a.tipo === 'dr_especial' && c.tipo === 'dragaozinho') {
        if (!a.casa || !casasEspecial(s, c).includes(a.casa)) return false;
        m.dados.splice(a.i, 1);
        c.agiu = true;
        // conta quem está no fogo antes de alguém cair; amigos também
        const fogo = fogoSopro(s, c, a.casa);
        for (const o of s.criaturas.filter((x) => fogo.includes(x.casa))) ferir(s, o, c, CRIATURAS.dragaozinho.marca);
        acabarVez(s, agora, rnd);
        return true;
      }
      if (a.tipo === 'dr_especial' && c.tipo === 'carvalho') {
        if (!a.casa || !casasEspecial(s, c).includes(a.casa)) return false;
        m.dados.splice(a.i, 1);
        c.agiu = true;
        s.muralhas.push({ casa: a.casa, ate: s.volta + 1 });
        acabarVez(s, agora, rnd);
        return true;
      }
      if (!alvo || !(a.tipo === 'dr_atacar' ? alvosAtaque(s, c) : alvosEspecial(s, c)).includes(alvo)) return false;
      m.dados.splice(a.i, 1);
      c.agiu = true;
      if (a.tipo === 'dr_atacar') {
        atacar(s, c, alvo, agora, rnd);
        return true;
      }
      if (c.tipo === 'mumia') alvo.ferimentos--;
      else if (c.tipo === 'cavaleiro') Object.assign(c, { escudo: true, maisAtaque: true });
      else {
        // puxa, fere e luta já, se ambos continuarem vivos
        alvo.casa = casaPuxar(s, c, alvo)!;
        ferir(s, alvo, c, CRIATURAS.velhoPescador.marca);
        if (s.criaturas.includes(c) && s.criaturas.includes(alvo)) {
          atacar(s, c, alvo, agora, rnd);
          return true;
        }
      }
      acabarVez(s, agora, rnd);
      return true;
    }
    case 'dr_poder': {
      if (!minhaVez || m.poderUsado) return false;
      const par = MAGOS_PODERES[m.roupa!];
      if (!par.includes(a.poder) || m.gemas < CUSTO[a.poder] || !aplicarPoder(s, a.id, a.poder, a.alvo ?? {})) return false;
      m.gemas -= CUSTO[a.poder];
      m.poderUsado = true;
      if (a.poder === par[0]) m.gratis = 1;
      // a Tempestade pode eliminar alguém (até o próprio)
      if (!verFim(s, agora) && !vivos(s).includes(a.id)) acabarVez(s, agora, rnd);
      return true;
    }
    case 'dr_comprar': {
      // +1 dado antes de rolar; custa os dados que fica a ter (o 1.º depois do 1.º poder da volta é grátis)
      const b = s.batalha;
      if (s.fase !== 'batalha' || !b || !chegaParaComprar(s, a.id)) return false;
      const custo = custoDado(s, a.id);
      if (m.gratis > 0) m.gratis--;
      else m.gemas -= custo;
      if (cria(s, b.de)!.dono === a.id) b.nA++;
      else b.nD++;
      return true;
    }
    case 'dr_passar':
      if (!minhaVez || !m.dados[a.i]) return false;
      largarDado(m, a.i);
      acabarVez(s, agora, rnd);
      return true;
    case 'dr_lobo': {
      const c = cria(s, s.lobo ?? undefined);
      if (s.fase !== 'lobo' || !c || c.dono !== a.id) return false;
      if (a.casa !== null) {
        if (!casasLobo(s, c).includes(a.casa)) return false;
        c.casa = a.casa;
      }
      depoisDaAcao(s, agora, rnd);
      return true;
    }
    case 'dr_lutar': {
      const c = cria(s, a.criatura);
      const alvo = cria(s, a.alvo);
      if (!minhaVez || !c || c.dono !== a.id || !alvo || !alvosLuta(s, c).includes(alvo)) return false;
      c.agiu = true;
      s.semDado = true;
      atacar(s, c, alvo, agora, rnd);
      return true;
    }
    default:
      return false;
  }
}

// ---------- saídas a meio (src/core/saidas.ts) ----------

/** quem já foi eliminado só vê */
export const foraDuelo = (e: Pick<EstadoDuelo, 'eliminados'>, id: string): boolean => e.eliminados.some((g) => g.includes(id));
export const importanteDuelo = (e: EstadoDuelo, id: string): boolean => e.fase !== 'fim' && e.participantes.includes(id) && !foraDuelo(e, id);

/** seguir sem ele: na preparação sai da mesa (colmeia nova, com menos um); na batalha perde as criaturas */
export function sairDuelo(e: EstadoDuelo, id: string, agora: number, rnd?: Rodar): EstadoDuelo {
  if (!importanteDuelo(e, id)) return e;
  const s = structuredClone(e);
  if (PREPARACAO.includes(s.fase)) {
    if (s.participantes.length <= 2) {
      s.eliminados.push([id]);
      mudarFase(s, 'fim', 0, agora);
    } else {
      s.participantes = s.participantes.filter((x) => x !== id);
      s.acabaram = s.acabaram.filter((x) => x !== id);
      s.audiencia.push(id);
      delete s.magos[id];
      s.tabuleiro = novoTabuleiro(s.participantes.length, s.def.obstaculos, s.semente);
      if (feitosPreparacao(s).length === s.participantes.length) tempoEsgotado(s, agora, rnd);
    }
  } else {
    const dele = (n: number | null | undefined) => cria(s, n ?? undefined)?.dono === id;
    const aMeio = s.fase === 'batalha' ? dele(s.batalha?.de) || dele(s.batalha?.alvo) : s.fase === 'lobo' ? dele(s.lobo) : s.fase === 'vez' && s.vez === id;
    s.criaturas = s.criaturas.filter((c) => c.dono !== id);
    Object.assign(s.magos[id], { dados: [], pronto: true });
    if (!verFim(s, agora)) {
      if (aMeio) acabarVez(s, agora, rnd);
      else if (s.fase === 'rodar' && s.participantes.every((x) => s.magos[x].pronto)) darVez(s, s.comecou, agora, rnd);
      saltarVezesSemUso(s, agora, rnd);
    }
  }
  // a party está em pausa à espera dele: a fase nova retoma com o seu tempo inteiro
  if (s.fase === 'fim') s.pausaRestante = null;
  else if (s.pausaRestante !== null && s.terminaEm !== e.terminaEm) s.pausaRestante = s.terminaEm - agora;
  return s;
}

export function reduzDuelo(e: EstadoDuelo, acao: AcaoDuelo, agora: number, rnd?: Rodar): EstadoDuelo {
  if (acao.tipo === 'ligados') {
    const s = { ...e, ligados: acao.ids };
    return s.fase === 'fim' ? s : pausaPorFalta(s, quantosLigados(e.participantes, acao.ids) < MIN_LIGADOS, agora);
  }
  if (e.fase === 'fim' || e.pausaRestante !== null) return e;
  if (acao.tipo === 'tick' && agora < e.terminaEm) return e;
  const s = structuredClone(e);
  if (acao.tipo === 'tick') tempoEsgotado(s, agora, rnd);
  else if (!agir(s, acao, agora, rnd)) return e;
  saltarVezesSemUso(s, agora, rnd);
  return s;
}
