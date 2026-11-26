import { OBSTACULOS, TXT } from './textos';
import { MAX_DESENHAR, MAX_TINTA, MIN_DESENHAR, MIN_TINTA, type DefDuelo } from './regras';
import './duelo.css';

/** opções do Duelo de Rabiscos (só o líder) */
export function DefinicoesDuelo({ def, mudar }: { def: DefDuelo; mudar: (d: Partial<DefDuelo>) => void }) {
  const numero = (rotulo: string, chave: 'tinta' | 'desenhar', min: number, max: number, passo: number) => {
    const por = (n: number) => Number.isFinite(n) && mudar({ [chave]: Math.min(max, Math.max(min, Math.round(n))) });
    return (
      <div>
        <label for={`dr-op-${chave}`}>{rotulo}</label>
        <div class="dr-contador">
          <button class="opcao" aria-label={TXT.menos(rotulo)} disabled={def[chave] <= min} onClick={() => por(def[chave] - passo)}>
            −
          </button>
          <input id={`dr-op-${chave}`} type="number" min={min} max={max} value={def[chave]} onChange={(e) => por(e.currentTarget.valueAsNumber)} />
          <button class="opcao" aria-label={TXT.mais(rotulo)} disabled={def[chave] >= max} onClick={() => por(def[chave] + passo)}>
            +
          </button>
        </div>
      </div>
    );
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      {numero(TXT.opTinta, 'tinta', MIN_TINTA, MAX_TINTA, 1)}
      {numero(TXT.opDesenhar, 'desenhar', MIN_DESENHAR, MAX_DESENHAR, 5)}
      <div>
        <label>{TXT.opObstaculos}</label>
        <div class="opcoes">
          {OBSTACULOS.map(([x, nome]) => (
            <button key={x} class={'opcao' + (def.obstaculos === x ? ' on' : '')} aria-pressed={def.obstaculos === x} onClick={() => mudar({ obstaculos: x })}>
              {nome}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}