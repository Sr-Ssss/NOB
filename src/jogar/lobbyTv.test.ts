import { describe, expect, it } from 'vitest';
import { CATALOGO } from '../core/jogos';
import { jogoEscolhido, jogosDoLobby } from './lobbyTv';

describe('lobby com TV: opções de um jogo só (E2)', () => {
  const lista = jogosDoLobby();

  it('só jogos com ecrãs, pela ordem do catálogo', () => {
    expect(lista.length).toBeGreaterThan(0);
    const ordem = CATALOGO.map((j) => j.id).filter((id) => lista.some((x) => x.info.id === id));
    expect(lista.map((x) => x.info.id)).toEqual(ordem);
    for (const x of lista) expect(x.reg.id).toBe(x.info.id);
  });

  it('respeita a escolha do líder', () => {
    const ultimo = lista[lista.length - 1].info.id;
    expect(jogoEscolhido(lista, ultimo, 3)?.info.id).toBe(ultimo);
  });

  it('sem escolha: o 1.º que dá para jogar com estas pessoas', () => {
    const j = jogoEscolhido(lista, null, 3)!;
    expect(j.info.min).toBeLessThanOrEqual(3);
    expect(jogoEscolhido(lista, 'nao-existe', 3)?.info.id).toBe(j.info.id);
  });

  it('ninguém ligado: mostra mesmo assim o 1.º', () => {
    expect(jogoEscolhido(lista, null, 0)?.info.id).toBe(lista[0].info.id);
  });
});
