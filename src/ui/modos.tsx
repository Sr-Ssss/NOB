import { useEffect, useState } from 'preact/hooks';
import { t, trocarTextos } from '../core/i18n';
import { CATALOGO, motivo, nome } from '../core/jogos';
import { N_TORNEIO, podioTorneio } from '../core/modos';
import type { AcaoSala, VistaSala } from '../core/sala';
import { Boneco } from './comuns';

/**
 * Modos da Fase 5 (src/core/modos.ts): popup "Aleatório / Torneio" do menu, roleta e placar do torneio.
 * Com e sem TV: a TV (src/tv/Tv.tsx) e os telemóveis (src/jogar/Jogar.tsx) mostram a roleta e o placar.
 */

/** no torneio, o botão do fim de cada jogo ("Jogar outra vez") passa a "Placar do torneio" e o "Menu" a "Sair do torneio" */
export function textosDoModo(v: Pick<VistaSala, 'torneio'>): void {
  trocarTextos(v.torneio?.fase === 'jogo' ? { jogarOutraVez: 'tnSeguir', menu: 'tnSair' } : {});
}

const nomeDe = (id: string, v: VistaSala) => {
  const j = CATALOGO.find((x) => x.id === id);
  return j ? nome(j, v.idioma) : id;
};

/** popup do menu: o líder marca os jogos (por defeito os que dão) e escolhe "Sortear" ou um torneio de 3/5 */
export function PopupModos({ vista, n, enviar, fechar, aoJogar }: { vista: VistaSala; n: number; enviar: (a: AcaoSala) => void; fechar: () => void; aoJogar: () => void }) {
  const dao = CATALOGO.filter((j) => !motivo(j, n, vista.semTv));
  const [marcados, setMarcados] = useState<string[]>(dao.map((j) => j.id));
  const [nT, setNT] = useState<number>(N_TORNEIO[0]);
  const ids = marcados.filter((id) => dao.some((j) => j.id === id));
  const trocar = (id: string) => setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  return (
    <div class="popup por-cima" onClick={fechar}>
      <div class="cartao" role="dialog" aria-modal="true" aria-label={t('mjQuaisJogos')} onClick={(e) => e.stopPropagation()}>
        <div class="topo">
          <h3 style={{ margin: 0 }}>{t('mjQuaisJogos')}</h3>
          <button class="botao-icone" onClick={fechar} aria-label={t('fechar')}>
            ✕
          </button>
        </div>
        <div class="modos-lista">
          {dao.map((j) => (
            <label key={j.id} class="linha">
              <input type="checkbox" checked={marcados.includes(j.id)} onChange={() => trocar(j.id)} /> {nome(j, vista.idioma)}
            </label>
          ))}
        </div>
        {!ids.length && <p class="porque">⚠ {t('mjNenhum')}</p>}
        <button
          class="botao grande"
          style={{ width: '100%', marginTop: 10 }}
          disabled={!ids.length}
          onClick={() => {
            enviar({ tipo: 'aleatorio', id: '', jogos: ids });
            aoJogar();
          }}
        >
          {t('mjSortear')}
        </button>
        <div class="linha" style={{ marginTop: 10 }} role="radiogroup" aria-label={t('mjTorneio')}>
          {N_TORNEIO.map((x) => (
            <button key={x} class={'chip' + (nT === x ? ' ativo' : '')} role="radio" aria-checked={nT === x} onClick={() => setNT(x)}>
              {t('tnJogos', { n: x })}
            </button>
          ))}
        </div>
        <button
          class="botao sec"
          style={{ width: '100%', marginTop: 8 }}
          disabled={!ids.length}
          onClick={() => {
            enviar({ tipo: 'torneio', id: '', jogos: ids, n: nT });
            aoJogar();
          }}
        >
          {t('tnComecar')}
        </button>
      </div>
    </div>
  );
}

/** a roleta: passa pelos jogos e abranda até parar no sorteado (sem movimento: mostra logo o sorteado) */
export function Roleta({ vista, agora, tv }: { vista: VistaSala; agora: () => number; tv?: boolean }) {
  const r = vista.roleta;
  const [, setTic] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTic((x) => x + 1), 90);
    return () => clearInterval(id);
  }, []);
  if (!r) return null;
  const falta = r.ate - agora();
  const parado = falta <= 400 || matchMedia('(prefers-reduced-motion: reduce)').matches;
  // abranda: o passo cresce à medida que o fim se aproxima
  const i = parado ? r.opcoes.indexOf(r.jogo) : Math.floor(Math.sqrt(Math.max(0, 3000 - falta)) / 3) % r.opcoes.length;
  return (
    <div class={'popup roleta' + (tv ? ' tv' : '')} role="dialog" aria-modal="true" aria-label={t('roletaGira')}>
      <div class="cartao centro">
        <p class="mini">{vista.torneio ? `${t('tnTitulo')} · ${t('tnJogoN', { a: vista.torneio.feitos.length + 1, b: vista.torneio.total })}` : t('mjAleatorio')}</p>
        <h2 aria-live="polite">{parado ? '🎯 ' : '🎲 '}{nomeDe(r.opcoes[i] ?? r.jogo, vista)}</h2>
        {!parado && <p class="mini">{t('roletaGira')}</p>}
      </div>
    </div>
  );
}

/** placar do torneio: entre jogos ("Jogo 2 de 5", pontos ganhos) e no fim (pódio); o líder segue ou sai */
export function PlacarTorneio({ vista, lider, enviar, tv }: { vista: VistaSala; lider: boolean; enviar: (a: AcaoSala) => void; tv?: boolean }) {
  const tn = vista.torneio;
  if (!tn) return null;
  const ids = [...new Set([...Object.keys(tn.placar), ...vista.jogadores.filter((j) => j.ligado).map((j) => j.id)])].filter((id) => vista.jogadores.some((j) => j.id === id));
  const fim = tn.fase === 'fim';
  const ultimo = tn.feitos[tn.feitos.length - 1];
  return (
    <div class={'pag placar-torneio' + (tv ? ' tv' : '')}>
      <h1 class="centro">🏆 {fim ? t('tnCampeao') : t('tnJogoN', { a: tn.feitos.length, b: tn.total })}</h1>
      {ultimo && !fim && <p class="centro mini">{nomeDe(ultimo, vista)}</p>}
      <ol class="cartao lista-placar">
        {podioTorneio(tn, ids).map((p) => {
          const j = vista.jogadores.find((x) => x.id === p.id)!;
          return (
            <li key={p.id} class="linha">
              <b>{fim && p.lugar <= 3 ? ['🥇', '🥈', '🥉'][p.lugar - 1] : `${p.lugar}.º`}</b>
              <Boneco j={j} tam={tv ? 64 : 36} />
              <span class="cresce">{j.nome}</span>
              {!fim && !!tn.ultimo[p.id] && <small>+{tn.ultimo[p.id]}</small>}
              <b>{p.pontos}</b>
            </li>
          );
        })}
      </ol>
      {lider ? (
        <div class="linha">
          {!fim && (
            <button class="botao cresce" onClick={() => enviar({ tipo: 'torneio_prox', id: '' })}>
              {t('tnProximo')}
            </button>
          )}
          <button class={'botao' + (fim ? ' cresce' : ' sec')} onClick={() => enviar({ tipo: 'menu', id: '' })}>
            {fim ? t('menu') : t('tnSair')}
          </button>
        </div>
      ) : (
        !tv && <p class="centro mini">{t('esperaVip', { nome: vista.jogadores.find((j) => j.id === vista.vipId)?.nome ?? '…' })}</p>
      )}
    </div>
  );
}
