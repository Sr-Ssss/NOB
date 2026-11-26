import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../core/i18n';
import type { AcaoSala, VistaSala } from '../../core/sala';
import { Temporizador } from '../../ui/comuns';
import { AcabarPartida } from '../../ui/acabarPartida';
import { nomeDe } from '../5050/tv';
import { ArenaSvg, ModuloMini, PecaSvg, RoboCartao } from './desenho';
import { T_QUADRO, arenaDe, entre, type Quadro } from './quadro';
import { CABECAS, CORPOS, LOCOS, PRECO, type Cabeca, type Corpo, type Loco } from './pecas';
import { Apostadores, Palco, Premios, QuemEnviou, Rosto, etiquetaModulo, infoModulo, moeda, nomeCabeca, nomeCorpo, nomeFase, nomeLoco, nomeRobo, roboPorId } from './comuns';
import { PASSOS_LANCE, PRECO_CONTROLO, T_COMBATE, T_CONTROLO, ativos, classificacao, posicoes, roboDe, type VistaRagerob } from './regras';
import './ragerob.css';

type Enviar = (a: AcaoSala) => void;
const jogo = (enviar: Enviar, acao: Extract<AcaoSala, { tipo: 'jogo' }>['acao']) => enviar({ tipo: 'jogo', acao });

export interface PropsTelRagerob {
  v: VistaRagerob;
  sala: VistaSala;
  agora: () => number;
  eu: string;
  enviar: Enviar;
}

/** comando de carrinho telecomandado: ▲▼ à esquerda, ◀▶ à direita; envia ao carregar e ao largar */
function Comando({ enviar }: { enviar: Enviar }) {
  const estado = useRef({ f: 0, r: 0 });
  const mandar = () => jogo(enviar, { tipo: 'rr_conduzir', id: '', ...estado.current });
  // reenviar de vez em quando enquanto se carrega (a TV larga o comando de quem se cala)
  useEffect(() => {
    const i = setInterval(() => (estado.current.f || estado.current.r) && mandar(), 1500);
    return () => {
      clearInterval(i);
      estado.current = { f: 0, r: 0 };
    };
  }, []);
  const botao = (rot: string, eixo: 'f' | 'r', val: number, nome: string) => {
    const on = () => {
      estado.current = { ...estado.current, [eixo]: val };
      navigator.vibrate?.(15);
      mandar();
    };
    const off = () => {
      if (estado.current[eixo] !== val) return;
      estado.current = { ...estado.current, [eixo]: 0 };
      mandar();
    };
    return (
      <button
        class={'rr-btn-metal ' + eixo}
        aria-label={nome}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          on();
        }}
        onPointerUp={off}
        onPointerCancel={off}
        onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && on()}
        onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && off()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {rot}
      </button>
    );
  };
  return (
    <div class="rr-comando">
      <div class="rr-esq">
        {botao('▲', 'f', 1, t('rrFrente'))}
        {botao('▼', 'f', -1, t('rrTras'))}
      </div>
      <div class="rr-dir">
        {botao('◀', 'r', -1, t('rrRodarEsq'))}
        {botao('▶', 'r', 1, t('rrRodarDir'))}
      </div>
    </div>
  );
}

function Vida({ n }: { n: number }) {
  return (
    <div class="rr-vida" role="meter" aria-valuenow={n} aria-valuemin={0} aria-valuemax={100} aria-label={t('rrVida')}>
      <div style={{ width: `${n}%`, background: n > 50 ? '#5fbf3a' : n > 25 ? '#f2c230' : '#e0412b' }} />
    </div>
  );
}

/** "Olhe para a TV" (sem TV: "Esperando os outros…") */
const olha = (sala: VistaSala) => t(sala.semTv ? 'rrEsperaOutros' : 'rrOlhaTv');

/**
 * Sem TV: a arena pequena (por cima dos controlos), desenhada a partir dos quadros que o host manda
 * (src/jogos/ragerob/quadro.ts), interpolando entre os dois últimos para andar suave.
 */
function ArenaTel({ v, sala }: Pick<PropsTelRagerob, 'v' | 'sala'>) {
  const c = v.combate!;
  const q = c.quadro;
  const hist = useRef<{ a: Quadro | null; b: Quadro | null; em: number }>({ a: null, b: null, em: 0 });
  if (q && q.t !== hist.current.b?.t) hist.current = { a: hist.current.b, b: q, em: performance.now() };
  const [, setF] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setF((x) => x + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const h = hist.current;
  const quadro = h.b && h.a ? entre(h.a, h.b, (performance.now() - h.em) / T_QUADRO) : h.b;
  const nomes = Object.fromEntries(c.robos.map((id) => [id, nomeRobo(roboPorId(v, id), sala)]));
  return <div class="rr-arena-tel">{quadro ? <ArenaSvg c={arenaDe(quadro, v.robos)} nomes={nomes} condutores={{}} /> : <div class="rr-arena rr-arena-vazia" />}</div>;
}

function Montar({ v, sala, eu, enviar }: PropsTelRagerob) {
  const meu = v.robos.find((r) => r.dono === eu);
  const [corpo, setCorpo] = useState<Corpo>(meu?.corpo ?? 'quadrado');
  const [loco, setLoco] = useState<Loco>(meu?.loco ?? 'rodas');
  const [cabeca, setCabeca] = useState<Cabeca>(meu?.cabeca ?? 'galo');
  if (!meu) return <p class="centro">{olha(sala)}</p>;
  const feito = v.montados.includes(eu);
  const previa = { ...meu, corpo, loco, cabeca, modulos: [] };
  const linha = <T extends string>(rotulo: string, lista: T[], atual: T, mudar: (x: T) => void, nome: (x: T) => string, desenho: (x: T) => ComponentChildren) => (
    <div class="rr-pecas" role="group" aria-label={rotulo}>
      {lista.map((x) => (
        <button key={x} class={'rr-escolha' + (atual === x ? ' on' : '')} aria-pressed={atual === x} aria-label={nome(x)} onClick={() => mudar(x)}>
          {desenho(x)}
        </button>
      ))}
    </div>
  );
  return (
    <div class="rr-coluna">
      <div class="centro">
        <RoboCartao robo={previa} tam={150} />
      </div>
      {linha(t('rrCarrocaria'), CORPOS, corpo, setCorpo, nomeCorpo, (x) => (
        <PecaSvg robo={{ ...previa, corpo: x }} peca="corpo" />
      ))}
      {linha(t('rrLocomocao'), LOCOS, loco, setLoco, nomeLoco, (x) => (
        <PecaSvg robo={{ ...previa, corpo: 'quadrado', loco: x }} peca="loco" />
      ))}
      {linha(t('rrCabeca'), CABECAS, cabeca, setCabeca, nomeCabeca, (x) => (
        <PecaSvg robo={{ ...previa, cabeca: x }} peca="cabeca" />
      ))}
      <button class="rr-btn-grande" onClick={() => jogo(enviar, { tipo: 'rr_montar', id: '', corpo, loco, cabeca })}>
        {feito ? '✅ ' : ''}
        {t('rrMontar')}
      </button>
    </div>
  );
}

/** leilão ao vivo: o palco e os 3 botões (entrada, +50, +100); o valor vai absoluto */
function Leilao({ v, sala, eu, enviar }: PropsTelRagerob) {
  const l = v.leilao;
  if (!l) return null;
  const din = v.carteira[eu] ?? 0;
  const base = PRECO[v.loja[l.item]];
  const meu = l.lance?.id === eu;
  const lance = (valor: number) => {
    navigator.vibrate?.(15);
    jogo(enviar, { tipo: 'rr_lance', id: '', item: l.item, valor });
  };
  const fechado = l.martelo || meu;
  return (
    <div class="rr-coluna">
      <Palco v={v} sala={sala} />
      <div class={'rr-lances' + (meu ? ' meu' : '')}>
        <button class={'rr-btn-lance entrada' + (!l.lance && !fechado && din >= base ? ' pisca' : '')} disabled={fechado || !!l.lance || din < base} onClick={() => lance(base)}>
          🙋 {t('rrDarEntrada')}
          <small>{moeda(base)}</small>
        </button>
        {PASSOS_LANCE.map((p) => {
          const n = (l.lance?.valor ?? base) + p;
          return (
            <button key={p} class="rr-btn-lance" disabled={fechado || !l.lance || din < n} aria-label={t('rrCobrir', { n: p, v: n })} onClick={() => lance(n)}>
              +{p}
              <small>{moeda(n)}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LojaPrivada({ v, eu, enviar }: PropsTelRagerob) {
  const din = v.carteira[eu] ?? 0;
  return (
    <div class="rr-coluna">
      <div class="rr-montra">
        {(v.lojaPrivada[eu] ?? []).map((m, k) => (
          <button
            key={k}
            class="rr-escolha"
            disabled={!m || PRECO[m] > din}
            title={m ? infoModulo(m) : undefined}
            aria-label={m ? t('rrComprar', { m: etiquetaModulo(m), n: PRECO[m] }) + '. ' + infoModulo(m) : t('rrComprado')}
            onClick={() => jogo(enviar, { tipo: 'rr_comprar', id: '', item: k })}
          >
            {m ? (
              <>
                <ModuloMini m={m} tam={84} />
                <span>{etiquetaModulo(m)}</span>
                <b>{moeda(PRECO[m])}</b>
              </>
            ) : (
              <span class="rr-grande">✅</span>
            )}
          </button>
        ))}
      </div>
      <button class="rr-btn-grande" onClick={() => jogo(enviar, { tipo: 'rr_pronto', id: '' })}>
        {v.enviaram.includes(eu) ? '✅ ' : ''}
        {t('rrPronto')}
      </button>
    </div>
  );
}

function Apostar({ v, sala, eu, enviar }: PropsTelRagerob) {
  const robo = v.apostas[eu];
  return (
    <div class="rr-coluna">
      <div class="rr-lista-robos">
        {(v.grupos[v.combateIdx] ?? []).map((id) => (
          <button key={id} class={'rr-escolha' + (robo === id ? ' on' : '') + (robo ? '' : ' pisca')} aria-pressed={robo === id} onClick={() => (navigator.vibrate?.(15), jogo(enviar, { tipo: 'rr_apostar', id: '', robo: id }))}>
            <RoboCartao robo={roboPorId(v, id)!} tam={96} />
            <span>
              {robo === id ? '✅ ' : ''}
              {nomeRobo(roboPorId(v, id), sala)}
            </span>
            <Apostadores v={v} sala={sala} robo={id} tam={32} />
          </button>
        ))}
      </div>
      <Premios v={v} />
    </div>
  );
}

function Instalar({ v, sala, eu, enviar }: PropsTelRagerob) {
  const [escolhido, setSel] = useState<number | null>(null);
  const robo = roboPorId(v, roboDe(v, eu));
  const inv = v.inventario[eu] ?? [];
  if (!robo || (!inv.length && v.prontos.includes(eu))) return <p class="centro">{olha(sala)}</p>;
  // só um módulo: já vai escolhido
  const sel = inv.length === 1 ? 0 : escolhido !== null && escolhido < inv.length ? escolhido : null;
  const troca = sel !== null && robo.modulos.some(Boolean) ? Math.ceil(PRECO[inv[sel]] / 2) : 0;
  const tocar = (k: number) => {
    if (sel === null) return;
    navigator.vibrate?.(15);
    jogo(enviar, { tipo: 'rr_instalar', id: '', inv: sel, encaixe: k });
    setSel(null);
  };
  return (
    <div class="rr-coluna">
      <b class="centro">{nomeRobo(robo, sala)}</b>
      <div class="centro">
        <RoboCartao robo={robo} tam={240} seta pisca={sel !== null} nomeEncaixe={(k) => t('rrEncaixe', { n: k + 1 })} aoTocar={tocar} />
      </div>
      {/* hint: trocar (encaixe laranja) custa isto */}
      <span class="rr-troca" style={{ visibility: troca ? 'visible' : 'hidden' }}>
        🔁 {moeda(troca)}
      </span>
      <div class="rr-pecas">
        {inv.map((m, k) => (
          <button key={k} class={'rr-escolha' + (sel === k ? ' on' : sel === null ? ' pisca' : '')} aria-pressed={sel === k} aria-label={etiquetaModulo(m) + '. ' + infoModulo(m)} title={infoModulo(m)} onClick={() => setSel(k)}>
            <ModuloMini m={m} tam={64} />
          </button>
        ))}
      </div>
      <button class="rr-btn-grande" onClick={() => jogo(enviar, { tipo: 'rr_pronto', id: '' })}>
        {v.prontos.includes(eu) ? '✅ ' : ''}
        {t('rrPronto')}
      </button>
    </div>
  );
}

function Luta({ v, sala, eu, agora, enviar }: PropsTelRagerob) {
  const c = v.combate!;
  const roboId = roboDe(v, eu);
  const robo = roboPorId(v, roboId);
  const noCombate = !!roboId && c.robos.includes(roboId);
  const restante = Math.max(0, Math.ceil(T_COMBATE - (agora() - c.inicio) / 1000));
  const cond = roboId ? c.condutor[roboId] : undefined;
  const conduzo = v.def.modo === 'pilotos' ? noCombate : cond?.id === eu && cond.ate > agora();
  const vida = roboId ? c.vidas[roboId] ?? 0 : 0;
  const topo = (
    <div class="rr-topo-tel">
      <b>{noCombate ? nomeRobo(robo, sala) : t('rrAssistir')}</b>
      {noCombate && <Vida n={vida} />}
      <span>{conduzo && cond ? t('rrTeusSegundos', { s: Math.max(0, Math.ceil((cond.ate - agora()) / 1000)) }) : restante > 0 ? `${restante} s` : t('rrEncolhe')}</span>
    </div>
  );
  // sem TV: a arena pequena por cima dos controlos (decisão de 20/11)
  const arena = sala.semTv ? <ArenaTel v={v} sala={sala} /> : null;
  if (noCombate && vida <= 0)
    return (
      <>
        {topo}
        {arena}
        <p class="centro rr-grande">💥 {t('rrKo')}</p>
        {!sala.semTv && <p class="centro">{t('rrOlhaTv')}</p>}
      </>
    );
  if (conduzo)
    return (
      <>
        {topo}
        {arena}
        <Comando enviar={enviar} />
      </>
    );
  const fila = roboId ? c.fila[roboId] ?? [] : [];
  const naFila = fila.indexOf(eu);
  return (
    <>
      {topo}
      {arena}
      {v.def.modo === 'normal' && noCombate ? (
        <div class="rr-coluna">
          <button class="rr-btn-grande rr-controlar" aria-label={naFila >= 0 ? t('rrNaFila', { n: naFila + 1 }) : t('rrControlar', { n: PRECO_CONTROLO })} disabled={naFila >= 0 || (v.carteira[eu] ?? 0) < PRECO_CONTROLO} onClick={() => jogo(enviar, { tipo: 'rr_controlar', id: '' })}>
            {naFila >= 0 ? (
              <span>⏳ {naFila + 1}º</span>
            ) : (
              <>
                <span>🎮</span>
                <span>⏱️ {T_CONTROLO} s</span>
                <span>{moeda(PRECO_CONTROLO)}</span>
              </>
            )}
          </button>
          {cond && cond.ate > agora() && (
            <p class="centro rr-apostadores" aria-label={t('rrOutroConduz')}>
              <Rosto v={v} sala={sala} id={cond.id} tam={44} /> 🎮 {Math.max(0, Math.ceil((cond.ate - agora()) / 1000))} s
            </p>
          )}
        </div>
      ) : null}
      {!sala.semTv && <p class="centro">{t('rrOlhaTv')}</p>}
    </>
  );
}

/** sem TV: a ordem do combate (o que a TV mostrava) */
function OrdemTel({ v, sala }: Pick<PropsTelRagerob, 'v' | 'sala'>) {
  const r = v.resultado!;
  return (
    <ol class="rr-ordem rr-ordem-tel">
      {r.ordem.flatMap((gr, i) =>
        gr.map((id) => (
          <li key={id}>
            <span>{['🥇', '🥈', '🥉', '4.º'][Math.min(3, i)]}</span> {nomeRobo(roboPorId(v, id), sala)} · 💥 {r.dano[id] ?? 0}
          </li>
        )),
      )}
    </ol>
  );
}

export function TelemovelRagerob(p: PropsTelRagerob) {
  const { v, eu, agora } = p;
  const din = v.carteira[eu] ?? 0;
  const ativo = ativos(v).includes(eu);
  const participa = v.participantes.includes(eu);
  const semTv = !!p.sala.semTv;
  let corpo;
  const titulo = v.fase === 'montar' ? t('rrMontarTv') : v.fase === 'loja' ? t(v.def.loja === 'leilao' ? 'rrLeilaoTv' : 'rrLojaPrivadaTv') : v.fase === 'aposta' ? t('rrApostaTv') : v.fase === 'instalar' ? t('rrInstalarTv') : '';
  // sem TV, a audiência também vê a arena
  if (!participa && !(semTv && v.fase === 'combate' && v.combate)) corpo = <p class="centro">{t('rrAudiencia')}</p>;
  else if (v.fase === 'montar') corpo = <Montar {...p} />;
  else if (v.fase === 'loja') corpo = v.def.loja === 'leilao' ? <Leilao {...p} /> : !ativo ? <p class="centro">{t('rrSemDinheiro')}</p> : <LojaPrivada {...p} />;
  else if (v.fase === 'aposta') corpo = <Apostar {...p} />;
  else if (v.fase === 'instalar') corpo = <Instalar {...p} />;
  else if (v.fase === 'combate' && v.combate) return <div class="pag jogo-ragerob tel"><Luta {...p} /></div>;
  else if (v.fase === 'resultado' && v.resultado) {
    const g = v.resultado.ganhos[eu] ?? 0;
    const meu = roboDe(v, eu);
    const ganhei = v.def.modo === 'normal' ? !!meu && v.resultado.vencedor === meu : (v.resultado.ordem[0] ?? []).includes(meu ?? '');
    const lugar = meu ? (posicoes(v.resultado.ordem)[meu] ?? 0) : 0;
    corpo = (
      <div class="rr-coluna centro">
        <p class="rr-grande">{meu ? (ganhei ? '🏆 ' + t('rrGanhaste') : t('rrLugar', { n: lugar + 1 })) : t('rrSemApostaRes')}</p>
        <p class="rr-grande">
          <b class={g >= 0 ? 'rr-mais' : 'rr-menos'}>{g >= 0 ? '+' + g : g}</b>
        </p>
        {semTv ? <OrdemTel v={v} sala={p.sala} /> : <p>{t('rrOlhaTv')}</p>}
      </div>
    );
  } else if (v.fase === 'fim') {
    const lista = classificacao(v);
    const lugar = lista.findIndex((x) => x.id === eu);
    corpo = (
      <div class="rr-coluna centro">
        <p class="rr-grande">{lugar === 0 ? '🏆 ' : ''}{t('rrLugar', { n: lugar + 1 })}</p>
        {semTv ? (
          <>
            {/* sem TV: a classificação e (só o líder) jogar outra vez / menu */}
            <ol class="rr-ordem rr-ordem-tel">
              {lista.map((x, i) => (
                <li key={x.id}>
                  {['🥇', '🥈', '🥉'][i] ?? `${i + 1}.º`} {nomeDe(p.sala, x.id)} · {v.def.modo === 'normal' ? moeda(x.valor) : t('rrPontos', { n: x.valor })}
                </li>
              ))}
            </ol>
            {p.sala.vipId === eu && (
              <div class="linha">
                <button class="botao cresce" onClick={() => p.enviar({ tipo: 'outra_vez', id: '' })}>
                  {t('jogarOutraVez')}
                </button>
                <button class="botao sec" onClick={() => p.enviar({ tipo: 'menu', id: '' })}>
                  {t('menu')}
                </button>
              </div>
            )}
          </>
        ) : (
          <p>{t('rrOlhaTv')}</p>
        )}
      </div>
    );
  }
  return (
    <div class="pag jogo-ragerob tel">
      <div class="rr-topo-tel">
        <span>{nomeFase(v)}</span>
        <b>{moeda(din)}</b>
        {v.fase !== 'fim' && v.fase !== 'resultado' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
        <AcabarPartida sala={p.sala} eu={eu} enviar={p.enviar} />
      </div>
      {v.restante !== null && <div class="aviso">{t('pausa')}</div>}
      {(v.inventario[eu]?.length ?? 0) > 0 && v.fase !== 'instalar' && (
        <div class="rr-inv" role="img" aria-label={t('rrInventario') + ': ' + v.inventario[eu].map(etiquetaModulo).join(', ')}>
          🎒
          {v.inventario[eu].map((m, k) => (
            <ModuloMini key={k} m={m} tam={34} />
          ))}
        </div>
      )}
      {participa && titulo && <h2 class="rr-titulo-tel">{titulo}</h2>}
      {corpo}
      {participa && semTv && v.fase === 'loja' && v.def.loja === 'privada' && <QuemEnviou sala={p.sala} ids={ativos(v)} feitos={v.enviaram} />}
    </div>
  );
}
