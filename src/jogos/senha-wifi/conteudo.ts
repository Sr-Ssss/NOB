import { conteudoDe } from '../../core/conteudo';
import type { Palavra } from './regras';

/** palavras de `conteudo/senha-do-wifi.json` (tags = tema) */
export function palavrasWifi(): Palavra[] {
  return conteudoDe('senha-do-wifi').map(({ id, pt, en, tags }) => ({ id, pt, en, tags }));
}

export function temasWifi(): string[] {
  return [...new Set(palavrasWifi().flatMap((p) => p.tags ?? []))];
}
