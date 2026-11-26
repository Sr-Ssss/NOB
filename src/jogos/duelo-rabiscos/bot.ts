/**
 * Bot do Duelo de Rabiscos (fase 4): só consultas de `regras.ts`, por isso só faz ações válidas.
 * Contas simples: probabilidade de cada batalha, valor = tinta das criaturas. Fica mais atrevido a cada volta,
 * para a partida acabar.
 */
import { CRIATURAS, CUSTO, MAGOS_PODERES, exercitosProntos, type Criatura, type Poder, type RoupaMago } from './criaturas';
import { passoPoder, poderCompleto, tocarPoder } from './jogadas';
import { alvosAtaque, alvosEspecial, casasAndar, casasEspecial, casasLobo, colados, cria, dadosAtaque, dadosDefesa, podeRelancar, serve, type AcaoDuelo, type AlvoPoder, type Cria, type Face, type VistaDuelo } from './regras';
import { distancia, vizinhas, type Casa } from './tabuleiro';

type Sorte = () => number;
type Jogada = Exclude<AcaoDuelo, { tipo: 'ligados' } | { tipo: 'tick' }>;

const valor = (c: Pick<Cria, 'tipo' | 'fantasma'>) => (c.fantasma ? 1 : CRIATURAS[c.tipo].tinta);

/** distribuição da soma: dados normais + dados de ferimento (1/6 contam 1) */
function soma(normais: number, feridos: number, ataca: boolean): number[] {
  const face = ataca ? [3 / 6, 2 / 6, 1 / 6] : [1 / 2, 1 / 2];
  let d = [1];
  const juntar = (f: number[]) => {
    const n = new Array(d.length + f.length - 1).fill(0);
    d.forEach((p, i) => f.forEach((q, k) => (n[i + k] += p * q)));
    d = n;
  };
  for (let i = 0; i < normais; i++) juntar(face);
  for (let i = 0; i < feridos; i++) juntar([5 / 6, 1 / 6]);
  return d;
}

/** P(riscos > bloqueios), P(empate), P(menos) */
function probabilidades(a: number[], b: number[]): [number, number, number] {
  let [ganha, empata, perde] = [0, 0, 0];
  a.forEach((p, i) => b.forEach((q, k) => (i > k ? (ganha += p * q) : i === k ? (empata += p * q) : (perde += p * q))));
  return [ganha, empata, perde];
}

/** valor esperado de `c` atacar `o` (positivo = bom para o dono de `c`) */
export function valorAtaque(v: VistaDuelo, c: Cria, o: Cria): number {
  const nA = dadosAtaque(v, c, o);
  const nD = dadosDefesa(v, o);
  const fA = Math.min(nA, c.ferimentos);
  const fD = Math.min(nD, o.ferimentos);
  const [ganha, empata, perde] = probabilidades(soma(nA - fA, fA, true), soma(nD - fD, fD, false));
  const perto = colados(c, o);
  if (!perto) return (ganha + (c.tipo === 'dragaozinho' ? 0.3 * (1 - ganha) : 0)) * valor(o);
  const morreAlvo = ganha + (o.tipo === 'raposa' ? 0 : empata);
  const morreEu = perde + (c.tipo === 'raposa' ? 0 : empata);
  const minotauro = o.tipo === 'minotauro' ? morreAlvo * 0.8 : 0;
  const sapinho = o.tipo === 'sapinho' ? ganha * 0.8 : 0;
  return morreAlvo * valor(o) - morreEu * valor(c) - minotauro - sapinho;
}

const minhas = (v: VistaDuelo, id: string) => v.criaturas.filter((c) => c.dono === id);
const inimigas = (v: VistaDuelo, id: string) => v.criaturas.filter((c) => c.dono !== id);

/** a que distância a criatura gosta de ficar dos inimigos */
const ideal = (c: Cria) => (c.tipo === 'elfo' ? 3 : c.tipo === 'dragaozinho' || c.tipo === 'velhoPescador' ? 2 : 1);

/** passos até cada casa a partir dos inimigos, contornando obstáculos (as criaturas não contam) */
function mapa(v: VistaDuelo, id: string): Map<Casa, number> {
  const pedra = new Set(v.tabuleiro.obstaculos);
  const casas = new Set(v.tabuleiro.casas);
  const d = new Map<Casa, number>();
  let frente = inimigas(v, id).map((c) => c.casa);
  frente.forEach((c) => d.set(c, 0));
  for (let k = 1; frente.length; k++) {
    const nova: Casa[] = [];
    for (const c of frente)
      for (const x of vizinhas(c))
        if (casas.has(x) && !pedra.has(x) && !d.has(x)) {
          d.set(x, k);
          nova.push(x);
        }
    frente = nova;
  }
  return d;
}

/** quão mal está a criatura em `casa` (0 = no sítio ideal) */
const longe = (m: Map<Casa, number>, c: Cria, casa: Casa) => Math.abs((m.get(casa) ?? 99) - ideal(c));

const com = (v: VistaDuelo, c: Cria, muda: Partial<Cria>): [VistaDuelo, Cria] => {
  const n = { ...c, ...muda };
  return [{ ...v, criaturas: v.criaturas.map((x) => (x.id === c.id ? n : x)) }, n];
};

/** o melhor ataque desta criatura agora: [valor, alvo] */
function melhorAtaque(v: VistaDuelo, c: Cria): [number, Cria | undefined] {
  let melhor: [number, Cria | undefined] = [-Infinity, undefined];
  for (const o of alvosAtaque(v, c)) {
    const x = valorAtaque(v, c, o);
    if (x > melhor[0]) melhor = [x, o];
  }
  return melhor;
}

interface Opcao {
  a: Jogada;
  valor: number;
}

/** todas as jogadas de dado com o seu valor */
function opcoesDado(v: VistaDuelo, id: string): Opcao[] {
  const m = v.magos[id];
  const l: Opcao[] = [];
  const mapaI = mapa(v, id);
  // a cada volta arrisca mais (para não ficar parado para sempre)
  const coragem = 0.3 * v.volta;
  const vistas = new Set<Face>();
  m.dados.forEach((face, i) => {
    if (vistas.has(face)) return;
    vistas.add(face);
    const custo = face === 'coringa' ? 0.15 : 0;
    for (const c of minhas(v, id)) {
      if (serve(face, 'andar'))
        for (const casa of casasAndar(v, c)) {
          const ganho = longe(mapaI, c, c.casa) - longe(mapaI, c, casa);
          // depois de andar, já pode atacar?
          const [vd, nc] = com(v, c, { casa, andou: true });
          const depois = Math.max(0, melhorAtaque(vd, nc)[0] + coragem) * 0.3;
          l.push({ a: { tipo: 'dr_andar', id, i, criatura: c.id, casa }, valor: ganho * 0.4 + depois - custo });
        }
      if (serve(face, 'atacar'))
        for (const o of alvosAtaque(v, c)) l.push({ a: { tipo: 'dr_atacar', id, i, criatura: c.id, alvo: o.id }, valor: valorAtaque(v, c, o) + coragem - custo });
      if (!serve(face, 'especial')) continue;
      for (const o of alvosEspecial(v, c)) {
        if (c.tipo === 'mumia') l.push({ a: { tipo: 'dr_especial', id, i, criatura: c.id, alvo: o.id }, valor: 0.4 * valor(o) - 0.1 - custo });
        else {
          // puxa (1 ferimento) e luta já
          const [vd, no] = com(v, o, { ferimentos: o.ferimentos + 1, casa: vizinhas(c.casa).find((x) => distancia(x, o.casa) < distancia(c.casa, o.casa)) ?? o.casa });
          const mata = o.ferimentos + 1 > CRIATURAS[o.tipo].defesa;
          const x = mata ? valor(o) : valorAtaque(vd, { ...c, casa: c.casa }, no) * (colados(c, no) ? 1 : 0.5) + 0.5;
          l.push({ a: { tipo: 'dr_especial', id, i, criatura: c.id, alvo: o.id }, valor: x + coragem - 0.1 - custo });
        }
      }
      // parede do Carvalho: só no início e para tapar o inimigo mais perto
      if (v.volta < 8)
        for (const casa of casasEspecial(v, c).slice(0, 1)) {
          const perto = (mapaI.get(casa) ?? 99) <= 2;
          l.push({ a: { tipo: 'dr_especial', id, i, criatura: c.id, casa }, valor: perto ? 0.1 - custo : -1 });
        }
    }
  });
  return l;
}

/** o dado a perder quando nada vale a pena: o que menos falta faz */
function passar(v: VistaDuelo, id: string): Jogada {
  const d = v.magos[id].dados;
  const ordem: Face[] = ['habilidade', 'fazer', 'andar', 'coringa'];
  const i = d.indexOf(ordem.find((f) => d.includes(f))!);
  return { tipo: 'dr_passar', id, i: Math.max(0, i) };
}

/** completa o poder escolhendo sempre o primeiro toque que `escolher` prefere */
function completar(v: VistaDuelo, id: string, poder: Poder, escolher: (a: AlvoPoder, casas: Casa[], alvos: number[]) => [Casa, number | undefined] | null): AlvoPoder | null {
  let a: AlvoPoder = {};
  for (let k = 0; k < 4 && !poderCompleto(poder, a); k++) {
    const o = passoPoder(v, id, poder, a);
    const t = escolher(a, o.casas, o.alvos);
    if (!t) return null;
    a = tocarPoder(poder, a, t[0], t[1]);
  }
  return poderCompleto(poder, a) ? a : null;
}

const porValor = <T>(l: T[], f: (x: T) => number): T | undefined => l.reduce<[T | undefined, number]>((m, x) => (f(x) > m[1] ? [x, f(x)] : m), [undefined, -Infinity])[0];

/** um poder que valha a pena, antes do dado */
function poder(v: VistaDuelo, id: string, r: Sorte): Jogada | null {
  const m = v.magos[id];
  if (m.poderUsado || !m.dados.length) return null;
  const fazer = m.dados.some((f) => f !== 'andar');
  const eu = minhas(v, id);
  const eles = inimigas(v, id);
  const mapaI = mapa(v, id);
  for (const p of MAGOS_PODERES[m.roupa!]) {
    if (m.gemas < CUSTO[p]) continue;
    const alvosCria = passoPoder(v, id, p, {}).alvos.map((n) => cria(v, n)!);
    const usar = (alvo: AlvoPoder): Jogada => ({ tipo: 'dr_poder', id, poder: p, alvo });
    switch (p) {
      case 'tempestade': {
        const ganho = (o: Cria) => v.criaturas.filter((x) => x === o || colados(x, o)).reduce((s, x) => s + (x.dono === id ? -1 : 1) * (x.ferimentos >= CRIATURAS[x.tipo].defesa ? valor(x) : 0.8), 0);
        const o = porValor(alvosCria, ganho);
        if (o && ganho(o) >= 2.5) return usar({ criatura: o.id });
        break;
      }
      case 'sono': {
        const o = porValor(
          alvosCria.filter((x) => eu.some((y) => distancia(x.casa, y.casa) <= 2)),
          (x) => valor(x),
        );
        if (o && m.gemas >= 5) return usar({ criatura: o.id });
        break;
      }
      case 'furia':
      case 'maisAtaque': {
        if (!fazer) break;
        const ganho = (c: Cria) => {
          const [, alvo] = melhorAtaque(v, c);
          if (!alvo) return -Infinity;
          const [vd, nc] = com(v, c, { [p]: true });
          return valorAtaque(vd, nc, alvo) - valorAtaque(v, c, alvo);
        };
        const c = porValor(alvosCria, ganho);
        if (c && ganho(c) >= (p === 'furia' ? 1 : 0.4)) return usar({ criatura: c.id });
        break;
      }
      case 'escudo': {
        const c = porValor(
          alvosCria.filter((x) => eles.some((o) => distancia(x.casa, o.casa) <= 2)),
          (x) => valor(x),
        );
        if (c && r() < 0.7) return usar({ criatura: c.id });
        break;
      }
      case 'retoque': {
        const c = porValor(alvosCria, (x) => valor(x));
        if (c) return usar({ criatura: c.id });
        break;
      }
      case 'empurrao': {
        // empurra uma criatura minha para junto de um inimigo, para atacar já
        if (!fazer) break;
        let melhor: [number, AlvoPoder] = [0.5, {}];
        for (const c of eu.filter((x) => !x.agiu && !x.sono && !alvosAtaque(v, x).length))
          for (const casa of passoPoder(v, id, p, { criatura: c.id }).casas) {
            const [vd, nc] = com(v, c, { casa });
            const x = melhorAtaque(vd, nc)[0];
            if (x > melhor[0]) melhor = [x, { criatura: c.id, casa }];
          }
        if (melhor[1].casa) return usar(melhor[1]);
        break;
      }
      case 'copia': {
        if (m.gemas < 4) break;
        const casa = porValor(passoPoder(v, id, p, {}).casas, (c) => -(mapaI.get(c) ?? 99));
        if (casa) return usar({ casa });
        break;
      }
      case 'muralha': {
        if (m.gemas < 5 || v.volta > 8 || r() > 0.25) break;
        const a = completar(v, id, p, (_, casas) => {
          const c = porValor(casas, (x) => -Math.abs((mapaI.get(x) ?? 99) - 2));
          return c ? [c, undefined] : null;
        });
        if (a) return usar(a);
        break;
      }
      case 'troca': {
        if (!fazer) break;
        let melhor: [number, AlvoPoder] = [1.5, {}];
        for (const c of eu.filter((x) => !x.agiu && !x.sono))
          for (const o of eu.filter((x) => x !== c)) {
            const vd: VistaDuelo = { ...v, criaturas: v.criaturas.map((x) => (x === c ? { ...c, casa: o.casa } : x === o ? { ...o, casa: c.casa } : x)) };
            const x = melhorAtaque(vd, cria(vd, c.id)!)[0] - Math.max(0, melhorAtaque(v, c)[0]);
            if (x > melhor[0]) melhor = [x, { criatura: c.id, outra: o.id }];
          }
        if (melhor[1].outra !== undefined) return usar(melhor[1]);
        break;
      }
    }
  }
  return null;
}

/** relançar na batalha: o dado meu que mais melhora o resultado, se compensar */
function relancar(v: VistaDuelo, id: string): Jogada {
  const b = v.batalha!;
  const de = cria(v, b.de)!;
  const alvo = cria(v, b.alvo)!;
  const ataco = de.dono === id;
  const perto = colados(de, alvo);
  const util = (ataque: number, defesa: number) => {
    const empate = perto && ataque === defesa;
    const morre = ataque > defesa || (empate && alvo.tipo !== 'raposa');
    const morreQuem = perto && (ataque < defesa || (empate && de.tipo !== 'raposa'));
    const x = (morre ? valor(alvo) : 0) - (morreQuem ? valor(de) : 0);
    return ataco ? x : -x;
  };
  const conta = (l: number[], f: string[], espada: string) => l.reduce((s, x) => s + x, 0) + f.filter((x) => x === espada).length;
  const A = conta(b.ataque, b.feridaAtaque, 'espada');
  const D = conta(b.defesa, b.feridaDefesa, 'escudo');
  const agora = util(A, D);
  const [normais, feridas] = ataco ? [b.ataque, b.feridaAtaque] : [b.defesa, b.feridaDefesa];
  const faces = ataco ? [0, 0, 0, 1, 1, 2] : [0, 0, 0, 1, 1, 1];
  const conta1 = ataco ? 'espada' : 'escudo';
  let melhor: [number, number] = [v.magos[id].gratis > 0 ? 0.05 : 0.8, -1];
  const media = (atual: number, novos: number[]) => novos.reduce((s, n) => s + (ataco ? util(A - atual + n, D) : util(A, D - atual + n)), 0) / novos.length - agora;
  normais.forEach((x, i) => {
    const g = media(x, faces);
    if (g > melhor[0]) melhor = [g, i];
  });
  feridas.forEach((f, i) => {
    const g = media(f === conta1 ? 1 : 0, [1, 0, 0, 0, 0, 0]);
    if (g > melhor[0]) melhor = [g, normais.length + i];
  });
  return melhor[1] >= 0 ? { tipo: 'dr_relancar', id, i: melhor[1] } : { tipo: 'dr_pronto', id };
}

/** a jogada do bot agora (null = nada a fazer) */
export function jogadaBot(v: VistaDuelo, id: string, r: Sorte = Math.random): Jogada | null {
  const m = v.magos[id];
  if (!m || !v.participantes.includes(id)) return null;
  switch (v.fase) {
    case 'mago': {
      if (m.roupa) return null;
      const usadas = v.participantes.map((x) => v.magos[x].roupa);
      const livres = (Object.keys(MAGOS_PODERES) as RoupaMago[]).filter((x) => !usadas.includes(x));
      return livres.length ? { tipo: 'dr_mago', id, roupa: livres[Math.floor(r() * livres.length)] } : null;
    }
    case 'exercito': {
      if (m.exercito) return null;
      const l = exercitosProntos(v.def.tinta);
      return { tipo: 'dr_exercito', id, exercito: l[Math.floor(r() * l.length)] };
    }
    case 'desenhar':
      // não desenha: vale o molde
      return v.acabaram.includes(id) ? null : { tipo: 'dr_desenho', id, criatura: Object.keys(m.exercito ?? {})[0] as Criatura, tracos: [], pronto: true };
    case 'rodar': {
      if (m.pronto) return null;
      if (!m.relancou) {
        const n = minhas(v, id).length;
        const conta = (f: Face) => m.dados.filter((x) => x === f).length;
        // perto do inimigo quer atacar; longe quer andar
        const mapaI = mapa(v, id);
        const perto = minhas(v, id).some((c) => (mapaI.get(c.casa) ?? 99) <= CRIATURAS[c.tipo].passos + ideal(c));
        const sobra: Face | undefined = conta('andar') > n || (perto && conta('andar') > 1) ? 'andar' : conta('fazer') > n || (!perto && conta('fazer') > 1) ? 'fazer' : undefined;
        const especial = minhas(v, id).some((c) => ['velhoPescador', 'mumia', 'carvalho'].includes(c.tipo));
        const inutil: Face | undefined = !especial && m.dados.includes('habilidade') ? 'habilidade' : sobra;
        if (inutil) return { tipo: 'dr_rodar', id, i: m.dados.indexOf(inutil) };
      }
      return { tipo: 'dr_pronto', id };
    }
    case 'batalha':
      return podeRelancar(v, id) ? relancar(v, id) : null;
    case 'lobo': {
      const lobo = cria(v, v.lobo ?? undefined);
      if (lobo?.dono !== id) return null;
      // foge para onde tiver menos inimigos colados
      const perigo = (casa: Casa) => inimigas(v, id).filter((o) => distancia(o.casa, casa) === 1).length;
      const casa = porValor(casasLobo(v, lobo), (c) => -perigo(c));
      return { tipo: 'dr_lobo', id, casa: casa && perigo(casa) < perigo(lobo.casa) ? casa : null };
    }
    case 'vez': {
      if (v.vez !== id) return null;
      const p = poder(v, id, r);
      if (p) return p;
      const melhor = porValor(opcoesDado(v, id), (o) => o.valor);
      return melhor && melhor.valor > 0 ? melhor.a : m.dados.length ? passar(v, id) : null;
    }
    default:
      return null;
  }
}

/** o que conta como "já joguei aqui" (poder e relançar não mudam o relógio) */
export const chaveBot = (v: VistaDuelo, id: string): string => {
  const m = v.magos[id];
  return `${v.fase}:${v.terminaEm}:${v.volta}:${v.vez}:${m?.dados.length}:${m?.poderUsado}:${m?.relancou}:${m?.gemas}:${m?.gratis}:${m?.pronto}`;
};
