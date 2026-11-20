import { useEffect, useRef, useState } from 'preact/hooks';
import type { AcaoSala, VistaSala } from '../../core/sala';
import { t, type Chave } from '../../core/i18n';
import { Avatar, BarraSegurar, Temporizador } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import { limiarVigia, type Privado, type PrivadoPirata, type VistaPirata } from './regras';
import { Palco, PlacarPirata, Revelacao, SIMBOLO, nomePapel, type PropsPirata } from './comuns';
import { Progresso } from '../../ui/ecraunico';
import { AcabarPartida } from '../../ui/acabarPartida';
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

function Identidade({ sala, v, p, aberta = false }: { sala: VistaSala; v: VistaPirata; p: PrivadoPirata | null; aberta?: boolean }) {
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
          <div class="pr-simbolo">{SIMBOLO[p.papel]}</div>
          <h2>{nomePapel(p.papel)}</h2>
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
      )}
      <button class={'pr-botao-id' + (estado === 'mostra' ? ' on' : '')} {...eventosSegurar({ segurar, largar, mostrar: () => setEstado('mostra'), aberto: estado === 'mostra' })}>
        {estado === 'segura' && <BarraSegurar ms={T_SEGURAR} />}
        <span class="rotulo-segurar">{estado === 'segura' ? t('prSegurando') : t('prIdentidade')}</span>
      </button>
    </>
  );
}

/** pergaminho com todos os jogadores; `escolher` = toque num vivo (o mesmo aspeto para todos os papéis) */
function Pergaminho({ sala, v, sel, escolher, ninguem = false }: { sala: VistaSala; v: VistaPirata; sel: string | null | undefined; escolher?: (id: string | null) => void; ninguem?: boolean }) {
  return (
    <div class="pr-pergaminho">
      <div class="pr-rolo" />
      <div class="pr-folha pr-lista">
        {v.participantes.map((id) => {
          const vivo = v.vivos.includes(id);
          return (
            <button key={id} class={'pr-linha' + (sel === id ? ' on' : '')} disabled={!vivo || !escolher} onClick={() => escolher?.(id)}>
              <Avatar n={avatarDe(sala, id)} tam={36} />
              <span>{nomeDe(sala, id)}</span>
            </button>
          );
        })}
        {ninguem && (
          <button class={'pr-linha' + (sel === null ? ' on' : '')} disabled={!escolher} onClick={() => escolher?.(null)}>
            <span class="pr-x">✕</span>
            <span>{t('prNinguem')}</span>
          </button>
        )}
      </div>
      <div class="pr-rolo" />
    </div>
  );
}

/** pergaminho fechado (carta) */
function Fechado() {
  return (
    <div class="pr-pergaminho fechado">
      <div class="pr-rolo" />
      <div class="pr-selo">☠</div>
      <div class="pr-rolo" />
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
      <Pergaminho sala={sala} v={v} sel={atual} escolher={bloqueado ? undefined : setSel} ninguem={ninguem} />
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
  if (!v.participantes.includes(eu)) return sala.semTv ? null : <Frase texto={t('prOlheTv')} />;
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
      <div class="pr-mar">
        <h2>{t('prMar')}</h2>
        <p>{t('prMarTxt')}</p>
      </div>
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
          <div class="pr-pergaminho">
            <div class="pr-rolo" />
            <div class="pr-folha pr-relatorio">{txt}</div>
            <div class="pr-rolo" />
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
          <Frase texto={sala.semTv ? t('conversem') : t('prDiscussao')} />
          {sala.vipId === eu && (
            <button class="botao sec" onClick={() => jogo(enviar, { tipo: 'pr_votar_ja' })}>
              {t('prVotarJa')}
            </button>
          )}
        </>
      );
    case 'artilheiro':
      return <Frase texto={t('prArtilheiroOutros')} />;
    default:
      return sala.semTv ? null : <Frase texto={t('prOlheTv')} />;
  }
}

export function TelemovelPirata({ sala, v, agora, eu, privado, enviar, idAberta }: PropsPirata & { eu: string; privado: PrivadoPirata | null; enviar: Enviar; idAberta?: boolean }) {
  const [ajuda, setAjuda] = useState(false);
  const lider = sala.vipId === eu;
  const fim = v.fase === 'fim';
  // sem TV, um só ecrã: por baixo da minha parte, o que a TV mostraria (igual para todos os papéis)
  const comPalco = sala.semTv && (!v.participantes.includes(eu) || !v.vivos.includes(eu) || !['carta', 'noite', 'votar'].includes(v.fase));
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
          {sala.semTv && <Revelacao sala={sala} v={v} compacto />}
          <div class="cartao">
            <PlacarPirata sala={sala} v={v} tam={36} />
          </div>
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
      {!fim && v.participantes.includes(eu) && <Identidade sala={sala} v={v} p={privado} aberta={idAberta} />}
    </div>
  );
}
