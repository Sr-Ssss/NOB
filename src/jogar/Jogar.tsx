import { useEffect, useState } from 'preact/hooks';
import { useCliente, type Entrada } from '../core/ligacao';
import { CODIGO_VALIDO, idAleatorio, meuId, paramsHash } from '../core/ids';
import { t, usarIdioma } from '../core/i18n';
import { MAX_NOME, N_AVATARES, PREFIXO_BOT, minhaMarca, type AcaoSala, type Tecla, type VistaSala } from '../core/sala';
import { Avatar, Boneco } from '../ui/comuns';
import { emCurso } from '../jogos/ecras';
import { MenuJogos, OpcoesComTv, Tutorial } from './MenuJogos';
import { Confirmar } from '../ui/confirmar';
import { AvisosSaidas } from '../ui/saidas';
import { BotaoFecharParty, GerirJogadores, PopupJogador, avisoPorta } from '../ui/membros';
import { nomeBoneco } from '../ui/bonecos';

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

/** quanto se espera por uma party que não responde antes de dizer "não encontrada" */
const ESPERA_PARTY = 6000;

/** true quando `esperando` já dura `ms` seguidos (volta a false assim que deixa de esperar) */
function useEsgotado(esperando: boolean, ms: number): boolean {
  const [esgotou, setEsgotou] = useState(false);
  useEffect(() => {
    setEsgotou(false);
    if (!esperando) return;
    const id = setTimeout(() => setEsgotou(true), ms);
    return () => clearTimeout(id);
  }, [esperando, ms]);
  return esperando && esgotou;
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
            aria-label={nomeBoneco(i)}
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
      {vista.fechada && (
        <p class="aviso" role="status">
          {t('mbFechadaAviso')}
        </p>
      )}
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

/** nome das setas para leitores de ecrã */
const NOME_TECLA: Partial<Record<Tecla, string>> = { cima: '↑', baixo: '↓', esq: '←', dir: '→', ok: 'OK' };

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
            <button key={k.tecla} class={'tecla' + (k.tecla === 'ok' ? ' ok' : '')} style={{ gridArea: k.area }} aria-label={NOME_TECLA[k.tecla]} onClick={() => tecla(k.tecla)}>
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
  /** jogador humano em que o líder tocou: passar a liderança ou expulsar (src/ui/membros.tsx) */
  const [tocado, setTocado] = useState<string | null>(null);
  const tocar = (j: (typeof outros)[number]) => setTocado(j.id);
  const jTocado = souLider ? outros.find((j) => j.id === tocado) : undefined;

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
            disabled={!souLider}
            onClick={() => tocar(j)}
          >
            <Boneco j={j} tam={52} marca={j.id === vista.vipId ? '👑' : j.bot ? '🤖' : j.pronto ? '✓' : undefined} />
          </button>
        ))}
      </div>
      {souLider && outros.some((j) => !j.bot) && <p class="centro mini">{t('mbTocarJogador')}</p>}
      {souLider && (
        <button class="botao sec" onClick={() => novoBot(enviar)}>
          🤖 {t('botMais')}
        </button>
      )}
      {souLider ? <BotaoFecharParty vista={vista} enviar={enviar} /> : vista.fechada && <p class="centro mini">{t('mbFechadaDica')}</p>}
      {jTocado?.bot && (
        <Confirmar texto={t('botRemover', { nome: jTocado.nome })} aoSim={() => enviar({ tipo: 'bot_del', id: '', bot: jTocado.id })} fechar={() => setTocado(null)} />
      )}
      {jTocado && !jTocado.bot && <PopupJogador j={jTocado} enviar={enviar} fechar={() => setTocado(null)} />}

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
          <OpcoesComTv vista={vista} enviar={enviar} />
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
  // impressão digital da TV, vinda do link do QR: só se aceita essa TV
  const impressao = paramsHash().get('k');
  const { vista, estado, agoraTv, acao, privados, pedirPrivado } = useCliente(codigo, dispositivo, entrada, impressao && /^[0-9a-f]{12}$/.test(impressao) ? impressao : null);
  const eu = vista?.aliases[dispositivo] ?? dispositivo;
  const dentro = vista?.jogadores.find((j) => j.id === eu);
  if (vista) usarIdioma(vista.idioma);
  // canal privado (papéis secretos, palavras da equipa): chega cifrado só para este aparelho
  // (o meu e, no líder, o dos bots). Se uma mensagem se perder, volta-se a pedir quando a fase muda.
  const ativo = vista ? emCurso(vista) : null;
  const versao = ativo?.j.e.versaoPrivado?.(ativo.g) ?? '';
  useEffect(() => {
    if (!versao) return;
    const t = setTimeout(pedirPrivado, 700);
    return () => clearTimeout(t);
  }, [versao]);

  // já estava nesta party (recarregou a página): volta a entrar sozinho
  useEffect(() => {
    if (dentro && !entrada) setEntrada({ nome: dentro.nome, avatar: dentro.avatar, tag: idAleatorio() });
  }, [!!dentro]);

  const fase = ativo ? ativo.j.e.vibrar(ativo.g) : 'lobby';
  useEffect(() => {
    try {
      navigator.vibrate?.(60);
    } catch {
      /* sem vibração (iPhone) */
    }
  }, [fase]);

  // à espera de uma party que não responde (não existe, a TV recarregou com outro código, acabou): ao fim de 6 s, avisa (auditoria E5)
  const esgotou = useEsgotado((!vista && estado === 'a_ligar') || (!!vista && !!entrada && !dentro), ESPERA_PARTY);

  const entrar = (e: Entrada) => {
    guardar(e);
    setEntrada(e);
  };

  if (!CODIGO_VALIDO.test(codigo)) {
    location.hash = '#/';
    return null;
  }

  if (!vista || (esgotou && entrada && !dentro)) {
    const msg = esgotou ? t('partyNaoEncontrada') : estado === 'sem_sala' ? t('salaNaoEncontrada') : estado === 'erro' ? t('semLigacao') : t('aLigar');
    return (
      <div class="pag centro">
        <p style={{ marginTop: 80, fontSize: 24 }} role={esgotou ? 'alert' : 'status'}>
          {msg}
        </p>
        {(esgotou || estado !== 'a_ligar') && (
          <a href="#/" class="botao sec" style={{ textDecoration: 'none' }}>
            ← {t('voltar')}
          </a>
        )}
      </div>
    );
  }

  // expulso, ou à porta de uma party fechada (src/core/membros.ts)
  const porta = avisoPorta(vista, dispositivo, eu);
  if (porta) return porta;

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
  const emJogo = !!(vista.tutorial || emCurso(vista));
  const temBots = vista.vipId === eu && vista.jogadores.some((j) => j.bot);
  // quem saiu a meio (o líder decide) e "és espectador": sempre com o eu verdadeiro, mesmo a agir como bot
  // + "👥 Jogadores" do líder: expulsar a meio (src/ui/membros.tsx)
  const avisos =
    emJogo && !vista.tutorial ? (
      <>
        <AvisosSaidas vista={vista} eu={eu} enviar={enviar} />
        <GerirJogadores vista={vista} eu={eu} enviar={enviar} />
      </>
    ) : null;
  if (!emJogo || !temBots)
    return (
      <>
        {avisos}
        <Ecra {...p} />
      </>
    );
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
      {avisos}
      {ecra}
    </>
  );
}

function Ecra({ vista, eu, entrada, mudar, enviar, agora, privadoDe }: PropsEcra) {
  if (vista.tutorial) return <Tutorial vista={vista} eu={eu} enviar={enviar} agora={agora} />;
  const ativo = emCurso(vista);
  if (ativo) {
    return (
      <>
        {ativo.j.e.telemovel({ v: ativo.g, sala: vista, agora, eu, marca: () => minhaMarca(vista, entrada.tag), privado: privadoDe?.(eu) ?? null, enviar })}
        <div class="rodape-codigo">{vista.codigo}</div>
      </>
    );
  }
  return <Lobby vista={vista} eu={eu} entrada={entrada} mudar={mudar} enviar={enviar} />;
}
