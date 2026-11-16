import { useEffect, useState } from 'preact/hooks';
import { useCliente, type Entrada } from '../core/ligacao';
import { usePrivados } from '../core/privado';
import { idAleatorio, meuId, paramsHash } from '../core/ids';
import { t, usarIdioma } from '../core/i18n';
import { MAX_NOME, N_AVATARES, PREFIXO_BOT, type AcaoSala, type Tecla, type VistaSala } from '../core/sala';
import { Avatar, Boneco } from '../ui/comuns';
import { Telemovel5050 } from '../jogos/5050/telemovel';
import { TelemovelPensa } from '../jogos/pensa-dores/telemovel';
import { DefinicoesPensa } from '../jogos/pensa-dores/definicoes';
import { TelemovelWifi } from '../jogos/senha-wifi/telemovel';
import { DefinicoesWifi } from '../jogos/senha-wifi/definicoes';
import { DEF_PADRAO_WIFI } from '../jogos/senha-wifi/regras';
import { TelemovelSevira } from '../jogos/se-vira/telemovel';
import { DefinicoesSevira } from '../jogos/se-vira/definicoes';
import { DEF_PADRAO_SEVIRA } from '../jogos/se-vira/regras';
import { TelemovelMona } from '../jogos/mona-lixa/telemovel';
import { DefinicoesMona } from '../jogos/mona-lixa/definicoes';
import { DEF_PADRAO_MONA } from '../jogos/mona-lixa/regras';
import { TelemovelIdeias } from '../jogos/ideias-mirabolantes/telemovel';
import { DefinicoesIdeias } from '../jogos/ideias-mirabolantes/definicoes';
import { DEF_PADRAO_IDEIAS } from '../jogos/ideias-mirabolantes/regras';
import { TelemovelPirata } from '../jogos/pirata/telemovel';
import { DefinicoesPirata } from '../jogos/pirata/definicoes';
import { DEF_PADRAO_PIRATA, type PrivadoPirata } from '../jogos/pirata/regras';
import { Definicoes } from '../tv/Tv';
import { MenuJogos, Tutorial } from './MenuJogos';

/** tags dos bots que este aparelho criou (o líder precisa delas para "és tu o autor") */
function tagsBots(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem('nob.bots') ?? '{}');
  } catch {
    return {};
  }
}

function novoBot(enviar: (a: AcaoSala) => void) {
  const bot = PREFIXO_BOT + idAleatorio();
  const tag = idAleatorio();
  try {
    sessionStorage.setItem('nob.bots', JSON.stringify({ ...tagsBots(), [bot]: tag }));
  } catch {
    /* sem armazenamento: só perde o "és tu o autor" do bot */
  }
  enviar({ tipo: 'bot_add', id: '', bot, tag });
}

const chaveEu = () => 'nob.eu' + (paramsHash().get('eu') ?? '');

function guardado(): { nome?: string; avatar?: number } {
  try {
    return JSON.parse(localStorage.getItem(chaveEu()) ?? '{}');
  } catch {
    return {};
  }
}

export function guardar(e: Entrada) {
  try {
    localStorage.setItem(chaveEu(), JSON.stringify({ nome: e.nome, avatar: e.avatar }));
  } catch {
    /* sem armazenamento */
  }
}

/** grelha 3×6 de bonecos; os já escolhidos na party ficam esbatidos */
function GrelhaBonecos({ escolhido, ocupados, aoEscolher }: { escolhido: number; ocupados: number[]; aoEscolher: (n: number) => void }) {
  return (
    <div class="grelha-bonecos">
      {Array.from({ length: N_AVATARES }, (_, i) => {
        const ocupado = ocupados.includes(i) && i !== escolhido;
        return (
          <button
            key={i}
            class={'escolha-boneco' + (escolhido === i ? ' on' : '')}
            disabled={ocupado}
            aria-pressed={escolhido === i}
            onClick={() => aoEscolher(i)}
          >
            <Avatar n={i} tam={64} />
          </button>
        );
      })}
    </div>
  );
}

/** Escolha do boneco (A, "grelha pronta") + nome + Entrar */
export function EscolherBoneco({ vista, eu, aoEntrar }: { vista: VistaSala; eu: string; aoEntrar: (e: Entrada) => void }) {
  const g = guardado();
  const ocupados = vista.jogadores.filter((j) => j.id !== eu).map((j) => j.avatar);
  const livre = (n: number | undefined) => (n !== undefined && !ocupados.includes(n) ? n : Array.from({ length: N_AVATARES }, (_, i) => i).find((i) => !ocupados.includes(i)) ?? 0);
  const [avatar, setAvatar] = useState(livre(g.avatar));
  const [nome, setNome] = useState(g.nome ?? '');
  const ok = nome.trim().length > 0;
  return (
    <div class="pag">
      <div class="topo">
        <a href="#/" class="chip">
          ← {t('voltar')}
        </a>
      </div>
      <h2 class="centro" style={{ margin: 0 }}>
        {t('escolherBoneco')}
      </h2>
      <GrelhaBonecos escolhido={avatar} ocupados={ocupados} aoEscolher={setAvatar} />
      <div>
        <label>{t('nome')}</label>
        <input value={nome} maxLength={MAX_NOME} onInput={(e) => setNome(e.currentTarget.value)} />
      </div>
      <button class="botao grande" disabled={!ok} onClick={() => aoEntrar({ nome: nome.trim(), avatar, tag: idAleatorio() })}>
        {t('entrar')}
      </button>
      <div class="rodape-codigo">{vista.codigo}</div>
    </div>
  );
}

const TECLAS: { tecla: Tecla; rotulo: string; area: string }[] = [
  { tecla: 'cima', rotulo: '▲', area: 'c' },
  { tecla: 'esq', rotulo: '◀', area: 'e' },
  { tecla: 'ok', rotulo: 'OK', area: 'o' },
  { tecla: 'dir', rotulo: '▶', area: 'd' },
  { tecla: 'baixo', rotulo: '▼', area: 'b' },
];

/** comando virtual da TV (só o líder) */
function Comando({ enviar, fechar, codigo }: { enviar: (a: AcaoSala) => void; fechar: () => void; codigo: string }) {
  const tecla = (k: Tecla) => {
    try {
      navigator.vibrate?.(15);
    } catch {
      /* sem vibração */
    }
    enviar({ tipo: 'comando', id: '', tecla: k });
  };
  return (
    <div class="pag">
      <div class="topo">
        <button class="chip" onClick={() => tecla('recarregar')}>
          ⟳ {t('recarregar')}
        </button>
        <button class="chip" onClick={fechar}>
          ✕ {t('sairComando')}
        </button>
      </div>
      <div class="comando">
        <div class="dpad">
          {TECLAS.map((k) => (
            <button key={k.tecla} class={'tecla' + (k.tecla === 'ok' ? ' ok' : '')} style={{ gridArea: k.area }} onClick={() => tecla(k.tecla)}>
              {k.rotulo}
            </button>
          ))}
        </div>
        <div class="linha" style={{ justifyContent: 'center' }}>
          <button class="tecla larga" onClick={() => tecla('voltar')}>
            ↩ {t('voltar')}
          </button>
          <button class="tecla larga" onClick={() => tecla('menu')}>
            ☰ {t('menu')}
          </button>
        </div>
      </div>
      <div class="rodape-codigo">{codigo}</div>
    </div>
  );
}

/** lobby do telemóvel: Sair, o meu boneco com lápis, nome editável, os outros, Pronto */
function Lobby({ vista, eu, entrada, mudar, enviar }: { vista: VistaSala; eu: string; entrada: Entrada; mudar: (e: Entrada) => void; enviar: (a: AcaoSala) => void }) {
  const [popup, setPopup] = useState(false);
  const [comando, setComando] = useState(false);
  const [menu, setMenu] = useState(false);
  const [nome, setNome] = useState(entrada.nome);
  const meu = vista.jogadores.find((j) => j.id === eu);
  const souLider = vista.vipId === eu;
  const lider = vista.jogadores.find((j) => j.id === vista.vipId);
  const outros = vista.jogadores.filter((j) => j.id !== eu);
  const tocar = (j: (typeof outros)[number]) => {
    if (j.bot) {
      if (confirm(t('botRemover', { nome: j.nome }))) enviar({ tipo: 'bot_del', id: '', bot: j.id });
    } else if (confirm(t('passarA', { nome: j.nome }))) enviar({ tipo: 'lideranca', id: '', para: j.id });
  };

  if (menu) return <MenuJogos vista={vista} enviar={enviar} fechar={() => setMenu(false)} />;
  if (comando) return <Comando enviar={enviar} fechar={() => setComando(false)} codigo={vista.codigo} />;

  const gravarNome = () => {
    const n = nome.trim();
    if (n && n !== entrada.nome) mudar({ ...entrada, nome: n });
    else setNome(meu?.nome ?? entrada.nome);
  };

  return (
    <div class="pag">
      <div class="topo">
        <a href="#/" class="chip">
          ← {t('sair')}
        </a>
        {souLider && <span class="chip on">👑 {t('vip')}</span>}
      </div>

      <div class="centro">
        <button class="meu-boneco" onClick={() => setPopup(true)} aria-label={t('escolherBoneco')}>
          <Avatar n={meu?.avatar ?? entrada.avatar} tam={150} />
          <span class="lapis">✏️</span>
        </button>
        <input
          class="nome-grande"
          value={nome}
          maxLength={MAX_NOME}
          onInput={(e) => setNome(e.currentTarget.value)}
          onBlur={gravarNome}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </div>

      <div class="fila-bonecos">
        {outros.map((j) => (
          <button
            key={j.id}
            class="escolha-boneco"
            disabled={!souLider || !j.ligado}
            onClick={() => tocar(j)}
          >
            <Boneco j={j} tam={52} marca={j.id === vista.vipId ? '👑' : j.bot ? '🤖' : j.pronto ? '✓' : undefined} />
          </button>
        ))}
      </div>
      {souLider && outros.length > 0 && <p class="centro mini">{t('passarLideranca')}</p>}
      {souLider && (
        <button class="botao sec" onClick={() => novoBot(enviar)}>
          🤖 {t('botMais')}
        </button>
      )}

      <button class={'botao grande' + (meu?.pronto ? ' sec' : '')} onClick={() => enviar({ tipo: 'pronto', id: '', pronto: !meu?.pronto })}>
        {meu?.pronto ? t('prontoOk') : t('pronto')}
      </button>

      {souLider && vista.semTv ? (
        <button class="botao sec" onClick={() => setMenu(true)}>
          🎲 {t('escolherJogo')}
        </button>
      ) : souLider ? (
        <>
          <button class="botao sec" onClick={() => setComando(true)}>
            🎮 {t('comandoTv')}
          </button>
          <details class="cartao">
            <summary style={{ fontWeight: 700 }}>{t('opcoesJogo')} · 50/50</summary>
            <Definicoes def={vista.def} mudar={(d) => enviar({ tipo: 'definir', id: '', def: d })} />
          </details>
          <details class="cartao">
            <summary style={{ fontWeight: 700 }}>{t('opcoesJogo')} · {t('pdOpcoesNome')}</summary>
            <DefinicoesPensa def={vista.defPensa} mudar={(d) => enviar({ tipo: 'definir_pensa', id: '', def: d })} />
          </details>
          <details class="cartao">
            <summary style={{ fontWeight: 700 }}>{t('opcoesJogo')} · {t('swOpcoesNome')}</summary>
            <DefinicoesWifi def={vista.defWifi ?? DEF_PADRAO_WIFI} idioma={vista.idioma} mudar={(d) => enviar({ tipo: 'definir_wifi', id: '', def: d })} />
          </details>
          <details class="cartao">
            <summary style={{ fontWeight: 700 }}>{t('opcoesJogo')} · {t('svOpcoesNome')}</summary>
            <DefinicoesSevira def={vista.defSevira ?? DEF_PADRAO_SEVIRA} n={vista.jogadores.filter((j) => j.ligado).length} mudar={(d) => enviar({ tipo: 'definir_sevira', id: '', def: d })} />
          </details>
          <details class="cartao">
            <summary style={{ fontWeight: 700 }}>{t('opcoesJogo')} · {t('mlOpcoesNome')}</summary>
            <DefinicoesMona def={vista.defMona ?? DEF_PADRAO_MONA} n={vista.jogadores.filter((j) => j.ligado).length} mudar={(d) => enviar({ tipo: 'definir_mona', id: '', def: d })} />
          </details>
          <details class="cartao">
            <summary style={{ fontWeight: 700 }}>{t('opcoesJogo')} · {t('imOpcoesNome')}</summary>
            <DefinicoesIdeias def={vista.defIdeias ?? DEF_PADRAO_IDEIAS} n={vista.jogadores.filter((j) => j.ligado).length} mudar={(d) => enviar({ tipo: 'definir_ideias', id: '', def: d })} />
          </details>
          <details class="cartao">
            <summary style={{ fontWeight: 700 }}>{t('opcoesJogo')} · {t('prNome')}</summary>
            <DefinicoesPirata def={vista.defPirata ?? DEF_PADRAO_PIRATA} n={vista.jogadores.filter((j) => j.ligado).length} mudar={(d) => enviar({ tipo: 'definir_pirata', id: '', def: d })} />
          </details>
        </>
      ) : (
        <p class="centro mini">{t('esperaVip', { nome: lider?.nome ?? '…' })}</p>
      )}

      {popup && (
        <div class="popup" onClick={() => setPopup(false)}>
          <div class="cartao" onClick={(e) => e.stopPropagation()}>
            <h3>{t('escolherBoneco')}</h3>
            <GrelhaBonecos
              escolhido={meu?.avatar ?? entrada.avatar}
              ocupados={outros.map((j) => j.avatar)}
              aoEscolher={(n) => {
                mudar({ ...entrada, avatar: n });
                setPopup(false);
              }}
            />
            <button class="botao sec" style={{ width: '100%', marginTop: 12 }} onClick={() => setPopup(false)}>
              {t('fechar')}
            </button>
          </div>
        </div>
      )}
      <div class="rodape-codigo">{vista.codigo}</div>
    </div>
  );
}

export function Jogar() {
  const codigo = (paramsHash().get('sala') ?? '').toUpperCase();
  const dispositivo = meuId();
  const [entrada, setEntrada] = useState<Entrada | null>(null);
  const { vista, estado, agoraTv, acao } = useCliente(codigo, dispositivo, entrada);
  const eu = vista?.aliases[dispositivo] ?? dispositivo;
  const dentro = vista?.jogadores.find((j) => j.id === eu);
  if (vista) usarIdioma(vista.idioma);
  // canal privado (papéis secretos): o meu e, se for o líder, o dos meus bots
  const souLider = !!vista && vista.vipId === eu;
  const tags: Record<string, string> = vista?.pirata && entrada ? { [eu]: entrada.tag, ...(souLider ? tagsBots() : {}) } : {};
  const privados = usePrivados(codigo, tags, vista?.pirata ? `${vista.pirata.fase}:${vista.pirata.noite}` : '');

  // já estava nesta party (recarregou a página): volta a entrar sozinho
  useEffect(() => {
    if (dentro && !entrada) setEntrada({ nome: dentro.nome, avatar: dentro.avatar, tag: idAleatorio() });
  }, [!!dentro]);

  const fase = vista?.pirata
    ? `r:${vista.pirata.fase}:${vista.pirata.noite}`
    : vista?.ideias
    ? `i:${vista.ideias.fase}:${vista.ideias.atual}`
    : vista?.mona
    ?`m:${vista.mona.fase}:${vista.mona.ronda}:${vista.mona.atual}`
    : vista?.sevira
    ? `s:${vista.sevira.fase}:${vista.sevira.atual}`
    : vista?.wifi
    ? `w:${vista.wifi.fase}:${vista.wifi.ronda}:${vista.wifi.turno}:${vista.wifi.passo}`
    : vista?.pensa
    ? `p:${vista.pensa.fase}:${vista.pensa.ronda}:${vista.pensa.atual}`
    : vista?.jogo ? `${vista.jogo.fase}:${vista.jogo.ronda}:${vista.jogo.dilema?.texto ?? ''}` : 'lobby';
  useEffect(() => {
    try {
      navigator.vibrate?.(60);
    } catch {
      /* sem vibração (iPhone) */
    }
  }, [fase]);

  const entrar = (e: Entrada) => {
    guardar(e);
    setEntrada(e);
  };

  if (!/^[A-Z0-9]{4}$/.test(codigo)) {
    location.hash = '#/';
    return null;
  }

  if (!vista) {
    const msg = estado === 'sem_sala' ? t('salaNaoEncontrada') : estado === 'erro' ? t('semLigacao') : t('aLigar');
    return (
      <div class="pag centro">
        <p style={{ marginTop: 80, fontSize: 24 }}>{msg}</p>
        {estado !== 'a_ligar' && (
          <a href="#/" class="botao sec" style={{ textDecoration: 'none' }}>
            ← {t('voltar')}
          </a>
        )}
      </div>
    );
  }

  if (!entrada || !dentro) {
    if (entrada && !dentro) return <div class="pag centro"><p style={{ marginTop: 80 }}>{t('aLigar')}</p></div>;
    return <EscolherBoneco vista={vista} eu={eu} aoEntrar={entrar} />;
  }

  return <EcraJogador vista={vista} eu={eu} entrada={entrada} mudar={entrar} enviar={acao} agora={agoraTv} privadoDe={(id) => privados[id] ?? null} />;
}

/** `privadoDe(id)`: o que só esse jogador recebe pelo canal privado (papéis secretos) */
type PropsEcra = { vista: VistaSala; eu: string; entrada: Entrada; mudar: (e: Entrada) => void; enviar: (a: AcaoSala) => void; agora: () => number; privadoDe?: (id: string) => unknown };

/** barra do líder em jogo: troca entre ele próprio e os bots */
function TrocaJogador({ vista, eu, como, trocar }: { vista: VistaSala; eu: string; como: string | null; trocar: (id: string | null) => void }) {
  const bot = vista.jogadores.find((j) => j.id === como);
  return (
    <div class={'troca' + (bot ? ' como' : '')}>
      {bot && (
        <div class="troca-aviso">
          <span>🤖 {t('botComo', { nome: bot.nome })}</span>
          <button class="chip" onClick={() => trocar(null)}>
            ← {t('botEu')}
          </button>
        </div>
      )}
      <div class="troca-lista">
        {vista.jogadores
          .filter((j) => j.id === eu || j.bot)
          .map((j) => {
            const on = j.id === (como ?? eu);
            return (
              <button key={j.id} class={'troca-j' + (on ? ' on' : '')} aria-pressed={on} onClick={() => trocar(j.id === eu ? null : j.id)}>
                <Avatar n={j.avatar} tam={28} />
                <span>{j.id === eu ? t('botEu') : j.nome}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

/** o ecrã de quem está na party: lobby, tutorial ou jogo (também o do criador sem TV); o líder pode agir como um bot */
export function EcraJogador(p: PropsEcra) {
  const { vista, eu, enviar } = p;
  const [como, setComo] = useState<string | null>(null);
  const emJogo = !!(vista.tutorial || vista.pirata || vista.ideias || vista.mona || vista.sevira || vista.wifi || vista.pensa || vista.jogo);
  const temBots = vista.vipId === eu && vista.jogadores.some((j) => j.bot);
  if (!emJogo || !temBots) return <Ecra {...p} />;
  const bot = vista.jogadores.find((j) => j.id === como && j.bot);
  const ecra = bot ? (
    <Ecra
      key={bot.id}
      {...p}
      eu={bot.id}
      entrada={{ nome: bot.nome, avatar: bot.avatar, tag: tagsBots()[bot.id] ?? '' }}
      enviar={(a) => enviar({ tipo: 'como', id: '', bot: bot.id, acao: a })}
    />
  ) : (
    <Ecra key={eu} {...p} />
  );
  return (
    <>
      <TrocaJogador vista={vista} eu={eu} como={bot ? bot.id : null} trocar={setComo} />
      {ecra}
    </>
  );
}

function Ecra({ vista, eu, entrada, mudar, enviar, agora, privadoDe }: PropsEcra) {
  if (vista.tutorial) return <Tutorial vista={vista} eu={eu} enviar={enviar} agora={agora} />;
  if (vista.pirata) {
    return (
      <>
        <TelemovelPirata key={eu} sala={vista} v={vista.pirata} agora={agora} eu={eu} privado={(privadoDe?.(eu) as PrivadoPirata | null) ?? null} enviar={enviar} />
        <div class="rodape-codigo">{vista.codigo}</div>
      </>
    );
  }
  if (vista.ideias) {
    return (
      <>
        <TelemovelIdeias sala={vista} v={vista.ideias} agora={agora} eu={eu} tag={entrada.tag} enviar={enviar} />
        <div class="rodape-codigo">{vista.codigo}</div>
      </>
    );
  }
  if (vista.mona) {
    return (
      <>
        <TelemovelMona sala={vista} v={vista.mona} agora={agora} eu={eu} tag={entrada.tag} enviar={enviar} />
        <div class="rodape-codigo">{vista.codigo}</div>
      </>
    );
  }
  if (vista.sevira) {
    return (
      <>
        <TelemovelSevira sala={vista} v={vista.sevira} agora={agora} eu={eu} tag={entrada.tag} enviar={enviar} />
        <div class="rodape-codigo">{vista.codigo}</div>
      </>
    );
  }
  if (vista.wifi) {
    return (
      <>
        <TelemovelWifi sala={vista} v={vista.wifi} agora={agora} eu={eu} tag={entrada.tag} enviar={enviar} />
        <div class="rodape-codigo">{vista.codigo}</div>
      </>
    );
  }
  if (vista.pensa || vista.jogo) {
    return (
      <>
        {vista.pensa ? (
          <TelemovelPensa sala={vista} v={vista.pensa} agora={agora} eu={eu} tag={entrada.tag} enviar={enviar} />
        ) : (
          <Telemovel5050 sala={vista} v={vista.jogo!} agora={agora} eu={eu} tag={entrada.tag} enviar={enviar} />
        )}
        <div class="rodape-codigo">{vista.codigo}</div>
      </>
    );
  }
  return <Lobby vista={vista} eu={eu} entrada={entrada} mudar={mudar} enviar={enviar} />;
}
