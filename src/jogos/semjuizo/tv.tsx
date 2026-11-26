import { t } from '../../core/i18n';
import { Temporizador } from '../../ui/comuns';
import { Estado } from '../5050/tv';
import { FolhaCaso, Martelos, Mesa, Partes, PlacarSj, ResultadoSj, aVotarFase, marcadasDe, narrar, txt, type PropsSemJuizo } from './comuns';

export function TvSemJuizo({
  sala,
  v,
  agora,
  fotos,
  selFim = 0,
  onOutraVez,
  onMenu,
}: PropsSemJuizo & { fotos: Record<string, string>; selFim?: number; onOutraVez: () => void; onMenu: () => void }) {
  const comMesa = !['caso', 'provas', 'revelar', 'fim'].includes(v.fase);
  return (
    <div class="pag tv jogo-semjuizo">
      <div class="topo">
        <span>{v.fase === 'fim' ? t('sjNome') : t('sjJulgamento', { n: v.julgamento + 1, t: v.total })}</span>
        {v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
      </div>
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}

      {(v.fase === 'caso' || v.fase === 'provas') && (
        <>
          <FolhaCaso sala={sala} caso={v.caso} titulo={t('sjCrime')} />
          <Partes sala={sala} v={v} tam={150} />
          {v.fase === 'provas' && (
            <>
              <h2 class="centro">{narrar(sala, v)}</h2>
              <Estado sala={sala} ids={v.juri} feitos={v.feitos} tam={64} />
            </>
          )}
        </>
      )}

      {comMesa && (
        <>
          <p class="sj-caso-linha">{txt(v.caso, sala)}</p>
          <div class="sj-tv-linha">
            <Mesa v={v} fotos={fotos} marcadas={marcadasDe(v)} />
            <Partes sala={sala} v={v} tam={110} />
          </div>
          <h1 class="sj-narra">{narrar(sala, v)}</h1>
          {aVotarFase(v) && <Martelos sala={sala} v={v} tam={64} />}
          {v.fase === 'estrela' && <Estado sala={sala} ids={[...(v.juiz ? [v.juiz] : []), ...v.juri]} feitos={v.feitos} tam={56} />}
        </>
      )}

      {v.fase === 'revelar' && <ResultadoSj sala={sala} v={v} fotos={fotos} />}

      {v.fase === 'fim' && (
        <>
          <h1 class="pergunta">{t('fim')}</h1>
          <PlacarSj sala={sala} v={v} tam={56} />
          <div class="linha">
            <button class={'botao' + (selFim === 0 ? ' foco' : '')} onClick={onOutraVez}>
              {t('jogarOutraVez')}
            </button>
            <button class={'botao sec' + (selFim === 1 ? ' foco' : '')} onClick={onMenu}>
              {t('menu')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
