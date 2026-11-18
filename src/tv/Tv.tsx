import qrcode from 'qrcode-generator';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useHost } from '../core/ligacao';
import { t, usarIdioma } from '../core/i18n';
import { CATALOGO, descricao, filtrar, motivo, nome, type Filtro, type InfoJogo } from '../core/jogos';
import { jogoAtivo, ligados, podeComecar, vistaSala, type EstadoSala, type Idioma, type Tecla } from '../core/sala';
import { Boneco } from '../ui/comuns';
import { emCurso } from '../jogos/ecras';
import { AvisoSaidasTv } from '../ui/saidas';

function Qr({ texto, tam }: { texto: string; tam: number }) {
  const d = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(texto);
    q.make();
    const n = q.getModuleCount();
    let p = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) p += `M${x} ${y}h1v1h-1z`;
    return { p, n };
  }, [texto]);
  return (
    <svg class="qr" width={tam} height={tam} viewBox={`-2 -2 ${d.n + 4} ${d.n + 4}`} role="img" aria-label="QR">
      <rect x="-2" y="-2" width={d.n + 4} height={d.n + 4} fill="#fff" />
      <path d={d.p} fill="#1d1b26" />
    </svg>
  );
}

/** `k` = impressão digital da TV: o telemóvel só aceita vistas assinadas por ela */
function linkJogar(codigo: string, k: string): string {
  const base = (import.meta.env.VITE_LINK_JOGAR as string | undefined) ?? `${location.origin}${location.pathname}`;
  return `${base}#/jogar?sala=${codigo}&k=${k}`;
}

export const FILTROS: [Filtro, Parameters<typeof t>[0]][] = [
  ['rapidos', 'fRapidos'],
  ['pessoas', 'fPessoas'],
  ['tv', 'fTv'],
  ['semtv', 'fSemTv'],
];

export function textoMotivo(j: InfoJogo, n: number, semTv = false): string {
  const m = motivo(j, n, semTv);
  if (!m) return '';
  if (m.tipo === 'em_breve') return t('porqueEmBreve');
  if (m.tipo === 'tv') return t('porqueTv');
  if (m.tipo === 'poucos') return t('porquePoucos', { n: m.precisa, t: m.tem });
  return t('porqueMuitos', { n: m.max, t: m.tem });
}

/** tutorial antes do jogo, na TV (auditoria E3): o mesmo dos telemóveis, em grande; OK no comando salta */
function TutorialTv({ s, agora, saltar }: { s: EstadoSala; agora: () => number; saltar: () => void }) {
  const [, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), 500);
    return () => clearInterval(i);
  }, []);
  const j = CATALOGO.find((x) => x.id === s.tutorial?.jogo);
  // hora do anfitrião (a mesma com que se marcou o fim do tutorial)
  const seg = Math.max(0, Math.ceil(((s.tutorial?.ate ?? 0) - agora()) / 1000));
  return (
    <div class="pag tv centro">
      <h1 class="pergunta">
        {t('tutorial')} · {j ? nome(j, s.idioma) : ''}
      </h1>
      <div class="video">
        <span>▶ {t('tutorialEmBreve')}</span>
      </div>
      <p class="tempo">{seg}</p>
      <button class="botao sec" onClick={saltar}>
        {t('saltar')} · OK
      </button>
      <div class="rodape-codigo tv">{s.codigo}</div>
    </div>
  );
}

export function Tv({ idioma }: { idioma: Idioma }) {
  const [pesquisa, setPesquisa] = useState('');
  const [filtros, setFiltros] = useState<Filtro[]>([]);
  const [zona, setZona] = useState<'lista' | 'filtros'>('lista');
  const [sel, setSel] = useState(0); // jogo em destaque
  const [selFiltro, setSelFiltro] = useState(0);
  const [selFim, setSelFim] = useState(0); // 0 = jogar outra vez, 1 = menu
  const tecla = useRef<(k: Tecla) => void>(() => {});
  const { estado: s, ligado, acao, impressao, agora } = useHost(idioma, (k) => tecla.current(k));
  usarIdioma(s.idioma);

  const n = ligados(s).length;
  const lista = filtrar(CATALOGO, pesquisa, filtros, n, s.idioma);
  const atual = lista[Math.min(sel, lista.length - 1)];

  const lancar = (j: InfoJogo | undefined) => {
    if (j && !motivo(j, n) && podeComecar(s)) acao({ tipo: 'comecar', id: '', jogo: j.id });
  };
  const alternarFiltro = (f: Filtro) => setFiltros((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]));

  tecla.current = (k) => {
    if (k === 'recarregar') return location.reload();
    // tutorial a passar: OK / Voltar = saltar
    if (s.tutorial) {
      if (k === 'ok' || k === 'voltar') acao({ tipo: 'saltar', id: '' });
      return;
    }
    const ja = jogoAtivo(s);
    if (ja) {
      if (ja.fase !== 'fim') return;
      if (k === 'esq' || k === 'dir') setSelFim((x) => 1 - x);
      if (k === 'ok') acao(selFim === 0 ? { tipo: 'outra_vez', id: '' } : { tipo: 'menu', id: '' });
      if (k === 'voltar' || k === 'menu') acao({ tipo: 'menu', id: '' });
      return;
    }
    if (zona === 'lista') {
      if (k === 'baixo') setSel((x) => Math.min(x + 1, lista.length - 1));
      if (k === 'cima') {
        if (sel === 0) setZona('filtros');
        else setSel((x) => x - 1);
      }
      if (k === 'ok') lancar(atual);
    } else {
      if (k === 'esq') setSelFiltro((x) => Math.max(0, x - 1));
      if (k === 'dir') setSelFiltro((x) => Math.min(FILTROS.length - 1, x + 1));
      if (k === 'ok') alternarFiltro(FILTROS[selFiltro][0]);
      if (k === 'baixo' || k === 'voltar') setZona('lista');
    }
    if (k === 'menu') {
      setPesquisa('');
      setFiltros([]);
      setZona('lista');
      setSel(0);
    }
  };

  // comando físico da TV / teclado = o mesmo que o comando virtual
  useEffect(() => {
    const mapa: Record<string, Tecla> = {
      ArrowUp: 'cima',
      ArrowDown: 'baixo',
      ArrowLeft: 'esq',
      ArrowRight: 'dir',
      Enter: 'ok',
      Escape: 'voltar',
      Backspace: 'voltar',
      ContextMenu: 'menu',
    };
    const f = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const k = mapa[e.key];
      if (k) {
        e.preventDefault();
        tecla.current(k);
      }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);

  if (ligado === false) return <div class="pag tv centro">{t('semLigacao')}</div>;
  if (s.tutorial) return <TutorialTv s={s} agora={agora} saltar={() => acao({ tipo: 'saltar', id: '' })} />;

  const ativo = emCurso(s);
  if (ativo) {
    const vista = vistaSala(s);
    return (
      <>
        {ativo.j.e.tv({ g: ativo.g, v: emCurso(vista)!.g, sala: vista, agora, selFim, onOutraVez: () => acao({ tipo: 'outra_vez', id: '' }), onMenu: () => acao({ tipo: 'menu', id: '' }), acao })}
        <div class="rodape-codigo tv">{s.codigo}</div>
        <AvisoSaidasTv s={s} />
      </>
    );
  }

  const prontos = s.jogadores.filter((j) => j.ligado && j.pronto).length;
  return (
    <div class="tv-lobby">
      <section class="destaque">
        {atual && (
          <>
            <div class="video">
              <span>▶ {t('videoEmBreve')}</span>
            </div>
            <h1>{nome(atual, s.idioma)}</h1>
            <p class="desc">{descricao(atual, s.idioma)}</p>
            <div class="linha">
              <span class="chip">👥 {t('jogadoresN', { a: atual.min, b: atual.max })}</span>
              <span class="chip">⏱ {t('minutosN', { m: atual.minutos })}</span>
              {atual.precisaTv && <span class="chip">📺 {t('fTv')}</span>}
            </div>
            {motivo(atual, n) ? (
              <p class="porque">⚠ {textoMotivo(atual, n)}</p>
            ) : (
              <button class="botao grande" onClick={() => lancar(atual)} disabled={!podeComecar(s)}>
                ▶ {t('comecar')} · {t('okParaComecar')}
              </button>
            )}
          </>
        )}
      </section>

      <section class="lista-jogos">
        <div class="linha">
          <input class="pesquisa" placeholder={`🔍 ${t('pesquisar')}`} value={pesquisa} onInput={(e) => (setPesquisa(e.currentTarget.value), setSel(0))} />
        </div>
        <div class="opcoes">
          {FILTROS.map(([f, k], i) => (
            <button
              key={f}
              class={'chip' + (filtros.includes(f) ? ' on' : '') + (zona === 'filtros' && selFiltro === i ? ' foco' : '')}
              onClick={() => (alternarFiltro(f), setSel(0))}
            >
              {t(k)}
            </button>
          ))}
        </div>
        <ol>
          {lista.map((j, i) => {
            const m = textoMotivo(j, n);
            return (
              <li key={j.id}>
                <button
                  class={'item-jogo' + (i === sel && zona === 'lista' ? ' foco' : '') + (m ? ' esbatido' : '')}
                  onClick={() => (setSel(i), setZona('lista'))}
                  onDblClick={() => lancar(j)}
                >
                  <b>{nome(j, s.idioma)}</b>
                  {m && <small>{m}</small>}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <footer class="faixa">
        <Qr texto={linkJogar(s.codigo, impressao)} tam={150} />
        <div class="faixa-codigo">
          <small>{t('entraNoCelular')}</small>
          <span class="codigo-grande">{s.codigo}</span>
          {s.fechada && <small>{t('mbFechadaTv')}</small>}
        </div>
        <div class="faixa-bonecos">
          {s.jogadores.length === 0 ? (
            <span class="mini">{t('esperandoJogadores')}</span>
          ) : (
            s.jogadores.map((j) => <Boneco key={j.id} j={j} tam={72} marca={j.id === s.vipId ? '👑' : j.bot ? '🤖' : j.pronto ? '✓' : undefined} />)
          )}
        </div>
        <div class="faixa-info">
          <span>{t('prontos', { n: prontos, t: n })}</span>
          <span class="mini">{t('liderComando')}</span>
          {n > 0 && n < 3 && <span class="mini">{t('minimo3')}</span>}
        </div>
      </footer>
    </div>
  );
}
