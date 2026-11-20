/**
 * Ragerob sem TV (Fase 10, 20/11): a física corre no host (o telemóvel que tem a sala) e cada telemóvel mostra a
 * arena pequena por cima dos controlos. O host manda "quadros" (a arena num instante, compacta) ~8 vezes por segundo
 * (`rr_quadro`, só o host); os telemóveis desenham-nos e interpolam entre os dois últimos para andar suave.
 */
import type { EventoF, Efeito, PerigoF, Poca, Rasto } from './fisica';
import type { Robo } from './pecas';

/** um robô como o desenho da arena o lê (o `RoboF` da física serve) */
export interface RoboArena {
  id: string;
  robo: Robo;
  corpo: { position: { x: number; y: number }; angle: number };
  hp: number;
  ko: boolean;
  cabAnim: number;
  giro: number;
  fase: number;
  disparou: number[];
}

/** o que o desenho da arena lê (o `Combate` da física serve) */
export interface Arena {
  t: number;
  borda: number;
  rastos: Rasto[];
  perigos: PerigoF[];
  pocas: Poca[];
  parafusos: { x: number; y: number; cai: number }[];
  evento: EventoF | null;
  efeitos: Efeito[];
  robos: RoboArena[];
}

/** robô num quadro (sem o `Robo`, que já vem na vista) */
export interface RoboQ {
  id: string;
  x: number;
  y: number;
  a: number;
  hp: number;
  ko: boolean;
  cab: number;
  giro: number;
  fase: number;
  disp: number[];
}

export interface Quadro extends Omit<Arena, 'robos'> {
  robos: RoboQ[];
}

/** de quanto em quanto tempo o host manda um quadro (ms) */
export const T_QUADRO = 125;

const r1 = (x: number) => Math.round(x * 10) / 10;
const r3 = (x: number) => Math.round(x * 1000) / 1000;

/** a arena (da física) num quadro, com os números arredondados (menos bytes no canal) */
export function quadroDe(c: Arena): Quadro {
  return {
    t: r3(c.t),
    borda: r1(c.borda),
    rastos: c.rastos.map((x) => ({ x: r1(x.x), y: r1(x.y), a: r3(x.a), t: r3(x.t), loco: x.loco })),
    perigos: c.perigos.map((h) => ({ ...h, x: r1(h.x), y: r1(h.y), dir: r3(h.dir) })),
    pocas: c.pocas.map((p) => ({ ...p, x: r1(p.x), y: r1(p.y), r: r1(p.r), ate: r3(p.ate) })),
    parafusos: c.parafusos.map((b) => ({ x: r1(b.x), y: r1(b.y), cai: r3(b.cai) })),
    evento: c.evento ? { ...c.evento, x: r1(c.evento.x), y: r1(c.evento.y) } : null,
    efeitos: c.efeitos.map((e) => ({ ...e, x: r1(e.x), y: r1(e.y), a: r3(e.a), l: r1(e.l), t0: r3(e.t0), ate: r3(e.ate) })),
    robos: c.robos.map((r) => ({
      id: r.id,
      x: r1(r.corpo.position.x),
      y: r1(r.corpo.position.y),
      a: r3(r.corpo.angle),
      hp: r1(r.hp),
      ko: r.ko,
      cab: r3(r.cabAnim),
      giro: r3(r.giro),
      fase: r3(r.fase),
      disp: r.disparou.map(r3),
    })),
  };
}

/** o quadro pronto a desenhar (os robôs que a vista não conhece ficam de fora) */
export function arenaDe(q: Quadro, robos: readonly Robo[]): Arena {
  const lista: RoboArena[] = [];
  for (const r of q.robos) {
    const robo = robos.find((x) => x.id === r.id);
    if (robo) lista.push({ id: r.id, robo, corpo: { position: { x: r.x, y: r.y }, angle: r.a }, hp: r.hp, ko: r.ko, cabAnim: r.cab, giro: r.giro, fase: r.fase, disparou: r.disp });
  }
  return { ...q, robos: lista };
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** ângulo pelo caminho mais curto */
function lerpAng(a: number, b: number, k: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * k;
}

/** entre dois quadros (k de 0 = `a` a 1 = `b`): posições, ângulos e relógio interpolados; o resto é o de `b` */
export function entre(a: Quadro, b: Quadro, k: number): Quadro {
  const f = Math.max(0, Math.min(1, k));
  if (f >= 1) return b;
  return {
    ...b,
    t: lerp(a.t, b.t, f),
    borda: lerp(a.borda, b.borda, f),
    robos: b.robos.map((r) => {
      const o = a.robos.find((x) => x.id === r.id);
      if (!o || o.ko !== r.ko) return r;
      return { ...r, x: lerp(o.x, r.x, f), y: lerp(o.y, r.y, f), a: lerpAng(o.a, r.a, f), giro: lerp(o.giro, r.giro, f), fase: lerpAng(o.fase, r.fase, f) };
    }),
  };
}

/** o que vem no canal tem cara de quadro (só o host os manda, mas não custa ver) */
export function quadroValido(q: unknown): q is Quadro {
  if (!q || typeof q !== 'object') return false;
  const x = q as Partial<Quadro>;
  return typeof x.t === 'number' && typeof x.borda === 'number' && [x.rastos, x.perigos, x.pocas, x.parafusos, x.efeitos, x.robos].every(Array.isArray);
}
