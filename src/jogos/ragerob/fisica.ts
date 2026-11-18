import Matter from 'matter-js';
import { baralhar } from '../../core/ids';
import { direcaoEncaixe, type Evento, type Perigo, type Robo } from './pecas';

/**
 * Física do combate (só na TV, que é o host). Vista de cima, sem gravidade (Matter.js).
 * O reducer não sabe nada disto: recebe só as vidas (`rr_vidas`) e o fim (`rr_fim`).
 * Regras: info/jogos/rinha-de-robos.md → Cabeças, Módulos, Combos, Perigos, Eventos. Nada mata de uma vez;
 * tudo o que dá dano tem aviso antes. Depois de T_COMBATE a arena encolhe a arder até sobrar um (ou nenhum).
 */

export const LARG = 1200;
export const ALT = 760;
export const R = 34;
const DT = 1 / 60;
const D2R = Math.PI / 180;

export interface ComandoF {
  f: number;
  r: number;
}

export type TipoPoca = 'oleo' | 'fogo' | 'agua' | 'eletrica' | 'vapor';
export interface Poca {
  tipo: TipoPoca;
  x: number;
  y: number;
  r: number;
  ate: number;
}

export type TipoEfeito = 'faisca' | 'explosao' | 'chamas' | 'raio' | 'jato' | 'pancada' | 'parafuso' | 'impacto';
export interface Efeito {
  tipo: TipoEfeito;
  x: number;
  y: number;
  a: number;
  /** alcance (chamas, raio, jato) ou raio (explosão) */
  l: number;
  t0: number;
  ate: number;
}

export interface PerigoF {
  tipo: Perigo;
  x: number;
  y: number;
  w: number;
  h: number;
  /** tapete: sentido; pistão/parede: lado para onde aponta (rad) */
  dir: number;
  /** 'off' | 'aviso' | 'on' (serra, espinhos, pistão, martelo) */
  estado: 'off' | 'aviso' | 'on';
  /** martelo que cai: onde vai bater */
  alvo?: { x: number; y: number };
}

export interface Rasto {
  x: number;
  y: number;
  a: number;
  t: number;
  loco: Robo['loco'];
}

export interface RoboF {
  id: string;
  robo: Robo;
  corpo: Matter.Body;
  hp: number;
  ko: boolean;
  dano: number;
  kos: number;
  ultimo: { id: string; t: number } | null;
  /** cooldown de cada encaixe (instante em que volta a poder) */
  pronto: number[];
  /** última vez que cada encaixe disparou (para a animação) */
  disparou: number[];
  /** cabeça */
  cabPronto: number;
  cabAnim: number;
  /** ouriço: rotação 0..1 e ângulo do mangual */
  giro: number;
  fase: number;
  /** crocodilo: quem está agarrado e até quando */
  agarra: { id: string; ate: number } | null;
  empurradoAte: number;
  chamasAte: number;
  /** picos: último toque por inimigo */
  toques: Record<string, number>;
  ia: { modo: 'ir' | 'recuar'; ate: number };
  humano: boolean;
}

export interface EventoF {
  tipo: Evento;
  x: number;
  y: number;
  ini: number;
  ate: number;
}

const PARAM: Record<Robo['loco'], { vel: number; grip: number; rodar: number; dens: number }> = {
  rodas: { vel: 6.2, grip: 0.05, rodar: 0.075, dens: 0.0018 },
  lagartas: { vel: 3.4, grip: 0.22, rodar: 0.05, dens: 0.006 },
  pernas: { vel: 4.4, grip: 0.16, rodar: 0.06, dens: 0.0028 },
};

/** contorno da carroçaria (unidades do robô; frente = −y; centrado no centróide) */
export function contorno(corpo: Robo['corpo']): [number, number][] {
  const reg = (n: number, rot: number, k = 1) => Array.from({ length: n }, (_, i) => [Math.sin(rot + (i * 2 * Math.PI) / n) * k, -Math.cos(rot + (i * 2 * Math.PI) / n) * k] as [number, number]);
  if (corpo === 'triangulo') return reg(3, 0, 1.1);
  if (corpo === 'pentagono') return reg(5, 0, 1.02);
  if (corpo === 'quadrado') return [[-0.78, -0.78], [0.78, -0.78], [0.78, 0.78], [-0.78, 0.78]];
  if (corpo === 'retangulo') return [[-0.6, -1.05], [0.6, -1.05], [0.6, 1.05], [-0.6, 1.05]];
  return reg(16, 0, 0.95);
}

const angulo = (dx: number, dy: number) => Math.atan2(dx, -dy);
const difAng = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};
const frente = (a: number): [number, number] => [Math.sin(a), -Math.cos(a)];

export class Combate {
  engine = Matter.Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
  robos: RoboF[] = [];
  pocas: Poca[] = [];
  efeitos: Efeito[] = [];
  perigos: PerigoF[] = [];
  rastos: Rasto[] = [];
  parafusos: { x: number; y: number; cai: number }[] = [];
  evento: EventoF | null = null;
  proxEvento = 15;
  /** quanto a arena já encolheu (px a partir de cada borda) */
  borda = 0;
  t = 0;
  acabou = false;
  /** grupos por ordem de KO (o 1.º a cair no fim da lista) */
  quedas: string[][] = [];
  private seed: number;
  private tCombate: number;

  constructor(robos: Robo[], perigos: Perigo[], seed: number, tCombate = 90) {
    this.seed = seed;
    this.tCombate = tCombate;
    const paredes = [
      Matter.Bodies.rectangle(LARG / 2, -20, LARG, 40, { isStatic: true }),
      Matter.Bodies.rectangle(LARG / 2, ALT + 20, LARG, 40, { isStatic: true }),
      Matter.Bodies.rectangle(-20, ALT / 2, 40, ALT, { isStatic: true }),
      Matter.Bodies.rectangle(LARG + 20, ALT / 2, 40, ALT, { isStatic: true }),
    ];
    Matter.Composite.add(this.engine.world, paredes);
    const cantos: [number, number][] = [[260, 220], [LARG - 260, ALT - 220], [LARG - 260, 220], [260, ALT - 220]];
    robos.forEach((robo, i) => {
      const [x, y] = cantos[i % 4];
      const p = PARAM[robo.loco];
      const verts = contorno(robo.corpo).map(([vx, vy]) => ({ x: vx * R, y: vy * R }));
      const corpo =
        robo.corpo === 'bola'
          ? Matter.Bodies.circle(x, y, R * 0.95, { density: p.dens, frictionAir: 0.02, restitution: 0.4, friction: 0.05 })
          : Matter.Bodies.fromVertices(x, y, [verts], { density: p.dens, frictionAir: 0.02, restitution: 0.4, friction: 0.05 });
      Matter.Body.setAngle(corpo, angulo(LARG / 2 - x, ALT / 2 - y));
      Matter.Composite.add(this.engine.world, corpo);
      this.robos.push({
        id: robo.id, robo, corpo, hp: 100, ko: false, dano: 0, kos: 0, ultimo: null,
        pronto: robo.modulos.map(() => 1 + this.rnd() * 1.5), disparou: robo.modulos.map(() => -9),
        cabPronto: 0, cabAnim: -9, giro: 0, fase: 0, agarra: null, empurradoAte: -9, chamasAte: -9, toques: {}, ia: { modo: 'ir', ate: 0 }, humano: false,
      });
    });
    this.montarPerigos(perigos);
  }

  /** mulberry32 (a seed do combate vem do reducer) */
  private rnd(): number {
    let x = (this.seed = (this.seed + 0x6d2b79f5) >>> 0);
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  }

  private montarPerigos(lista: Perigo[]) {
    const livres: [number, number][] = [[LARG / 2, ALT / 2], [LARG / 2 - 260, ALT / 2 + 40], [LARG / 2 + 260, ALT / 2 - 40], [LARG / 2, 150], [LARG / 2, ALT - 150]];
    const pos = baralhar(livres, this.seed + 3);
    let i = 0;
    for (const tipo of lista) {
      if (tipo === 'parede') {
        const cima = this.rnd() < 0.5;
        this.perigos.push({ tipo, x: LARG / 2 - 170 + this.rnd() * 340, y: cima ? 14 : ALT - 14, w: 300, h: 22, dir: cima ? Math.PI : 0, estado: 'on' });
      } else if (tipo === 'pistao') {
        const esq = this.rnd() < 0.5;
        this.perigos.push({ tipo, x: esq ? 14 : LARG - 14, y: ALT / 2 - 150 + this.rnd() * 300, w: 22, h: 150, dir: esq ? Math.PI / 2 : -Math.PI / 2, estado: 'off' });
      } else if (tipo === 'martelo') {
        this.perigos.push({ tipo, x: 0, y: 0, w: 110, h: 110, dir: 0, estado: 'off' });
      } else {
        const [x, y] = pos[i++ % pos.length];
        const tam: Record<string, [number, number]> = { serra: [76, 76], espinhos: [130, 130], tapete: [380, 84], prato: [190, 190] };
        const [w, h] = tam[tipo];
        this.perigos.push({ tipo, x, y, w, h, dir: this.rnd() < 0.5 ? 1 : -1, estado: tipo === 'tapete' || tipo === 'prato' ? 'on' : 'off' });
      }
    }
  }

  vivos(): RoboF[] {
    return this.robos.filter((r) => !r.ko);
  }

  /** limite da zona segura (arena a encolher) */
  private dentro(x: number, y: number, folga = 0): boolean {
    const b = this.borda;
    return x > b - folga && x < LARG - b + folga && y > b * 0.63 - folga && y < ALT - b * 0.63 + folga;
  }

  private ferir(alvo: RoboF, valor: number, de: RoboF | null, ox?: number, oy?: number) {
    if (alvo.ko || valor <= 0) return;
    // escudo: bloqueia o que vem desse lado
    if (ox !== undefined && oy !== undefined) {
      const vindo = angulo(ox - alvo.corpo.position.x, oy - alvo.corpo.position.y);
      for (let k = 0; k < alvo.robo.modulos.length; k++) {
        if (alvo.robo.modulos[k] !== 'escudo') continue;
        const d = alvo.corpo.angle + direcaoEncaixe(alvo.robo.corpo, k);
        if (Math.abs(difAng(vindo, d)) < 55 * D2R) {
          this.efeito('faisca', (ox + alvo.corpo.position.x) / 2, (oy + alvo.corpo.position.y) / 2, d, 20, 0.3);
          return;
        }
      }
    }
    alvo.hp = Math.max(0, alvo.hp - valor);
    if (de && de !== alvo) {
      de.dano += valor;
      alvo.ultimo = { id: de.id, t: this.t };
    }
  }

  private empurrar(r: RoboF, dx: number, dy: number, forca: number) {
    const l = Math.hypot(dx, dy) || 1;
    const massa = r.robo.loco === 'lagartas' ? 0.55 : 1;
    Matter.Body.setVelocity(r.corpo, { x: r.corpo.velocity.x + (dx / l) * forca * massa, y: r.corpo.velocity.y + (dy / l) * forca * massa });
  }

  private efeito(tipo: TipoEfeito, x: number, y: number, a: number, l: number, dur: number) {
    this.efeitos.push({ tipo, x, y, a, l, t0: this.t, ate: this.t + dur });
  }

  private poca(tipo: TipoPoca, x: number, y: number, r: number, dur: number) {
    this.pocas.push({ tipo, x, y, r, ate: this.t + dur });
    if (this.pocas.length > 40) this.pocas.shift();
  }

  /** inimigos num setor (a partir do centro do robô) */
  private noSetor(r: RoboF, dir: number, cone: number, alcance: number): RoboF[] {
    const p = r.corpo.position;
    return this.vivos().filter((o) => {
      if (o === r) return false;
      const dx = o.corpo.position.x - p.x;
      const dy = o.corpo.position.y - p.y;
      return Math.hypot(dx, dy) < alcance && Math.abs(difAng(angulo(dx, dy), dir)) < cone;
    });
  }

  private pocasEm(x: number, y: number, raio: number, tipos: TipoPoca[]): Poca[] {
    return this.pocas.filter((q) => tipos.includes(q.tipo) && Math.hypot(q.x - x, q.y - y) < q.r + raio);
  }

  /** acender óleo numa zona (lança-chamas, fogo de artifício, chuva) */
  private acender(x: number, y: number, raio: number) {
    for (const q of this.pocasEm(x, y, raio, ['oleo'])) {
      q.tipo = 'fogo';
      q.ate = this.t + 5;
    }
  }

  private cabeca(r: RoboF) {
    const p = r.corpo.position;
    const a = r.corpo.angle;
    const [fx, fy] = frente(a);
    const hx = p.x + fx * R * 1.25;
    const hy = p.y + fy * R * 1.25;
    const alvos = this.vivos().filter((o) => o !== r && Math.hypot(o.corpo.position.x - hx, o.corpo.position.y - hy) < R + 14 && Math.abs(difAng(angulo(o.corpo.position.x - p.x, o.corpo.position.y - p.y), a)) < 50 * D2R);
    const tipo = r.robo.cabeca;
    if (tipo === 'ourico') {
      r.giro = Math.min(1, r.giro + DT / 3);
      r.fase += (1.2 + 7 * r.giro) * DT;
      const bx = p.x + Math.sin(r.fase) * 92;
      const by = p.y - Math.cos(r.fase) * 92;
      if (r.giro > 0.25) {
        for (const o of this.vivos()) {
          if (o === r || Math.hypot(o.corpo.position.x - bx, o.corpo.position.y - by) > R + 16) continue;
          // projeta os 2 robôs, com mais dano no inimigo
          this.ferir(o, 5 + 15 * r.giro, r, bx, by);
          this.empurrar(o, o.corpo.position.x - bx, o.corpo.position.y - by, 9 * r.giro + 3);
          this.empurrar(r, p.x - o.corpo.position.x, p.y - o.corpo.position.y, 4 * r.giro);
          this.ferir(r, 2 * r.giro, null);
          this.efeito('impacto', bx, by, 0, 26, 0.3);
          r.giro = 0;
          break;
        }
      }
      return;
    }
    if (!alvos.length) return;
    const o = alvos[0];
    if (tipo === 'galo') {
      // serra: dano contínuo
      this.ferir(o, 18 * DT, r, hx, hy);
      if (Math.floor(this.t * 10) % 2 === 0) this.efeito('faisca', hx, hy, a, 14, 0.12);
      r.cabAnim = this.t;
      return;
    }
    if (this.t < r.cabPronto) return;
    r.cabAnim = this.t;
    if (tipo === 'crocodilo') {
      this.ferir(o, 14, r, hx, hy);
      r.agarra = { id: o.id, ate: this.t + 1.2 };
      r.cabPronto = this.t + 2.2;
    } else if (tipo === 'rino') {
      const vel = r.corpo.velocity.x * fx + r.corpo.velocity.y * fy;
      if (vel < 1.5) return;
      this.ferir(o, Math.min(20, 4 + vel * 2.6), r, hx, hy);
      this.empurrar(o, fx, fy, 2 + vel * 0.6);
      this.efeito('impacto', hx, hy, a, 22, 0.25);
      r.cabPronto = this.t + 0.8;
    } else if (tipo === 'bode') {
      this.ferir(o, 4, r, hx, hy);
      this.empurrar(o, fx, fy, 11);
      o.empurradoAte = this.t + 1;
      r.cabPronto = this.t + 1.6;
    }
  }

  private modulos(r: RoboF) {
    const p = r.corpo.position;
    r.robo.modulos.forEach((m, k) => {
      if (!m) return;
      const dir = r.corpo.angle + direcaoEncaixe(r.robo.corpo, k);
      const [dx, dy] = frente(dir);
      const ex = p.x + dx * R;
      const ey = p.y + dy * R;
      if (m === 'picos') {
        for (const o of this.noSetor(r, dir, 50 * D2R, R * 2 + 8)) {
          if (this.t - (r.toques[o.id] ?? -9) < 0.6) continue;
          r.toques[o.id] = this.t;
          // empurrado contra os picos (Bode/Pistão) = dano extra
          this.ferir(o, o.empurradoAte > this.t ? 12 : 5, r, ex, ey);
          this.efeito('faisca', ex + dx * 10, ey + dy * 10, dir, 16, 0.2);
        }
        return;
      }
      if (m === 'escudo') return;
      if (m === 'chamas' && r.chamasAte > this.t && r.disparou[k] > this.t - 1) {
        for (const o of this.noSetor(r, dir, 22 * D2R, 160)) this.ferir(o, 16 * DT, r, ex, ey);
        this.acender(ex + dx * 80, ey + dy * 80, 70);
        return;
      }
      if (this.t < r.pronto[k]) return;
      const disparar = (cd: number) => {
        r.pronto[k] = this.t + cd;
        r.disparou[k] = this.t;
      };
      if (m === 'oleo') {
        this.poca('oleo', ex + dx * 34, ey + dy * 34, 44, 14);
        disparar(6);
      } else if (m === 'martelo') {
        const alvos = this.noSetor(r, dir, 32 * D2R, R * 2 + 52);
        if (!alvos.length) return;
        for (const o of alvos) this.ferir(o, 18, r, ex, ey);
        this.efeito('pancada', ex + dx * 40, ey + dy * 40, dir, 30, 0.35);
        disparar(2.8);
      } else if (m === 'chamas') {
        if (!this.noSetor(r, dir, 25 * D2R, 150).length) return;
        r.chamasAte = this.t + 1;
        this.efeito('chamas', ex, ey, dir, 160, 1);
        disparar(4);
      } else if (m === 'propulsor') {
        // empurra o robô para o lado contrário: dispara quando há um inimigo desse lado
        if (!this.noSetor(r, dir + Math.PI, 28 * D2R, 420).length) return;
        this.empurrar(r, -dx, -dy, 12);
        this.efeito('jato', ex, ey, dir, 50, 0.4);
        disparar(4);
      } else if (m === 'fogos') {
        const alvos = this.noSetor(r, dir, 45 * D2R, 280);
        if (!alvos.length) return;
        const o = alvos[0];
        const x = o.corpo.position.x;
        const y = o.corpo.position.y;
        for (const v of this.vivos()) if (v !== r && Math.hypot(v.corpo.position.x - x, v.corpo.position.y - y) < 64) this.ferir(v, 12, r, x, y);
        this.acender(x, y, 64);
        this.efeito('explosao', x, y, 0, 64, 0.6);
        disparar(6);
      } else if (m === 'pistao') {
        const alvos = this.noSetor(r, dir, 32 * D2R, R * 2 + 46);
        if (!alvos.length) return;
        for (const o of alvos) {
          this.ferir(o, 4, r, ex, ey);
          this.empurrar(o, dx, dy, 11);
          o.empurradoAte = this.t + 1;
        }
        disparar(2);
      } else if (m === 'agua') {
        const alvos = this.noSetor(r, dir, 25 * D2R, 190);
        if (!alvos.length) return;
        const o = alvos[0];
        this.empurrar(o, dx, dy, 5);
        // apaga o fogo (vapor) e deixa poça de água
        for (const q of this.pocasEm(ex + dx * 90, ey + dy * 90, 90, ['fogo'])) {
          q.tipo = 'vapor';
          q.ate = this.t + 3;
        }
        this.poca('agua', o.corpo.position.x, o.corpo.position.y, 42, 12);
        this.efeito('jato', ex, ey, dir, Math.hypot(o.corpo.position.x - ex, o.corpo.position.y - ey), 0.5);
        disparar(4);
      } else if (m === 'bobina') {
        const alvos = this.noSetor(r, dir, 20 * D2R, 120);
        const fx = ex + dx * 90;
        const fy = ey + dy * 90;
        const agua = this.pocasEm(fx, fy, 30, ['agua']);
        if (!alvos.length && !agua.length) return;
        for (const o of alvos) this.ferir(o, 9, r, ex, ey);
        // água + bobina = poça eletrificada
        for (const q of agua) {
          q.tipo = 'eletrica';
          q.ate = this.t + 4;
        }
        this.efeito('raio', ex, ey, dir, 100, 0.25);
        disparar(3);
      }
    });
  }

  private perigosPasso() {
    for (const h of this.perigos) {
      const ciclo = (per: number, aviso: number, on: number, off = 0) => {
        const c = (this.t + off) % per;
        h.estado = c < per - aviso - on ? 'off' : c < per - on ? 'aviso' : 'on';
      };
      if (h.tipo === 'serra') ciclo(5, 1, 3);
      if (h.tipo === 'espinhos') ciclo(5, 1, 1.5, 2);
      if (h.tipo === 'pistao') ciclo(4, 1, 0.4, 1);
      if (h.tipo === 'martelo') {
        const antes = h.estado;
        ciclo(6, 1, 0.3, 3);
        if (h.estado === 'aviso' && antes === 'off') {
          const vivos = this.vivos();
          const o = vivos[Math.floor(this.rnd() * vivos.length)];
          if (o) h.alvo = { x: o.corpo.position.x, y: o.corpo.position.y };
        }
        if (h.estado === 'on' && antes !== 'on' && h.alvo) {
          for (const o of this.vivos()) if (Math.hypot(o.corpo.position.x - h.alvo.x, o.corpo.position.y - h.alvo.y) < 58) this.ferir(o, 18, null);
          this.efeito('pancada', h.alvo.x, h.alvo.y, 0, 58, 0.4);
        }
      }
      for (const o of this.vivos()) {
        const p = o.corpo.position;
        const chao = o.robo.loco !== 'pernas';
        const dentroRet = Math.abs(p.x - h.x) < h.w / 2 + R * 0.6 && Math.abs(p.y - h.y) < h.h / 2 + R * 0.6;
        if (h.tipo === 'serra' && h.estado === 'on' && chao && Math.hypot(p.x - h.x, p.y - h.y) < h.w / 2 + R * 0.8) {
          this.ferir(o, 14 * DT, null);
          if (Math.floor(this.t * 8) % 2 === 0) this.efeito('faisca', p.x, p.y, 0, 14, 0.12);
        }
        if (h.tipo === 'espinhos' && h.estado === 'on' && chao && dentroRet) this.ferir(o, 10 * DT, null);
        if (h.tipo === 'parede' && dentroRet && this.t - (o.toques['parede'] ?? -9) > 0.7) {
          o.toques['parede'] = this.t;
          this.ferir(o, 6, null);
          this.empurrar(o, 0, h.y < ALT / 2 ? 1 : -1, 5);
          this.efeito('faisca', p.x, h.y, 0, 16, 0.2);
        }
        if (h.tipo === 'pistao' && h.estado === 'on' && Math.abs(p.y - h.y) < h.h / 2 + R && Math.abs(p.x - h.x) < 120) this.empurrar(o, h.x < LARG / 2 ? 1 : -1, 0, 1.4);
        if (h.tipo === 'tapete' && dentroRet && chao) {
          const forca = o.robo.loco === 'lagartas' ? 0.08 : 0.32;
          Matter.Body.setVelocity(o.corpo, { x: o.corpo.velocity.x + h.dir * forca, y: o.corpo.velocity.y });
        }
        if (h.tipo === 'prato' && Math.hypot(p.x - h.x, p.y - h.y) < h.w / 2) {
          Matter.Body.setAngularVelocity(o.corpo, o.corpo.angularVelocity + 0.012 * h.dir);
          const tang = angulo(p.x - h.x, p.y - h.y) + (Math.PI / 2) * h.dir;
          const [tx, ty] = frente(tang);
          Matter.Body.setVelocity(o.corpo, { x: o.corpo.velocity.x + tx * 0.12, y: o.corpo.velocity.y + ty * 0.12 });
        }
      }
    }
  }

  private eventos() {
    const fimNormal = this.t >= this.tCombate;
    if (!fimNormal && this.t >= this.proxEvento && !this.evento) {
      const tipos: Evento[] = ['ima', 'parafusos', 'encolher'];
      const tipo = tipos[Math.floor(this.rnd() * 3)];
      const dur = tipo === 'ima' ? 4 : tipo === 'parafusos' ? 4 : 10;
      this.evento = { tipo, x: LARG / 2 + (this.rnd() - 0.5) * 500, y: ALT / 2 + (this.rnd() - 0.5) * 300, ini: this.t, ate: this.t + 1.5 + dur };
      this.proxEvento = this.t + 24;
    }
    const e = this.evento;
    // a borda: durante "arena a encolher" e, depois do tempo, sempre a avançar
    const alvo = fimNormal ? Math.min(LARG / 2 - 70, (this.t - this.tCombate) * 16 + 60) : e?.tipo === 'encolher' && this.t > e.ini + 1.5 ? 130 : 0;
    this.borda += Math.sign(alvo - this.borda) * Math.min(Math.abs(alvo - this.borda), 60 * DT);
    if (e && this.t > e.ate) this.evento = null;
    if (e && this.t > e.ini + 1.5) {
      if (e.tipo === 'ima') for (const o of this.vivos()) this.empurrar(o, e.x - o.corpo.position.x, e.y - o.corpo.position.y, 0.35);
      if (e.tipo === 'parafusos' && Math.floor(this.t / DT) % 12 === 0) {
        this.parafusos.push({ x: 120 + this.rnd() * (LARG - 240), y: 100 + this.rnd() * (ALT - 200), cai: this.t + 0.7 });
      }
    }
    // parafusos: sombra 0,7 s antes, depois batem
    this.parafusos = this.parafusos.filter((b) => {
      if (this.t < b.cai) return true;
      for (const o of this.vivos()) if (Math.hypot(o.corpo.position.x - b.x, o.corpo.position.y - b.y) < R + 12) this.ferir(o, 3, null);
      this.efeito('parafuso', b.x, b.y, 0, 14, 0.4);
      return false;
    });
    // fogo nas bordas
    if (this.borda > 4) for (const o of this.vivos()) if (!this.dentro(o.corpo.position.x, o.corpo.position.y)) this.ferir(o, (fimNormal ? 15 : 8) * DT, null);
  }

  private pocasPasso() {
    this.pocas = this.pocas.filter((q) => q.ate > this.t);
    for (const o of this.vivos()) {
      for (const q of this.pocasEm(o.corpo.position.x, o.corpo.position.y, R * 0.4, ['fogo', 'eletrica'])) {
        // a poça eletrificada também apanha o próprio robô
        this.ferir(o, (q.tipo === 'fogo' ? 9 : 12) * DT, null);
      }
    }
  }

  /** IA: para onde ir e como (personalidade da cabeça) */
  private ia(r: RoboF): ComandoF {
    const p = r.corpo.position;
    const outros = this.vivos().filter((o) => o !== r);
    if (!outros.length) return { f: 0, r: 0 };
    const alvo = outros.reduce((a, b) => (Math.hypot(a.corpo.position.x - p.x, a.corpo.position.y - p.y) < Math.hypot(b.corpo.position.x - p.x, b.corpo.position.y - p.y) ? a : b));
    let gx = alvo.corpo.position.x;
    let gy = alvo.corpo.position.y;
    const dist = Math.hypot(gx - p.x, gy - p.y);
    let rec = false;
    const perigo = (x: number, y: number) =>
      !this.dentro(x, y, -30) || this.pocasEm(x, y, 10, ['fogo', 'eletrica']).length > 0 || this.perigos.some((h) => h.tipo === 'serra' && h.estado !== 'off' && Math.hypot(x - h.x, y - h.y) < h.w);
    if (perigo(p.x, p.y)) {
      gx = LARG / 2;
      gy = ALT / 2;
    } else if (r.robo.cabeca === 'rino') {
      // investe de longe: recua, depois carrega
      if (r.ia.modo === 'ir' && dist < 110 && this.t > r.cabPronto) r.ia = { modo: 'recuar', ate: this.t + 1.1 };
      if (r.ia.modo === 'recuar' && this.t > r.ia.ate) r.ia = { modo: 'ir', ate: 0 };
      rec = r.ia.modo === 'recuar';
    } else if (r.robo.cabeca === 'bode') {
      // atira os outros contra perigos: põe-se do lado oposto ao perigo mais próximo do alvo
      const h = this.perigos.filter((x) => x.tipo !== 'martelo')[0];
      if (h && dist > 70) {
        const l = Math.hypot(gx - h.x, gy - h.y) || 1;
        gx += ((gx - h.x) / l) * 70;
        gy += ((gy - h.y) / l) * 70;
      }
    } else if (r.robo.cabeca === 'ourico') {
      // ganha rotação longe, depois ataca: mantém a distância do mangual
      if (r.giro < 0.8 && dist < 150) rec = true;
      else if (dist < 120) {
        const tang = angulo(gx - p.x, gy - p.y) + Math.PI / 2;
        const [tx, ty] = frente(tang);
        gx = p.x + tx * 100;
        gy = p.y + ty * 100;
      }
    }
    const quer = angulo(gx - p.x, gy - p.y);
    const d = difAng(quer, r.corpo.angle);
    return { f: rec ? -1 : Math.abs(d) < 0.9 ? 1 : 0.25, r: Math.abs(d) < 0.12 ? 0 : Math.sign(d) };
  }

  private mover(r: RoboF, c: ComandoF) {
    const pr = PARAM[r.robo.loco];
    const oleo = r.robo.loco !== 'pernas' && this.pocasEm(r.corpo.position.x, r.corpo.position.y, R * 0.4, ['oleo']).length > 0;
    const grip = oleo ? pr.grip * 0.12 : pr.grip;
    const [fx, fy] = frente(r.corpo.angle);
    const v = c.f * pr.vel;
    Matter.Body.setVelocity(r.corpo, { x: r.corpo.velocity.x + (fx * v - r.corpo.velocity.x) * grip, y: r.corpo.velocity.y + (fy * v - r.corpo.velocity.y) * grip });
    Matter.Body.setAngularVelocity(r.corpo, r.corpo.angularVelocity + (c.r * pr.rodar - r.corpo.angularVelocity) * (oleo ? 0.05 : 0.3));
  }

  /** um passo de 1/60 s; `humanos`: robôs que têm alguém a conduzir agora */
  passo(humanos: Record<string, ComandoF | null>) {
    if (this.acabou) return;
    this.t += DT;
    for (const r of this.vivos()) {
      const h = humanos[r.id];
      r.humano = !!h;
      this.mover(r, h ?? this.ia(r));
      // crocodilo: o agarrado vai colado à boca
      if (r.agarra) {
        const o = this.robos.find((x) => x.id === r.agarra!.id);
        if (!o || o.ko || this.t > r.agarra.ate) r.agarra = null;
        else Matter.Body.setVelocity(o.corpo, { x: r.corpo.velocity.x, y: r.corpo.velocity.y });
      }
      if (Math.floor(this.t / DT) % 8 === 0 && Math.hypot(r.corpo.velocity.x, r.corpo.velocity.y) > 0.8) {
        this.rastos.push({ x: r.corpo.position.x, y: r.corpo.position.y, a: r.corpo.angle, t: this.t, loco: r.robo.loco });
      }
    }
    for (const r of this.vivos()) {
      this.cabeca(r);
      this.modulos(r);
    }
    this.perigosPasso();
    this.pocasPasso();
    this.eventos();
    Matter.Engine.update(this.engine, DT * 1000);
    // quem caiu neste passo (ao mesmo tempo = empate)
    const caidos = this.vivos().filter((r) => r.hp <= 0);
    if (caidos.length) {
      for (const r of caidos) {
        r.ko = true;
        Matter.Composite.remove(this.engine.world, r.corpo);
        if (r.ultimo && this.t - r.ultimo.t < 6) {
          const quem = this.robos.find((x) => x.id === r.ultimo!.id);
          if (quem) quem.kos++;
        }
        this.efeito('explosao', r.corpo.position.x, r.corpo.position.y, 0, 50, 0.8);
      }
      this.quedas.unshift(caidos.map((r) => r.id));
    }
    this.efeitos = this.efeitos.filter((e) => e.ate > this.t);
    this.rastos = this.rastos.filter((x) => this.t - x.t < 2);
    if (this.vivos().length <= 1) this.acabou = true;
  }

  /** grupos por colocação (1.º primeiro) */
  ordem(): string[][] {
    const vivos = this.vivos().map((r) => r.id);
    return vivos.length ? [vivos, ...this.quedas] : this.quedas;
  }

  vidas(): Record<string, number> {
    return Object.fromEntries(this.robos.map((r) => [r.id, Math.ceil(r.hp)]));
  }
}
