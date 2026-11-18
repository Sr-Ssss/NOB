import { paramsHash } from '../../core/ids';
import { usarIdioma } from '../../core/i18n';
import type { VistaSala } from '../../core/sala';
import { novoRei, privadoRei, reduzRei, vistaRei, type AcaoRei, type CartaR, type EstadoRei } from './regras';
import { TelemovelRei } from './telemovel';
import { TvRei } from './tv';

/** só em dev: `#/demo-rei?fase=ir|carta|lider|ronda|refens|batata|votar|troca|aposta|fim&ecra=tv|tel[&eu=j1][&id=1][&semtv=1][&zoom=…]` */
const NOMES = ['Rita', 'Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fê', 'Gabi', 'Hugo', 'Iris'];
const CARTAS: CartaR[] = [
  { papel: 'batata', cor: 'cinza' },
  { papel: 'rei', cor: 'azul' },
  { papel: 'dragao', cor: 'vermelho' },
  { papel: 'traidor', cor: 'azul' },
  { papel: 'corte', cor: 'azul' },
  { papel: 'rebelde', cor: 'vermelho' },
  { papel: 'apostador', cor: 'cinza' },
  { papel: 'pajem', cor: 'azul' },
  { papel: 'rebelde', cor: 'vermelho' },
  { papel: 'corte', cor: 'azul' },
];

function estado(fase: string, agora: number): EstadoRei {
  const ids = NOMES.map((_, i) => `j${i + 1}`);
  const T = agora;
  let e = novoRei(ids, {}, T);
  e = { ...e, cartas: Object.fromEntries(ids.map((id, i) => [id, CARTAS[i]])), sala: Object.fromEntries(ids.map((id, i) => [id, (i % 2) as 0 | 1])), batata: 'j1' };
  const ap = (...a: AcaoRei[]) => (e = a.reduce((s, x) => reduzRei(s, x, T), e));
  if (fase === 'ir') return ap({ tipo: 'rd_pronto', id: 'j2' }, { tipo: 'rd_pronto', id: 'j4' });
  ap(...ids.map((id) => ({ tipo: 'rd_pronto' as const, id })));
  if (fase === 'carta') return ap({ tipo: 'rd_ok', id: 'j3' });
  ap(...ids.map((id) => ({ tipo: 'rd_ok' as const, id })));
  e = { ...e, lideres: ['j3', 'j2'] };
  if (fase === 'lider') return e;
  e = reduzRei(e, { tipo: 'tick' }, e.terminaEm);
  e = { ...e, terminaEm: T + 140_000 };
  if (fase === 'ronda') return e;
  if (fase === 'batata') return ap({ tipo: 'rd_pedir', id: 'j1', alvo: 'j5' });
  if (fase === 'votar') return ap({ tipo: 'rd_votacao', id: 'j1' }, { tipo: 'rd_votar', id: 'j1', alvo: 'j5' }, { tipo: 'rd_votar', id: 'j7', alvo: 'j5' });
  e = { ...e, terminaEm: T + 20_000 };
  if (fase === 'refens') return e;
  e = reduzRei(e, { tipo: 'tick' }, e.terminaEm);
  if (fase === 'troca') return ap({ tipo: 'rd_cheguei', id: e.mudando[0] });
  e = { ...e, ronda: e.rondas };
  e = reduzRei(e, { tipo: 'tick' }, e.terminaEm);
  if (fase === 'aposta') return e;
  return ap({ tipo: 'rd_apostar', id: 'j7', equipa: 'azul' });
}

export function DemoRei() {
  const p = paramsHash();
  const fase = p.get('fase') ?? 'ronda';
  usarIdioma('pt-BR');
  document.documentElement.classList.add('sem-anim');
  const agora = Date.now();
  const e = estado(fase, agora);
  const sala: VistaSala = {
    codigo: 'ABCD',
    idioma: 'pt-BR',
    jogadores: NOMES.map((nome, i) => ({ id: `j${i + 1}`, nome, avatar: i, ligado: true, desligadoEm: null, pronto: false })),
    vipId: 'j1',
    def: { rondas: 3, escrever: 60, votar: 15, mostrarVotos: true, temas: [] },
    jogo: null,
    defPensa: { rondas: 2, final: true, escrever: 90, votar: 15, mostrarVotos: true },
    pensa: null,
    semTv: p.get('semtv') === '1',
    tutorial: null,
    aliases: {},
  };
  const v = vistaRei(e);
  const nada = () => {};
  const zoom = Number(p.get('zoom') ?? 1);
  if (zoom !== 1) (document.documentElement.style as unknown as { zoom: string }).zoom = String(zoom);
  const eu = p.get('eu') ?? 'j1';
  return p.get('ecra') === 'tel' ? (
    <TelemovelRei sala={sala} v={v} agora={Date.now} eu={eu} privado={privadoRei(e, eu)} enviar={nada} idAberta={p.get('id') === '1'} />
  ) : (
    <TvRei sala={sala} v={v} agora={Date.now} onOutraVez={nada} onMenu={nada} />
  );
}
