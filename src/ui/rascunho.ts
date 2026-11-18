import { useEffect, useState } from 'preact/hooks';

/**
 * Rascunhos dos ecrãs de escrever/desenhar (auditoria 17/11): sem TV, quando o herdeiro assume a party
 * (`#/jogar` → `#/criar`) ou o anfitrião recarrega, o ecrã volta a montar e o `useState` começava do zero
 * (texto perdido, frase sorteada nova, trocas de volta a 2). Guardam-se no separador (`sessionStorage`),
 * por grupo = party + jogo + ronda (+ item), para não passarem para a ronda seguinte.
 */

const CHAVE = 'nob.rascunho';
/** grupos guardados no máximo (os mais recentes) */
const MAX_GRUPOS = 3;

type Guardados = { grupo: string; campos: Record<string, unknown> }[];

type Arm = Pick<Storage, 'getItem' | 'setItem'>;

function ler(arm: Arm): Guardados {
  try {
    const g = JSON.parse(arm.getItem(CHAVE) ?? '[]') as unknown;
    return Array.isArray(g) ? g.filter((x): x is Guardados[number] => !!x && typeof x.grupo === 'string' && !!x.campos && typeof x.campos === 'object') : [];
  } catch {
    return [];
  }
}

/** o valor guardado (ou `undefined`) */
export function lerRascunho(arm: Arm, grupo: string, campo: string): unknown {
  return ler(arm).find((x) => x.grupo === grupo)?.campos[campo];
}

export function gravarRascunho(arm: Arm, grupo: string, campo: string, valor: unknown): void {
  try {
    const todos = ler(arm);
    const atual = todos.find((x) => x.grupo === grupo);
    const resto = todos.filter((x) => x !== atual).slice(-(MAX_GRUPOS - 1));
    arm.setItem(CHAVE, JSON.stringify([...resto, { grupo, campos: { ...atual?.campos, [campo]: valor } }]));
  } catch {
    /* sem armazenamento ou cheio: fica só em memória */
  }
}

/** apaga todos os grupos menos `manter` (null = todos) */
export function limparRascunhos(arm: Arm, manter: string | null): void {
  try {
    const todos = ler(arm);
    const fica = todos.filter((x) => x.grupo === manter);
    if (fica.length !== todos.length) arm.setItem(CHAVE, JSON.stringify(fica));
  } catch {
    /* sem armazenamento */
  }
}

const sessao = (): Arm | null => {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
};

/**
 * Como `useState`, mas o valor sobrevive a remontar o ecrã no mesmo separador.
 * `valido`: o guardado ainda serve? (ex.: a frase sorteada continua na lista); senão usa o inicial.
 */
export function useRascunho<T>(grupo: string, campo: string, inicial: T | (() => T), valido?: (x: unknown) => boolean): [T, (v: T) => void] {
  const [valor, setValor] = useState<T>(() => {
    const arm = sessao();
    const g = arm ? lerRascunho(arm, grupo, campo) : undefined;
    if (g !== undefined && (!valido || valido(g))) return g as T;
    const v = typeof inicial === 'function' ? (inicial as () => T)() : inicial;
    // o que foi sorteado ao montar também fica (a frase não muda ao remontar)
    if (arm && typeof inicial === 'function') gravarRascunho(arm, grupo, campo, v);
    return v;
  });
  const mudar = (v: T) => {
    setValor(v);
    const arm = sessao();
    if (arm) gravarRascunho(arm, grupo, campo, v);
  };
  return [valor, mudar];
}

/**
 * No ecrã do jogo (sempre montado durante o jogo): só o rascunho de `ativo` fica; fora das fases de escrever
 * (`null`), apaga-se tudo. Assim o "jogar outra vez" (ronda 1 de novo) nunca recupera o rascunho do jogo anterior.
 */
export function useSoRascunho(ativo: string | null): void {
  useEffect(() => {
    const arm = sessao();
    if (arm) limparRascunhos(arm, ativo);
  }, [ativo]);
}
