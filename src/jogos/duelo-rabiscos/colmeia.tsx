import type { JSX } from 'preact';
import { useMemo } from 'preact/hooks';
import { CORES, GROSSURAS, type Traco } from '../../ui/tracos';
import { ICONES_CLASSE, MARCAS } from './artes/icones';
import { Riscos, type Camada } from './artes/lapis';
import { MOLDES } from './artes/moldes';
import { Obstaculo } from './artes/obstaculos';
import { ARTE_PLANA, Barreira, ESTRUTURAS_POR_TAMANHO, Estrutura, type TipoEstrutura } from './estruturas';
import { Hexagono, camadasHex, centroHex, type EstadoHex } from './artes/tabuleiro';
import { CRIATURAS, type Classe, type Criatura } from './criaturas';
import type { Cria, Desenhos, VistaDuelo } from './regras';
import { distancia, ler, vizinhas, type Casa } from './tabuleiro';
import { TEXTO_CRIATURA, TXT } from './textos';
import { EfeitosPeca } from './artes/efeitos';

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

/** envolvente convexa (fundo do autocolante, sem buracos) */
function envolvente(l: [number, number][]): string {
  const p = [...l].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p.length ? `M${p[0][0]} ${p[0][1]}l.1 0` : '';
  const vira = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const meia = (q: [number, number][]) => {
    const h: [number, number][] = [];
    for (const x of q) {
      while (h.length >= 2 && vira(h[h.length - 2], h[h.length - 1], x) <= 0) h.pop();
      h.push(x);
    }
    return h.slice(0, -1);
  };
  const h = [...meia(p), ...meia([...p].reverse())];
  return h.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('') + 'Z';
}

/** pontos de um caminho (só os comandos absolutos M L Q C; os arcos dos olhos ficam dentro) */
function pontosCaminho(d: string): [number, number][] {
  const l: [number, number][] = [];
  for (const seg of d.match(/[MLQC][^A-Za-z]*/g) ?? []) {
    const n = (seg.slice(1).match(/-?\d*\.?\d+/g) ?? []).map(Number);
    for (let i = 0; i + 1 < n.length; i += 2) l.push([n[i], n[i + 1]]);
  }
  return l;
}

/** o desenho cortado à volta dos riscos, ou o molde, dentro de `larg`×`alt` centrado em (0,0) */
function Figura({ criatura, tracos, larg, alt, pe = false }: { criatura: Criatura; tracos?: Traco[]; larg: number; alt: number; pe?: boolean }) {
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
    return { riscos, cx: (x0 + x1) / 2, cy: pe ? y1 : (y0 + y1) / 2, k: Math.min(larg / Math.max(x1 - x0, 130), alt / Math.max(y1 - y0, 100)) };
  }, [tracos, larg, alt, pe]);
  const k = x?.k ?? Math.min(larg / 320, alt / 280);
  // de pé: os pés (o fundo do desenho) em y = 0; o molde vai até ~270 na grelha 400×300
  const cy = x?.cy ?? (pe ? 270 : 150);
  // de pé: o fundo branco é a forma toda por fora (sem buracos), como um autocolante recortado
  const fundo = useMemo(() => (pe ? envolvente(x ? tracos!.flatMap((t) => t.p.flatMap((v, i) => (i % 2 ? [] : [[v, t.p[i + 1]] as [number, number]]))) : pontosCaminho(MOLDES[criatura])) : ''), [pe, x, tracos, criatura]);
  const riscos = (borda: number, cor?: string) =>
    x ? (
      x.riscos.map((r, i) => <path key={i} d={r.d} stroke={cor ?? r.cor} stroke-width={Math.max(r.g, 2.2 / k) + borda / k} />)
    ) : (
      <path d={MOLDES[criatura]} stroke={cor ?? '#2b2a33'} stroke-width={(2.4 + borda) / k} />
    );
  return (
    <g transform={`scale(${k}) translate(${-(x?.cx ?? 200)} ${-cy})`} fill="none" stroke-linecap="round" stroke-linejoin="round">
      {/* de pé, como autocolante recortado: borda branca e espessura de cartão */}
      {pe && <path d={fundo} transform={`translate(${3 / k} ${2 / k})`} fill="#b9ad98" stroke="#b9ad98" stroke-width={14 / k} />}
      {pe && <path d={fundo} fill="#fff" stroke="#fff" stroke-width={14 / k} />}
      {riscos(0)}
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

/** `pe`: de pé, com os pés em (0,0) (perspetiva); senão centrada. A cor do dono vai no chão da casa */
function Peca({ c, i, tracos, pe = false }: { c: Cria; i: number; tracos?: Traco[]; pe?: boolean }) {
  return (
    <g class="dr-peca" opacity={c.fantasma ? 0.75 : 1}>
      <Figura criatura={c.tipo} tracos={tracos} larg={62} alt={50} pe={pe} />
      <g transform={pe ? 'translate(0 -25)' : undefined}>
      {/* as marcas dos ferimentos por cima do desenho (só visual) */}
      {c.marcas.slice(-3).map((m, k) => (
        <g key={k} transform={`translate(${-26 + k * 14} ${-14 + k * 8}) scale(.3)`} opacity="0.9">
          <Riscos c={MARCAS[m]} g={6} />
        </g>
      ))}
      {/* símbolo da classe em baixo, à esquerda (sem a forma geométrica), com a borda na cor do dono */}
      <g transform="translate(-34 17) scale(.2)">
        <circle cx="50" cy="50" r="58" fill="#fffdf2" stroke={CORES_MAGO[i]} stroke-width="10" />
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
        {/* efeitos dos poderes (sono, escudo, fúria, +1 ataque, fantasma) */}
        <EfeitosPeca c={c} />
      </g>
    </g>
  );
}

/** cor do dono, bem clarinha, para o chão da casa */
function clara(hex: string, k = 0.68): string {
  const n = parseInt(hex.slice(1), 16);
  const m = (v: number) => Math.round(v + (255 - v) * k);
  return `rgb(${m(n >> 16)}, ${m((n >> 8) & 255)}, ${m(n & 255)})`;
}
const CHAO_OBSTACULO = '#cfccc4';


/** colmeia vista de lado/cima (aprovada a 26/11); `3d=0` no endereço mostra a vista de cima (só para comparar) */
export const perspetivaLigada = () => !(typeof location !== 'undefined' && /[?&]3d=0/.test(location.hash));
/** tamanho no tabuleiro, por classe (só no tabuleiro) */
const TAMANHO: Record<Classe, number> = { lacaio: 0.72, batedor: 0.85, pescador: 0.88, arqueiro: 0.88, guardiao: 1, duelista: 1, barbaro: 1.15 };
/** inclinação do chão (0 = visto de cima) e distância da "câmara" (em alturas da colmeia) */
export const INCLINA = (54 * Math.PI) / 180;
const CAMARA = 2.2;
/** de pé, as peças podem ser maiores do que a casa */
const EM_PE = 1.6;

export type Proj = (x: number, y: number) => { x: number; y: number; f: number };
/** perspetiva a sério: cada ponto do chão é projetado (a fila da frente fica maior e as casas encaixam) */
export function projecao(pontos: { x: number; y: number }[]): Proj {
  const ys = pontos.map((p) => p.y);
  const xs = pontos.map((p) => p.x);
  const [xc, yc] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const d = CAMARA * (Math.max(...ys) - Math.min(...ys) + 100);
  return (x, y) => {
    const f = d / (d - (y - yc) * Math.sin(INCLINA));
    return { x: xc + (x - xc) * f, y: yc + (y - yc) * Math.cos(INCLINA) * f, f };
  };
}

/** projeta um caminho só com comandos absolutos (M L Q C Z) à volta de (ox, oy); null se tiver outros */
function projetar(d: string, ox: number, oy: number, p: Proj): string | null {
  if (/[a-zA-Z]/.test(d.replace(/[MLQCZ]/g, ''))) return null;
  return d.replace(/(-?\d*\.?\d+)[ ,]+(-?\d*\.?\d+)/g, (_, a: string, b: string) => {
    const q = p(ox + Number(a), oy + Number(b));
    return `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  });
}

/** uma camada qualquer deitada no chão da casa (ox, oy) */
function NoChao({ c, ox, oy, p }: { c: Camada[]; ox: number; oy: number; p: Proj }) {
  const centro = p(ox, oy);
  return (
    <>
      {c.map((l, k) => {
        const d = projetar(l[0], ox, oy, p);
        return d ? (
          <Riscos key={k} c={[[d, l[1], l[2], l[3]]]} />
        ) : (
          <g key={k} transform={`translate(${centro.x} ${centro.y}) scale(${centro.f} ${centro.f * Math.cos(INCLINA)})`}>
            <Riscos c={[l]} />
          </g>
        );
      })}
    </>
  );
}

const MARCADA: Camada = ['M0 -45L39 -23L39 23L0 45L-39 23L-39 -23Z', undefined, 8, '14 7'];
const ALVO: Camada = ['M0 -46L40 -23L40 23L0 46L-40 23L-40 -23Z', 'rgba(255, 90, 74, 0.22)', 9];

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
  const p3 = perspetivaLigada();
  const planos = v.tabuleiro.casas.map((c) => ({ c, ...centroHex(...ler(c)) }));
  const p = projecao(planos);
  // com perspetiva, de trás para a frente: o que está à frente tapa o de trás
  const centros = planos.map((q) => ({ ...q, ...(p3 ? p(q.x, q.y) : { f: 1 }), ox: q.x, oy: q.y })).sort((a, b) => a.y - b.y);
  // cada grupo de obstáculos colados é do mesmo tipo (um bosque, um monte de pedras, uma ruína…), um recorte por casa
  const tipoDe = new Map<Casa, TipoEstrutura>();
  const estruturas = new Map<Casa, { tipo: TipoEstrutura; g: Casa[]; semente: number }>();
  const pedras = new Set(v.tabuleiro.obstaculos);
  for (const c of v.tabuleiro.obstaculos) {
    if (tipoDe.has(c)) continue;
    const g = [c];
    const [c0, l0] = ler(c);
    for (let k = 0; k < g.length; k++) for (const x of vizinhas(g[k])) if (pedras.has(x) && !g.includes(x)) g.push(x);
    const opcoes = ESTRUTURAS_POR_TAMANHO[Math.min(4, g.length)];
    const tipo = opcoes[(c0 * 7 + l0 * 3) % opcoes.length];
    for (const x of g) tipoDe.set(x, tipo);
    // a estrutura desenha-se uma vez, na casa mais à frente (depois do chão das outras)
    const frente = g.reduce((a, x) => (centroHex(...ler(x)).y > centroHex(...ler(a)).y ? x : a));
    estruturas.set(frente, { tipo, g, semente: c0 * 31 + l0 });
  }
  // barreiras dos poderes: casas de muralha coladas formam um muro só, desenhado de pé
  const barreiras: Casa[][] = [];
  {
    const muros = new Set(v.muralhas.map((m) => m.casa));
    const visto = new Set<Casa>();
    for (const c of muros) {
      if (visto.has(c)) continue;
      const g = [c];
      visto.add(c);
      for (let k = 0; k < g.length; k++)
        for (const x of vizinhas(g[k]))
          if (muros.has(x) && !visto.has(x)) {
            visto.add(x);
            g.push(x);
          }
      barreiras.push(g);
    }
  }
  const xs = centros.flatMap((q) => [q.x - (p3 ? 62 : 47) * q.f, q.x + (p3 ? 62 : 47) * q.f]);
  const ys = centros.flatMap((q) => [q.y - (p3 ? 130 : 54) * q.f, q.y + 54 * q.f]);
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const dica = (casa: Casa, cr: Cria | undefined) => {
    const [col, lin] = ler(casa);
    return TXT.casa(lin + 1, col + 1) + (cr ? `: ${TEXTO_CRIATURA[cr.tipo].nome}, ${nome(cr.dono)}${cr.ferimentos ? ', ' + TXT.ferimentos(cr.ferimentos) : ''}` : '');
  };
  // perspetiva: primeiro o chão todo, depois o que está de pé, de trás para a frente (senão o chão de uma casa tapava uma estrutura)
  const objetos: { y: number; el: JSX.Element }[] = [];
  return (
    <svg class="dr-colmeia" viewBox={`${x0} ${y0} ${Math.max(...xs) - x0} ${Math.max(...ys) - y0}`} role="group" aria-label={TXT.colmeia}>
      {centros.map(({ c, x, y, f, ox, oy }) => {
        const cr = v.criaturas.find((k) => k.casa === c);
        const muro = v.muralhas.some((m) => m.casa === c);
        const pedra = v.tabuleiro.obstaculos.includes(c);
        const alvo = acesas?.get(c) === 'alvo';
        // a mira por trás do desenho confunde: o alvo com criatura é só o contorno vermelho
        const estado = cr && alvo ? 'normal' : muro ? 'bloqueado' : (acesas?.get(c) ?? 'normal');
        const toca = aoTocar && acesas?.has(c);
        const [col, lin] = ler(c);
        const tipo = tipoDe.get(c) ?? 'pedra';
        const obstaculo = pedra && <Obstaculo tipo={ARTE_PLANA[tipo]} versao={col + lin} />;
        const peca = cr && <Peca c={cr} i={indice(v, cr.dono)} tracos={desenhos[cr.dono]?.[cr.tipo]} pe={p3} />;
        // casa ocupada: cinzenta (obstáculo) ou da cor do dono, bem clarinha (tropa)
        const cor = estado !== 'normal' ? undefined : pedra ? CHAO_OBSTACULO : cr ? clara(CORES_MAGO[indice(v, cr.dono)]) : undefined;
        const tam = cr ? TAMANHO[CRIATURAS[cr.tipo].classe] : 1;
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
            {p3 ? (
              <>
                <NoChao c={[...camadasHex(estado, cor), ...(marcadas.includes(c) ? [MARCADA] : []), ...(alvo ? [ALVO] : [])]} ox={ox} oy={oy} p={p} />
                {/* o que está de pé vai numa camada por cima de todo o chão (ver `objetos`) */}
                {(() => {
                  const tocar = toca ? () => aoTocar(c) : undefined;
                  const e = estruturas.get(c);
                  if (e) {
                    const pontos = e.g.map((x) => {
                      const q = centroHex(...ler(x));
                      return p(q.x, q.y);
                    });
                    const ligacoes = e.g.flatMap((a, ia) => e.g.flatMap((b, ib) => (ib > ia && distancia(a, b) === 1 ? [[ia, ib] as [number, number]] : [])));
                    objetos.push({ y: Math.max(...pontos.map((q) => q.y)), el: <Estrutura key={'e' + c} tipo={e.tipo} p={pontos} ligacoes={ligacoes} semente={e.semente} achata={Math.cos(INCLINA)} /> });
                  }
                  if (peca)
                    objetos.push({
                      y: y + 0.01,
                      el: (
                        <g key={'p' + cr!.id} class={'dr-anda' + (tocar ? ' dr-casa toca' : '')} onClick={tocar} style={{ transform: `translate(${x}px, ${y + 6 * f}px) scale(${f * EM_PE * tam})` }}>
                          {peca}
                        </g>
                      ),
                    });
                  return null;
                })()}
              </>
            ) : (
              <Hexagono estado={estado} x={x} y={y} cor={cor}>
                {obstaculo}
                {peca}
                {marcadas.includes(c) && <path d={MARCADA[0]} fill="none" stroke="#1b1b1b" stroke-width="8" stroke-dasharray="14 7" />}
                {alvo && <path d={ALVO[0]} fill="#ff5a4a" fill-opacity="0.22" stroke="#c22f3c" stroke-width="9" />}
              </Hexagono>
            )}
          </g>
        );
      })}
      {p3 &&
        barreiras.map((g) => {
          const pontos = g.map((x) => {
            const q = centroHex(...ler(x));
            return p(q.x, q.y);
          });
          const ligacoes = g.flatMap((a, ia) => g.flatMap((b, ib) => (ib > ia && distancia(a, b) === 1 ? [[ia, ib] as [number, number]] : [])));
          objetos.push({ y: Math.max(...pontos.map((q) => q.y)), el: <Barreira key={'b' + g[0]} p={pontos} ligacoes={ligacoes} /> });
          return null;
        })}
      {objetos.sort((a, b) => a.y - b.y).map((o) => o.el)}
    </svg>
  );
}
