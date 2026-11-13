import { describe, expect, it } from 'vitest';
import { conteudoDe, ficheirosExternos, type Item } from './conteudo';
import reserva5050 from '../jogos/5050/conteudo.json';
import { TEMAS } from './i18n';

function validar(nome: string, itens: Item[]) {
  expect(Array.isArray(itens), `${nome}: tem de ser uma lista`).toBe(true);
  const ids = new Set<string>();
  for (const i of itens) {
    expect(typeof i.id === 'string' && i.id.length > 0, `${nome}: id vazio`).toBe(true);
    expect(ids.has(i.id), `${nome}: id repetido ${i.id}`).toBe(false);
    ids.add(i.id);
    expect(i.pt?.trim(), `${nome}/${i.id}: pt vazio`).toBeTruthy();
    expect(i.en?.trim(), `${nome}/${i.id}: en vazio`).toBeTruthy();
    expect(Array.isArray(i.tags), `${nome}/${i.id}: tags tem de ser lista`).toBe(true);
    if (nome === '5050') {
      expect(i.pt, `${nome}/${i.id}: falta ___ em pt`).toContain('___');
      expect(i.en, `${nome}/${i.id}: falta ___ em en`).toContain('___');
      expect(i.tags[0] in TEMAS, `${nome}/${i.id}: tema desconhecido ${i.tags[0]}`).toBe(true);
    }
  }
}

describe('conteúdo', () => {
  it('conteudo/*.json: ids únicos, pt+en preenchidos, ___ no 50/50', () => {
    for (const [nome, itens] of Object.entries(ficheirosExternos())) validar(nome, itens);
  });

  it('reserva do 50/50 é válida', () => {
    validar('5050', reserva5050);
    expect(conteudoDe('5050', reserva5050).length).toBeGreaterThanOrEqual(60);
  });
});
