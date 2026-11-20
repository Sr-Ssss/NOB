import qrcode from 'qrcode-generator';
import { useMemo } from 'preact/hooks';

/** QR code em SVG (fundo branco, margem de 2 módulos) */
export function Qr({ texto, tam }: { texto: string; tam: number }) {
  const d = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(texto);
    q.make();
    const n = q.getModuleCount();
    let p = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) p += `M${x} ${y}h1v1h-1z`;
    return { p, n };
  }, [texto]);
  return (
    <svg class="qr" width={tam} height={tam} viewBox={`-2 -2 ${d.n + 4} ${d.n + 4}`} role="img" aria-label="QR">
      <rect x="-2" y="-2" width={d.n + 4} height={d.n + 4} fill="#fff" />
      <path d={d.p} fill="#1d1b26" />
    </svg>
  );
}

/** link para entrar na party; `k` = impressão digital do anfitrião: o telemóvel só aceita vistas assinadas por ele */
export function linkJogar(codigo: string, k: string): string {
  const base = (import.meta.env.VITE_LINK_JOGAR as string | undefined) ?? `${location.origin}${location.pathname}`;
  return `${base}#/jogar?sala=${codigo}${k ? `&k=${k}` : ''}`;
}
