import { t } from '../../core/i18n';
import { EXTRAS, MAX_NOME_SALA, OPCOES_REI, type DefRei, type Extra, type PapelR } from './regras';
import { ICONE, nomePapel } from './comuns';

const ROTULO: Record<Extra, PapelR[]> = {
  escudeiro: ['escudeiro'], domador: ['domador'], traidor: ['traidor'], gemeos: ['gemeo'], rivais: ['rival'], medroso: ['medroso'], curioso: ['curioso'],
  pajem: ['pajem'], duque: ['duque'], apostador: ['apostador'], arqueiro: ['arqueiro', 'alvo', 'isco'], batata: ['batata'],
};

/** opções do Rei e o Dragão (só o líder) */
export function DefinicoesRei({ def, mudar }: { def: DefRei; mudar: (d: Partial<DefRei>) => void }) {
  const sala = (k: 0 | 1, nome: string) => {
    const salas = [...def.salas] as [string, string];
    salas[k] = nome.slice(0, MAX_NOME_SALA);
    mudar({ salas });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      <div>
        <label>{t('rdNomesSalas')}</label>
        <div class="linha">
          <input class="cresce" maxLength={MAX_NOME_SALA} value={def.salas[0]} placeholder={t('rdSala1')} onChange={(e) => sala(0, (e.target as HTMLInputElement).value)} />
          <input class="cresce" maxLength={MAX_NOME_SALA} value={def.salas[1]} placeholder={t('rdSala2')} onChange={(e) => sala(1, (e.target as HTMLInputElement).value)} />
        </div>
      </div>
      <div>
        <label>{t('rdTempo')}</label>
        <div class="opcoes">
          {OPCOES_REI.tempo.map((x) => (
            <button key={x} class={'opcao' + (def.tempo === x ? ' on' : '')} onClick={() => mudar({ tempo: x })}>
              {x / 60} min
            </button>
          ))}
        </div>
      </div>
      <details>
        <summary>{t('rdAvancadas')}</summary>
        <label>{t('rdExtras')}</label>
        <div class="opcoes">
          {EXTRAS.map((x) => (
            <button key={x} class={'opcao' + (def.extras[x] ? ' on' : '')} onClick={() => mudar({ extras: { ...def.extras, [x]: !def.extras[x] } })}>
              {ROTULO[x].map((p) => ICONE[p] + ' ' + nomePapel(p)).join(' + ')}
            </button>
          ))}
        </div>
        <label>{t('rdAjuste')}</label>
        <div class="opcoes">
          {OPCOES_REI.ajuste.map((x) => (
            <button key={x} class={'opcao' + (def.ajuste === x ? ' on' : '')} onClick={() => mudar({ ajuste: x })}>
              {x > 0 ? '+' + x : x}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
