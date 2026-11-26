import { useEffect, useRef, useState } from 'preact/hooks';
import type { AcaoSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { AcabarPartida } from '../../ui/acabarPartida';
import { Boneco18 } from '../../ui/bonecos';
import { Temporizador } from '../../ui/comuns';
import { Espera, Progresso } from '../../ui/ecraunico';
import { useRascunho, useSoRascunho } from '../../ui/rascunho';
import { Tela } from '../../ui/tela';
import { bytesTracos, type Traco } from '../../ui/tracos';
import { avatarDe, nomeDe } from '../5050/tv';
import { Carta, CartaMago } from './artes/carta';
import { ENCAIXE } from './artes/magos';
import { Molde } from './artes/moldes';
import { Palco, type PropsDuelo } from './comuns';
import { BatalhaTel } from './batalhaTel';
import { CRIATURAS, MAGOS_PODERES, MAX_CLASSES, custoExercito, exercitosProntos, motivoNaoSomar, mudarExercito, validarExercito, type Criatura, type Exercito, type RoupaMago } from './criaturas';
import { MAX_BYTES_DESENHO, PREPARACAO, feitosPreparacao, type Desenhos } from './regras';
import { MOTIVO, NOME_MAGO, TEXTO_CRIATURA, TXT } from './textos';
import '../mona-lixa/mona.css';
import './artes/carta.css';

type Enviar = (a: AcaoSala) => void;
/** `privado`: os desenhos de todos (canal privado, `privadoDuelo`); null até chegarem */
type Props = PropsDuelo & { eu: string; privado: Desenhos | null; enviar: Enviar };
const jogo = (enviar: Enviar, acao: Record<string, unknown>) => enviar({ tipo: 'jogo', acao: { id: '', ...acao } as never });
/** o que está feito sem confirmar vai um pouco antes de o tempo acabar */
const ANTES_DO_FIM = 1_500;
const ESPERA_ENVIO = 1_500;

function EscolherMago({ sala, v, eu, enviar }: Props) {
  return (
    <>
      <h2 class="centro">{TXT.mago}</h2>
      <div class="dr-cartas">
        {(Object.keys(MAGOS_PODERES) as RoupaMago[]).map((r) => {
          const dono = v.participantes.find((id) => v.magos[id].roupa === r);
          const meu = dono === eu;
          return (
            <button
              key={r}
              class={'dr-escolha' + (meu ? ' on' : '')}
              aria-label={NOME_MAGO[r] + (dono && !meu ? ': ' + nomeDe(sala, dono) : '')}
              aria-pressed={meu}
              disabled={!!dono && !meu}
              onClick={() => jogo(enviar, { tipo: 'dr_mago', roupa: r })}
            >
              <CartaMago roupa={r}>
                <Boneco18 n={avatarDe(sala, dono ?? eu)} tam={ENCAIXE.tam} />
              </CartaMago>
              {dono && <span class="dr-dono">{meu ? '✓ ' + TXT.teu : nomeDe(sala, dono)}</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}

function EscolherExercito({ v, sala, agora, enviar }: Props) {
  const { tinta } = v.def;
  const [x, setX] = useRascunho<Exercito>(`${sala.codigo}:duelo:e`, 'exercito', {}, (g) => validarExercito(g, tinta) !== null);
  const [sugerir, setSugerir] = useState(false);
  const resta = tinta - custoExercito(x);
  const valido = validarExercito(x, tinta) !== null;
  const ultimo = useRef(x);
  ultimo.current = x;
  // o tempo acabou sem confirmar: vale o que estiver escolhido
  useEffect(() => {
    if (v.pausaRestante !== null) return;
    const i = setTimeout(() => validarExercito(ultimo.current, tinta) && jogo(enviar, { tipo: 'dr_exercito', exercito: ultimo.current }), Math.max(0, v.terminaEm - agora() - ANTES_DO_FIM));
    return () => clearTimeout(i);
  }, [v.terminaEm, v.pausaRestante]);
  return (
    <>
      <div class="dr-barra">
        <b>{TXT.resta(resta, tinta)}</b>
        <span class="mini">{TXT.classes(Object.keys(x).length, MAX_CLASSES)}</span>
        <button class="botao" disabled={!valido} onClick={() => jogo(enviar, { tipo: 'dr_exercito', exercito: x })}>
          {TXT.confirmar}
        </button>
      </div>
      <button class="chip" aria-expanded={sugerir} onClick={() => setSugerir(!sugerir)}>
        {TXT.exercitoPronto}
      </button>
      {sugerir &&
        exercitosProntos(tinta).map((s, i) => (
          <button
            key={i}
            class="dr-sugestao"
            onClick={() => {
              setX(s);
              setSugerir(false);
            }}
          >
            {(Object.entries(s) as [Criatura, number][]).map(([c, n]) => `${n}× ${TEXTO_CRIATURA[c].nome}`).join(' · ')}
          </button>
        ))}
      <div class="dr-cartas">
        {(Object.keys(CRIATURAS) as Criatura[]).map((c) => {
          const n = x[c] ?? 0;
          const motivo = motivoNaoSomar(x, c, tinta);
          const { nome } = TEXTO_CRIATURA[c];
          return (
            <div key={c} class={'dr-escolha' + (n ? ' on' : motivo ? ' apagada' : '')}>
              <Carta criatura={c} />
              <div class="dr-contador">
                <button class="opcao" aria-label={TXT.menos(nome)} disabled={!n} onClick={() => setX(mudarExercito(x, c, -1))}>
                  −
                </button>
                <b aria-live="polite">{n}</b>
                <button class="opcao" aria-label={TXT.mais(nome)} disabled={motivo !== null} onClick={() => setX(mudarExercito(x, c, 1))}>
                  +
                </button>
              </div>
              <small class="dr-motivo">{motivo ? MOTIVO[motivo] : ''}</small>
            </div>
          );
        })}
      </div>
    </>
  );
}

type Meus = Partial<Record<Criatura, Traco[]>>;

function Desenhar({ v, sala, eu, agora, enviar }: Props) {
  const criaturas = Object.keys(v.magos[eu].exercito ?? {}) as Criatura[];
  const [desenhos, setDesenhos] = useRascunho<Meus>(`${sala.codigo}:duelo:d`, 'desenhos', {});
  const [c, setC] = useState(criaturas[0]);
  const [molde, setMolde] = useState(true);
  const [cheio, setCheio] = useState(false);
  const porEnviar = useRef(new Set<Criatura>(Object.keys(desenhos) as Criatura[]));
  const tracos = desenhos[c] ?? [];
  // "vale o que houver": guarda sozinho pouco depois de cada risco
  useEffect(() => {
    const falta = v.pausaRestante ?? v.terminaEm - agora();
    const i = setTimeout(
      () => {
        for (const k of porEnviar.current) jogo(enviar, { tipo: 'dr_desenho', criatura: k, tracos: desenhos[k] ?? [] });
        porEnviar.current.clear();
      },
      Math.min(ESPERA_ENVIO, Math.max(0, falta - ANTES_DO_FIM)),
    );
    return () => clearTimeout(i);
  }, [desenhos]);
  const mudar = (novo: Traco[]) => {
    // cheio: volta a pintar sem o risco a mais (lista nova = a Tela repinta)
    const demais = bytesTracos(novo) > MAX_BYTES_DESENHO && novo.length > tracos.length;
    setCheio(demais);
    setDesenhos({ ...desenhos, [c]: demais ? [...tracos] : novo });
    if (!demais) porEnviar.current.add(c);
  };
  return (
    <div class="mona-tel">
      <div class="opcoes" role="group" aria-label={TXT.desenhar}>
        {criaturas.map((k) => (
          <button
            key={k}
            class={'opcao' + (k === c ? ' on' : '')}
            aria-pressed={k === c}
            onClick={() => {
              setC(k);
              setCheio(false);
            }}
          >
            {desenhos[k]?.length ? '✓ ' : ''}
            {TEXTO_CRIATURA[k].nome}
          </button>
        ))}
      </div>
      <div class="opcoes">
        {[true, false].map((m) => (
          <button key={String(m)} class={'opcao' + (molde === m ? ' on' : '')} aria-pressed={molde === m} onClick={() => setMolde(m)}>
            {m ? TXT.comMolde : TXT.livre}
          </button>
        ))}
      </div>
      <div class="dr-tela">
        <Tela key={c} tracos={tracos} mudar={mudar} />
        {molde && <Molde criatura={c} />}
      </div>
      <p class="centro mini" role="status">
        {cheio ? TXT.cheio : TXT.vazio}
      </p>
      <button
        class="botao grande"
        onClick={() => {
          porEnviar.current.clear();
          criaturas.forEach((k, i) => jogo(enviar, { tipo: 'dr_desenho', criatura: k, tracos: desenhos[k] ?? [], pronto: i === criaturas.length - 1 }));
        }}
      >
        {TXT.acabei}
      </button>
    </div>
  );
}

function Eu(p: Props) {
  const { sala, v, eu } = p;
  const espero = (txt: string) => <Espera semTv={sala.semTv} texto={txt} palco={<Palco sala={sala} v={v} />} />;
  if (!PREPARACAO.includes(v.fase)) return <BatalhaTel sala={sala} v={v} agora={p.agora} eu={eu} desenhos={p.privado ?? {}} enviar={p.enviar} />;
  if (!v.participantes.includes(eu)) return espero(TXT.soVer);
  const feitos = feitosPreparacao(v);
  const progresso = <Progresso semTv={sala.semTv} ids={v.participantes} feitos={feitos} />;
  // o mago pode mudar-se até todos escolherem
  if (v.fase !== 'mago' && feitos.includes(eu)) return espero('✅ ' + TXT.espera);
  return (
    <>
      {progresso}
      {v.fase === 'mago' ? <EscolherMago {...p} /> : v.fase === 'exercito' ? <EscolherExercito {...p} /> : <Desenhar {...p} />}
    </>
  );
}

export function TelemovelDuelo(p: Props) {
  const { sala, v, agora, eu, enviar } = p;
  useSoRascunho(v.fase === 'exercito' ? `${sala.codigo}:duelo:e` : v.fase === 'desenhar' ? `${sala.codigo}:duelo:d` : null);
  return (
    <div class="pag jogo-duelo">
      <div class="topo">
        <span>
          {TXT.nome}
          {sala.semTv && v.volta > 0 && ' · ' + TXT.volta(v.volta)}
        </span>
        <AcabarPartida sala={sala} eu={eu} enviar={enviar} />
        {v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.pausaRestante} agora={agora} />}
      </div>
      {v.pausaRestante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}
      <Eu {...p} />
    </div>
  );
}