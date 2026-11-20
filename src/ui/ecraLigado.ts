/**
 * Ecrã sempre ligado (fase 3, 20/11), na TV e nos telemóveis, enquanto a app está aberta.
 * - Browser: Screen Wake Lock API. O sistema solta o pedido quando a app vai para segundo plano,
 *   por isso volta-se a pedir quando ela volta (`visibilitychange`).
 * - APK: `FLAG_KEEP_SCREEN_ON` em `MainActivity.java` (a WebView do Android não tem Wake Lock).
 * Sem suporte ou recusado (bateria fraca, iOS antigo): não faz nada.
 */
type Sentinela = { released: boolean; release: () => Promise<void> };
type ComWakeLock = { wakeLock?: { request: (tipo: 'screen') => Promise<Sentinela> } };

export function manterEcraLigado(nav: ComWakeLock = navigator as unknown as ComWakeLock, doc: Document = document): () => void {
  let atual: Sentinela | null = null;
  let parado = false;
  const pedir = async () => {
    if (parado || !nav.wakeLock || doc.visibilityState !== 'visible' || (atual && !atual.released)) return;
    try {
      atual = await nav.wakeLock.request('screen');
      if (parado) void atual.release();
    } catch {
      /* recusado: tenta outra vez na próxima volta ao primeiro plano */
    }
  };
  const f = () => void pedir();
  doc.addEventListener('visibilitychange', f);
  void pedir();
  return () => {
    parado = true;
    doc.removeEventListener('visibilitychange', f);
    void atual?.release().catch(() => {});
  };
}
