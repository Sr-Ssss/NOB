const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sem I/O

export function codigoSala(rnd: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 4; i++) s += LETRAS[Math.floor(rnd() * LETRAS.length)];
  return s;
}

export function idAleatorio(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

/** parâmetros depois de `#/rota?` */
export function paramsHash(): URLSearchParams {
  return new URLSearchParams(location.hash.split('?')[1] ?? '');
}

/** id do jogador guardado no dispositivo; `?eu=2` permite vários jogadores em separadores (testes). */
export function meuId(): string {
  const chave = 'nob.id' + (paramsHash().get('eu') ?? '');
  let id = localStorage.getItem(chave);
  if (!id) {
    id = idAleatorio();
    localStorage.setItem(chave, id);
  }
  return id;
}

/** baralha de forma determinística (seed numérica) */
export function baralhar<T>(lista: T[], seed: number): T[] {
  const a = [...lista];
  let s = seed >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
