import { useState } from 'preact/hooks';
import { t } from '../core/i18n';
import { CATALOGO, descricao, motivo, nome, ordenarMenu, type InfoJogo } from '../core/jogos';
import type { AcaoSala, VistaSala } from '../core/sala';
import { textoMotivo } from '../tv/Tv';
import { COM_ECRAS, acaoDefinir, opcoesNaVista } from '../jogos/ecras';
import { Boneco, Pensando } from '../ui/comuns';
import { PopupModos } from '../ui/modos';

/**
 * Menu de jogos do telemóvel do líder (com e sem TV; pedido de 20/11):
 * sem pesquisa nem filtros; os que dão para jogar em cima, por duração; os que não dão no fim, esbatidos com o porquê.
 * Tocar num jogo abre o popup dele (vídeo, ⚙️ opções, "Mostrar tutorial a todos", "Jogar").
 */
export function MenuJogos({ vista, enviar, fechar }: { vista: VistaSala; enviar: (a: AcaoSala) => void; fechar: () => void }) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [modos, setModos] = useState(false);
  const n = vista.jogadores.filter((j) => j.ligado).length;
  const lista = ordenarMenu(CATALOGO, n, vista.semTv);
  const jogo = lista.find((j) => j.id === aberto);

  return (
    <div class="pag menu-tel">
      <div class="topo">
        <h2 style={{ margin: 0 }}>🕹️ {t('escolherJogo')}</h2>
        <button class="chip" onClick={fechar} aria-label={t('fecharMenu')}>
          ✕
        </button>
      </div>
      {/* modos (Fase 5): Aleatório e Torneio, no mesmo popup (src/ui/modos.tsx) */}
      <button class="botao sec" style={{ width: '100%', marginBottom: 10 }} onClick={() => setModos(true)}>
        {t('mjAleatorio')} · {t('mjTorneio')}
      </button>
      <ol class="lista-tel">
        {lista.map((j) => {
          const m = motivo(j, n, vista.semTv);
          return (
            <li key={j.id}>
              <button class={'cartao item-tel' + (m ? ' esbatido' : '')} onClick={() => setAberto(j.id)}>
                <span class="item-tel-cab">
                  <b>{nome(j, vista.idioma)}</b>
                  <small>
                    ⏱ {j.minutos} min · 👥 {j.min}–{j.max}
                  </small>
                </span>
                {m && <small class="porque">⚠ {textoMotivo(j, n, vista.semTv)}</small>}
              </button>
            </li>
          );
        })}
      </ol>
      {modos && <PopupModos vista={vista} n={n} enviar={enviar} fechar={() => setModos(false)} aoJogar={fechar} />}
      {jogo && <PopupJogo j={jogo} vista={vista} n={n} enviar={enviar} fechar={() => setAberto(null)} aoJogar={fechar} />}
    </div>
  );
}

/** popup de um jogo: vídeo do tutorial, ⚙️ (opções num 2.º popup por cima), "Mostrar tutorial a todos" e "Jogar" */
function PopupJogo({ j, vista, n, enviar, fechar, aoJogar }: { j: InfoJogo; vista: VistaSala; n: number; enviar: (a: AcaoSala) => void; fechar: () => void; aoJogar: () => void }) {
  const [opcoes, setOpcoes] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const m = motivo(j, n, vista.semTv);
  // opções do jogo (sem TV não há as dos jogos "só com TV")
  const reg = COM_ECRAS.find((x) => x.id === j.id && !(x.soTv && vista.semTv));
  return (
    <>
      <div class="popup" onClick={fechar}>
        <div class="cartao popup-jogo" role="dialog" aria-modal="true" aria-label={nome(j, vista.idioma)} onClick={(e) => e.stopPropagation()}>
          <div class="topo">
            {reg ? (
              <button class="botao-icone" onClick={() => setOpcoes(true)} aria-label={t('mjOpcoes')} title={t('mjOpcoes')}>
                ⚙️
              </button>
            ) : (
              <span />
            )}
            <button class="botao-icone" onClick={fechar} aria-label={t('fechar')} title={t('fechar')}>
              ✕
            </button>
          </div>
          <div class="video">
            <span>▶ {t('videoEmBreve')}</span>
          </div>
          <h2 style={{ margin: '10px 0 0' }}>{nome(j, vista.idioma)}</h2>
          <p class="desc">{descricao(j, vista.idioma)}</p>
          <p class="mini">
            ⏱ {t('minutosN', { m: j.minutos })} · 👥 {t('jogadoresN', { a: j.min, b: j.max })}
          </p>
          {m ? (
            <p class="porque">⚠ {textoMotivo(j, n, vista.semTv)}</p>
          ) : (
            <>
              <label class="linha">
                <input type="checkbox" checked={tutorial} onChange={(e) => setTutorial(e.currentTarget.checked)} /> {t('mjTutorialTodos')}
              </label>
              <button
                class="botao grande"
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => {
                  enviar({ tipo: 'jogar', id: '', jogo: j.id, tutorial });
                  aoJogar();
                }}
              >
                ▶ {t('jogar')}
              </button>
            </>
          )}
        </div>
      </div>
      {opcoes && reg && (
        <div class="popup por-cima" onClick={() => setOpcoes(false)}>
          <div class="cartao" role="dialog" aria-modal="true" aria-label={t('mjOpcoes')} onClick={(e) => e.stopPropagation()}>
            <div class="topo">
              <h3 style={{ margin: 0 }}>⚙️ {nome(j, vista.idioma)}</h3>
              <button class="botao-icone" onClick={() => setOpcoes(false)} aria-label={t('fechar')}>
                ✕
              </button>
            </div>
            {reg.e.opcoes.render({ def: opcoesNaVista(vista, reg), sala: vista, n, mudar: (d) => enviar(acaoDefinir(reg, d)) })}
            <button class="botao sec" style={{ width: '100%', marginTop: 12 }} onClick={() => setOpcoes(false)}>
              {t('fechar')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Depois de "Jogar" (todos os telemóveis): quem já está pronto; cada um carrega em "Pronto".
 * O líder tem "Cancelar" e "Forçar início". Começa sozinho quando todos estão prontos (src/core/sala.ts).
 */
export function Preparar({ vista, eu, enviar }: { vista: VistaSala; eu: string; enviar: (a: AcaoSala) => void }) {
  const p = vista.preparar;
  if (!p) return null;
  const j = CATALOGO.find((x) => x.id === p.jogo);
  const souLider = vista.vipId === eu;
  const meu = vista.jogadores.find((x) => x.id === eu);
  const gente = vista.jogadores.filter((x) => x.ligado && !x.bot);
  const prontos = gente.filter((x) => x.pronto).length;
  return (
    <div class="popup">
      <div class="cartao centro" role="dialog" aria-modal="true" aria-label={j ? nome(j, vista.idioma) : ''}>
        <h2 style={{ margin: 0 }}>{j ? nome(j, vista.idioma) : ''}</h2>
        <p class="mini" style={{ margin: '4px 0 10px' }}>
          {t('prontos', { n: prontos, t: gente.length })}
        </p>
        <div class="fila-bonecos" style={{ marginBottom: 12 }}>
          {gente.map((x) => (
            <Boneco key={x.id} j={x} tam={48} marca={x.pronto ? '✓' : <Pensando />} />
          ))}
        </div>
        <button class={'botao grande' + (meu?.pronto ? ' sec' : '')} style={{ width: '100%' }} onClick={() => enviar({ tipo: 'pronto', id: '', pronto: !meu?.pronto })}>
          {meu?.pronto ? t('prontoOk') : t('pronto')}
        </button>
        {souLider && (
          <div class="linha" style={{ marginTop: 10 }}>
            <button class="botao sec cresce" onClick={() => enviar({ tipo: 'preparar_cancelar', id: '' })}>
              {t('cancelar')}
            </button>
            <button class="botao sec cresce" onClick={() => enviar({ tipo: 'forcar', id: '' })}>
              ⏩ {t('mjForcar')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
