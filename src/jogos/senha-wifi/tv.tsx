import type { VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Estado } from '../5050/tv';
import { Cripto, Fichas, PlacarWifi, Resultado, Router, Tempo, faseTexto, nomeEquipa, rondaTexto } from './comuns';
import { LADOS, textoPalavra, type Lado, type VistaWifi } from './regras';

export interface PropsWifi {
  sala: VistaSala;
  v: VistaWifi;
  agora: () => number;
}

/** metade de uma equipa: fichas + router com os post-its */
export function Metade({ v, l }: { v: VistaWifi; l: Lado }) {
  const r = v.revelacao?.lado === l ? v.revelacao : null;
  return (
    <section class="wifi-metade">
      <div class="wifi-metade-cab">
        <span>{nomeEquipa(l)}</span>
        <Fichas f={v.fichas[l]} />
      </div>
      <Router lado={l} historico={v.historico[l]} acesas={r?.codigo} novo={r ? v.ronda : undefined} />
    </section>
  );
}

/**
 * os 2 routers + centro (TV e Painel sem TV).
 * No telemóvel (`tel`) não repete o que o topo já diz (ronda, tempo, fase); com `semRes`, nem o resultado/"Confirmaram" que a parte do jogador mostra.
 */
export function Palco({ sala, v, agora, tel = false, semRes = false }: PropsWifi & { tel?: boolean; semRes?: boolean }) {
  return (
    <div class="wifi-palco">
      <Metade v={v} l="b" />
      <div class="wifi-centro">
        {!tel && (
          <>
            <div class="wifi-ronda">{t('swRonda')} {rondaTexto(v)}</div>
            <Tempo v={v} agora={agora} />
            {faseTexto(v) && <div class="wifi-fase">{faseTexto(v)}</div>}
          </>
        )}
        {v.fase === 'revelar' ? (
          !semRes && <Resultado v={v} />
        ) : (
          <>
            <div class="mini">{t('swCriptografos')}</div>
            {LADOS.map((l) => (
              <Cripto key={l} sala={sala} v={v} l={l} />
            ))}
          </>
        )}
        {v.fase === 'responder' && !semRes && (
          <div class="wifi-res">
            {t('swConfirmaram', { n: v.resposta.confirmados.length, t: v.precisa })}
          </div>
        )}
      </div>
      <Metade v={v} l="p" />
    </div>
  );
}

function Equipas({ sala, v, prontos }: { sala: VistaSala; v: VistaWifi; prontos?: boolean }) {
  return (
    <div class="wifi-dois">
      {LADOS.map((l) => (
        <div key={l} class="cartao">
          <h2>{nomeEquipa(l)}</h2>
          <Estado sala={sala} ids={v.equipas[l]} feitos={prontos ? v.prontos : v.equipas[l]} tam={72} />
        </div>
      ))}
    </div>
  );
}

export function TvWifi({ sala, v, agora, selFim = 0, onOutraVez, onMenu }: PropsWifi & { selFim?: number; onOutraVez: () => void; onMenu: () => void }) {
  return (
    <div class="pag tv jogo-wifi">
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}
      {v.fase === 'equipas' && (
        <>
          <h1 class="pergunta">{t('swLiderMonta')}</h1>
          <Equipas sala={sala} v={v} />
        </>
      )}
      {v.fase === 'palavras' && (
        <>
          <div class="topo">
            <span>{t('swOpcoesNome')}</span>
            <Tempo v={v} agora={agora} />
          </div>
          <h1 class="pergunta">{t('swPalavrasTitulo')}</h1>
          <Equipas sala={sala} v={v} prontos />
        </>
      )}
      {(v.fase === 'pistas' || v.fase === 'responder' || v.fase === 'revelar') && <Palco sala={sala} v={v} agora={agora} />}
      {v.fase === 'fim' && (
        <>
          <h1 class="pergunta">{v.vencedor ? t('swGanharam', { eq: nomeEquipa(v.vencedor) }) : t('fim')}</h1>
          {/* palavras e placar lado a lado: cabe tudo num ecrã (fase 3) */}
          <div class="wifi-fim">
          <div class="wifi-dois">
            {LADOS.map((l) => (
              <div key={l} class="cartao">
                <div class="wifi-metade-cab">
                  <span>{nomeEquipa(l)}</span>
                  <Fichas f={v.fichas[l]} />
                </div>
                <div class="minhas" style={{ marginTop: 10 }}>
                  {(v.palavrasFim?.[l] ?? []).map((w, i) => (
                    <div key={w.id} class="postit">
                      <b>{i + 1}</b> {textoPalavra(w, sala.idioma)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div class="cartao">
            <PlacarWifi sala={sala} v={v} tam={64} />
          </div>
          </div>
          <div class="linha">
            <button class={'botao' + (selFim === 0 ? ' foco' : '')} onClick={onOutraVez}>
              {t('jogarOutraVez')}
            </button>
            <button class={'botao sec' + (selFim === 1 ? ' foco' : '')} onClick={onMenu}>
              {t('menu')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
