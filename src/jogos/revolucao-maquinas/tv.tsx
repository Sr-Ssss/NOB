import { t } from '../../core/i18n';
import { Temporizador } from '../../ui/comuns';
import { Consola, PlacarMaquinas, type PropsMaquinas } from './comuns';

export function TvMaquinas({ sala, v, agora, selFim = 0, onOutraVez, onMenu }: PropsMaquinas & { selFim?: number; onOutraVez: () => void; onMenu: () => void }) {
  const fim = v.fase === 'fim';
  return (
    <div class={'pag tv jogo-maquinas fase-' + v.fase}>
      <div class="topo">
        <span>{t('rmNome')}</span>
        {!fim && v.fase !== 'carta' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
      </div>
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}
      {fim && <div class="rm-nave">🚀</div>}
      <div class={fim ? 'rm-fim' : ''}>
        <Consola sala={sala} v={v} compacto={fim} />
        {fim && (
          <div class="cartao">
            <PlacarMaquinas sala={sala} v={v} tam={48} />
          </div>
        )}
      </div>
      {fim && (
        <div class="linha">
          <button class={'botao' + (selFim === 0 ? ' foco' : '')} onClick={onOutraVez}>
            {t('jogarOutraVez')}
          </button>
          <button class={'botao sec' + (selFim === 1 ? ' foco' : '')} onClick={onMenu}>
            {t('menu')}
          </button>
        </div>
      )}
    </div>
  );
}
