import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { AcaoSala, VistaSala } from '../../core/sala';
import { t, type Chave } from '../../core/i18n';
import { Avatar, BarraSegurar, Temporizador } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import { limiarVigia, type Privado, type PrivadoPirata, type VistaPirata } from './regras';
import { Cartaz, Palco, Revelacao, Vigia, type PropsPirata } from './comuns';
import { PodioEscada } from '../../ui/podio';
import { Progresso } from '../../ui/ecraunico';
import { AcabarPartida } from '../../ui/acabarPartida';
import { BotaoPopup } from '../../ui/verPopup';
import { chaveSegurar, eventosSegurar } from '../../ui/acessibilidade';

type Enviar = (a: AcaoSala) => void;
const jogo = (enviar: Enviar, acao: Record<string, unknown>) => enviar({ tipo: 'jogo', acao: { id: '', ...acao } as never });
export const T_SEGURAR = 3000;

/**
 * Botão "Identidade" (info/arquitetura.md → regra dos papéis secretos): segurar 3 s mostra
 * símbolo + papel (e os segredos desta fase); ao largar, some.
 */
/** `aberta`: só para as capturas (demo) */
function textoResultado(r: Privado, nome: (id: string) => string): string {
  return r.tipo === 'vigia' ? t(r.pirata ? 'prVigiaSim' : 'prVigiaNao', { nome: nome(r.alvo) }) : t(r.saiu ? 'prSaiu' : 'prNaoSaiu', { nome: nome(r.alvo) });
}

function Identidade({ sala, v, eu, p, aberta = false }: { sala: VistaSala; v: VistaPirata; eu: string; p: PrivadoPirata | null; aberta?: boolean }) {
  const [estado, setEstado] = useState<'nada' | 'segura' | 'mostra'>(aberta ? 'mostra' : 'nada');
  const tempo = useRef<number | undefined>(undefined);
  const largar = () => {
    clearTimeout(tempo.current);
    setEstado('nada');
  };
  useEffect(() => () => clearTimeout(tempo.current), []);
  const segurar = (e: Event) => {
    e.preventDefault();
    setEstado('segura');
    tempo.current = window.setTimeout(() => setEstado('mostra'), T_SEGURAR);
  };
  const nome = (id: string) => nomeDe(sala, id);
  const n = limiarVigia(v.def, v.participantes.length, v.vivos.length);
  const acao = p?.papel === 'marinheiro' && n === null ? 'prAcao_marinheiroSem' : 'prAcao_' + p?.papel;
  return (
    <>
      {estado === 'mostra' && p?.papel && (
        <div class="pr-identidade" role="dialog" aria-live="assertive">
          <Cartaz sala={sala} id={eu} papel={p.papel} />
          <div class="pr-id-txt">
          {v.fase === 'noite' && p.vivo && <p>{t(acao as Chave, { n: n ?? '' })}</p>}
          <p class="mini">{p.papel === 'pirata' ? t('prObjetivo_pirata') : t('prObjetivo_outro')}</p>
          {p.companheiros.length > 0 && <p>{t('prCompanheiros', { nomes: p.companheiros.map(nome).join(', ') })}</p>}
          {Object.entries(p.votosPiratas).map(([id, alvo]) => (
            <p key={id} class="mini">
              {t('prVotou', { nome: nome(id), alvo: nome(alvo) })}
            </p>
          ))}
          {v.fase === 'noite' && p.bloqueado && <p class="mini">{t('prBloqueado', { nome: nome(p.bloqueado) })}</p>}
          {p.diario?.length > 0 && (
            <div class="pr-descobriu">
              <p class="mini">{t('prDescobriu')}</p>
              {p.diario.map((r) => (
                <p key={r.n + r.alvo} class="mini">
                  {t('prNoiteN', { n: r.n })}: {textoResultado(r, nome)}
                </p>
              ))}
            </div>
          )}
          </div>
        </div>
      )}
      <button class={'pr-botao-id' + (estado === 'mostra' ? ' on' : '')} {...eventosSegurar({ segurar, largar, mostrar: () => setEstado('mostra'), aberto: estado === 'mostra' })}>
        {estado === 'segura' && <BarraSegurar ms={T_SEGURAR} />}
        <span class="rotulo-segurar">{estado === 'segura' ? t('prSegurando') : t('prIdentidade')}</span>
      </button>
    </>
  );
}

/** mini-cartazes de todos os jogadores; `escolher` = toque num vivo (o mesmo aspeto para todos os papéis).
 *  Colunas e altura das filas pelo nº de jogadores, para caber em 360×640 sem scroll. */
function Pergaminho({ sala, v, sel, escolher, ninguem = false, alt }: { sala: VistaSala; v: VistaPirata; sel: string | null | undefined; escolher?: (id: string | null) => void; ninguem?: boolean; alt: number }) {
  const n = v.participantes.length + (ninguem ? 1 : 0);
  const cols = n <= 6 ? 2 : n <= 12 ? 3 : 4;
  const filas = Math.ceil(n / cols);
  return (
    <div class="pr-lista" style={{ '--cols': cols, '--fila': `min(112px, ${Math.floor((alt - (filas - 1) * 6) / filas)}px)` }}>
      {v.participantes.map((id, k) => {
        const vivo = v.vivos.includes(id);
        return (
          <button key={id} class={'pr-mini' + (sel === id ? ' on' : '')} style={{ '--rot': [-2, 1.5, 1, -1.5, -1, 2][k % 6] + 'deg' }} disabled={!vivo || !escolher} onClick={() => escolher?.(id)}>
            <Avatar n={avatarDe(sala, id)} tam={60} />
            <span>{nomeDe(sala, id)}</span>
          </button>
        );
      })}
      {ninguem && (
        <button class={'pr-mini' + (sel === null ? ' on' : '')} disabled={!escolher} onClick={() => escolher?.(null)}>
          <span class="pr-x">✕</span>
          <span>{t('prNinguem')}</span>
        </button>
      )}
    </div>
  );
}

/** cartaz enrolado com lacre (carta) */
function Fechado() {
  return (
    <div class="pr-enrolado" aria-hidden="true">
      <span class="pr-rolo" />
      <div class="pr-enrolado-papel">
        <small>{t('prProcurado')}</small>
        <b>?</b>
        <span class="pr-faixa" />
        <span class="pr-selo">☠</span>
      </div>
      <span class="pr-rolo" />
    </div>
  );
}

/** ecrã vazio: vigia grande com o mar + frase */
function Espera({ texto, semTv = false, children }: { texto: string; semTv?: boolean; children?: ComponentChildren }) {
  return (
    <div class="pr-espera">
      {/* sem TV o palco vem por baixo: sem a vigia grande */}
      {!semTv && <Vigia />}
      <h2 class="pr-frase">{texto}</h2>
      {children}
    </div>
  );
}

function Escolher({ sala, v, enviada, tipo, ninguem = false, enviar }: { sala: VistaSala; v: VistaPirata; enviada: string | null | undefined; tipo: 'pr_noite' | 'pr_votar' | 'pr_levar'; ninguem?: boolean; enviar: Enviar }) {
  const [sel, setSel] = useState<string | null | undefined>(undefined);
  const atual = sel !== undefined ? sel : enviada;
  const feito = enviada !== undefined && sel === undefined;
  const bloqueado = tipo === 'pr_votar' && enviada !== undefined;
  return (
    <>
      {/* altura livre para a grelha: a votação tem mais uma linha de aviso; o Artilheiro, uma frase de 2 linhas */}
      <Pergaminho sala={sala} v={v} sel={atual} escolher={bloqueado ? undefined : setSel} ninguem={ninguem} alt={ninguem ? 300 : tipo === 'pr_levar' ? 330 : 370} />
      {feito ? (
        <p class="centro pr-ok">{t('prConfirmado')}</p>
      ) : (
        <button
          class="botao grande"
          disabled={sel === undefined}
          onClick={() => {
            jogo(enviar, { tipo, alvo: sel });
            setSel(undefined);
          }}
        >
          {t('prConfirmar')}
        </button>
      )}
    </>
  );
}

function Frase({ texto }: { texto: string }) {
  return <h2 class="pr-frase">{texto}</h2>;
}

function Eu({ sala, v, eu, p, enviar }: { sala: VistaSala; v: VistaPirata; eu: string; p: PrivadoPirata | null; enviar: Enviar }) {
  const vivo = v.vivos.includes(eu);
  const nome = (id: string) => nomeDe(sala, id);
  // sem TV, o palco por baixo já conta o que se passa ("Olhem para a TV" não faz sentido)
  if (!v.participantes.includes(eu)) return sala.semTv ? null : <Espera texto={t('prOlheTv')} />;
  if (v.fase === 'carta')
    return (
      <>
        <Frase texto={t(chaveSegurar('prSegura'))} />
        <Fechado />
      </>
    );
  // o Artilheiro escolhe já fora do jogo
  if (v.fase === 'artilheiro' && v.artilheiro?.id === eu)
    return (
      <>
        <Frase texto={t('prArtilheiroEu')} />
        <Escolher key="levar" sala={sala} v={v} enviada={undefined} tipo="pr_levar" enviar={enviar} />
      </>
    );
  if (!vivo)
    return (
      <Espera texto={t('prMar')} semTv={sala.semTv}>
        <p class="pr-mar-txt">{t('prMarTxt')}</p>
      </Espera>
    );
  switch (v.fase) {
    case 'noite':
      return (
        <>
          <Frase texto={t('prNoiteTel')} />
          <Escolher key={'n' + v.noite} sala={sala} v={v} enviada={p?.escolha ?? undefined} tipo="pr_noite" enviar={enviar} />
        </>
      );
    case 'amanhecer': {
      const r = p?.resultado;
      const txt = r ? textoResultado(r, nome) : t('prNada');
      return (
        <>
          <Frase texto={t('prAmanhecer')} />
          <div class="pr-nota">
            <span class="pr-prego" />
            {txt}
          </div>
        </>
      );
    }
    case 'votar':
      return (
        <>
          <Frase texto={t('prVotar')} />
          <p class="centro mini">{t('prVotoFixo')}</p>
          <Escolher key={'v' + v.noite} sala={sala} v={v} enviada={p && 'voto' in p ? p.voto : undefined} tipo="pr_votar" ninguem enviar={enviar} />
        </>
      );
    case 'discussao':
      return (
        <>
          <Espera texto={sala.semTv ? t('conversem') : t('prDiscussao')} semTv={sala.semTv} />
          {sala.vipId === eu && (
            <button class="botao sec" onClick={() => jogo(enviar, { tipo: 'pr_votar_ja' })}>
              {t('prVotarJa')}
            </button>
          )}
        </>
      );
    case 'artilheiro':
      return <Espera texto={t('prArtilheiroOutros')} semTv={sala.semTv} />;
    default:
      return sala.semTv ? null : <Espera texto={t('prOlheTv')} />;
  }
}

export function TelemovelPirata({ sala, v, agora, eu, privado, enviar, idAberta }: PropsPirata & { eu: string; privado: PrivadoPirata | null; enviar: Enviar; idAberta?: boolean }) {
  const [ajuda, setAjuda] = useState(false);
  const lider = sala.vipId === eu;
  const fim = v.fase === 'fim';
  // sem TV, um só ecrã: por baixo da minha parte, o que a TV mostraria (igual para todos os papéis)
  // o Artilheiro, enquanto escolhe, não precisa do palco (é ele que a TV mostraria)
  const comPalco = sala.semTv && !(v.fase === 'artilheiro' && v.artilheiro?.id === eu) && (!v.participantes.includes(eu) || !v.vivos.includes(eu) || !['carta', 'noite', 'votar'].includes(v.fase));
  const pirata = v.papeis[eu] === 'pirata';
  const ganhei = fim && (v.vencedor === 'piratas') === pirata;
  return (
    <div class="pag jogo-pirata tel">
      <div class="topo">
        <span>{t('prNome')}</span>
        <button class="chip" aria-label={t('comoJogar')} onClick={() => setAjuda(!ajuda)}>
          ⓘ
        </button>
        <AcabarPartida sala={sala} eu={eu} enviar={enviar} />
        {!fim && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
      </div>
      {ajuda && (
        <div class="cartao" onClick={() => setAjuda(false)}>
          <b>{t('prNome')}</b> — {t('ajudaPirata', { segurar: t(chaveSegurar('idSegurar')) })}
        </div>
      )}
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}
      {fim ? (
        <>
          {v.participantes.includes(eu) && (
            <h1 class="pergunta">
              {ganhei ? t('prGanhaste') : t('prPerdeste')} {t('prPontos', { n: v.pontos[eu] ?? 0 })}
            </h1>
          )}
          {/* sem TV: a revelação (papéis e noites) não cabe por cima do placar; abre-se pelo botão */}
          {sala.semTv && (
            <BotaoPopup rotulo="📜 ☠️ 🔭 🩹">
              <Revelacao sala={sala} v={v} compacto />
            </BotaoPopup>
          )}
          <PodioEscada sala={sala} podio={v.podio} />
          {lider && (
            <div class="linha">
              <button class="botao cresce" onClick={() => enviar({ tipo: 'outra_vez', id: '' })}>
                {t('jogarOutraVez')}
              </button>
              <button class="botao sec" onClick={() => enviar({ tipo: 'menu', id: '' })}>
                {t('menu')}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <Eu sala={sala} v={v} eu={eu} p={privado} enviar={enviar} />
          {v.fase === 'votar' && <Progresso semTv={sala.semTv} ids={v.vivos} feitos={v.votaram} />}
          {comPalco && (
            <div class="palco-tel">
              <Palco sala={sala} v={v} compacto />
            </div>
          )}
        </>
      )}
      {!fim && v.participantes.includes(eu) && <Identidade sala={sala} v={v} eu={eu} p={privado} aberta={idAberta} />}
    </div>
  );
}
