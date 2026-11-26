import { t } from '../../core/i18n';
import type { DefSemJuizo } from './regras';

export function DefinicoesSemJuizo({ def, mudar }: { def: DefSemJuizo; mudar: (d: Partial<DefSemJuizo>) => void }) {
  return (
    <div style={{ marginTop: 10 }}>
      <label>{t('sjProvas')}</label>
      <div class="opcoes">
        {(['aleatorias', 'juri'] as const).map((x) => (
          <button key={x} class={'opcao' + (def.provas === x ? ' on' : '')} aria-pressed={def.provas === x} onClick={() => mudar({ provas: x })}>
            {t(x === 'juri' ? 'sjJuriEscolhe' : 'sjAleatorias')}
          </button>
        ))}
      </div>
    </div>
  );
}
