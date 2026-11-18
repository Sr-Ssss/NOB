import type { EstadoSala } from './sala';
import { jogoEmCurso, type ChaveJogo, type Ganchos, type JogoComum } from './registo';

/**
 * Quem sai e quem entra a meio de um jogo (pedido do utilizador, 17/11):
 * - desligar não é sair: há uma tolerância (`TOLERANCIA`) para quem bloqueia o ecrã ou perde a rede;
 * - depois disso, se a pessoa faz falta ao jogo ("importante": papel secreto, Criptógrafo da vez,
 *   apresentador da vez…), a party entra em pausa e o líder decide: esperar, seguir sem ela,
 *   pôr um espectador no lugar dela, ou acabar o jogo;
 * - se ela voltar, o jogo continua sozinho;
 * - quem não faz falta não pausa nada, mas o líder pode na mesma pôr um espectador no lugar dela.
 * Cada jogo diz quem é importante e o que é "seguir sem" (`ganchos` no registo, src/core/registo.ts).
 * Jogos sem ganchos nunca pausam.
 */

export const TOLERANCIA = 10_000;

export type { ChaveJogo, JogoComum };

/** o jogo em curso: onde vive na sala, o estado e os ganchos de saída */
export function jogoDe(s: EstadoSala): { chave: ChaveJogo; g: JogoComum; gancho: Ganchos<JogoComum> } | null {
  const a = jogoEmCurso(s);
  return a ? { chave: a.j.chave as ChaveJogo, g: a.g, gancho: a.j.ganchos ?? {} } : null;
}

/** quem saiu (desligado há mais do que a tolerância) e ainda conta para o jogo */
export interface Ausente {
  id: string;
  desde: number;
  /** a party está em pausa à espera dele */
  importante: boolean;
  /** o líder pode escolher "seguir sem ele" */
  podeSeguir: boolean;
}

export function calcularAusentes(s: EstadoSala, agora: number): Ausente[] {
  const j = jogoDe(s);
  if (!j || j.g.fase === 'fim') return [];
  const { gancho, g } = j;
  const dispensados = s.dispensados ?? [];
  return s.jogadores
    .filter((p) => !p.bot && !p.ligado && p.desligadoEm !== null && agora - p.desligadoEm >= TOLERANCIA)
    .filter((p) => j.g.participantes.includes(p.id) && !dispensados.includes(p.id) && !gancho.fora?.(g, p.id))
    .map((p) => ({ id: p.id, desde: p.desligadoEm!, importante: !!gancho.importante?.(g, p.id), podeSeguir: gancho.podeSeguir?.(g, p.id) ?? true }));
}

/** quem pode entrar no lugar de alguém: ligado, não é bot e não joga este jogo */
export function espectadores(s: EstadoSala): string[] {
  const j = jogoDe(s);
  if (!j) return [];
  return s.jogadores.filter((p) => p.ligado && !p.bot && !j.g.participantes.includes(p.id)).map((p) => p.id);
}

/** o líder decidiu seguir sem ele (o jogo trata o resto) */
export function seguirSem(s: EstadoSala, id: string, agora: number): EstadoSala {
  const j = jogoDe(s);
  if (!j) return s;
  const { gancho } = j;
  if (gancho.podeSeguir && !gancho.podeSeguir(j.g, id)) return s;
  const g = gancho.seguirSem ? gancho.seguirSem(j.g, id, agora) : j.g;
  return { ...s, [j.chave]: g, dispensados: [...new Set([...(s.dispensados ?? []), id])] };
}

/**
 * `por` (espectador) fica no lugar de `alvo` (quem saiu): herda tudo o que era dele neste jogo
 * (papel, cartas, equipa, pontos). Os ids são aleatórios de 128 bits (ou `bot-…`), por isso trocá-los
 * no estado do jogo, como texto entre aspas, é seguro.
 */
export function trocarJogador(s: EstadoSala, alvo: string, por: string): EstadoSala {
  const j = jogoDe(s);
  if (!j || !j.g.participantes.includes(alvo) || j.g.participantes.includes(por) || !espectadores(s).includes(por)) return s;
  const limpo = { ...j.g, audiencia: j.g.audiencia.filter((x) => x !== por) };
  const txt = JSON.stringify(limpo).split(JSON.stringify(alvo)).join(JSON.stringify(por));
  return { ...s, [j.chave]: JSON.parse(txt), dispensados: (s.dispensados ?? []).filter((x) => x !== alvo) };
}
