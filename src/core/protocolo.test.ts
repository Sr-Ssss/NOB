import { describe, expect, it } from 'vitest';
import { impressao, novasChavesDispositivo, novasChavesHost, type ChavesHost } from './cripto';
import { PASSA_JA, ProtocoloCliente, ProtocoloHost, SILENCIO_TROCA, publicas, type CopiaHost, type MsgVista, type Passagem } from './protocolo';
import { novaSala, vistaSala, type EstadoSala } from './sala';

const COD = 'ABCD';
const vista = vistaSala(novaSala(COD, 'pt-BR'));
const host = (chaves = novasChavesHost(), fixadas: Record<string, string> = {}, cadeia: Passagem[] = []) => new ProtocoloHost(COD, chaves, fixadas, undefined, cadeia);

/** A (original) passa a party a K: o protocolo de K e a sua cadeia */
function passar(a: ProtocoloHost, fixadas: Record<string, string> = {}): { k: ProtocoloHost; chaves: ChavesHost } {
  const chaves = novasChavesHost();
  return { k: host(chaves, fixadas, [...a.cadeia, a.passar(publicas(chaves))]), chaves };
}

describe('protocolo: vistas assinadas', () => {
  it('fixa o 1.º anfitrião e recusa vistas de outra chave', () => {
    const a = host();
    const c = new ProtocoloCliente(COD, 'b', novasChavesDispositivo());
    expect(c.lerVista(a.vista(1, 0, vista), 0)).not.toBeNull();
    expect(c.lerVista(host().vista(2, 0, vista), 100_000)).toBeNull();
    expect(c.host!.assina).toBe(a.chaves.assina.pub);
  });

  it('o `prox` está dentro da assinatura', () => {
    const a = host();
    const c = new ProtocoloCliente(COD, 'b', novasChavesDispositivo());
    const m: MsgVista = { ...a.vista(1, 0, vista, 'aaaa'), prox: 'bbbb' };
    expect(c.lerVista(m, 0)).toBeNull();
    expect(c.lerVista(a.vista(1, 0, vista, 'aaaa'), 0)?.prox).toBe('aaaa');
  });
});

describe('protocolo: passagem do anfitrião', () => {
  it('aceita o sucessor só com a cadeia certa e depois do anfitrião se calar', () => {
    const a = host();
    const { k, chaves } = passar(a);
    const c = new ProtocoloCliente(COD, 'b', novasChavesDispositivo());
    c.lerVista(a.vista(5, 0, vista, impressao(chaves.assina.pub)), 0);
    // o anfitrião ainda está vivo: não troca
    expect(c.lerVista(k.vista(6, 0, vista), SILENCIO_TROCA - 1)).toBeNull();
    const r = c.lerVista(k.vista(6, 0, vista), SILENCIO_TROCA);
    expect(r?.trocou).toBe(true);
    expect(c.host).toEqual(publicas(chaves));
    // e a partir daí recusa o antigo
    expect(c.lerVista(a.vista(7, 0, vista), SILENCIO_TROCA * 3)).toBeNull();
  });

  it('a passar já (TV escolhida pelo líder, PASSA_JA): aceita o herdeiro anunciado sem esperar o silêncio, e só esse', () => {
    const a = host();
    const { k, chaves } = passar(a);
    const outro = passar(a).k;
    const c = new ProtocoloCliente(COD, 'b', novasChavesDispositivo());
    c.lerVista(a.vista(5, 0, vista, impressao(chaves.assina.pub) + PASSA_JA), 0);
    expect(c.lerVista(outro.vista(6, 0, vista), 1)).toBeNull();
    expect(c.lerVista(k.vista(6, 0, vista), 1)?.trocou).toBe(true);
    // o PASSA_JA vai dentro da assinatura: ninguém o acrescenta a uma vista do anfitrião
    const d = new ProtocoloCliente(COD, 'd', novasChavesDispositivo());
    const m = a.vista(5, 0, vista, impressao(chaves.assina.pub));
    expect(d.lerVista({ ...m, prox: m.prox + PASSA_JA }, 0)).toBeNull();
    d.lerVista(m, 0);
    expect(d.lerVista(k.vista(6, 0, vista), 1)).toBeNull();
  });

  it('recusa um sucessor que não é o herdeiro anunciado', () => {
    const a = host();
    const { k } = passar(a);
    const c = new ProtocoloCliente(COD, 'b', novasChavesDispositivo());
    c.lerVista(a.vista(1, 0, vista, impressao(novasChavesHost().assina.pub)), 0);
    expect(c.lerVista(k.vista(2, 0, vista), SILENCIO_TROCA * 2)).toBeNull();
  });

  it('recusa cadeias falsas', () => {
    const a = host();
    const c = new ProtocoloCliente(COD, 'b', novasChavesDispositivo());
    c.lerVista(a.vista(1, 0, vista), 0);
    const t = SILENCIO_TROCA * 2;
    // sem cadeia
    expect(c.lerVista(host().vista(2, 0, vista), t)).toBeNull();
    // o intruso assina ele próprio um elo "de A"
    const x = host();
    const falso = x.passar(publicas(x.chaves));
    expect(c.lerVista(host(x.chaves, {}, [{ ...falso, de: a.chaves.assina.pub }]).vista(2, 0, vista), t)).toBeNull();
    // elo verdadeiro de A, mas para outras chaves
    const outro = novasChavesHost();
    expect(c.lerVista(host(x.chaves, {}, [a.passar(publicas(outro))]).vista(2, 0, vista), t)).toBeNull();
    // elo de outra party
    const b = new ProtocoloHost('ZZZZ', a.chaves);
    expect(c.lerVista(host(x.chaves, {}, [b.passar(publicas(x.chaves))]).vista(2, 0, vista), t)).toBeNull();
    expect(c.host!.assina).toBe(a.chaves.assina.pub);
  });

  it('segue várias passagens (A → K → K2), também para quem fixou A e esteve fora', () => {
    const a = host();
    const { k } = passar(a);
    const { k: k2, chaves } = passar(k);
    const c = new ProtocoloCliente(COD, 'b', novasChavesDispositivo(), null, publicas(a.chaves));
    expect(c.lerVista(k2.vista(9, 0, vista), 0)?.trocou).toBe(true);
    expect(c.host).toEqual(publicas(chaves));
  });

  it('quem entra pelo QR do anfitrião original aceita o sucessor', () => {
    const a = host();
    const { k } = passar(a);
    const c = new ProtocoloCliente(COD, 'b', novasChavesDispositivo(), a.impressao);
    expect(c.lerVista(host().vista(1, 0, vista), 0)).toBeNull();
    expect(c.lerVista(k.vista(1, 0, vista), 0)).not.toBeNull();
    expect(c.host!.assina).toBe(k.chaves.assina.pub);
  });

  it('a cópia só abre no herdeiro e traz chaves certificadas; ações e privados seguem para o novo', () => {
    const chB = novasChavesDispositivo();
    const chC = novasChavesDispositivo();
    const a = host(novasChavesHost(), { b: chB.pub, c: chC.pub });
    const b = new ProtocoloCliente(COD, 'b', chB);
    const c = new ProtocoloCliente(COD, 'c', chC);
    b.lerVista(a.vista(1, 0, vista), 0);
    c.lerVista(a.vista(1, 0, vista), 0);
    const nova = novasChavesHost();
    const estado: EstadoSala = novaSala(COD, 'pt-BR');
    const dados: CopiaHost = { seq: 1, agora: 0, estado, sal: [1, 2, 3, 4], fixadas: { ...a.fixadas }, chaves: nova, cadeia: [a.passar(publicas(nova))] };
    const m = a.copia('b', dados)!;
    expect(c.lerCopia(m)).toBeNull();
    expect(c.lerCopia({ ...m, para: 'c' })).toBeNull();
    const k = b.lerCopia(m)!;
    expect(k.estado.codigo).toBe(COD);
    expect(k.fixadas).toEqual({ b: chB.pub, c: chC.pub });
    // chaves que a cadeia não certifica: recusada
    expect(b.lerCopia(a.copia('b', { ...dados, chaves: novasChavesHost() }))).toBeNull();
    // o novo anfitrião abre as ações de C e C lê os privados dele
    const novo = host(k.chaves, k.fixadas, k.cadeia);
    expect(c.lerVista(novo.vista(2, 0, vista), SILENCIO_TROCA)?.trocou).toBe(true);
    expect(novo.abrir(c.acao({ tipo: 'tick' }))?.de).toBe('c');
    expect(c.lerPrivado(novo.privado('c', { c: 1 }))).toEqual({ c: 1 });
    // o antigo já não lê o que C manda
    expect(a.abrir(c.acao({ tipo: 'tick' }))).toBeNull();
  });

  it('o anfitrião antigo reconhece que foi substituído (e só por um sucessor seu)', () => {
    const a = host();
    const { k, chaves } = passar(a);
    expect(a.substituidoPor(k.vista(1, 0, vista))).toEqual(publicas(chaves));
    expect(a.substituidoPor(a.vista(1, 0, vista))).toBeNull();
    expect(a.substituidoPor(host().vista(1, 0, vista))).toBeNull();
    expect(a.substituidoPor(passar(host()).k.vista(1, 0, vista))).toBeNull();
  });
});
