import { useState } from 'preact/hooks';
import type { AcaoSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { nomeDe } from '../5050/tv';
import { Dado } from './artes/dados';
import { IconeClasse } from './artes/icones';
import type { EstadoHex } from './artes/tabuleiro';
import { ColmeiaDuelo, Retrato, efeitos } from './colmeia';
import { BatalhaOuUltima, CantoMago, Classificacao, Gemas, NomeMago, faixa, useBatalhaNova, type PropsDuelo } from './comuns';
import { Zoom } from './zoom';
import { CRIATURAS, CUSTO, MAGOS_PODERES, type Poder } from './criaturas';
import { acaoModo, faceAcao, modos, motivoPoder, opcoesModo, passoPoder, poderCompleto, tocarPoder, type Modo, type Opcoes } from './jogadas';
import { casasLobo, cria, foraDuelo, podeRelancar, type AlvoPoder, type Cria, type Desenhos } from './regras';
import type { Casa } from './tabuleiro';
import { MOTIVO_PODER, NOME_FACE, NOME_MODO, TEXTO_CRIATURA, TEXTO_PODER, TXT } from './textos';

type Enviar = (a: AcaoSala) => void;
export type PropsBatalha = PropsDuelo & { eu: string; desenhos: Desenhos; enviar: Enviar };
const jogo = (enviar: Enviar, acao: Record<string, unknown>) => enviar({ tipo: 'jogo', acao: { id: '', ...acao } as never });

/** as casas acesas de um passo */
function acender(v: PropsDuelo['v'], o: Opcoes): Map<Casa, EstadoHex> {
  const m = new Map<Casa, EstadoHex>(o.casas.map((c) => [c, 'aceso']));
  for (const id of o.alvos) m.set(cria(v, id)!.casa, 'alvo');
  return m;
}

/** o tabuleiro do telemóvel: zoom com dois dedos; sem TV vai para cima do painel e fica preso ao topo */
function Mesa({ v, sala, desenhos, acesas, marcadas, aoTocar }: Pick<PropsBatalha, 'v' | 'sala' | 'desenhos'> & { acesas?: Map<Casa, EstadoHex>; marcadas?: Casa[]; aoTocar?: (c: Casa) => void }) {
  return (
    <div class={'dr-mesa-tel' + (sala.semTv ? ' cima' : '')}>
      <Zoom>
        <ColmeiaDuelo v={v} desenhos={desenhos} nome={(id) => nomeDe(sala, id)} acesas={acesas} marcadas={marcadas} aoTocar={aoTocar} />
      </Zoom>
    </div>
  );
}

/** sem TV: os magos como nos cantos da TV, em pequeno */
function Cantos({ v, sala }: Pick<PropsBatalha, 'v' | 'sala'>) {
  return (
    <div class="dr-cantos-tel" role="group" aria-label={TXT.magos}>
      {v.participantes.map((id) => (
        <CantoMago key={id} sala={sala} v={v} id={id} />
      ))}
    </div>
  );
}

function FichaCria({ c, desenhos }: { c: Cria; desenhos: Desenhos }) {
  return (
    <>
      <Retrato criatura={c.tipo} tracos={desenhos[c.dono]?.[c.tipo]} tam={72} />
      <span class="dr-ficha-nome">
        <IconeClasse classe={CRIATURAS[c.tipo].classe} tam={22} /> {TEXTO_CRIATURA[c.tipo].nome} {efeitos(c)}
      </span>
      {c.ferimentos > 0 && <small>{TXT.ferimentos(c.ferimentos)}</small>}
    </>
  );
}

function Rodar({ v, sala, eu, desenhos, enviar }: PropsBatalha) {
  const m = v.magos[eu];
  return (
    <div class="cartao dr-bloco">
      {sala.semTv && <Mesa v={v} sala={sala} desenhos={desenhos} />}
      <h2>{TXT.rodar}</h2>
      <div class="dr-dados">
        {m.dados.map((f, i) => (
          <button key={i} class="dr-bt-dado" disabled={m.relancou || m.pronto} aria-label={TXT.rodarDado(NOME_FACE[f])} onClick={() => jogo(enviar, { tipo: 'dr_rodar', i })}>
            <Dado face={faceAcao(f)} tam={60} />
            <small>{NOME_FACE[f]}</small>
          </button>
        ))}
      </div>
      <p class="mini">{m.pronto ? TXT.aEspera : m.relancou ? TXT.rodou : TXT.rodarAjuda}</p>
      {!m.pronto && (
        <button class="botao grande" onClick={() => jogo(enviar, { tipo: 'dr_pronto' })}>
          {TXT.ficoAssim}
        </button>
      )}
    </div>
  );
}

function UsarPoder({ poder, fechar, ...p }: PropsBatalha & { poder: Poder; fechar: () => void }) {
  const { v, sala, eu, desenhos, enviar } = p;
  const [a, setA] = useState<AlvoPoder>({});
  const o = passoPoder(v, eu, poder, a);
  const completo = poderCompleto(poder, a);
  const marcadas = [...[a.criatura, a.outra].flatMap((n) => cria(v, n)?.casa ?? []), ...(a.casa ? [a.casa] : []), ...(a.casas ?? [])];
  const vazio = !Object.keys(a).length;
  const dica = completo ? '' : poder === 'muralha' ? TXT.muralhaFaltam(3 - (a.casas?.length ?? 0)) : poder === 'troca' ? TXT.trocaPrimeira : poder === 'empurrao' && a.criatura !== undefined ? TXT.empurraCasa : TXT.passoAlvo.slice(3);
  return (
    <div class="cartao dr-bloco">
      <h2>{TXT.poderUsar(TEXTO_PODER[poder].nome)}</h2>
      <p class="mini">{TEXTO_PODER[poder].efeito}</p>
      <Mesa v={v} sala={sala} desenhos={desenhos} acesas={acender(v, o)} marcadas={marcadas} aoTocar={(c) => setA(tocarPoder(poder, a, c, v.criaturas.find((x) => x.casa === c)?.id))} />
      <p role="status">{dica}</p>
      <div class="linha">
        <button class="botao sec" onClick={() => (vazio ? fechar() : setA({}))}>
          {TXT.cancelar}
        </button>
        <button
          class="botao cresce"
          disabled={!completo}
          onClick={() => {
            jogo(enviar, { tipo: 'dr_poder', poder, alvo: a });
            fechar();
          }}
        >
          {TXT.confirmarJogada}
        </button>
      </div>
    </div>
  );
}

function Vez(p: PropsBatalha) {
  const { v, sala, eu, desenhos, enviar } = p;
  const m = v.magos[eu];
  const minhas = v.criaturas.filter((c) => c.dono === eu);
  const [dado, setDado] = useState<number | null>(null);
  const [qual, setQual] = useState<number | null>(null);
  const [querModo, setModo] = useState<Modo | null>(null);
  const [casa, setCasa] = useState<Casa | null>(null);
  const [poder, setPoder] = useState<Poder | null>(null);
  if (poder) return <UsarPoder {...p} poder={poder} fechar={() => setPoder(null)} />;
  const face = dado === null ? undefined : m.dados[dado];
  const c = qual === null ? undefined : cria(v, qual);
  const l = face && c ? modos(v, c, face) : [];
  const modo = querModo && l.includes(querModo) ? querModo : l[0];
  const o = c && modo ? opcoesModo(v, c, modo) : { casas: [], alvos: [] };
  const acesas = acender(v, o);
  const alvo = v.criaturas.find((x) => x.casa === casa && o.alvos.includes(x.id))?.id;
  const algumServe = !!face && minhas.some((x) => modos(v, x, face).length > 0);
  return (
    <>
      <div class="cartao dr-bloco">
        <h2>
          {TXT.minhaVez} <Gemas n={m.gemas} />
        </h2>
        <b>{TXT.passoDado}</b>
        <div class="dr-dados">
          {m.dados.map((f, i) => (
            <button
              key={i}
              class={'dr-bt-dado' + (i === dado ? ' on' : '')}
              aria-pressed={i === dado}
              aria-label={NOME_FACE[f]}
              onClick={() => {
                setDado(i);
                setCasa(null);
              }}
            >
              <Dado face={faceAcao(f)} tam={56} />
              <small>{NOME_FACE[f]}</small>
            </button>
          ))}
        </div>
        {face && (
          <>
            <b>{TXT.passoCriatura}</b>
            {!algumServe && <p>{TXT.semJogada}</p>}
            <div class="dr-fichas">
              {minhas.map((x) => (
                <button
                  key={x.id}
                  class={'dr-ficha' + (x.id === qual ? ' on' : '')}
                  aria-pressed={x.id === qual}
                  disabled={!modos(v, x, face).length}
                  onClick={() => {
                    setQual(x.id);
                    setCasa(null);
                  }}
                >
                  <FichaCria c={x} desenhos={desenhos} />
                </button>
              ))}
            </div>
          </>
        )}
        {c && modo && (
          <>
            <b>{TXT.passoAlvo}</b>
            {l.length > 1 && (
              <div class="opcoes">
                {l.map((x) => (
                  <button
                    key={x}
                    class={'opcao' + (x === modo ? ' on' : '')}
                    aria-pressed={x === modo}
                    onClick={() => {
                      setModo(x);
                      setCasa(null);
                    }}
                  >
                    {NOME_MODO[x]}
                  </button>
                ))}
              </div>
            )}
            {l.length === 1 && <span>{NOME_MODO[modo]}</span>}
          </>
        )}
        <Mesa v={v} sala={sala} desenhos={desenhos} acesas={acesas} marcadas={[...(c ? [c.casa] : []), ...(casa ? [casa] : [])]} aoTocar={setCasa} />
        <button class="botao grande" disabled={!casa || !acesas.has(casa)} onClick={() => casa && c && modo && jogo(enviar, acaoModo(modo, dado!, c.id, casa, alvo))}>
          {TXT.confirmarJogada}
        </button>
        {dado !== null && face && (
          <button class="botao sec" onClick={() => jogo(enviar, { tipo: 'dr_passar', i: dado })}>
            {TXT.passar}
          </button>
        )}
      </div>
      <div class="dr-poderes" role="group" aria-label={TXT.poderes}>
        <small>{TXT.poderes}</small>
        {MAGOS_PODERES[m.roupa!].map((x) => {
          const motivo = motivoPoder(v, eu, x);
          return (
            <button key={x} class="dr-poder" disabled={motivo !== null} onClick={() => setPoder(x)}>
              <b>
                {TEXTO_PODER[x].nome} <Gemas n={CUSTO[x]} tam={20} />
              </b>
              <small>{motivo ? MOTIVO_PODER[motivo] : TEXTO_PODER[x].efeito}</small>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Lobo({ v, sala, desenhos, enviar }: PropsBatalha) {
  const lobo = cria(v, v.lobo ?? undefined)!;
  const [casa, setCasa] = useState<Casa | null>(null);
  return (
    <div class="cartao dr-bloco">
      <h2>{TXT.loboAnda}</h2>
      <Mesa v={v} sala={sala} desenhos={desenhos} acesas={acender(v, { casas: casasLobo(v, lobo), alvos: [] })} marcadas={casa ? [casa] : [lobo.casa]} aoTocar={setCasa} />
      <div class="linha">
        <button class="botao sec" onClick={() => jogo(enviar, { tipo: 'dr_lobo', casa: null })}>
          {TXT.loboFica}
        </button>
        <button class="botao cresce" disabled={!casa} onClick={() => jogo(enviar, { tipo: 'dr_lobo', casa })}>
          {TXT.confirmarJogada}
        </button>
      </div>
    </div>
  );
}

/** fora da vez: os teus dados e exército, só ver */
function SoVer({ v, sala, eu, desenhos }: PropsBatalha) {
  const m = v.magos[eu];
  return (
    <div class="cartao dr-bloco">
      {sala.semTv && <Mesa v={v} sala={sala} desenhos={desenhos} />}
      <b>
        {TXT.meusDados} <Gemas n={m.gemas} />
      </b>
      <div class="dr-dados">
        {m.dados.length ? m.dados.map((f, i) => <span key={i} role="img" aria-label={NOME_FACE[f]}><Dado face={faceAcao(f)} tam={44} /></span>) : <small>{TXT.semDados}</small>}
      </div>
      <b>{TXT.meuExercito}</b>
      <div class="dr-fichas">
        {v.criaturas
          .filter((c) => c.dono === eu)
          .map((c) => (
            <div key={c.id} class="dr-ficha">
              <FichaCria c={c} desenhos={desenhos} />
            </div>
          ))}
      </div>
    </div>
  );
}

/** da batalha em diante */
export function BatalhaTel(p: PropsBatalha) {
  const { v, sala, eu, desenhos, enviar } = p;
  // sem TV, os sons da TV tocam no telemóvel
  const nova = useBatalhaNova(v, sala.semTv);
  if (v.fase === 'fim')
    return (
      <>
        <div class="cartao">
          {nova && <BatalhaOuUltima sala={sala} v={v} desenhos={desenhos} tam={40} eu={eu} />}
          <Classificacao sala={sala} v={v} tam={40} />
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
    );
  const jogador = v.participantes.includes(eu);
  const vivo = jogador && !foraDuelo(v, eu);
  const relanco = vivo && v.fase === 'batalha' && podeRelancar(v, eu);
  const luta = v.fase === 'batalha' || nova;
  const minhaVez = vivo && v.fase === 'vez' && v.vez === eu;
  return (
    <>
      <p class="dr-faixa" role="status">
        {jogador && <NomeMago sala={sala} v={v} id={eu} />} <span>{faixa(sala, v)}</span>
      </p>
      {luta && (
        <div class="cartao dr-bloco">
          <BatalhaOuUltima sala={sala} v={v} desenhos={desenhos} tam={40} eu={eu} aoTocar={relanco ? (i) => jogo(enviar, { tipo: 'dr_relancar', i }) : undefined} />
          {relanco && (
            <>
              <p>
                {TXT.relancar} {v.magos[eu].gratis > 0 ? TXT.relancarGratis : TXT.relancarGema} <Gemas n={v.magos[eu].gemas} />
              </p>
              <button class="botao grande" onClick={() => jogo(enviar, { tipo: 'dr_pronto' })}>
                {TXT.ficar}
              </button>
            </>
          )}
        </div>
      )}
      {!vivo ? (
        <div class="cartao dr-bloco">
          {sala.semTv && <Mesa v={v} sala={sala} desenhos={desenhos} />}
          <p class="centro">{jogador ? TXT.soVerFora : TXT.soVer}</p>
        </div>
      ) : v.fase === 'rodar' ? (
        <Rodar {...p} />
      ) : minhaVez ? (
        <Vez key={`${v.volta}:${v.magos[eu].dados.length}`} {...p} />
      ) : v.fase === 'lobo' && cria(v, v.lobo ?? undefined)?.dono === eu ? (
        <Lobo {...p} />
      ) : (
        <SoVer {...p} />
      )}
      {sala.semTv && <Cantos v={v} sala={sala} />}
    </>
  );
}
