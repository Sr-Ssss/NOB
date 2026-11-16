import { paramsHash } from '../../core/ids';
import { usarIdioma } from '../../core/i18n';
import type { VistaSala } from '../../core/sala';
import type { Traco } from '../../ui/tracos';
import { conteudoIdeias } from './conteudo';
import { novoIdeias, reduzIdeias, vistaIdeias, type AcaoIdeias, type EstadoIdeias } from './regras';
import { TelemovelIdeias } from './telemovel';
import { TvIdeias } from './tv';

/** só em dev: `#/demo-ideias?fase=problema|inventar|pitch|investir|revelar|fim&ecra=tv|tel[&etapa=0..2][&semtv=1][&zoom=…][&eu=j1]` (capturas) */
const NOMES = ['Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fê'];
const INV = [
  ['Meiômetro 3000', 'Nenhuma meia fica para trás'],
  ['Sofá-ímã', 'O controle volta sozinho'],
  ['Cereal-tron', 'Crocante até a última colherada'],
  ['Chapéu-guarda-chuva', 'Seco por cima, estiloso por baixo'],
  ['Lembra-Nome', 'Nunca mais "ei, você!"'],
  ['Pote-Fácil', 'Abre com um sorriso'],
];

/** uma máquina rabiscada (exemplo para as capturas) */
function rabisco(k: number): Traco[] {
  const circ = (cx: number, cy: number, r: number, n = 24) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)]).flat().map(Math.round);
  return [
    { c: 0, g: 1, p: [90, 220, 310, 220, 310, 120, 90, 120, 90, 220] },
    { c: 0, g: 0, p: circ(140, 240, 22) },
    { c: 0, g: 0, p: circ(260, 240, 22) },
    { c: 4, g: 1, p: circ(200, 170, 30 + k * 3) },
    { c: 0, g: 0, p: [200, 120, 200, 60, 240, 40] },
    { c: 1, g: 1, p: [240, 40, 240, 40] },
    { c: 5, g: 0, p: [320, 150, 360, 130, 370, 170, 330, 180] },
  ];
}

function estado(fase: string, etapa: number): EstadoIdeias {
  const ids = NOMES.map((_, i) => `j${i + 1}`);
  const T = 1_700_000_000_000;
  let e = novoIdeias(ids, {}, T, conteudoIdeias());
  const ap = (a: AcaoIdeias[]) => (e = a.reduce((s, x) => reduzIdeias(s, x, T), e));
  if (fase === 'problema') return ap([{ tipo: 'im_problema', id: 'j2', texto: '' }, { tipo: 'im_problema', id: 'j4', texto: '' }]);
  ap(ids.map((id) => ({ tipo: 'im_problema' as const, id, texto: '' })));
  if (fase === 'inventar') return ap(['j2', 'j3', 'j5'].map((id, i) => ({ tipo: 'im_invencao' as const, id, tracos: rabisco(i), nome: INV[i][0], slogan: INV[i][1] })));
  ap(ids.map((id, i) => ({ tipo: 'im_invencao' as const, id, tracos: rabisco(i), nome: INV[i][0], slogan: INV[i][1] })));
  if (fase === 'pitch') return ap([{ tipo: 'im_etapa', id: e.ordem[0], etapa }]);
  while (e.fase === 'pitch') e = reduzIdeias(e, { tipo: 'tick' }, e.terminaEm);
  const alvos = e.ordem;
  const notas = (id: string, k: number) => {
    const outros = alvos.filter((x) => x !== id);
    return k % 3 === 0 ? { [outros[0]]: 3 } : { [outros[0]]: 1, [outros[1 + (k % 2)]]: 2 };
  };
  if (fase === 'investir') return ap([{ tipo: 'im_investir', id: 'j2', notas: notas('j2', 1), confirmar: true }]);
  ap(ids.map((id, k) => ({ tipo: 'im_investir' as const, id, notas: notas(id, k), confirmar: true })));
  if (fase === 'revelar') return e;
  return reduzIdeias(e, { tipo: 'tick' }, e.terminaEm);
}

export function DemoIdeias() {
  const p = paramsHash();
  const fase = p.get('fase') ?? 'pitch';
  usarIdioma('pt-BR');
  (window as unknown as { nobSemAnimacao?: boolean }).nobSemAnimacao = true;
  document.documentElement.classList.add('sem-anim');
  const e = { ...estado(fase, Number(p.get('etapa') ?? 2)), terminaEm: Date.now() + 32_000 };
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
  const v = vistaIdeias(e, (id) => 'tag-' + id);
  const nada = () => {};
  const zoom = Number(p.get('zoom') ?? 1);
  if (zoom !== 1) (document.documentElement.style as unknown as { zoom: string }).zoom = String(zoom);
  const eu = p.get('eu') ?? (fase === 'pitch' ? e.ordem[0] : 'j1');
  return p.get('ecra') === 'tel' ? <TelemovelIdeias sala={sala} v={v} agora={Date.now} eu={eu} tag={'tag-' + eu} enviar={nada} /> : <TvIdeias sala={sala} v={v} agora={Date.now} onOutraVez={nada} onMenu={nada} />;
}
