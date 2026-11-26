import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { TXT } from './textos';

const MAX = 3;
interface Vista {
  k: number;
  x: number;
  y: number;
}

/** zoom com dois dedos (e botões + −); com zoom, um dedo arrasta. Sem zoom, um dedo faz scroll à página */
export function Zoom({ children }: { children: ComponentChildren }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [z, setZ] = useState<Vista>({ k: 1, x: 0, y: 0 });
  const atual = useRef(z);
  atual.current = z;
  /** prende o conteúdo dentro da caixa */
  const prender = (n: Vista): Vista => {
    const el = caixa.current;
    const k = Math.min(MAX, Math.max(1, n.k));
    if (!el || k === 1) return { k: 1, x: 0, y: 0 };
    const [l, a] = [el.clientWidth, el.clientHeight];
    return { k, x: Math.min(0, Math.max(l - l * k, n.x)), y: Math.min(0, Math.max(a - a * k, n.y)) };
  };
  useEffect(() => {
    const el = caixa.current!;
    let ini: { d: number; cx: number; cy: number; z: Vista } | null = null;
    let arrasto: { x: number; y: number; z: Vista } | null = null;
    const pos = (t: Touch) => {
      const r = el.getBoundingClientRect();
      return [t.clientX - r.left, t.clientY - r.top];
    };
    const inicio = (ev: TouchEvent) => {
      if (ev.touches.length === 2) {
        ev.preventDefault();
        const [a, b] = [pos(ev.touches[0]), pos(ev.touches[1])];
        ini = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2, z: atual.current };
        arrasto = null;
      } else if (ev.touches.length === 1 && atual.current.k > 1) {
        const [x, y] = pos(ev.touches[0]);
        arrasto = { x, y, z: atual.current };
      }
    };
    const mexe = (ev: TouchEvent) => {
      if (ini && ev.touches.length === 2) {
        ev.preventDefault();
        const [a, b] = [pos(ev.touches[0]), pos(ev.touches[1])];
        const k = Math.min(MAX, Math.max(1, (ini.z.k * Math.hypot(a[0] - b[0], a[1] - b[1])) / ini.d));
        // o ponto entre os dedos fica no sítio
        const [cx, cy] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const f = k / ini.z.k;
        setZ(prender({ k, x: cx - (ini.cx - ini.z.x) * f, y: cy - (ini.cy - ini.z.y) * f }));
      } else if (arrasto && ev.touches.length === 1) {
        const [x, y] = pos(ev.touches[0]);
        // só conta como arrasto a partir de alguns px (senão é um toque numa casa)
        if (Math.hypot(x - arrasto.x, y - arrasto.y) < 6) return;
        ev.preventDefault();
        setZ(prender({ ...arrasto.z, x: arrasto.z.x + x - arrasto.x, y: arrasto.z.y + y - arrasto.y }));
      }
    };
    const fim = (ev: TouchEvent) => {
      if (ev.touches.length < 2) ini = null;
      if (!ev.touches.length) arrasto = null;
    };
    el.addEventListener('touchstart', inicio, { passive: false });
    el.addEventListener('touchmove', mexe, { passive: false });
    el.addEventListener('touchend', fim);
    el.addEventListener('touchcancel', fim);
    return () => {
      el.removeEventListener('touchstart', inicio);
      el.removeEventListener('touchmove', mexe);
      el.removeEventListener('touchend', fim);
      el.removeEventListener('touchcancel', fim);
    };
  }, []);
  /** botões: zoom a partir do centro */
  const passo = (f: number) => {
    const el = caixa.current;
    const [cx, cy] = el ? [el.clientWidth / 2, el.clientHeight / 2] : [0, 0];
    const k = Math.min(MAX, Math.max(1, z.k * f));
    setZ(prender({ k, x: cx - (cx - z.x) * (k / z.k), y: cy - (cy - z.y) * (k / z.k) }));
  };
  return (
    <div class="dr-zoom">
      <div ref={caixa} class="dr-zoom-caixa" style={{ touchAction: z.k > 1 ? 'none' : 'pan-y' }}>
        <div style={{ transform: `translate(${z.x}px, ${z.y}px) scale(${z.k})`, transformOrigin: '0 0' }}>{children}</div>
      </div>
      <div class="dr-zoom-bts">
        <button class="opcao" aria-label={TXT.zoomMais} disabled={z.k >= MAX} onClick={() => passo(1.5)}>
          +
        </button>
        <button class="opcao" aria-label={TXT.zoomMenos} disabled={z.k <= 1} onClick={() => passo(1 / 1.5)}>
          −
        </button>
      </div>
    </div>
  );
}
