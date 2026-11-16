import { paramsHash } from '../../core/ids';
import { usarIdioma } from '../../core/i18n';
import type { VistaSala } from '../../core/sala';
import { elegiveis, novoMaquinas, privadoMaquinas, reduzMaquinas, vistaMaquinas, type AcaoMaquinas, type EstadoMaquinas, type PapelM } from './regras';
import { TelemovelMaquinas } from './telemovel';
import { TvMaquinas } from './tv';

/** só em dev: `#/demo-maquinas?fase=carta|nomear|votar|votos|comandante|piloto|poder|ver|discussao|fim&ecra=tv|tel[&eu=j1][&id=1][&semtv=1][&zoom=…]` */
const NOMES = ['Rita', 'Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fê'];
const PAPEIS: PapelM[] = ['tripulacao', 'amotinado', 'tripulacao', 'ia', 'tripulacao', 'amotinado', 'tripulacao'];

function estado(fase: string): EstadoMaquinas {
  const ids = NOMES.map((_, i) => `j${i + 1}`);
  const T = 1_700_000_000_000;
  let e = novoMaquinas(ids, {}, T);
  e = { ...e, participantes: ids, comandante: 'j1', rotacao: 0, papeis: Object.fromEntries(ids.map((id, i) => [id, PAPEIS[i]])), reparacoes: 2, sabotagens: 1, falhas: 1 };
  const tick = () => (e = reduzMaquinas(e, { tipo: 'tick' }, e.terminaEm));
  const ap = (...a: AcaoMaquinas[]) => (e = a.reduce((s, x) => reduzMaquinas(s, x, T), e));
  if (fase === 'carta') return e;
  tick();
  if (fase === 'nomear') return { ...e, bloqueados: ['j3', 'j5'] };
  ap({ tipo: 'rm_piloto', id: 'j1', alvo: 'j2' });
  if (fase === 'votar') return ap(...['j1', 'j3', 'j4', 'j6'].map((id) => ({ tipo: 'rm_votar' as const, id, sim: true })));
  ap(...ids.map((id, i) => ({ tipo: 'rm_votar' as const, id, sim: i !== 2 && i !== 4 })));
  if (fase === 'votos') return e;
  tick();
  e = { ...e, mao: ['R', 'S', 'S'] };
  if (fase === 'comandante') return e;
  ap({ tipo: 'rm_descartar', id: 'j1', i: 0 });
  if (fase === 'piloto') return e;
  ap({ tipo: 'rm_escolher', id: 'j2', i: 0 }); // 2.ª 💥 com 7 → 🔍
  tick();
  if (fase === 'poder') return e;
  ap({ tipo: 'rm_poder', id: 'j1', alvo: 'j4' });
  if (fase === 'ver') return e;
  ap({ tipo: 'rm_visto', id: 'j1' });
  if (fase === 'discussao') return e;
  // fim: a IA chega a Piloto com 3+ 💥
  e = { ...e, sabotagens: 3 };
  tick();
  ap({ tipo: 'rm_piloto', id: e.comandante, alvo: elegiveis(e).includes('j4') ? 'j4' : elegiveis(e)[0] });
  ap(...e.vivos.map((id) => ({ tipo: 'rm_votar' as const, id, sim: true })));
  tick();
  return e;
}

export function DemoMaquinas() {
  const p = paramsHash();
  const fase = p.get('fase') ?? 'nomear';
  usarIdioma('pt-BR');
  document.documentElement.classList.add('sem-anim');
  const e = { ...estado(fase), terminaEm: Date.now() + 32_000 };
  const sala: VistaSala = {
    codigo: 'ABCD',
    idioma: 'pt-BR',
    jogadores: NOMES.map((nome, i) => ({ id: `j${i + 1}`, nome, avatar: i * 2, ligado: true, desligadoEm: null, pronto: false })),
    vipId: 'j1',
    def: { rondas: 3, escrever: 60, votar: 15, mostrarVotos: true, temas: [] },
    jogo: null,
    defPensa: { rondas: 2, final: true, escrever: 90, votar: 15, mostrarVotos: true },
    pensa: null,
    semTv: p.get('semtv') === '1',
    tutorial: null,
    aliases: {},
  };
  const v = vistaMaquinas(e);
  const nada = () => {};
  const zoom = Number(p.get('zoom') ?? 1);
  if (zoom !== 1) (document.documentElement.style as unknown as { zoom: string }).zoom = String(zoom);
  const eu = p.get('eu') ?? 'j1';
  return p.get('ecra') === 'tel' ? (
    <TelemovelMaquinas sala={sala} v={v} agora={Date.now} eu={eu} privado={privadoMaquinas(e, eu)} enviar={nada} idAberta={p.get('id') === '1'} />
  ) : (
    <TvMaquinas sala={sala} v={v} agora={Date.now} onOutraVez={nada} onMenu={nada} />
  );
}
