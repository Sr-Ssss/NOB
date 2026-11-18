/**
 * Acessibilidade (info/auditoria/2026-11-17.md → A1–A5). Preferências por aparelho, em Definições:
 * - "tocar para mostrar": os botões de segurar (Identidade, Mostrar carta…) passam a abrir com um toque
 *   e a fechar com outro (para quem não consegue segurar 3 s);
 * - "texto grande": aumenta a app toda.
 * Os botões de segurar também funcionam com o teclado (Espaço/Enter seguro).
 */

import type { Chave } from '../core/i18n';

const CHAVE_TOCAR ='nob.a11y.tocar';
const CHAVE_GRANDE = 'nob.a11y.grande';

function ler(chave: string): boolean {
  try {
    return localStorage.getItem(chave) === '1';
  } catch {
    return false;
  }
}

function gravar(chave: string, on: boolean) {
  try {
    if (on) localStorage.setItem(chave, '1');
    else localStorage.removeItem(chave);
  } catch {
    /* sem armazenamento: só dura esta página */
  }
}

export const tocarParaMostrar = (): boolean => ler(CHAVE_TOCAR);
export const mudarTocarParaMostrar = (on: boolean) => gravar(CHAVE_TOCAR, on);

/** chaves de texto "Segure…" que têm irmã `…Tocar` ("Toque…") */
export type ChaveSegurar = { [K in Chave]: `${K}Tocar` extends Chave ? K : never }[Chave];
/** escolhe o texto "Segure…" ou "Toque…" conforme o modo "tocar para mostrar" */
export const chaveSegurar = (c: ChaveSegurar): Chave => (tocarParaMostrar() ? (`${c}Tocar` as Chave) : c);

export const textoGrande = (): boolean => ler(CHAVE_GRANDE);
export function mudarTextoGrande(on: boolean) {
  gravar(CHAVE_GRANDE, on);
  aplicarTextoGrande();
}
/** põe/tira a classe `texto-grande` no <html> (chamar ao arrancar) */
export function aplicarTextoGrande() {
  try {
    document.documentElement.classList.toggle('texto-grande', textoGrande());
  } catch {
    /* fora do browser (testes) */
  }
}

const tecla = (e: KeyboardEvent) => e.key === ' ' || e.key === 'Enter';

/**
 * Eventos de um botão "segurar para ver":
 * - normal: segurar (dedo, rato ou Espaço/Enter) inicia; largar fecha;
 * - "tocar para mostrar": um toque mostra logo, outro fecha.
 */
export function eventosSegurar(o: { segurar: (e: Event) => void; largar: () => void; mostrar: () => void; aberto: boolean }) {
  if (tocarParaMostrar()) {
    return {
      onClick: () => (o.aberto ? o.largar() : o.mostrar()),
      'aria-pressed': o.aberto,
    };
  }
  return {
    onPointerDown: o.segurar,
    onPointerUp: o.largar,
    onPointerLeave: o.largar,
    onPointerCancel: o.largar,
    onContextMenu: (e: Event) => e.preventDefault(),
    onKeyDown: (e: KeyboardEvent) => {
      if (tecla(e) && !e.repeat) o.segurar(e);
    },
    onKeyUp: (e: KeyboardEvent) => {
      if (tecla(e)) o.largar();
    },
  };
}
