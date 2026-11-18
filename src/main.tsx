import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
// fontes dentro da app (licença OFL): nada é pedido à Google (RGPD) e funciona sem rede
import '@fontsource/baloo-2/latin-500.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/baloo-2/latin-ext-500.css';
import '@fontsource/baloo-2/latin-ext-700.css';
import '@fontsource/baloo-2/latin-ext-800.css';
import '@fontsource/gochi-hand/latin-400.css';
import './ui/estilo.css';
import { aplicarTextoGrande } from './ui/acessibilidade';
import { Logo } from './ui/logo';
import { idiomaDispositivo, t, usarIdioma } from './core/i18n';
import type { Idioma } from './core/sala';
import { CODIGO_VALIDO } from './core/ids';
import { Tv } from './tv/Tv';
import { Jogar } from './jogar/Jogar';
import { Criar } from './jogar/Criar';
import { DemoPensa } from './jogos/pensa-dores/demo';
import { DemoWifi } from './jogos/senha-wifi/demo';
import { DemoSevira } from './jogos/se-vira/demo';
import { DemoMona } from './jogos/mona-lixa/demo';
import { DemoIdeias } from './jogos/ideias-mirabolantes/demo';
import { DemoPirata } from './jogos/pirata/demo';
import { DemoMaquinas } from './jogos/revolucao-maquinas/demo';
import { DemoRei } from './jogos/rei-dragao/demo';
import { DemoRagerob } from './jogos/ragerob/demo';
import { Definicoes } from './ui/Definicoes';
import { NpnTeste } from './npn/Npn';
import { Avatar } from './ui/comuns';

function rota(): string {
  return location.hash.replace(/^#/, '').split('?')[0] || '/';
}

/** Ecrã inicial do telemóvel (B, "código em destaque") */
function Inicio() {
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState('');
  const [criar, setCriar] = useState(false);
  const ok = CODIGO_VALIDO.test(codigo);
  const entrar = () => {
    if (ok) location.hash = `#/jogar?sala=${codigo}`;
  };
  const emBreve = () => {
    setAviso(t('emBreveAviso'));
    setTimeout(() => setAviso(''), 1800);
  };
  return (
    <div class="pag inicio">
      <div class="logo-nob">
        <div class="bonecos-logo">
          <Avatar n={0} tam={54} />
          <Avatar n={3} tam={54} />
          <Avatar n={17} tam={54} />
        </div>
        <Logo />
        <small>{t('slogan')}</small>
      </div>

      <form
        class="cartao"
        onSubmit={(e) => {
          e.preventDefault();
          entrar();
        }}
      >
        <label for="codigo">{t('codigoParty')}</label>
        <input
          id="codigo"
          class="codigo"
          value={codigo}
          maxLength={6}
          autoCapitalize="characters"
          autoComplete="off"
          inputMode="text"
          placeholder="ABCDE"
          onInput={(e) => setCodigo(e.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        />
        <button class="botao grande" style={{ width: '100%', marginTop: 12 }} disabled={!ok} type="submit">
          {t('entrar')}
        </button>
      </form>

      <div class="ou">{t('ou')}</div>

      {!criar ? (
        <button class="botao sec centro" onClick={() => setCriar(true)}>
          {t('criarParty')}
        </button>
      ) : (
        <div class="linha">
          <a href="#/tv" class="botao sec centro cresce" style={{ textDecoration: 'none' }}>
            📺 {t('tenhoTv')}
            <div class="mini" style={{ fontWeight: 600 }}>{t('tenhoTvDica')}</div>
          </a>
          <a href="#/criar" class="botao sec centro cresce" style={{ textDecoration: 'none' }}>
            📱 {t('semTv')}
            <div class="mini" style={{ fontWeight: 600 }}>{t('semTvDica')}</div>
          </a>
        </div>
      )}

      {aviso && <div class="aviso">{aviso}</div>}

      <nav class="rodape-inicio">
        <button class="link" onClick={emBreve}>
          🕘 {t('historico')}
        </button>
        <button class="link" onClick={emBreve}>
          ❓ {t('comoJogar')}
        </button>
        <a class="link" href="#/definicoes">
          ⚙️ {t('definicoes')}
        </a>
      </nav>
    </div>
  );
}

function App() {
  const [r, setR] = useState(rota());
  const [idioma, setIdioma] = useState<Idioma>(idiomaDispositivo());
  useEffect(() => {
    const f = () => setR(rota());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  usarIdioma(idioma);
  const mudar = (i: Idioma) => {
    localStorage.setItem('nob.idioma', i);
    setIdioma(i);
  };
  if (r === '/tv') return <Tv idioma={idioma} />;
  if (r === '/jogar') return <Jogar />;
  if (r === '/criar') return <Criar />;
  if (import.meta.env.DEV && r === '/demo-pensa') return <DemoPensa />;
  if (import.meta.env.DEV && r === '/demo-wifi') return <DemoWifi />;
  if (import.meta.env.DEV && r === '/demo-sevira') return <DemoSevira />;
  if (import.meta.env.DEV && r === '/demo-mona') return <DemoMona />;
  if (import.meta.env.DEV && r === '/demo-ideias') return <DemoIdeias />;
  if (import.meta.env.DEV && r === '/demo-pirata') return <DemoPirata />;
  if (import.meta.env.DEV && r === '/demo-maquinas') return <DemoMaquinas />;
  if (import.meta.env.DEV && r === '/demo-rei') return <DemoRei />;
  if (import.meta.env.DEV && r === '/demo-ragerob') return <DemoRagerob />;
  if (r === '/definicoes') return <Definicoes idioma={idioma} mudar={mudar} />;
  if (r === '/npn') return <NpnTeste />;
  return <Inicio />;
}

aplicarTextoGrande(); // Definições → Acessibilidade
render(<App />, document.getElementById('app')!);
