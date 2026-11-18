import type { VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { Estado, avatarDe, nomeDe } from '../5050/tv';
import { PlacarSevira, SlideBranco } from './comuns';
import type { Reacao, VistaSevira } from './regras';

export interface PropsSevira {
  sala: VistaSala;
  v: VistaSevira;
  agora: () => number;
}

/** reações a voar por baixo do slide */
function Reacoes({ lista }: { lista: Reacao[] }) {
  return (
    <div class="sv-reacoes" aria-hidden="true">
      {lista.map((r) => (
        <span key={r.n} class="sv-voa" style={{ left: `${5 + ((r.n * 37) % 90)}%` }}>
          {r.r}
        </span>
      ))}
    </div>
  );
}

export function TvSevira({
  sala,
  v,
  agora,
  extra,
  selFim = 0,
  onOutraVez,
  onMenu,
}: PropsSevira & { extra: { imagem: string | null; reacoes: Reacao[] }; selFim?: number; onOutraVez: () => void; onMenu: () => void }) {
  const a = v.apresentador;
  const nome = a ? nomeDe(sala, a) : '';
  return (
    <div class="pag tv jogo-sevira">
      <div class="topo">
        <span>{a ? `${t('svReuniao')} · ${nome}` : t('svOpcoesNome')}</span>
        {v.fase === 'apresentar' && <span>{t('svSlideDe', { n: v.slide + 1, t: v.nSlides })}</span>}
        {v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
      </div>
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}

      {v.fase === 'preparar' && (
        <div class="sv-centro">
          <h1 class="pergunta">{t('svPreparar')}</h1>
          <p class="centro">{t('svPrepararDica')}</p>
          <Estado sala={sala} ids={v.participantes} feitos={v.enviaram} tam={96} />
        </div>
      )}

      {v.fase === 'tema' && a && (
        <div class="sv-centro">
          <div class="sv-slide sv-capa">
            <div class="sv-slide-cab">
              <span>{t('svReuniao')}</span>
              <span>NOB Corp.</span>
            </div>
            <div class="sv-slide-corpo">
              <h1 class="sv-titulo">{v.titulo}</h1>
              <div class="sv-orador">
                <Avatar n={avatarDe(sala, a)} tam={96} />
                <span>{nome}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {v.fase === 'apresentar' && v.slideAtual && (
        <div class="sv-centro">
          <SlideBranco sala={sala} titulo={v.titulo ?? ''} s={v.slideAtual} imagem={extra.imagem} n={v.slide + 1} total={v.nSlides} chave={`${a}:${v.slide}`} />
          <Reacoes lista={extra.reacoes} />
        </div>
      )}

      {v.fase === 'nota' && a && (
        <div class="sv-centro">
          <h1 class="pergunta">{t('svNotaPara', { nome })}</h1>
          <div class="sv-orador">
            <Avatar n={avatarDe(sala, a)} tam={140} />
          </div>
          <Estado sala={sala} ids={[...v.participantes, ...v.audiencia].filter((id) => id !== a && sala.jogadores.some((j) => j.id === id && j.ligado))} feitos={v.deram} tam={72} />
        </div>
      )}

      {v.fase === 'fim' && (
        <>
          <h1 class="pergunta">{t('fim')}</h1>
          <div class="cartao">
            <PlacarSevira sala={sala} v={v} tam={80} />
          </div>
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
