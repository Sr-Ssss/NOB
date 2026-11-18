/**
 * Filtro de palavrões no texto dos jogadores (nomes, respostas, títulos, pistas…), PT + EN.
 * Conteúdo família (info/auditoria/2026-11-17.md → S5): a palavra inteira passa a "★★★".
 * Corre no host, por isso ninguém o contorna com um cliente modificado.
 * Não é perfeito (é uma lista); serve para travar o óbvio. Palavras com outro sentido
 * em pt-PT/pt-BR (puto, bicha, pila, cabra, pau, pinto…) ficam de fora de propósito.
 */

/** palavras inteiras (já sem acentos, minúsculas) */
const PALAVRAS = new Set([
  // PT
  'caralho', 'caralhos', 'krl', 'crl', 'porra', 'porras', 'merda', 'merdas', 'puta', 'putas', 'cabrao', 'cabroes', 'cona', 'conas', 'cu', 'cus', 'cuzao',
  'buceta', 'boceta', 'piroca', 'xoxota', 'xereca', 'punheta', 'viado', 'arrombado', 'arrombada', 'corno', 'vagabunda', 'vadia',
  'fdp', 'pqp', 'vsf', 'vtnc', 'tnc', 'foda', 'fodase', 'fodasse', 'foder', 'fodido', 'fodida', 'fode',
  // EN
  'fuck', 'shit', 'shitty', 'bullshit', 'shithead', 'bitch', 'cunt', 'dick', 'dicks', 'cock', 'cocks', 'pussy', 'asshole', 'bastard', 'slut', 'whore',
  'fag', 'faggot', 'nigger', 'nigga', 'retard', 'wtf', 'stfu', 'porn', 'porno', 'twat', 'wanker', 'bollocks', 'tits',
]);

/** começos de palavra (apanham as variações: fucking, caralhada, merdoso…) */
const RAIZES = ['fuck', 'caralh', 'merd', 'fodid', 'fodas', 'punhet', 'putari', 'bucet', 'bocet', 'xoxot', 'nigg', 'fagg', 'cunt', 'bitch', 'asshol', 'motherf', 'porn', 'whor', 'slut'];

/** sem acentos, minúsculas, "l33t" simples (0→o, 1→i, 3→e, 4→a, @→a, $→s) e letras repetidas encolhidas */
export function normalizarPalavra(p: string): string {
  return p
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/(.)\1{2,}/g, '$1$1');
}

function proibida(p: string): boolean {
  const n = normalizarPalavra(p);
  const curta = n.replace(/(.)\1+/g, '$1');
  return PALAVRAS.has(n) || PALAVRAS.has(curta) || RAIZES.some((r) => n.startsWith(r) || curta.startsWith(r));
}

/** troca cada palavrão por estrelas (o resto do texto fica igual) */
export function limparTexto(texto: string): string {
  return texto.replace(/[\p{L}\p{N}@$]+/gu, (p) => (proibida(p) ? '★'.repeat(Math.min(p.length, 6)) : p));
}

/** campos que não são texto dos jogadores (ids, tipos, emojis, endereços…) */
const IGNORAR = new Set(['tipo', 'id', 'ids', 'para', 'de', 'alvo', 'autor', 'jogador', 'por', 'bot', 'tag', 'r', 'url', 'lado', 'equipa', 'fraseId', 'chave', 'tecla', 'jogo', 'idioma']);

/** passa o filtro por todo o texto livre de uma ação (recursivo; números e chaves dos objetos ficam iguais) */
export function filtrarTextos<T>(x: T, chave = ''): T {
  if (typeof x === 'string') return (IGNORAR.has(chave) ? x : limparTexto(x)) as T;
  if (Array.isArray(x)) return x.map((y) => filtrarTextos(y, chave)) as T;
  if (x && typeof x === 'object') {
    if (IGNORAR.has(chave)) return x;
    return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, filtrarTextos(v, k)])) as T;
  }
  return x;
}
