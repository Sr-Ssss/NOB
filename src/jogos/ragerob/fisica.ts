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
  agarra: { id: string; ate: number; destino: { x: number; y: number; r: number } | null } | null;
  /** galo: golpes da serra já dados a cada inimigo desde o último empurrão */
  golpes: Record<string, number>;
  empurradoAte: number;
  chamasAte: number;
  /** picos: último toque por inimigo */
  toques: Record<string, number>;
  ia: EstadoIa;
  /** personalidade da IA (cada robô a sua, sorteada) */
  pers: Personalidade;
  /** depois de um impacto: escorrega (o knockback vê-se) até este instante */
  atordoado: number;
  /** tempo seguido em choque de frente com o alvo (para largar o empurra-empurra) */
  frenteAFrente: number;
  humano: boolean;
}

/** a IA: rodear pelo flanco → parar e alinhar a arma → atacar → recuar (e às vezes esquivar) */
export type ModoIa = 'rodear' | 'alinhar' | 'atacar' | 'recuar' | 'esquivar';
export interface EstadoIa {
  modo: ModoIa;
  ate: number;
  alvo: string | null;
  /** −1 = cabeça; senão o encaixe do módulo com que vai atacar */
  arma: number;
  /** lado por onde rodeia (1 = direita, −1 = esquerda) */
  lado: number;
  /** quando volta a escolher alvo */
  trocaAlvo: number;
}
/** galo: a serra dá um golpe a cada GALO_CADENCIA s; só ao GALO_GOLPES.º golpe no mesmo inimigo é que o empurra (se ficar fraco: 10) */
export const GALO_CADENCIA = 0.25;
export const GALO_DANO = 4.5;
export const GALO_GOLPES = 5;
/** crocodilo: quanto dura a mordida e a espera depois de largar (s) */
export const CROCO_MORDIDA = 4;
export const CROCO_ESPERA = 2;

export interface Personalidade {
  /** 0 = cauteloso, 1 = vai a tudo */
  agressivo: number;
  /** segundos a alinhar antes de atacar */
  paciencia: number;
  /** distância a que gosta de rodear */
  distancia: number;
  /** ângulo do flanco preferido (rad a partir das costas do alvo: 0 = por trás, π/2 = de lado) */
  flanco: number;
  /** vontade de usar um módulo em vez da cabeça */
  modulos: number;
  /** prefere o alvo mais fraco (1) ou o mais perto (0) */
  oportunista: number;
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
        cabPronto: 0, cabAnim: -9, giro: 0, fase: 0, agarra: null, golpes: {}, empurradoAte: -9, chamasAte: -9, toques: {},
        ia: { modo: 'rodear', ate: 2 + this.rnd() * 2, alvo: null, arma: -1, lado: this.rnd() < 0.5 ? 1 : -1, trocaAlvo: 0 },
        pers: {
          agressivo: this.rnd(),
          paciencia: 0.3 + this.rnd() * 0.8,
          distancia: 120 + this.rnd() * 110,
          flanco: (0.2 + this.rnd() * 0.7) * Math.PI * 0.6,
          modulos: 0.3 + this.rnd() * 0.6,
          oportunista: this.rnd(),
        },
        atordoado: 0, frenteAFrente: 0, humano: false,
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
    // peças sólidas da arena: os robôs batem nelas (a serra é um disco de ferro, a parede é uma barra)
    for (const h of this.perigos) {
      const op = { isStatic: true, restitution: 0.6, friction: 0.05, label: 'perigo' };
      if (h.tipo === 'serra') Matter.Composite.add(this.engine.world, Matter.Bodies.circle(h.x, h.y, h.w / 2, op));
      if (h.tipo === 'parede') Matter.Composite.add(this.engine.world, Matter.Bodies.rectangle(h.x, h.y, h.w, h.h, op));
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
    const massa = r.robo.loco === 'lagartas' ? 0.6 : 1;
    Matter.Body.setVelocity(r.corpo, { x: r.corpo.velocity.x + (dx / l) * forca * massa, y: r.corpo.velocity.y + (dy / l) * forca * massa });
    // pancadas a sério: o robô perde aderência um bocado e voa/escorrega (senão as rodas anulam logo o empurrão)
    if (forca >= 4) {
      r.atordoado = Math.max(r.atordoado, this.t + Math.min(0.7, 0.04 * forca * massa));
      Matter.Body.setAngularVelocity(r.corpo, r.corpo.angularVelocity + (this.rnd() - 0.5) * 0.02 * forca);
    }
  }

  /** choque: projeta os dois para lados opostos (o atacante leva menos) */
  private choque(a: RoboF, o: RoboF, forca: number, recuo = 0.35) {
    const dx = o.corpo.position.x - a.corpo.position.x;
    const dy = o.corpo.position.y - a.corpo.position.y;
    this.empurrar(o, dx, dy, forca);
    this.empurrar(a, -dx, -dy, forca * recuo);
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
      // tambor pequeno à frente (o ouriço enrolado a girar como um disco): ganha rotação devagar,
      // e no impacto projeta os 2 robôs (mais o inimigo); área pequena, dano moderado
      r.giro = Math.min(1, r.giro + DT / 3);
      r.fase += (2 + 18 * r.giro) * DT;
      if (r.giro > 0.25 && alvos.length) {
        const o = alvos[0];
        this.ferir(o, 2.3 + 7.5 * r.giro, r, hx, hy);
        this.empurrar(o, o.corpo.position.x - hx, o.corpo.position.y - hy, 12 * r.giro + 4);
        this.empurrar(r, -fx, -fy, 5 * r.giro);
        this.ferir(r, 1.5 * r.giro, null);
        this.efeito('impacto', hx, hy, a, 22, 0.3);
        r.cabAnim = this.t;
        r.giro = 0;
      }
      return;
    }
    if (!alvos.length) return;
    const o = alvos[0];
    if (tipo === 'galo') {
      // serra: golpes seguidos sem empurrar; ao fim de uns quantos, empurra o inimigo
      if (Math.floor(this.t * 10) % 2 === 0) this.efeito('faisca', hx, hy, a, 14, 0.12);
      if (this.t >= r.cabPronto) {
        r.cabPronto = this.t + GALO_CADENCIA;
        this.ferir(o, GALO_DANO, r, hx, hy);
        r.golpes[o.id] = (r.golpes[o.id] ?? 0) + 1;
        if (r.golpes[o.id] >= GALO_GOLPES) {
          r.golpes[o.id] = 0;
          this.choque(r, o, 5, 0.8);
        }
      }
      r.cabAnim = this.t;
      return;
    }
    if (this.t < r.cabPronto || r.agarra) return;
    r.cabAnim = this.t;
    if (tipo === 'crocodilo') {
      this.ferir(o, 14, r, hx, hy);
      // procura um perigo por perto para lá levar a presa (serra, picos, espinhos, fogo, água eletrificada)
      const destino = this.perigoPerto(o.corpo.position.x, o.corpo.position.y, 520);
      r.agarra = { id: o.id, ate: this.t + CROCO_MORDIDA, destino };
    } else if (tipo === 'rino') {
      const vel = r.corpo.velocity.x * fx + r.corpo.velocity.y * fy;
      if (vel < 1.5) {
        // encostado sem velocidade: só um empurrão para ganhar espaço
        this.choque(r, o, 4, 0.6);
        r.cabPronto = this.t + 0.6;
        return;
      }
      this.ferir(o, Math.min(24, 6 + vel * 3), r, hx, hy);
      this.empurrar(o, fx, fy, 5 + vel * 1.4);
      this.empurrar(r, -fx, -fy, 2 + vel * 0.3);
      this.efeito('impacto', hx, hy, a, 26, 0.3);
      r.cabPronto = this.t + 0.8;
    } else if (tipo === 'bode') {
      this.ferir(o, 6.5, r, hx, hy);
      this.empurrar(o, fx, fy, 18);
      o.empurradoAte = this.t + 1;
      this.efeito('impacto', hx, hy, a, 20, 0.25);
      r.cabPronto = this.t + 1.4;
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
        for (const o of alvos) {
          this.ferir(o, 18, r, ex, ey);
          this.empurrar(o, dx, dy, 7);
        }
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
          this.empurrar(o, dx, dy, 16);
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
          for (const o of this.vivos()) {
            const dx = o.corpo.position.x - h.alvo.x;
            const dy = o.corpo.position.y - h.alvo.y;
            if (Math.hypot(dx, dy) > 58) continue;
            this.ferir(o, 18, null);
            this.empurrar(o, dx || 1, dy, 11);
          }
          this.efeito('pancada', h.alvo.x, h.alvo.y, 0, 58, 0.4);
        }
      }
      for (const o of this.vivos()) {
        const p = o.corpo.position;
        const chao = o.robo.loco !== 'pernas';
        const dentroRet = Math.abs(p.x - h.x) < h.w / 2 + R * 0.6 && Math.abs(p.y - h.y) < h.h / 2 + R * 0.6;
        // serra a girar: morde e cospe o robô para fora (como ferro a tocar num disco)
        if (h.tipo === 'serra' && h.estado === 'on' && Math.hypot(p.x - h.x, p.y - h.y) < h.w / 2 + R + 8) {
          if (chao) this.ferir(o, 14 * DT, null);
          if (this.t - (o.toques['serra'] ?? -9) > 0.35) {
            o.toques['serra'] = this.t;
            // empurra para fora e um pouco de lado (o disco arrasta no sentido em que gira)
            const fora = angulo(p.x - h.x, p.y - h.y) + h.dir * 0.6;
            const [kx, ky] = frente(fora);
            this.empurrar(o, kx, ky, 10);
            this.efeito('faisca', (p.x + h.x) / 2, (p.y + h.y) / 2, fora, 20, 0.25);
          }
        }
        if (h.tipo === 'espinhos' && h.estado === 'on' && chao && dentroRet) {
          this.ferir(o, 10 * DT, null);
          if (this.t - (o.toques['espinhos'] ?? -9) > 0.5) {
            o.toques['espinhos'] = this.t;
            this.empurrar(o, p.x - h.x || 1, p.y - h.y, 6);
          }
        }
        if (h.tipo === 'parede' && Math.abs(p.x - h.x) < h.w / 2 + R && Math.abs(p.y - h.y) < h.h / 2 + R + 6 && this.t - (o.toques['parede'] ?? -9) > 0.6) {
          o.toques['parede'] = this.t;
          this.ferir(o, 6, null);
          this.empurrar(o, 0, h.y < ALT / 2 ? 1 : -1, 10);
          this.efeito('faisca', p.x, h.y, 0, 18, 0.2);
        }
        // pistão de parede: um soco seco quando sai (só empurra)
        if (h.tipo === 'pistao' && h.estado === 'on' && Math.abs(p.y - h.y) < h.h / 2 + R && Math.abs(p.x - h.x) < 120 && this.t - (o.toques['pistao'] ?? -9) > 0.5) {
          o.toques['pistao'] = this.t;
          this.empurrar(o, h.x < LARG / 2 ? 1 : -1, 0, 15);
        }
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

  /** o perigo que dá dano mais perto de (x, y), até `max` px (para o crocodilo arrastar a presa) */
  private perigoPerto(x: number, y: number, max: number): { x: number; y: number; r: number } | null {
    const lista: { x: number; y: number; r: number }[] = [];
    for (const h of this.perigos) {
      if (h.tipo === 'serra') lista.push({ x: h.x, y: h.y, r: h.w / 2 + 6 });
      if (h.tipo === 'espinhos') lista.push({ x: h.x, y: h.y, r: h.w / 2 - 10 });
      if (h.tipo === 'parede') lista.push({ x: Math.max(h.x - h.w / 2 + 30, Math.min(h.x + h.w / 2 - 30, x)), y: h.y + (h.y < ALT / 2 ? 14 : -14), r: 24 });
    }
    for (const q of this.pocas) if (q.tipo === 'fogo' || q.tipo === 'eletrica') lista.push({ x: q.x, y: q.y, r: q.r * 0.6 });
    let melhor: { x: number; y: number; r: number } | null = null;
    for (const d of lista) {
      const l = Math.hypot(d.x - x, d.y - y);
      if (l < max && (!melhor || l < Math.hypot(melhor.x - x, melhor.y - y))) melhor = d;
    }
    return melhor;
  }

  /** alcance a que cada arma dispara (−1 = cabeça) */
  private alcanceArma(r: RoboF, arma: number): number {
    if (arma < 0) return R * 2.4;
    const m = r.robo.modulos[arma];
    return { martelo: R * 2 + 40, pistao: R * 2 + 36, picos: R * 2 + 4, chamas: 130, agua: 160, bobina: 105, fogos: 240 }[m as string] ?? R * 2.4;
  }

  /** escolhe com que vai atacar: a cabeça ou um módulo que dispare para fora (cada robô tem o seu gosto) */
  private escolherArma(r: RoboF): number {
    const ofensivos = r.robo.modulos.map((m, k) => (m && ['martelo', 'pistao', 'chamas', 'agua', 'bobina', 'fogos', 'picos'].includes(m) && this.t >= r.pronto[k] ? k : -1)).filter((k) => k >= 0);
    if (!ofensivos.length || this.rnd() > r.pers.modulos) return -1;
    return ofensivos[Math.floor(this.rnd() * ofensivos.length)];
  }

  /** ângulo do corpo para a arma apontar ao ponto (os módulos têm direção fixa: mira-se com o corpo) */
  private mira(r: RoboF, arma: number, x: number, y: number): number {
    const dir = arma < 0 ? 0 : direcaoEncaixe(r.robo.corpo, arma);
    return angulo(x - r.corpo.position.x, y - r.corpo.position.y) - dir;
  }

  /** conduzir até um ponto (com marcha-atrás se estiver mesmo atrás e perto) */
  private irPara(r: RoboF, x: number, y: number, vel = 1): ComandoF {
    const p = r.corpo.position;
    const d = difAng(angulo(x - p.x, y - p.y), r.corpo.angle);
    const longe = Math.hypot(x - p.x, y - p.y);
    if (Math.abs(d) > 2.5 && longe < 120) return { f: -0.7 * vel, r: -Math.sign(d) };
    return { f: (Math.abs(d) < 0.6 ? 1 : Math.abs(d) < 1.3 ? 0.4 : 0) * vel, r: Math.abs(d) < 0.08 ? 0 : Math.sign(d) * Math.min(1, Math.abs(d) * 2) };
  }

  private mudar(r: RoboF, modo: ModoIa, dur: number) {
    r.ia = { ...r.ia, modo, ate: this.t + dur };
  }

  /**
   * IA (só quando ninguém conduz). Cada robô:
   * 1. **rodear** — vai a um ponto ao lado/atrás do alvo (lado e ângulo próprios), não de frente;
   * 2. **alinhar** — para e roda o corpo até a arma (cabeça ou módulo) apontar ao alvo;
   * 3. **atacar** — carrega a direito (cabeça) ou segura a mira (módulo);
   * 4. **recuar** — depois de bater, afasta-se e troca de lado (nada de empurra-empurra de frente);
   * e **esquiva** quando vê um inimigo a carregar de frente contra si.
   * As cabeças mudam o estilo: Rino carrega de longe, Ouriço gira à distância, Bode põe o alvo entre si e um perigo,
   * Croco e Galo procuram os flancos.
   */
  private ia(r: RoboF): ComandoF {
    const p = r.corpo.position;
    const outros = this.vivos().filter((o) => o !== r);
    if (!outros.length) return { f: 0, r: 0 };
    const ia = r.ia;
    const pers = r.pers;
    const cab = r.robo.cabeca;
    const distDe = (o: RoboF) => Math.hypot(o.corpo.position.x - p.x, o.corpo.position.y - p.y);

    // crocodilo com a presa na boca: leva-a até ao perigo (a presa vai à frente)
    if (r.agarra?.destino) {
      r.frenteAFrente = 0;
      return this.irPara(r, r.agarra.destino.x, r.agarra.destino.y, 0.9);
    }

    // fugir de perigos que dão dano (fogo, eletricidade, borda a arder, serra ligada)
    const perigo =
      !this.dentro(p.x, p.y, -30) ||
      this.pocasEm(p.x, p.y, 10, ['fogo', 'eletrica']).length > 0 ||
      this.perigos.some((h) => (h.tipo === 'serra' && h.estado !== 'off' && Math.hypot(p.x - h.x, p.y - h.y) < h.w) || (h.tipo === 'espinhos' && h.estado !== 'off' && Math.abs(p.x - h.x) < h.w / 2 + R && Math.abs(p.y - h.y) < h.h / 2 + R));
    if (perigo) return this.irPara(r, LARG / 2 + ia.lado * 60, ALT / 2);

    // alvo: o oportunista prefere o mais fraco; os outros o mais perto; mantém-no uns segundos
    let alvo = outros.find((o) => o.id === ia.alvo);
    if (!alvo || this.t > ia.trocaAlvo) {
      const nota = (o: RoboF) => distDe(o) * (1 - pers.oportunista * 0.6) + o.hp * 3 * pers.oportunista;
      alvo = outros.reduce((a, b) => (nota(a) < nota(b) ? a : b));
      r.ia = { ...ia, alvo: alvo.id, trocaAlvo: this.t + 4 + this.rnd() * 4 };
    }
    const ap = alvo.corpo.position;
    const dist = distDe(alvo);
    const paraMim = angulo(p.x - ap.x, p.y - ap.y);
    // o alvo está virado para mim e a vir depressa?
    const alvoOlha = Math.abs(difAng(alvo.corpo.angle, paraMim)) < 0.5;
    const vemContraMim = alvoOlha && alvo.corpo.velocity.x * Math.sin(paraMim) - alvo.corpo.velocity.y * Math.cos(paraMim) > 3.2;

    // empurra-empurra de frente: larga ao fim de pouco tempo
    const deFrente = dist < R * 2 + 16 && Math.abs(difAng(angulo(ap.x - p.x, ap.y - p.y), r.corpo.angle)) < 0.7 && alvoOlha;
    r.frenteAFrente = deFrente ? r.frenteAFrente + DT : 0;
    const limiteFrente = cab === 'galo' ? 0.9 : 0.45;
    if (r.frenteAFrente > limiteFrente && r.ia.modo !== 'recuar') {
      r.frenteAFrente = 0;
      r.ia.lado = this.rnd() < 0.7 ? -r.ia.lado : r.ia.lado;
      this.mudar(r, 'recuar', 0.5 + this.rnd() * 0.5);
    }

    // esquivar uma carga (os mais cautelosos esquivam mais)
    if (vemContraMim && dist < 230 && r.ia.modo !== 'esquivar' && r.ia.modo !== 'atacar' && this.rnd() < 0.01 + (1 - pers.agressivo) * 0.03) {
      r.ia.lado = this.rnd() < 0.5 ? 1 : -1;
      this.mudar(r, 'esquivar', 0.6 + this.rnd() * 0.3);
    }

    const m = r.ia;
    switch (m.modo) {
      case 'esquivar': {
        if (this.t > m.ate) this.mudar(r, 'rodear', 1.5 + this.rnd() * 1.5);
        const [sx, sy] = frente(angulo(ap.x - p.x, ap.y - p.y) + m.lado * Math.PI / 2);
        return this.irPara(r, p.x + sx * 150, p.y + sy * 150);
      }
      case 'recuar': {
        if (this.t > m.ate) {
          m.arma = this.escolherArma(r);
          this.mudar(r, 'rodear', 1.5 + this.rnd() * 2);
        }
        // marcha-atrás a curvar para o lado escolhido
        return { f: -1, r: m.lado * 0.7 };
      }
      case 'rodear': {
        // ponto de chegada: atrás/ao lado do alvo, à distância preferida (ou à distância da arma)
        let distPref = Math.max(this.alcanceArma(r, m.arma) * 0.85, cab === 'rino' && m.arma < 0 ? 240 : cab === 'ourico' ? 150 : pers.distancia);
        let ang = alvo.corpo.angle + Math.PI + m.lado * pers.flanco;
        if (cab === 'bode' && m.arma < 0) {
          // pôr o alvo entre mim e um perigo: vou para o lado oposto ao perigo
          const h = this.perigos.filter((x) => x.tipo !== 'martelo').sort((a, b) => Math.hypot(a.x - ap.x, a.y - ap.y) - Math.hypot(b.x - ap.x, b.y - ap.y))[0];
          if (h) ang = angulo(ap.x - h.x, ap.y - h.y);
          distPref = 150;
        }
        // ouriço: espera longe até o tambor ganhar rotação
        if (cab === 'ourico' && m.arma < 0 && r.giro < 0.75) distPref = Math.max(distPref, 200);
        const [ox, oy] = frente(ang);
        let gx = ap.x + ox * distPref;
        let gy = ap.y + oy * distPref;
        gx = Math.max(80 + this.borda, Math.min(LARG - 80 - this.borda, gx));
        gy = Math.max(70 + this.borda * 0.63, Math.min(ALT - 70 - this.borda * 0.63, gy));
        const chegou = Math.hypot(gx - p.x, gy - p.y) < 45;
        // demasiado perto sem estar de flanco: abre distância pelo lado
        if (dist < R * 2.6 && !chegou) {
          const [sx, sy] = frente(angulo(ap.x - p.x, ap.y - p.y) + m.lado * Math.PI * 0.6);
          return this.irPara(r, p.x + sx * 120, p.y + sy * 120);
        }
        if (cab === 'ourico' && m.arma < 0 && r.giro < 0.75) {
          // tambor ainda devagar: fica a rondar, sem atacar
          return this.irPara(r, gx, gy, 0.6);
        }
        if (chegou || this.t > m.ate) this.mudar(r, 'alinhar', pers.paciencia + (cab === 'rino' ? 0.4 : 0));
        return this.irPara(r, gx, gy, 0.6 + pers.agressivo * 0.4);
      }
      case 'alinhar': {
        // parado a rodar o corpo até a arma apontar ao alvo (prevê um pouco o movimento dele)
        const px = ap.x + alvo.corpo.velocity.x * 10;
        const py = ap.y + alvo.corpo.velocity.y * 10;
        const d = difAng(this.mira(r, m.arma, px, py), r.corpo.angle);
        if ((Math.abs(d) < 0.1 && this.t > m.ate - pers.paciencia * 0.5) || this.t > m.ate + 1.2) this.mudar(r, 'atacar', m.arma < 0 ? 0.9 + pers.agressivo * 0.9 : 1.4);
        // se o alvo fugir para longe, volta a rodear
        if (dist > 420) this.mudar(r, 'rodear', 2);
        return { f: 0, r: Math.abs(d) < 0.05 ? 0 : Math.sign(d) * Math.min(1, Math.abs(d) * 3) };
      }
      case 'atacar': {
        const acertou = m.arma < 0 ? this.t - r.cabAnim < 0.1 && cab !== 'galo' : this.t - (r.disparou[m.arma] ?? -9) < 0.1;
        const galoFeito = cab === 'galo' && this.t - r.cabAnim < 0.1 && this.t > m.ate - 0.2;
        if (acertou || galoFeito || this.t > m.ate) {
          r.ia.lado = this.rnd() < 0.6 ? -m.lado : m.lado;
          this.mudar(r, 'recuar', 0.4 + this.rnd() * 0.5 + (cab === 'rino' ? 0.5 : 0));
          return { f: -1, r: 0 };
        }
        const d = difAng(this.mira(r, m.arma, ap.x, ap.y), r.corpo.angle);
        if (m.arma < 0) {
          // carga a direito, a corrigir a pontaria
          return { f: Math.abs(d) < 0.8 ? 1 : 0.3, r: Math.abs(d) < 0.05 ? 0 : Math.sign(d) * Math.min(1, Math.abs(d) * 2.5) };
        }
        // módulo: segura a mira; aproxima/afasta só se estiver de frente/de costas para o alvo
        const alc = this.alcanceArma(r, m.arma);
        const dirMod = direcaoEncaixe(r.robo.corpo, m.arma);
        const frenteAoAlvo = Math.cos(dirMod);
        const f = Math.abs(frenteAoAlvo) > 0.5 ? Math.sign(frenteAoAlvo) * (dist > alc * 0.9 ? 0.6 : dist < alc * 0.5 ? -0.4 : 0) : 0;
        return { f, r: Math.abs(d) < 0.05 ? 0 : Math.sign(d) * Math.min(1, Math.abs(d) * 3) };
      }
    }
  }

  private mover(r: RoboF, c: ComandoF) {
    const pr = PARAM[r.robo.loco];
    const oleo = r.robo.loco !== 'pernas' && this.pocasEm(r.corpo.position.x, r.corpo.position.y, R * 0.4, ['oleo']).length > 0;
    const tonto = this.t < r.atordoado;
    const grip = (oleo ? pr.grip * 0.12 : pr.grip) * (tonto ? 0.08 : 1);
    const [fx, fy] = frente(r.corpo.angle);
    const v = c.f * pr.vel;
    Matter.Body.setVelocity(r.corpo, { x: r.corpo.velocity.x + (fx * v - r.corpo.velocity.x) * grip, y: r.corpo.velocity.y + (fy * v - r.corpo.velocity.y) * grip });
    Matter.Body.setAngularVelocity(r.corpo, r.corpo.angularVelocity + (c.r * pr.rodar - r.corpo.angularVelocity) * (oleo ? 0.05 : tonto ? 0.04 : 0.3));
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
        const g = r.agarra;
        const o = this.robos.find((x) => x.id === g.id);
        const op = o?.corpo.position;
        // chegou ao perigo: atira-o lá para dentro
        const noDestino = !!g.destino && !!op && Math.hypot(op.x - g.destino.x, op.y - g.destino.y) < g.destino.r + R * 0.6;
        if (!o || o.ko) {
          r.agarra = null;
          r.cabPronto = this.t + CROCO_ESPERA;
        } else if (this.t > g.ate || noDestino) {
          const [fx, fy] = g.destino ? [g.destino.x - op!.x, g.destino.y - op!.y] : frente(r.corpo.angle + r.ia.lado * Math.PI * 0.4);
          this.empurrar(o, fx, fy, 12);
          r.agarra = null;
          r.cabPronto = this.t + CROCO_ESPERA;
          r.ia = { ...r.ia, modo: 'recuar', ate: this.t + 0.7 };
        } else {
          // colado à boca: segue o crocodilo e é puxado para a frente dele
          const [fx, fy] = frente(r.corpo.angle);
          const bx = r.corpo.position.x + fx * R * 2.1;
          const by = r.corpo.position.y + fy * R * 2.1;
          Matter.Body.setVelocity(o.corpo, { x: r.corpo.velocity.x + (bx - op!.x) * 0.15, y: r.corpo.velocity.y + (by - op!.y) * 0.15 });
        }
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
