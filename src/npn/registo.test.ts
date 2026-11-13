import { describe, expect, it } from 'vitest';
import { atualizar, paraCsv, type Leitura } from './registo';

const l = (id: string, mediana: number, extra: Partial<Leitura> = {}): Leitura => ({
  id,
  nome: id.toUpperCase(),
  rssi: mediana,
  mediana,
  perto: mediana >= -65,
  t: 0,
  ...extra,
});

describe('registo NPN', () => {
  it('CSV com cabeçalho e campos escapados', () => {
    const csv = paraCsv([{ ...l('a1', -60, { nome: 'Ana, "a"' }), limite: -65, distancia: '1,5' }]);
    const [cab, linha] = csv.trim().split('\n');
    expect(cab).toBe('hora,telemovel,id,rssi,mediana_3s,estado,limite_dbm,distancia_m');
    expect(linha).toBe('1970-01-01T00:00:00.000Z,"Ana, ""a""",a1,-60,-60,PERTO,-65,"1,5"');
  });

  it('lista sem repetidos, o mais forte primeiro', () => {
    let v: Leitura[] = [];
    v = atualizar(v, l('a', -80));
    v = atualizar(v, l('b', -60));
    v = atualizar(v, l('a', -55));
    expect(v.map((x) => x.id)).toEqual(['a', 'b']);
  });
});
