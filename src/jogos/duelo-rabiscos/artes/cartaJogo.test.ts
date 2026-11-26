import { describe, expect, it } from 'vitest';
import { TEXTO_CRIATURA_PT } from '../textos';
import { TEXTO_CRIATURA as TEXTO_CRIATURA_BR } from '../textosBR';
import { TEXTO_CRIATURA as TEXTO_CRIATURA_EN } from '../textosEN';
import { simbolos } from './cartaJogo';

describe('símbolos no texto do especial', () => {
  it('troca habilidade, distância, ferimentos, dados de ataque/defesa e passos', () => {
    expect(simbolos('Luta colado ou atira a 2. Se o tiro falhar, faz 1 ferimento.')).toEqual([
      'Luta colado ou atira ',
      { s: 'distancia', n: '2' },
      '. Se o tiro falhar, faz ',
      { s: 'ferimento', n: '1' },
      '.',
    ]);
    expect(simbolos('Com o dado Habilidade, tira 1 ferimento a um amigo até 2 de distância.')).toEqual([
      { s: 'habilidade', n: undefined },
      'tira ',
      { s: 'ferimento', n: '1' },
      ' a um amigo ',
      { s: 'distancia', n: '2' },
      '.',
    ]);
    expect(simbolos('Amigos colados têm +1 dado de defesa.')[1]).toEqual({ s: 'defesa', n: '+1' });
    expect(simbolos('+1 attack die for each wound (max. +2).')).toEqual([{ s: 'ataque', n: '+1' }, ' for each ', { s: 'ferimento', n: undefined }, ' (max. +2).']);
    expect(simbolos('After attacking, moves 1.')[1]).toEqual({ s: 'passos', n: '1' });
  });

  it('nenhum texto fica com as palavras que têm símbolo', () => {
    for (const t of [TEXTO_CRIATURA_PT, TEXTO_CRIATURA_BR, TEXTO_CRIATURA_EN])
      for (const { especial } of Object.values(t)) {
        const resto = simbolos(especial)
          .filter((p) => typeof p === 'string')
          .join('');
        expect(resto).not.toMatch(/Habilidade|Ability die|distância|away|ferimento|wound|dado de (ataque|defesa)|\bmoves \d|\banda \d|até \d|up to \d/);
      }
  });
});
