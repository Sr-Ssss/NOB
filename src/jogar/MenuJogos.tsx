import { useEffect, useState } from 'preact/hooks';
import { t } from '../core/i18n';
import { CATALOGO, descricao, filtrar, motivo, nome, type Filtro } from '../core/jogos';
import type { AcaoSala, VistaSala } from '../core/sala';
import { FILTROS, Definicoes, textoMotivo } from '../tv/Tv';
import { DefinicoesPensa } from '../jogos/pensa-dores/definicoes';
import { DefinicoesWifi } from '../jogos/senha-wifi/definicoes';
import { DEF_PADRAO_WIFI } from '../jogos/senha-wifi/regras';
import { DefinicoesMona } from '../jogos/mona-lixa/definicoes';
import { DEF_PADRAO_MONA } from '../jogos/mona-lixa/regras';
import { DefinicoesIdeias } from '../jogos/ideias-mirabolantes/definicoes';
import { DEF_PADRAO_IDEIAS } from '../jogos/ideias-mirabolantes/regras';
import { DefinicoesPirata } from '../jogos/pirata/definicoes';
import { DEF_PADRAO_PIRATA } from '../jogos/pirata/regras';

/**
 * Menu de jogos do telemóvel do líder, sem TV: o mesmo conteúdo do menu da TV,
 * mas vertical e sem vídeo (pesquisa, filtros, esbatidos com o porquê).
 */
export function MenuJogos({ vista, enviar, fechar }: { vista: VistaSala; enviar: (a: AcaoSala) => void; fechar: () => void }) {
  const [pesquisa, setPesquisa] = useState('');
  const [filtros, setFiltros] = useState<Filtro[]>([]);
  const [aberto, setAberto] = useState<string | null>(null);
  const [tutorial, setTutorial] = useState(false);
  const n = vista.jogadores.filter((j) => j.ligado).length;
  const lista = filtrar(CATALOGO, pesquisa, filtros, n, vista.idioma);
  const alternar = (f: Filtro) => setFiltros((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]));

  return (
    <div class="pag menu-tel">
      <div class="topo">
        <h2 style={{ margin: 0 }}>{t('escolherJogo')}</h2>
        <button class="chip" onClick={fechar}>
          ✕ {t('fecharMenu')}
        </button>
      </div>
      <input class="pesquisa" placeholder={`🔍 ${t('pesquisar')}`} value={pesquisa} onInput={(e) => setPesquisa(e.currentTarget.value)} />
      <div class="opcoes">
        {FILTROS.map(([f, k]) => (
          <button key={f} class={'chip' + (filtros.includes(f) ? ' on' : '')} onClick={() => alternar(f)}>
            {t(k)}
          </button>
        ))}
      </div>
      <ol class="lista-tel">
        {lista.map((j) => {
          const m = motivo(j, n, vista.semTv);
          const on = aberto === j.id;
          return (
            <li key={j.id} class={'cartao item-tel' + (m ? ' esbatido' : '')}>
              <button class="item-tel-cab" onClick={() => setAberto(on ? null : j.id)}>
                <b>{nome(j, vista.idioma)}</b>
                <small>
                  👥 {j.min}–{j.max} · ⏱ {j.minutos} min
                </small>
              </button>
              {m && <small class="porque">⚠ {textoMotivo(j, n, vista.semTv)}</small>}
              {on && (
                <div class="item-tel-corpo">
                  <p class="desc">{descricao(j, vista.idioma)}</p>
                  {j.id === '5050' && <Definicoes def={vista.def} mudar={(d) => enviar({ tipo: 'definir', id: '', def: d })} />}
                  {j.id === 'wifi' && <DefinicoesWifi def={vista.defWifi ?? DEF_PADRAO_WIFI} idioma={vista.idioma} mudar={(d) => enviar({ tipo: 'definir_wifi', id: '', def: d })} />}
                  {j.id === 'mona' && <DefinicoesMona def={vista.defMona ?? DEF_PADRAO_MONA} n={vista.jogadores.filter((x) => x.ligado).length} mudar={(d) => enviar({ tipo: 'definir_mona', id: '', def: d })} />}
                  {j.id === 'ideias' && <DefinicoesIdeias def={vista.defIdeias ?? DEF_PADRAO_IDEIAS} n={vista.jogadores.filter((x) => x.ligado).length} mudar={(d) => enviar({ tipo: 'definir_ideias', id: '', def: d })} />}
                  {j.id === 'pirata' && <DefinicoesPirata def={vista.defPirata ?? DEF_PADRAO_PIRATA} n={vista.jogadores.filter((x) => x.ligado).length} mudar={(d) => enviar({ tipo: 'definir_pirata', id: '', def: d })} />}
                  {j.id === 'pensa' &&<DefinicoesPensa def={vista.defPensa} mudar={(d) => enviar({ tipo: 'definir_pensa', id: '', def: d })} />}
                  {!m && (
                    <>
                      <label class="linha">
                        <input type="checkbox" checked={tutorial} onChange={(e) => setTutorial(e.currentTarget.checked)} /> {t('verTutorial')}
                      </label>
                      <button
                        class="botao grande"
                        onClick={() => {
                          enviar({ tipo: 'comecar', id: '', jogo: j.id, tutorial });
                          fechar();
                        }}
                      >
                        ▶ {t('comecar')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** tutorial antes do jogo: passa ao mesmo tempo em todos os telemóveis (e na TV) */
export function Tutorial({ vista, eu, enviar, agora }: { vista: VistaSala; eu: string; enviar: (a: AcaoSala) => void; agora: () => number }) {
  const [, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), 500);
    return () => clearInterval(i);
  }, []);
  const j = CATALOGO.find((x) => x.id === vista.tutorial?.jogo);
  const s = Math.max(0, Math.ceil(((vista.tutorial?.ate ?? 0) - agora()) / 1000));
  return (
    <div class="pag centro">
      <h1 class="pergunta">
        {t('tutorial')} · {j ? nome(j, vista.idioma) : ''}
      </h1>
      <div class="video">
        <span>▶ {t('tutorialEmBreve')}</span>
      </div>
      <p class="tempo">{s}</p>
      {vista.vipId === eu && (
        <button class="botao sec" onClick={() => enviar({ tipo: 'saltar', id: '' })}>
          {t('saltar')}
        </button>
      )}
      <div class="rodape-codigo">{vista.codigo}</div>
    </div>
  );
}

