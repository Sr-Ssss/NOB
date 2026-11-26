/** As 14 criaturas e os 6 magos (números em info/jogos/guerra-de-desenhos.md). */
import type { Classe, Marca } from './artes/icones';
import type { RoupaMago } from './artes/magos';
import type { Criatura } from './artes/moldes';

export type { Classe, Criatura, Marca, RoupaMago };

export interface Ficha {
  classe: Classe;
  tinta: number;
  /** dados de defesa: também quantos ferimentos aguenta */
  defesa: number;
  passos: number;
  dados: number;
  marca: Marca;
}

const f = (classe: Classe, tinta: number, defesa: number, passos: number, dados: number, marca: Marca): Ficha => ({ classe, tinta, defesa, passos, dados, marca });

export const CRIATURAS: Record<Criatura, Ficha> = {
  duende: f('lacaio', 2, 2, 2, 1, 'dentada'),
  sapinho: f('lacaio', 2, 2, 3, 1, 'dentada'),
  corvo: f('batedor', 3, 3, 4, 2, 'garras'),
  lobo: f('batedor', 3, 3, 4, 2, 'garras'),
  velhoPescador: f('pescador', 3, 3, 2, 2, 'anzol'),
  mumia: f('pescador', 3, 4, 2, 1, 'ligaduras'),
  elfo: f('arqueiro', 4, 2, 2, 2, 'seta'),
  dragaozinho: f('arqueiro', 4, 2, 1, 2, 'queimado'),
  golem: f('guardiao', 4, 5, 3, 2, 'amolgadela'),
  carvalho: f('guardiao', 4, 6, 2, 2, 'amolgadela'),
  cavaleiro: f('duelista', 5, 4, 2, 3, 'corte'),
  raposa: f('duelista', 5, 3, 3, 3, 'corte'),
  minotauro: f('barbaro', 6, 5, 3, 4, 'soco'),
  ogre: f('barbaro', 6, 5, 2, 4, 'soco'),
};

export type Poder = 'empurrao' | 'escudo' | 'retoque' | 'maisAtaque' | 'tempestade' | 'copia' | 'sono' | 'furia' | 'muralha' | 'troca';

export const CUSTO: Record<Poder, number> = {
  empurrao: 2,
  escudo: 1,
  retoque: 1,
  maisAtaque: 1,
  tempestade: 4,
  copia: 3,
  sono: 4,
  furia: 3,
  muralha: 3,
  troca: 3,
};

/** [2.º poder, especial] */
export const MAGOS_PODERES: Record<RoupaMago, [Poder, Poder]> = {
  trovoada: ['empurrao', 'tempestade'],
  lencol: ['escudo', 'copia'],
  pijama: ['retoque', 'sono'],
  peles: ['empurrao', 'furia'],
  pedreiro: ['maisAtaque', 'muralha'],
  ilusionista: ['escudo', 'troca'],
};

export type Exercito = Partial<Record<Criatura, number>>;
export const MAX_CLASSES = 3;

export const custoExercito = (x: Exercito): number =>
  (Object.entries(x) as [Criatura, number][]).reduce((s, [c, n]) => s + CRIATURAS[c].tinta * n, 0);

const tem = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** limpa o que veio do telemóvel; null se não for um exército possível */
export function validarExercito(x: unknown, tinta: number): Exercito | null {
  if (!x || typeof x !== 'object') return null;
  const out: Exercito = {};
  const classes: Classe[] = [];
  for (const [c, n] of Object.entries(x) as [string, unknown][]) {
    if (n === 0) continue;
    if (!tem(CRIATURAS, c) || typeof n !== 'number' || !Number.isInteger(n) || n < 0) return null;
    const { classe } = CRIATURAS[c as Criatura];
    if (classes.includes(classe)) return null; // uma variante por classe
    classes.push(classe);
    out[c as Criatura] = n;
  }
  return classes.length > 0 && classes.length <= MAX_CLASSES && custoExercito(out) <= tinta ? out : null;
}

/** porque é que não dá para juntar mais uma cópia de `c` (null = dá) */
export function motivoNaoSomar(x: Exercito, c: Criatura, tinta: number): 'variante' | 'classes' | 'tinta' | null {
  const postas = (Object.keys(x) as Criatura[]).filter((k) => x[k]);
  const { classe } = CRIATURAS[c];
  if (!x[c]) {
    if (postas.some((k) => CRIATURAS[k].classe === classe)) return 'variante';
    if (postas.length >= MAX_CLASSES) return 'classes';
  }
  return custoExercito(x) + CRIATURAS[c].tinta > tinta ? 'tinta' : null;
}

/** +1 ou −1 cópia; as que chegam a 0 saem */
export function mudarExercito(x: Exercito, c: Criatura, d: 1 | -1): Exercito {
  const n = (x[c] ?? 0) + d;
  const out: Exercito = { ...x, [c]: n };
  if (n <= 0) delete out[c];
  return out;
}

/** as 3 sugestões do botão "exército pronto": compra à roda até a tinta não dar */
export function exercitosProntos(tinta: number): Exercito[] {
  const listas: Criatura[][] = [
    ['ogre', 'elfo', 'duende'],
    ['cavaleiro', 'golem', 'corvo'],
    ['lobo', 'velhoPescador', 'sapinho'],
  ];
  return listas.map((l) => {
    const x: Exercito = {};
    let resta = tinta;
    for (let comprou = true; comprou; ) {
      comprou = false;
      for (const c of l)
        if (CRIATURAS[c].tinta <= resta) {
          x[c] = (x[c] ?? 0) + 1;
          resta -= CRIATURAS[c].tinta;
          comprou = true;
        }
    }
    return x;
  });
}
