import { useEffect, useState } from 'preact/hooks';
import { useCliente, type Entrada } from '../core/ligacao';
import { idAleatorio, meuId, paramsHash } from '../core/ids';
import { t, usarIdioma } from '../core/i18n';
import { MAX_NOME, N_AVATARES, type AcaoSala, type Tecla, type VistaSala } from '../core/sala';
import { Avatar, Boneco } from '../ui/comuns';
import { Telemovel5050 } from '../jogos/5050/telemovel';
import { Definicoes } from '../tv/Tv';

const chaveEu = () => 'nob.eu' + (paramsHash().get('eu') ?? '');

function guardado(): { nome?: string; avatar?: number } {
  try {
    return JSON.parse(localStorage.getItem(chaveEu()) ?? '{}');
  } catch {
    return {};
  }
}

function guardar(e: Entrada) {
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
function EscolherBoneco({ vista, eu, aoEntrar }: { vista: VistaSala; eu: string; aoEntrar: (e: Entrada) => void }) {
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
  const [nome, setNome] = useState(entrada.nome);
  const meu = vista.jogadores.find((j) => j.id === eu);
  const souLider = vista.vipId === eu;
  const lider = vista.jogadores.find((j) => j.id === vista.vipId);
  const outros = vista.jogadores.filter((j) => j.id !== eu);

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
            onClick={() => confirm(t('passarA', { nome: j.nome })) && enviar({ tipo: 'lideranca', id: '', para: j.id })}
          >
            <Boneco j={j} tam={52} marca={j.id === vista.vipId ? '👑' : j.pronto ? '✓' : undefined} />
          </button>
        ))}
      </div>
      {souLider && outros.length > 0 && <p class="centro mini">{t('passarLideranca')}</p>}

      <button class={'botao grande' + (meu?.pronto ? ' sec' : '')} onClick={() => enviar({ tipo: 'pronto', id: '', pronto: !meu?.pronto })}>
        {meu?.pronto ? t('prontoOk') : t('pronto')}
      </button>

      {souLider ? (
        <>
          <button class="botao sec" onClick={() => setComando(true)}>
            🎮 {t('comandoTv')}
          </button>
          <details class="cartao">
            <summary style={{ fontWeight: 700 }}>{t('opcoesJogo')} · 50/50</summary>
            <Definicoes def={vista.def} mudar={(d) => enviar({ tipo: 'definir', id: '', def: d })} />
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

  // já estava nesta party (recarregou a página): volta a entrar sozinho
  useEffect(() => {
    if (dentro && !entrada) setEntrada({ nome: dentro.nome, avatar: dentro.avatar, tag: idAleatorio() });
  }, [!!dentro]);

  const fase = vista?.jogo ? `${vista.jogo.fase}:${vista.jogo.ronda}:${vista.jogo.dilema?.texto ?? ''}` : 'lobby';
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

  if (vista.jogo) {
    return (
      <>
        <Telemovel5050 sala={vista} v={vista.jogo} agora={agoraTv} eu={eu} tag={entrada.tag} enviar={acao} />
        <div class="rodape-codigo">{vista.codigo}</div>
      </>
    );
  }

  return <Lobby vista={vista} eu={eu} entrada={entrada} mudar={entrar} enviar={acao} />;
}
