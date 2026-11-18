import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../core/i18n';
import type { AcaoSala, VistaSala } from '../../core/sala';
import { Temporizador } from '../../ui/comuns';
import { nomeDe } from '../5050/tv';
import { ArenaSvg, ModuloSvg, RoboCartao } from './desenho';
import { Combate, type ComandoF } from './fisica';
import { ICONE_EVENTO, PRECO } from './pecas';
import { QuemEnviou, etiquetaModulo, moeda, nomeEvento, nomeFase, nomeRobo, roboPorId } from './comuns';
import { T_COMBATE, ativos, classificacao, tabela, type EstadoRagerob, type VistaRagerob } from './regras';
import './ragerob.css';

export interface PropsTvRagerob {
  g: EstadoRagerob;
  v: VistaRagerob;
  sala: VistaSala;
  agora: () => number;
  selFim: number;
  onOutraVez: () => void;
  onMenu: () => void;
  acao?: (a: AcaoSala) => void;
}

const jogo = (acao: PropsTvRagerob['acao'], a: Extract<AcaoSala, { tipo: 'jogo' }>['acao']) => acao?.({ tipo: 'jogo', acao: a });

/** quem conduz cada robô agora (null = a IA) */
function humanos(g: EstadoRagerob, agora: number, sala: VistaSala): Record<string, ComandoF | null> {
  const c = g.combate;
  const r: Record<string, ComandoF | null> = {};
  if (!c) return r;
  for (const id of c.robos) {
    const cmd = c.comandos[id];
    if (g.def.modo === 'normal') {
      const cond = c.condutor[id];
      r[id] = cond && cond.ate > agora ? (cmd ? { f: cmd.f, r: cmd.r } : { f: 0, r: 0 }) : null;
    } else {
      const dono = g.robos.find((x) => x.id === id)?.dono;
      const bot = sala.jogadores.find((j) => j.id === dono)?.bot;
      // o piloto conduz o combate todo; se largar o comando uns segundos, a IA ajuda
      r[id] = dono && !bot && cmd && (cmd.f || cmd.r || agora - cmd.em < 4000) ? { f: cmd.f, r: cmd.r } : null;
    }
  }
  return r;
}

/** o combate: a física corre aqui (a TV é o host) */
function Luta({ g, v, sala, agora, acao }: PropsTvRagerob) {
  const c = v.combate!;
  const sim = useRef<{ chave: string; c: Combate; enviado: boolean } | null>(null);
  const gRef = useRef(g);
  gRef.current = g;
  const chave = `${v.ronda}:${c.n}:${c.inicio}`;
  if (!sim.current || sim.current.chave !== chave) {
    const robos = c.robos.map((id) => g.robos.find((r) => r.id === id)!).filter(Boolean);
    sim.current = { chave, c: new Combate(robos, c.perigos, c.seed, T_COMBATE), enviado: false };
  }
  const [, setQuadro] = useState(0);
  useEffect(() => {
    let raf = 0;
    let antes = performance.now();
    let acumulado = 0;
    let ultimoEnvio = 0;
    let ultimas = '';
    // a física anda pelo relógio real: se o browser abrandar (separador escondido), apanha o atraso (até 2 s de cada vez)
    const avancar = (agoraMs: number) => {
      const s = sim.current!;
      acumulado = Math.min(acumulado + (agoraMs - antes) / 1000, 2);
      antes = agoraMs;
      const h = humanos(gRef.current, agora(), sala);
      while (acumulado >= 1 / 60 && !s.c.acabou) {
        s.c.passo(h);
        acumulado -= 1 / 60;
      }
      if (agoraMs - ultimoEnvio > 500) {
        ultimoEnvio = agoraMs;
        const vidas = s.c.vidas();
        const txt = JSON.stringify(vidas);
        if (txt !== ultimas) {
          ultimas = txt;
          jogo(acao, { tipo: 'rr_vidas', id: '', vidas });
        }
      }
      if (s.c.acabou && !s.enviado) {
        s.enviado = true;
        jogo(acao, { tipo: 'rr_vidas', id: '', vidas: s.c.vidas() });
        const dano = Object.fromEntries(s.c.robos.map((r) => [r.id, r.dano]));
        const kos = Object.fromEntries(s.c.robos.map((r) => [r.id, r.kos]));
        // um instante para se ver o último KO
        setTimeout(() => jogo(acao, { tipo: 'rr_fim', id: '', ordem: s.c.ordem(), dano, kos }), 1500);
      }
    };
    const loop = (agoraMs: number) => {
      avancar(agoraMs);
      setQuadro((x) => x + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const reserva = setInterval(() => avancar(performance.now()), 100);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(reserva);
    };
  }, [chave]);

  const s = sim.current.c;
  const nomes = Object.fromEntries(c.robos.map((id) => [id, nomeRobo(roboPorId(v, id), sala)]));
  const condutores: Record<string, string> = {};
  const h = humanos(g, agora(), sala);
  for (const id of c.robos) {
    if (!h[id]) continue;
    const cond = c.condutor[id];
    const quem = cond ? cond.id : roboPorId(v, id)?.dono;
    condutores[id] = cond ? t('rrConduz', { nome: nomeDe(sala, quem!), s: Math.max(0, Math.ceil((cond.ate - agora()) / 1000)) }) : t('rrConduzPiloto', { nome: nomeDe(sala, quem!) });
  }
  const combos = [...new Set(s.pocas.map((p) => p.tipo).filter((x) => x === 'fogo' || x === 'eletrica' || x === 'vapor'))];
  const restante = Math.max(0, Math.ceil(T_COMBATE - s.t));
  const ev = s.evento && s.t - s.evento.ini < 3 ? s.evento : null;
  return (
    <div class="rr-luta">
      <div class="rr-arena-caixa">
        <ArenaSvg c={s} nomes={nomes} condutores={condutores} />
        {ev && (
          <div class="rr-placa">
            {ICONE_EVENTO[ev.tipo]} {nomeEvento(ev.tipo)}
          </div>
        )}
        <div class="rr-relogio">{restante > 0 ? `${restante} s` : t('rrEncolhe')}</div>
      </div>
      <aside class="rr-chapa">
        {v.def.modo === 'normal' ? (
          <>
            <h3>{t('rrBolo', { n: v.bolo })}</h3>
            {c.robos.map((id) => (
              <div key={id} class={'rr-linha-robo' + ((c.vidas[id] ?? 0) <= 0 ? ' ko' : '')}>
                <b>{nomes[id]}</b>
                <small>
                  {Object.entries(v.apostas)
                    .filter(([, a]) => a.robo === id)
                    .map(([j, a]) => `${nomeDe(sala, j)} ${a.valor}`)
                    .join(' · ') || t('rrNinguem')}
                </small>
              </div>
            ))}
          </>
        ) : (
          <Tabela v={v} sala={sala} destacar={c.robos} />
        )}
        <h3>{t('rrCombos')}</h3>
        <p class="rr-mini">{combos.length ? combos.map((x) => t(x === 'fogo' ? 'rrComboFogo' : x === 'eletrica' ? 'rrComboEletrica' : 'rrComboVapor')).join(' · ') : '—'}</p>
      </aside>
    </div>
  );
}

function Tabela({ v, sala, destacar = [] }: { v: VistaRagerob; sala: VistaSala; destacar?: string[] }) {
  return (
    <>
      <h3>{t('rrTabela')}</h3>
      <ol class="rr-tabela">
        {tabela(v).map((id) => (
          <li key={id} class={destacar.includes(id) ? 'on' : ''}>
            <span class="cresce">{nomeRobo(roboPorId(v, id), sala)}</span>
            <b>{v.pontos[id] ?? 0}</b>
          </li>
        ))}
      </ol>
    </>
  );
}

function Robos({ v, sala, ids, tam = 170 }: { v: VistaRagerob; sala: VistaSala; ids: string[]; tam?: number }) {
  return (
    <div class="rr-robos">
      {ids.map((id) => {
        const r = roboPorId(v, id)!;
        const apostas = Object.entries(v.apostas).filter(([, a]) => a.robo === id);
        return (
          <div key={id} class="rr-cartao-robo">
            <RoboCartao robo={r} tam={tam} />
            <b>{nomeRobo(r, sala)}</b>
            {v.fase !== 'montar' && v.def.modo === 'normal' && <small>{apostas.length ? apostas.map(([j]) => nomeDe(sala, j)).join(', ') : ''}</small>}
          </div>
        );
      })}
    </div>
  );
}

export function TvRagerob(p: PropsTvRagerob) {
  const { v, sala, agora, selFim, onOutraVez, onMenu } = p;
  const grupo = v.grupos[v.combateIdx] ?? [];
  return (
    <div class="pag tv jogo-ragerob">
      <div class="topo rr-topo">
        <span>Ragerob · {v.def.modo === 'pilotos' ? t('rrPilotos') : t('rrNormal')}</span>
        <span>
          {t('rrRonda', { r: v.ronda, t: v.rondas })} · {nomeFase(v)}
        </span>
        {v.fase !== 'combate' && v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
      </div>
      {v.restante !== null && <div class="aviso">{t('pausa')}</div>}
      {v.fase === 'combate' && v.combate && <Luta {...p} />}
      {v.fase === 'montar' && (
        <>
          <h1 class="rr-titulo">{t('rrMontarTv')}</h1>
          <Robos v={v} sala={sala} ids={v.robos.map((r) => r.id)} tam={140} />
          <QuemEnviou sala={sala} ids={v.participantes} feitos={v.montados} />
        </>
      )}
      {v.fase === 'loja' && (
        <>
          <h1 class="rr-titulo">{v.def.loja === 'leilao' ? t('rrLeilaoTv') : t('rrLojaPrivadaTv')}</h1>
          {v.def.loja === 'leilao' && (
            <div class="rr-loja">
              {v.loja.map((m, k) => (
                <div key={k} class="rr-cartao-mod">
                  <svg viewBox="-30 -36 60 50" width={110} aria-hidden="true">
                    <ModuloSvg m={m} seta />
                  </svg>
                  <b>{etiquetaModulo(m)}</b>
                  <small>{t('rrDesde', { n: PRECO[m] })}</small>
                </div>
              ))}
            </div>
          )}
          <QuemEnviou sala={sala} ids={ativos(v)} feitos={v.enviaram} />
          <Carteiras v={v} sala={sala} />
        </>
      )}
      {(v.fase === 'aposta' || v.fase === 'instalar') && (
        <>
          <h1 class="rr-titulo">{v.fase === 'aposta' ? t('rrApostaTv', { e: v.def.entrada, m: v.def.entrada + v.def.minimo }) : t('rrInstalarTv')}</h1>
          <Robos v={v} sala={sala} ids={v.def.modo === 'pilotos' ? v.robos.map((r) => r.id) : grupo} tam={v.def.modo === 'pilotos' ? 130 : 210} />
          {v.fase === 'aposta' && <QuemEnviou sala={sala} ids={ativos(v)} feitos={v.enviaram} />}
          {v.def.modo === 'normal' && <p class="centro rr-grande">{t('rrBolo', { n: v.bolo })}</p>}
        </>
      )}
      {v.fase === 'resultado' && v.resultado && (
        <div class="rr-resultado">
          <h1 class="rr-titulo">{v.resultado.vencedor ? t('rrVenceu', { nome: nomeRobo(roboPorId(v, v.resultado.vencedor), sala) }) : t('rrEmpateKo')}</h1>
          <div class="rr-colunas">
            <ol class="rr-ordem">
              {v.resultado.ordem.flatMap((gr, i) =>
                gr.map((id) => (
                  <li key={id}>
                    <span>{['🥇', '🥈', '🥉', '4.º'][Math.min(3, i)]}</span> {nomeRobo(roboPorId(v, id), sala)} · 💥 {v.resultado!.dano[id] ?? 0}
                    {v.def.modo === 'normal' && v.resultado!.passam.includes(id) && grupo.length > 2 && <b> ✔ {t('rrPassa')}</b>}
                  </li>
                )),
              )}
            </ol>
            <div class="rr-chapa">
              {v.def.modo === 'normal' ? (
                <>
                  <h3>{t('rrGanhos')}</h3>
                  {Object.entries(v.resultado.ganhos).map(([j, x]) => (
                    <div key={j}>
                      {nomeDe(sala, j)}: <b class={x >= 0 ? 'rr-mais' : 'rr-menos'}>{x >= 0 ? '+' + x : x}</b>
                    </div>
                  ))}
                </>
              ) : (
                <Tabela v={v} sala={sala} destacar={grupo} />
              )}
            </div>
          </div>
        </div>
      )}
      {v.fase === 'fim' && (
        <div class="rr-resultado">
          <h1 class="rr-titulo">{t('rrCampeao', { nome: nomeRobo(roboPorId(v, v.campeao), sala) })}</h1>
          {v.campeao && (
            <div class="centro">
              <RoboCartao robo={roboPorId(v, v.campeao)!} tam={220} />
            </div>
          )}
          <ol class="rr-ordem rr-podio">
            {classificacao(v).map((x, i) => (
              <li key={x.id}>
                {['🥇', '🥈', '🥉'][i] ?? `${i + 1}.º`} {nomeDe(sala, x.id)} · {v.def.modo === 'normal' ? moeda(x.valor) : t('rrPontos', { n: x.valor })}
              </li>
            ))}
          </ol>
          <div class="linha centro">
            <button class={'botao' + (selFim === 0 ? ' foco' : '')} onClick={onOutraVez}>
              {t('jogarOutraVez')}
            </button>
            <button class={'botao sec' + (selFim === 1 ? ' foco' : '')} onClick={onMenu}>
              {t('menu')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Carteiras({ v, sala }: { v: VistaRagerob; sala: VistaSala }) {
  return (
    <div class="rr-quem">
      {v.participantes.map((j) => (
        <span key={j} class="rr-chip">
          {nomeDe(sala, j)} {moeda(v.carteira[j] ?? 0)}
        </span>
      ))}
    </div>
  );
}
