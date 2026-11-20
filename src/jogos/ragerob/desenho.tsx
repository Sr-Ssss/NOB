/**
 * Desenhos do Ragerob, "sucata no quintal" (info/jogos/rinha-de-robos.md → Visual e Peças).
 * Vista de cima; frente do robô = −y. Traço preto grosso e um pouco torto; olhos que só piscam.
 */
import type { JSX } from 'preact';
import { ALT, LARG, R, contorno, type Combate } from './fisica';
import type { Arena, RoboArena } from './quadro';
import { CORES, COR_CABECA, COR_MODULO, POS_ENCAIXES, direcaoEncaixe, type Cabeca, type Modulo, type Robo } from './pecas';

const P = '#1a1a1a';
const SW = 3;

/** tom mais escuro (riscos de amolgadela) */
function escurecer(hex: string, k = 0.7): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number) => Math.round(((n >> s) & 255) * k).toString(16).padStart(2, '0');
  return '#' + c(16) + c(8) + c(0);
}

/** contorno torto: cada vértice mexe um pouco (sempre igual para o mesmo robô) */
function torto(pts: [number, number][], semente: number): string {
  return pts.map(([x, y], i) => `${(x * R + Math.sin(semente * 3.1 + i * 1.7) * 1.6).toFixed(1)},${(y * R + Math.cos(semente * 2.3 + i * 2.1) * 1.6).toFixed(1)}`).join(' ');
}

function Olhos({ cabeca, y }: { cabeca: Cabeca; y: number }) {
  const cor = { galo: '#f08a1c', crocodilo: '#f2c230', rino: '#1a1a1a', bode: '#f2c230', ourico: '#1a1a1a' }[cabeca];
  return (
    <g class="rr-olhos">
      <circle cx={-6} cy={y} r={4} fill={cabeca === 'rino' || cabeca === 'ourico' ? '#fff' : cor} stroke={P} stroke-width={1.5} />
      <circle cx={6} cy={y} r={4} fill={cabeca === 'rino' || cabeca === 'ourico' ? '#fff' : cor} stroke={P} stroke-width={1.5} />
      {cabeca === 'crocodilo' || cabeca === 'bode' ? (
        <>
          <rect x={cabeca === 'bode' ? -8 : -6.8} y={cabeca === 'bode' ? y - 0.8 : y - 2.5} width={cabeca === 'bode' ? 4 : 1.6} height={cabeca === 'bode' ? 1.6 : 5} fill={P} />
          <rect x={cabeca === 'bode' ? 4 : 5.2} y={cabeca === 'bode' ? y - 0.8 : y - 2.5} width={cabeca === 'bode' ? 4 : 1.6} height={cabeca === 'bode' ? 1.6 : 5} fill={P} />
        </>
      ) : (
        <>
          <circle cx={-6} cy={y} r={1.8} fill={P} />
          <circle cx={6} cy={y} r={1.8} fill={P} />
        </>
      )}
      {cabeca === 'rino' && <path d={`M-11 ${y - 6} L-2 ${y - 3} M11 ${y - 6} L2 ${y - 3}`} stroke={P} stroke-width={2} />}
      <rect class="rr-palpebra" x={-11} y={y - 5} width={22} height={10} fill={COR_CABECA[cabeca]} />
    </g>
  );
}

/** cabeça à frente (y negativo); `anim` 0..1 = a atacar */
export function CabecaSvg({ cabeca, anim = 0, giro = 0, fase = 0 }: { cabeca: Cabeca; anim?: number; giro?: number; fase?: number }) {
  const c = COR_CABECA[cabeca];
  const y0 = -R * 0.95;
  if (cabeca === 'galo')
    return (
      <g>
        <ellipse cx={0} cy={y0 - 30} rx={2.5} ry={15} fill="#c9ced3" stroke={P} stroke-width={2} transform={anim ? `rotate(${(Date.now() / 3) % 360} 0 ${y0 - 30})` : undefined} />
        <path d={`M-14 ${y0} L-10 ${y0 - 18} L0 ${y0 - 26} L10 ${y0 - 18} L14 ${y0}Z`} fill={c} stroke={P} stroke-width={SW} stroke-linejoin="round" />
        <path d={`M-4 ${y0 - 22} L0 ${y0 - 32} L4 ${y0 - 22}Z`} fill="#f2c230" stroke={P} stroke-width={2} />
        <Olhos cabeca={cabeca} y={y0 - 10} />
      </g>
    );
  if (cabeca === 'rino')
    return (
      <g>
        <path d={`M-2 ${y0 - 20} L0 ${y0 - 48} L2 ${y0 - 20}Z`} fill="#efe3c4" stroke={P} stroke-width={2} />
        <path d={`M-16 ${y0 + 2} L-12 ${y0 - 16} L0 ${y0 - 24} L12 ${y0 - 16} L16 ${y0 + 2}Z`} fill={c} stroke={P} stroke-width={SW} stroke-linejoin="round" />
        <path d={`M-10 ${y0 - 6} L0 ${y0 - 14} L10 ${y0 - 6}`} fill="none" stroke={escurecer(c)} stroke-width={2} />
        <Olhos cabeca={cabeca} y={y0 - 4} />
      </g>
    );
  if (cabeca === 'bode') {
    const e = anim * 14;
    return (
      <g>
        <rect x={-3} y={y0 - 10 - e} width={6} height={10 + e} fill="#8b8f95" stroke={P} stroke-width={1.5} />
        <path d={`M-20 ${y0 - 10 - e} L20 ${y0 - 10 - e} L14 ${y0 - 24 - e} L-14 ${y0 - 24 - e}Z`} fill={c} stroke={P} stroke-width={SW} stroke-linejoin="round" />
        <path d={`M-14 ${y0 + 4} q-12 -4 -8 -16 q6 6 0 10 M14 ${y0 + 4} q12 -4 8 -16 q-6 6 0 10`} fill="#8a5a33" stroke={P} stroke-width={2} />
        <Olhos cabeca={cabeca} y={y0 - 2} />
      </g>
    );
  }
  if (cabeca === 'crocodilo') {
    const fechado = anim > 0;
    return (
      <g>
        {fechado ? (
          <>
            <path d={`M-13 ${y0} L-10 ${y0 - 32} L10 ${y0 - 32} L13 ${y0}Z`} fill={c} stroke={P} stroke-width={SW} stroke-linejoin="round" />
            <circle cx={-4} cy={y0 - 28} r={1.5} fill={P} />
            <circle cx={4} cy={y0 - 28} r={1.5} fill={P} />
            <path d={`M-16 ${y0 - 38} l-4 -6 M0 ${y0 - 40} v-7 M16 ${y0 - 38} l4 -6`} stroke={P} stroke-width={2} />
          </>
        ) : (
          <>
            <path d={`M-13 ${y0} L-12 ${y0 - 32} L12 ${y0 - 32} L13 ${y0}Z`} fill="#f27fb2" stroke={P} stroke-width={SW} stroke-linejoin="round" />
            <path d={`M-12 ${y0 - 30} l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4`} fill="none" stroke="#fff" stroke-width={2} />
          </>
        )}
        <circle cx={-9} cy={y0 + 2} r={6} fill={c} stroke={P} stroke-width={2} />
        <circle cx={9} cy={y0 + 2} r={6} fill={c} stroke={P} stroke-width={2} />
        <Olhos cabeca={cabeca} y={y0 + 2} />
      </g>
    );
  }
  // ouriço: tambor pequeno à frente (o ouriço enrolado, deitado, a girar como um rolo de espinhos)
  const passo = ((fase * 8) % 8 + 8) % 8;
  const yd = y0 - 16;
  return (
    <g>
      {/* suporte com a carinha do ouriço */}
      <path d={`M-14 ${y0 + 2} L-12 ${y0 - 8} L12 ${y0 - 8} L14 ${y0 + 2}Z`} fill="#8b8f95" stroke={P} stroke-width={2} stroke-linejoin="round" />
      <rect x={-17} y={yd - 3} width={4} height={10} fill="#5f666d" stroke={P} stroke-width={1.5} />
      <rect x={13} y={yd - 3} width={4} height={10} fill="#5f666d" stroke={P} stroke-width={1.5} />
      {/* o rolo: os espinhos correm conforme gira */}
      <rect x={-14} y={yd - 8} width={28} height={16} rx={7} fill={c} stroke={P} stroke-width={SW} />
      {Array.from({ length: 4 }, (_, i) => {
        const x = -12 + ((i * 8 + passo) % 26);
        return <path key={i} d={`M${x} ${yd - 8} l2 -6 l2 6 M${x} ${yd + 8} l2 6 l2 -6`} fill="#5a3a20" stroke={P} stroke-width={1} />;
      })}
      <ellipse cx={0} cy={yd - 1} rx={4} ry={3} fill="#efe3c4" stroke={P} stroke-width={1} />
      <circle cx={-6} cy={yd + 2} r={1.6} fill={P} />
      <circle cx={6} cy={yd + 2} r={1.6} fill={P} />
      {giro > 0.75 && <path d={`M-18 ${yd - 12} q18 -8 36 0`} fill="none" stroke="#f08a1c" stroke-width={2.5} />}
    </g>
  );
}

function Loco({ robo }: { robo: Robo }) {
  const n = { triangulo: 3, bola: 4, quadrado: 4, retangulo: 6, pentagono: 4 }[robo.corpo];
  const comp = robo.corpo === 'retangulo' ? 1.1 : 0.85;
  if (robo.loco === 'lagartas')
    return (
      <g>
        {[-1, 1].map((s) => (
          <g key={s}>
            <rect x={s * R * 0.95 - 9} y={-R * comp - 4} width={18} height={R * comp * 2 + 8} rx={7} fill="#2b2b2e" stroke={P} stroke-width={SW} />
            {Array.from({ length: 7 }, (_, i) => (
              <line key={i} x1={s * R * 0.95 - 6} x2={s * R * 0.95 + 6} y1={-R * comp + (i * R * comp * 2) / 6} y2={-R * comp + (i * R * comp * 2) / 6} stroke="#5c5c62" stroke-width={2.5} />
            ))}
          </g>
        ))}
      </g>
    );
  const lados = Math.max(1, Math.round(n / 2));
  const ys = Array.from({ length: lados }, (_, i) => (lados === 1 ? 0.3 : -0.6 + (1.2 * i) / (lados - 1)) * R * comp);
  if (robo.loco === 'rodas')
    return (
      <g>
        {[-1, 1].flatMap((s) =>
          ys.map((y, i) => (
            <g key={s + ':' + i}>
              <rect x={s * R * 0.92 - 7} y={y - 12} width={14} height={24} rx={5} fill="#222" stroke={P} stroke-width={SW} />
              <line x1={s * R * 0.92 - 4} x2={s * R * 0.92 + 4} y1={y - 3} y2={y - 3} stroke="#666" stroke-width={2} />
              <line x1={s * R * 0.92 - 4} x2={s * R * 0.92 + 4} y1={y + 4} y2={y + 4} stroke="#666" stroke-width={2} />
            </g>
          )),
        )}
      </g>
    );
  // pernas de caranguejo: anca redonda + 2 segmentos
  const passo = Math.sin(Date.now() / 120) * 4;
  return (
    <g>
      {[-1, 1].flatMap((s) =>
        [-0.5, 0.5].map((f, i) => {
          const y = f * R * 1.1 + (i ? passo : -passo);
          return (
            <g key={s + ':' + i}>
              <path d={`M${s * R * 0.7} ${y} L${s * R * 1.25} ${y - 10} L${s * R * 1.5} ${y + 8}`} fill="none" stroke={P} stroke-width={7} stroke-linecap="round" stroke-linejoin="round" />
              <path d={`M${s * R * 0.7} ${y} L${s * R * 1.25} ${y - 10} L${s * R * 1.5} ${y + 8}`} fill="none" stroke="#3a3d42" stroke-width={4} stroke-linecap="round" stroke-linejoin="round" />
              <circle cx={s * R * 0.7} cy={y} r={6} fill="#5b5f66" stroke={P} stroke-width={2} />
            </g>
          );
        }),
      )}
    </g>
  );
}

/** um módulo na sua base aparafusada, a apontar para fora (rotação = direção do encaixe) */
export function ModuloSvg({ m, anim = 0, seta = false }: { m: Modulo; anim?: number; seta?: boolean }) {
  const c = COR_MODULO[m];
  const peca: Record<Modulo, JSX.Element> = {
    picos: <path d="M-8 -6 L-5 -20 L-2 -6 M2 -6 L5 -20 L8 -6" fill="#efe3c4" stroke={P} stroke-width={2} stroke-linejoin="round" />,
    martelo: (
      <g transform={anim ? 'translate(0 -10) scale(1 1.6)' : undefined}>
        <rect x={-2} y={-16} width={4} height={12} fill="#8a5a33" stroke={P} stroke-width={1.5} />
        <rect x={-9} y={-24} width={18} height={9} rx={2} fill={c} stroke={P} stroke-width={2} />
        <rect x={-7} y={-24} width={14} height={2.5} fill="#fff" />
      </g>
    ),
    chamas: (
      <g>
        <rect x={-6} y={-8} width={12} height={10} rx={3} fill={c} stroke={P} stroke-width={2} />
        <path d="M-4 -8 L-3 -18 L3 -18 L4 -8Z" fill="#f08a1c" stroke={P} stroke-width={2} />
      </g>
    ),
    escudo: <path d="M-16 -10 Q0 -24 16 -10" fill="none" stroke={c} stroke-width={6} stroke-linecap="round" />,
    propulsor: <path d="M-5 -6 L-9 -20 L9 -20 L5 -6Z" fill="#8b8f95" stroke={P} stroke-width={2} />,
    oleo: (
      <g>
        <rect x={-7} y={-12} width={14} height={14} rx={2} fill={c} stroke={P} stroke-width={2} />
        <rect x={-2} y={-19} width={4} height={7} fill="#5f666d" stroke={P} stroke-width={1.5} />
      </g>
    ),
    fogos: (
      <g>
        {[-1, 0, 1].map((k) => (
          <g key={k} transform={`rotate(${k * 22})`}>
            <rect x={-2.5} y={-20} width={5} height={13} fill={['#e0412b', '#f2c230', '#2f7de1'][k + 1]} stroke={P} stroke-width={1.5} />
            <path d="M-2.5 -20 L0 -25 L2.5 -20Z" fill="#fff" stroke={P} stroke-width={1} />
          </g>
        ))}
      </g>
    ),
    pistao: (
      <g transform={anim ? 'translate(0 -10)' : undefined}>
        <rect x={-2.5} y={-12} width={5} height={8} fill="#c9ced3" stroke={P} stroke-width={1.5} />
        <circle cx={0} cy={-17} r={7} fill={c} stroke={P} stroke-width={2} />
      </g>
    ),
    agua: (
      <g>
        <rect x={-7} y={-9} width={14} height={10} rx={4} fill={c} stroke={P} stroke-width={2} />
        <path d="M0 -9 Q4 -14 0 -20" fill="none" stroke="#2b5f8a" stroke-width={3} />
      </g>
    ),
    bobina: (
      <g>
        <path d="M-6 -6 q6 -3 12 0 q-6 3 -12 0 q6 -6 12 -3" fill="none" stroke={c} stroke-width={3} />
        <path d="M-4 -10 v-10 M4 -10 v-10" stroke={P} stroke-width={2.5} />
        {anim > 0 && <path d="M0 -22 l-3 -6 l5 0 l-3 -7" fill="none" stroke="#f2c230" stroke-width={2.5} />}
      </g>
    ),
  };
  return (
    <g>
      {seta && <path d="M0 -26 L0 -40 M-5 -35 L0 -41 L5 -35" fill="none" stroke="#e0412b" stroke-width={3} />}
      <rect x={-9} y={-6} width={18} height={12} rx={3} fill="#9aa0a6" stroke={P} stroke-width={2} />
      <circle cx={-5.5} cy={0} r={1.4} fill={P} />
      <circle cx={5.5} cy={0} r={1.4} fill={P} />
      {peca[m]}
    </g>
  );
}

function Parafuso() {
  return (
    <g>
      <circle r={6} fill="#9aa0a6" stroke={P} stroke-width={2} />
      <path d="M-3 0 H3 M0 -3 V3" stroke={P} stroke-width={1.5} />
    </g>
  );
}

export interface EstadoDesenho {
  /** relógio da física (s) */
  t?: number;
  cabAnim?: number;
  giro?: number;
  fase?: number;
  disparou?: number[];
}

/** o robô inteiro em coordenadas locais (centro = 0,0); `seta` = direção dos módulos (só na loja/instalação) */
export function RoboSvg({ robo, e = {}, seta = false, destaque }: { robo: Robo; e?: EstadoDesenho; seta?: boolean; destaque?: number }) {
  const cor = CORES[robo.cor % CORES.length].hex;
  const semente = robo.cor + robo.id.length;
  const pts = contorno(robo.corpo);
  const agora = e.t ?? 0;
  return (
    <g>
      <Loco robo={robo} />
      <CabecaSvg cabeca={robo.cabeca} anim={e.cabAnim !== undefined && agora - e.cabAnim < 0.35 ? 1 : 0} giro={e.giro} fase={e.fase ?? Math.PI} />
      {robo.corpo === 'bola' ? (
        <circle r={R * 0.95} fill={cor} stroke={P} stroke-width={SW + 1} />
      ) : (
        <polygon points={torto(pts, semente)} fill={cor} stroke={P} stroke-width={SW + 1} stroke-linejoin="round" />
      )}
      <path d={`M${-R * 0.35} ${R * 0.2} l${R * 0.25} ${R * 0.12} M${R * 0.1} ${R * 0.45} l${R * 0.2} -${R * 0.06}`} stroke={escurecer(cor)} stroke-width={2.5} stroke-linecap="round" />
      <path d={`M-5 ${-R * 0.55} L0 ${-R * 0.75} L5 ${-R * 0.55}`} fill="none" stroke={P} stroke-width={3} stroke-linecap="round" />
      {POS_ENCAIXES[robo.corpo].map(([x, y], k) => {
        const m = robo.modulos[k];
        const rot = (direcaoEncaixe(robo.corpo, k) * 180) / Math.PI;
        return (
          <g key={k} transform={`translate(${x * R} ${y * R}) rotate(${rot})`}>
            {m ? <ModuloSvg m={m} anim={e.disparou && agora - e.disparou[k] < 0.3 ? 1 : 0} seta={seta} /> : <Parafuso />}
            {destaque === k && <circle r={13} fill="none" stroke="#e0412b" stroke-width={3} stroke-dasharray="4 3" />}
          </g>
        );
      })}
    </g>
  );
}

/** o robô sozinho num quadrado (cartões, telemóvel) */
export function RoboCartao({ robo, tam = 110, seta, destaque, aoTocar }: { robo: Robo; tam?: number; seta?: boolean; destaque?: number; aoTocar?: (encaixe: number) => void }) {
  return (
    <svg viewBox="-75 -90 150 160" width={tam} height={(tam * 160) / 150} class="rr-robo" aria-hidden={aoTocar ? undefined : 'true'}>
      <RoboSvg robo={robo} seta={seta} destaque={destaque} />
      {aoTocar &&
        POS_ENCAIXES[robo.corpo].map(([x, y], k) => (
          <circle key={k} cx={x * R} cy={y * R} r={15} fill="transparent" role="button" aria-label={`Encaixe ${k + 1}`} onClick={() => aoTocar(k)} />
        ))}
    </svg>
  );
}

/** a arena inteira, desenhada a partir do estado da física */
/** a arena: `c` é o Combate da física (no host) ou um quadro recebido (src/jogos/ragerob/quadro.ts) */
export function ArenaSvg({ c, nomes, condutores }: { c: Arena; nomes: Record<string, string>; condutores: Record<string, string> }) {
  const t = c.t;
  return (
    <svg viewBox={`0 0 ${LARG} ${ALT}`} class="rr-arena" role="img" aria-label="Arena">
      <defs>
        <pattern id="rr-terra" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="#d8c29a" />
          <circle cx="12" cy="18" r="2.4" fill="#a8916c" />
          <circle cx="44" cy="40" r="1.8" fill="#9c8462" />
          <circle cx="30" cy="8" r="1.2" fill="#b39d78" />
        </pattern>
      </defs>
      <rect width={LARG} height={ALT} fill="url(#rr-terra)" />
      <rect x={40} y={34} width={LARG - 80} height={ALT - 68} rx={10} fill="none" stroke="#7a5230" stroke-width={5} stroke-dasharray="22 14" />
      {/* decoração parada: pneus nos cantos, chapas e latas */}
      {[[30, 30], [LARG - 30, ALT - 30], [LARG - 30, 30], [30, ALT - 30]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={26} fill="#2b2b2e" stroke={P} stroke-width={3} />
          <circle cx={x} cy={y} r={11} fill="#cdb489" stroke={P} stroke-width={2} />
          <circle cx={x + (i % 2 ? -18 : 18)} cy={y + 4} r={20} fill="#2b2b2e" stroke={P} stroke-width={3} />
        </g>
      ))}
      <rect x={LARG - 170} y={ALT - 66} width={70} height={22} fill="#8f99a3" stroke={P} stroke-width={2} transform={`rotate(-9 ${LARG - 135} ${ALT - 55})`} />
      <rect x={130} y={44} width={16} height={22} rx={3} fill="#c43b2b" stroke={P} stroke-width={2} transform="rotate(70 138 55)" />
      {/* rastos (somem em 2 s) */}
      {c.rastos.map((x, i) => {
        const op = Math.max(0, 1 - (t - x.t) / 2) * 0.5;
        const rot = (x.a * 180) / Math.PI;
        return (
          <g key={i} transform={`translate(${x.x} ${x.y}) rotate(${rot})`} opacity={op}>
            {x.loco === 'rodas' && <path d="M-30 -6 v12 M30 -6 v12" stroke="#7a5230" stroke-width={2} stroke-dasharray="3 3" />}
            {x.loco === 'lagartas' && <path d="M-32 -6 v12 M32 -6 v12" stroke="#7a5230" stroke-width={12} stroke-dasharray="3 3" />}
            {x.loco === 'pernas' && <path d="M-46 0 h0.1 M46 0 h0.1" stroke="#7a5230" stroke-width={7} stroke-linecap="round" />}
          </g>
        );
      })}
      {c.perigos.map((h, i) => (
        <PerigoSvg key={i} h={h} t={t} />
      ))}
      {c.pocas.map((q, i) => (
        <PocaSvg key={i} tipo={q.tipo} x={q.x} y={q.y} r={q.r} t={t} />
      ))}
      {c.parafusos.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={14 + (b.cai - t) * 16} fill="#000" opacity={0.25} />
      ))}
      {c.evento?.tipo === 'ima' && (
        <g transform={`translate(${c.evento.x} ${c.evento.y})`}>
          <path d="M-18 -40 v18 a18 18 0 0 0 36 0 v-18" fill="none" stroke="#e0412b" stroke-width={12} />
          <path d="M-18 -40 h-6 M18 -40 h6" stroke="#c9ced3" stroke-width={12} />
          <line x1={0} y1={-200} x2={0} y2={-50} stroke="#5f666d" stroke-width={3} />
        </g>
      )}
      {c.robos.filter((r) => r.ko).map((r) => (
        <g key={r.id} transform={`translate(${r.corpo.position.x} ${r.corpo.position.y}) rotate(${(r.corpo.angle * 180) / Math.PI})`} opacity={0.45}>
          <RoboSvg robo={r.robo} />
        </g>
      ))}
      {c.robos.filter((r) => !r.ko).map((r) => (
        <RoboNaArena key={r.id} r={r} t={t} nome={nomes[r.id] ?? r.id} condutor={condutores[r.id]} />
      ))}
      {c.efeitos.map((e, i) => (
        <EfeitoSvg key={i} e={e} t={t} />
      ))}
      {c.borda > 4 && (
        <path
          d={`M0 0 H${LARG} V${ALT} H0Z M${c.borda} ${c.borda * 0.63} V${ALT - c.borda * 0.63} H${LARG - c.borda} V${c.borda * 0.63}Z`}
          fill="#e0412b"
          fill-opacity={0.28}
          fill-rule="evenodd"
          stroke="#e0412b"
          stroke-width={6}
          stroke-dasharray="18 10"
        />
      )}
    </svg>
  );
}

function RoboNaArena({ r, nome, condutor, t }: { r: RoboArena; nome: string; condutor?: string; t: number }) {
  const p = r.corpo.position;
  const vida = Math.max(0, r.hp);
  return (
    <g>
      <g transform={`translate(${p.x} ${p.y}) rotate(${(r.corpo.angle * 180) / Math.PI})`}>
        <RoboSvg robo={r.robo} e={{ t, cabAnim: r.cabAnim, giro: r.giro, fase: r.fase, disparou: r.disparou }} />
      </g>
      <g transform={`translate(${p.x - 40} ${p.y - 74})`}>
        <rect width={80} height={9} fill="#3b2a1a" stroke={P} stroke-width={2} />
        <rect width={(80 * vida) / 100} height={9} fill={vida > 50 ? '#5fbf3a' : vida > 25 ? '#f2c230' : '#e0412b'} />
        <text x={40} y={-6} text-anchor="middle" class="rr-nome-arena">
          {nome}
        </text>
      </g>
      {condutor && (
        <g transform={`translate(${p.x} ${p.y + 62})`}>
          <rect x={-110} y={-17} width={220} height={28} rx={5} fill={P} />
          <text x={0} y={3} text-anchor="middle" class="rr-conduz">
            {condutor}
          </text>
        </g>
      )}
    </g>
  );
}

function PerigoSvg({ h, t }: { h: Combate['perigos'][number]; t: number }) {
  const aviso = h.estado === 'aviso';
  const on = h.estado === 'on';
  if (h.tipo === 'serra')
    return (
      <g transform={`translate(${h.x} ${h.y})`}>
        <circle r={h.w / 2 + 14} fill="none" stroke="#f08a1c" stroke-width={6} stroke-dasharray="12 9" opacity={aviso || on ? 1 : 0.45} />
        <g transform={`rotate(${on ? t * 900 : 0})`}>
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={`M-5 ${-h.w / 2 + 2} L0 ${-h.w / 2 - 9} L5 ${-h.w / 2 + 2}Z`} fill="#c9ced3" stroke={P} stroke-width={1.5} transform={`rotate(${i * 25.7})`} />
          ))}
          <circle r={h.w / 2} fill="#8a8f96" stroke={P} stroke-width={3} />
          <circle r={7} fill="#5f666d" stroke={P} stroke-width={2} />
        </g>
      </g>
    );
  if (h.tipo === 'parede')
    return (
      <g transform={`translate(${h.x} ${h.y})`}>
        <rect x={-h.w / 2} y={-h.h / 2} width={h.w} height={h.h} fill="#8a8f96" stroke={P} stroke-width={3} />
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M${-h.w / 2 + 12 + i * 25} ${h.dir ? h.h / 2 : -h.h / 2} l6 ${h.dir ? 14 : -14} l6 ${h.dir ? -14 : 14}Z`} fill="#efe3c4" stroke={P} stroke-width={1.5} />
        ))}
      </g>
    );
  if (h.tipo === 'pistao') {
    const s = h.x < LARG / 2 ? 1 : -1;
    const sai = on ? 60 : 0;
    return (
      <g transform={`translate(${h.x + s * sai} ${h.y})`}>
        {aviso && <rect x={s > 0 ? 0 : -110} y={-h.h / 2} width={110} height={h.h} fill="none" stroke="#f08a1c" stroke-width={5} stroke-dasharray="12 8" />}
        <rect x={-h.w / 2} y={-h.h / 2} width={h.w} height={h.h} fill="#f08a1c" stroke={P} stroke-width={3} />
      </g>
    );
  }
  if (h.tipo === 'martelo')
    return h.alvo && (aviso || on) ? (
      <g transform={`translate(${h.alvo.x} ${h.alvo.y})`}>
        <circle r={58} fill="none" stroke="#e0412b" stroke-width={5} stroke-dasharray="14 8" />
        <circle r={20} fill="none" stroke="#e0412b" stroke-width={4} />
        {on && <rect x={-40} y={-26} width={80} height={52} rx={6} fill="#5f666d" stroke={P} stroke-width={3} />}
      </g>
    ) : null;
  if (h.tipo === 'espinhos')
    return (
      <g transform={`translate(${h.x} ${h.y})`}>
        <rect x={-h.w / 2} y={-h.h / 2} width={h.w} height={h.h} fill="#9aa0a6" stroke={aviso ? '#f08a1c' : P} stroke-width={aviso ? 6 : 3} stroke-dasharray={aviso ? '12 8' : undefined} />
        {Array.from({ length: 16 }, (_, i) => {
          const x = -h.w / 2 + 18 + (i % 4) * 31;
          const y = -h.h / 2 + 18 + Math.floor(i / 4) * 31;
          return on ? <path key={i} d={`M${x - 6} ${y + 5} L${x} ${y - 9} L${x + 6} ${y + 5}Z`} fill="#efe3c4" stroke={P} stroke-width={1.5} /> : <circle key={i} cx={x} cy={y} r={4} fill="#3a3d42" />;
        })}
      </g>
    );
  if (h.tipo === 'tapete')
    return (
      <g transform={`translate(${h.x} ${h.y})`}>
        <rect x={-h.w / 2} y={-h.h / 2} width={h.w} height={h.h} fill="#3a3a3a" stroke={P} stroke-width={3} />
        {Array.from({ length: 6 }, (_, i) => {
          const x = -h.w / 2 + ((i * 64 + t * 60 * h.dir) % h.w + h.w) % h.w;
          return <path key={i} d={`M${x - 10 * h.dir} -14 L${x + 8 * h.dir} 0 L${x - 10 * h.dir} 14`} fill="none" stroke="#f08a1c" stroke-width={6} stroke-linejoin="round" />;
        })}
      </g>
    );
  return (
    <g transform={`translate(${h.x} ${h.y}) rotate(${t * 80 * h.dir})`}>
      <circle r={h.w / 2} fill="#b0b6bd" stroke={P} stroke-width={3} />
      {[0, 120, 240].map((k) => (
        <path key={k} d={`M0 ${-h.w / 2 + 18} A${h.w / 2 - 18} ${h.w / 2 - 18} 0 0 1 ${(h.w / 2 - 18) * 0.87} ${(h.w / 2 - 18) * 0.5}`} fill="none" stroke="#5f666d" stroke-width={5} transform={`rotate(${k})`} />
      ))}
      <circle r={10} fill="#5f666d" stroke={P} stroke-width={2} />
    </g>
  );
}

export function PocaSvg({ tipo, x, y, r, t }: { tipo: string; x: number; y: number; r: number; t: number }) {
  const forma = `M${x - r} ${y} q${r * 0.2} ${-r * 0.9} ${r} ${-r * 0.85} q${r * 0.9} ${r * 0.1} ${r} ${r * 0.8} q${-r * 0.1} ${r * 0.9} ${-r} ${r * 0.9} q${-r * 0.9} ${-r * 0.2} ${-r} ${-r * 0.85}Z`;
  if (tipo === 'oleo')
    return (
      <g>
        <path d={forma} fill="#1d1d1d" opacity={0.9} />
        <ellipse cx={x - r * 0.3} cy={y - r * 0.3} rx={r * 0.3} ry={r * 0.12} fill="#6b6b6b" />
      </g>
    );
  if (tipo === 'fogo')
    return (
      <g>
        <path d={forma} fill="#1d1d1d" />
        {[-0.5, 0, 0.5].map((k, i) => (
          <path key={i} d={`M${x + k * r - 10} ${y + 8} q4 ${-24 - Math.sin(t * 9 + i) * 8} 10 -30 q6 ${8 + Math.cos(t * 7 + i) * 6} 10 30Z`} fill={i % 2 ? '#e0412b' : '#f08a1c'} stroke={P} stroke-width={1.5} />
        ))}
      </g>
    );
  if (tipo === 'agua') return <path d={forma} fill="#3aa0e0" opacity={0.75} stroke="#2b5f8a" stroke-width={2} />;
  if (tipo === 'eletrica')
    return (
      <g>
        <path d={forma} fill="#3aa0e0" opacity={0.8} stroke="#2b5f8a" stroke-width={2} />
        <path d={`M${x - r * 0.6} ${y - 4} l12 -10 l4 12 l12 -12 l4 14 l12 -10`} fill="none" stroke="#f2c230" stroke-width={4} opacity={Math.sin(t * 30) > 0 ? 1 : 0.4} />
      </g>
    );
  return <circle cx={x} cy={y - 10} r={r * 1.3} fill="#efe3c4" opacity={0.75} />;
}

function EfeitoSvg({ e, t }: { e: Combate['efeitos'][number]; t: number }) {
  const k = (t - e.t0) / Math.max(0.01, e.ate - e.t0);
  const rot = (e.a * 180) / Math.PI;
  if (e.tipo === 'faisca')
    return (
      <g transform={`translate(${e.x} ${e.y})`}>
        {[0, 72, 144, 216, 288].map((d) => (
          <line key={d} x1={0} y1={0} x2={0} y2={-e.l * (0.5 + k)} stroke="#f2c230" stroke-width={3} transform={`rotate(${d + rot})`} />
        ))}
      </g>
    );
  if (e.tipo === 'explosao' || e.tipo === 'impacto' || e.tipo === 'pancada' || e.tipo === 'parafuso')
    return (
      <g transform={`translate(${e.x} ${e.y})`} opacity={1 - k}>
        {e.tipo === 'parafuso' ? (
          <>
            <rect x={-4} y={-10} width={8} height={18} fill="#9aa0a6" stroke={P} stroke-width={2} />
            <rect x={-8} y={-14} width={16} height={6} fill="#9aa0a6" stroke={P} stroke-width={2} />
          </>
        ) : (
          <path
            d={Array.from({ length: 16 }, (_, i) => `${i ? 'L' : 'M'}${Math.sin((i * Math.PI) / 8) * e.l * (i % 2 ? 0.5 : 1) * (0.6 + k * 0.5)} ${-Math.cos((i * Math.PI) / 8) * e.l * (i % 2 ? 0.5 : 1) * (0.6 + k * 0.5)}`).join(' ') + 'Z'}
            fill={e.tipo === 'explosao' ? '#f08a1c' : e.tipo === 'pancada' ? '#efe3c4' : '#f2c230'}
            stroke={P}
            stroke-width={3}
          />
        )}
      </g>
    );
  if (e.tipo === 'chamas')
    return (
      <g transform={`translate(${e.x} ${e.y}) rotate(${rot})`}>
        <path d={`M0 0 L${-e.l * 0.38} ${-e.l} Q0 ${-e.l * 1.15} ${e.l * 0.38} ${-e.l}Z`} fill="#f08a1c" opacity={0.85} stroke="#e0412b" stroke-width={4} />
        <path d={`M0 0 L${-e.l * 0.18} ${-e.l * 0.7} L${e.l * 0.18} ${-e.l * 0.7}Z`} fill="#f2c230" />
      </g>
    );
  if (e.tipo === 'raio')
    return (
      <g transform={`translate(${e.x} ${e.y}) rotate(${rot})`}>
        <path d={`M0 0 l-8 ${-e.l * 0.25} l12 0 l-10 ${-e.l * 0.25} l12 0 l-8 ${-e.l * 0.5}`} fill="none" stroke="#f2c230" stroke-width={5} stroke-linejoin="round" />
      </g>
    );
  // jato (água/propulsor)
  return (
    <g transform={`translate(${e.x} ${e.y}) rotate(${rot})`} opacity={1 - k * 0.6}>
      <path d={`M-4 0 L-10 ${-e.l} L10 ${-e.l} L4 0Z`} fill={e.l > 60 ? '#3aa0e0' : '#f08a1c'} opacity={0.8} />
    </g>
  );
}
