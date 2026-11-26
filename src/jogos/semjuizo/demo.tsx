import { paramsHash } from '../../core/ids';
import { usarIdioma } from '../../core/i18n';
import { novaSala, vistaSala } from '../../core/sala';
import { conteudoSemJuizo } from './conteudo';
import { aVotar, fotosMesa, ladoDaVez, novoSemJuizo, privadoSemJuizo, reduzSemJuizo, type AcaoSemJuizo, type EstadoSemJuizo, type FaseSemJuizo } from './regras';
import { TelemovelSemJuizo } from './telemovel';
import { TvSemJuizo } from './tv';

/**
 * só em dev: `#/demo-semjuizo?fase=<fase>&ecra=tv|tel[&papel=reu|acusador|juiz|juri][&n=3..10][&semtv=1][&lingua=en]`
 */
const NOMES = ['Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fê', 'Gabi', 'Hugo', 'Iris', 'João'];

function estado(fase: FaseSemJuizo, n: number): EstadoSemJuizo {
  const ids = NOMES.slice(0, n).map((_, i) => `j${i + 1}`);
  const T = Date.now();
  let e = novoSemJuizo(ids, { provas: fase === 'provas' ? 'juri' : 'aleatorias' }, T, conteudoSemJuizo());
  const dono = () => (ladoDaVez(e) === 'reu' ? e.reu : e.acusador);
  const faz = (a: AcaoSemJuizo) => (e = reduzSemJuizo(e, a, T));
  for (let k = 0; k < 400 && e.fase !== fase; k++) {
    if (e.fase === 'escolher') faz({ tipo: 'sj_jogar', id: dono(), prova: e.maos[dono()][0].id, liga: e.mesa.length ? Math.max(0, e.mesa.length - 2) : null });
    else if (e.fase === 'explicar' && e.mesa.length === 4 && fase.startsWith('contra')) faz({ tipo: 'sj_contradicao', id: e.reu, a: 0, b: 2 });
    else if (e.fase === 'explicar' && e.mesa.length === 4 && fase === 'testemunha') faz({ tipo: 'sj_testemunha', id: e.reu });
    else if (e.fase === 'estrela') aVotar(e).forEach((id, i) => faz({ tipo: 'sj_estrela', id, i: i % 3 }));
    else if (aVotar(e).length) aVotar(e).forEach((id, i) => faz({ tipo: 'sj_votar', id, sim: i % 2 === 0 }));
    else e = reduzSemJuizo(e, { tipo: 'tick' }, e.terminaEm);
    if (e.fase === fase && fase === 'explicar' && e.mesa.length < 4) e = reduzSemJuizo(e, { tipo: 'tick' }, e.terminaEm);
  }
  return { ...e, terminaEm: Date.now() + 18_000 };
}

export function DemoSemJuizo() {
  const p = paramsHash();
  const idioma = p.get('lingua') === 'en' ? 'en' : 'pt-BR';
  usarIdioma(idioma);
  const fase = (p.get('fase') ?? 'caso') as FaseSemJuizo;
  const e = estado(fase, Number(p.get('n') ?? 6));
  const base = novaSala('ABCD', idioma);
  const jogadores = e.participantes.map((id, i) => ({ id, nome: NOMES[i], avatar: i, tag: '', ligado: true, desligadoEm: null, pronto: false }));
  const sala = vistaSala({ ...base, jogadores, vipId: 'j1', semTv: p.get('semtv') === '1', semjuizo: e });
  const v = sala.semjuizo!;
  const papel = p.get('papel') ?? 'acusador';
  const eu = papel === 'reu' ? e.reu : papel === 'juiz' ? (e.juiz ?? 'j1') : papel === 'juri' ? (e.juri[0] ?? 'j1') : e.acusador;
  const nada = () => {};
  return p.get('ecra') === 'tel' ? (
    <TelemovelSemJuizo sala={sala} v={v} agora={Date.now} eu={eu} enviar={nada} privado={privadoSemJuizo(e, eu, { semTv: !!sala.semTv, bot: false })} />
  ) : (
    <TvSemJuizo sala={sala} v={v} fotos={fotosMesa(e)} agora={Date.now} onOutraVez={nada} onMenu={nada} />
  );
}
