/** Base comum das artes: traço de lápis. Um desenho = lista de camadas [d, enchimento?, grossura?, tracejado?]. */
export const GRAFITE = '#2b2a33';
export type Camada = [d: string, cheio?: string, grossura?: number, tracejado?: string];

/** camadas prontas a pôr dentro de um <svg>; `g` = grossura normal */
export function Riscos({ c, g = 4, cor = GRAFITE }: { c: Camada[]; g?: number; cor?: string }) {
  return (
    <g fill="none" stroke={cor} stroke-linecap="round" stroke-linejoin="round">
      {c.map(([d, cheio, grossura, tracejado], i) => (
        <path key={i} d={d} fill={cheio ?? 'none'} stroke-width={grossura ?? g} stroke-dasharray={tracejado} />
      ))}
    </g>
  );
}

/** quadro 100×100, decorativo (aria-hidden): o nome acessível fica no botão ou cartão que o usa */
export function Arte({ c, tam = 48, class: cl }: { c: Camada[]; tam?: number; class?: string }) {
  return (
    <svg class={cl} viewBox="0 0 100 100" width={tam} height={tam} aria-hidden="true">
      <Riscos c={c} />
    </svg>
  );
}
