import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../core/i18n';
import { ALTURA, CORES, GROSSURAS, LARGURA, MAX_BYTES, bytesTracos, simplificar, totalPontos, type Traco } from './tracos';

/** papel azul quadriculado (Ideias Mirabolantes): o preto passa a branco */
export const PLANTA = { fundo: "#1f4e8c", grelha: "rgba(255,255,255,0.18)", tinta: "#ffffff" };
export const corDe = (i: number, planta = false) => (planta && i === 0 ? PLANTA.tinta : (CORES[i] ?? CORES[0]));

/** pinta os traços num canvas; `ate` = nº de pontos a mostrar (animação); `planta` = papel azul quadriculado */
export function pintar(cv: HTMLCanvasElement, tracos: Traco[], ate = Infinity, planta = false) {
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const k = cv.width / LARGURA;
  ctx.fillStyle = planta ? PLANTA.fundo : '#fff';
  ctx.fillRect(0, 0, cv.width, cv.height);
  if (planta) {
    ctx.strokeStyle = PLANTA.grelha;
    ctx.lineWidth = 1;
    const passo = 20 * k;
    ctx.beginPath();
    for (let x = passo; x < cv.width; x += passo) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cv.height);
    }
    for (let y = passo; y < cv.height; y += passo) {
      ctx.moveTo(0, y);
      ctx.lineTo(cv.width, y);
    }
    ctx.stroke();
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  let falta = ate;
  for (const tr of tracos) {
    if (falta <= 0) break;
    const n = Math.min(tr.p.length / 2, falta);
    falta -= n;
    ctx.strokeStyle = corDe(tr.c, planta);
    ctx.fillStyle = ctx.strokeStyle;
    const w = (GROSSURAS[tr.g] ?? GROSSURAS[0]) * k;
    ctx.lineWidth = w;
    if (n === 1) {
      ctx.beginPath();
      ctx.arc(tr.p[0] * k, tr.p[1] * k, w / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(tr.p[0] * k, tr.p[1] * k);
    for (let i = 1; i < n; i++) ctx.lineTo(tr.p[2 * i] * k, tr.p[2 * i + 1] * k);
    ctx.stroke();
  }
}

/** só mostra (TV, Painel); `animar` = redesenha traço a traço em ~`ms` */
export function Quadro({ tracos, animar = false, ms = 2500, class: c = '', planta = false }: { tracos: Traco[]; animar?: boolean; ms?: number; class?: string; planta?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chave = JSON.stringify(tracos).length + ':' + tracos.length;
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const total = totalPontos(tracos);
    // sem animação: capturas (demo) e quem pediu menos movimento ao sistema
    const semAnim = (window as unknown as { nobSemAnimacao?: boolean }).nobSemAnimacao || matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!animar || !total || semAnim) return pintar(cv, tracos, Infinity, planta);
    const t0 = performance.now();
    let id = 0;
    const passo = (agora: number) => {
      const f = Math.min(1, (agora - t0) / ms);
      pintar(cv, tracos, Math.ceil(total * f), planta);
      if (f < 1) id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [chave, animar, planta]);
  return <canvas ref={ref} class={'tela ' + c} width={LARGURA * 2} height={ALTURA * 2} />;
}

/** editor do telemóvel: tela branca 4:3, 8 cores, 2 grossuras, desfazer e limpar */
export function Tela({ tracos, mudar, planta = false }: { tracos: Traco[]; mudar: (t: Traco[]) => void; planta?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [cor, setCor] = useState(0);
  const [g, setG] = useState(0);
  const atual = useRef<Traco | null>(null);
  const lista = useRef(tracos);
  lista.current = tracos;
  const cheio = bytesTracos(tracos) > MAX_BYTES - 400;

  useEffect(() => {
    if (ref.current) pintar(ref.current, tracos, Infinity, planta);
  }, [tracos, planta]);

  const ponto = (e: PointerEvent): [number, number] => {
    const r = ref.current!.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * LARGURA), Math.round(((e.clientY - r.top) / r.height) * ALTURA)];
  };
  const baixo = (e: PointerEvent) => {
    if (cheio) return;
    e.preventDefault();
    ref.current!.setPointerCapture?.(e.pointerId);
    atual.current = { c: cor, g, p: ponto(e) };
    pintar(ref.current!, [...lista.current, atual.current], Infinity, planta);
  };
  const mover = (e: PointerEvent) => {
    const a = atual.current;
    if (!a) return;
    const [x, y] = ponto(e);
    const n = a.p.length;
    if (Math.hypot(x - a.p[n - 2], y - a.p[n - 1]) < 2) return;
    a.p.push(Math.min(LARGURA, Math.max(0, x)), Math.min(ALTURA, Math.max(0, y)));
    pintar(ref.current!, [...lista.current, a], Infinity, planta);
  };
  const cima = () => {
    const a = atual.current;
    atual.current = null;
    if (!a) return;
    const novo = [...lista.current, { ...a, p: simplificar(a.p) }];
    if (bytesTracos(novo) <= MAX_BYTES) mudar(novo);
    else pintar(ref.current!, lista.current, Infinity, planta);
  };

  return (
    <div class="editor">
      <canvas
        ref={ref}
        class="tela"
        width={LARGURA * 2}
        height={ALTURA * 2}
        style={{ touchAction: 'none' }}
        onPointerDown={baixo}
        onPointerMove={mover}
        onPointerUp={cima}
        onPointerCancel={cima}
        onPointerLeave={cima}
      />
      {cheio && <div class="mini centro">{t('telaCheia')}</div>}
      <div class="ferramentas">
        <div class="cores">
          {CORES.map((c, i) => (
            <button key={c} class={'cor' + (cor === i ? ' on' : '')} style={{ background: corDe(i, planta) }} aria-label={t('telaCor', { n: i + 1 })} aria-pressed={cor === i} onClick={() => setCor(i)} />
          ))}
        </div>
        <div class="acoes">
          {GROSSURAS.map((w, i) => (
            <button key={w} class={'ferr' + (g === i ? ' on' : '')} aria-label={i ? t('telaGrosso') : t('telaFino')} aria-pressed={g === i} onClick={() => setG(i)}>
              <span class="ponta" style={{ width: `${6 + i * 12}px`, height: `${6 + i * 12}px`, background: corDe(cor, planta) }} />
            </button>
          ))}
          <button class="ferr" aria-label={t('telaDesfazer')} disabled={!tracos.length} onClick={() => mudar(tracos.slice(0, -1))}>
            ↶
          </button>
          <button class="ferr" aria-label={t('telaLimpar')} disabled={!tracos.length} onClick={() => mudar([])}>
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}
