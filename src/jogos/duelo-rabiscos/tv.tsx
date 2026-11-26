import { t } from '../../core/i18n';
import { Temporizador } from '../../ui/comuns';
import { ColmeiaDuelo } from './colmeia';
import { BatalhaOuUltima, CantoMago, Classificacao, Palco, faixa, useBatalhaNova, useEsperaBatalha, type PropsDuelo } from './comuns';
import { PREPARACAO, type Desenhos } from './regras';
import { TXT } from './textos';
import { centroHex } from './artes/tabuleiro';
import { ler } from './tabuleiro';

/** `desenhos`: a TV lê-os do estado (`desenhosDuelo(g)`), não da vista */
export function TvDuelo({ sala, v, agora, desenhos, selFim = 0, onOutraVez, onMenu }: PropsDuelo & { desenhos: Desenhos; selFim?: number; onOutraVez: () => void; onMenu: () => void }) {
  const nova = useBatalhaNova(v, true);
  const espera = useEsperaBatalha(v);
  // cada mago do lado do seu canto na colmeia (de cima para baixo), com 2, 3 ou 4
  const sitio = v.participantes.map((id, i) => ({ id, ...centroHex(...ler(v.tabuleiro.cantos[i] ?? '0,0')) }));
  const meio = sitio.reduce((s, x) => s + x.x, 0) / Math.max(1, sitio.length);
  const lado = (k: number) =>
    sitio
      .filter((x, i) => (sitio.length === 2 ? i === k : x.x > meio === (k === 1)))
      .sort((a, b) => a.y - b.y)
      .map(({ id }) => <CantoMago key={id} sala={sala} v={v} id={id} />);
  return (
    <div class="pag tv jogo-duelo">
      <div class="topo">
        <span>
          {TXT.nome}
          {v.volta > 0 && ' · ' + TXT.volta(v.volta)}
        </span>
        {!PREPARACAO.includes(v.fase) && v.fase !== 'fim' && (
          <b class="dr-faixa" role="status">
            {faixa(sala, v)}
          </b>
        )}
        {v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.pausaRestante} agora={agora} />}
      </div>
      {v.pausaRestante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}
      {PREPARACAO.includes(v.fase) ? (
        <Palco sala={sala} v={v} />
      ) : v.fase === 'fim' ? (
        <>
          {nova && <BatalhaOuUltima sala={sala} v={v} desenhos={desenhos} tam={64} />}
          <Classificacao sala={sala} v={v} tam={72} />
          <div class="linha">
            <button class={'botao' + (selFim === 0 ? ' foco' : '')} onClick={onOutraVez}>
              {t('jogarOutraVez')}
            </button>
            <button class={'botao sec' + (selFim === 1 ? ' foco' : '')} onClick={onMenu}>
              {t('menu')}
            </button>
          </div>
        </>
      ) : (
        <div class="dr-mesa">
          <div class="dr-coluna">{lado(0)}</div>
          <div class="dr-centro">
            <ColmeiaDuelo v={v} desenhos={desenhos} />
            {(nova || v.fase === 'batalha') && !espera && (
              <div class="dr-por-cima">
                <BatalhaOuUltima sala={sala} v={v} desenhos={desenhos} tam={84} />
              </div>
            )}
          </div>
          <div class="dr-coluna fim">{lado(1)}</div>
        </div>
      )}
    </div>
  );
}
