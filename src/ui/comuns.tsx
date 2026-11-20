import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../core/i18n';
import type { Jogador } from '../core/sala';
import { Boneco18 } from './bonecos';

export const CORAL = '#F0997B';
/** cores do 50/50: SIM vermelho, NÃO azul */
export const COR_SIM = '#E5484D';
export const COR_NAO = '#3E63DD';

/** boneco da party (um dos 18) */
export function Avatar({ n, tam = 64 }: { n: number; tam?: number }) {
  return <Boneco18 n={n} tam={tam} />;
}

/** à espera que alguém responda: balão de pensamento com 3 pontinhos (estilo WhatsApp; em vez de ✗/❌, que parecia um "não") */
export function Pensando() {
  return (
    <span class="pensando" role="img" aria-label={t('aPensar')}>
      <i />
      <i />
      <i />
    </span>
  );
}

/** ✅ se já está feito, senão o balão de pensamento */
export function Feito({ ok }: { ok: boolean }) {
  return ok ? <>✅</> : <Pensando />;
}

export function Boneco({ j, marca, tam }: { j: Pick<Jogador, 'nome' | 'avatar' | 'ligado'>; marca?: ComponentChildren; tam?: number }) {
  return (
    <div class={'boneco' + (j.ligado ? '' : ' off')}>
      {marca && <span class="marca">{marca}</span>}
      <Avatar n={j.avatar} tam={tam} />
      <span>{j.nome}</span>
    </div>
  );
}

/** segundos que faltam; `restante` (ms) quando pausado */
/** barra amarela→laranja que enche um botão "segurar para ver" em `ms` (o botão leva `position` e `overflow: hidden`; o texto vai num `.rotulo-segurar`) */
export function BarraSegurar({ ms }: { ms: number }) {
  return <span class="barra-segurar" style={{ animationDuration: ms + 'ms' }} aria-hidden="true" />;
}

export function Temporizador({ terminaEm, restante, agora }: { terminaEm: number; restante: number | null; agora: () => number }) {
  const [, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), 250);
    return () => clearInterval(i);
  }, []);
  const ms = restante ?? Math.max(0, terminaEm - agora());
  const s = Math.ceil(ms / 1000);
  return <span class={'tempo' + (s <= 5 ? ' pouco' : '')}>{restante !== null ? '⏸' : s}</span>;
}
