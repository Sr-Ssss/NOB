import type { EstadoSala } from './sala';
import { TOLERANCIA, jogoDe, seguirSem } from './saidas';

/**
 * Quem pode estar na party (auditoria T8, 17/11). Só o líder decide:
 * - **fechar a party**: quem ainda não é membro fica à porta (`barrados`, para o telemóvel dele mostrar o aviso);
 *   quem já é membro e volta (o mesmo id, ou pelo nome se estava desligado) entra na mesma;
 * - **expulsar**: o jogador sai e fica bloqueado nesta party (`expulsos`: o id dele e os aparelhos que eram ele,
 *   pelos `aliases`). O host também deixa de abrir as ações desses aparelhos (`ProtocoloHost.barrar`, pelo id
 *   e pela chave fixada), por isso nem com outro nome volta a entrar a partir do mesmo aparelho.
 *   Limite: quem apaga os dados do browser é um aparelho novo (id e chave novos); para isso há o "fechar party".
 * Tudo puro: `reduzSala` chama estas funções nos casos `entrar`, `fechar` e `expulsar`.
 */

/** quantos aparelhos barrados à porta a vista guarda (os mais recentes): um varrimento não incha o estado */
export const MAX_BARRADOS = 20;

export function expulso(s: Pick<EstadoSala, 'expulsos'>, id: string): boolean {
  return !!s.expulsos?.includes(id);
}

/**
 * Pode entrar? `aparelho` = o id de quem envia; `jogador` = o id dele depois dos aliases.
 * `voltaPeloNome` = é um membro desligado que volta noutro aparelho (calculado no `entrar`).
 */
export function porta(s: EstadoSala, aparelho: string, jogador: string, voltaPeloNome: boolean): 'ok' | 'expulso' | 'fechada' {
  if (expulso(s, aparelho) || expulso(s, jogador)) return 'expulso';
  if (!s.fechada || voltaPeloNome || s.jogadores.some((j) => j.id === jogador)) return 'ok';
  return 'fechada';
}

/** fica à porta (a vista diz-lhe que a party está fechada) */
export function barrar(s: EstadoSala, aparelho: string): EstadoSala {
  if (s.barrados?.includes(aparelho)) return s;
  return { ...s, barrados: [...(s.barrados ?? []), aparelho].slice(-MAX_BARRADOS) };
}

/** abrir a party esquece quem ficou à porta (pode tentar outra vez) */
export function fecharParty(s: EstadoSala, fechada: boolean): EstadoSala {
  if (!!s.fechada === fechada) return s;
  return { ...s, fechada, barrados: [] };
}

/**
 * Expulsa `alvo` (não pode ser o líder nem um bot: os bots têm o "remover").
 * - fora de um jogo: sai da lista;
 * - se joga o jogo em curso: é uma saída (`seguirSem`, como se o líder escolhesse "seguir sem ele");
 *   se o jogo não dá para seguir sem ele (ex.: o Rei), fica como quem saiu e o líder põe um espectador
 *   no lugar ou acaba o jogo (src/ui/saidas.tsx);
 * - se o jogo ainda o mostra (joga ou assiste), fica na lista como desligado, para os ecrãs não perderem o nome;
 *   o `tick` tira-o quando o jogo acabar (TEMPO_DESLIGADO).
 */
export function expulsar(s: EstadoSala, alvo: string, agora: number): EstadoSala {
  const p = s.jogadores.find((j) => j.id === alvo);
  if (!p || p.bot || alvo === s.vipId) return s;
  const aparelhos = Object.keys(s.aliases).filter((ap) => s.aliases[ap] === alvo);
  const fora = new Set([alvo, ...aparelhos]);
  let r: EstadoSala = {
    ...s,
    expulsos: [...new Set([...(s.expulsos ?? []), ...fora])],
    barrados: (s.barrados ?? []).filter((x) => !fora.has(x)),
  };
  const j = jogoDe(r);
  const joga = !!j && j.g.fase !== 'fim' && j.g.participantes.includes(alvo);
  const aparece = !!j && (j.g.participantes.includes(alvo) || j.g.audiencia.includes(alvo));
  if (joga) r = seguirSem(r, alvo, agora);
  if (aparece) {
    // desligado "há mais do que a tolerância": se o jogo precisa dele, aparece já ao líder como quem saiu
    const desde = agora - TOLERANCIA;
    r = { ...r, jogadores: r.jogadores.map((x) => (x.id === alvo ? { ...x, ligado: false, pronto: false, desligadoEm: Math.min(x.desligadoEm ?? desde, desde) } : x)) };
  } else {
    r = { ...r, jogadores: r.jogadores.filter((x) => x.id !== alvo) };
  }
  return r;
}
