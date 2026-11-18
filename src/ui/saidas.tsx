import { useState } from 'preact/hooks';
import { t } from '../core/i18n';
import { Confirmar } from './confirmar';
import type { AcaoSala, EstadoSala, VistaSala } from '../core/sala';

const nomeDe = (v: Pick<VistaSala, 'jogadores'>, id: string) => v.jogadores.find((j) => j.id === id)?.nome ?? '?';

/**
 * Saídas e entradas a meio do jogo (src/core/saidas.ts), no telemóvel:
 * - o líder vê quem saiu e decide: pôr um espectador no lugar, seguir sem ele, ou acabar o jogo
 *   (enquanto não decide, o jogo espera; se a pessoa voltar, continua sozinho);
 * - os outros só veem "à espera de…" quando o jogo está em pausa;
 * - quem entrou depois de começar vê que é espectador.
 */
export function AvisosSaidas({ vista, eu, enviar }: { vista: VistaSala; eu: string; enviar: (a: AcaoSala) => void }) {
  const ausentes = vista.ausentes ?? [];
  const espectadores = vista.espectadores ?? [];
  const lider = vista.vipId === eu;
  const souEspectador = espectadores.includes(eu);
  const importantes = ausentes.filter((a) => a.importante);

  if (!lider) {
    return (
      <>
        {importantes.length > 0 && (
          <div class="aviso" role="status">
            {t('saEsperaLider', { nome: importantes.map((a) => nomeDe(vista, a.id)).join(', ') })}
          </div>
        )}
        {souEspectador && <p class="centro mini">{t('saEspectador')}</p>}
      </>
    );
  }
  if (!ausentes.length) return null;
  return (
    <div class="cartao saidas" role="alert">
      {ausentes.map((a) => {
        const nome = nomeDe(vista, a.id);
        return (
          <div key={a.id} class="saida">
            <b>{a.importante ? t('saEspera', { nome }) : t('saSaiu', { nome })}</b>
            {espectadores.length > 0 ? (
              <>
                <p class="mini">{t('saTrocarPor', { nome })}</p>
                <div class="opcoes">
                  {espectadores.map((id) => (
                    <button key={id} class="opcao" onClick={() => enviar({ tipo: 'ausente_trocar', id: '', alvo: a.id, por: id })}>
                      {nomeDe(vista, id)}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              a.importante && <p class="mini">{t('saSemEspectadores')}</p>
            )}
            {a.podeSeguir ? (
              <button class="botao sec" onClick={() => enviar({ tipo: 'ausente_seguir', id: '', alvo: a.id })}>
                {t('saSeguirSem', { nome })}
              </button>
            ) : (
              <p class="mini">{t('saNaoDaSem', { nome })}</p>
            )}
          </div>
        );
      })}
      {vista.pausaSaida && (
        <BotaoAcabar enviar={enviar} />
      )}
    </div>
  );
}

/** "Acabar o jogo" do líder, com o popup da app (src/ui/confirmar.tsx) */
function BotaoAcabar({ enviar }: { enviar: (a: AcaoSala) => void }) {
  const [perguntar, setPerguntar] = useState(false);
  return (
    <>
      <button class="botao sec" onClick={() => setPerguntar(true)}>
        {t('saAcabar')}
      </button>
      {perguntar && <Confirmar texto={t('saAcabarConfirma')} sim={t('saAcabar')} aoSim={() => enviar({ tipo: 'acabar', id: '' })} fechar={() => setPerguntar(false)} />}
    </>
  );
}

/** na TV: só o aviso de pausa (quem decide é o líder, no telemóvel) */
export function AvisoSaidasTv({ s }: { s: Pick<EstadoSala, 'pausaSaida' | 'ausentes' | 'jogadores'> }) {
  const importantes = (s.ausentes ?? []).filter((a) => a.importante);
  if (!s.pausaSaida || !importantes.length) return null;
  return (
    <div class="aviso-tv-saida" role="status">
      {t('saEsperaLider', { nome: importantes.map((a) => nomeDe(s, a.id)).join(', ') })}
    </div>
  );
}
