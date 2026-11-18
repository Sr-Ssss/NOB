import { describe, expect, it } from 'vitest';
import { gravarRascunho, lerRascunho, limparRascunhos } from './rascunho';

function memoria() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

describe('rascunhos (sobrevivem a remontar o ecrã)', () => {
  it('guarda e lê por grupo e campo', () => {
    const a = memoria();
    expect(lerRascunho(a, 'ABCDE:5050:1', 'lacuna')).toBeUndefined();
    gravarRascunho(a, 'ABCDE:5050:1', 'lacuna', 'olá');
    gravarRascunho(a, 'ABCDE:5050:1', 'trocas', 1);
    gravarRascunho(a, 'ABCDE:5050:1', 'frase', { id: 'f1', tema: 'x', texto: 'a ___ b' });
    expect(lerRascunho(a, 'ABCDE:5050:1', 'lacuna')).toBe('olá');
    expect(lerRascunho(a, 'ABCDE:5050:1', 'trocas')).toBe(1);
    expect(lerRascunho(a, 'ABCDE:5050:1', 'frase')).toEqual({ id: 'f1', tema: 'x', texto: 'a ___ b' });
    // outra ronda / outra party não vê
    expect(lerRascunho(a, 'ABCDE:5050:2', 'lacuna')).toBeUndefined();
    expect(lerRascunho(a, 'ZZZZZ:5050:1', 'lacuna')).toBeUndefined();
  });

  it('fica com poucos grupos (os mais recentes)', () => {
    const a = memoria();
    for (let i = 1; i <= 5; i++) gravarRascunho(a, 'g' + i, 'x', i);
    expect(lerRascunho(a, 'g1', 'x')).toBeUndefined();
    expect(lerRascunho(a, 'g5', 'x')).toBe(5);
    expect(lerRascunho(a, 'g4', 'x')).toBe(4);
  });

  it('limpar: só fica o grupo ativo; null apaga tudo (o "jogar outra vez" começa limpo)', () => {
    const a = memoria();
    gravarRascunho(a, 'g1', 'x', 1);
    gravarRascunho(a, 'g2', 'x', 2);
    limparRascunhos(a, 'g2');
    expect(lerRascunho(a, 'g1', 'x')).toBeUndefined();
    expect(lerRascunho(a, 'g2', 'x')).toBe(2);
    limparRascunhos(a, null);
    expect(lerRascunho(a, 'g2', 'x')).toBeUndefined();
  });

  it('armazenamento estragado ou cheio não rebenta', () => {
    const a = memoria();
    a.m.set('nob.rascunho', '{lixo');
    expect(lerRascunho(a, 'g', 'x')).toBeUndefined();
    const cheio = { getItem: () => null, setItem: () => { throw new Error('cheio'); } };
    expect(() => gravarRascunho(cheio, 'g', 'x', 1)).not.toThrow();
    expect(() => limparRascunhos(cheio, null)).not.toThrow();
  });
});
