import { paramsHash } from '../../core/ids';
import { usarIdioma } from '../../core/i18n';
import type { VistaSala } from '../../core/sala';
import { novoPirata, privadoPirata, reduzPirata, vistaPirata, type AcaoPirata, type EstadoPirata, type Papel } from './regras';
import { TelemovelPirata } from './telemovel';
import { TvPirata } from './tv';

/** só em dev: `#/demo-pirata?fase=carta|noite|amanhecer|artilheiro|disparo|discussao|votar|resultado|fim&ecra=tv|tel[&eu=j1][&id=1][&semtv=1][&zoom=…]` (capturas) */
const NOMES = ['Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fê', 'Gabi', 'Hugo'];
const PAPEIS: Papel[] = ['pirata', 'vigia', 'medico', 'artilheiro', 'marinheiro', 'pirata', 'marinheiro', 'marinheiro'];

function estado(fase: string): EstadoPirata {
  const ids = NOMES.map((_, i) => `j${i + 1}`);
  const T = 1_700_000_000_000;
  let e = novoPirata(ids, {}, T);
  e = { ...e, papeis: Object.fromEntries(ids.map((id, i) => [id, PAPEIS[i]])) };
  const fim = () => (e = reduzPirata(e, { tipo: 'tick' }, e.terminaEm));
  const ap = (a: AcaoPirata[]) => (e = a.reduce((s, x) => reduzPirata(s, x, T), e));
  if (fase === 'carta') return e;
  fim();
  const noite: AcaoPirata[] = [
    { tipo: 'pr_noite', id: 'j1', alvo: fase === 'artilheiro' || fase === 'disparo' ? 'j4' : 'j3' },
    { tipo: 'pr_noite', id: 'j6', alvo: 'j5' },
    { tipo: 'pr_noite', id: 'j2', alvo: 'j6' },
    { tipo: 'pr_noite', id: 'j3', alvo: 'j7' },
    { tipo: 'pr_noite', id: 'j5', alvo: 'j1' },
    { tipo: 'pr_noite', id: 'j7', alvo: 'j1' },
    { tipo: 'pr_noite', id: 'j8', alvo: 'j1' },
  ];
  if (fase === 'noite') return ap(noite.slice(0, 3));
  ap(noite);
  // j1 e j6 empatam: o sorteio decide; para a captura fixa-se a vítima pelo voto de j6
  if (fase !== 'artilheiro' && fase !== 'disparo') ap([{ tipo: 'pr_noite', id: 'j6', alvo: 'j3' }]);
  else ap([{ tipo: 'pr_noite', id: 'j6', alvo: 'j4' }]);
  fim();
  if (fase === 'amanhecer') return e;
  if (fase === 'artilheiro' || fase === 'disparo') {
    fim();
    if (fase === 'artilheiro') return e;
    return ap([{ tipo: 'pr_levar', id: 'j4', alvo: 'j6' }]);
  }
  fim();
  if (fase === 'discussao') return e;
  fim();
  if (fase === 'votar') return ap([{ tipo: 'pr_votar', id: 'j2', alvo: 'j1' }, { tipo: 'pr_votar', id: 'j5', alvo: 'j1' }, { tipo: 'pr_votar', id: 'j8', alvo: null }]);
  ap(e.vivos.map((id, k) => ({ tipo: 'pr_votar' as const, id, alvo: id === 'j1' ? 'j6' : k % 4 === 3 ? null : 'j1' })));
  if (fase === 'resultado') return e;
  // fim: a tripulação apanha os dois piratas
  e = { ...e, vivos: e.vivos.filter((id) => id !== 'j6') };
  while (e.fase !== 'fim') fim();
  return e;
}

export function DemoPirata() {
  const p = paramsHash();
  const fase = p.get('fase') ?? 'noite';
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
  const v = vistaPirata(e);
  const nada = () => {};
  const zoom = Number(p.get('zoom') ?? 1);
  if (zoom !== 1) (document.documentElement.style as unknown as { zoom: string }).zoom = String(zoom);
  const eu = p.get('eu') ?? (fase === 'artilheiro' ? 'j4' : 'j1');
  return p.get('ecra') === 'tel' ? <TelemovelPirata sala={sala} v={v} agora={Date.now} eu={eu} privado={privadoPirata(e, eu)} enviar={nada} idAberta={p.get('id') === '1'} /> : <TvPirata sala={sala} v={v} agora={Date.now} onOutraVez={nada} onMenu={nada} />;
}
