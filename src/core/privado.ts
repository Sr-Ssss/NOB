import { privadoSala, type EstadoSala } from './sala';

/**
 * Canal privado (papéis secretos, cartas, palavras da equipa): o que cada aparelho recebe, cifrado só para ele
 * (src/core/protocolo.ts). Um aparelho recebe o do seu jogador e, se for o líder, o dos bots.
 * `aparelhos`: os que o host já conhece (chave fixada). Devolve aparelho → (id do jogador → dados).
 */
export function privadosPorAparelho(s: EstadoSala, aparelhos: string[]): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const ap of aparelhos) {
    const id = s.aliases[ap] ?? ap;
    if (!s.jogadores.some((j) => j.id === id && !j.bot)) continue;
    // expulso (src/core/membros.ts): já não recebe nada
    if (s.expulsos?.includes(ap) || s.expulsos?.includes(id)) continue;
    const d: Record<string, unknown> = {};
    const p = privadoSala(s, id);
    if (p !== null && p !== undefined) d[id] = p;
    if (id === s.vipId) {
      for (const b of s.jogadores) {
        if (!b.bot) continue;
        const pb = privadoSala(s, b.id);
        if (pb !== null && pb !== undefined) d[b.id] = pb;
      }
    }
    out[ap] = d;
  }
  return out;
}
