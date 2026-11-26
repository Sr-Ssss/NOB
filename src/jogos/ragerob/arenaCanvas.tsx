/**
 * A arena na TV, em canvas: o SVG refeito e repintado 60×/s era pesado demais para as TVs.
 * Os desenhos são os mesmos de `desenho.tsx`: `pintar` percorre o JSX e pinta-o no canvas (sem DOM).
 * Fundo, robôs e textos ficam guardados em imagens; os robôs só se repintam quando a pose muda.
 */
import type { ComponentChild } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { ArenaDentro, RoboSvg } from './desenho';
import { ALT, LARG } from './fisica';
import type { Arena, RoboArena } from './quadro';

type Ctx = CanvasRenderingContext2D;
type Props = Record<string, unknown>;

const caminhos = new Map<string, Path2D>();
/** só os contornos fixos se repetem; os que mudam a cada frame não podem encher a memória */
function caminho(d: string): Path2D {
  let p = caminhos.get(d);
  if (!p) {
    if (caminhos.size > 400) caminhos.clear();
    caminhos.set(d, (p = new Path2D(d)));
  }
  return p;
}

function transformar(x: Ctx, s: string) {
  for (const [, f, args] of s.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const [a, b, c] = args.trim().split(/[\s,]+/).map(Number);
    if (f === 'translate') x.translate(a, b || 0);
    else if (f === 'scale') x.scale(a, b ?? a);
    else if (f === 'rotate') {
      if (b !== undefined) x.translate(b, c);
      x.rotate((a * Math.PI) / 180);
      if (b !== undefined) x.translate(-b, -c);
    }
  }
}

/** pinta um nó JSX de SVG (só as formas e atributos que `desenho.tsx` usa; componentes sem hooks) */
export function pintar(x: Ctx, no: ComponentChild): void {
  if (no === null || no === undefined || typeof no !== 'object') return;
  if (Array.isArray(no)) {
    for (const f of no) pintar(x, f as ComponentChild);
    return;
  }
  const { type, props } = no as { type: unknown; props: Props };
  if (typeof type === 'function') return pintar(x, (type as (p: Props) => ComponentChild)(props));
  if (props.class === 'rr-palpebra') return; // olhos abertos
  const n = (k: string) => Number(props[k] ?? 0);
  const guarda = props.transform !== undefined || props.opacity !== undefined;
  if (guarda) {
    x.save();
    if (props.transform) transformar(x, String(props.transform));
    if (props.opacity !== undefined) x.globalAlpha *= Math.max(0, Math.min(1, n('opacity')));
  }
  if (type === 'g') pintar(x, props.children as ComponentChild);
  else {
    let p: Path2D | undefined;
    x.beginPath();
    if (type === 'path') p = caminho(String(props.d));
    else if (type === 'circle') x.arc(n('cx'), n('cy'), Math.max(0, n('r')), 0, Math.PI * 2);
    else if (type === 'ellipse') x.ellipse(n('cx'), n('cy'), n('rx'), n('ry'), 0, 0, Math.PI * 2);
    else if (type === 'line') {
      x.moveTo(n('x1'), n('y1'));
      x.lineTo(n('x2'), n('y2'));
    } else if (type === 'polygon') {
      for (const par of String(props.points).split(' ')) {
        const [a, b] = par.split(',').map(Number);
        x.lineTo(a, b);
      }
      x.closePath();
    } else if (type === 'rect') {
      const [a, b, w, h] = [n('x'), n('y'), n('width'), n('height')];
      const r = Math.min(n('rx'), w / 2, h / 2);
      if (r > 0) {
        x.moveTo(a + r, b);
        x.arcTo(a + w, b, a + w, b + h, r);
        x.arcTo(a + w, b + h, a, b + h, r);
        x.arcTo(a, b + h, a, b, r);
        x.arcTo(a, b, a + w, b, r);
        x.closePath();
      } else x.rect(a, b, w, h);
    }
    if (props.fill !== 'none' && type !== 'line') {
      const alfa = x.globalAlpha;
      if (props['fill-opacity'] !== undefined) x.globalAlpha = alfa * n('fill-opacity');
      x.fillStyle = (props.fill as string) ?? '#000';
      const regra = props['fill-rule'] === 'evenodd' ? 'evenodd' : 'nonzero';
      if (p) x.fill(p, regra);
      else x.fill(regra);
      x.globalAlpha = alfa;
    }
    if (props.stroke) {
      x.strokeStyle = props.stroke as string;
      x.lineWidth = Number(props['stroke-width'] ?? 1);
      x.lineJoin = (props['stroke-linejoin'] as CanvasLineJoin) ?? 'miter';
      x.lineCap = (props['stroke-linecap'] as CanvasLineCap) ?? 'butt';
      x.miterLimit = 4;
      x.setLineDash(props['stroke-dasharray'] ? String(props['stroke-dasharray']).split(' ').map(Number) : []);
      if (p) x.stroke(p);
      else x.stroke();
    }
  }
  if (guarda) x.restore();
}

function folha(w: number, h: number, escala: number): [HTMLCanvasElement, Ctx | null] {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * escala);
  c.height = Math.ceil(h * escala);
  const x = c.getContext('2d');
  x?.scale(escala, escala);
  return [c, x];
}

/** metade do lado da imagem de um robô (cabe a cabeça e os módulos) */
const M = 110;
const FONTE = "'Baloo 2', sans-serif";

/** o pintor de uma arena; as imagens guardadas valem para uma escala */
function novoPintor(x: Ctx, escala: number) {
  let fundo: HTMLCanvasElement | null = null;
  const robos = new Map<string, { pose: string; c: HTMLCanvasElement; x: Ctx | null }>();
  const textos = new Map<string, HTMLCanvasElement>();

  function robo(r: RoboArena, t: number) {
    const anima = (r.cabAnim !== undefined && t - r.cabAnim < 0.35 ? 1 : 0) as number;
    const mexe = !r.ko && (r.robo.loco === 'pernas' || (r.robo.cabeca === 'galo' && anima));
    // o que se mexe sem parar (pernas, lâmina, rolo) anda a 20 poses por segundo
    const pose = [
      r.ko,
      r.robo.modulos.join(),
      anima,
      mexe || (!r.ko && r.robo.cabeca === 'ourico' && r.giro > 0.05) ? Math.floor(t * 20) : '',
      r.giro > 0.75,
      r.disparou.map((d) => (t - d < 0.3 ? 1 : 0)).join(''),
    ].join('|');
    let s = robos.get(r.id);
    if (!s) {
      const [c, cx] = folha(M * 2, M * 2, escala);
      robos.set(r.id, (s = { pose: '', c, x: cx }));
    }
    if (s.pose !== pose && s.x) {
      s.pose = pose;
      s.x.clearRect(0, 0, M * 2, M * 2);
      s.x.save();
      s.x.translate(M, M);
      pintar(s.x, <RoboSvg robo={r.robo} e={r.ko ? {} : { t, cabAnim: r.cabAnim, giro: r.giro, fase: r.fase, disparou: r.disparou }} />);
      s.x.restore();
    }
    const p = r.corpo.position;
    x.save();
    x.translate(p.x, p.y);
    x.rotate(r.corpo.angle);
    if (r.ko) x.globalAlpha = 0.45;
    x.drawImage(s.c, -M, -M, M * 2, M * 2);
    x.restore();
  }

  /** texto centrado em (px, base) */
  function texto(s: string, px: number, base: number, tam: number, cor: string, contorno?: string) {
    const chave = `${tam}|${s}`;
    let c = textos.get(chave);
    if (!c) {
      if (textos.size > 60) textos.clear();
      const fonte = `700 ${tam}px ${FONTE}`;
      x.font = fonte;
      const [novo, tx] = folha(x.measureText(s).width + 12, 40, escala);
      c = novo;
      textos.set(chave, c);
      if (tx) {
        tx.font = fonte;
        tx.textAlign = 'center';
        const meio = c.width / escala / 2;
        if (contorno) {
          tx.strokeStyle = contorno;
          tx.lineWidth = 4;
          tx.lineJoin = 'round';
          tx.strokeText(s, meio, 28);
        }
        tx.fillStyle = cor;
        tx.fillText(s, meio, 28);
      }
    }
    const w = c.width / escala;
    x.drawImage(c, px - w / 2, base - 28, w, c.height / escala);
  }

  return (c: Arena, nomes: Record<string, string>, condutores: Record<string, string>) => {
    const t = c.t;
    if (!fundo) {
      const [f, fx] = folha(LARG, ALT, escala);
      if (fx) pintar(fx, <ArenaDentro parte="fundo" c={c} terra />);
      fundo = f;
    }
    x.drawImage(fundo, 0, 0, LARG, ALT);
    pintar(x, <ArenaDentro parte="chao" c={c} />);
    for (const r of c.robos) if (r.ko) robo(r, t);
    for (const r of c.robos) {
      if (r.ko) continue;
      robo(r, t);
      const { x: px, y: py } = r.corpo.position;
      const vida = Math.max(0, r.hp);
      x.fillStyle = '#3b2a1a';
      x.fillRect(px - 40, py - 74, 80, 9);
      x.strokeStyle = '#1a1a1a';
      x.lineWidth = 2;
      x.setLineDash([]);
      x.strokeRect(px - 40, py - 74, 80, 9);
      x.fillStyle = vida > 50 ? '#5fbf3a' : vida > 25 ? '#f2c230' : '#e0412b';
      x.fillRect(px - 40, py - 74, (80 * vida) / 100, 9);
      texto(nomes[r.id] ?? r.id, px, py - 80, 20, '#1a1a1a', '#efe2c4');
      const cond = condutores[r.id];
      if (cond) {
        x.fillStyle = '#1a1a1a';
        x.fillRect(px - 110, py + 45, 220, 28);
        texto(cond, px, py + 65, 18, '#f2c230');
      }
    }
    pintar(x, <ArenaDentro parte="cima" c={c} />);
  };
}

export type Desenhar = { current: (() => void) | null };

/** `desenhar` fica com a função que pinta um frame (chamada pelo ciclo do motor, sem passar pelo Preact) */
export function ArenaCanvas({ c, nomes, condutores, desenhar }: { c: Arena; nomes: Record<string, string>; condutores: Record<string, string>; desenhar: Desenhar }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dados = useRef({ c, nomes, condutores });
  dados.current = { c, nomes, condutores };
  useEffect(() => {
    const el = ref.current!;
    const x = el.getContext('2d', { alpha: false });
    if (!x) return;
    // até 1280 px de largura: chega para a TV e poupa a placa gráfica (4K seria 9× mais)
    const largura = () => Math.max(320, Math.min(1280, Math.round(el.clientWidth * (window.devicePixelRatio || 1))));
    let pinta: ReturnType<typeof novoPintor> | null = null;
    const ajustar = () => {
      const w = largura();
      if (pinta && el.width === w) return;
      el.width = w;
      el.height = Math.round((w * ALT) / LARG);
      pinta = novoPintor(x, w / LARG);
    };
    const pintaFrame = () => {
      const d = dados.current;
      const k = el.width / LARG;
      x.setTransform(k, 0, 0, k, 0, 0);
      pinta?.(d.c, d.nomes, d.condutores);
    };
    const refaz = () => {
      ajustar();
      pintaFrame();
    };
    refaz();
    window.addEventListener('resize', refaz);
    // a letra pode chegar depois: os textos guardados refazem-se
    let vivo = true;
    void document.fonts?.load(`700 20px ${FONTE}`).then(() => {
      if (!vivo) return;
      pinta = null;
      refaz();
    }, () => {});
    desenhar.current = pintaFrame;
    return () => {
      vivo = false;
      window.removeEventListener('resize', refaz);
      desenhar.current = null;
    };
  }, []);
  return <canvas ref={ref} class="rr-arena rr-arena-canvas" role="img" aria-label="Arena" />;
}
