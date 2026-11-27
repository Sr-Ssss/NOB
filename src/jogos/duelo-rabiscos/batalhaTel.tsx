import { useState } from 'preact/hooks';
import type { AcaoSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { nomeDe } from '../5050/tv';
import { Dado, DadoRola } from './artes/dados';
import type { EstadoHex } from './artes/tabuleiro';
import { CORES_MAGO, ColmeiaDuelo, Retrato, indice } from './colmeia';
import { BatalhaOuUltima, Classificacao, Gemas, NomeMago, SeloDado, faixa, useBatalhaNova, useEsperaBatalha, type PropsDuelo } from './comuns';
import { Baralho } from './baralho';
import { EfeitosHtml, efeitosTexto } from './artes/efeitos';
import { CartaJogo, type EstadoRanhura, type Ranhura } from './artes/cartaJogo';
import { ENCAIXE, Mago } from './artes/magos';
import { Boneco18 } from '../../ui/bonecos';
import { avatarDe } from '../5050/tv';

import { Zoom } from './zoom';
import { CUSTO, MAGOS_PODERES, type Poder } from './criaturas';
import { acaoModo, faceAcao, modos, motivoPoder, opcoesModo, passoPoder, poderCompleto, tocarPoder, type Modo, type Opcoes } from './jogadas';
import { casasLobo, chegaParaComprar, cria, custoDado, foraDuelo, podeComprar, type AlvoPoder, type Cria, type Desenhos } from './regras';
import type { Casa } from './tabuleiro';
import { NOME_FACE, TEXTO_CRIATURA, TEXTO_PODER, TXT } from './textos';

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
function Mesa({ v, sala, desenhos, acesas, marcadas, aoTocar, fantasma }: Pick<PropsBatalha, 'v' | 'sala' | 'desenhos'> & { acesas?: Map<Casa, EstadoHex>; marcadas?: Casa[]; aoTocar?: (c: Casa) => void; fantasma?: { c: Cria; casa: Casa } }) {
  return (
    <div class={'dr-mesa-tel' + (sala.semTv ? ' cima' : '')}>
      <Zoom>
        <ColmeiaDuelo v={v} desenhos={desenhos} nome={(id) => nomeDe(sala, id)} acesas={acesas} marcadas={marcadas} aoTocar={aoTocar} fantasma={fantasma} />
      </Zoom>
    </div>
  );
}

/** os magos inimigos, pequenos, num canto: foto de perfil (cabeça e roupa) e os dados que tiraram por baixo */
function Rivais({ v, sala, eu }: Pick<PropsBatalha, 'v' | 'sala' | 'eu'>) {
  return (
    <div class="dr-rivais" role="group" aria-label={TXT.magos}>
      {v.participantes
        .filter((id) => id !== eu)
        .map((id) => {
          const m = v.magos[id];
          const fora = foraDuelo(v, id);
          return (
            <div key={id} class={'dr-rival' + (fora ? ' fora' : '') + (v.fase === 'vez' && v.vez === id ? ' on' : '')} title={nomeDe(sala, id)}>
              <span class="dr-perfil" style={{ borderColor: CORES_MAGO[indice(v, id)] }} aria-label={nomeDe(sala, id)} role="img">
                {m.roupa && (
                  <Mago roupa={m.roupa} tam={60}>
                    <Boneco18 n={avatarDe(sala, id)} tam={ENCAIXE.tam} />
                  </Mago>
                )}
              </span>
              <span class="dr-rival-dados">
                {m.dados.map((f, i) => (
                  <DadoRola key={i} face={faceAcao(f)} tam={18} />
                ))}
              </span>
            </div>
          );
        })}
    </div>
  );
}

/** as ranhuras da carta: o dado fica na da ação já feita nesta volta; acende-se a que o dado escolhido pode usar */
function ranhurasDe(c: Cria, podem: Modo[] = [], lutaSemDado = false): Partial<Record<Ranhura, EstadoRanhura>> {
  const r: Partial<Record<Ranhura, EstadoRanhura>> = {};
  if (c.andou) r.andar = 'usada';
  // o especial conta como o ataque da volta
  if (c.agiu) Object.assign(r, { atacar: 'usada', especial: 'fechada' });
  for (const m of podem) {
    const k: Ranhura = m === 'lutar' ? 'atacar' : m;
    if (!r[k]) r[k] = m === 'lutar' && lutaSemDado ? 'luta' : 'acesa';
  }
  return r;
}

/** as tuas criaturas como cartas (com o teu desenho), para o baralho */
function cartaDe(c: Cria, desenhos: Desenhos, apagada = false, podem: Modo[] = [], aoTocar?: (r: Ranhura) => void, lutaSemDado = false) {
  return {
    id: c.id,
    apagada,
    rotulo: `${TEXTO_CRIATURA[c.tipo].nome}${c.ferimentos ? ', ' + TXT.ferimentos(c.ferimentos) : ''} ${efeitosTexto(c)}`,
    carta: (
      <CartaJogo criatura={c.tipo} estilo="classe" ferimentos={c.ferimentos} ranhuras={ranhurasDe(c, podem, lutaSemDado)} aoTocar={aoTocar} efeitos={<EfeitosHtml c={c} tam={16} class="cj-efeitos" />}>
        <Retrato criatura={c.tipo} tracos={desenhos[c.dono]?.[c.tipo]} tam={150} />
      </CartaJogo>
    ),
  };
}

function Rodar({ v, sala, eu, desenhos, enviar }: PropsBatalha) {
  const m = v.magos[eu];
  return (
    <div class="cartao dr-bloco">
      {sala.semTv && <Mesa v={v} sala={sala} desenhos={desenhos} />}
      <div class="dr-bandeja">
        {m.dados.map((f, i) => (
          <button
            key={i}
            class="dr-bt-dado"
            disabled={m.pronto || (m.relancou && m.gemas < 1)}
            aria-label={TXT.rodarDado(NOME_FACE[f])}
            onClick={() => jogo(enviar, { tipo: 'dr_rodar', i })}
          >
            <DadoRola face={faceAcao(f)} tam={60} />
            {!m.pronto && <SeloDado selo={m.relancou ? 'gema' : 'gratis'} />}
          </button>
        ))}
        <Gemas n={m.gemas} />
      </div>
      {m.pronto ? (
        <p class="dr-espera" role="status" aria-label={TXT.aEspera}>
          ⏳
        </p>
      ) : (
        <button class="botao grande dr-ok" aria-label={TXT.ficoAssim} onClick={() => jogo(enviar, { tipo: 'dr_pronto' })}>
          ✓
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

/**
 * A tua vez (26/11): 2 toques e sem texto.
 * Dado → as ranhuras onde encaixa acendem → tocar numa → as casas acendem → tocar numa casa marca-a (fantasma a pulsar)
 * → tocar outra vez na mesma faz a jogada. Lutar colado: espadas cruzadas na carta, sem dado.
 * Trocar o dado: bolinha de gema (Habilidade/Fazer algo) ou caixote (Andar/Coringa) ao lado dos dados.
 */
function Vez(p: PropsBatalha) {
  const { v, sala, eu, desenhos, enviar } = p;
  const m = v.magos[eu];
  const minhas = v.criaturas.filter((c) => c.dono === eu);
  const [dado, setDado] = useState<number | null>(null);
  const [qual, setQual] = useState<number | null>(null);
  const [modo, setModo] = useState<Modo | null>(null);
  const [casa, setCasa] = useState<Casa | null>(null);
  const [poder, setPoder] = useState<Poder | null>(null);
  if (poder) return <UsarPoder {...p} poder={poder} fechar={() => setPoder(null)} />;
  const face = dado === null ? undefined : m.dados[dado];
  const c = qual === null ? undefined : cria(v, qual);
  const o = c && modo ? opcoesModo(v, c, modo) : { casas: [], alvos: [] };
  const acesas = acender(v, o);
  const escolher = (x: Cria, r: Ranhura) => {
    const l = modos(v, x, face);
    setQual(x.id);
    setModo(r === 'atacar' && l.includes('lutar') && (!face || !l.includes('atacar')) ? 'lutar' : r);
    setCasa(null);
  };
  const tocar = (k: Casa) => {
    if (!c || !modo || !acesas.has(k)) return;
    // 1.º toque marca (fantasma); 2.º toque na mesma casa joga
    if (casa !== k) return setCasa(k);
    const alvo = v.criaturas.find((x) => x.casa === k && o.alvos.includes(x.id))?.id;
    jogo(enviar, acaoModo(modo, dado ?? 0, c.id, k, alvo));
  };
  const largaGema = face === 'habilidade' || face === 'fazer';
  // na 1.ª volta, uma mãozinha aponta para o próximo toque (dado → carta → tabuleiro)
  const dica = v.volta === 1 ? (!face && !qual ? 'dados' : !modo ? 'cartas' : 'mesa') : '';
  return (
    <>
      <div class="cartao dr-bloco dr-vez2">
        <div class={'dr-bandeja' + (dica === 'dados' ? ' dr-dica' : '')}>
          {m.dados.map((f, i) => (
            <button
              key={i}
              class={'dr-bt-dado' + (i === dado ? ' on' : '')}
              aria-pressed={i === dado}
              aria-label={NOME_FACE[f]}
              onClick={() => {
                setDado(i === dado ? null : i);
                setQual(null);
                setModo(null);
                setCasa(null);
              }}
            >
              <Dado face={faceAcao(f)} tam={52} />
            </button>
          ))}
          {face && (
            <button class={'dr-largar' + (largaGema ? ' gema' : '')} aria-label={largaGema ? TXT.passarGema : TXT.passar} onClick={() => jogo(enviar, { tipo: 'dr_passar', i: dado })}>
              {largaGema ? <Gemas n={1} tam={26} /> : <span aria-hidden="true">🗑️</span>}
            </button>
          )}
          <Gemas n={m.gemas} />
        </div>
        {/* poderes do mago: pequenos, logo por baixo dos dados (tudo cabe no ecrã sem scroll) */}
        <div class="dr-poderes compacto" role="group" aria-label={TXT.poderes}>
          {MAGOS_PODERES[m.roupa!].map((x) => (
            <button key={x} class="dr-poder" disabled={motivoPoder(v, eu, x) !== null} title={TEXTO_PODER[x].efeito} onClick={() => setPoder(x)}>
              {TEXTO_PODER[x].nome} <Gemas n={CUSTO[x]} tam={16} />
            </button>
          ))}
        </div>
        <div class={dica === 'cartas' ? 'dr-dica' : undefined}>
        <Baralho
          cartas={minhas.map((x) => {
            const l = modos(v, x, face);
            return cartaDe(x, desenhos, !l.length, l, (r) => escolher(x, r), !face);
          })}
          escolhida={qual}
          escolher={(id) => {
            setQual(id);
            setModo(null);
            setCasa(null);
          }}
        />
        </div>
        <div class={'dr-mesa-caixa' + (dica === 'mesa' ? ' dr-dica' : '')}>
        <Mesa
          v={v}
          sala={sala}
          desenhos={desenhos}
          acesas={acesas}
          marcadas={[...(c ? [c.casa] : []), ...(casa ? [casa] : [])]}
          aoTocar={tocar}
          fantasma={c && casa && modo === 'andar' ? { c, casa } : undefined}
        />
        </div>
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

/** só para ver: a da frente muda ao arrastar ou tocar */
function BaralhoVer({ cartas }: { cartas: ReturnType<typeof cartaDe>[] }) {
  const [frente, setFrente] = useState<number | null>(null);
  return <Baralho cartas={cartas} escolhida={frente} escolher={setFrente} />;
}

/** fora da vez: os teus dados e exército, só ver */
function SoVer({ v, sala, eu, desenhos }: PropsBatalha) {
  const m = v.magos[eu];
  return (
    <div class="cartao dr-bloco dr-vez2">
      {sala.semTv && <Mesa v={v} sala={sala} desenhos={desenhos} />}
      {/* os teus dados e gemas numa linha; sem títulos (menos texto, cabe no ecrã) */}
      <div class="dr-bandeja" role="group" aria-label={TXT.meusDados}>
        {m.dados.map((f, i) => (
          <span key={i} role="img" aria-label={NOME_FACE[f]}>
            <Dado face={faceAcao(f)} tam={40} />
          </span>
        ))}
        <Gemas n={m.gemas} />
      </div>
      <BaralhoVer cartas={v.criaturas.filter((c) => c.dono === eu).map((c) => cartaDe(c, desenhos))} />
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
  // antes de rolar: comprar dados com gemas (custa os dados que fica a ter), depois Rolar!
  const compro = vivo && v.fase === 'batalha' && podeComprar(v, eu);
  const espera = useEsperaBatalha(v);
  const luta = (v.fase === 'batalha' || nova) && !espera;
  const minhaVez = vivo && v.fase === 'vez' && v.vez === eu;
  return (
    <>
      {/* uma linha só: tu e de quem é a vez, à esquerda; os rivais, pequenos, à direita */}
      <div class="dr-topo-tel">
        <p class="dr-faixa" role="status">
          {jogador && <NomeMago sala={sala} v={v} id={eu} />} <span>{faixa(sala, v)}</span>
        </p>
        <Rivais v={v} sala={sala} eu={eu} />
      </div>
      {luta && (
        <div class="cartao dr-bloco">
          <BatalhaOuUltima
            sala={sala}
            v={v}
            desenhos={desenhos}
            tam={40}
            eu={eu}
          />
          {compro && (
            <div class="linha dr-comprar">
              <button class="botao sec" disabled={!chegaParaComprar(v, eu)} onClick={() => jogo(enviar, { tipo: 'dr_comprar' })}>
                {v.magos[eu].gratis > 0 ? TXT.comprarGratis : TXT.comprarDado(custoDado(v, eu))} <Gemas n={v.magos[eu].gemas} tam={18} />
              </button>
              <button class="botao grande cresce" onClick={() => jogo(enviar, { tipo: 'dr_pronto' })}>
                🎲 {TXT.rolar}
              </button>
            </div>
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
        <Vez key={`${v.volta}:${v.magos[eu].dados.length}:${v.ultimo?.n}`} {...p} />
      ) : v.fase === 'lobo' && cria(v, v.lobo ?? undefined)?.dono === eu ? (
        <Lobo {...p} />
      ) : (
        <SoVer {...p} />
      )}
    </>
  );
}
