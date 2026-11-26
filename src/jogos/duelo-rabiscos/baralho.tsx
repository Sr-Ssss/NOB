import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/** largura natural da carta (carta.css) */
const LARG = 220;
const ALT = 330;

export interface CartaBaralho {
  id: number;
  carta: ComponentChildren;
  /** a cinzento (não serve agora), mas ainda se vê */
  apagada?: boolean;
  rotulo: string;
}

/**
 * As cartas lado a lado, umas por cima das outras, sempre todas dentro do ecrã.
 * Arrastar para o lado muda a carta da frente; tocar numa escolhe-a. A da frente fica maior e por cima.
 */
export function Baralho({ cartas, escolhida, escolher }: { cartas: CartaBaralho[]; escolhida: number | null; escolher: (id: number) => void }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [larg, setLarg] = useState(340);
  // a da frente: a escolhida ou, sem escolha, a primeira que serve
  const [frente, setFrente] = useState(0);
  const iEscolhida = cartas.findIndex((c) => c.id === escolhida);
  const atual = iEscolhida >= 0 ? iEscolhida : Math.min(frente, cartas.length - 1);
  useEffect(() => {
    const medir = () => caixa.current && setLarg(caixa.current.clientWidth);
    medir();
    addEventListener('resize', medir);
    return () => removeEventListener('resize', medir);
  }, []);
  const n = cartas.length;
  // tamanho: a carta normal e a da frente (maior); o passo entre cartas faz caber todas
  const normal = Math.min(150, larg * 0.42);
  const grande = normal * 1.25;
  const passo = n > 1 ? Math.min(normal * 0.8, (larg - grande) / (n - 1)) : 0;
  const total = grande + passo * (n - 1);
  const x0 = (larg - total) / 2;
  const arrasto = useRef<{ x: number; i: number; mexeu: boolean } | null>(null);
  const ir = (i: number) => {
    const k = Math.max(0, Math.min(n - 1, i));
    setFrente(k);
    if (!cartas[k].apagada) escolher(cartas[k].id);
  };
  return (
    <div
      ref={caixa}
      class="dr-baralho"
      style={{ height: `${(grande * ALT) / LARG + 8}px` }}
      onPointerDown={(ev) => {
        arrasto.current = { x: ev.clientX, i: atual, mexeu: false };
      }}
      onPointerMove={(ev) => {
        const a = arrasto.current;
        if (!a || !passo) return;
        const d = Math.round((a.x - ev.clientX) / Math.max(24, passo));
        if (d !== 0) a.mexeu = true;
        if (a.i + d !== atual) ir(a.i + d);
      }}
      onPointerUp={() => (arrasto.current = null)}
      onPointerLeave={() => (arrasto.current = null)}
      role="listbox"
      aria-orientation="horizontal"
      onKeyDown={(ev: KeyboardEvent) => {
        if (ev.key === 'ArrowRight') ir(atual + 1);
        if (ev.key === 'ArrowLeft') ir(atual - 1);
      }}
      tabIndex={0}
    >
      {cartas.map((c, i) => {
        const naFrente = i === atual;
        const w = naFrente ? grande : normal;
        // as cartas à frente ficam alinhadas à sua posição; a grande cresce para dentro do ecrã
        let x = x0 + i * passo + (naFrente ? 0 : (grande - normal) / 2);
        x = Math.max(0, Math.min(larg - w, x));
        return (
          <div
            key={c.id}
            tabIndex={c.apagada ? -1 : 0}
            aria-disabled={c.apagada}
            onKeyDown={(ev: KeyboardEvent) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                ir(i);
              }
            }}
            class={'dr-baralho-carta' + (naFrente ? ' frente' : '') + (c.apagada ? ' apagada' : '') + (c.id === escolhida ? ' on' : '')}
            role="option"
            aria-selected={c.id === escolhida}
            aria-label={c.rotulo}
            style={{ left: `${x}px`, width: `${w}px`, height: `${(w * ALT) / LARG}px`, zIndex: 100 - Math.abs(i - atual), bottom: 0 }}
            onClick={() => {
              if (arrasto.current?.mexeu) return;
              ir(i);
            }}
          >
            <div style={{ transform: `scale(${w / LARG})`, transformOrigin: '0 100%', width: `${LARG}px`, position: 'absolute', left: 0, bottom: 0 }}>{c.carta}</div>
          </div>
        );
      })}
    </div>
  );
}
