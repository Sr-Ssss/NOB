import { paramsHash } from '../../core/ids';
import { usarIdioma } from '../../core/i18n';
import { novaSala, vistaSala } from '../../core/sala';
import { aVotar, novoJogo, reduz5050, vista5050, type Acao5050, type Estado5050, type Fase } from './regras';
import { Telemovel5050 } from './telemovel';
import { Tv5050 } from './tv';

/** só em dev: `#/demo-5050?fase=escrever|mostrar|votar|revelar|placar|fim&ecra=tv|tel[&eu=j1][&n=3..16][&semtv=1]` (capturas e testes) */
const NOMES = ['Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fê', 'Gabi', 'Hugo', 'Iris', 'João', 'Kim', 'Lia', 'Max', 'Nina', 'Olga', 'Pipo'];
const DILEMAS: [string, string, string][] = [
  ['Praia ou campo nas férias?', 'Praia', 'Campo'],
  ['Pizza com ananás?', 'Sim', 'Nunca'],
  ['Acordar cedo ou deitar tarde?', 'Cedo', 'Tarde'],
  ['Gatos ou cães?', 'Gatos', 'Cães'],
];

function estado(fase: Fase, n: number): Estado5050 {
  const ids = NOMES.slice(0, n).map((_, i) => `j${i + 1}`);
  const T = Date.now();
  let e = novoJogo(ids, {}, T);
  const ap = (a: Acao5050[]) => (e = a.reduce((s, x) => reduz5050(s, x, T), e));
  const enviar = () => ap(ids.filter((id) => !e.enviados[id]).map((id, i) => ({ tipo: 'enviar' as const, id, texto: DILEMAS[i % 4][0], a: DILEMAS[i % 4][1], b: DILEMAS[i % 4][2] })));
  if (fase === 'escrever') return ap([{ tipo: 'enviar', id: 'j2', texto: DILEMAS[0][0], a: DILEMAS[0][1], b: DILEMAS[0][2] }]);
  enviar();
  for (let k = 0; k < 500 && e.fase !== fase; k++) {
    if (e.fase === 'escrever') enviar();
    if (e.fase === 'votar') {
      const faltam = aVotar(e);
      // na fase pedida ficam votos a meio (j1 ainda não votou)
      if (fase === 'votar') return ap(faltam.filter((id) => id !== 'j1').slice(0, 2).map((id, i) => ({ tipo: 'votar' as const, id, lado: i % 2 ? 'b' : 'a' })));
      ap(faltam.map((id, i) => ({ tipo: 'votar' as const, id, lado: i % 3 ? 'a' : 'b' })));
      if ((e.fase as Fase) === fase) break;
    }
    e = reduz5050(e, { tipo: 'tick' }, e.terminaEm);
  }
  return e;
}

export function Demo5050() {
  const p = paramsHash();
  const fase = (p.get('fase') ?? 'escrever') as Fase;
  usarIdioma('pt-BR');
  const n = Math.min(16, Math.max(3, Number(p.get('n') ?? 6)));
  const e = { ...estado(fase, n), terminaEm: Date.now() + 42_000 };
  const jogadores = NOMES.slice(0, n).map((nome, i) => ({ id: `j${i + 1}`, nome, avatar: i, tag: '', ligado: true, desligadoEm: null, pronto: false }));
  const sala = vistaSala({ ...novaSala('ABCD', 'pt-BR'), jogadores, vipId: 'j1', semTv: p.get('semtv') === '1' });
  const v = vista5050(e, (id) => 'tag-' + id);
  const eu = p.get('eu') ?? 'j1';
  const nada = () => {};
  return p.get('ecra') === 'tel' ? <Telemovel5050 sala={sala} v={v} agora={Date.now} eu={eu} tag={'tag-' + eu} enviar={nada} /> : <Tv5050 sala={sala} v={v} agora={Date.now} onOutraVez={nada} onMenu={nada} />;
}
