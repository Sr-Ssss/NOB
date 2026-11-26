import { useEffect, useState } from 'preact/hooks';
import type { AcaoSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { Tela } from '../../ui/tela';
import type { Traco } from '../../ui/tracos';
import { avatarDe, nomeDe } from '../5050/tv';
import { ETAPAS, MAX_NOME, MAX_PROBLEMA, MAX_SLOGAN, NOTAS, VALOR_NOTA, type Problema } from './regras';
import { ETAPAS_TXT, Palco, PlacarIdeias, type PropsIdeias } from './comuns';
import { Espera, Progresso } from '../../ui/ecraunico';
import { AcabarPartida } from '../../ui/acabarPartida';
import { useRascunho, useSoRascunho } from '../../ui/rascunho';

type Enviar = (a: AcaoSala) => void;
const jogo = (enviar: Enviar, acao: Record<string, unknown>) => enviar({ tipo: 'jogo', acao: { id: '', ...acao } as never });

/** problema sorteado, editável */
function EscreverProblema({ sorteado, idioma, enviar, grupo }: { sorteado: Problema | undefined; idioma: string; enviar: Enviar; grupo: string }) {
  const original = sorteado ? (idioma === 'en' ? sorteado.en : sorteado.pt) : '';
  // o rascunho sobrevive a remontar (passagem do anfitrião, recarregar): src/ui/rascunho.ts
  const [texto, setTexto] = useRascunho(grupo, 'texto', original);
  return (
    <div class="cartao im-tel">
      <label>{t('imProblema')}</label>
      <input value={texto} maxLength={MAX_PROBLEMA} onInput={(e) => setTexto(e.currentTarget.value)} />
      <div class="mini centro">
        {texto.length}/{MAX_PROBLEMA}
      </div>
      <button class="botao grande" onClick={() => jogo(enviar, { tipo: 'im_problema', texto: texto.trim() || original })}>
        {t('enviar')}
      </button>
    </div>
  );
}

/** canvas sobre papel quadriculado + nome + slogan */
function Inventar({ problema, enviar, grupo }: { problema: string; enviar: Enviar; grupo: string }) {
  const [tracos, setTracos] = useRascunho<Traco[]>(grupo, 'tracos', []);
  const [nome, setNome] = useRascunho(grupo, 'nome', '');
  const [slogan, setSlogan] = useRascunho(grupo, 'slogan', '');
  const [aviso, setAviso] = useState(false);
  return (
    <div class="im-tel">
      <div class="im-problema">
        <small>{t('imSeuProblema')}</small>
        <div>{problema}</div>
      </div>
      <Tela
        planta
        tracos={tracos}
        mudar={(x) => {
          setTracos(x);
          setAviso(false);
        }}
      />
      <input placeholder={t('imNome')} value={nome} maxLength={MAX_NOME} onInput={(e) => (setNome(e.currentTarget.value), setAviso(false))} />
      <input placeholder={t('imSlogan')} value={slogan} maxLength={MAX_SLOGAN} onInput={(e) => setSlogan(e.currentTarget.value)} />
      {aviso && <p class="centro mini">{t('imVazio')}</p>}
      <button
        class="botao grande"
        onClick={() => {
          if (!tracos.length || !nome.trim()) return setAviso(true);
          jogo(enviar, { tipo: 'im_invencao', tracos, nome, slogan });
        }}
      >
        {t('enviar')}
      </button>
    </div>
  );
}

/** o inventor passa as etapas */
function Comando({ etapa, enviar }: { etapa: number; enviar: Enviar }) {
  const ultima = etapa >= ETAPAS - 1;
  return (
    <div class="cartao im-tel">
      <h2 class="centro">{t('imSeuPitch')}</h2>
      <p class="centro">
        <b>{t(ETAPAS_TXT[etapa] ?? 'imEtapa0')}</b> ({etapa + 1}/{ETAPAS})
      </p>
      <div class="linha">
        <button class="botao sec" disabled={etapa === 0} onClick={() => jogo(enviar, { tipo: 'im_etapa', etapa: etapa - 1 })}>
          {t('imAnterior')}
        </button>
        {ultima ? (
          <button class="botao cresce" onClick={() => jogo(enviar, { tipo: 'im_acabei' })}>
            {t('imAcabei')}
          </button>
        ) : (
          <button class="botao cresce" onClick={() => jogo(enviar, { tipo: 'im_etapa', etapa: etapa + 1 })}>
            {t('imSeguinte')}
          </button>
        )}
      </div>
    </div>
  );
}

/** 3 notas de 100 € nas invenções dos outros */
function Investir({ sala, v, eu, enviar }: Omit<PropsIdeias, 'agora'> & { eu: string; enviar: Enviar }) {
  const [notas, setNotas] = useState<Record<string, number>>({});
  const usadas = Object.values(notas).reduce((a, b) => a + b, 0);
  const mudar = (inv: string, d: number) => {
    const n = Math.max(0, (notas[inv] ?? 0) + d);
    if (d > 0 && usadas >= NOTAS) return;
    const novo = { ...notas, [inv]: n };
    setNotas(novo);
    jogo(enviar, { tipo: 'im_investir', notas: novo });
  };
  return (
    <div class="im-tel">
      <h2 class="centro">{t('imInvestir')}</h2>
      <div class="notas">
        {Array.from({ length: NOTAS }, (_, i) => (
          <span key={i} class={'nota' + (i < usadas ? ' usada' : '')}>
            {VALOR_NOTA} €
          </span>
        ))}
      </div>
      {v.cartoes.map((c) => {
        const minha = c.inventor === eu;
        const n = notas[c.inventor] ?? 0;
        return (
          <div key={c.inventor} class={'investe' + (minha ? ' minha' : '')}>
            <b>
              {c.nome}
              {minha && <small> ({t('imSua')})</small>}
            </b>
            {c.slogan && <i class="mini">“{c.slogan}”</i>}
            <span class="mini">
              <Avatar n={avatarDe(sala, c.inventor)} tam={20} /> {nomeDe(sala, c.inventor)}
            </span>
            {!minha && (
              <div class="investe-linha">
                <button class="botao sec" aria-label="−100 €" disabled={!n} onClick={() => mudar(c.inventor, -1)}>
                  −
                </button>
                <b>{n * VALOR_NOTA} €</b>
                <button class="botao sec" aria-label="+100 €" disabled={usadas >= NOTAS} onClick={() => mudar(c.inventor, 1)}>
                  +
                </button>
              </div>
            )}
          </div>
        );
      })}
      <button class="botao grande" disabled={usadas !== NOTAS} onClick={() => jogo(enviar, { tipo: 'im_investir', notas, confirmar: true })}>
        {t('imConfirmar')}
      </button>
    </div>
  );
}

function Eu({ sala, v, eu, tag, enviar }: Omit<PropsIdeias, 'agora'> & { eu: string; tag: string; enviar: Enviar }) {
  const participa = v.participantes.includes(eu);
  // sem TV, à espera vê-se o que a TV mostraria (um só ecrã)
  const palco = <Palco sala={sala} v={v} compacto />;
  const espero = (txt: string) => <Espera semTv={sala.semTv} texto={txt} palco={palco} />;
  const progresso = <Progresso semTv={sala.semTv} ids={v.espera} feitos={v.enviaram} />;

  if (v.fase === 'problema') {
    if (!participa) return espero(t('imPlateia'));
    if (v.enviaram.includes(eu)) return espero('✅ ' + t('imEnviado'));
    return <>{progresso}<EscreverProblema grupo={`${sala.codigo}:ideias:p`} sorteado={v.sorteados[tag]} idioma={sala.idioma} enviar={enviar} /></>;
  }
  if (v.fase === 'inventar') {
    if (!v.apresentadores.includes(eu)) return espero(participa ? t('imNaoApresenta') : t('imPlateia'));
    if (v.enviaram.includes(eu)) return espero('✅ ' + t('imEnviado'));
    return <>{progresso}<Inventar grupo={`${sala.codigo}:ideias:i`} problema={v.recebidos[tag] ?? '?'} enviar={enviar} /></>;
  }
  if (v.fase === 'pitch' && v.pitch) {
    // o inventor vê, por baixo dos botões, o que os outros estão a ver
    if (v.pitch.inventor === eu) return <><Comando key={v.atual} etapa={v.etapa} enviar={enviar} />{sala.semTv && palco}</>;
    return espero(t('imOuvir', { nome: nomeDe(sala, v.pitch.inventor) }));
  }
  if (v.fase === 'investir') {
    if (v.enviaram.includes(eu)) return espero('✅ ' + t('imConfirmado'));
    if (!v.espera.includes(eu)) return espero(t('mlEspera'));
    return (
      <>
        {!participa && <p class="centro mini">{t('imPlateia')}</p>}
        <Investir sala={sala} v={v} eu={eu} enviar={enviar} />
        {progresso}
      </>
    );
  }
  if (v.fase === 'revelar') return <Palco sala={sala} v={v} compacto />;
  return null;
}

/** aparece nos últimos 15 s (verifica uma vez por segundo) */
function AvisoFim({ terminaEm, agora }: { terminaEm: number; agora: () => number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const falta = terminaEm - agora();
  return falta > 0 && falta <= 15_000 ? (
    <div class="aviso" role="alert">
      {t('imFaltam15')}
    </div>
  ) : null;
}

export function TelemovelIdeias({ sala, v, agora, eu, tag, enviar }: PropsIdeias & { eu: string; tag: string; enviar: Enviar }) {
  const [ajuda, setAjuda] = useState(false);
  const lider = sala.vipId === eu;
  const fim = v.fase === 'fim';
  const escreve = !v.enviaram.includes(eu);
  useSoRascunho(
    escreve && v.fase === 'problema' && v.participantes.includes(eu) ? `${sala.codigo}:ideias:p` : escreve && v.fase === 'inventar' && v.apresentadores.includes(eu) ? `${sala.codigo}:ideias:i` : null,
  );
  return (
    <div class="pag jogo-ideias">
      <div class="topo">
        <span>{v.fase === 'pitch' && v.total ? t('imInvencao', { n: v.atual + 1, t: v.total }) : t('imOpcoesNome')}</span>
        <button class="chip" aria-label={t('comoJogar')} onClick={() => setAjuda(!ajuda)}>
          ⓘ
        </button>
        <AcabarPartida sala={sala} eu={eu} enviar={enviar} />
        {!fim && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
      </div>
      {ajuda && (
        <div class="cartao" onClick={() => setAjuda(false)}>
          <b>{t('imOpcoesNome')}</b> — {t('ajudaIdeias')}
        </div>
      )}
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}
      {/* quem não envia a invenção não apresenta: avisar nos últimos 15 s */}
      {v.fase === 'inventar' && escreve && v.apresentadores.includes(eu) && v.restante === null && <AvisoFim terminaEm={v.terminaEm} agora={agora} />}
      {fim ? (
        <>
          <h1 class="pergunta">{t('fim')}</h1>
          <div class="cartao">
            <PlacarIdeias sala={sala} v={v} tam={40} />
          </div>
          {lider && (
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
      ) : (
        <Eu sala={sala} v={v} eu={eu} tag={tag} enviar={enviar} />
      )}
    </div>
  );
}
