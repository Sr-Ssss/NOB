/**
 * Obstáculos em perspetiva como estruturas de cartão que ligam as casas do grupo (estilo maquete de papel):
 * ruína (muros partidos e colunas), sebe, tronco caído com cepo, monte de pedras, bosque e lago.
 * Tudo em coordenadas do ecrã (já projetadas): `f` = escala da perspetiva nesse ponto.
 */
import type { JSX } from 'preact';
import { Recorte, type TipoObstaculo } from './artes/obstaculos';

export interface Ponto {
  x: number;
  y: number;
  f: number;
}

const TINTA = '#2b2a33';
const CARTAO = '#b9ad98';
const meio = (a: Ponto, b: Ponto): Ponto => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, f: (a.f + b.f) / 2 });
const lerp = (a: Ponto, b: Ponto, t: number): Ponto => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, f: a.f + (b.f - a.f) * t });
/** número "ao acaso" mas sempre igual para a mesma semente */
const sorte = (s: number, k: number) => ((Math.sin(s * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;

/** uma forma de cartão: espessura por trás, borda branca e o traço de lápis */
function Folha({ d, cor, f, linhas }: { d: string; cor: string; f: number; linhas?: string }) {
  return (
    <g stroke-linejoin="round" stroke-linecap="round">
      <path d={d} transform={`translate(${3 * f} ${2 * f})`} fill={CARTAO} stroke={CARTAO} stroke-width={12 * f} />
      <path d={d} fill="#fff" stroke="#fff" stroke-width={12 * f} />
      <path d={d} fill={cor} stroke={TINTA} stroke-width={3 * f} />
      {linhas && <path d={linhas} fill="none" stroke={TINTA} stroke-width={2 * f} opacity="0.75" />}
    </g>
  );
}

const pts = (l: [number, number][]) => l.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z';

/** muro de pé de A a B; `topo` dá a altura (0–1) ao longo do muro */
function muro(a: Ponto, b: Ponto, alto: number, topo: (t: number) => number, passos = 8) {
  const cima: [number, number][] = [];
  for (let i = passos; i >= 0; i--) {
    const q = lerp(a, b, i / passos);
    cima.push([q.x, q.y - alto * q.f * topo(i / passos)]);
  }
  return pts([[a.x, a.y], [b.x, b.y], ...cima]);
}

function Ruina({ p, ligacoes, s }: { p: Ponto[]; ligacoes: [number, number][]; s: number }) {
  const els: { y: number; el: JSX.Element }[] = [];
  ligacoes.forEach(([i, j], k) => {
    const [a, b] = p[i].y <= p[j].y ? [p[i], p[j]] : [p[j], p[i]];
    // topo partido: degraus e uma brecha
    const topo = (t: number) => Math.max(0.25, 0.55 + 0.45 * sorte(s + k, Math.round(t * 8)) - (Math.abs(t - sorte(s, k)) < 0.15 ? 0.35 : 0));
    const alto = 46;
    const tijolos = [0.3, 0.6]
      .map((h) => `M${a.x} ${a.y - alto * a.f * h}L${b.x} ${b.y - alto * b.f * h}`)
      .concat([0.2, 0.5, 0.8].map((t, n) => {
        const q = lerp(a, b, t);
        const h = n % 2 ? [0.3, 0.6] : [0, 0.3];
        return `M${q.x} ${q.y - alto * q.f * h[0]}L${q.x} ${q.y - alto * q.f * h[1]}`;
      }))
      .join('');
    els.push({ y: (a.y + b.y) / 2, el: <Folha key={`m${k}`} d={muro(a, b, alto, topo)} cor="#dcd2c2" f={a.f} linhas={tijolos} /> });
  });
  // colunas nas pontas (casas com só uma ligação), de alturas diferentes
  p.forEach((q, i) => {
    if (ligacoes.filter(([x, y]) => x === i || y === i).length > 1) return;
    const h = (44 + 14 * sorte(s, i + 9)) * q.f;
    const w = 9 * q.f;
    const d = pts([[q.x - w, q.y], [q.x + w, q.y], [q.x + w, q.y - h], [q.x + w * 1.4, q.y - h], [q.x + w * 1.4, q.y - h - 8 * q.f], [q.x - w * 1.4, q.y - h - 8 * q.f], [q.x - w * 1.4, q.y - h], [q.x - w, q.y - h]]);
    els.push({ y: q.y + 0.1, el: <Folha key={`c${i}`} d={d} cor="#e3dacb" f={q.f} linhas={`M${q.x - w / 3} ${q.y - 4 * q.f}L${q.x - w / 3} ${q.y - h + 4 * q.f}M${q.x + w / 3} ${q.y - 4 * q.f}L${q.x + w / 3} ${q.y - h + 4 * q.f}`} /> });
  });
  return <>{els.sort((x, y) => x.y - y.y).map((x) => x.el)}</>;
}

function Sebe({ p, ligacoes }: { p: Ponto[]; ligacoes: [number, number][] }) {
  return (
    <>
      {ligacoes
        .map(([i, j]) => (p[i].y <= p[j].y ? [p[i], p[j]] : [p[j], p[i]]))
        .sort((x, y) => x[0].y + x[1].y - y[0].y - y[1].y)
        .map(([a, b], k) => (
          <Folha key={k} d={muro(a, b, 44, (t) => 0.75 + 0.25 * Math.abs(Math.sin(t * Math.PI * 5)), 20)} cor="#b8d99a" f={a.f} linhas={[0.25, 0.5, 0.75].map((t) => { const q = lerp(a, b, t); return `M${q.x - 5 * q.f} ${q.y - 18 * q.f}q5 -5 10 0`; }).join('')} />
        ))}
      {p.map((q, i) => (
        <g key={`f${i}`} transform={`translate(${q.x} ${q.y + 4 * q.f}) scale(${q.f * 0.95})`}>
          <Recorte tipo="arbusto" versao={i} />
        </g>
      ))}
    </>
  );
}

function Tronco({ p, ligacoes }: { p: Ponto[]; ligacoes: [number, number][] }) {
  const [i, j] = ligacoes[0] ?? [0, 0];
  const [a0, b0] = p[i].y <= p[j].y ? [p[i], p[j]] : [p[j], p[i]];
  // deitado no chão, de centro a centro das duas casas
  const [a, b] = [a0, b0].map((q) => ({ ...q, y: q.y - 13 * q.f }));
  const [dx, dy] = [b.x - a.x, b.y - a.y];
  const n = Math.hypot(dx, dy) || 1;
  const [nx, ny] = [-dy / n, dx / n];
  const r = (q: Ponto) => 16 * q.f;
  const corpo = pts([[a.x + nx * r(a), a.y + ny * r(a)], [b.x + nx * r(b), b.y + ny * r(b)], [b.x - nx * r(b), b.y - ny * r(b)], [a.x - nx * r(a), a.y - ny * r(a)]]);
  const casca = [0.35, -0.3].map((o) => `M${lerp(a, b, 0.15).x + nx * o * r(a)} ${lerp(a, b, 0.15).y + ny * o * r(a)}L${lerp(a, b, 0.7).x + nx * o * r(b)} ${lerp(a, b, 0.7).y + ny * o * r(b)}`).join('');
  // a ponta da frente, cortada
  const ponta = `M${b.x - r(b)} ${b.y}a${r(b)} ${r(b)} 0 1 0 ${2 * r(b)} 0a${r(b)} ${r(b)} 0 1 0 ${-2 * r(b)} 0Z`;
  const anel = `M${b.x - r(b) / 2} ${b.y}a${r(b) / 2} ${r(b) / 2} 0 1 0 ${r(b)} 0`;
  // um ramo partido
  const m = lerp(a, b, 0.45);
  const ramo = pts([[m.x - 3 * m.f, m.y - r(m) * 0.6], [m.x + 4 * m.f, m.y - r(m) * 0.6], [m.x + 10 * m.f, m.y - r(m) - 14 * m.f], [m.x + 4 * m.f, m.y - r(m) - 15 * m.f]]);
  // as outras casas: cepos
  const cepos = p.filter((_, k) => k !== i && k !== j);
  return (
    <>
      {cepos.filter((q) => q.y < b0.y).map((q, k) => <Cepo key={`a${k}`} q={q} />)}
      <Folha d={ramo} cor="#cfa77e" f={m.f} />
      <Folha d={corpo} cor="#d8b48c" f={b.f} linhas={casca} />
      <Folha d={ponta} cor="#f2dcbc" f={b.f} linhas={anel} />
      {cepos.filter((q) => q.y >= b0.y).map((q, k) => <Cepo key={`b${k}`} q={q} />)}
    </>
  );
}

function Cepo({ q }: { q: Ponto }) {
  const [w, h] = [15 * q.f, 20 * q.f];
  const corpo = `M${q.x - w} ${q.y - h}L${q.x - w} ${q.y}Q${q.x} ${q.y + 6 * q.f} ${q.x + w} ${q.y}L${q.x + w} ${q.y - h}Z`;
  const topo = `M${q.x - w} ${q.y - h}a${w} ${6 * q.f} 0 1 0 ${2 * w} 0a${w} ${6 * q.f} 0 1 0 ${-2 * w} 0Z`;
  return (
    <>
      <Folha d={corpo} cor="#d8b48c" f={q.f} linhas={`M${q.x - w / 2} ${q.y - h + 6 * q.f}L${q.x - w / 2} ${q.y - 2 * q.f}`} />
      <Folha d={topo} cor="#f2dcbc" f={q.f} linhas={`M${q.x - w / 2} ${q.y - h}a${w / 2} ${3 * q.f} 0 1 0 ${w} 0`} />
    </>
  );
}

function Lago({ p, ligacoes, achata }: { p: Ponto[]; ligacoes: [number, number][]; achata: number }) {
  const bolhas = [...p.map((q) => ({ q, r: 33 })), ...ligacoes.map(([i, j]) => ({ q: meio(p[i], p[j]), r: 28 }))];
  const elipse = ({ q, r }: { q: Ponto; r: number }) => `M${q.x - r * q.f} ${q.y}a${r * q.f} ${r * q.f * achata} 0 1 0 ${2 * r * q.f} 0a${r * q.f} ${r * q.f * achata} 0 1 0 ${-2 * r * q.f} 0Z`;
  const d = bolhas.map(elipse).join('');
  const f = p[0].f;
  // contorno por baixo e água por cima: as bolhas juntam-se numa só
  return (
    <g>
      <path d={d} fill={TINTA} stroke={TINTA} stroke-width={6 * f} />
      <path d={d} fill="#b7dcf2" />
      {p.map((q, k) => (
        <path key={k} d={`M${q.x - 14 * q.f} ${q.y}q7 ${-5 * q.f * achata} ${14 * q.f} 0q7 ${5 * q.f * achata} ${14 * q.f} 0`} fill="none" stroke="#fff" stroke-width={3 * q.f} stroke-linecap="round" />
      ))}
    </g>
  );
}

/** recortes soltos em cada casa e coisas pequenas pelo meio (pedras, bosque) */
function Soltos({ tipo, p, ligacoes, s, meioTipo }: { tipo: TipoObstaculo; p: Ponto[]; ligacoes: [number, number][]; s: number; meioTipo: TipoObstaculo }) {
  const coisas = [
    ...p.map((q, i) => ({ q, tipo, k: 0.9 + 0.25 * sorte(s, i), v: i + s, vira: sorte(s, i + 4) > 0.5 })),
    ...ligacoes.map(([i, j], n) => ({ q: meio(p[i], p[j]), tipo: meioTipo, k: 0.55, v: n + s + 1, vira: sorte(s, n) > 0.5 })),
  ].sort((a, b) => a.q.y - b.q.y);
  return (
    <>
      {coisas.map((c, i) => (
        <g key={i} transform={`translate(${c.q.x} ${c.q.y}) scale(${c.q.f * c.k})`}>
          <Recorte tipo={c.tipo} versao={c.v} vira={c.vira} />
        </g>
      ))}
    </>
  );
}

// ---------- OPÇÕES NOVAS (26/11, por escolher na galeria: #/demo-duelo?galeria=1) ----------

const centro = (p: Ponto[]): Ponto => ({ x: p.reduce((a, q) => a + q.x, 0) / p.length, y: p.reduce((a, q) => a + q.y, 0) / p.length, f: p.reduce((a, q) => a + q.f, 0) / p.length });
const ordenar = (p: Ponto[], ligacoes: [number, number][]) => ligacoes.map(([i, j]) => (p[i].y <= p[j].y ? [p[i], p[j]] : [p[j], p[i]])).sort((x, y) => x[0].y + x[1].y - y[0].y - y[1].y);

/** casa partida: paredes com janela e porta, uma empena de pé e o telhado caído no chão */
function Casa({ p, ligacoes, s }: { p: Ponto[]; ligacoes: [number, number][]; s: number }) {
  const paredes = ordenar(p, ligacoes);
  const els: JSX.Element[] = [];
  paredes.forEach(([a, b], k) => {
    const alto = 46;
    const topo = (t: number) => (t > 0.55 + 0.2 * sorte(s, k) ? 0.55 : 1);
    const jan = (t0: number, t1: number, h0: number, h1: number) => {
      const [q0, q1] = [lerp(a, b, t0), lerp(a, b, t1)];
      return pts([[q0.x, q0.y - alto * q0.f * h0], [q1.x, q1.y - alto * q1.f * h0], [q1.x, q1.y - alto * q1.f * h1], [q0.x, q0.y - alto * q0.f * h1]]);
    };
    els.push(<Folha key={'p' + k} d={muro(a, b, alto, topo)} cor="#f1e3c8" f={a.f} linhas={jan(0.15, 0.32, 0, 0.62) + jan(0.5, 0.68, 0.38, 0.72) + `M${a.x} ${a.y - 6 * a.f}L${b.x} ${b.y - 6 * b.f}`} />);
  });
  // empena (o bico da parede) na ponta de trás, de pé
  const [a] = paredes[0] ?? [p[0]];
  const e = 46 * a.f;
  els.unshift(<Folha key="emp" d={pts([[a.x - 22 * a.f, a.y - e], [a.x + 22 * a.f, a.y - e], [a.x, a.y - e - 18 * a.f]])} cor="#f1e3c8" f={a.f} linhas={`M${a.x - 4 * a.f} ${a.y - e - 8 * a.f}l${8 * a.f} 0l0 ${-8 * a.f}l${-8 * a.f} 0Z`} />);
  // telhado caído na casa da frente
  const q = p.reduce((m, x) => (x.y > m.y ? x : m));
  els.push(<Folha key="tel" d={pts([[q.x - 30 * q.f, q.y + 2 * q.f], [q.x + 18 * q.f, q.y - 4 * q.f], [q.x + 30 * q.f, q.y - 20 * q.f], [q.x - 16 * q.f, q.y - 16 * q.f]])} cor="#d9785b" f={q.f} linhas={[0.25, 0.5, 0.75].map((t) => `M${q.x - 30 * q.f + 48 * t * q.f} ${q.y + 2 * q.f - 6 * t * q.f}l${12 * q.f} ${-18 * q.f}`).join('')} />);
  return <>{els}</>;
}

/** montanha em pirâmide: a base cobre as casas do grupo e as faces de cartão sobem até ao bico, com neve */
function Montanha({ p, achata }: { p: Ponto[]; achata: number }) {
  const c = centro(p);
  // base: o contorno de todas as casas do grupo (seis pontas à volta de cada centro)
  const base: [number, number][] = [];
  for (const q of p) for (let k = 0; k < 6; k++) base.push([q.x + 40 * q.f * Math.cos((Math.PI / 3) * k + Math.PI / 6), q.y + 40 * q.f * achata * Math.sin((Math.PI / 3) * k + Math.PI / 6)]);
  // poucas faces (no máximo 6): mais simples de ver e mais leve para a TV
  const todo = envolvente(base);
  const h = todo.length <= 6 ? todo : Array.from({ length: 6 }, (_, k) => todo[Math.floor((k * todo.length) / 6)]);
  const larg = Math.max(...h.map(([x]) => x)) - Math.min(...h.map(([x]) => x));
  // baixa, para não tapar o que está atrás
  const bico: [number, number] = [c.x, c.y - Math.min(22 * c.f + larg * 0.28, 62 * c.f)];
  // faces da frente (as de trás ficam tapadas), mais claras à esquerda
  const faces = h
    .map((a, k) => [a, h[(k + 1) % h.length]] as [[number, number], [number, number]])
    .filter(([a, b]) => (a[1] + b[1]) / 2 >= c.y - 2)
    .map(([a, b]) => ({ a, b, luz: (a[0] + b[0]) / 2 < bico[0] }));
  const fora = pts([...h.filter(([, y]) => y >= c.y - 2).sort((a, b) => a[0] - b[0]), bico]);
  const neve = (a: [number, number], b: [number, number]) => {
    const t = 0.28;
    const [p1, p2] = [[bico[0] + (a[0] - bico[0]) * t, bico[1] + (a[1] - bico[1]) * t], [bico[0] + (b[0] - bico[0]) * t, bico[1] + (b[1] - bico[1]) * t]];
    return `M${bico[0]} ${bico[1]}L${p1[0]} ${p1[1]}L${(p1[0] + p2[0]) / 2} ${(p1[1] + p2[1]) / 2 - 6 * c.f}L${p2[0]} ${p2[1]}Z`;
  };
  return (
    <g stroke-linejoin="round">
      {/* borda branca e espessura de cartão à volta de tudo */}
      <path d={fora} transform={`translate(${3 * c.f} ${2 * c.f})`} fill={CARTAO} stroke={CARTAO} stroke-width={12 * c.f} />
      <path d={fora} fill="#fff" stroke="#fff" stroke-width={12 * c.f} />
      {faces.map(({ a, b, luz }, k) => (
        <g key={k}>
          <path d={pts([a, b, bico])} fill={luz ? '#b9b4c4' : '#9d97ad'} stroke={TINTA} stroke-width={2.5 * c.f} />
          <path d={neve(a, b)} fill="#fff" stroke={TINTA} stroke-width={2 * c.f} />
        </g>
      ))}
    </g>
  );
}

/** envolvente convexa de pontos */
function envolvente(l: [number, number][]): [number, number][] {
  const q = [...l].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const vira = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const meia = (r: [number, number][]) => {
    const h: [number, number][] = [];
    for (const x of r) {
      while (h.length >= 2 && vira(h[h.length - 2], h[h.length - 1], x) <= 0) h.pop();
      h.push(x);
    }
    return h.slice(0, -1);
  };
  return [...meia(q), ...meia([...q].reverse())];
}

/** cerca de madeira: estacas e duas réguas entre as casas */
function Cerca({ p, ligacoes }: { p: Ponto[]; ligacoes: [number, number][] }) {
  return (
    <>
      {ordenar(p, ligacoes).map(([a, b], k) => {
        const estacas = [0, 0.25, 0.5, 0.75, 1].map((t) => {
          const q = lerp(a, b, t);
          return pts([[q.x - 4 * q.f, q.y], [q.x + 4 * q.f, q.y], [q.x + 4 * q.f, q.y - 34 * q.f], [q.x, q.y - 40 * q.f], [q.x - 4 * q.f, q.y - 34 * q.f]]);
        });
        const regua = (h: number) => pts([[a.x, a.y - h * a.f], [b.x, b.y - h * b.f], [b.x, b.y - (h + 6) * b.f], [a.x, a.y - (h + 6) * a.f]]);
        return (
          <g key={k}>
            <Folha d={regua(12) + regua(26)} cor="#cfa77e" f={a.f} />
            {estacas.map((d, i) => (
              <Folha key={i} d={d} cor="#d8b48c" f={a.f} />
            ))}
          </g>
        );
      })}
    </>
  );
}

/** carroça partida entre duas casas: caixa, uma roda de pé e outra caída */
function Carroca({ p, ligacoes }: { p: Ponto[]; ligacoes: [number, number][] }) {
  const [a, b] = ordenar(p, ligacoes)[0] ?? [p[0], p[0]];
  const [q0, q1] = [lerp(a, b, -0.1), lerp(a, b, 1.05)];
  const alt = 34;
  const caixa = pts([[q0.x, q0.y - 12 * q0.f], [q1.x, q1.y - 12 * q1.f], [q1.x, q1.y - (12 + alt) * q1.f], [q0.x, q0.y - (12 + alt + 8) * q0.f]]);
  const roda = (q: Ponto, r: number) => `M${q.x - r * q.f} ${q.y - r * q.f}a${r * q.f} ${r * q.f} 0 1 0 ${2 * r * q.f} 0a${r * q.f} ${r * q.f} 0 1 0 ${-2 * r * q.f} 0Z`;
  const raios = (q: Ponto, r: number) => [0, 60, 120].map((g) => { const [c, s2] = [Math.cos((g * Math.PI) / 180), Math.sin((g * Math.PI) / 180)]; return `M${q.x - c * r * q.f} ${q.y - r * q.f - s2 * r * q.f}l${2 * c * r * q.f} ${2 * s2 * r * q.f}`; }).join('');
  const r1 = lerp(a, b, 0.75);
  const caida = p.find((x) => x !== a && x !== b) ?? lerp(a, b, 0.3);
  return (
    <>
      <Folha d={caixa} cor="#cfa77e" f={a.f} linhas={[0.33, 0.66].map((t) => { const q = lerp(q0, q1, t); return `M${q.x} ${q.y - 12 * q.f}l0 ${-alt * q.f}`; }).join('') + `M${q0.x} ${q0.y - (12 + alt / 2) * q0.f}L${q1.x} ${q1.y - (12 + alt / 2) * q1.f}`} />
      <Folha d={roda(r1, 20)} cor="#d8b48c" f={r1.f} linhas={raios(r1, 20)} />
      <path d={`M${caida.x - 16 * caida.f} ${caida.y}a${16 * caida.f} ${7 * caida.f} 0 1 0 ${32 * caida.f} 0a${16 * caida.f} ${7 * caida.f} 0 1 0 ${-32 * caida.f} 0Z`} fill="#d8b48c" stroke={TINTA} stroke-width={3 * caida.f} />
    </>
  );
}

export type TipoEstrutura = TipoObstaculo | 'casa' | 'montanha' | 'cerca' | 'carroca';

/** que estruturas servem para um grupo de `n` casas */
export const ESTRUTURAS_POR_TAMANHO: Record<number, TipoEstrutura[]> = {
  1: ['montanha', 'pedra', 'arvore', 'poca'],
  2: ['montanha', 'casa', 'tronco', 'carroca', 'cerca', 'ruina', 'arbusto', 'poca', 'pedra', 'arvore'],
  3: ['montanha', 'casa', 'tronco', 'cerca', 'ruina', 'arbusto', 'poca', 'pedra', 'arvore'],
  // bloco de 4 (losango): lago grande ou montanha larga
  4: ['poca', 'montanha'],
};
/** a arte de um só hexágono, para a colmeia vista de cima */
export const ARTE_PLANA: Record<TipoEstrutura, TipoObstaculo> = { ruina: 'ruina', arbusto: 'arbusto', tronco: 'tronco', poca: 'poca', pedra: 'pedra', arvore: 'arvore', casa: 'ruina', montanha: 'pedra', cerca: 'tronco', carroca: 'tronco' };

/** a estrutura de um grupo de obstáculos; `p`: o centro de cada casa (projetado), `ligacoes`: casas coladas */
export function Estrutura({ tipo, p, ligacoes, semente, achata }: { tipo: TipoEstrutura; p: Ponto[]; ligacoes: [number, number][]; semente: number; achata: number }) {
  switch (tipo) {
    case 'casa':
      return <Casa p={p} ligacoes={ligacoes} s={semente} />;
    case 'montanha':
      return <Montanha p={p} achata={achata} />;
    case 'cerca':
      return <Cerca p={p} ligacoes={ligacoes} />;
    case 'carroca':
      return <Carroca p={p} ligacoes={ligacoes} />;
    case 'ruina':
      return <Ruina p={p} ligacoes={ligacoes} s={semente} />;
    case 'arbusto':
      return <Sebe p={p} ligacoes={ligacoes} />;
    case 'tronco':
      return <Tronco p={p} ligacoes={ligacoes} />;
    case 'poca':
      return <Lago p={p} ligacoes={ligacoes} achata={achata} />;
    case 'pedra':
      return <Soltos tipo="pedra" p={p} ligacoes={ligacoes} s={semente} meioTipo="pedra" />;
    case 'arvore':
      return <Soltos tipo="arvore" p={p} ligacoes={ligacoes} s={semente} meioTipo="arbusto" />;
  }
}
