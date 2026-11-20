import { t } from '../../core/i18n';
import { nomeDe } from '../5050/tv';
import { Castelos, PlacarRei, narracao, nomeEquipa, type PropsRei } from './comuns';

export function TvRei({ sala, v, agora, selFim = 0, onOutraVez, onMenu }: PropsRei & { selFim?: number; onOutraVez: () => void; onMenu: () => void }) {
  const fim = v.fase === 'fim';
  return (
    <div class={'pag tv jogo-rei fase-' + v.fase}>
      <div class="topo">
        <span>{t('rdNome')}</span>
        <span>{fim ? t('rdMeiaNoite') : t('rdRonda', { r: v.ronda, t: v.rondas })}</span>
      </div>
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}
      <h1 class="rd-narra">{narracao(sala, v)}</h1>
      <div class={fim ? 'rd-tv-fim' : ''}>
        <Castelos sala={sala} v={v} agora={agora} />
      </div>
      {fim && (
        <>
          <p class="centro">
            {v.aposta && t('rdApostou', { eq: nomeEquipa(v.aposta) })} {v.apontado && t('rdApontou', { nome: nomeDe(sala, v.apontado) })}
          </p>
          {/* placar em 5 colunas: cabe tudo num ecrã (fase 3) */}
          <div class="cartao rd-placar-fim">
            <PlacarRei sala={sala} v={v} tam={44} />
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
