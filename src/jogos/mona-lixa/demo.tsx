import { paramsHash } from '../../core/ids';
import { usarIdioma } from '../../core/i18n';
import type { VistaSala } from '../../core/sala';
import type { Traco } from '../../ui/tracos';
import { conteudoMona } from './conteudo';
import { autorAtual, escolhedores, novoMona, reduzMona, vistaMona, type AcaoMona, type EstadoMona } from './regras';
import { TelemovelMona } from './telemovel';
import { TvMona } from './tv';

/** só em dev: `#/demo-mona?fase=desenhar|inventar|escolher|revelar|placar|fim&ecra=tv|tel[&semtv=1][&zoom=…]` (capturas) */
const NOMES = ['Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fê'];
const FALSOS = ['Um chapéu com fome', 'O sol de pijama', 'Uma tartaruga no trânsito', 'Uma pizza a voar', 'Um gato de óculos'];

/** um polvo rabiscado (exemplo para as capturas) */
function rabisco(): Traco[] {
  const circ = (cx: number, cy: number, r: number, n = 24) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)]).flat().map(Math.round);
  const pernas = Array.from({ length: 6 }, (_, k) => ({ c: 6, g: 1, p: Array.from({ length: 8 }, (_, i) => [130 + k * 28 + Math.round(10 * Math.sin(i + k)), 170 + i * 14]).flat() }));
  return [
    { c: 6, g: 1, p: circ(200, 120, 70) },
    { c: 0, g: 0, p: circ(175, 110, 9, 10) },
    { c: 0, g: 0, p: circ(225, 110, 9, 10) },
    { c: 1, g: 0, p: [180, 145, 200, 158, 220, 145] },
    ...pernas,
    { c: 7, g: 1, p: [40, 280, 360, 280] },
    { c: 2, g: 0, p: [80, 60, 100, 40, 120, 60] },
    { c: 4, g: 1, p: [330, 50, 330, 50] },
  ];
}

function estado(fase: string): EstadoMona {
  const ids = NOMES.map((_, i) => `j${i + 1}`);
  const T = 1_700_000_000_000;
  let e = novoMona(ids, {}, T, conteudoMona());
  const ap = (a: AcaoMona[]) => (e = a.reduce((s, x) => reduzMona(s, x, T), e));
  if (fase === 'desenhar') return ap([{ tipo: 'ml_desenho', id: 'j2', tracos: rabisco() }, { tipo: 'ml_desenho', id: 'j4', tracos: rabisco() }]);
  ap(ids.map((id) => ({ tipo: 'ml_desenho' as const, id, tracos: rabisco() })));
  const a = autorAtual(e)!;
  const outros = ids.filter((x) => x !== a);
  if (fase === 'inventar') return ap(outros.slice(0, 3).map((id, i) => ({ tipo: 'ml_falso' as const, id, texto: FALSOS[i] })));
  ap(outros.map((id, i) => ({ tipo: 'ml_falso' as const, id, texto: FALSOS[i] })));
  if (fase === 'escolher') return ap([{ tipo: 'ml_escolher', id: outros[0], i: 1 }]);
  ap(escolhedores(e).map((id, k) => ({ tipo: 'ml_escolher' as const, id, i: [0, 1, 2, 0, 3][k] ?? 0 })).filter((x) => e.opcoes[x.i] && !e.opcoes[x.i].autores.includes(x.id)));
  if (e.fase === 'escolher') e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
  if (fase === 'revelar') return e;
  while (e.fase !== 'placar') e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
  if (fase === 'placar') return e;
  while (e.fase !== 'fim') e = reduzMona(e, { tipo: 'tick' }, e.terminaEm);
  return e;
}

export function DemoMona() {
  const p = paramsHash();
  const fase = p.get('fase') ?? 'escolher';
  usarIdioma('pt-BR');
  // capturas: o Edge headless não corre a animação do desenho
  (window as unknown as { nobSemAnimacao?: boolean }).nobSemAnimacao = true;
  document.documentElement.classList.add('sem-anim');
  const e = { ...estado(fase), terminaEm: Date.now() + 42_000 };
  const sala: VistaSala = {
    codigo: 'ABCD',
    idioma: 'pt-BR',
    jogadores: NOMES.map((nome, i) => ({ id: `j${i + 1}`, nome, avatar: i * 3, ligado: true, desligadoEm: null, pronto: false })),
    vipId: 'j1',
    def: { rondas: 3, escrever: 60, votar: 15, mostrarVotos: true, temas: [] },
    jogo: null,
    defPensa: { rondas: 2, final: true, escrever: 90, votar: 15, mostrarVotos: true },
    pensa: null,
    semTv: p.get('semtv') === '1',
    tutorial: null,
    aliases: {},
  };
  const v = vistaMona(e, (id) => 'tag-' + id);
  const nada = () => {};
  const zoom = Number(p.get('zoom') ?? 1);
  if (zoom !== 1) (document.documentElement.style as unknown as { zoom: string }).zoom = String(zoom);
  const autor = autorAtual(e);
  const eu = p.get('eu') ?? (fase === 'desenhar' ? 'j1' : NOMES.map((_, i) => `j${i + 1}`).find((x) => x !== autor && !e.escolhas[x])!);
  return p.get('ecra') === 'tel' ? <TelemovelMona sala={sala} v={v} agora={Date.now} eu={eu} tag={'tag-' + eu} enviar={nada} /> : <TvMona sala={sala} v={v} agora={Date.now} onOutraVez={nada} onMenu={nada} />;
}
