import { t } from '../../core/i18n';
import { OPCOES_IDEIAS, sorteiaApresentadores, type DefIdeias } from './regras';

/** opções das Ideias Mirabolantes (telemóvel do líder); `n` = jogadores, para mostrar o padrão de quem apresenta */
export function DefinicoesIdeias({ def, n, mudar }: { def: DefIdeias; n: number; mudar: (d: Partial<DefIdeias>) => void }) {
  const quem = sorteiaApresentadores(n, def.quem) ? 'sorteados' : 'todos';
  const grupo = (rotulo: string, chave: 'inventar' | 'pitch', atual: number) => (
    <div>
      <label>{rotulo}</label>
      <div class="opcoes">
        {OPCOES_IDEIAS[chave].map((x) => (
          <button key={x} class={'opcao' + (atual === x ? ' on' : '')} onClick={() => mudar({ [chave]: x })}>
            {x} s
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      {grupo(t('imInventarOp'), 'inventar', def.inventar)}
      {grupo(t('imPitchOp'), 'pitch', def.pitch)}
      <div>
        <label>{t('imQuem')}</label>
        <div class="opcoes">
          {(['todos', 'sorteados'] as const).map((x) => (
            <button key={x} class={'opcao' + (quem === x ? ' on' : '')} onClick={() => mudar({ quem: x })}>
              {x === 'todos' ? t('imTodos') : t('imSorteados')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
