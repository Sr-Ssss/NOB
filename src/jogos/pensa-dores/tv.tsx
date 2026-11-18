import type { VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Estado } from '../5050/tv';
import { Autor, LETRAS, PlacarPensa, Topo, Votos, textoP } from './comuns';
import type { VistaPensa } from './regras';

export interface PropsPensa {
  sala: VistaSala;
  v: VistaPensa;
  agora: () => number;
}

/** quadro de giz (visual B: azul-noite com moldura creme) */
export function Quadro({ children, class: c = '' }: { children: preact.ComponentChildren; class?: string }) {
  return (
    <div class={'quadro ' + c}>
      <div class="quadro-giz">{children}</div>
    </div>
  );
}

function colunas(n: number): number {
  return n <= 4 ? Math.max(1, n) : n <= 9 ? 3 : 4;
}

export function TvPensa({ sala, v, agora, selFim = 0, onOutraVez, onMenu }: PropsPensa & { selFim?: number; onOutraVez: () => void; onMenu: () => void }) {
  const r = v.resultado;
  const pergunta = textoP(v.pergunta, sala);
  return (
    <div class="pag tv jogo-pensa">
      <Topo v={v} agora={agora} />
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}

      {(v.fase === 'escrever' || v.fase === 'final_escrever') && (
        <Quadro>
          <h1 class="giz-titulo">{v.fase === 'escrever' ? t('pdEscrever') : pergunta}</h1>
          {v.fase === 'final_escrever' && <p class="giz-sub">{t('pdFinal')}</p>}
          <Estado sala={sala} ids={v.participantes} feitos={v.enviaram} tam={96} />
        </Quadro>
      )}

      {v.fase === 'votar' && (
        <Quadro>
          <h1 class="giz-titulo">{pergunta}</h1>
          <div class="giz-caixas" style={{ gridTemplateColumns: `repeat(${v.opcoes.length}, 1fr)` }}>
            {v.opcoes.map((o, i) => (
              <div key={i} class="giz-caixa">
                <span><span class="giz-letra">{LETRAS[i]})</span> {o.texto}</span>
              </div>
            ))}
          </div>
          <p class="giz-sub">{t('pdVoteMais')}</p>
          <Estado sala={sala} ids={v.votantes} feitos={v.votaram} tam={60} />
        </Quadro>
      )}

      {v.fase === 'revelar' && r && (
        <Quadro>
          <h1 class="giz-titulo">{textoP(r.pergunta, sala)}</h1>
          <div class="giz-caixas" style={{ gridTemplateColumns: `repeat(${r.opcoes.length}, 1fr)` }}>
            {r.opcoes.map((o, i) => (
              <div key={o.autor} class={'giz-caixa' + (o.arrasou ? ' destaque' : '')}>
                <span><span class="giz-letra">{LETRAS[i]})</span> {o.texto}</span>
                {!r.semAdversario && <Votos sala={sala} o={o} mostrar={v.def.mostrarVotos} tam={56} />}
                <Autor sala={sala} o={o} tam={64} />
              </div>
            ))}
          </div>
          {r.semAdversario && <p class="giz-sub">{t('pdSemAdversario')}</p>}
        </Quadro>
      )}

      {(v.fase === 'final_votar' || v.fase === 'final_revelar') && (
        <Quadro>
          <h1 class="giz-titulo pequeno">{pergunta}</h1>
          <div class="giz-grelha" style={{ gridTemplateColumns: `repeat(${colunas(v.fase === 'final_votar' ? v.opcoes.length : v.resultadoFinal.length)}, 1fr)` }}>
            {v.fase === 'final_votar'
              ? v.opcoes.map((o, i) => (
                  <div key={i} class="giz-caixa">
                    {o.texto}
                  </div>
                ))
              : v.resultadoFinal.map((o) => (
                  <div key={o.autor} class="giz-caixa">
                    {o.texto}
                    <Votos sala={sala} o={o} mostrar={v.def.mostrarVotos} tam={36} />
                    <Autor sala={sala} o={o} tam={44} />
                  </div>
                ))}
          </div>
          {v.fase === 'final_votar' && (
            <>
              <p class="giz-sub">{t('pdFinalVotar')}</p>
              <Estado sala={sala} ids={v.votantes} feitos={v.votaram} tam={52} />
            </>
          )}
        </Quadro>
      )}

      {v.fase === 'placar' && (
        <div class="cartao">
          <h2>{t('placar')}</h2>
          <PlacarPensa sala={sala} v={v} tam={72} />
        </div>
      )}

      {v.fase === 'fim' && (
        <>
          <h1 class="pergunta">{t('fim')}</h1>
          <div class="cartao">
            <PlacarPensa sala={sala} v={v} tam={80} />
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
