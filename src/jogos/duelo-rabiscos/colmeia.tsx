import { useMemo } from 'preact/hooks';
import { CORES, GROSSURAS, type Traco } from '../../ui/tracos';
import { ICONES_CLASSE, MARCAS } from './artes/icones';
import { Riscos } from './artes/lapis';
import { MOLDES } from './artes/moldes';
import { OBSTACULOS, Obstaculo, type TipoObstaculo } from './artes/obstaculos';
import { Hexagono, centroHex, type EstadoHex } from './artes/tabuleiro';
import { CRIATURAS, type Criatura } from './criaturas';
import type { Cria, Desenhos, VistaDuelo } from './regras';
import { ler, type Casa } from './tabuleiro';
import { TEXTO_CRIATURA, TXT } from './textos';

/** cor e forma de cada mago, pela ordem da mesa */
export const CORES_MAGO = ['#2f6fd0', '#d9571e', '#2c8a4b', '#8a3fb0'];
const FORMAS = ['M-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M-8 -8L8 -8L8 8L-8 8Z', 'M0 -11L10 8L-10 8Z', 'M0 -12L12 0L0 12L-12 0Z'];

export const indice = (v: Pick<VistaDuelo, 'participantes'>, id: string) => Math.max(0, v.participantes.indexOf(id));

/** forma do mago, solta (fora da colmeia) */
export function Sinal({ i, tam = 24 }: { i: number; tam?: number }) {
  return (
    <svg viewBox="-14 -14 28 28" width={tam} height={tam} aria-hidden="true">
      <path d={FORMAS[i]} fill={CORES_MAGO[i]} stroke="#fff" stroke-width="2.5" />
    </svg>
  );
}

/** o desenho cortado à volta dos riscos, ou o molde, dentro de `larg`×`alt` centrado em (0,0) */
function Figura({ criatura, tracos, larg, alt }: { criatura: Criatura; tracos?: Traco[]; larg: number; alt: number }) {
  const x = useMemo(() => {
    if (!tracos?.length) return null;
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    const riscos = tracos.map((t) => {
      let d = '';
      for (let i = 0; i + 1 < t.p.length; i += 2) {
        const [px, py] = [t.p[i], t.p[i + 1]];
        [x0, y0, x1, y1] = [Math.min(x0, px), Math.min(y0, py), Math.max(x1, px), Math.max(y1, py)];
        d += (i ? 'L' : 'M') + px + ' ' + py;
      }
      // um ponto só também se vê
      return { d: t.p.length === 2 ? d + 'l.1 0' : d, cor: CORES[t.c], g: GROSSURAS[t.g] };
    });
    // nunca mais de 3 vezes maior que o desenhado
    return { riscos, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, k: Math.min(larg / Math.max(x1 - x0, 130), alt / Math.max(y1 - y0, 100)) };
  }, [tracos, larg, alt]);
  const k = x?.k ?? Math.min(larg / 320, alt / 280);
  return (
    <g transform={`scale(${k}) translate(${-(x?.cx ?? 200)} ${-(x?.cy ?? 150)})`} fill="none" stroke-linecap="round" stroke-linejoin="round">
      {x ? x.riscos.map((r, i) => <path key={i} d={r.d} stroke={r.cor} stroke-width={Math.max(r.g, 2.2 / k)} />) : <path d={MOLDES[criatura]} stroke="#2b2a33" stroke-width={2.4 / k} />}
    </g>
  );
}

/** desenho de uma criatura, solto (listas e batalha) */
export function Retrato({ criatura, tracos, tam = 64 }: { criatura: Criatura; tracos?: Traco[]; tam?: number | string }) {
  return (
    <svg class="dr-retrato" viewBox="-50 -42 100 84" width={tam} aria-hidden="true">
      <Figura criatura={criatura} tracos={tracos} larg={92} alt={76} />
    </svg>
  );
}

export const efeitos = (c: Cria) => (c.sono ? '💤' : '') + (c.escudo ? '🛡️' : '') + (c.furia ? '🔥' : '') + (c.maisAtaque ? '⚔️' : '') + (c.fantasma ? '👻' : '');

function Peca({ c, i, tracos }: { c: Cria; i: number; tracos?: Traco[] }) {
  return (
    <g class="dr-peca" opacity={c.fantasma ? 0.75 : 1}>
      <path d="M0 -43L37 -22L37 22L0 43L-37 22L-37 -22Z" fill={CORES_MAGO[i]} fill-opacity="0.2" stroke={CORES_MAGO[i]} stroke-width="6" stroke-linejoin="round" />
      <Figura criatura={c.tipo} tracos={tracos} larg={62} alt={50} />
      {/* as marcas dos ferimentos por cima do desenho (só visual) */}
      {c.marcas.slice(-3).map((m, k) => (
        <g key={k} transform={`translate(${-26 + k * 14} ${-14 + k * 8}) scale(.3)`} opacity="0.9">
          <Riscos c={MARCAS[m]} g={6} />
        </g>
      ))}
      <path d={FORMAS[i]} transform="translate(-24 27)" fill={CORES_MAGO[i]} stroke="#fff" stroke-width="2.5" />
      <g transform="translate(13 -43) scale(.27)">
        <circle cx="50" cy="50" r="58" fill="#fffdf2" stroke="#2b2a33" stroke-width="6" />
        <Riscos c={ICONES_CLASSE[CRIATURAS[c.tipo].classe]} g={6} />
      </g>
      {c.ferimentos > 0 && (
        <g transform="translate(24 27)">
          <circle r="14" fill="#c22f3c" stroke="#fff" stroke-width="2.5" />
          <text y="7" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">
            {c.ferimentos}
          </text>
        </g>
      )}
      <text x="-30" y="-20" font-size="18">
        {efeitos(c)}
      </text>
    </g>
  );
}

const TIPOS = Object.keys(OBSTACULOS) as TipoObstaculo[];

interface Props {
  v: VistaDuelo;
  desenhos: Desenhos;
  /** casas onde se pode tocar, e como se veem */
  acesas?: Map<Casa, EstadoHex>;
  /** casas já escolhidas */
  marcadas?: Casa[];
  aoTocar?: (c: Casa) => void;
  nome?: (id: string) => string;
}

/** a colmeia toda; com `aoTocar`, as casas acesas são botões */
export function ColmeiaDuelo({ v, desenhos, acesas, marcadas = [], aoTocar, nome = (x) => x }: Props) {
  const centros = v.tabuleiro.casas.map((c) => ({ c, ...centroHex(...ler(c)) }));
  const xs = centros.map((p) => p.x);
  const ys = centros.map((p) => p.y);
  const [x0, y0] = [Math.min(...xs) - 47, Math.min(...ys) - 54];
  const dica = (casa: Casa, cr: Cria | undefined) => {
    const [col, lin] = ler(casa);
    return TXT.casa(lin + 1, col + 1) + (cr ? `: ${TEXTO_CRIATURA[cr.tipo].nome}, ${nome(cr.dono)}${cr.ferimentos ? ', ' + TXT.ferimentos(cr.ferimentos) : ''}` : '');
  };
  return (
    <svg class="dr-colmeia" viewBox={`${x0} ${y0} ${Math.max(...xs) + 47 - x0} ${Math.max(...ys) + 54 - y0}`} role="group" aria-label={TXT.colmeia}>
      {centros.map(({ c, x, y }, i) => {
        const cr = v.criaturas.find((k) => k.casa === c);
        const muro = v.muralhas.some((m) => m.casa === c);
        const pedra = v.tabuleiro.obstaculos.includes(c);
        const alvo = acesas?.get(c) === 'alvo';
        // a mira por trás do desenho confunde: o alvo com criatura é só o contorno vermelho
        const estado = cr && alvo ? 'normal' : muro ? 'bloqueado' : (acesas?.get(c) ?? 'normal');
        const toca = aoTocar && acesas?.has(c);
        return (
          <g
            key={c}
            class={'dr-casa' + (toca ? ' toca' : '')}
            data-casa={c}
            role={toca ? 'button' : undefined}
            tabIndex={toca ? 0 : undefined}
            aria-label={toca ? dica(c, cr) : undefined}
            aria-pressed={toca ? marcadas.includes(c) : undefined}
            onClick={toca ? () => aoTocar(c) : undefined}
            onKeyDown={
              toca
                ? (ev: KeyboardEvent) => {
                    if (ev.key !== 'Enter' && ev.key !== ' ') return;
                    ev.preventDefault();
                    aoTocar(c);
                  }
                : undefined
            }
          >
            <Hexagono estado={estado} x={x} y={y}>
              {pedra && <Obstaculo tipo={TIPOS[(i * 7) % TIPOS.length]} versao={(i % 2) as 0 | 1} />}
              {cr && <Peca c={cr} i={indice(v, cr.dono)} tracos={desenhos[cr.dono]?.[cr.tipo]} />}
              {marcadas.includes(c) && <path d="M0 -45L39 -23L39 23L0 45L-39 23L-39 -23Z" fill="none" stroke="#1b1b1b" stroke-width="8" stroke-dasharray="14 7" />}
              {alvo && <path d="M0 -46L40 -23L40 23L0 46L-40 23L-40 -23Z" fill="#ff5a4a" fill-opacity="0.22" stroke="#c22f3c" stroke-width="9" />}
            </Hexagono>
          </g>
        );
      })}
    </svg>
  );
}
