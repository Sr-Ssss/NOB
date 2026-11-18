import { useEffect } from 'preact/hooks';
import { t } from '../../core/i18n';
import { Palco, PlacarPirata, Revelacao, Topo, narracao, type PropsPirata } from './comuns';

/** voz (speechSynthesis) pt-BR/en, se existir; só textos neutros (nunca papéis secretos) */
function falar(texto: string, idioma: string) {
  try {
    if (!texto || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ''));
    u.lang = idioma;
    speechSynthesis.speak(u);
  } catch {
    /* sem voz */
  }
}

export function TvPirata({ sala, v, agora, selFim = 0, onOutraVez, onMenu }: PropsPirata & { selFim?: number; onOutraVez: () => void; onMenu: () => void }) {
  const txt = narracao(sala, v);
  useEffect(() => falar(txt, sala.idioma), [txt, v.fase, v.noite]);
  return (
    <div class={'pag tv jogo-pirata fase-' + v.fase}>
      <Topo v={v} agora={agora} />
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}
      {v.fase !== 'fim' ? (
        <Palco sala={sala} v={v} />
      ) : (
        <>
          <div class="pr-fim">
            <Revelacao sala={sala} v={v} />
            <div class="cartao">
              <PlacarPirata sala={sala} v={v} tam={56} />
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
