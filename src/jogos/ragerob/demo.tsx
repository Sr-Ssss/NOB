import { paramsHash } from '../../core/ids';
import { usarIdioma } from '../../core/i18n';
import type { VistaSala } from '../../core/sala';
import { PRECO } from './pecas';
import { DEF_PADRAO_RAGEROB, T_COMBATE, grupoAtual, novoRagerob, reduzRagerob, vistaRagerob, type AcaoRagerob, type EstadoRagerob } from './regras';
import { Combate } from './fisica';
import { quadroDe } from './quadro';
import { TelemovelRagerob } from './telemovel';
import { TvRagerob } from './tv';

/**
 * só em dev (para as capturas):
 * `#/demo-ragerob?fase=montar|loja|aposta|instalar|combate|resultado|fim&modo=normal|pilotos&ecra=tv|tel[&eu=j1][&semtv=1][&zoom=1.2136]`
 * (sem TV, no combate, um quadro da arena já calculado: src/jogos/ragerob/quadro.ts)
 */
const NOMES = ['Rita', 'Beto', 'Caio', 'Duda', 'Edu'];

function estado(fase: string, modo: 'normal' | 'pilotos'): EstadoRagerob {
  const ids = NOMES.map((_, i) => `j${i + 1}`);
  const T = Date.now();
  let e = novoRagerob(ids, { ...DEF_PADRAO_RAGEROB, modo }, T, [], 4242);
  const ap = (a: AcaoRagerob) => (e = reduzRagerob(e, a, T));
  const tempo = () => (e = reduzRagerob(e, { tipo: 'tick' }, e.terminaEm));
  if (modo === 'pilotos') {
    if (fase === 'montar') return ap({ tipo: 'rr_montar', id: 'j2', corpo: 'pentagono', loco: 'pernas', cabeca: 'ourico' });
    ap({ tipo: 'rr_montar', id: 'j1', corpo: 'quadrado', loco: 'rodas', cabeca: 'rino' });
    tempo();
  }
  if (fase === 'loja') return ap({ tipo: 'rr_ofertas', id: 'j3', ofertas: {} });
  // leilão: a Rita compra 2 módulos, o Beto 1
  ap({ tipo: 'rr_ofertas', id: 'j1', ofertas: { 0: PRECO[e.loja[0]] + 40, 1: PRECO[e.loja[1]] } });
  ap({ tipo: 'rr_ofertas', id: 'j2', ofertas: { 2: PRECO[e.loja[2]] + 10 } });
  tempo();
  if (modo === 'normal') {
    const g = grupoAtual(e);
    if (fase === 'aposta') return ap({ tipo: 'rr_apostar', id: 'j2', robo: g[1], valor: 200 });
    ap({ tipo: 'rr_apostar', id: 'j1', robo: g[0], valor: 300 });
    ap({ tipo: 'rr_apostar', id: 'j2', robo: g[1], valor: 200 });
    ap({ tipo: 'rr_apostar', id: 'j3', robo: g[0], valor: 100 });
    tempo();
  }
  if (fase === 'instalar') return ap({ tipo: 'rr_instalar', id: 'j1', inv: 0, encaixe: 0 });
  ap({ tipo: 'rr_instalar', id: 'j1', inv: 0, encaixe: 0 });
  ap({ tipo: 'rr_instalar', id: 'j1', inv: 0, encaixe: 1 });
  ap({ tipo: 'rr_instalar', id: 'j2', inv: 0, encaixe: 0 });
  while (e.fase === 'instalar') tempo();
  if (fase === 'combate') {
    if (modo === 'normal') ap({ tipo: 'rr_controlar', id: 'j1' });
    return e;
  }
  const g = e.combate!.robos;
  ap({ tipo: 'rr_fim', id: 'tv', ordem: g.map((x) => [x]), dano: Object.fromEntries(g.map((x, i) => [x, 120 - i * 30])), kos: { [g[0]]: 2, [g[1]]: 1 } });
  if (fase === 'resultado') return e;
  let n = 0;
  while (e.fase !== 'fim' && n++ < 200) {
    if (e.fase === 'combate') {
      const r = e.combate!.robos;
      ap({ tipo: 'rr_fim', id: 'tv', ordem: r.map((x) => [x]), dano: Object.fromEntries(r.map((x, i) => [x, 100 - i * 25])), kos: {} });
    } else if (e.fase === 'aposta') {
      ap({ tipo: 'rr_apostar', id: 'j1', robo: grupoAtual(e)[0], valor: 100 });
      tempo();
    } else tempo();
  }
  return e;
}

export function DemoRagerob() {
  const p = paramsHash();
  usarIdioma('pt-BR');
  const modo = p.get('modo') === 'pilotos' ? 'pilotos' : 'normal';
  const e = estado(p.get('fase') ?? 'loja', modo);
  const g0 = { ...e, terminaEm: Date.now() + 17_000 };
  const g = p.get('semtv') === '1' && g0.combate ? { ...g0, combate: { ...g0.combate, quadro: quadroDemo(g0) } } : g0;
  const sala = {
    codigo: 'KQTZ',
    idioma: 'pt-BR',
    jogadores: NOMES.map((nome, i) => ({ id: `j${i + 1}`, nome, avatar: i * 3, ligado: true, desligadoEm: null, pronto: false })),
    vipId: 'j1',
    semTv: p.get('semtv') === '1',
    tutorial: null,
    aliases: {},
  } as unknown as VistaSala;
  const v = vistaRagerob(g);
  const nada = () => {};
  const zoom = Number(p.get('zoom') ?? 1);
  if (zoom !== 1) (document.documentElement.style as unknown as { zoom: string }).zoom = String(zoom);
  return p.get('ecra') === 'tel' ? (
    <TelemovelRagerob sala={sala} v={v} agora={Date.now} eu={p.get('eu') ?? 'j1'} enviar={nada} />
  ) : (
    <>
      <TvRagerob g={g} v={v} sala={sala} agora={Date.now} selFim={0} onOutraVez={nada} onMenu={nada} />
      <div class="rodape-codigo tv">KQTZ</div>
    </>
  );
}

/** sem TV: a arena 3 s depois do início (o que o host mandaria) */
function quadroDemo(e: EstadoRagerob) {
  const c = e.combate!;
  const sim = new Combate(c.robos.map((id) => e.robos.find((r) => r.id === id)!), c.perigos, c.seed, T_COMBATE);
  for (let n = 0; n < 60 * 3; n++) sim.passo({});
  return quadroDe(sim);
}
