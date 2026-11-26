import { t } from '../core/i18n';
import type { AcaoSala, VistaSala } from '../core/sala';
import { useState } from 'preact/hooks';
import { Boneco } from './comuns';
import { Confirmar } from './confirmar';
import { Qr } from './qr';

/**
 * Quem pode estar na party (src/core/membros.ts, auditoria T8), no telemóvel:
 * - o líder fecha/abre a party no lobby, e toca num jogador para passar a liderança ou expulsar;
 * - em jogo, o líder tem "👥 Jogadores" para expulsar (conta como uma saída: src/core/saidas.ts);
 * - quem foi expulso, ou ficou à porta de uma party fechada, vê um aviso claro.
 */

type J = VistaSala['jogadores'][number];

/**
 * O líder tocou num jogador (humano) no lobby, ou em si próprio: "Tornar TV" (com popup a explicar) e expulsar.
 * `eu`: é o próprio líder (não se expulsa). A liderança passa-se no "👑 Líder" do topo (`EscolherLider`).
 */
export function PopupJogador({ j, eu, vista, enviar, fechar }: { j: J; eu: boolean; vista: VistaSala; enviar: (a: AcaoSala) => void; fechar: () => void }) {
  const [confirmar, setConfirmar] = useState<'tv' | 'expulsar' | null>(null);
  if (confirmar === 'expulsar')
    return <Confirmar texto={t('mbExpulsarConfirma', { nome: j.nome })} sim={t('mbExpulsar')} aoSim={() => enviar({ tipo: 'expulsar', id: '', alvo: j.id })} fechar={fechar} />;
  if (confirmar === 'tv') {
    const texto = (eu ? t('lbTvExplicaEu') : t('lbTvExplica', { nome: j.nome })) + (vista.semTv ? '' : ' ' + t('lbTvSubstitui'));
    return <Confirmar texto={texto} sim={t('confirmar')} aoSim={() => enviar({ tipo: 'tornar_tv', id: '', alvo: j.id })} fechar={fechar} />;
  }
  // a TV precisa de alguém que fique a jogar
  const outros = vista.jogadores.some((x) => x.ligado && !x.bot && x.id !== j.id);
  return (
    <div class="popup" onClick={fechar}>
      <div class="cartao centro" role="dialog" aria-modal="true" aria-label={j.nome} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Boneco j={j} tam={72} />
        </div>
        {j.ligado && outros && !vista.novaTv && (
          <button class="botao" style={{ width: '100%', marginTop: 12 }} onClick={() => setConfirmar('tv')}>
            {t('lbTornarTv')}
          </button>
        )}
        {!eu && (
          <button class="botao sec" style={{ width: '100%', marginTop: 8 }} onClick={() => setConfirmar('expulsar')}>
            {t('mbExpulsar')}
          </button>
        )}
        <button class="botao sec" style={{ width: '100%', marginTop: 8 }} onClick={fechar}>
          {t('fechar')}
        </button>
      </div>
    </div>
  );
}

/**
 * O líder tocou num bot no lobby: interruptor "IA jogável" (ligado por defeito; bolinha verde = ligada,
 * cinzenta = desligada; src/core/ia.ts) e Expulsar. Com a IA ligada o bot joga sozinho.
 */
export function PopupBot({ j, enviar, fechar }: { j: J; enviar: (a: AcaoSala) => void; fechar: () => void }) {
  const [remover, setRemover] = useState(false);
  if (remover) return <Confirmar texto={t('botRemover', { nome: j.nome })} sim={t('mbExpulsar')} aoSim={() => enviar({ tipo: 'bot_del', id: '', bot: j.id })} fechar={fechar} />;
  const ia = !!j.ia;
  return (
    <div class="popup" onClick={fechar}>
      <div class="cartao centro" role="dialog" aria-modal="true" aria-label={j.nome} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Boneco j={j} tam={72} marca="🤖" />
        </div>
        <button class={'interruptor-ia' + (ia ? ' on' : '')} role="switch" aria-checked={ia} onClick={() => enviar({ tipo: 'bot_ia', id: '', bot: j.id, ia: !ia })}>
          <span class="bolinha-ia" aria-hidden="true" />
          <span class="cresce">{t('botIa')}</span>
          <span class="mini">{ia ? t('botIaOn') : t('botIaOff')}</span>
        </button>
        <p class="mini" style={{ margin: '4px 0 0' }}>{ia ? t('botIaDicaOn') : t('botIaDicaOff')}</p>
        <button class="botao sec" style={{ width: '100%', marginTop: 12 }} onClick={() => setRemover(true)}>
          {t('mbExpulsar')}
        </button>
        <button class="botao sec" style={{ width: '100%', marginTop: 8 }} onClick={fechar}>
          {t('fechar')}
        </button>
      </div>
    </div>
  );
}

/** 🔒 ao lado do código: o líder fecha / abre a party; os outros só veem o cadeado quando está fechada */
export function CadeadoParty({ vista, lider, enviar }: { vista: VistaSala; lider: boolean; enviar: (a: AcaoSala) => void }) {
  const rotulo = vista.fechada ? t('mbAbrir') : t('mbFechar');
  if (!lider)
    return vista.fechada ? (
      <span class="chip on" role="img" aria-label={t('mbFechadaTv')} title={t('mbFechadaDica')}>
        🔒
      </span>
    ) : null;
  return (
    <button class={'chip cadeado' + (vista.fechada ? ' on' : '')} onClick={() => enviar({ tipo: 'fechar', id: '', fechada: !vista.fechada })} aria-pressed={!!vista.fechada} aria-label={rotulo} title={rotulo}>
      {vista.fechada ? '🔒' : '🔓'}
    </button>
  );
}

/** "👑 Líder" no topo: a lista da sala, e o escolhido passa a ser o líder (o atual deixa de ser) */
export function EscolherLider({ vista, eu, enviar, fechar }: { vista: VistaSala; eu: string; enviar: (a: AcaoSala) => void; fechar: () => void }) {
  const outros = vista.jogadores.filter((j) => j.id !== eu && j.ligado && !j.bot && !(vista.expulsos ?? []).includes(j.id));
  return (
    <div class="popup" onClick={fechar}>
      <div class="cartao centro" role="dialog" aria-modal="true" aria-label={t('lbEscolherLider')} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>👑 {t('lbEscolherLider')}</h3>
        {outros.length ? (
          <div class="fila-bonecos">
            {outros.map((j) => (
              <button
                key={j.id}
                class="escolha-boneco"
                aria-label={j.nome}
                onClick={() => {
                  enviar({ tipo: 'lideranca', id: '', para: j.id });
                  fechar();
                }}
              >
                <Boneco j={j} tam={56} />
              </button>
            ))}
          </div>
        ) : (
          <p class="mini">{t('lbSemOutros')}</p>
        )}
        <button class="botao sec" style={{ width: '100%', marginTop: 12 }} onClick={fechar}>
          {t('cancelar')}
        </button>
      </div>
    </div>
  );
}

/** tocar no código da party: o QR + o código em grande + ✕ */
export function PopupCodigo({ codigo, link, fechar }: { codigo: string; link: string; fechar: () => void }) {
  return (
    <div class="popup" onClick={fechar}>
      <div class="cartao centro popup-codigo" role="dialog" aria-modal="true" aria-label={t('codigoParty')} onClick={(e) => e.stopPropagation()}>
        <div class="topo">
          <span />
          <button class="botao-icone" onClick={fechar} aria-label={t('fechar')} title={t('fechar')}>
            ✕
          </button>
        </div>
        <Qr texto={link} tam={240} />
        <div class="codigo-grande">{codigo}</div>
        <p class="mini">{t('lbQrDica')}</p>
      </div>
    </div>
  );
}

/** em jogo, só o líder: expulsar alguém a meio (o jogo segue sem ele, como numa saída) */
export function GerirJogadores({ vista, eu, enviar }: { vista: VistaSala; eu: string; enviar: (a: AcaoSala) => void }) {
  const expulsos = vista.expulsos ?? [];
  const outros = vista.jogadores.filter((j) => j.id !== eu && !j.bot && !expulsos.includes(j.id));
  const [alvo, setAlvo] = useState<J | null>(null);
  const [recarregou, setRecarregou] = useState(false);
  const temIa = vista.jogadores.some((j) => j.bot && j.ia);
  if (vista.vipId !== eu || !(outros.length || temIa)) return null;
  return (
    <details class="cartao gerir-jogadores">
      <summary style={{ fontWeight: 700 }}>{t('mbJogadores')}</summary>
      {outros.map((j) => (
        <div key={j.id} class="linha-jogador">
          <span>{j.nome}</span>
          <button class="chip" onClick={() => setAlvo(j)}>
            {t('mbExpulsar')}
          </button>
        </div>
      ))}
      {temIa && (
        <button
          class="botao sec recarregar-bots"
          style={{ width: '100%', marginTop: 8 }}
          onClick={() => {
            enviar({ tipo: 'bots_recarregar', id: '' });
            setRecarregou(true);
            setTimeout(() => setRecarregou(false), 1500);
          }}
        >
          {recarregou ? t('botsRecarregados') : t('botsRecarregar')}
        </button>
      )}
      {alvo && (
        <Confirmar texto={t('mbExpulsarConfirma', { nome: alvo.nome })} sim={t('mbExpulsar')} aoSim={() => enviar({ tipo: 'expulsar', id: '', alvo: alvo.id })} fechar={() => setAlvo(null)} />
      )}
    </details>
  );
}

/**
 * Fui expulso, ou fiquei à porta de uma party fechada? Devolve o ecrã do aviso (ou null).
 * À porta, o telemóvel continua a pedir para entrar (useCliente): se o líder abrir, entra sozinho.
 * `aparelho` = o meu id deste aparelho; `eu` = o meu id de jogador (aliases).
 */
export function avisoPorta(vista: VistaSala, aparelho: string, eu: string) {
  const expulsos = vista.expulsos ?? [];
  if (expulsos.includes(aparelho) || expulsos.includes(eu)) return <Aviso texto={t('mbExpulso')} />;
  const dentro = vista.jogadores.some((j) => j.id === eu);
  if (!dentro && vista.fechada && (vista.barrados ?? []).includes(aparelho)) return <Aviso texto={t('mbBarrado')} />;
  return null;
}

function Aviso({ texto }: { texto: string }) {
  return (
    <div class="pag centro">
      <p class="aviso" role="alert" style={{ marginTop: 80, fontSize: 22 }}>
        {texto}
      </p>
      <a href="#/" class="botao sec" style={{ textDecoration: 'none' }}>
        ← {t('voltar')}
      </a>
    </div>
  );
}
