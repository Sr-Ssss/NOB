import type { ComponentChildren } from 'preact';
import type { VistaSala } from '../../core/sala';
import { t, type Chave } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import type { CartaR, Cor, PapelR, VistaRei } from './regras';
import './rei.css';

export { Segurar } from '../revolucao-maquinas/comuns';

export interface PropsRei {
  sala: VistaSala;
  v: VistaRei;
  agora: () => number;
}

/* Design de 27/11 (info/jogos/dois-lados.md → "Design novo"; maquetes em prints-montra/proposta-rei-*.html):
   parede de pedra, estandartes vermelhos, bonecos em emblemas bordados; equipa do Rei = dourado, do Dragão = verde.
   Os nomes internos das cores (azul/vermelho) ficam em regras.ts; só a cor mostrada muda. */
export const BOLA: Record<Cor, string> = { azul: '🟡', vermelho: '🟢', cinza: '⚪' };
/** cor de cada equipa (bolinha, placa do vencedor) */
export const COR_EQ: Record<Cor, string> = { azul: '#e0a92a', vermelho: '#2f9a4a', cinza: '#e8e4da' };
export const ICONE: Record<PapelR, string> = {
  rei: '👑', dragao: '🐉', corte: '🏰', rebelde: '🗡️', escudeiro: '🛡️', domador: '🔥', traidor: '🎭', gemeo: '👯', rival: '⚔️',
  medroso: '🏃', curioso: '🤩', pajem: '🙇', duque: '😤', apostador: '🔮', arqueiro: '🏹', alvo: '🦊', isco: '🎭', batata: '🐸',
};
export const nomePapel = (p: PapelR) => t(('rdPapel_' + p) as Chave);
export const nomeEquipa = (c: Cor) => t(('rdEquipa_' + c) as Chave);
export const nomeSala = (v: Pick<VistaRei, 'def'>, k: 0 | 1) => v.def.salas[k]?.trim() || t(k ? 'rdSala2' : 'rdSala1');
export const textoCarta = (c: CartaR) => `${ICONE[c.papel]} ${nomePapel(c.papel)}`;

/** semente fixa → sempre o mesmo desenho */
function aleatorio(semente: number) {
  let s = semente;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** parede de pedra: tijolos grandes com tom, tamanho e rachas variados (sem chão) */
function paredeSvg(semente: number): string {
  const rnd = aleatorio(semente);
  let c = '<rect width="1280" height="720" fill="#241f30"/>';
  for (let r = 0; r * 100 < 720; r++) {
    let x = r % 2 ? -100 - rnd() * 40 : -rnd() * 40;
    while (x < 1280) {
      const w = 170 + rnd() * 60, y = r * 100, L = 26 + rnd() * 12, h = 265 + rnd() * 12, sat = 10 + rnd() * 8;
      c += `<rect x="${(x + 4).toFixed(0)}" y="${y + 4}" width="${(w - 8).toFixed(0)}" height="92" rx="${(6 + rnd() * 8).toFixed(0)}" fill="hsl(${h.toFixed(0)} ${sat.toFixed(0)}% ${L.toFixed(0)}%)"/>`;
      c += `<rect x="${(x + 4).toFixed(0)}" y="${y + 4}" width="${(w - 8).toFixed(0)}" height="12" rx="6" fill="#fff" opacity="${(0.04 + rnd() * 0.05).toFixed(2)}"/>`;
      c += `<rect x="${(x + 4).toFixed(0)}" y="${y + 80}" width="${(w - 8).toFixed(0)}" height="16" rx="6" fill="#000" opacity="${(0.12 + rnd() * 0.08).toFixed(2)}"/>`;
      const k = rnd();
      if (k < 0.25) c += `<path d="M${(x + 20 + rnd() * (w - 60)).toFixed(0)} ${y + 10} l${(8 - rnd() * 16).toFixed(0)} ${(20 + rnd() * 20).toFixed(0)} l${(10 - rnd() * 20).toFixed(0)} ${(15 + rnd() * 20).toFixed(0)}" stroke="#1c1826" stroke-width="3" fill="none" opacity=".6"/>`;
      else if (k < 0.5) for (let i = 0; i < 4; i++) c += `<circle cx="${(x + 20 + rnd() * (w - 40)).toFixed(0)}" cy="${(y + 20 + rnd() * 60).toFixed(0)}" r="${(2 + rnd() * 4).toFixed(1)}" fill="#1c1826" opacity=".35"/>`;
      else if (k < 0.62) c += `<path d="M${(x + 4).toFixed(0)} ${y + 4} h${(30 + rnd() * 30).toFixed(0)} l-20 22 z" fill="#241f30"/>`;
      x += w;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="p" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3d3550"/><stop offset="1" stop-color="#5a5068"/></linearGradient></defs>${c}<rect width="1280" height="720" fill="url(#p)" opacity=".25"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
let parede: string | null = null;
/** fundo de pedra (gerado uma vez) */
export const PAREDE = () => (parede ??= paredeSvg(7));

/* ---------- emblema bordado ---------- */
export type Orla = 'neutro' | 'ouro' | 'verde' | 'bran';
/** orla da equipa na revelação */
export const ORLA_DE: Record<Cor, Orla> = { azul: 'ouro', vermelho: 'verde', cinza: 'bran' };
/** [ponto cheio, contorno/costura, brilho] */
const ORLA: Record<Orla, [string, string, string]> = {
  neutro: ['#6d6a78', '#3e3c48', '#a9a6b4'],
  ouro: ['#e0a92a', '#7a4a10', '#ffe08a'],
  verde: ['#2f9a4a', '#123d1e', '#7fdc8a'],
  bran: ['#e8e4da', '#8a8270', '#ffffff'],
};

/** boneco (cores normais) dentro de um emblema redondo bordado; só a orla muda de cor. Tamanho pela variável CSS --emb. */
export function Emblema({ n, orla = 'neutro' }: { n: number; orla?: Orla }) {
  const [o, oe, oc] = ORLA[orla];
  return (
    <span class={'rd-emb orla-' + orla}>
      <svg class="rd-emb-orla" viewBox="-70 -70 140 140" aria-hidden="true">
        <circle r="65" fill="#000" opacity=".35" cx="4" cy="5" />
        <circle r="64" fill={oe} />
        <circle r="58" fill={o} />
        <circle r="58" fill="none" stroke={oe} stroke-width="12" stroke-dasharray="1.2 2.4" opacity=".6" />
        <circle r="58" fill="none" stroke={oc} stroke-width="12" stroke-dasharray="1 4" opacity=".5" />
        <circle r="50" fill={o} />
        <circle r="50" fill={oc} opacity=".25" />
        <circle r="45" fill="none" stroke={oe} stroke-width="2.5" stroke-dasharray="5 4" />
      </svg>
      <Avatar n={n} tam={64} />
    </span>
  );
}

/* ---------- símbolos das salas ---------- */
export function Sol() {
  return (
    <svg class="rd-simbolo" viewBox="-50 -50 100 100" aria-hidden="true">
      <g stroke="#e0b04a" stroke-width="6" stroke-linecap="round">
        <path d="M0 -36v-10M0 36v10M-36 0h-10M36 0h10M-26 -26l-7 -7M26 26l7 7M-26 26l-7 7M26 -26l7 -7" />
      </g>
      <circle r="26" fill="#e9c062" />
      <circle r="26" fill="none" stroke="#b8862a" stroke-width="3" />
    </svg>
  );
}
export function Lua() {
  return (
    <svg class="rd-simbolo" viewBox="-50 -50 100 100" aria-hidden="true">
      <path d="M10 -32a34 34 0 1 0 0 64a26 26 0 1 1 0 -64z" fill="#e9c062" stroke="#b8862a" stroke-width="3" />
      <circle cx="26" cy="-20" r="4" fill="#e0b04a" />
      <circle cx="34" cy="8" r="3" fill="#e0b04a" />
    </svg>
  );
}
export const Simbolo = ({ k }: { k: 0 | 1 }) => (k ? <Lua /> : <Sol />);

/* ---------- estandarte ---------- */
/** pano em coordenadas locais: 334 de largura, ponta em baixo a 470 */
const W = 334, B0 = 410, PONTA = 470;
const PANO = `M0 0 H${W} V${B0} L${W / 2} ${PONTA} L0 ${B0} Z`;
/** pano rasgado e queimado só na ponta de baixo do lado direito (o do fogo); não chega aos emblemas */
const RASGADO = (() => {
  const rnd = aleatorio(9);
  const Y1 = 375, Y2 = B0 + 30, pts: [number, number][] = [[W, Y1]];
  for (let i = 1; i <= 9; i++) {
    const u = i / 9, y = Y1 + u * (Y2 - Y1), dd = 4 + rnd() * 12 + Math.pow(u, 1.3) * 80;
    pts.push([W - dd, y]);
    if (rnd() < 0.3 && i < 9) pts.push([W - dd - 18 - rnd() * 18, y + 5], [W - dd + 2, y + 10]);
  }
  const xf = 0.62 * (W / 2);
  for (let i = 1; i <= 9; i++) {
    const u = i / 9, bx = W - 90 + u * (xf - (W - 90));
    pts.push([bx, Y2 + u * 8 - (i % 3 === 1 ? 10 + rnd() * 22 : rnd() * 8)]);
  }
  pts.push([xf, B0 + 0.62 * 60]);
  const linha = pts.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`).join(' ');
  return { forma: `M0 0 H${W} ${linha.replace(/^M/, 'L')} L0 ${B0} Z`, borda: pts.slice(1).map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`).join(' ') };
})();

/** o pano (fundo do estandarte, esticado à caixa); queimado = rasgado no canto do fogo (espelhado na sala 1) */
function Pano({ k, queimado }: { k: 0 | 1; queimado: boolean }) {
  const id = 'rd-pano' + k;
  const forma = queimado ? RASGADO.forma : PANO;
  const listras = [0, 0.12, 0.25, 0.4, 0.55, 0.72, 0.86, 1];
  return (
    <svg class={'rd-pano' + (queimado ? ' queimado' : '')} viewBox={`-2 -2 ${W + 4} ${PONTA + 22}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          {listras.map((o, i) => (
            <stop key={o} offset={o} stop-color={i % 2 ? '#93343f' : '#6e2530'} />
          ))}
        </linearGradient>
        <radialGradient id={id + 'q'} gradientUnits="userSpaceOnUse" cx={W + 10} cy={B0 + 70} r="240">
          <stop offset="0" stop-color="#0d0705" stop-opacity=".97" />
          <stop offset=".4" stop-color="#140b07" stop-opacity=".8" />
          <stop offset=".7" stop-color="#2a140a" stop-opacity=".35" />
          <stop offset="1" stop-color="#2a140a" stop-opacity="0" />
        </radialGradient>
        <clipPath id={id + 'c'}>
          <path d={forma} />
        </clipPath>
      </defs>
      <path d={forma} fill="#1b1526" opacity=".35" transform="translate(8 10)" />
      <g clip-path={`url(#${id}c)`}>
        <path d={forma} fill={`url(#${id})`} />
        <path d={`M18 16 H${W - 18} V${B0 - 10} L${W / 2} ${PONTA - 34} L18 ${B0 - 10} Z`} fill="none" stroke="#d9a84a" stroke-width="4" vector-effect="non-scaling-stroke" />
        {queimado && (
          <g class="rd-queima">
            <rect x="0" y="0" width={W + 20} height={PONTA + 20} fill={`url(#${id}q)`} />
            <path d={RASGADO.borda} fill="none" stroke="#0d0705" stroke-width="16" stroke-linejoin="round" opacity=".85" />
            <path d={RASGADO.borda} fill="none" stroke="#ff7a1f" stroke-width="5" stroke-linejoin="round" />
            <path d={RASGADO.borda} fill="none" stroke="#ffd35a" stroke-width="1.8" stroke-linejoin="round" />
          </g>
        )}
      </g>
      {/* franja dourada (a parte queimada já não a tem) */}
      {Array.from({ length: 25 }, (_, i) => i / 24)
        .filter((u) => !queimado || u <= 0.3)
        .map((u) => {
          const fx = u * W, fy = B0 + 60 * (1 - Math.abs(u - 0.5) * 2);
          return <path key={u} d={`M${fx.toFixed(1)} ${fy.toFixed(1)} v16`} stroke="#d9a84a" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke" />;
        })}
      {queimado && (
        <g class="rd-brasas">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <circle key={i} cx={W / 2 + 30 + i * 18} cy={B0 - 20 - ((i * 37) % 70)} r={1.5 + (i % 2)} fill="#ffb84a" />
          ))}
        </g>
      )}
    </svg>
  );
}

/** vara de madeira, cordão e pontas douradas (por cima do pano) */
function Vara() {
  return (
    <svg class="rd-vara" viewBox="0 0 420 96" aria-hidden="true">
      <path d="M14 82 L210 14 L406 82" stroke="#c9a66a" stroke-width="5" fill="none" />
      <circle cx="210" cy="11" r="9" fill="#5b3c25" />
      <path d="M10 82 H410" stroke="#5b3c25" stroke-width="18" stroke-linecap="round" />
      <path d="M12 78 H408" stroke="#a8794a" stroke-width="6" stroke-linecap="round" />
      <circle cx="10" cy="82" r="14" fill="#e9c062" stroke="#b8862a" stroke-width="3" />
      <circle cx="410" cy="82" r="14" fill="#e9c062" stroke="#b8862a" stroke-width="3" />
    </svg>
  );
}

/** tocha de parede (TV): chama em 3 camadas que tremeluz */
export function Tocha({ lado }: { lado: 'esq' | 'dir' }) {
  return (
    <svg class={'rd-tocha ' + lado} viewBox="-100 -100 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="rd-t-luz" r=".5">
          <stop offset="0" stop-color="#ffd890" stop-opacity=".55" />
          <stop offset="1" stop-color="#ffd890" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="rd-t-f1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#ff5a1f" stop-opacity="0" />
          <stop offset=".35" stop-color="#ff6a1f" />
          <stop offset="1" stop-color="#c2300f" />
        </linearGradient>
        <linearGradient id="rd-t-f2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#ffb12e" stop-opacity=".2" />
          <stop offset=".4" stop-color="#ffa62a" />
          <stop offset="1" stop-color="#ff7a1f" />
        </linearGradient>
        <linearGradient id="rd-t-f3" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#fff6c8" stop-opacity=".3" />
          <stop offset=".5" stop-color="#fff3b0" />
          <stop offset="1" stop-color="#ffd35a" />
        </linearGradient>
        <linearGradient id="rd-t-cabo" x1="0" x2="1">
          <stop offset="0" stop-color="#3b2516" />
          <stop offset=".45" stop-color="#7a5232" />
          <stop offset="1" stop-color="#2e1c10" />
        </linearGradient>
        <linearGradient id="rd-t-ferro" x1="0" x2="1">
          <stop offset="0" stop-color="#1e1e24" />
          <stop offset=".5" stop-color="#55555f" />
          <stop offset="1" stop-color="#1a1a20" />
        </linearGradient>
      </defs>
      <circle class="rd-tocha-luz" r="100" fill="url(#rd-t-luz)" />
      <path d="M-6 26h12v30h-12z" fill="url(#rd-t-ferro)" />
      <path d="M-4 38q-14 0-16 -14M4 38q14 0 16 -14" stroke="#2a2a30" stroke-width="3.5" fill="none" stroke-linecap="round" />
      <path d="M-7 -2h14l-4 46h-6z" fill="url(#rd-t-cabo)" />
      <path d="M-6 6l12 4M-6 12l12 4M-5 18l10 4" stroke="#2a180c" stroke-width="2" opacity=".7" />
      <path d="M-15 20h30l-3 7h-24z" fill="url(#rd-t-ferro)" />
      <path d="M-10 -8q10 -4 20 0l-2 9q-8 3 -16 0z" fill="#3a2a1e" />
      <g class="rd-chama">
        <path d="M0 -62c5 12 17 20 16 38c-1 14 -8 20 -16 20c-9 0 -17 -7 -16 -20c1 -10 7 -14 8 -26c3 6 6 7 8 -12z" fill="url(#rd-t-f1)" />
        <path d="M2 -46c4 9 12 16 10 28c-1 9 -6 13 -12 13c-7 0 -12 -5 -11 -13c1 -7 5 -10 6 -18c2 4 5 3 7 -10z" fill="url(#rd-t-f2)" />
        <path d="M1 -28c3 6 7 10 6 17c-1 5 -4 7 -7 7c-4 0 -7 -3 -6 -8c1 -5 4 -7 5 -12c1 2 2 1 2 -4z" fill="url(#rd-t-f3)" />
      </g>
    </svg>
  );
}

/** explosão de fogo única (clarão → cresce → faíscas → some), centrada no canto de baixo */
const EXPLOSAO = (() => {
  const rnd = aleatorio(41);
  const N = 17, raios = Array.from({ length: N }, () => 0.6 + rnd() * 0.9);
  const forma = (R: number, k: number) => {
    let p = '';
    const v = (a: number, rr: number) => `${(rr * Math.cos(a)).toFixed(1)} ${(rr * Math.sin(a)).toFixed(1)}`;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 0.5) / N) * Math.PI * 2, a2 = ((i + 1) / N) * Math.PI * 2;
      const r = R * (1 + (raios[i] - 1) * k), ri = R * 0.72;
      p += `${i ? '' : 'M' + v(a0, ri)} Q${v(a0 + 0.02, r * 0.95)} ${v(a1, r)} Q${v(a2 - 0.02, r * 0.95)} ${v(a2, ri)} `;
    }
    return p + 'Z';
  };
  const faiscas = Array.from({ length: 22 }, () => {
    const a = Math.PI * (0.95 + rnd() * 0.6), r1 = 300 + rnd() * 120, r2 = r1 + 20 + rnd() * 40;
    return { d: `M${(r1 * Math.cos(a)).toFixed(0)} ${(r1 * Math.sin(a)).toFixed(0)} L${(r2 * Math.cos(a)).toFixed(0)} ${(r2 * Math.sin(a)).toFixed(0)}`, cor: rnd() < 0.5 ? '#ffd07a' : '#ff8a2a', w: (2 + rnd() * 3).toFixed(1) };
  });
  return { camadas: [forma(300, 1), forma(260, 1), forma(205, 0.85), forma(145, 0.7), forma(85, 0.5)], faiscas };
})();

function Explosao({ esq }: { esq: boolean }) {
  const [fora, c1, c2, c3, c4] = EXPLOSAO.camadas;
  return (
    <div class={'rd-explosao' + (esq ? ' esq' : '')} aria-hidden="true">
      <svg viewBox="-480 -480 960 960">
        <defs>
          <radialGradient id="rd-ex-brilho" r=".5">
            <stop offset="0" stop-color="#ffb04a" stop-opacity=".8" />
            <stop offset=".5" stop-color="#ff6a1f" stop-opacity=".25" />
            <stop offset="1" stop-color="#ff6a1f" stop-opacity="0" />
          </radialGradient>
          <filter id="rd-ex-d1" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id="rd-ex-d2" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>
        <circle class="rd-ex-clarao" r="480" fill="url(#rd-ex-brilho)" />
        <g class="rd-ex-bola">
          <path d={fora} fill="#ff5a1f" opacity=".7" filter="url(#rd-ex-d1)" />
          <g filter="url(#rd-ex-d2)">
            <path d={c1} fill="#c8320f" />
            <path d={c2} fill="#ff6a1f" />
            <path d={c3} fill="#ffaa2e" />
            <path d={c4} fill="#fff1b8" />
          </g>
        </g>
        <g class="rd-ex-faiscas">
          {EXPLOSAO.faiscas.map((f, i) => (
            <path key={i} d={f.d} stroke={f.cor} stroke-width={f.w} stroke-linecap="round" />
          ))}
        </g>
      </svg>
    </div>
  );
}

/** a cor da orla no fim (cor da carta) */
const orlaDe = (v: VistaRei, id: string): Orla => (v.fase === 'fim' && v.cartas[id] ? ORLA_DE[v.cartas[id].cor] : 'neutro');
/** tamanho do emblema conforme quantos há no estandarte */
const tamEmb = (n: number, fim: boolean) => (n <= 3 ? 7 : n <= 6 ? 6 : n <= 9 ? 5 : 4.2) * (fim ? 0.9 : 1);

/** quem está num estandarte (líder primeiro) */
function Gente({ sala, v, k }: { sala: VistaSala; v: VistaRei; k: 0 | 1 }) {
  const lider = v.lideres[k];
  const lista = [...v.salas[k]].sort((a, b) => (a === lider ? -1 : b === lider ? 1 : 0));
  const fim = v.fase === 'fim';
  return (
    <div class="rd-gente" style={{ '--emb': tamEmb(lista.length, fim) + 'cqw' }}>
      {lista.map((id) => {
        const c = v.cartas[id];
        return (
          <div key={id} class={'rd-pessoa' + (v.mudando.includes(id) ? ' novo' : '')}>
            <span class="rd-av">
              <Emblema n={avatarDe(sala, id)} orla={orlaDe(v, id)} />
              {id === lider && !fim && <span class="rd-coroa">👑</span>}
            </span>
            {fim && c ? (
              <span class="rd-fita">
                {nomePapel(c.papel)}
                {v.batata === id ? ' 🐸' : ''}
              </span>
            ) : null}
            <span class="rd-nome">{nomeDe(sala, id)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** o meio (entre os estandartes): relógio e quem está a mudar de sala */
function Meio({ sala, v, agora }: PropsRei) {
  return (
    <div class="rd-meio">
      <div class="rd-relogio">{v.fase === 'fim' ? '🕛' : <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}</div>
      {v.fase === 'troca' && (
        <div class="rd-atravessa">
          {v.mudando.map((id) => (
            <span key={id} class={'rd-viajante' + (v.chegaram.includes(id) ? ' chegou' : '')}>
              <Avatar n={avatarDe(sala, id)} tam={56} />
              <b>{nomeDe(sala, id)}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** sala onde está o Dragão (no fim) */
export function salaDoFogo(v: VistaRei): 0 | 1 | null {
  if (v.fase !== 'fim') return null;
  const dragao = Object.keys(v.cartas).find((id) => v.cartas[id].papel === 'dragao');
  return dragao ? (v.salas[0].includes(dragao) ? 0 : 1) : null;
}

/** os dois estandartes na parede (TV, ou o "Painel" sem TV); `meio` substitui o relógio (TV no fim) */
export function Castelos({ sala, v, agora, compacto = false, meio }: PropsRei & { compacto?: boolean; meio?: ComponentChildren }) {
  const fim = v.fase === 'fim';
  const fogo = salaDoFogo(v);
  return (
    <div class={'rd-castelos' + (compacto ? ' compacto' : '') + (fim ? ' fim' : '')} style={compacto ? { backgroundImage: PAREDE() } : undefined}>
      {!compacto && <Tocha lado="esq" />}
      {!compacto && <Tocha lado="dir" />}
      {([0, 1] as const).map((k) => (
        <div key={k} class={'rd-estandarte' + (fogo === k ? ' fogo' : '')} style={{ order: k === 0 ? 0 : 2 }}>
          <Vara />
          <div class={'rd-pano-caixa' + (fogo === 0 ? ' espelho' : '')}>
            <Pano k={k} queimado={fogo === k} />
          </div>
          <div class="rd-dentro">
            <h2 class="rd-titulo">{nomeSala(v, k)}</h2>
            <Simbolo k={k} />
            {!fim && v.lideres[k] && <p class="rd-lider">{t('rdLider', { nome: nomeDe(sala, v.lideres[k]) })}</p>}
            <Gente sala={sala} v={v} k={k} />
          </div>
          {fogo === k && (
            <div class={'rd-fumo' + (k === 0 ? ' esq' : '')} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>
      ))}
      <div class="rd-meio-caixa" style={{ order: 1 }}>
        {meio ?? <Meio sala={sala} v={v} agora={agora} />}
      </div>
      {fogo !== null && <Explosao esq={fogo === 0} />}
    </div>
  );
}

/** o texto grande da fase (igual para todos) */
export function narracao(sala: VistaSala, v: VistaRei): string {
  switch (v.fase) {
    case 'ir':
      return t('rdEsperam', { n: v.prontos.length, t: v.participantes.length });
    case 'carta':
      return t('rdSuaCarta') + ' · ' + t('rdEsperam', { n: v.prontos.length, t: v.participantes.length });
    case 'lider':
      return '👑 ' + t('rdLideres');
    case 'ronda':
      return v.novoLider ? t('rdNovoLider', { sala: nomeSala(v, v.novoLider.sala), nome: nomeDe(sala, v.novoLider.id) }) : t('rdRonda', { r: v.ronda, t: v.rondas });
    case 'troca':
      return '🚶 ' + t('rdMudando') + ': ' + v.mudando.map((id) => nomeDe(sala, id)).join(', ');
    case 'aposta':
      return '🌙 ' + t('rdAntesMeiaNoite');
    case 'fim':
      return v.vencedor ? '🕛 ' + t(('rdVence_' + v.vencedor) as Chave) : '';
  }
}
