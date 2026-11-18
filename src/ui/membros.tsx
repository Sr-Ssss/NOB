import { t } from '../core/i18n';
import type { AcaoSala, VistaSala } from '../core/sala';
import { useState } from 'preact/hooks';
import { Boneco } from './comuns';
import { Confirmar } from './confirmar';

/**
 * Quem pode estar na party (src/core/membros.ts, auditoria T8), no telemóvel:
 * - o líder fecha/abre a party no lobby, e toca num jogador para passar a liderança ou expulsar;
 * - em jogo, o líder tem "👥 Jogadores" para expulsar (conta como uma saída: src/core/saidas.ts);
 * - quem foi expulso, ou ficou à porta de uma party fechada, vê um aviso claro.
 */

type J = VistaSala['jogadores'][number];

/** o líder tocou num jogador (humano) no lobby */
export function PopupJogador({ j, enviar, fechar }: { j: J; enviar: (a: AcaoSala) => void; fechar: () => void }) {
  const [confirmar, setConfirmar] = useState(false);
  if (confirmar)
    return <Confirmar texto={t('mbExpulsarConfirma', { nome: j.nome })} sim={t('mbExpulsar')} aoSim={() => enviar({ tipo: 'expulsar', id: '', alvo: j.id })} fechar={fechar} />;
  const expulsar = () => setConfirmar(true);
  return (
    <div class="popup" onClick={fechar}>
      <div class="cartao centro" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Boneco j={j} tam={72} />
        </div>
        {j.ligado && (
          <button
            class="botao"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => {
              enviar({ tipo: 'lideranca', id: '', para: j.id });
              fechar();
            }}
          >
            {t('mbPassar')}
          </button>
        )}
        <button class="botao sec" style={{ width: '100%', marginTop: 8 }} onClick={expulsar}>
          {t('mbExpulsar')}
        </button>
        <button class="botao sec" style={{ width: '100%', marginTop: 8 }} onClick={fechar}>
          {t('fechar')}
        </button>
      </div>
    </div>
  );
}

/** só o líder: fechar / abrir a party */
export function BotaoFecharParty({ vista, enviar }: { vista: VistaSala; enviar: (a: AcaoSala) => void }) {
  return (
    <>
      <button class="botao sec" onClick={() => enviar({ tipo: 'fechar', id: '', fechada: !vista.fechada })} aria-pressed={!!vista.fechada}>
        {vista.fechada ? t('mbAbrir') : t('mbFechar')}
      </button>
      {vista.fechada && <p class="centro mini">{t('mbFechadaDica')}</p>}
    </>
  );
}

/** em jogo, só o líder: expulsar alguém a meio (o jogo segue sem ele, como numa saída) */
export function GerirJogadores({ vista, eu, enviar }: { vista: VistaSala; eu: string; enviar: (a: AcaoSala) => void }) {
  const expulsos = vista.expulsos ?? [];
  const outros = vista.jogadores.filter((j) => j.id !== eu && !j.bot && !expulsos.includes(j.id));
  const [alvo, setAlvo] = useState<J | null>(null);
  if (vista.vipId !== eu || !outros.length) return null;
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
