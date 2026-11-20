import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';

/**
 * Palco da TV (fase 3, 20/11): tudo cabe num ecrã, sem scroll.
 * A TV desenha sempre num ecrã virtual com pelo menos 1920×1080 e escala-o para o ecrã real
 * (720p fica igual a 1080p, só mais pequeno). Os tamanhos relativos do CSS usam `cqw`/`cqh`
 * (o palco é o contentor), que fora do palco — nos telemóveis — valem o mesmo que `svw`/`svh`.
 * Rede de segurança: se o conteúdo ainda passar da altura (nomes compridos, 10 jogadores…),
 * encolhe-se com `zoom` até caber (`data-encolhe` diz quanto; os testes Playwright vigiam-no).
 */
export const LARG_TV = 1920;
export const ALT_TV = 1080;

/** escala e tamanho virtual para um ecrã `w`×`h` (px CSS) com `zoom` no <html> (texto grande) */
export function medidasPalco(w: number, h: number, zoom = 1) {
  const s = Math.min(w / LARG_TV, h / ALT_TV);
  return { escala: s / zoom, largura: w / s, altura: h / s };
}

/** novo encolhimento: `k` atual, altura visível do conteúdo `v` e a do palco `h` (mesmas unidades) */
export function novoEncolhe(k: number, v: number, h: number): number {
  if (v <= 0 || h <= 0) return k;
  const natural = v / k;
  const novo = Math.min(1, h / natural);
  return Math.abs(novo - k) < 0.005 ? k : Math.floor(novo * 1000) / 1000;
}

function medir() {
  const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  return medidasPalco(innerWidth, innerHeight, z);
}

export function PalcoTv({ children }: { children: ComponentChildren }) {
  const [m, setM] = useState(medir);
  const [k, setK] = useState(1);
  const palco = useRef<HTMLDivElement>(null);
  const dentro = useRef<HTMLDivElement>(null);
  const kAtual = useRef(1);
  kAtual.current = k;

  useEffect(() => {
    const f = () => setM(medir());
    addEventListener('resize', f);
    return () => removeEventListener('resize', f);
  }, []);

  useLayoutEffect(() => {
    const p = palco.current;
    const d = dentro.current;
    if (!p || !d || typeof ResizeObserver === 'undefined') return;
    const ver = () => {
      const hp = p.getBoundingClientRect().height;
      const hd = d.getBoundingClientRect().height;
      setK(novoEncolhe(kAtual.current, hd, hp));
    };
    const ro = new ResizeObserver(ver);
    ro.observe(d);
    ver();
    return () => ro.disconnect();
  }, [m]);

  return (
    <div ref={palco} class="palco-tv" data-encolhe={k} style={{ width: `${m.largura}px`, height: `${m.altura}px`, transform: `scale(${m.escala})` }}>
      <div ref={dentro} class="palco-dentro" style={k < 1 ? { zoom: k } : undefined}>
        {children}
      </div>
    </div>
  );
}
