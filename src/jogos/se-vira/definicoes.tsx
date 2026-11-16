import { t } from '../../core/i18n';
import { MAX_APRESENTAM, OPCOES_SEVIRA, type DefSevira } from './regras';

/** opções do Se Vira! (telemóvel do líder); `n` = jogadores, para mostrar o padrão de "quem apresenta" */
export function DefinicoesSevira({ def, n, mudar }: { def: DefSevira; n: number; mudar: (d: Partial<DefSevira>) => void }) {
  const grupo = (rotulo: string, chave: 'tempo' | 'slides', suf = '') => (
    <div>
      <label>{rotulo}</label>
      <div class="opcoes">
        {OPCOES_SEVIRA[chave].map((x) => (
          <button key={x} class={'opcao' + (def[chave] === x ? ' on' : '')} onClick={() => mudar({ [chave]: x })}>
            {x}
            {suf}
          </button>
        ))}
      </div>
    </div>
  );
  const quem = def.quem === 'auto' ? (n > MAX_APRESENTAM ? 'sorteados' : 'todos') : def.quem;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      {grupo(t('svTempo'), 'tempo', ' s')}
      {grupo(t('svSlides'), 'slides')}
      <div>
        <label>{t('svQuem')}</label>
        <div class="opcoes">
          {(['todos', 'sorteados'] as const).map((q) => (
            <button key={q} class={'opcao' + (quem === q ? ' on' : '')} onClick={() => mudar({ quem: q })}>
              {q === 'todos' ? t('svTodos') : t('svSorteados')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
