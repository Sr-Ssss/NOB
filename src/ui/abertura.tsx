import { useEffect, useState } from 'preact/hooks';
import { t } from '../core/i18n';
import { CATALOGO, nome } from '../core/jogos';
import { T_CARREGAR, T_TUTORIAL, type Abertura, type Idioma } from '../core/sala';
import { COM_ECRAS } from '../jogos/ecras';

/**
 * Abertura de cada jogo (pedido de 20/11), em todos os ecrãs:
 * 1. nome do jogo + barra de 5 s, enquanto se pré-carrega o que o jogo usa;
 * 2. o tutorial, se o líder o pediu: com TV só passa na TV (os telemóveis dizem "olhem para a TV"); sem TV, em todos.
 */

/** volta a desenhar a cada `ms` (barra e segundos) */
function useRelogio(ms: number) {
  const [, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
}

/** fontes e o que o jogo declarar (`precarregar` em src/jogos/ecras.tsx); falhas não param a abertura */
function precarregar(jogo: string) {
  try {
    void document.fonts?.ready;
    void Promise.resolve(COM_ECRAS.find((x) => x.id === jogo)?.e.precarregar?.()).catch(() => {});
  } catch {
    /* sem fontes / falhou: o jogo carrega quando precisar */
  }
}

type Props = {
  ab: Abertura;
  idioma: Idioma;
  agora: () => number;
  /** null = não pode saltar */
  saltar: (() => void) | null;
  /** há TV e este ecrã é um telemóvel: o tutorial passa só na TV */
  soNaTv?: boolean;
  tv?: boolean;
};

export function EcraAbertura({ ab, idioma, agora, saltar, soNaTv, tv }: Props) {
  useRelogio(100);
  useEffect(() => precarregar(ab.jogo), [ab.jogo]);
  const j = CATALOGO.find((x) => x.id === ab.jogo);
  const falta = Math.max(0, ab.ate - agora());
  const carregar = ab.fase === 'carregar';
  const titulo = <h1 class="abertura-nome">{j ? nome(j, idioma) : ''}</h1>;
  if (carregar) {
    const feito = Math.min(100, Math.max(0, 100 - (falta / T_CARREGAR) * 100));
    return (
      <div class={'pag centro abertura' + (tv ? ' tv' : '')}>
        {titulo}
        <div class="barra-abertura" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(feito)} aria-label={t('abCarregar')}>
          <div style={{ width: `${feito}%` }} />
        </div>
        <p class="mini">{ab.ver ? t('abDepoisTutorial') : t('abCarregar')}</p>
        {saltar && ab.ver && (
          <button class="botao sec" onClick={saltar}>
            {t('abSaltarTutorial')}
          </button>
        )}
      </div>
    );
  }
  const seg = Math.ceil(falta / 1000);
  return (
    <div class={'pag centro abertura' + (tv ? ' tv' : '')}>
      {titulo}
      {soNaTv ? (
        <p class="olhar-tv">📺 {t('abOlhemTv')}</p>
      ) : (
        <div class="video">
          <span>▶ {t('tutorialEmBreve')}</span>
        </div>
      )}
      <p class="tempo">{Math.min(seg, Math.ceil(T_TUTORIAL / 1000))}</p>
      {saltar && (
        <button class="botao sec" onClick={saltar}>
          {t('saltar')}
          {tv ? ' · OK' : ''}
        </button>
      )}
    </div>
  );
}
