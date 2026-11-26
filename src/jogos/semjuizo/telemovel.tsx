import { useState } from 'preact/hooks';
import type { AcaoSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Temporizador } from '../../ui/comuns';
import { AcabarPartida } from '../../ui/acabarPartida';
import { Progresso } from '../../ui/ecraunico';
import { nomeDe } from '../5050/tv';
import { FolhaCaso, FotoProva, ICONE, Martelos, Mesa, Partes, PlacarSj, ResultadoSj, aVotarFase, marcadasDe, narrar, nomeLado, txt, type PropsSemJuizo } from './comuns';
import { Martelo } from './desenhos';
import { ladoDaVez, ladoDe, podeInterromper, type AcaoSemJuizo, type Lado, type Poder, type PrivadoSemJuizo } from './regras';

type Jogar = (a: Extract<AcaoSemJuizo, { id: string }>) => void;
type P = PropsSemJuizo & { privado: PrivadoSemJuizo; jogar: Jogar };

/** o meu lado escolhe a prova e a ligação */
function Escolher({ v, privado, jogar }: P) {
  const [prova, setProva] = useState<string | null>(null);
  const [liga, setLiga] = useState<number | null>(null);
  const precisaLiga = v.mesa.length > 0;
  return (
    <>
      <p class="centro">
        <b>{t('sjEscolha')}</b>
      </p>
      <div class="sj-mao">
        {privado.mao.map((p) => (
          <button key={p.id} class={'sj-carta' + (prova === p.id ? ' on' : '')} aria-pressed={prova === p.id} onClick={() => setProva(p.id)}>
            <FotoProva p={p} fotos={privado.fotos} />
          </button>
        ))}
      </div>
      {precisaLiga && (
        <>
          <p class="centro">
            <b>{t('sjLigar')}</b>
          </p>
          <Mesa v={v} fotos={privado.fotos} marcadas={liga === null ? [] : [liga]} tocar={setLiga} />
        </>
      )}
      <button class="botao grande" disabled={!prova || (precisaLiga && liga === null)} onClick={() => prova && jogar({ tipo: 'sj_jogar', id: '', prova, liga })}>
        {t('sjJogar')}
      </button>
    </>
  );
}

/** durante uma explicação: as interrupções do meu lado */
function Interromper({ v, privado, jogar, lado }: P & { lado: Lado }) {
  const [marcar, setMarcar] = useState<number[] | null>(null);
  if (marcar) {
    const tocar = (i: number) => {
      const m = marcar.includes(i) ? marcar.filter((x) => x !== i) : [...marcar, i];
      if (m.length === 2) {
        jogar({ tipo: 'sj_contradicao', id: '', a: m[0], b: m[1] });
        setMarcar(null);
      } else setMarcar(m);
    };
    return (
      <>
        <p class="centro">
          <b>{t('sjMarque')}</b>
        </p>
        <Mesa v={v} fotos={privado.fotos} marcadas={marcar} tocar={tocar} pode={(i) => v.mesa[i].lado !== lado} />
        <button class="botao sec" onClick={() => setMarcar(null)}>
          {t('sjCancelar')}
        </button>
      </>
    );
  }
  const botao = (p: Poder, texto: string, aoTocar: () => void) => (
    <button class="botao sec sj-poder" disabled={!podeInterromper(v, lado, p)} onClick={aoTocar}>
      <i>{ICONE[p]}</i>
      {texto}
    </button>
  );
  return (
    <div class="sj-interromper">
      {botao('protesto', t('sjProtesto'), () => jogar({ tipo: 'sj_protesto', id: '' }))}
      {botao('contradicao', t('sjContradicao'), () => setMarcar([]))}
      {botao('testemunha', t('sjTestemunha'), () => jogar({ tipo: 'sj_testemunha', id: '' }))}
    </div>
  );
}

/** jurado: dá provas aos dois lados */
function Dar({ privado, jogar }: P) {
  const [prova, setProva] = useState<string | null>(null);
  const d = privado.dadas;
  const dar = (lado: Lado) => {
    const cheio = !d || d[lado] >= privado.quota || (privado.maos?.[lado] ?? 0) >= 5;
    return (
      <button class="botao" disabled={!prova || cheio} onClick={() => { if (prova) { jogar({ tipo: 'sj_dar', id: '', prova, lado }); setProva(null); } }}>
        {nomeLado(lado)} {d?.[lado] ?? 0}/{privado.quota}
      </button>
    );
  };
  return (
    <>
      <p class="centro">
        <b>{t('sjDar')}</b>
      </p>
      <div class="sj-mao">
        {privado.oferta.map((p) => (
          <button key={p.id} class={'sj-carta' + (prova === p.id ? ' on' : '')} aria-pressed={prova === p.id} onClick={() => setProva(p.id)}>
            <FotoProva p={p} fotos={privado.fotos} />
          </button>
        ))}
      </div>
      <div class="sj-dois">
        {dar('acusador')}
        {dar('reu')}
      </div>
    </>
  );
}

/** martelos: culpado/inocente (na contradição: safou-se ou não) */
function Votar({ sala, v, privado, jogar }: P) {
  const contra = v.fase.startsWith('contra');
  if (privado.voto !== null) return <div class="cartao centro">✅ {t('sjVotou')}</div>;
  const opcao = (sim: boolean) => (
    <button class={'sj-voto ' + (sim ? 'culpado' : 'inocente')} onClick={() => jogar({ tipo: 'sj_votar', id: '', sim })}>
      <Martelo tam={84} cor={sim ? '#c53b2c' : '#3f8f5a'} />
      {t(contra ? (sim ? 'sjNao' : 'sjSim') : sim ? 'sjCulpado' : 'sjInocente')}
    </button>
  );
  return (
    <>
      <p class="centro">
        <b>{contra ? t('sjSafouse') : t(v.fase === 'juiz' ? 'sjJuizDecide' : 'sjJuriVota')}</b>
        {v.fase.endsWith('juiz') && v.pesoJuiz > 1 ? ` · ${t('sjPeso', { n: v.pesoJuiz })}` : ''}
      </p>
      {privado.votosJuri && Object.keys(privado.votosJuri).length > 0 && (
        <div class="sj-folha sj-votos-juri">
          <b>🔒 {t('sjVotosJuri')}</b>
          {Object.entries(privado.votosJuri).map(([id, sim]) => (
            <span key={id}>
              {nomeDe(sala, id)}: <b>{t(contra ? (sim ? 'sjNao' : 'sjSim') : sim ? 'sjCulpado' : 'sjInocente')}</b>
            </span>
          ))}
        </div>
      )}
      <div class="sj-dois">
        {opcao(true)}
        {opcao(false)}
      </div>
    </>
  );
}

const VAZIO: PrivadoSemJuizo = { julgamento: -1, mao: [], oferta: [], dadas: null, maos: null, quota: 1, voto: null, estrela: null, votosJuri: null, fotos: {} };

export function TelemovelSemJuizo({ sala, v, agora, eu, enviar, privado: pr }: PropsSemJuizo & { eu: string; enviar: (a: AcaoSala) => void; privado: PrivadoSemJuizo | null }) {
  const [ajuda, setAjuda] = useState(false);
  const privado = pr && pr.julgamento === v.julgamento ? pr : VAZIO;
  const jogar: Jogar = (acao) => enviar({ tipo: 'jogo', acao });
  const props: P = { sala, v, agora, privado, jogar };
  const semTv = !!sala.semTv;
  const lado = ladoDe(v, eu);
  const votante = eu === v.juiz || v.juri.includes(eu);
  const minhaVez = !!lado && ladoDaVez(v) === lado;
  const euVoto = v.fase.endsWith('juri') ? v.juri.includes(eu) : v.fase.endsWith('juiz') && v.juiz === eu;
  const chave = `${v.julgamento}:${v.fase}:${v.mesa.length}`;
  const papel = lado ? t(lado === 'reu' ? 'sjEsReu' : 'sjEsAcusador') : eu === v.juiz ? t('sjEsJuiz') : v.juri.includes(eu) ? t('sjEsJuri') : t('sjAssiste');
  const escolho = v.fase === 'escolher' && minhaVez;
  const dou = v.fase === 'provas' && privado.oferta.length > 0 && !v.feitos.includes(eu);
  const voto = aVotarFase(v) && euVoto;
  const estrelo = v.fase === 'estrela' && votante && privado.estrela === null;
  const fase = v.fase;
  const emMesa = !['caso', 'provas', 'revelar', 'fim'].includes(fase);

  return (
    <div class="pag tel-semjuizo">
      <div class="topo">
        <span>{fase === 'fim' ? t('sjNome') : t('sjJulgamento', { n: v.julgamento + 1, t: v.total })}</span>
        <button class="chip" aria-label={t('comoJogar')} onClick={() => setAjuda(!ajuda)}>
          ⓘ
        </button>
        <AcabarPartida sala={sala} eu={eu} enviar={enviar} />
        {fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
      </div>
      {ajuda && (
        <div class="cartao" onClick={() => setAjuda(false)}>
          <b>{t('sjNome')}</b> — {t('ajudaSemJuizo')}
        </div>
      )}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}

      {fase !== 'fim' && fase !== 'revelar' && <p class={'sj-papel ' + (lado ?? '')}>{papel}</p>}

      {fase === 'caso' && (
        <>
          <FolhaCaso sala={sala} caso={v.caso} titulo={t('sjCrime')} />
          {semTv && <Partes sala={sala} v={v} tam={64} />}
        </>
      )}

      {fase === 'provas' && !dou && <FolhaCaso sala={sala} caso={v.caso} titulo={narrar(sala, v)} />}
      {dou && <Dar {...props} />}

      {emMesa && <p class="sj-caso-linha">{txt(v.caso, sala)}</p>}
      {escolho && <Escolher key={chave} {...props} />}

      {emMesa && !escolho && !voto && !estrelo && (
        <>
          <h2 class="sj-narra">
            {fase === 'explicar' && minhaVez ? t('sjExplique') : fase === 'testemunha' && v.testemunha === eu ? t('sjTestemunhaDica') : narrar(sala, v)}
          </h2>
          {semTv && <Mesa v={v} fotos={privado.fotos} marcadas={marcadasDe(v)} />}
          {semTv && aVotarFase(v) && <Martelos sala={sala} v={v} tam={44} />}
          {!semTv && !lado && !aVotarFase(v) && <p class="centro mini">{t('olhaTv')}</p>}
        </>
      )}
      {fase === 'explicar' && lado && <Interromper key={chave} {...props} lado={lado} />}

      {voto && (
        <>
          {semTv && fase.startsWith('contra') && <Mesa v={v} fotos={privado.fotos} marcadas={marcadasDe(v)} />}
          <Votar {...props} />
        </>
      )}

      {estrelo && (
        <>
          <p class="centro">
            <b>{t('sjEstrela')}</b>
          </p>
          <Mesa v={v} fotos={privado.fotos} tocar={(i) => jogar({ tipo: 'sj_estrela', id: '', i })} pode={(i) => !v.mesa[i].semEstrela} />
        </>
      )}
      {fase === 'estrela' && <Progresso semTv={semTv} ids={[...(v.juiz ? [v.juiz] : []), ...v.juri]} feitos={v.feitos} />}

      {fase === 'revelar' &&
        (semTv ? <ResultadoSj sala={sala} v={v} fotos={privado.fotos} /> : <h1 class={'sj-carimbo ' + (v.resultado?.culpado ? 'culpado' : 'inocente')}>{t(v.resultado?.culpado ? 'sjCulpado' : 'sjInocente')}</h1>)}

      {fase === 'fim' && (
        <>
          <h1 class="pergunta">{t('fim')}</h1>
          <PlacarSj sala={sala} v={v} tam={40} />
          {sala.vipId === eu && (
            <div class="linha">
              <button class="botao cresce" onClick={() => enviar({ tipo: 'outra_vez', id: '' })}>
                {t('jogarOutraVez')}
              </button>
              <button class="botao sec" onClick={() => enviar({ tipo: 'menu', id: '' })}>
                {t('menu')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
