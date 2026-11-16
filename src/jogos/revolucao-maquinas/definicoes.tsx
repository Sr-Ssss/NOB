import { t } from '../../core/i18n';
import { OPCOES_MAQUINAS, type DefMaquinas } from './regras';

/** opções da Revolução das Máquinas (telemóvel do líder) */
export function DefinicoesMaquinas({ def, mudar }: { def: DefMaquinas; mudar: (d: Partial<DefMaquinas>) => void }) {
  return (
    <div style={{ marginTop: 10 }}>
      <label>{t('rmOpDiscussao')}</label>
      <div class="opcoes">
        {OPCOES_MAQUINAS.discussao.map((x) => (
          <button key={x} class={'opcao' + (def.discussao === x ? ' on' : '')} onClick={() => mudar({ discussao: x })}>
            {x < 60 ? `${x} s` : `${x / 60} min`}
          </button>
        ))}
      </div>
    </div>
  );
}
