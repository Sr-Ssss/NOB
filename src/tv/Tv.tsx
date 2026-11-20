import { useEffect, useRef, useState } from 'preact/hooks';
import { useHost } from '../core/ligacao';
import { t, usarIdioma } from '../core/i18n';
import { CATALOGO, descricao, motivo, nome, ordenarMenu, type InfoJogo } from '../core/jogos';
import { jogoAtivo, ligados, podeComecar, vistaSala, type Idioma, type Tecla } from '../core/sala';
import { Boneco } from '../ui/comuns';
import { emCurso } from '../jogos/ecras';
import { AvisoSaidasTv } from '../ui/saidas';
import { Qr, linkJogar } from '../ui/qr';
import { EcraAbertura } from '../ui/abertura';
import { PlacarTorneio, Roleta, textosDoModo } from '../ui/modos';
import { PalcoTv } from '../ui/palco';

export function textoMotivo(j: InfoJogo, n: number, semTv = false): string {
  const m = motivo(j, n, semTv);
  if (!m) return '';
  if (m.tipo === 'em_breve') return t('porqueEmBreve');
  if (m.tipo === 'tv') return t('porqueTv');
  if (m.tipo === 'poucos') return t('porquePoucos', { n: m.precisa, t: m.tem });
  return t('porqueMuitos', { n: m.max, t: m.tem });
}

/** a TV desenha num palco 1920×1080 escalado ao ecrã: tudo cabe sem scroll (fase 3) */
export function Tv({ idioma }: { idioma: Idioma }) {
  return (
    <PalcoTv>
      <EcraTv idioma={idioma} />
    </PalcoTv>
  );
}

function EcraTv({ idioma }: { idioma: Idioma }) {
  const [sel, setSel] = useState(0); // jogo em destaque
  const [selFim, setSelFim] = useState(0); // 0 = jogar outra vez, 1 = menu
  const tecla = useRef<(k: Tecla) => void>(() => {});
  const { estado: s, ligado, acao, impressao, agora } = useHost(idioma, (k) => tecla.current(k));
  usarIdioma(s.idioma);
  textosDoModo(s);

  const n = ligados(s).length;
  // sem filtros (20/11): os que dão primeiro, por duração; os que não dão no fim
  const lista = ordenarMenu(CATALOGO, n);
  const atual = lista[Math.min(sel, lista.length - 1)];

  // OK no comando: o mesmo "Jogar" do telemóvel (espera que todos estejam prontos; sem tutorial)
  const lancar = (j: InfoJogo | undefined) => {
    if (j && !motivo(j, n) && podeComecar(s)) acao({ tipo: 'jogar', id: '', jogo: j.id });
  };

  tecla.current = (k) => {
    if (k === 'recarregar') return location.reload();
    // abertura a passar: OK / Voltar = saltar o tutorial
    if (s.tutorial) {
      if (k === 'ok' || k === 'voltar') acao({ tipo: 'saltar', id: '' });
      return;
    }
    // à espera de que todos estejam prontos: OK força o início, Voltar cancela
    if (s.preparar) {
      if (k === 'ok') acao({ tipo: 'forcar', id: '' });
      if (k === 'voltar' || k === 'menu') acao({ tipo: 'preparar_cancelar', id: '' });
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
    // lista em 2 colunas (fase 3): ↑↓ mudam de linha, ←→ de coluna
    const passo = { baixo: 2, cima: -2, dir: 1, esq: -1 }[k as string];
    if (passo) setSel((x) => (x + passo >= 0 && x + passo < lista.length ? x + passo : x));
    if (k === 'ok') lancar(atual);
    if (k === 'menu') setSel(0);
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
  if (s.tutorial)
    return (
      <>
        <EcraAbertura ab={s.tutorial} idioma={s.idioma} agora={agora} tv saltar={s.tutorial.fase !== 'carregar' || s.tutorial.ver ? () => acao({ tipo: 'saltar', id: '' }) : null} />
        <div class="rodape-codigo tv">{s.codigo}</div>
      </>
    );

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

  // modos (src/ui/modos.tsx): placar do torneio entre jogos e roleta por cima
  const vistaM = s.roleta || s.torneio ? vistaSala(s) : null;
  const roleta = vistaM?.roleta ? <Roleta vista={vistaM} agora={agora} tv /> : null;
  if (vistaM?.torneio && vistaM.torneio.fase !== 'jogo')
    return (
      <>
        <PlacarTorneio vista={vistaM} lider={false} enviar={acao} tv />
        {roleta}
        <div class="rodape-codigo tv">{s.codigo}</div>
      </>
    );

  const prontos = s.jogadores.filter((j) => j.ligado && j.pronto).length;
  const aPreparar = s.preparar ? CATALOGO.find((x) => x.id === s.preparar!.jogo) : undefined;
  return (
    <div class="tv-lobby">
      <section class="destaque">
        {aPreparar ? (
          <>
            <h1>{nome(aPreparar, s.idioma)}</h1>
            <p class="desc">{t('mjPreparando', { jogo: nome(aPreparar, s.idioma) })}</p>
            <p class="tempo">{t('prontos', { n: prontos, t: s.jogadores.filter((j) => j.ligado && !j.bot).length })}</p>
            <button class="botao sec" onClick={() => acao({ tipo: 'forcar', id: '' })}>
              ⏩ {t('mjForcar')} · OK
            </button>
          </>
        ) : atual && (
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
                ▶ {t('jogar')} · OK
              </button>
            )}
          </>
        )}
      </section>

      <section class="lista-jogos">
        <ol>
          {lista.map((j, i) => {
            const m = textoMotivo(j, n);
            return (
              <li key={j.id}>
                <button
                  class={'item-jogo' + (i === sel ? ' foco' : '') + (m ? ' esbatido' : '')}
                  onClick={() => setSel(i)}
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
      {roleta}
    </div>
  );
}
