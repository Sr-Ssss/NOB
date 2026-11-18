import { TEMAS, nomeJogo, t } from '../../core/i18n';
import { OPCOES, type Def5050 } from './regras';

/** opções do 50/50 (no telemóvel do líder) */
export function Definicoes5050({ def, mudar }: { def: Def5050; mudar: (d: Partial<Def5050>) => void }) {
  const grupo = (rotulo: string, chave: 'rondas' | 'escrever' | 'votar', suf = '') => (
    <div>
      <label>{rotulo}</label>
      <div class="opcoes">
        {OPCOES[chave].map((n) => (
          <button key={n} class={'opcao' + (def[chave] === n ? ' on' : '')} onClick={() => mudar(chave === 'rondas' ? { rondas: n, rondasAuto: false } : { [chave]: n })}>
            {n}
            {suf}
          </button>
        ))}
      </div>
    </div>
  );
  const temas = def.temas;
  const alternarTema = (id: string) => mudar({ temas: temas.includes(id) ? temas.filter((x) => x !== id) : [...temas, id] });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      {grupo(t('rondas'), 'rondas')}
      {grupo(t('escrever'), 'escrever', ' s')}
      {grupo(t('votar'), 'votar', ' s')}
      <div>
        <label>{t('mostrarVotos')}</label>
        <div class="opcoes">
          <button class={'opcao' + (def.mostrarVotos ? ' on' : '')} onClick={() => mudar({ mostrarVotos: true })}>
            {t('sim')}
          </button>
          <button class={'opcao' + (!def.mostrarVotos ? ' on' : '')} onClick={() => mudar({ mostrarVotos: false })}>
            {t('nao')}
          </button>
        </div>
      </div>
      <div>
        <label>{t('temas')}</label>
        <div class="opcoes">
          <button class={'opcao' + (temas.length === 0 ? ' on' : '')} onClick={() => mudar({ temas: [] })}>
            {t('todos')}
          </button>
          {Object.entries(TEMAS).map(([id, n]) => (
            <button key={id} class={'opcao' + (temas.includes(id) ? ' on' : '')} onClick={() => alternarTema(id)}>
              {nomeJogo(n)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
