import { useEffect, useRef, useState } from 'preact/hooks';
import type { AcaoSala, VistaSala } from '../../core/sala';
import { t, type Chave } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import { T_REFENS, type CartaR, type PapelR, type PrivadoRei, type VistaRei } from './regras';
import { BOLA, COR_EQ, Castelos, Emblema, ICONE, ORLA_DE, Simbolo, narracao, nomeEquipa, nomePapel, nomeSala, type PropsRei } from './comuns';
import { AcabarPartida } from '../../ui/acabarPartida';
import { BotaoPopup } from '../../ui/verPopup';
import { PodioEscada } from '../../ui/podio';
import { eventosSegurar, tocarParaMostrar } from '../../ui/acessibilidade';

type Enviar = (a: AcaoSala) => void;
const jogo = (enviar: Enviar, acao: Record<string, unknown>) => enviar({ tipo: 'jogo', acao: { id: '', ...acao } as never });
const Frase = ({ texto }: { texto: string }) => <h2 class="rm-frase">{texto}</h2>;

/** ecrã escuro (sem fundo colorido: um ecrã muito brilhante denunciaria a cor) */
function Escuro({ children }: { children: preact.ComponentChildren }) {
  return <div class="rd-escuro">{children}</div>;
}

/** mini estandarte da sala (sol na Sala 1, lua na Sala 2) */
function MiniEstandarte({ k }: { k: 0 | 1 }) {
  return (
    <div class="rd-mini" aria-hidden="true">
      <div class="rd-mini-vara" />
      <div class="rd-mini-pano">
        <Simbolo k={k} />
      </div>
    </div>
  );
}

/** a carta: cartão de couro com moldura dourada; o boneco no emblema com a orla da equipa */
function Carta({ c, n, p }: { c: CartaR; n: number; p?: PrivadoRei | null }) {
  return (
    <div class="rd-carta">
      <i class="rd-canto c1" />
      <i class="rd-canto c2" />
      <i class="rd-canto c3" />
      <i class="rd-canto c4" />
      <span class="rd-carta-icone" aria-hidden="true">
        {ICONE[c.papel]}
      </span>
      <h2>{nomePapel(c.papel)}</h2>
      <Emblema n={n} orla={ORLA_DE[c.cor]} />
      <div class="rd-equipa">
        <span class="rd-bolinha" style={{ background: COR_EQ[c.cor] }} />
        {nomeEquipa(c.cor)}
      </div>
      <hr />
      <p>{t(('rdObj_' + c.papel) as Chave)}</p>
      {p?.equipa && c.papel === 'traidor' && <p>{t('rdJogaPor', { eq: nomeEquipa(p.equipa) })}</p>}
      {p?.batata && <p>{t('rdComBatata')}</p>}
    </div>
  );
}

/** "Mostrar cor": só o emblema grande + o nome da equipa */
function MinhaCor({ c, n }: { c: CartaR; n: number }) {
  return (
    <div class="rd-minha-cor">
      <small>{t('rdMinhaCor')}</small>
      <Emblema n={n} orla={ORLA_DE[c.cor]} />
      <b>{nomeEquipa(c.cor)}</b>
    </div>
  );
}

const PAPEIS_INFO: PapelR[] = ['rei', 'dragao', 'corte', 'rebelde', 'escudeiro', 'domador', 'traidor', 'gemeo', 'rival', 'medroso', 'curioso', 'pajem', 'duque', 'apostador', 'arqueiro', 'alvo', 'isco', 'batata'];

/** ℹ️ Informações: regras e papéis, letra grande */
function Info({ fechar }: { fechar: () => void }) {
  return (
    <div class="rd-info" role="dialog">
      <h3>{t('rdNome')}</h3>
      <p>{t('rdInfoRegras', { segurar: t('rdVerCarta') })}</p>
      <h3>{t('rdInfoPapeis')}</h3>
      <ul>
        {PAPEIS_INFO.map((p) => (
          <li key={p}>
            <b>
              {ICONE[p]} {nomePapel(p)}
            </b>{' '}
            — {t(('rdObj_' + p) as Chave)}
          </li>
        ))}
      </ul>
      <p>{t('rdInfoPontos')}</p>
      <h3>⚠️</h3>
      <p>{t('rdInfoCasa')}</p>
      <button class="botao grande" onClick={fechar}>
        {t('rdFechar')}
      </button>
    </div>
  );
}

/** lista de jogadores para escolher (1 ou n) */
function Escolher({ sala, ids, n = 1, rotulo, ok }: { sala: VistaSala; ids: string[]; n?: number; rotulo: string; ok: (sel: string[]) => void }) {
  const [sel, setSel] = useState<string[]>([]);
  const tocar = (id: string) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : n === 1 ? [id] : sel.length < n ? [...sel, id] : sel);
  return (
    <>
      <div class="rd-lista">
        {ids.map((id) => (
          <button key={id} class={'rd-linha' + (sel.includes(id) ? ' on' : '')} onClick={() => tocar(id)}>
            <Avatar n={avatarDe(sala, id)} tam={36} />
            <span class="cresce">{nomeDe(sala, id)}</span>
          </button>
        ))}
      </div>
      <button class="botao grande" disabled={sel.length !== n} onClick={() => ok(sel)}>
        {rotulo}
      </button>
    </>
  );
}

/** botão "segurar 2 s": barra de progresso; toque curto = aviso; revelado enquanto se segura */
export const T_MOSTRAR = 2000;
function SegurarMostrar({ rotulo, conteudo, aoLargar }: { rotulo: string; conteudo: preact.ComponentChildren; aoLargar?: () => void }) {
  const [estado, setEstado] = useState<'nada' | 'segura' | 'mostra' | 'aviso'>('nada');
  const tempo = useRef<number | undefined>(undefined);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (estado !== 'segura') return setPct(estado === 'mostra' ? 100 : 0);
    const inicio = Date.now();
    const i = setInterval(() => setPct(Math.min(100, ((Date.now() - inicio) / T_MOSTRAR) * 100)), 40);
    return () => clearInterval(i);
  }, [estado]);
  const est = useRef(estado);
  est.current = estado;
  useEffect(() => () => clearTimeout(tempo.current), []);
  const largar = () => {
    clearTimeout(tempo.current);
    if (est.current === 'segura') {
      setEstado('aviso');
      tempo.current = window.setTimeout(() => setEstado('nada'), 1800);
    } else if (est.current === 'mostra') {
      setEstado('nada');
      aoLargar?.();
    }
  };
  return (
    <>
      {estado === 'mostra' && (
        <div class="rd-revelado" role="dialog" aria-live="assertive">
          {conteudo}
        </div>
      )}
      {estado === 'aviso' && !tocarParaMostrar() && <div class="rd-aviso">{t('rdSegura2')}</div>}
      <button
        class={'rd-segurar' + (estado === 'segura' || estado === 'mostra' ? ' on' : '')}
        {...eventosSegurar({
          segurar: (e) => {
            e.preventDefault();
            clearTimeout(tempo.current);
            setEstado('segura');
            tempo.current = window.setTimeout(() => setEstado('mostra'), T_MOSTRAR);
          },
          largar,
          mostrar: () => setEstado('mostra'),
          aberto: estado === 'mostra',
        })}
      >
        <span class="rd-progresso" style={{ width: pct + '%' }} />
        <span class="rd-rotulo">{rotulo}</span>
      </button>
    </>
  );
}

function Ronda({ sala, v, eu, p, enviar, agora }: { sala: VistaSala; v: VistaRei; eu: string; p: PrivadoRei; enviar: Enviar; agora: () => number }) {
  const [menu, setMenu] = useState<'nada' | 'batata' | 'votar'>('nada');
  const k = v.salas[0].includes(eu) ? 0 : 1;
  const aqui = v.salas[k];
  const outros = aqui.filter((id) => id !== eu);
  const lider = v.lideres[k] === eu;
  const ultimos = v.restante === null && v.terminaEm - agora() <= T_REFENS * 1000;
  const votacao = v.votacao[k];
  const n = Math.min(v.refensPorLider, outros.length);
  const maioria = Math.floor(aqui.length / 2) + 1;

  return (
    <>
      <div class="rd-tel-topo">
        {nomeSala(v, k)} · <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} /> · {t('rdLider', { nome: nomeDe(sala, v.lideres[k]) })}
      </div>
      {p.pedido && (
        <div class="rd-pedido">
          <p>{t('rdPedido', { nome: nomeDe(sala, p.pedido) })}</p>
          <div class="linha">
            <button class="botao cresce" onClick={() => jogo(enviar, { tipo: 'rd_responder', aceita: true })}>
              {t('rdAceitar')}
            </button>
            <button class="botao sec cresce" onClick={() => jogo(enviar, { tipo: 'rd_responder', aceita: false })}>
              {t('rdNao')}
            </button>
          </div>
        </div>
      )}
      {p.pedi && (
        <div class="rd-pedido">
          <p>{t('rdEsperaResposta', { nome: nomeDe(sala, p.pedi) })}</p>
          <button class="botao sec" onClick={() => jogo(enviar, { tipo: 'rd_fechar' })}>
            {t('rdCancelar')}
          </button>
        </div>
      )}
      {menu === 'batata' && p.batata && !p.pedi && outros.length > 0 && (
        <div class="cartao">
          <h3>{t('rdTrocaCom')}</h3>
          <Escolher
            sala={sala}
            ids={outros}
            rotulo={t('rdPassar')}
            ok={([alvo]) => {
              jogo(enviar, { tipo: 'rd_pedir', alvo });
              setMenu('nada');
            }}
          />
          <button class="botao sec" onClick={() => setMenu('nada')}>
            {t('rdNaoPassar')}
          </button>
        </div>
      )}
      {lider && ultimos && !p.refens && n > 0 && (
        <div class="cartao">
          <h3>{t('rdEscolheRefens', { n })}</h3>
          <Escolher sala={sala} ids={outros} n={n} rotulo={t('rdConfirmar')} ok={(ids) => jogo(enviar, { tipo: 'rd_refens', ids })} />
        </div>
      )}
      {lider && p.refens && <p class="centro">{t('rdRefensFeito')}</p>}
      {votacao && menu === 'votar' ? (
        <div class="cartao">
          <h3>
            {t('rdVotacao')} · {t('rdMaioria', { m: maioria })}
          </h3>
          <div class="rd-lista">
            {aqui.map((id) => (
              <button key={id} class={'rd-linha' + (p.voto === id ? ' on' : '')} onClick={() => jogo(enviar, { tipo: 'rd_votar', alvo: id })}>
                <Avatar n={avatarDe(sala, id)} tam={36} />
                <span class="cresce">{nomeDe(sala, id)}</span>
                <b>{votacao[id] ?? 0}</b>
              </button>
            ))}
          </div>
          <button class="botao sec" onClick={() => setMenu('nada')}>
            {t('rdVoltar')}
          </button>
        </div>
      ) : votacao ? (
        <button class="botao sec" onClick={() => setMenu('votar')}>
          🗳️ {t('rdVotacao')}
        </button>
      ) : (
        <button
          class="botao sec"
          disabled={v.votacaoUsada[k]}
          onClick={() => {
            jogo(enviar, { tipo: 'rd_votacao' });
            setMenu('votar');
          }}
        >
          {v.votacaoUsada[k] ? t('rdVotacaoUsada') : t('rdTrocarLider')}
        </button>
      )}
      <div class="rd-mostrar">
        <SegurarMostrar rotulo={t('rdMostrarCor')} conteudo={<MinhaCor c={p.carta} n={avatarDe(sala, eu)} />} />
        <SegurarMostrar rotulo={t('rdMostrarCarta')} conteudo={<Carta c={p.carta} n={avatarDe(sala, eu)} />} aoLargar={() => p.batata && !p.pedi && setMenu('batata')} />
      </div>
      {aqui.length <= 6 && !p.pedido && !p.pedi && menu === 'nada' && !(lider && ultimos) && <MiniEstandarte k={k} />}
      <h3>{t('rdNaSala')}</h3>
      <div class="rd-lista">
        {[...aqui]
          .sort((a, b) => (a === v.lideres[k] ? -1 : b === v.lideres[k] ? 1 : 0))
          .map((id) => (
            <div key={id} class="rd-linha">
              <Avatar n={avatarDe(sala, id)} tam={32} />
              <span class="cresce">
                {id === v.lideres[k] ? '👑 ' : ''}
                {nomeDe(sala, id)}
              </span>
            </div>
          ))}
      </div>
    </>
  );
}

function Eu({ sala, v, eu, p, enviar, agora }: { sala: VistaSala; v: VistaRei; eu: string; p: PrivadoRei | null; enviar: Enviar; agora: () => number }) {
  const [info, setInfo] = useState(false);
  if (!v.participantes.includes(eu)) return <Frase texto={narracao(sala, v)} />;
  const k = v.salas[0].includes(eu) ? 0 : 1;
  const ja = v.prontos.includes(eu);
  if (info) return <Info fechar={() => setInfo(false)} />;
  switch (v.fase) {
    case 'ir':
      return (
        <>
          <MiniEstandarte k={k} />
          <h1 class="rd-vai">{t('rdVaiPara', { sala: nomeSala(v, k) })}</h1>
          {ja ? (
            <>
              <p class="centro">{narracao(sala, v)}</p>
              {sala.vipId === eu && <Avancar v={v} enviar={enviar} />}
            </>
          ) : (
            <button class="botao grande" onClick={() => jogo(enviar, { tipo: 'rd_pronto' })}>
              {t('rdPronto')}
            </button>
          )}
        </>
      );
    case 'carta':
      if (ja || !p)
        return (
          <>
            <div class="rd-espera-emb">
              <Emblema n={avatarDe(sala, eu)} />
            </div>
            <Frase texto={narracao(sala, v)} />
            {sala.vipId === eu && <Avancar v={v} enviar={enviar} />}
          </>
        );
      return (
        <Escuro>
          <Carta c={p.carta} n={avatarDe(sala, eu)} p={p} />
          <div class="rd-carta-botoes">
            <button class="botao rd-btn-info" aria-label={t('rdInfo')} onClick={() => setInfo(true)}>
              ℹ️
            </button>
            <button class="botao rd-btn-ok" onClick={() => jogo(enviar, { tipo: 'rd_ok' })}>
              {t('rdOk')}
            </button>
          </div>
        </Escuro>
      );
    case 'lider':
      return (
        <>
          <Frase texto={'👑 ' + t('rdLideres')} />
          <div class="rd-minis">
            {([0, 1] as const).map((s) => (
              <div key={s}>
                <MiniEstandarte k={s} />
                <p class="rd-mini-nome">
                  {nomeSala(v, s)}
                  <br />
                  👑 {nomeDe(sala, v.lideres[s])}
                </p>
              </div>
            ))}
          </div>
        </>
      );
    case 'ronda':
      return p ? <Ronda sala={sala} v={v} eu={eu} p={p} enviar={enviar} agora={agora} /> : null;
    case 'troca':
      if (v.mudando.includes(eu))
        return (
          <>
            <MiniEstandarte k={k} />
            <h1 class="rd-vai">{t('rdFoste', { sala: nomeSala(v, k) })}</h1>
            {!v.chegaram.includes(eu) && (
              <button class="botao grande" onClick={() => jogo(enviar, { tipo: 'rd_cheguei' })}>
                {t('rdCheguei')}
              </button>
            )}
          </>
        );
      return (
        <>
          <MiniEstandarte k={k} />
          <Frase texto={t('rdFicas', { sala: nomeSala(v, k) })} />
        </>
      );
    case 'aposta':
      if (p?.carta.papel === 'apostador' && !p.aposta)
        return (
          <>
            <Frase texto={t('rdApostaEu')} />
            <div class="rd-botoes">
              {(['azul', 'vermelho'] as const).map((c) => (
                <button key={c} class="botao grande" onClick={() => jogo(enviar, { tipo: 'rd_apostar', equipa: c })}>
                  {BOLA[c]} {nomeEquipa(c)}
                </button>
              ))}
            </div>
          </>
        );
      if (p?.carta.papel === 'arqueiro' && !p.apontado)
        return (
          <>
            <Frase texto={t('rdArqueiroEu')} />
            <Escolher sala={sala} ids={v.participantes.filter((id) => id !== eu)} rotulo={'🏹 ' + t('rdConfirmar')} ok={([alvo]) => jogo(enviar, { tipo: 'rd_apontar', alvo })} />
          </>
        );
      return (
        <>
          <MiniEstandarte k={1} />
          <Frase texto={t('rdAntesMeiaNoite') + ' ' + t('rdEspera')} />
        </>
      );
    default:
      return <Frase texto={narracao(sala, v)} />;
  }
}

/** sem botão de identidade (Fase 11): na ronda, "Mostrar carta" já a revela */
export function TelemovelRei({ sala, v, agora, eu, privado, enviar }: PropsRei & { eu: string; privado: PrivadoRei | null; enviar: Enviar }) {
  const [ajuda, setAjuda] = useState(false);
  const [, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const fim = v.fase === 'fim';
  const minha = v.participantes.includes(eu);
  const ganhei = !!v.ganhou[eu];
  return (
    <div class="pag jogo-rei tel">
      <div class="topo">
        <span>{t('rdNome')}</span>
        <button class="chip" aria-label={t('comoJogar')} onClick={() => setAjuda(!ajuda)}>
          ⓘ
        </button>
        <AcabarPartida sala={sala} eu={eu} enviar={enviar} />
        {!fim && v.fase !== 'ir' && v.fase !== 'carta' && (v.fase !== 'ronda' || !minha) && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
      </div>
      {ajuda && (
        <div class="cartao" onClick={() => setAjuda(false)}>
          <b>{t('rdNome')}</b> — {t('ajudaRei', { segurar: t('rdVerCarta') })}
        </div>
      )}
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}
      {fim ? (
        <>
          {minha && (
            <h1 class="pergunta">
              {ganhei ? t('rdGanhaste') : t('rdPerdeste')} · {t('rdPontos', { n: v.pontos[eu] ?? 0 })}
            </h1>
          )}
          {sala.semTv ? (
            <>
              <h2 class="centro">{narracao(sala, v)}</h2>
              {/* as torres com as cartas de todos não cabem por cima do placar: abrem-se pelo botão */}
              <BotaoPopup rotulo="🏰 🃏">
                <Castelos sala={sala} v={v} agora={agora} compacto />
              </BotaoPopup>
            </>
          ) : (
            <p class="centro">{t('rdOlheTv')}</p>
          )}
          <PodioEscada sala={sala} podio={v.podio} />
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
      ) : (
        <>
          <Eu sala={sala} v={v} eu={eu} p={privado} enviar={enviar} agora={agora} />
          {/* sem TV, um só ecrã: as torres (o que a TV mostraria) por baixo, sem a narração (a frase de cima já a diz);
              na carta não (o ecrã fica escuro) e na ronda de quem joga também não (é tempo de conversar; Fase 11) */}
          {sala.semTv && v.fase !== 'carta' && !(v.fase === 'ronda' && minha) && (
            <div class="palco-tel">
              <Castelos sala={sala} v={v} agora={agora} compacto />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** só o líder: se alguém não carrega em Pronto/OK, avança sem ele (o jogo não encrava) */
function Avancar({ v, enviar }: { v: PropsRei['v']; enviar: Enviar }) {
  return (
    <button class="botao sec" onClick={() => jogo(enviar, { tipo: 'rd_avancar' })}>
      {t('rdAvancar', { n: v.prontos.length, t: v.participantes.length })}
    </button>
  );
}
