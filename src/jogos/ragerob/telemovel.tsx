import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../core/i18n';
import type { AcaoSala, VistaSala } from '../../core/sala';
import { Temporizador } from '../../ui/comuns';
import { AcabarPartida } from '../../ui/acabarPartida';
import { nomeDe } from '../5050/tv';
import { ArenaSvg, ModuloSvg, RoboCartao } from './desenho';
import { T_QUADRO, arenaDe, entre, type Quadro } from './quadro';
import { CABECAS, CORPOS, ICONE_CABECA, LOCOS, PRECO, type Cabeca, type Corpo, type Loco } from './pecas';
import { etiquetaModulo, infoModulo, moeda, nomeCabeca, nomeCorpo, nomeFase, nomeLoco, nomeRobo, roboPorId } from './comuns';
import { PRECO_CONTROLO, T_COMBATE, ativos, classificacao, minimoAposta, roboDe, type VistaRagerob } from './regras';
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
  const linha = <T extends string>(lista: T[], atual: T, mudar: (x: T) => void, nome: (x: T) => string) => (
    <div class="opcoes">
      {lista.map((x) => (
        <button key={x} class={'opcao' + (atual === x ? ' on' : '')} aria-pressed={atual === x} onClick={() => mudar(x)}>
          {nome(x)}
        </button>
      ))}
    </div>
  );
  return (
    <div class="rr-coluna">
      <div class="centro">
        <RoboCartao robo={previa} tam={150} />
      </div>
      <label>{t('rrCarrocaria')}</label>
      {linha(CORPOS, corpo, setCorpo, nomeCorpo)}
      <label>{t('rrLocomocao')}</label>
      {linha(LOCOS, loco, setLoco, nomeLoco)}
      <label>{t('rrCabeca')}</label>
      {linha(CABECAS, cabeca, setCabeca, (c) => ICONE_CABECA[c] + ' ' + nomeCabeca(c))}
      <button class="rr-btn-grande" onClick={() => jogo(enviar, { tipo: 'rr_montar', id: '', corpo, loco, cabeca })}>
        {feito ? '✅ ' + t('rrMontado') : t('rrMontar')}
      </button>
    </div>
  );
}

function Leilao({ v, eu, enviar }: PropsTelRagerob) {
  const [ofertas, setOfertas] = useState<Record<number, string>>({});
  const [erro, setErro] = useState('');
  const din = v.carteira[eu] ?? 0;
  const soma = Object.values(ofertas).reduce((a, x) => a + (Number(x) || 0), 0);
  const enviou = v.enviaram.includes(eu);
  const enviarOfertas = () => {
    const o: Record<string, number> = {};
    for (const [k, x] of Object.entries(ofertas)) {
      const n = Math.floor(Number(x));
      if (!n) continue;
      if (n < PRECO[v.loja[Number(k)]]) return setErro(t('rrErroMinimo', { m: etiquetaModulo(v.loja[Number(k)]), n: PRECO[v.loja[Number(k)]] }));
      o[k] = n;
    }
    if (soma > din) return setErro(t('rrErroDinheiro'));
    setErro('');
    jogo(enviar, { tipo: 'rr_ofertas', id: '', ofertas: o });
  };
  return (
    <div class="rr-coluna">
      {v.loja.map((m, k) => {
        const caro = PRECO[m] > din;
        return (
          <div key={k} class={'rr-cartao-mod linha' + (caro ? ' caro' : '')}>
            <svg viewBox="-30 -44 60 54" width={56} aria-hidden="true">
              <ModuloSvg m={m} seta />
            </svg>
            <div class="cresce">
              <b>{etiquetaModulo(m)}</b>
              <small class="rr-info">{infoModulo(m)}</small>
            </div>
            <input
              type="number"
              inputMode="numeric"
              min={PRECO[m]}
              step={10}
              disabled={caro}
              placeholder={String(PRECO[m])}
              aria-label={t('rrOferta', { m: etiquetaModulo(m) })}
              value={ofertas[k] ?? ''}
              onInput={(e) => setOfertas({ ...ofertas, [k]: (e.target as HTMLInputElement).value })}
            />
          </div>
        );
      })}
      <p class="centro rr-mini">{t('rrTotalOfertas', { n: soma, d: din })}</p>
      {erro && <p class="erro">{erro}</p>}
      <button class="rr-btn-grande" onClick={enviarOfertas}>
        {enviou ? '✅ ' + t('rrReenviar') : t('rrEnviarOfertas')}
      </button>
    </div>
  );
}

function LojaPrivada({ v, eu, enviar }: PropsTelRagerob) {
  const din = v.carteira[eu] ?? 0;
  return (
    <div class="rr-coluna">
      {(v.lojaPrivada[eu] ?? []).map((m, k) =>
        m ? (
          <div key={k} class={'rr-cartao-mod linha' + (PRECO[m] > din ? ' caro' : '')}>
            <svg viewBox="-30 -44 60 54" width={56} aria-hidden="true">
              <ModuloSvg m={m} seta />
            </svg>
            <div class="cresce">
              <b>{etiquetaModulo(m)}</b>
              <small class="rr-info">{infoModulo(m)}</small>
            </div>
            <button class="rr-btn-metal pequeno" disabled={PRECO[m] > din} onClick={() => jogo(enviar, { tipo: 'rr_comprar', id: '', item: k })}>
              {moeda(PRECO[m])}
            </button>
          </div>
        ) : (
          <div key={k} class="rr-cartao-mod linha caro">
            ✅ {t('rrComprado')}
          </div>
        ),
      )}
      <button class="rr-btn-grande" onClick={() => jogo(enviar, { tipo: 'rr_pronto', id: '' })}>
        {v.enviaram.includes(eu) ? '✅ ' + t('rrPronto') : t('rrAcabeiCompras')}
      </button>
    </div>
  );
}

function Apostar({ v, sala, eu, enviar }: PropsTelRagerob) {
  const min = minimoAposta(v, eu);
  const [robo, setRobo] = useState<string | null>(v.apostas[eu]?.robo ?? null);
  const [valor, setValor] = useState(String(v.apostas[eu]?.valor || min));
  const [erro, setErro] = useState('');
  const din = v.carteira[eu] ?? 0;
  const minha = v.apostas[eu];
  const apostar = () => {
    const n = Math.floor(Number(valor));
    if (!robo) return setErro(t('rrEscolheRobo'));
    if (!(n >= min && n <= din)) return setErro(t('rrErroAposta', { min, max: din }));
    setErro('');
    jogo(enviar, { tipo: 'rr_apostar', id: '', robo, valor: n });
  };
  return (
    <div class="rr-coluna">
      <div class="rr-lista-robos">
        {(v.grupos[v.combateIdx] ?? []).map((id) => (
          <button key={id} class={'rr-escolha' + (robo === id ? ' on' : '')} aria-pressed={robo === id} onClick={() => setRobo(id)}>
            <RoboCartao robo={roboPorId(v, id)!} tam={70} />
            <span>{nomeRobo(roboPorId(v, id), sala)}</span>
          </button>
        ))}
      </div>
      <label>{t('rrValor', { min })}</label>
      <input type="number" inputMode="numeric" min={min} max={din} step={10} value={valor} onInput={(e) => setValor((e.target as HTMLInputElement).value)} />
      {erro && <p class="erro">{erro}</p>}
      <button class="rr-btn-grande" onClick={apostar}>
        {minha?.robo ? '✅ ' + t('rrApostado', { n: minha.valor }) : t('rrApostar')}
      </button>
      <button class="botao sec" onClick={() => jogo(enviar, { tipo: 'rr_apostar', id: '', robo: null, valor: 0 })}>
        {minha && !minha.robo ? '✅ ' : ''}
        {t('rrSemAposta', { n: Math.min(v.def.entrada, din) })}
      </button>
    </div>
  );
}

function Instalar({ v, sala, eu, enviar }: PropsTelRagerob) {
  const [sel, setSel] = useState<number | null>(null);
  const roboId = roboDe(v, eu);
  const robo = roboPorId(v, roboId);
  const inv = v.inventario[eu] ?? [];
  if (!robo || !inv.length)
    return (
      <p class="centro">
        {t('rrNadaInstalar')}
        <br />
        {olha(sala)}
      </p>
    );
  return (
    <div class="rr-coluna">
      <b class="centro">{nomeRobo(robo, sala)}</b>
      <div class="centro">
        <RoboCartao robo={robo} tam={220} seta aoTocar={(k) => sel !== null && (jogo(enviar, { tipo: 'rr_instalar', id: '', inv: sel, encaixe: k }), setSel(null))} />
      </div>
      <p class="centro rr-mini">{sel === null ? t('rrTocaModulo') : t('rrTocaEncaixe')}</p>
      <div class="opcoes">
        {inv.map((m, k) => (
          <button key={k} class={'opcao' + (sel === k ? ' on' : '')} aria-pressed={sel === k} onClick={() => setSel(k)}>
            {etiquetaModulo(m)}
          </button>
        ))}
      </div>
      <p class="rr-mini centro">{t('rrTrocar')}</p>
      <button class="rr-btn-grande" onClick={() => jogo(enviar, { tipo: 'rr_pronto', id: '' })}>
        {v.prontos.includes(eu) ? '✅ ' + t('rrPronto') : t('rrPronto')}
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
        <p class="centro rr-mini">{t('rrSozinhos')}</p>
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
          <button class="rr-btn-grande" disabled={naFila >= 0 || (v.carteira[eu] ?? 0) < PRECO_CONTROLO} onClick={() => jogo(enviar, { tipo: 'rr_controlar', id: '' })}>
            {naFila >= 0 ? t('rrNaFila', { n: naFila + 1 }) : t('rrControlar', { n: PRECO_CONTROLO })}
          </button>
          {cond && cond.ate > agora() && <p class="centro">{t('rrOutroConduz')}</p>}
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
  // sem TV, a audiência também vê a arena
  if (!participa && !(semTv && v.fase === 'combate' && v.combate)) corpo = <p class="centro">{t('rrAudiencia')}</p>;
  else if (v.fase === 'montar') corpo = <Montar {...p} />;
  else if (v.fase === 'loja') corpo = !ativo ? <p class="centro">{t('rrSemDinheiro')}</p> : v.def.loja === 'leilao' ? <Leilao key={v.ronda} {...p} /> : <LojaPrivada {...p} />;
  else if (v.fase === 'aposta') corpo = !ativo ? <p class="centro">{t('rrSemDinheiro')}</p> : <Apostar key={v.combateIdx} {...p} />;
  else if (v.fase === 'instalar') corpo = <Instalar {...p} />;
  else if (v.fase === 'combate' && v.combate) return <div class="pag jogo-ragerob tel"><Luta {...p} /></div>;
  else if (v.fase === 'resultado' && v.resultado) {
    const g = v.resultado.ganhos[eu] ?? 0;
    const meu = roboDe(v, eu);
    const ganhei = v.def.modo === 'normal' ? !!meu && v.resultado.vencedor === meu : (v.resultado.ordem[0] ?? []).includes(meu ?? '');
    corpo = (
      <div class="rr-coluna centro">
        <p class="rr-grande">{meu ? (ganhei ? '🏆 ' + t('rrGanhaste') : t('rrPerdeste')) : t('rrSemApostaRes')}</p>
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
        <p class="rr-mini centro">
          {t('rrInventario')}: {v.inventario[eu].map(etiquetaModulo).join(', ')}
        </p>
      )}
      {corpo}
    </div>
  );
}
