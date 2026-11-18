import { Capacitor } from '@capacitor/core';
import { useState } from 'preact/hooks';
import { t } from '../core/i18n';
import type { Idioma } from '../core/sala';
import { mudarTextoGrande, mudarTocarParaMostrar, textoGrande, tocarParaMostrar } from './acessibilidade';

/** vem da `version` do package.json (vite.config.ts → define) */
declare const __VERSAO__: string;
export const VERSAO = __VERSAO__;
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
  const [tocar, setTocar] = useState(tocarParaMostrar);
  const [grande, setGrande] = useState(textoGrande);
  const simNao = (on: boolean, mudar: (x: boolean) => void) => (
    <div class="opcoes">
      <button class={'opcao' + (on ? ' on' : '')} aria-pressed={on} onClick={() => mudar(true)}>
        {t('sim')}
      </button>
      <button class={'opcao' + (!on ? ' on' : '')} aria-pressed={!on} onClick={() => mudar(false)}>
        {t('nao')}
      </button>
    </div>
  );

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
      <div class="cartao">
        <h3 style={{ margin: '0 0 8px' }}>{t('a11yTitulo')}</h3>
        <label>{t('a11yTocar')}</label>
        <p class="mini" style={{ margin: '2px 0 6px' }}>{t('a11yTocarDica')}</p>
        {simNao(tocar, (x) => (mudarTocarParaMostrar(x), setTocar(x)))}
        <label style={{ marginTop: 12, display: 'block' }}>{t('a11yGrande')}</label>
        {simNao(grande, (x) => (mudarTextoGrande(x), setGrande(x)))}
      </div>
      <a href="./privacidade.html" class="botao sec centro" style={{ textDecoration: 'none' }}>
        🔒 {t('privacidade')}
      </a>
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
