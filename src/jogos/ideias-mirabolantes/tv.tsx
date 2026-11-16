import { t } from '../../core/i18n';
import { Palco, PlacarIdeias, Topo, type PropsIdeias } from './comuns';

export function TvIdeias({ sala, v, agora, selFim = 0, onOutraVez, onMenu }: PropsIdeias & { selFim?: number; onOutraVez: () => void; onMenu: () => void }) {
  return (
    <div class="pag tv jogo-ideias">
      <Topo v={v} agora={agora} />
      {v.restante !== null && <div class="aviso">{t('pausa')}</div>}
      {v.fase !== 'fim' ? (
        <Palco sala={sala} v={v} />
      ) : (
        <>
          <h1 class="pergunta">{t('fim')}</h1>
          <div class="cartao">
            <PlacarIdeias sala={sala} v={v} tam={64} />
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
