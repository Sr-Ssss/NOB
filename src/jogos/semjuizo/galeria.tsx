import { useRef, useState } from 'preact/hooks';
import type { AcaoSala, VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { reduzirGaleria } from '../se-vira/imagens';
import { BYTES_FOTO, MAX_FOTOS } from './regras';

/** sala de espera: fotos opcionais para as provas (vão só para o host, que as mostra durante o jogo) */
export function GaleriaSemJuizo({ vista, eu, enviar }: { vista: VistaSala; eu: string; enviar: (a: AcaoSala) => void }) {
  const ficheiro = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState(false);
  const n = vista.nFotos?.[eu] ?? 0;
  return (
    <>
      <button class="chip" style={{ alignSelf: 'center', minHeight: 44 }} onClick={() => setAberto(true)}>
        📷 {t('sjGaleria')} {n}/{MAX_FOTOS}
      </button>
      {aberto && (
        <div class="popup" onClick={() => setAberto(false)}>
          <div class="cartao" style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onClick={(e) => e.stopPropagation()}>
            <h3>
              📷 {t('sjGaleria')} {n}/{MAX_FOTOS}
            </h3>
            <p>{t('sjGaleriaAviso')}</p>
            {erro && <p class="mini">⚠ {t('svSemImagem')}</p>}
            <button class="botao" disabled={n >= MAX_FOTOS} onClick={() => ficheiro.current?.click()}>
              + {t('svGaleria')}
            </button>
            {n > 0 && (
              <button class="botao sec" onClick={() => enviar({ tipo: 'sj_foto', id: '', url: null })}>
                {t('svRemover')}
              </button>
            )}
            <button class="botao sec" onClick={() => setAberto(false)}>
              {t('fechar')}
            </button>
            <input
              ref={ficheiro}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.currentTarget.files?.[0];
                e.currentTarget.value = '';
                if (!f) return;
                const url = await reduzirGaleria(f, 800, BYTES_FOTO);
                setErro(!url);
                if (url) enviar({ tipo: 'sj_foto', id: '', url });
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
