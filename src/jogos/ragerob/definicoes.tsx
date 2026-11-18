import { t } from '../../core/i18n';
import { OPCOES_RAGEROB, type DefRagerob } from './regras';

/** opções do Ragerob (só o líder) */
export function DefinicoesRagerob({ def, mudar }: { def: DefRagerob; mudar: (d: Partial<DefRagerob>) => void }) {
  const grupo = <K extends keyof DefRagerob>(rotulo: string, k: K, lista: DefRagerob[K][], nome: (x: DefRagerob[K]) => string) => (
    <div>
      <label>{rotulo}</label>
      <div class="opcoes">
        {lista.map((x) => (
          <button key={String(x)} class={'opcao' + (def[k] === x ? ' on' : '')} aria-pressed={def[k] === x} onClick={() => mudar({ [k]: x } as Partial<DefRagerob>)}>
            {nome(x)}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      {grupo(t('rrModo'), 'modo', ['normal', 'pilotos'], (x) => (x === 'normal' ? t('rrNormal') : t('rrPilotos')))}
      {def.modo === 'normal'
        ? grupo(t('rrRondasOp'), 'rondas', OPCOES_RAGEROB.rondas, (x) => t('rrRondasRobos', { r: x, n: 2 ** x }))
        : grupo(t('rrRondasOp'), 'rondasPilotos', OPCOES_RAGEROB.rondasPilotos, (x) => String(x))}
      {grupo(t('rrLojaOp'), 'loja', ['leilao', 'privada'], (x) => (x === 'leilao' ? t('rrLeilao') : t('rrPrivada')))}
      {def.modo === 'normal' && (
        <details>
          <summary>{t('rrAvancadas')}</summary>
          {grupo(t('rrEntradaOp'), 'entrada', OPCOES_RAGEROB.entrada, (x) => String(x))}
          {grupo(t('rrMinimoOp'), 'minimo', OPCOES_RAGEROB.minimo, (x) => '+' + x)}
        </details>
      )}
    </div>
  );
}
