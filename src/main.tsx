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
import { CODIGO_VALIDO, paramsHash } from './core/ids';
import { PalcoTv } from './ui/palco';
import { manterEcraLigado } from './ui/ecraLigado';
import { comecarAPiscar } from './ui/piscar';
import type { JSX } from 'preact';
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
import { DemoSemJuizo } from './jogos/semjuizo/demo';
import { DemoRagerob } from './jogos/ragerob/demo';
import { DemoDuelo } from './jogos/duelo-rabiscos/demo';
import { Definicoes } from './ui/Definicoes';
import { Montra } from './montra/Montra';
import { NpnTeste } from './npn/Npn';
import { Avatar } from './ui/comuns';
import { CHAVE_AVISO } from './core/ligacao';

function rota(): string {
  return location.hash.replace(/^#/, '').split('?')[0] || '/';
}

/** aviso deixado para o ecrã inicial (ex.: esta TV foi substituída por outra); lê-se uma vez */
function tirarAviso(): string {
  try {
    const a = sessionStorage.getItem(CHAVE_AVISO) ?? '';
    sessionStorage.removeItem(CHAVE_AVISO);
    return a;
  } catch {
    return '';
  }
}

/** Ecrã inicial do telemóvel (B, "código em destaque"); 20/11: ⚙️ no canto, "Criar party" cria logo (a TV escolhe-se no lobby) */
function Inicio() {
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState(() => (tirarAviso() === 'avisoOutraTv' ? t('avisoOutraTv') : ''));
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
      <div class="topo">
        <a class="botao-icone" href="#/definicoes" aria-label={t('definicoes')} title={t('definicoes')}>
          ⚙️
        </a>
        <button class="botao-icone livro" onClick={emBreve} aria-label={t('comoJogar')} title={t('comoJogar')}>
          📖<span aria-hidden="true">?</span>
        </button>
      </div>
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

      <a href="#/criar" class="botao sec centro" style={{ textDecoration: 'none' }}>
        {t('criarParty')}
      </a>

      {aviso && (
        <div class="aviso" role="status">
          {aviso}
        </div>
      )}

      <nav class="rodape-inicio">
        <button class="link" onClick={emBreve}>
          🕘 {t('historico')}
        </button>
      </nav>
    </div>
  );
}

/** só em dev: `#/demo-<jogo>?fase=…&ecra=tv|tel` (capturas e testes Playwright) */
const DEMOS: Record<string, () => JSX.Element> = {
  '/demo-pensa': DemoPensa,
  '/demo-wifi': DemoWifi,
  '/demo-sevira': DemoSevira,
  '/demo-mona': DemoMona,
  '/demo-ideias': DemoIdeias,
  '/demo-pirata': DemoPirata,
  '/demo-maquinas': DemoMaquinas,
  '/demo-rei': DemoRei,
  '/demo-semjuizo': DemoSemJuizo,
  '/demo-ragerob': DemoRagerob,
  '/demo-duelo': DemoDuelo,
};

function App() {
  const [r, setR] = useState(rota());
  useEffect(() => manterEcraLigado(), []);
  useEffect(() => comecarAPiscar(), []);
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
  if (import.meta.env.DEV && r === '/montra') return <Montra />;
  if (import.meta.env.DEV && r.startsWith('/demo-')) {
    const Demo = DEMOS[r];
    if (!Demo) return <Inicio />;
    // as demos de TV (ecra≠tel) passam pelo mesmo palco que a TV a sério
    return paramsHash().get('ecra') === 'tel' ? <Demo /> : <PalcoTv><Demo /></PalcoTv>;
  }
  if (r === '/definicoes') return <Definicoes idioma={idioma} mudar={mudar} />;
  if (r === '/npn') return <NpnTeste />;
  return <Inicio />;
}

aplicarTextoGrande(); // Definições → Acessibilidade
render(<App />, document.getElementById('app')!);
