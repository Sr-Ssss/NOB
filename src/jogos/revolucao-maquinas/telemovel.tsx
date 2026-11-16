import { useState } from 'preact/hooks';
import type { AcaoSala, VistaSala } from '../../core/sala';
import { t, type Chave } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import { equipaDe, type Carta, type PrivadoMaquinas, type VistaMaquinas } from './regras';
import { COR, Consola, PlacarMaquinas, Segurar, nomePapel, narracao, type PropsMaquinas } from './comuns';

type Enviar = (a: AcaoSala) => void;
const jogo = (enviar: Enviar, acao: Record<string, unknown>) => enviar({ tipo: 'jogo', acao: { id: '', ...acao } as never });

const Frase = ({ texto }: { texto: string }) => <h2 class="rm-frase">{texto}</h2>;

/** lista de jogadores para escolher (Piloto ou alvo de poder) + Confirmar */
function Escolher({ sala, v, podem, tipo, enviar }: { sala: VistaSala; v: VistaMaquinas; podem: string[]; tipo: 'rm_piloto' | 'rm_poder'; enviar: Enviar }) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <>
      <div class="rm-lista">
        {v.participantes
          .filter((id) => v.vivos.includes(id))
          .map((id) => (
            <button key={id} class={'rm-linha' + (sel === id ? ' on' : '')} disabled={!podem.includes(id)} onClick={() => setSel(id)}>
              <Avatar n={avatarDe(sala, id)} tam={36} />
              <span>{nomeDe(sala, id)}</span>
            </button>
          ))}
      </div>
      <button class="botao grande" disabled={!sel} onClick={() => jogo(enviar, { tipo, alvo: sel })}>
        {t('rmConfirmar')}
      </button>
    </>
  );
}

function Cartas({ mao, tipo, enviar }: { mao: Carta[]; tipo: 'rm_descartar' | 'rm_escolher'; enviar: Enviar }) {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <>
      <div class="rm-cartas">
        {mao.map((c, i) => (
          <button key={i} class={'rm-cartao' + (sel === i ? ' on' : '')} onClick={() => setSel(i)}>
            {c === 'R' ? '🔧' : '💥'}
            <small>{c === 'R' ? t('rmReparacao') : t('rmSabotagem')}</small>
          </button>
        ))}
      </div>
      <button class="botao grande" disabled={sel === null} onClick={() => jogo(enviar, { tipo, i: sel })}>
        {t('rmConfirmar')}
      </button>
    </>
  );
}

function Eu({ sala, v, eu, p, enviar }: { sala: VistaSala; v: VistaMaquinas; eu: string; p: PrivadoMaquinas | null; enviar: Enviar }) {
  if (!v.participantes.includes(eu)) return <Frase texto={t('rmOlheTv')} />;
  if (!v.vivos.includes(eu)) return <div class="rm-ejetado"><h2>🚀</h2><p>{t('rmEjetado')}</p></div>;
  const cmd = eu === v.comandante;
  const pil = eu === v.piloto;
  const nome = (id: string | null) => (id ? nomeDe(sala, id) : '');
  switch (v.fase) {
    case 'carta':
      return <Frase texto={t('rmCarta')} />;
    case 'nomear':
      if (!cmd) return <Frase texto={t('rmNomear', { nome: nome(v.comandante) })} />;
      return (
        <>
          <Frase texto={t('rmNomearEu')} />
          <Escolher key="pil" sala={sala} v={v} podem={v.vivos.filter((id) => id !== eu && !v.bloqueados.includes(id))} tipo="rm_piloto" enviar={enviar} />
        </>
      );
    case 'votar': {
      const voto = p?.voto;
      const vivos = v.vivos.length;
      return (
        <>
          <Frase texto={t('rmGoverno', { c: nome(v.comandante), p: nome(v.piloto) })} />
          <div class="rm-votar">
            <button class={'sim' + (voto === true ? ' on' : '')} disabled={voto !== undefined} onClick={() => jogo(enviar, { tipo: 'rm_votar', sim: true })}>
              {t('rmSim')}
            </button>
            <button class={'nao' + (voto === false ? ' on' : '')} disabled={voto !== undefined} onClick={() => jogo(enviar, { tipo: 'rm_votar', sim: false })}>
              {t('rmNao')}
            </button>
          </div>
          <p class="centro">
            {t('rmVotaram', { n: v.votaram.length, t: vivos })} {v.vivos.map((id) => (v.votaram.includes(id) ? '✅' : '❌')).join('')}
          </p>
        </>
      );
    }
    case 'comandante':
      if (cmd && p?.mao.length === 3)
        return (
          <>
            <Frase texto={'🤫 ' + t('rmDescarta')} />
            <Cartas key="d" mao={p.mao} tipo="rm_descartar" enviar={enviar} />
          </>
        );
      return <Frase texto={'🤫 ' + t('rmEspera')} />;
    case 'piloto':
      if (pil && p?.mao.length === 2)
        return (
          <>
            <Frase texto={'🤫 ' + t('rmEscolhe')} />
            <Cartas key="e" mao={p.mao} tipo="rm_escolher" enviar={enviar} />
            {p.podeVetar && (
              <button class="botao sec" onClick={() => jogo(enviar, { tipo: 'rm_vetar' })}>
                {t('rmVetar')}
              </button>
            )}
          </>
        );
      return <Frase texto={'🤫 ' + t('rmEspera')} />;
    case 'veto':
      if (!cmd) return <Frase texto={t('rmVetoPedido')} />;
      return (
        <>
          <Frase texto={t('rmVetoPedido')} />
          <div class="linha">
            <button class="botao cresce" onClick={() => jogo(enviar, { tipo: 'rm_veto', aceita: true })}>
              {t('rmAceitar')}
            </button>
            <button class="botao sec cresce" onClick={() => jogo(enviar, { tipo: 'rm_veto', aceita: false })}>
              {t('rmRecusar')}
            </button>
          </div>
        </>
      );
    case 'poder':
      if (!cmd || !v.poder) return <Frase texto={narracao(sala, v)} />;
      return (
        <>
          <Frase texto={t(('rmPoder_' + v.poder) as Chave)} />
          {v.poder === 'espiar' ? (
            <button class="botao grande" onClick={() => jogo(enviar, { tipo: 'rm_poder', alvo: null })}>
              {t('rmConfirmar')}
            </button>
          ) : (
            <Escolher key="poder" sala={sala} v={v} podem={v.vivos.filter((id) => id !== eu)} tipo="rm_poder" enviar={enviar} />
          )}
        </>
      );
    case 'ver': {
      const r = p?.resultado;
      if (!cmd || !r) return <Frase texto={narracao(sala, v)} />;
      return (
        <>
          <Frase texto={t('rmVer')} />
          <Segurar rotulo={v.poder === 'espiar' ? '👀' : '🔍'}>
            {r.tipo === 'espiar' ? (
              <div class="rm-cartas">
                {r.cartas.map((c, i) => (
                  <div key={i} class="rm-cartao">
                    {c === 'R' ? '🔧' : '💥'}
                  </div>
                ))}
              </div>
            ) : (
              <h2>{t(('rmEquipa_' + r.equipa) as Chave, { nome: nome(r.alvo) })}</h2>
            )}
          </Segurar>
          <button class="botao sec" style={{ marginTop: 80 }} onClick={() => jogo(enviar, { tipo: 'rm_visto' })}>
            {t('rmVisto')}
          </button>
        </>
      );
    }
    case 'discussao':
      return (
        <>
          <Frase texto={narracao(sala, v)} />
          {v.poder === null && <Frase texto={t('rmDiscussao')} />}
          {sala.vipId === eu && (
            <button class="botao sec" onClick={() => jogo(enviar, { tipo: 'rm_seguir' })}>
              {t('rmSeguir')}
            </button>
          )}
        </>
      );
    default:
      return <Frase texto={narracao(sala, v)} />;
  }
}

/** Identidade: bolinha de cor + papel; Amotinados veem aliados e a IA; IA (5–6) vê os Amotinados */
function Identidade({ sala, p, aberta }: { sala: VistaSala; p: PrivadoMaquinas | null; aberta?: boolean }) {
  if (!p) return null;
  const nomes = (l: string[]) => l.map((id) => nomeDe(sala, id)).join(', ');
  return (
    <Segurar rotulo={t('rmIdentidade')} aberta={aberta}>
      <div class="rm-bola">{COR[p.papel]}</div>
      <h2>{nomePapel(p.papel)}</h2>
      <p class="mini">{t(('rmObj_' + p.papel) as Chave)}</p>
      {p.aliados.length > 0 && <p>{t('rmAliados', { nomes: nomes(p.aliados) })}</p>}
      {p.ia && <p>{t('rmIaE', { nome: nomeDe(sala, p.ia) })}</p>}
    </Segurar>
  );
}

export function TelemovelMaquinas({ sala, v, agora, eu, privado, enviar, idAberta }: PropsMaquinas & { eu: string; privado: PrivadoMaquinas | null; enviar: Enviar; idAberta?: boolean }) {
  const [ajuda, setAjuda] = useState(false);
  const [painel, setPainel] = useState(false);
  const fim = v.fase === 'fim';
  const papel = v.papeis[eu];
  const ganhei = fim && !!papel && equipaDe(papel) === v.vencedor;
  return (
    <div class="pag jogo-maquinas tel">
      <div class="topo">
        <span>{t('rmNome')}</span>
        <button class="chip" aria-label={t('comoJogar')} onClick={() => setAjuda(!ajuda)}>
          ⓘ
        </button>
        {!fim && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
      </div>
      {ajuda && (
        <div class="cartao" onClick={() => setAjuda(false)}>
          <b>{t('rmNome')}</b> — {t('ajudaMaquinas')}
        </div>
      )}
      {v.restante !== null && <div class="aviso">{t('pausa')}</div>}
      {sala.semTv && !fim && (
        <div class="separadores">
          <button class={painel ? '' : 'on'} onClick={() => setPainel(false)}>
            {t('swEu')}
          </button>
          <button class={painel ? 'on' : ''} onClick={() => setPainel(true)}>
            {t('swPainel')}
          </button>
        </div>
      )}
      {fim ? (
        <>
          {v.participantes.includes(eu) && (
            <h1 class="pergunta">
              {ganhei ? t('rmGanhaste') : t('rmPerdeste')} · {t('rmPontos', { n: v.pontos[eu] ?? 0 })}
            </h1>
          )}
          {sala.semTv ? <Consola sala={sala} v={v} compacto /> : <p class="centro">{t('rmOlheTv')}</p>}
          <div class="cartao">
            <PlacarMaquinas sala={sala} v={v} tam={36} />
          </div>
          {sala.vipId === eu && (
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
      ) : painel && sala.semTv ? (
        <Consola sala={sala} v={v} compacto />
      ) : (
        <Eu sala={sala} v={v} eu={eu} p={privado} enviar={enviar} />
      )}
      {!fim && v.participantes.includes(eu) && v.fase !== 'ver' && <Identidade sala={sala} p={privado} aberta={idAberta} />}
    </div>
  );
}
