import { paramsHash } from '../../core/ids';
import { usarIdioma } from '../../core/i18n';
import type { VistaSala } from '../../core/sala';
import { conteudoSevira } from './conteudo';
import { DEF_PADRAO_SEVIRA, apresentador, extraTv, novoSevira, reduzSevira, vistaSevira, type AcaoSevira, type EstadoSevira } from './regras';
import { TelemovelSevira } from './telemovel';
import { TvSevira } from './tv';

/**
 * só em dev (para as capturas):
 * `#/demo-sevira?fase=preparar|tema|apresentar|nota|fim&ecra=tv|tel[&slide=0..5][&papel=apresentador|plateia]`
 */
const NOMES = ['Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fê'];

function estado(fase: string, slide: number): EstadoSevira {
  const ids = NOMES.map((_, i) => `j${i + 1}`);
  const T = Date.now();
  let e = novoSevira(ids, {}, T, conteudoSevira());
  const ap = (a: AcaoSevira[]) => (e = a.reduce((s, x) => reduzSevira(s, x, T), e));
  if (fase === 'preparar') return ap([{ tipo: 'sv_enviar', id: 'j3', titulo: null }, { tipo: 'sv_enviar', id: 'j5', titulo: null }]);
  ap(ids.map((id) => ({ tipo: 'sv_enviar' as const, id, titulo: null })));
  if (fase === 'tema') return e;
  e = reduzSevira(e, { tipo: 'tick' }, e.terminaEm);
  const a = apresentador(e)!;
  for (let i = 0; i < slide; i++) ap([{ tipo: 'sv_slide', id: a, dir: 1 }]);
  ids.filter((id) => id !== a).forEach((id, k) => (e = reduzSevira(e, { tipo: 'sv_reagir', id, r: ['😂', '👏', '🤯', '😴'][k % 4] }, T + k)));
  if (fase === 'apresentar') return e;
  e = reduzSevira(e, { tipo: 'tick' }, e.terminaEm);
  if (fase === 'nota') return ap([{ tipo: 'sv_nota', id: ids.find((id) => id !== a)!, estrelas: 4 }]);
  while (e.fase !== 'fim') {
    const p = apresentador(e);
    if (e.fase === 'nota' && p) ap(ids.filter((id) => id !== p).map((id, k) => ({ tipo: 'sv_nota' as const, id, estrelas: 1 + ((k + id.length + e.atual) % 5) })));
    else e = reduzSevira(e, { tipo: 'tick' }, e.terminaEm);
  }
  return e;
}

export function DemoSevira() {
  const p = paramsHash();
  const fase = p.get('fase') ?? 'preparar';
  usarIdioma('pt-BR');
  const e = { ...estado(fase, Number(p.get('slide') ?? 0)), terminaEm: Date.now() + 42_000 };
  const sala: VistaSala = {
    codigo: 'ABCD',
    idioma: 'pt-BR',
    jogadores: NOMES.map((nome, i) => ({ id: `j${i + 1}`, nome, avatar: i * 3, ligado: true, desligadoEm: null, pronto: false })),
    vipId: 'j1',
    def: { rondas: 3, escrever: 60, votar: 15, mostrarVotos: true, temas: [] },
    jogo: null,
    defPensa: { rondas: 2, escrever: 60, votar: 15, final: true, mostrarVotos: true },
    pensa: null,
    defSevira: DEF_PADRAO_SEVIRA,
    semTv: false,
    tutorial: null,
    aliases: {},
  };
  const v = vistaSevira(e, (id) => 'tag-' + id);
  const nada = () => {};
  // o Edge headless não desce abaixo de 500 px: o zoom simula um ecrã de 412 px
  const z = Number(p.get('zoom') ?? 1);
  if (z !== 1) (document.documentElement.style as unknown as { zoom: string }).zoom = String(z);
  const a = apresentador(e);
  const eu = p.get('papel') === 'apresentador' && a ? a : e.participantes.find((id) => id !== a) ?? 'j1';
  return p.get('ecra') === 'tel' ? (
    <TelemovelSevira sala={sala} v={v} agora={Date.now} eu={eu} tag={'tag-' + eu} enviar={nada} />
  ) : (
    <TvSevira sala={sala} v={v} extra={extraTv(e)} agora={Date.now} onOutraVez={nada} onMenu={nada} />
  );
}
