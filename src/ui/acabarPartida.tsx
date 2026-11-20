import { useState } from 'preact/hooks';
import type { AcaoSala, VistaSala } from '../core/sala';
import { t } from '../core/i18n';
import { Confirmar } from './confirmar';

/**
 * Fase 9 do feedback (20/11): "Acabar partida" do líder, junto do ⓘ de cada jogo no telemóvel.
 * Pede confirmação (Sim / Não) e manda `acabar` → a sala volta ao lobby.
 */
export function AcabarPartida({ sala, eu, enviar }: { sala: Pick<VistaSala, 'vipId'>; eu: string; enviar: (a: AcaoSala) => void }) {
  const [perguntar, setPerguntar] = useState(false);
  if (sala.vipId !== eu) return null;
  return (
    <>
      <button class="chip acabar-partida" aria-label={t('acabarPartida')} title={t('acabarPartida')} onClick={() => setPerguntar(true)}>
        ⏹
      </button>
      {perguntar && <Confirmar texto={t('acabarPartidaConfirma')} sim={t('sim')} nao={t('nao')} aoSim={() => enviar({ tipo: 'acabar', id: '' })} fechar={() => setPerguntar(false)} />}
    </>
  );
}
