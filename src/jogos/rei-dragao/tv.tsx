import { t, type Chave } from '../../core/i18n';
import { PodioEscada } from '../../ui/podio';
import { nomeDe } from '../5050/tv';
import { Castelos, PAREDE, narracao, nomeEquipa, type PropsRei } from './comuns';

export function TvRei({ sala, v, agora, selFim = 0, onOutraVez, onMenu }: PropsRei & { selFim?: number; onOutraVez: () => void; onMenu: () => void }) {
  const fim = v.fase === 'fim';
  /* no fim, o meio (entre os estandartes) tem a meia-noite, quem ganhou, o pódio e os botões: cabe tudo num ecrã */
  const meio = fim ? (
    <div class="rd-meio-fim">
      <h1 class="rd-meianoite">{t('rdMeiaNoite')}</h1>
      {v.vencedor && <div class={'rd-placa ' + v.vencedor}>{t(('rdVence_' + v.vencedor) as Chave)}</div>}
      {(v.aposta || v.apontado) && (
        <p class="rd-extra">
          {v.aposta && t('rdApostou', { eq: nomeEquipa(v.aposta) })} {v.apontado && t('rdApontou', { nome: nomeDe(sala, v.apontado) })}
        </p>
      )}
      <PodioEscada sala={sala} podio={v.podio} tv />
      <div class="linha">
        <button class={'botao' + (selFim === 0 ? ' foco' : '')} onClick={onOutraVez}>
          {t('jogarOutraVez')}
        </button>
        <button class={'botao sec' + (selFim === 1 ? ' foco' : '')} onClick={onMenu}>
          {t('menu')}
        </button>
      </div>
    </div>
  ) : undefined;
  return (
    <div class={'pag tv jogo-rei fase-' + v.fase} style={{ backgroundImage: PAREDE() }}>
      <div class="topo">
        <span>{t('rdNome')}</span>
        <span>{fim ? t('rdMeiaNoite') : t('rdRonda', { r: v.ronda, t: v.rondas })}</span>
      </div>
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}
      {!fim && <h1 class="rd-narra">{narracao(sala, v)}</h1>}
      <Castelos sala={sala} v={v} agora={agora} meio={meio} />
    </div>
  );
}
