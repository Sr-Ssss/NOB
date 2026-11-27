import { t } from '../../core/i18n';
import { nomeDe } from '../5050/tv';
import { PodioEscada } from '../../ui/podio';
import { Investimento, Palco, Titulo, Vencedora, type PropsIdeias } from './comuns';

/** título de cada fase: rótulo pequeno + frase grande */
function cabeca({ sala, v }: Omit<PropsIdeias, 'agora'>): [string, string] {
  const passo = (n: number) => t('imPasso', { n });
  if (v.fase === 'problema') return [passo(1), t('imProblemaTv')];
  if (v.fase === 'inventar') return [passo(2), t('imInventarTv')];
  if (v.fase === 'pitch') return [t('imInvencao', { n: v.atual + 1, t: v.total }), v.pitch ? t('imPitchDe', { nome: nomeDe(sala, v.pitch.inventor) }) : ''];
  if (v.fase === 'investir') return [passo(4), t('imInvestirTv')];
  if (v.fase === 'revelar') return [passo(5), t('imRanking')];
  const l = v.ranking.find((x) => x.vencedora);
  return [t('imConcedida'), l ? t('imVenceu', { nome: nomeDe(sala, l.inventor) }) : t('fim')];
}

export function TvIdeias({ sala, v, agora, selFim = 0, onOutraVez, onMenu }: PropsIdeias & { selFim?: number; onOutraVez: () => void; onMenu: () => void }) {
  const [rotulo, titulo] = cabeca({ sala, v });
  const venc = v.ranking.find((x) => x.vencedora);
  return (
    <div class="pag tv jogo-ideias">
      <div class="im-mesa">
        <Titulo v={v} agora={agora} rotulo={rotulo} titulo={titulo} />
        {v.fase === 'fim' && venc && <p class="im-arrecadou">{t('imArrecadou', { inv: venc.nome, e: venc.euros })}</p>}
        {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
        {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}
        {v.fase !== 'fim' ? (
          <Palco sala={sala} v={v} />
        ) : (
          <div class="im-fim">
            <Vencedora sala={sala} v={v} />
            <PodioEscada sala={sala} podio={v.podio} tv />
            <div class="im-fim-lado">
              <Investimento sala={sala} v={v} />
              <button class={'botao' + (selFim === 0 ? ' foco' : '')} onClick={onOutraVez}>
                {t('jogarOutraVez')}
              </button>
              <button class={'botao sec' + (selFim === 1 ? ' foco' : '')} onClick={onMenu}>
                {t('menu')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
