import { t, TEMAS } from '../../core/i18n';
import { temasWifi } from './conteudo';
import { OPCOES_WIFI, type DefWifi } from './regras';

const NOMES_TEMAS: Record<string, { pt: string; en: string }> = {
  ...TEMAS,
  esportes: { pt: 'Esportes', en: 'Sports' },
  fantasia: { pt: 'Fantasia', en: 'Fantasy' },
  lugares: { pt: 'Lugares', en: 'Places' },
  natureza: { pt: 'Natureza', en: 'Nature' },
  objetos: { pt: 'Objetos', en: 'Objects' },
  profissoes: { pt: 'Profissões', en: 'Jobs' },
  transportes: { pt: 'Transportes', en: 'Transport' },
};

/** opções da Senha do Wi-Fi (telemóvel do líder) */
export function DefinicoesWifi({ def, mudar, idioma }: { def: DefWifi; mudar: (d: Partial<DefWifi>) => void; idioma: string }) {
  const grupo = (rotulo: string, chave: 'pistas' | 'responder') => (
    <div>
      <label>{rotulo}</label>
      <div class="opcoes">
        {OPCOES_WIFI[chave].map((n) => (
          <button key={n} class={'opcao' + (def[chave] === n ? ' on' : '')} onClick={() => mudar({ [chave]: n })}>
            {n} s
          </button>
        ))}
      </div>
    </div>
  );
  const temas = temasWifi();
  const alternar = (tema: string) => {
    const novo = def.temas.includes(tema) ? def.temas.filter((x) => x !== tema) : [...def.temas, tema];
    mudar({ temas: novo.length === temas.length ? [] : novo });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      {grupo(t('swPistas'), 'pistas')}
      {grupo(t('swResponder'), 'responder')}
      <div>
        <label>{t('swEquipas')}</label>
        <div class="opcoes">
          {(['sorteio', 'mao'] as const).map((m) => (
            <button key={m} class={'opcao' + (def.equipas === m ? ' on' : '')} onClick={() => mudar({ equipas: m })}>
              {m === 'sorteio' ? t('swSorteio') : t('swMao')}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label>{t('swTemas')}</label>
        <div class="opcoes">
          <button class={'opcao' + (def.temas.length === 0 ? ' on' : '')} onClick={() => mudar({ temas: [] })}>
            {t('swTodos')}
          </button>
          {temas.map((tema) => (
            <button key={tema} class={'opcao' + (def.temas.includes(tema) ? ' on' : '')} onClick={() => alternar(tema)}>
              {(idioma === 'en' ? NOMES_TEMAS[tema]?.en : NOMES_TEMAS[tema]?.pt) ?? tema}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
