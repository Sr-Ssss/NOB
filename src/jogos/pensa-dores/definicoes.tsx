import { t } from '../../core/i18n';
import { OPCOES_PENSA, type DefPensa } from './regras';

/** opções do Pensa-Dores (telemóvel do líder) */
export function DefinicoesPensa({ def, mudar }: { def: DefPensa; mudar: (d: Partial<DefPensa>) => void }) {
  const grupo = (rotulo: string, chave: 'rondas' | 'escrever' | 'votar', suf = '') => (
    <div>
      <label>{rotulo}</label>
      <div class="opcoes">
        {OPCOES_PENSA[chave].map((n) => (
          <button key={n} class={'opcao' + (def[chave] === n ? ' on' : '')} onClick={() => mudar({ [chave]: n })}>
            {n}
            {suf}
          </button>
        ))}
      </div>
    </div>
  );
  const simNao = (rotulo: string, chave: 'final' | 'mostrarVotos') => (
    <div>
      <label>{rotulo}</label>
      <div class="opcoes">
        {[true, false].map((b) => (
          <button key={String(b)} class={'opcao' + (def[chave] === b ? ' on' : '')} onClick={() => mudar({ [chave]: b })}>
            {b ? t('sim') : t('nao')}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      {grupo(t('rondas'), 'rondas')}
      {simNao(t('pdRondaFinal'), 'final')}
      {grupo(t('escrever'), 'escrever', ' s')}
      {grupo(t('votar'), 'votar', ' s')}
      {simNao(t('mostrarVotos'), 'mostrarVotos')}
    </div>
  );
}
