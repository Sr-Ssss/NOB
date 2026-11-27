import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';

/**
 * no telemóvel, o que não cabe no ecrã (ex.: a revelação que a TV mostraria, sem TV) fica atrás de um botão
 * e abre num popup por cima; toque fora (ou no popup) para fechar. Assim nenhum ecrã precisa de scroll.
 */
export function BotaoPopup({ rotulo, aria, children }: { rotulo: ComponentChildren; aria?: string; children: ComponentChildren }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button class="botao sec" aria-label={aria} onClick={() => setAberto(true)}>
        {rotulo}
      </button>
      {aberto && (
        <div class="popup" onClick={() => setAberto(false)}>
          <div class="cartao popup-ver">{children}</div>
        </div>
      )}
    </>
  );
}
