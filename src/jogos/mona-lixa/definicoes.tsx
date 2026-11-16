import { t } from '../../core/i18n';
import { OPCOES_MONA, rondasPadrao, type DefMona } from './regras';

/** opções da Mona Lixa (telemóvel do líder); `n` = jogadores, para mostrar o padrão das rodadas */
export function DefinicoesMona({ def, n, mudar }: { def: DefMona; n: number; mudar: (d: Partial<DefMona>) => void }) {
  const rondas = def.rondas ?? rondasPadrao(n);
  const grupo = (rotulo: string, chave: 'rondas' | 'desenhar' | 'inventar', atual: number, suf = '') => (
    <div>
      <label>{rotulo}</label>
      <div class="opcoes">
        {OPCOES_MONA[chave].map((x) => (
          <button key={x} class={'opcao' + (atual === x ? ' on' : '')} onClick={() => mudar({ [chave]: x })}>
            {x}
            {suf}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      {grupo(t('rondas'), 'rondas', rondas)}
      {grupo(t('mlDesenhar'), 'desenhar', def.desenhar, ' s')}
      {grupo(t('mlInventarOp'), 'inventar', def.inventar, ' s')}
    </div>
  );
}
