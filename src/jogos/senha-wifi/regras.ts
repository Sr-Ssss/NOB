import { baralhar } from '../../core/ids';
import { normalizar, pausaPorFalta, podio, type Podio } from '../../core/jogo';

/** Senha do Wi-Fi: regras em info/jogos/encriptado.md */

export type Lado = 'b' | 'p'; // ○ Brancos / ● Pretos
export const LADOS: Lado[] = ['b', 'p'];
export const outro = (l: Lado): Lado => (l === 'b' ? 'p' : 'b');

export interface DefWifi {
  pistas: number; // s
  responder: number; // s
  equipas: 'sorteio' | 'mao';
  temas: string[]; // [] = todos
}

export const DEF_PADRAO_WIFI: DefWifi = { pistas: 90, responder: 60, equipas: 'sorteio', temas: [] };
export const OPCOES_WIFI = { pistas: [60, 90, 120], responder: [45, 60, 90] };
export const MIN_JOGADORES = 4;
export const MAX_JOGADORES = 16;
export const MIN_EQUIPA = 2; // abaixo disto (ligados) o jogo pausa
export const MAX_RONDAS = 8;
export const T_PALAVRAS = 45;
export const T_REVELAR = 8;
export const MAX_PISTA = 30;
export const PONTOS_VITORIA = 1000;
export const PONTOS_INTERCECAO = 200;
export const SEM_PISTA = ''; // pista de recurso ("🤖 sem pista")

export interface Palavra {
  id: string;
  pt: string;
  en: string;
  tags?: string[];
}

export type Codigo = [number, number, number];

export interface Resposta {
  nums: (number | null)[]; // 3 linhas, 1–4
  mudouPor: (string | null)[];
  confirmados: string[];
}

export interface Entrada {
  ronda: number;
  pistas: string[];
  codigo: Codigo;
}

export interface Revelacao {
  lado: Lado; // de quem eram as pistas
  pistas: string[];
  codigo: Codigo;
  intercecao: (number | null)[] | null; // null na ronda 1
  descodificacao: (number | null)[];
  intercetou: boolean; // 🎯 para a outra equipa
  errou: boolean; // ❌ para esta equipa
}

export type FaseWifi = 'equipas' | 'palavras' | 'pistas' | 'responder' | 'revelar' | 'fim';
export type Passo = 'intercetar' | 'descodificar';

export interface EstadoWifi {
  def: DefWifi;
  idioma: 'pt-BR' | 'en';
  fase: FaseWifi;
  ronda: number;
  terminaEm: number;
  pausaRestante: number | null;
  participantes: string[];
  audiencia: string[];
  ligados: string[];
  equipas: Record<Lado, string[]>;
  palavras: Record<Lado, Palavra[]>;
  trocadas: Record<Lado, boolean[]>;
  prontos: string[];
  codigos: Record<Lado, Codigo>;
  pistas: Record<Lado, string[] | null>;
  turno: Lado;
  passo: Passo;
  resposta: Resposta;
  intercecao: (number | null)[] | null; // guardada até à revelação
  revelacao: Revelacao | null;
  historico: Record<Lado, Entrada[]>;
  fichas: Record<Lado, { alvo: number; erro: number }>;
  vencedor: Lado | null;
  pontos: Record<string, number>;
  usadas: string[];
  pool: Palavra[];
  seed: number;
  /** Criptógrafo de cada equipa nesta ronda */
  criptos?: Partial<Record<Lado, string>>;
}

export type AcaoWifi =
  | { tipo: 'mover'; id: string; jogador: string; lado: Lado } // só o líder (a sala filtra)
  | { tipo: 'fechar_equipas'; id: string } // só o líder
  | { tipo: 'trocar'; id: string; i: number }
  | { tipo: 'prontas'; id: string }
  | { tipo: 'pistas'; id: string; pistas: string[] }
  | { tipo: 'resposta'; id: string; linha: number; num: number | null }
  | { tipo: 'confirmar'; id: string }
  | { tipo: 'ligados'; ids: string[] }
  | { tipo: 'tick' };

export const SO_LIDER_WIFI = ['mover', 'fechar_equipas'];
export const TIPOS_WIFI = ['mover', 'fechar_equipas', 'trocar', 'prontas', 'pistas', 'resposta', 'confirmar'];

const vazia = (): Resposta => ({ nums: [null, null, null], mudouPor: [null, null, null], confirmados: [] });

/** sem acentos, minúsculas, só letras/números */
export { normalizar };

export function textoPalavra(p: Palavra, idioma: string): string {
  return idioma === 'en' ? p.en : p.pt;
}

/** a pista é a própria palavra secreta ou contém-na (ex.: "pipocas" contém "pipoca") */
export function pistaBloqueada(pista: string, palavras: Palavra[], idioma: string): Palavra | null {
  const p = normalizar(pista).replace(/ /g, '');
  if (!p) return null;
  return palavras.find((w) => {
    const n = normalizar(textoPalavra(w, idioma)).replace(/ /g, '');
    return !!n && p.includes(n);
  }) ?? null;
}

export function novoCodigo(seed: number): Codigo {
  return baralhar([1, 2, 3, 4], seed).slice(0, 3) as Codigo;
}

/** sorteio: metades o mais iguais possível (ímpar = Brancos com mais um) */
export function sortearEquipas(ids: string[], seed: number): Record<Lado, string[]> {
  const p = baralhar(ids, seed);
  const m = Math.ceil(p.length / 2);
  return { b: p.slice(0, m), p: p.slice(m) };
}

export function ladoDe(e: Pick<EstadoWifi, 'equipas'>, id: string): Lado | null {
  return e.equipas.b.includes(id) ? 'b' : e.equipas.p.includes(id) ? 'p' : null;
}

/** o Criptógrafo roda pela equipa a cada ronda (fixado no início da ronda em `criptos`, saltando quem está desligado) */
export function criptografo(e: Pick<EstadoWifi, 'equipas' | 'ronda'> & { criptos?: Partial<Record<Lado, string>> }, l: Lado): string {
  const fixo = e.criptos?.[l];
  if (fixo && e.equipas[l].includes(fixo)) return fixo;
  const eq = e.equipas[l];
  return eq[(e.ronda - 1) % eq.length] ?? '';
}

/** na rotação, o primeiro ligado a partir da vez desta ronda */
function escolherCripto(e: EstadoWifi, l: Lado, ronda: number, sem?: string): string {
  const eq = e.equipas[l].filter((id) => id !== sem);
  if (!eq.length) return '';
  const base = (ronda - 1) % eq.length;
  for (let k = 0; k < eq.length; k++) {
    const id = eq[(base + k) % eq.length];
    if (e.ligados.includes(id)) return id;
  }
  return eq[base];
}

const ligadosDe = (e: EstadoWifi, ids: string[]) => ids.filter((id) => e.ligados.includes(id));

/** quem mexe na resposta partilhada agora: interceção = a outra equipa toda; descodificar = a equipa sem o Criptógrafo */
export function respondentes(e: EstadoWifi): string[] {
  if (e.fase !== 'responder') return [];
  if (e.passo === 'intercetar') return e.equipas[outro(e.turno)];
  const c = criptografo(e, e.turno);
  return e.equipas[e.turno].filter((id) => id !== c);
}

/** fecha com metade da equipa (ligados) a confirmar */
export function precisaConfirmar(e: EstadoWifi): number {
  return Math.max(1, Math.ceil(ligadosDe(e, respondentes(e)).length / 2));
}

function tirar(e: EstadoWifi, k: number, seed: number): { tiradas: Palavra[]; usadas: string[] } {
  const temas = e.def.temas;
  let pool = e.pool;
  if (temas.length) {
    const f = pool.filter((w) => w.tags?.some((t) => temas.includes(t)) ?? true);
    if (f.length >= 8) pool = f;
  }
  const emJogo = new Set([...e.palavras.b, ...e.palavras.p].map((w) => w.id));
  let livres = pool.filter((w) => !e.usadas.includes(w.id) && !emJogo.has(w.id));
  if (livres.length < k) livres = pool.filter((w) => !emJogo.has(w.id));
  const tiradas = baralhar(livres, seed).slice(0, k);
  return { tiradas, usadas: [...e.usadas, ...tiradas.map((w) => w.id)] };
}

function irPara(e: EstadoWifi, fase: FaseWifi, segundos: number, agora: number): EstadoWifi {
  return { ...e, fase, terminaEm: segundos > 0 ? agora + segundos * 1000 : 0 };
}

function comecarPalavras(e: EstadoWifi, agora: number): EstadoWifi {
  const a = tirar(e, 4, e.seed + 11);
  const s1 = { ...e, palavras: { b: a.tiradas, p: [] as Palavra[] }, usadas: a.usadas };
  const b = tirar(s1, 4, e.seed + 23);
  return irPara({ ...s1, palavras: { b: a.tiradas, p: b.tiradas }, usadas: b.usadas, trocadas: { b: [false, false, false, false], p: [false, false, false, false] }, prontos: [] }, 'palavras', T_PALAVRAS, agora);
}

function comecarRonda(e: EstadoWifi, ronda: number, agora: number): EstadoWifi {
  const seed = e.seed + ronda * 101;
  return irPara(
    { ...e, ronda, criptos: { b: escolherCripto(e, 'b', ronda), p: escolherCripto(e, 'p', ronda) }, codigos: { b: novoCodigo(seed), p: novoCodigo(seed + 7) }, pistas: { b: null, p: null }, turno: 'b', passo: 'descodificar', resposta: vazia(), intercecao: null, revelacao: null },
    'pistas',
    e.def.pistas,
    agora,
  );
}

function irResponder(e: EstadoWifi, turno: Lado, agora: number): EstadoWifi {
  return irPara({ ...e, turno, passo: e.ronda >= 2 ? 'intercetar' : 'descodificar', resposta: vazia(), intercecao: null }, 'responder', e.def.responder, agora);
}

const certo = (r: (number | null)[] | null, c: Codigo) => !!r && r.length === 3 && r.every((n, i) => n === c[i]);

function revelar(e: EstadoWifi, agora: number): EstadoWifi {
  const l = e.turno;
  const o = outro(l);
  const codigo = e.codigos[l];
  const pistas = e.pistas[l] ?? [SEM_PISTA, SEM_PISTA, SEM_PISTA];
  const desc = e.resposta.nums;
  const intercetou = e.ronda >= 2 && certo(e.intercecao, codigo);
  const errou = !certo(desc, codigo);
  const fichas = {
    ...e.fichas,
    [l]: { ...e.fichas[l], erro: e.fichas[l].erro + (errou ? 1 : 0) },
    [o]: { ...e.fichas[o], alvo: e.fichas[o].alvo + (intercetou ? 1 : 0) },
  } as EstadoWifi['fichas'];
  const pontos = { ...e.pontos };
  if (intercetou) for (const id of e.equipas[o]) pontos[id] = (pontos[id] ?? 0) + PONTOS_INTERCECAO;
  const revelacao: Revelacao = { lado: l, pistas, codigo, intercecao: e.ronda >= 2 ? e.intercecao : null, descodificacao: desc, intercetou, errou };
  const historico = { ...e.historico, [l]: [...e.historico[l], { ronda: e.ronda, pistas, codigo }] } as EstadoWifi['historico'];
  return irPara({ ...e, fichas, pontos, revelacao, historico }, 'revelar', T_REVELAR, agora);
}

/** quem ganha no fim da ronda (null = continua) */
export function decidir(f: EstadoWifi['fichas'], ronda: number): Lado | null | 'empate' {
  const ganha = (l: Lado) => f[l].alvo >= 2 || f[outro(l)].erro >= 2;
  const gb = ganha('b');
  const gp = ganha('p');
  if (gb !== gp) return gb ? 'b' : 'p';
  if (!gb && ronda < MAX_RONDAS) return null;
  // as duas na mesma ronda, ou limite de rondas: 🎯 − ❌; empate = mais uma ronda
  const sb = f.b.alvo - f.b.erro;
  const sp = f.p.alvo - f.p.erro;
  return sb === sp ? 'empate' : sb > sp ? 'b' : 'p';
}

function fimDaRonda(e: EstadoWifi, agora: number): EstadoWifi {
  const d = decidir(e.fichas, e.ronda);
  if (d === 'b' || d === 'p') {
    const pontos = { ...e.pontos };
    for (const id of e.equipas[d]) pontos[id] = (pontos[id] ?? 0) + PONTOS_VITORIA;
    return irPara({ ...e, vencedor: d, pontos }, 'fim', 0, agora);
  }
  return comecarRonda(e, e.ronda + 1, agora);
}

function fecharResposta(e: EstadoWifi, agora: number): EstadoWifi {
  if (e.passo === 'intercetar') return irPara({ ...e, intercecao: e.resposta.nums, passo: 'descodificar', resposta: vazia() }, 'responder', e.def.responder, agora);
  return revelar(e, agora);
}

function avancar(e: EstadoWifi, agora: number): EstadoWifi {
  switch (e.fase) {
    case 'palavras':
      return comecarRonda(e, 1, agora);
    case 'pistas': {
      // pistas de recurso para quem não enviou a tempo
      const pistas = { b: e.pistas.b ?? [SEM_PISTA, SEM_PISTA, SEM_PISTA], p: e.pistas.p ?? [SEM_PISTA, SEM_PISTA, SEM_PISTA] };
      return irResponder({ ...e, pistas }, 'b', agora);
    }
    case 'responder':
      return fecharResposta(e, agora);
    case 'revelar':
      return e.turno === 'b' ? irResponder(e, 'p', agora) : fimDaRonda(e, agora);
    default:
      return e;
  }
}

export function novoWifi(ids: string[], def: Partial<DefWifi>, agora: number, pool: Palavra[], idioma: 'pt-BR' | 'en' = 'pt-BR', usadas: string[] = []): EstadoWifi {
  const participantes = ids.slice(0, MAX_JOGADORES);
  const d = { ...DEF_PADRAO_WIFI, ...def };
  const seed = agora >>> 0;
  const base: EstadoWifi = {
    def: d,
    idioma,
    fase: 'equipas',
    ronda: 0,
    terminaEm: 0,
    pausaRestante: null,
    participantes,
    audiencia: ids.slice(MAX_JOGADORES),
    ligados: [...ids],
    equipas: d.equipas === 'sorteio' ? sortearEquipas(participantes, seed) : { b: participantes.filter((_, i) => i % 2 === 0), p: participantes.filter((_, i) => i % 2 === 1) },
    palavras: { b: [], p: [] },
    trocadas: { b: [], p: [] },
    prontos: [],
    codigos: { b: [1, 2, 3], p: [1, 2, 3] },
    pistas: { b: null, p: null },
    turno: 'b',
    passo: 'descodificar',
    resposta: vazia(),
    intercecao: null,
    revelacao: null,
    historico: { b: [], p: [] },
    fichas: { b: { alvo: 0, erro: 0 }, p: { alvo: 0, erro: 0 } },
    vencedor: null,
    pontos: Object.fromEntries(participantes.map((id) => [id, 0])),
    usadas,
    pool,
    seed,
  };
  return d.equipas === 'sorteio' ? comecarPalavras(base, agora) : base;
}

export function pausadoWifi(e: EstadoWifi): boolean {
  return e.pausaRestante !== null;
}

/** pausa se uma equipa ficar com menos de 2 ligados */
function faltaGente(e: EstadoWifi): boolean {
  if (e.fase === 'equipas' || e.fase === 'fim') return false;
  return LADOS.some((l) => ligadosDe(e, e.equipas[l]).length < MIN_EQUIPA);
}

function prontasFeitas(e: EstadoWifi): boolean {
  return LADOS.every((l) => {
    const lig = ligadosDe(e, e.equipas[l]);
    return e.prontos.filter((id) => lig.includes(id)).length >= Math.max(1, Math.ceil(lig.length / 2));
  });
}

function fechouResposta(e: EstadoWifi): boolean {
  const r = respondentes(e);
  return e.resposta.nums.every((n) => n !== null) && e.resposta.confirmados.filter((id) => r.includes(id) && e.ligados.includes(id)).length >= precisaConfirmar(e);
}

export function reduzWifi(e: EstadoWifi, acao: AcaoWifi, agora: number): EstadoWifi {
  switch (acao.tipo) {
    case 'ligados': {
      const s: EstadoWifi = { ...e, ligados: acao.ids };
      return pausaPorFalta(s, faltaGente(s), agora, true);
    }
    case 'mover': {
      if (e.fase !== 'equipas' || !e.participantes.includes(acao.jogador)) return e;
      const tira = (l: Lado) => e.equipas[l].filter((id) => id !== acao.jogador);
      const equipas = { b: tira('b'), p: tira('p') };
      equipas[acao.lado] = [...equipas[acao.lado], acao.jogador];
      return { ...e, equipas };
    }
    case 'fechar_equipas':
      if (e.fase !== 'equipas' || LADOS.some((l) => e.equipas[l].length < MIN_EQUIPA)) return e;
      return comecarPalavras(e, agora);
    case 'trocar': {
      const l = ladoDe(e, acao.id);
      if (e.fase !== 'palavras' || pausadoWifi(e) || !l || acao.i < 0 || acao.i > 3 || e.trocadas[l][acao.i] || e.prontos.includes(acao.id)) return e;
      const { tiradas, usadas } = tirar(e, 1, e.seed + agora + acao.i);
      if (!tiradas.length) return e;
      const palavras = { ...e.palavras, [l]: e.palavras[l].map((w, i) => (i === acao.i ? tiradas[0] : w)) } as EstadoWifi['palavras'];
      const trocadas = { ...e.trocadas, [l]: e.trocadas[l].map((t, i) => t || i === acao.i) } as EstadoWifi['trocadas'];
      return { ...e, palavras, trocadas, usadas };
    }
    case 'prontas': {
      if (e.fase !== 'palavras' || pausadoWifi(e) || !ladoDe(e, acao.id) || e.prontos.includes(acao.id)) return e;
      const s = { ...e, prontos: [...e.prontos, acao.id] };
      return prontasFeitas(s) ? avancar(s, agora) : s;
    }
    case 'pistas': {
      const l = ladoDe(e, acao.id);
      if (e.fase !== 'pistas' || pausadoWifi(e) || !l || criptografo(e, l) !== acao.id || e.pistas[l]) return e;
      const p = acao.pistas.map((x) => x.trim().slice(0, MAX_PISTA));
      if (p.length !== 3 || p.some((x) => !x || pistaBloqueada(x, e.palavras[l], e.idioma))) return e;
      const s = { ...e, pistas: { ...e.pistas, [l]: p } };
      return s.pistas.b && s.pistas.p ? avancar(s, agora) : s;
    }
    case 'resposta': {
      if (e.fase !== 'responder' || pausadoWifi(e) || !respondentes(e).includes(acao.id) || acao.linha < 0 || acao.linha > 2) return e;
      const n = acao.num;
      if (n !== null && (!Number.isInteger(n) || n < 1 || n > 4)) return e;
      if (n !== null && e.resposta.nums.some((x, i) => i !== acao.linha && x === n)) return e; // números repetidos bloqueados
      if (e.resposta.nums[acao.linha] === n) return e;
      const nums = e.resposta.nums.map((x, i) => (i === acao.linha ? n : x));
      const mudouPor = e.resposta.mudouPor.map((x, i) => (i === acao.linha ? acao.id : x));
      // alguém mudou: as confirmações já dadas apagam-se
      return { ...e, resposta: { nums, mudouPor, confirmados: [] } };
    }
    case 'confirmar': {
      if (e.fase !== 'responder' || pausadoWifi(e) || !respondentes(e).includes(acao.id) || e.resposta.confirmados.includes(acao.id)) return e;
      if (e.resposta.nums.some((n) => n === null)) return e;
      const s = { ...e, resposta: { ...e.resposta, confirmados: [...e.resposta.confirmados, acao.id] } };
      return fechouResposta(s) ? avancar(s, agora) : s;
    }
    case 'tick':
      if (pausadoWifi(e) || e.fase === 'fim' || e.fase === 'equipas') return e;
      return agora >= e.terminaEm ? avancar(e, agora) : e;
    default:
      return e;
  }
}

export type PodioWifi = Podio;

export function podioWifi(e: Pick<EstadoWifi, 'participantes' | 'pontos'>): PodioWifi[] {
  return podio(e.participantes, e.pontos);
}

/** o que só a equipa vê (canal privado, cifrado) */
export interface PrivadoWifi {
  lado: Lado;
  palavras: Palavra[];
  trocadas: boolean[];
  codigo?: Codigo; // só o Criptógrafo, na fase de pistas
}

export interface VistaWifi {
  def: DefWifi;
  fase: FaseWifi;
  ronda: number;
  terminaEm: number;
  restante: number | null;
  participantes: string[];
  audiencia: string[];
  equipas: Record<Lado, string[]>;
  criptografos: Record<Lado, string>;
  prontos: string[];
  enviaram: Lado[];
  pistas: Record<Lado, string[] | null>; // só depois de as duas equipas enviarem
  turno: Lado;
  passo: Passo;
  resposta: Resposta;
  respondentes: string[];
  precisa: number;
  revelacao: Revelacao | null;
  historico: Record<Lado, Entrada[]>;
  fichas: Record<Lado, { alvo: number; erro: number }>;
  vencedor: Lado | null;
  /** no fim, as palavras de todos ficam à vista */
  palavrasFim: Record<Lado, Palavra[]> | null;
  pontos: Record<string, number>;
  podio: PodioWifi[];
  usadas: string[];
}

/** canal privado (cifrado só para este jogador): as palavras da equipa e, ao Criptógrafo, o código */
export function privadoWifi(e: EstadoWifi, id: string): PrivadoWifi | null {
  const l = ladoDe(e, id);
  if (!l) return null;
  const cripto = e.ronda ? criptografo(e, l) : '';
  return { lado: l, palavras: e.palavras[l], trocadas: e.trocadas[l], codigo: e.fase === 'pistas' && cripto === id ? e.codigos[l] : undefined };
}

export function vistaWifi(e: EstadoWifi): VistaWifi {
  const criptografos = { b: e.ronda ? criptografo(e, 'b') : '', p: e.ronda ? criptografo(e, 'p') : '' };
  const abertas = e.fase !== 'pistas' && e.fase !== 'palavras' && e.fase !== 'equipas';
  return {
    def: e.def,
    fase: e.fase,
    ronda: e.ronda,
    terminaEm: e.terminaEm,
    restante: e.pausaRestante,
    participantes: e.participantes,
    audiencia: e.audiencia,
    equipas: e.equipas,
    criptografos,
    prontos: e.prontos,
    enviaram: LADOS.filter((l) => !!e.pistas[l]),
    pistas: abertas ? e.pistas : { b: null, p: null },
    turno: e.turno,
    passo: e.passo,
    resposta: e.resposta,
    respondentes: respondentes(e),
    precisa: e.fase === 'responder' ? precisaConfirmar(e) : 0,
    revelacao: e.fase === 'revelar' ? e.revelacao : null,
    historico: e.historico,
    fichas: e.fichas,
    vencedor: e.vencedor,
    palavrasFim: e.fase === 'fim' ? e.palavras : null,
    pontos: e.pontos,
    podio: podioWifi(e),
    usadas: e.usadas,
  };
}

/* ---------- saídas a meio (src/core/saidas.ts) ---------- */

/** o Criptógrafo que ainda não deu as pistas faz falta: sem ele a equipa não joga a ronda */
export const importanteWifi = (e: EstadoWifi, id: string): boolean => e.fase === 'pistas' && LADOS.some((l) => criptografo(e, l) === id && !e.pistas[l]);

/** o líder decidiu seguir sem ele: sai da equipa; se era o Criptógrafo, passa ao seguinte ligado */
export function sairWifi(e: EstadoWifi, id: string): EstadoWifi {
  const l = ladoDe(e, id);
  if (!l || e.fase === 'fim') return e;
  const s: EstadoWifi = {
    ...e,
    equipas: { ...e.equipas, [l]: e.equipas[l].filter((x) => x !== id) },
    prontos: e.prontos.filter((x) => x !== id),
    resposta: { ...e.resposta, confirmados: e.resposta.confirmados.filter((x) => x !== id) },
  };
  if (criptografo(e, l) !== id) return s;
  return { ...s, criptos: { ...e.criptos, [l]: escolherCripto(e, l, e.ronda, id) } };
}
