import { t } from '../core/i18n';

/** popup "tens a certeza?" da app (em vez do `confirm()` nativo: feio e com botões por traduzir) */
export function Confirmar({ texto, sim, aoSim, fechar }: { texto: string; sim?: string; aoSim: () => void; fechar: () => void }) {
  return (
    <div class="popup" onClick={fechar}>
      <div class="cartao centro" role="alertdialog" aria-modal="true" aria-label={texto} onClick={(e) => e.stopPropagation()}>
        <p style={{ fontSize: 20, margin: '8px 0 16px' }}>{texto}</p>
        <button
          class="botao"
          style={{ width: '100%' }}
          onClick={() => {
            aoSim();
            fechar();
          }}
        >
          {sim ?? t('sim')}
        </button>
        <button class="botao sec" style={{ width: '100%', marginTop: 8 }} onClick={fechar} autoFocus>
          {t('cancelar')}
        </button>
      </div>
    </div>
  );
}
