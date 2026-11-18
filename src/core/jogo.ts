/**
 * Peças comuns às regras dos jogos (`src/jogos/<jogo>/regras.ts`). Funções puras, sem estado da sala.
 * Antes havia uma cópia de cada uma em quase todos os jogos (auditoria 17/11, §9).
 */

/** um lugar no pódio (empates partilham o lugar: 1, 1, 3…) */
export interface Podio {
  id: string;
  pontos: number;
  lugar: number;
}

/** pódio por pontos, do maior para o menor; quem empata fica com o mesmo lugar */
export function podio(participantes: string[], pontos: Record<string, number>): Podio[] {
  const lista = participantes.map((id) => ({ id, pontos: pontos[id] ?? 0 })).sort((x, y) => y.pontos - x.pontos);
  return lista.map((p) => ({ ...p, lugar: lista.findIndex((q) => q.pontos === p.pontos) + 1 }));
}

/** muda de fase com relógio de `segundos`; o "fim" não tem relógio */
export function irPara<E extends { fase: string; terminaEm: number }>(e: E, fase: E['fase'], segundos: number, agora: number): E {
  return { ...e, fase, terminaEm: fase === 'fim' ? 0 : agora + segundos * 1000 };
}

interface ComPausa {
  terminaEm: number;
  pausaRestante: number | null;
}

/**
 * Pausa o relógio enquanto `falta` (ex.: menos de 3 ligados) e retoma-o quando deixa de faltar.
 * `semRelogio`: uma fase sem relógio (terminaEm 0) continua sem relógio ao retomar.
 */
export function pausaPorFalta<E extends ComPausa>(e: E, falta: boolean, agora: number, semRelogio = false): E {
  if (falta && e.pausaRestante === null) return { ...e, pausaRestante: Math.max(0, e.terminaEm - agora) };
  if (!falta && e.pausaRestante !== null) return { ...e, terminaEm: semRelogio && !e.terminaEm ? 0 : agora + e.pausaRestante, pausaRestante: null };
  return e;
}

/** quantos de `ids` estão em `ligados` */
export const quantosLigados = (ids: string[], ligados: string[]): number => ids.filter((id) => ligados.includes(id)).length;

/** sem acentos, minúsculas, só letras/números separados por um espaço */
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
