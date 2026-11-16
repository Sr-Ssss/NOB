import { paramsHash } from '../../core/ids';
import { usarIdioma } from '../../core/i18n';
import type { VistaSala } from '../../core/sala';
import { perguntasPensa } from './conteudo';
import { novoPensa, reduzPensa, vistaPensa, type AcaoPensa, type EstadoPensa } from './regras';
import { TelemovelPensa } from './telemovel';
import { TvPensa } from './tv';

/** só em dev: `#/demo-pensa?fase=escrever|votar|revelar|final|podio&ecra=tv|tel` (para as capturas) */
const NOMES = ['Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fê'];
const RESP = ['Sr. Abraço', 'Fofinho', 'Pudim', 'Bolinha de Sabão', 'Docinho', 'Princesa Raivosa'];

function estado(fase: string): EstadoPensa {
  const { normais, finais } = perguntasPensa();
  const ids = NOMES.map((_, i) => `j${i + 1}`);
  const T = Date.now();
  let e = novoPensa(ids, {}, T, normais, finais);
  const ap = (a: AcaoPensa[]) => (e = a.reduce((s, x) => reduzPensa(s, x, T), e));
  if (fase === 'escrever') return ap([{ tipo: 'responder', id: 'j2', duelo: e.duelos.findIndex((d) => d.autores.includes('j2')), texto: 'x' }]);
  const responder = () => ap(e.duelos.flatMap((d, i) => d.autores.map((a, k) => ({ tipo: 'responder' as const, id: a, duelo: i, texto: RESP[(i + k) % RESP.length] }))));
  responder();
  if (fase === 'votar') return ap([{ tipo: 'votar', id: ids.find((id) => !e.duelos[0].autores.includes(id))!, autor: '#0' }]);
  const votar = () => {
    const d = e.duelos[e.atual];
    ap(ids.filter((id) => !d.autores.includes(id)).map((id, k) => ({ tipo: 'votar' as const, id, autor: `#${k % 3 === 2 ? 1 : 0}` })));
  };
  votar();
  if (fase === 'revelar') return e;
  while (!e.fase.startsWith('final')) {
    e = reduzPensa(e, { tipo: 'tick' }, e.terminaEm);
    if (e.fase === 'escrever') responder();
    if (e.fase === 'votar') votar();
  }
  ap(ids.map((id, i) => ({ tipo: 'responder' as const, id, duelo: 0, texto: RESP[i] })));
  if (fase === 'final') return ap([{ tipo: 'votos_final', id: 'j3', votos: { '#0': 2 } }]);
  ap(ids.map((id) => ({ tipo: 'votos_final' as const, id, votos: { [`#${e.ordemFinal[0] === id ? 1 : 0}`]: 2, [`#${e.ordemFinal[2] === id ? 3 : 2}`]: 1 } })));
  return fase === 'podio' ? reduzPensa(e, { tipo: 'tick' }, e.terminaEm) : e;
}

export function DemoPensa() {
  const p = paramsHash();
  const fase = p.get('fase') ?? 'escrever';
  usarIdioma('pt-BR');
  const e = { ...estado(fase), terminaEm: Date.now() + 42_000 };
  const sala: VistaSala = {
    codigo: 'ABCD',
    idioma: 'pt-BR',
    jogadores: NOMES.map((nome, i) => ({ id: `j${i + 1}`, nome, avatar: i * 3, ligado: true, desligadoEm: null, pronto: false })),
    vipId: 'j1',
    def: { rondas: 3, escrever: 60, votar: 15, mostrarVotos: true, temas: [] },
    jogo: null,
    defPensa: e.def,
    pensa: null,
    semTv: false,
    tutorial: null,
    aliases: {},
  };
  const v = vistaPensa(e, (id) => 'tag-' + id);
  const nada = () => {};
  // o Edge headless não desce abaixo de 500 px: o zoom simula um ecrã de 412 px
  const z = Number(p.get('zoom') ?? 1);
  if (z !== 1) (document.documentElement.style as unknown as { zoom: string }).zoom = String(z);
  return p.get('ecra') === 'tel' ? (
    <TelemovelPensa sala={sala} v={v} agora={Date.now} eu="j1" tag="tag-j1" enviar={nada} />
  ) : (
    <TvPensa sala={sala} v={v} agora={Date.now} onOutraVez={nada} onMenu={nada} />
  );
}
