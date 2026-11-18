import { useEffect, useState } from 'preact/hooks';
import { t } from '../core/i18n';
import { CATALOGO, descricao, filtrar, motivo, nome, type Filtro } from '../core/jogos';
import type { AcaoSala, VistaSala } from '../core/sala';
import { FILTROS, textoMotivo } from '../tv/Tv';
import { COM_ECRAS, acaoDefinir, opcoesNaVista } from '../jogos/ecras';
import { jogoEscolhido, jogosDoLobby } from './lobbyTv';

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
          // opções do jogo (sem TV não há as dos jogos "só com TV")
          const reg = COM_ECRAS.find((x) => x.id === j.id && !x.soTv);
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
                  {reg && reg.e.opcoes.render({ def: opcoesNaVista(vista, reg), sala: vista, n, mudar: (d) => enviar(acaoDefinir(reg, d)) })}
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

/**
 * Lobby do líder com TV (auditoria E2/E3): escolhe um jogo e vê só as opções dele,
 * com a mesma caixa "Mostrar tutorial" do menu sem TV e "Começar" daqui.
 * (OK no comando da TV começa o jogo em destaque na TV, sem tutorial.)
 */
export function OpcoesComTv({ vista, enviar }: { vista: VistaSala; enviar: (a: AcaoSala) => void }) {
  const [id, setId] = useState<string | null>(null);
  const [tutorial, setTutorial] = useState(false);
  const n = vista.jogadores.filter((j) => j.ligado).length;
  const lista = jogosDoLobby();
  const x = jogoEscolhido(lista, id, n);
  if (!x) return null;
  const m = motivo(x.info, n);
  return (
    <div class="cartao">
      <label for="jogo-lobby" style={{ fontWeight: 700 }}>
        {t('opcoesDe')}
      </label>
      <select id="jogo-lobby" value={x.info.id} onChange={(e) => setId(e.currentTarget.value)} style={{ width: '100%', margin: '6px 0 10px' }}>
        {lista.map((y) => (
          <option key={y.info.id} value={y.info.id}>
            {nome(y.info, vista.idioma)}
          </option>
        ))}
      </select>
      {x.reg.e.opcoes.render({ def: opcoesNaVista(vista, x.reg), sala: vista, n, mudar: (d) => enviar(acaoDefinir(x.reg, d)) })}
      {m ? (
        <small class="porque">⚠ {textoMotivo(x.info, n)}</small>
      ) : (
        <>
          <label class="linha">
            <input type="checkbox" checked={tutorial} onChange={(e) => setTutorial(e.currentTarget.checked)} /> {t('verTutorial')}
          </label>
          <button class="botao" style={{ width: '100%' }} onClick={() => enviar({ tipo: 'comecar', id: '', jogo: x.info.id, tutorial })}>
            ▶ {t('comecar')} · {nome(x.info, vista.idioma)}
          </button>
        </>
      )}
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

