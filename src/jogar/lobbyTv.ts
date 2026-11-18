import { CATALOGO, motivo, type InfoJogo } from '../core/jogos';
import { COM_ECRAS, type JogoComEcras } from '../jogos/ecras';

/** um jogo que o líder pode escolher no telemóvel quando há TV: a ficha do catálogo + os seus ecrãs (opções) */
export type JogoLobby = { info: InfoJogo; reg: JogoComEcras };

/** os jogos do catálogo que já têm ecrãs, pela ordem do catálogo (a mesma da TV) */
export function jogosDoLobby(): JogoLobby[] {
  return CATALOGO.flatMap((info) => {
    const reg = COM_ECRAS.find((x) => x.id === info.id);
    return reg ? [{ info, reg }] : [];
  });
}

/**
 * O jogo cujas opções aparecem (auditoria E2: só um de cada vez).
 * `id` = o que o líder escolheu; sem escolha (ou escolha que já não existe), o 1.º que dá para jogar com `n` pessoas.
 */
export function jogoEscolhido(lista: JogoLobby[], id: string | null, n: number): JogoLobby | undefined {
  return lista.find((x) => x.info.id === id) ?? lista.find((x) => !motivo(x.info, n)) ?? lista[0];
}
