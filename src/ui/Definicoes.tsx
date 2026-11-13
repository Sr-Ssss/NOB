import { Capacitor } from '@capacitor/core';
import { useState } from 'preact/hooks';
import { t } from '../core/i18n';
import type { Idioma } from '../core/sala';

export const VERSAO = '0.1.0';
const CHAVE_DEV = 'nob.dev';

function lerDev(): boolean {
  try {
    return import.meta.env.DEV || localStorage.getItem(CHAVE_DEV) === '1';
  } catch {
    return import.meta.env.DEV;
  }
}

/** Definições da app. Tocar 7× na versão liga o modo dev (mostra "NPN (teste)" no Android). */
export function Definicoes({ idioma, mudar }: { idioma: Idioma; mudar: (i: Idioma) => void }) {
  const [dev, setDev] = useState(lerDev);
  const [toques, setToques] = useState(0);

  const tocarVersao = () => {
    const n = toques + 1;
    setToques(n);
    if (n >= 7 && !dev) {
      localStorage.setItem(CHAVE_DEV, '1');
      setDev(true);
    }
  };

  return (
    <div class="pag">
      <div class="topo">
        <a href="#/" class="chip">←</a>
        <b>{t('definicoes')}</b>
        <span />
      </div>
      <div class="cartao">
        <label>{t('idioma')}</label>
        <div class="opcoes">
          {(['pt-BR', 'en'] as const).map((i) => (
            <button key={i} class={'opcao' + (idioma === i ? ' on' : '')} onClick={() => mudar(i)}>
              {i === 'pt-BR' ? 'Português' : 'English'}
            </button>
          ))}
        </div>
      </div>
      {dev && Capacitor.getPlatform() === 'android' && (
        <a href="#/npn" class="botao sec centro" style={{ textDecoration: 'none' }}>
          📡 NPN (teste)
        </a>
      )}
      <p class="centro mini" onClick={tocarVersao} style={{ userSelect: 'none' }}>
        NOB {VERSAO}
        {dev ? ' · dev' : ''}
      </p>
    </div>
  );
}
