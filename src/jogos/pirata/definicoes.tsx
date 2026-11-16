import { t } from '../../core/i18n';
import { OPCOES_PIRATA, limiarVigia, DEF_PADRAO_PIRATA, type DefPirata } from './regras';

/** opções do Pirata (telemóvel do líder); `n` = jogadores, para mostrar o padrão da vigia */
export function DefinicoesPirata({ def, n, mudar }: { def: DefPirata; n: number; mudar: (d: Partial<DefPirata>) => void }) {
  const simNao = (rotulo: string, chave: 'artilheiro' | 'revelar') => (
    <div>
      <label>{rotulo}</label>
      <div class="opcoes">
        {[true, false].map((x) => (
          <button key={String(x)} class={'opcao' + (def[chave] === x ? ' on' : '')} onClick={() => mudar({ [chave]: x })}>
            {x ? t('prSim') : t('prNao')}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      <div>
        <label>{t('prOpDiscussao')}</label>
        <div class="opcoes">
          {OPCOES_PIRATA.discussao.map((x) => (
            <button key={x} class={'opcao' + (def.discussao === x ? ' on' : '')} onClick={() => mudar({ discussao: x })}>
              {x / 60} min
            </button>
          ))}
        </div>
      </div>
      <div>
        <label>{t('prOpVigiar')}</label>
        <div class="opcoes">
          <button class={'opcao' + (def.vigiar === null ? ' on' : '')} onClick={() => mudar({ vigiar: null })}>
            {t('prOpPadrao', { n: limiarVigia(DEF_PADRAO_PIRATA, n) })}
          </button>
          {OPCOES_PIRATA.vigiar.map((x) => (
            <button key={x} class={'opcao' + (def.vigiar === x ? ' on' : '')} onClick={() => mudar({ vigiar: x })}>
              {x}
            </button>
          ))}
        </div>
      </div>
      {simNao(t('prOpArtilheiro'), 'artilheiro')}
      {simNao(t('prOpRevelar'), 'revelar')}
    </div>
  );
}
