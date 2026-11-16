import { useState } from 'preact/hooks';
import type { AcaoSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { nomeDe } from '../5050/tv';
import { Fichas, PlacarWifi, Resultado, Router, Tempo, faseTexto, nomeEquipa, rondaTexto, textoPista } from './comuns';
import { MAX_PISTA, outro, pistaBloqueada, textoPalavra, type Lado, type PrivadoWifi } from './regras';
import { Palco, type PropsWifi } from './tv';

type Enviar = (a: AcaoSala) => void;
const jogo = (enviar: Enviar, acao: Record<string, unknown>) => enviar({ tipo: 'jogo', acao: { id: '', ...acao } as never });

/** as 4 palavras da equipa em post-its numerados (🔄 só na preparação) */
function Palavras({ sala, p, trocar }: { sala: PropsWifi['sala']; p: PrivadoWifi; trocar?: (i: number) => void }) {
  return (
    <div class="minhas">
      {p.palavras.map((w, i) => (
        <div key={w.id} class="postit" style={{ transform: `rotate(${[-2, 1.5, 1, -1.5][i]}deg)` }}>
          <b>{i + 1}</b> {textoPalavra(w, sala.idioma)}
          {trocar && !p.trocadas[i] && (
            <button class="trocar" aria-label={t('swTrocar')} onClick={() => trocar(i)}>
              🔄
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function Historico({ v, l }: { v: PropsWifi['v']; l: Lado }) {
  return (
    <div>
      <div class="linha" style={{ justifyContent: 'space-between' }}>
        <b>{t('swHistorico', { eq: nomeEquipa(l) })}</b>
        <Fichas f={v.fichas[l]} />
      </div>
      <Router lado={l} historico={v.historico[l]} acesas={v.revelacao?.lado === l ? v.revelacao.codigo : undefined} />
    </div>
  );
}

/** ecrã do Criptógrafo: código grande + 3 campos (número → pista) */
function Criptografo({ sala, v, p, enviar }: { sala: PropsWifi['sala']; v: PropsWifi['v']; p: PrivadoWifi; enviar: Enviar }) {
  const [pistas, setPistas] = useState(['', '', '']);
  const codigo = p.codigo!;
  const mal = pistas.map((x) => pistaBloqueada(x, p.palavras, sala.idioma));
  const ok = pistas.every((x) => x.trim()) && mal.every((m) => !m);
  const o = outro(p.lado);
  return (
    <div class="cartao" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div class="centro">{t('swTeuCodigo')}</div>
      <div class="meu-codigo">{codigo.join(' · ')}</div>
      {codigo.map((n, i) => (
        <div key={i}>
          <div class="campo-pista">
            <span class="num">{n}</span>
            <input
              class={mal[i] ? 'mal' : ''}
              value={pistas[i]}
              maxLength={MAX_PISTA}
              placeholder={`${t('swPista')} → ${textoPalavra(p.palavras[n - 1], sala.idioma)}`}
              onInput={(e) => setPistas(pistas.map((x, k) => (k === i ? e.currentTarget.value : x)))}
            />
          </div>
          {mal[i] && <div class="mudou">⚠ {t('swBloqueada', { p: textoPalavra(mal[i]!, sala.idioma) })}</div>}
        </div>
      ))}
      <button class="botao grande" disabled={!ok} onClick={() => jogo(enviar, { tipo: 'pistas', pistas })}>
        {t('enviar')}
      </button>
      <div class="centro mini">
        {t('swCriptografo')} {nomeEquipa(o)}: {v.enviaram.includes(o) ? '✅' : '❌'}
      </div>
    </div>
  );
}

/** resposta partilhada: cada pista com botões 1–4 */
function RespostaPartilhada({ sala, v, eu, enviar }: { sala: PropsWifi['sala']; v: PropsWifi['v']; eu: string; enviar: Enviar }) {
  const pistas = v.pistas[v.turno] ?? [];
  const r = v.resposta;
  const completa = r.nums.every((n) => n !== null);
  const confirmei = r.confirmados.includes(eu);
  const quem = v.respondentes.filter((id) => sala.jogadores.find((j) => j.id === id)?.ligado);
  return (
    <div class="cartao" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <b class="centro">{v.passo === 'intercetar' ? t('swIntercetar', { eq: nomeEquipa(v.turno) }) : t('swDescodificar')}</b>
      {pistas.map((pista, linha) => (
        <div key={linha} class="linha-resp">
          <div class="pista">
            <div class="postit" style={{ transform: `rotate(${linha % 2 ? 1 : -1.5}deg)` }}>
              {textoPista(pista)}
            </div>
            {r.mudouPor[linha] && r.mudouPor[linha] !== eu && <span class="mudou">{t('swMudou', { nome: nomeDe(sala, r.mudouPor[linha]!) })}</span>}
          </div>
          <div class="botoes14">
            {[1, 2, 3, 4].map((n) => {
              const on = r.nums[linha] === n;
              const usado = !on && r.nums.some((x, k) => k !== linha && x === n);
              return (
                <button key={n} class={on ? 'on' : ''} disabled={usado} onClick={() => jogo(enviar, { tipo: 'resposta', linha, num: on ? null : n })}>
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button class="botao grande" disabled={!completa || confirmei} onClick={() => jogo(enviar, { tipo: 'confirmar' })}>
        {confirmei ? '✅ ' : ''}
        {t('swConfirmar')}
      </button>
      <div class="centro">{t('swConfirmaram', { n: r.confirmados.length, t: v.precisa })}</div>
      <div class="confirmaram">
        {quem.map((id) => (
          <span key={id}>
            {r.confirmados.includes(id) ? '✅' : '❌'} {nomeDe(sala, id)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Eu({ sala, v, eu, tag, enviar }: PropsWifi & { eu: string; tag: string; enviar: Enviar }) {
  const p = v.privado[tag];
  const lider = sala.vipId === eu;

  if (v.fase === 'equipas') {
    if (!lider)
      return (
        <>
          <p class="centro">{t('swLiderMonta')}</p>
          {(['b', 'p'] as Lado[]).map((l) => (
            <div key={l} class="cartao">
              <b>{nomeEquipa(l)}</b>: {v.equipas[l].map((id) => nomeDe(sala, id)).join(', ')}
            </div>
          ))}
        </>
      );
    const pode = v.equipas.b.length >= 2 && v.equipas.p.length >= 2;
    return (
      <div class="cartao equipa-lista">
        <b>{t('swEquipasTitulo')}</b>
        {v.participantes.map((id) => (
          <div key={id} class="item">
            <span class="cresce">{nomeDe(sala, id)}</span>
            {(['b', 'p'] as Lado[]).map((l) => (
              <button key={l} class={v.equipas[l].includes(id) ? 'on' : ''} aria-label={nomeEquipa(l)} onClick={() => jogo(enviar, { tipo: 'mover', jogador: id, lado: l })}>
                {l === 'b' ? '○' : '●'}
              </button>
            ))}
          </div>
        ))}
        <button class="botao grande" disabled={!pode} onClick={() => jogo(enviar, { tipo: 'fechar_equipas' })}>
          ▶ {t('comecar')}
        </button>
        {!pode && <p class="centro mini">{t('swMin2')}</p>}
      </div>
    );
  }

  if (!p) {
    // audiência: só vê os históricos
    return (
      <>
        <p class="centro">{t('audiencia')}</p>
        {v.fase !== 'palavras' && (['b', 'p'] as Lado[]).map((l) => <Historico key={l} v={v} l={l} />)}
      </>
    );
  }

  const o = outro(p.lado);
  const souCripto = v.criptografos[p.lado] === eu;
  const respondo = v.fase === 'responder' && v.respondentes.includes(eu);
  const intercetar = respondo && v.passo === 'intercetar';

  return (
    <>
      <div class="linha" style={{ justifyContent: 'space-between' }}>
        <b>{nomeEquipa(p.lado)}</b>
        {v.fase !== 'palavras' && <Fichas f={v.fichas[p.lado]} />}
      </div>
      {/* interceção: por cima, o histórico da outra equipa em vez das palavras */}
      {intercetar ? <Historico v={v} l={o} /> : <Palavras sala={sala} p={p} trocar={v.fase === 'palavras' && !v.prontos.includes(eu) ? (i) => jogo(enviar, { tipo: 'trocar', i }) : undefined} />}

      {v.fase === 'palavras' &&
        (v.prontos.includes(eu) ? (
          <div class="cartao centro">✅ {t('swEsperaProntos')}</div>
        ) : (
          <button class="botao grande" onClick={() => jogo(enviar, { tipo: 'prontas' })}>
            {t('pronto')}
          </button>
        ))}

      {v.fase === 'pistas' &&
        (souCripto && p.codigo && !v.enviaram.includes(p.lado) ? (
          <Criptografo key={v.ronda} sala={sala} v={v} p={p} enviar={enviar} />
        ) : (
          <div class="cartao centro">{souCripto ? '✅ ' + t('enviado') : t('swEsperaPistas')}</div>
        ))}

      {respondo && <RespostaPartilhada sala={sala} v={v} eu={eu} enviar={enviar} />}
      {v.fase === 'responder' && !respondo && (
        <div class="cartao centro">
          {souCripto && v.turno === p.lado && v.passo === 'descodificar' ? t('swCriptoVe') + ' · ' : ''}
          {t('swEsperaResp', { eq: nomeEquipa(v.passo === 'intercetar' ? outro(v.turno) : v.turno) })}
          <div>{t('swConfirmaram', { n: v.resposta.confirmados.length, t: v.precisa })}</div>
        </div>
      )}

      {v.fase === 'revelar' && (
        <div class="cartao centro">
          <Resultado v={v} />
        </div>
      )}

      {v.fase !== 'palavras' && (
        <>
          {!intercetar && <Historico v={v} l={o} />}
          <Historico v={v} l={p.lado} />
        </>
      )}
    </>
  );
}

export function TelemovelWifi({ sala, v, agora, eu, tag, enviar }: PropsWifi & { eu: string; tag: string; enviar: Enviar }) {
  const [ajuda, setAjuda] = useState(false);
  const [painel, setPainel] = useState(false);
  const lider = sala.vipId === eu;
  const p = v.privado[tag];

  if (v.fase === 'fim') {
    return (
      <div class="pag tel-wifi">
        <h1 class="pergunta">{v.vencedor ? t('swGanharam', { eq: nomeEquipa(v.vencedor) }) : t('fim')}</h1>
        {p && v.vencedor && <p class="centro">{v.vencedor === p.lado ? '🏆' : '📶❌'}</p>}
        {(['b', 'p'] as Lado[]).map((l) => (
          <div key={l} class="cartao">
            <div class="linha" style={{ justifyContent: 'space-between' }}>
              <b>{nomeEquipa(l)}</b>
              <Fichas f={v.fichas[l]} />
            </div>
            <div>{(v.palavrasFim?.[l] ?? []).map((w, i) => `${i + 1}. ${textoPalavra(w, sala.idioma)}`).join(' · ')}</div>
          </div>
        ))}
        <div class="cartao">
          <PlacarWifi sala={sala} v={v} tam={40} />
        </div>
        {lider ? (
          <div class="linha">
            <button class="botao cresce" onClick={() => enviar({ tipo: 'outra_vez', id: '' })}>
              {t('jogarOutraVez')}
            </button>
            <button class="botao sec" onClick={() => enviar({ tipo: 'menu', id: '' })}>
              {t('menu')}
            </button>
          </div>
        ) : (
          <p class="centro mini">{t('esperaFim')}</p>
        )}
      </div>
    );
  }

  return (
    <div class="pag tel-wifi">
      <div class="topo">
        <span>{v.ronda ? `${t('swRonda')} ${rondaTexto(v)}` : t('swOpcoesNome')}</span>
        <span class="mini">{faseTexto(v)}</span>
        <button class="chip" aria-label={t('comoJogar')} onClick={() => setAjuda(!ajuda)}>
          ⓘ
        </button>
        <Tempo v={v} agora={agora} />
      </div>
      {ajuda && (
        <div class="cartao" onClick={() => setAjuda(false)}>
          <b>{t('swOpcoesNome')}</b> — {t('ajudaWifi')}
        </div>
      )}
      {v.restante !== null && <div class="aviso">{t('pausa')}</div>}
      {sala.semTv && v.ronda > 0 && (
        <div class="separadores">
          <button class={painel ? '' : 'on'} onClick={() => setPainel(false)}>
            {t('swEu')}
          </button>
          <button class={painel ? 'on' : ''} onClick={() => setPainel(true)}>
            {t('swPainel')}
          </button>
        </div>
      )}
      {painel && sala.semTv && v.ronda > 0 ? <Palco sala={sala} v={v} agora={agora} /> : <Eu sala={sala} v={v} agora={agora} eu={eu} tag={tag} enviar={enviar} />}
    </div>
  );
}
