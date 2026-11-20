import { useRef, useState } from 'preact/hooks';
import type { AcaoSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import { PlacarSevira, SlideBranco, txt } from './comuns';
import { buscarGiphy, reduzirGaleria, temGiphy } from './imagens';
import { MAX_IMAGENS, MAX_LINK, MAX_TITULO, REACOES, type Imagem, type PrivadoSevira } from './regras';
import { Reacoes, type PropsSevira } from './tv';
import { AcabarPartida } from '../../ui/acabarPartida';
import { useRascunho, useSoRascunho } from '../../ui/rascunho';

/** nome das reações para leitores de ecrã */
const NOME_REACAO: Record<string, string> = { '😂': 'Hahaha', '👏': 'Palmas', '🤯': 'Uau', '😴': 'Zzz' };

type Enviar = (a: AcaoSala) => void;
const jogo = (enviar: Enviar, acao: Extract<AcaoSala, { tipo: 'jogo' }>['acao']) => enviar({ tipo: 'jogo', acao });

/** escolher uma imagem: Galeria · GIPHY · Link */
function Escolher({ aoEscolher, fechar, links }: { aoEscolher: (img: Imagem) => void; fechar: () => void; links: boolean }) {
  const [modo, setModo] = useState<'menu' | 'giphy' | 'link'>('menu');
  const [q, setQ] = useState('');
  const [gifs, setGifs] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [erro, setErro] = useState(false);
  const ficheiro = useRef<HTMLInputElement>(null);
  return (
    <div class="popup" onClick={fechar}>
      <div class="cartao sv-escolher" onClick={(e) => e.stopPropagation()}>
        {modo === 'menu' && (
          <div class="sv-escolher-menu">
            <button class="botao" onClick={() => ficheiro.current?.click()}>
              🖼️ {t('svGaleria')}
            </button>
            {temGiphy() && (
              <button class="botao sec" onClick={() => setModo('giphy')}>
                🎞️ {t('svGiphy')}
              </button>
            )}
            {links && (
              <button class="botao sec" onClick={() => setModo('link')}>
                🔗 {t('svLink')}
              </button>
            )}
            {erro && <p class="mini">⚠ {t('svSemImagem')}</p>}
            <input
              ref={ficheiro}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.currentTarget.files?.[0];
                if (!f) return;
                const d = await reduzirGaleria(f);
                if (d) aoEscolher({ tipo: 'galeria', url: d });
                else setErro(true);
              }}
            />
          </div>
        )}
        {modo === 'giphy' && (
          <>
            <form
              class="linha"
              onSubmit={async (e) => {
                e.preventDefault();
                setGifs(await buscarGiphy(q).catch(() => []));
              }}
            >
              <input class="cresce" value={q} placeholder={t('svBuscarGif')} onInput={(e) => setQ(e.currentTarget.value)} />
              <button class="botao">🔍</button>
            </form>
            <div class="sv-gifs">
              {gifs.map((g) => (
                <button key={g} onClick={() => aoEscolher({ tipo: 'giphy', url: g })}>
                  <img src={g} alt="" loading="lazy" />
                </button>
              ))}
            </div>
            <span class="sv-giphy">{t('svPowered')}</span>
          </>
        )}
        {modo === 'link' && (
          <form
            class="sv-escolher-menu"
            onSubmit={(e) => {
              e.preventDefault();
              const u = link.trim();
              if (/^https?:\/\//i.test(u) && u.length <= MAX_LINK) aoEscolher({ tipo: 'link', url: u });
              else setErro(true);
            }}
          >
            <input type="url" value={link} placeholder="https://…" onInput={(e) => setLink(e.currentTarget.value)} />
            {erro && <p class="mini">⚠ {t('svColarLink')}</p>}
            <button class="botao">{t('svColarLink')}</button>
          </form>
        )}
        <button class="botao sec" onClick={fechar}>
          {t('fechar')}
        </button>
      </div>
    </div>
  );
}

function Preparar({ sala, v, tag, eu, enviar }: Pick<PropsSevira, 'sala' | 'v'> & { tag: string; eu: string; enviar: Enviar }) {
  const sorteado = txt(v.temas[tag], sala);
  // o rascunho sobrevive a remontar (passagem do anfitrião, recarregar): src/ui/rascunho.ts
  const g = `${sala.codigo}:sevira:p`;
  const [titulo, setTitulo] = useRascunho(g, 'titulo', sorteado);
  const [editar, setEditar] = useState(false);
  const [imgs, setImgs] = useRascunho<(Imagem | null)[]>(g, 'imgs', () => Array(MAX_IMAGENS).fill(null), (x) => Array.isArray(x) && x.length === MAX_IMAGENS);
  const [aberto, setAberto] = useState<number | null>(null);
  if (v.enviaram.includes(eu)) return <div class="cartao centro">✅ {t('svEnviado')}</div>;
  const mudar = (i: number, img: Imagem | null) => {
    setImgs(imgs.map((x, k) => (k === i ? img : x)));
    jogo(enviar, { tipo: 'sv_imagem', id: '', i, img });
  };
  return (
    <div class="sv-preparar">
      <label class="mini">{t('svTeuTema')}</label>
      {editar ? (
        <input class="sv-titulo-tel" value={titulo} maxLength={MAX_TITULO} autoFocus onInput={(e) => setTitulo(e.currentTarget.value)} onBlur={() => setEditar(false)} />
      ) : (
        <button class="sv-titulo-tel" onClick={() => setEditar(true)}>
          {titulo || sorteado} ✎
        </button>
      )}
      <label class="mini">{t('svImagens')}</label>
      <div class="sv-quadrados">
        {imgs.map((img, i) =>
          img ? (
            <button key={i} class="sv-quadrado cheio" onClick={() => mudar(i, null)} aria-label={t('svRemover')}>
              <img src={img.url} alt="" />
              <span>✕</span>
            </button>
          ) : (
            <button key={i} class="sv-quadrado" onClick={() => setAberto(i)}>
              +
            </button>
          ),
        )}
      </div>
      <p class="mini centro">
        {t('svGaleria')}
        {temGiphy() ? ` · ${t('svGiphy')}` : ''}
        {v.def.links ? ` · ${t('svLink')}` : ''}
      </p>
      {/* com "8 sorteados", nem todos os decks chegam à TV (não se diz qual: quem apresenta o quê é segredo) */}
      {v.apresentadores.length < v.participantes.length && <p class="aviso">⚠ {t('svTalvezNao', { n: v.apresentadores.length, t: v.participantes.length })}</p>}
      <button class="botao grande" onClick={() => jogo(enviar, { tipo: 'sv_enviar', id: '', titulo: titulo.trim() && titulo.trim() !== sorteado ? titulo : null })}>
        {t('enviar')}
      </button>
      {aberto !== null && (
        <Escolher
          links={!!v.def.links}
          fechar={() => setAberto(null)}
          aoEscolher={(img) => {
            mudar(aberto, img);
            setAberto(null);
          }}
        />
      )}
    </div>
  );
}

/** slider vertical de 1 a 5 ⭐: só para nas estrelas (largado entre duas, volta à de baixo) */
export function SliderNota({ valor, mudar }: { valor: number; mudar: (n: number) => void }) {
  const barra = useRef<HTMLDivElement>(null);
  const [arrasto, setArrasto] = useState<number | null>(null);
  const pos = arrasto ?? valor; // 1..5 (contínuo enquanto se arrasta)
  const de = (y: number) => {
    const r = barra.current!.getBoundingClientRect();
    return Math.max(1, Math.min(5, 1 + (4 * (r.bottom - y)) / r.height));
  };
  const pct = ((pos - 1) / 4) * 100;
  return (
    <div class="sv-nota">
      <div class="sv-estrelas">
        {[5, 4, 3, 2, 1].map((n) => (
          <button key={n} class={'sv-estrela' + (n > Math.floor(pos) ? ' cinza' : '')} onClick={() => mudar(n)} aria-label={`${n} ⭐`}>
            ★<i />
          </button>
        ))}
      </div>
      <div
        ref={barra}
        class="sv-barra-nota"
        role="slider"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={valor}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setArrasto(de(e.clientY));
        }}
        onPointerMove={(e) => arrasto !== null && setArrasto(de(e.clientY))}
        onPointerUp={(e) => {
          mudar(Math.floor(de(e.clientY)));
          setArrasto(null);
        }}
        onPointerCancel={() => setArrasto(null)}
      >
        <div class="sv-barra-cor" style={{ clipPath: `inset(${100 - pct}% 0 0 0)` }} />
        <div class="sv-pega" style={{ bottom: `calc(${pct}% - 14px)` }} />
      </div>
    </div>
  );
}

function Nota({ enviar }: { enviar: Enviar }) {
  const [n, setN] = useState(3);
  const [foi, setFoi] = useState(false);
  if (foi) return <div class="cartao centro">✅ {t('svNotaEnviada')}</div>;
  return (
    <>
      <SliderNota valor={n} mudar={setN} />
      <button
        class="botao grande"
        onClick={() => {
          jogo(enviar, { tipo: 'sv_nota', id: '', estrelas: n });
          setFoi(true);
        }}
      >
        {t('svEnviarNota')}
      </button>
    </>
  );
}

/** sem TV: o slide atual em todos os telemóveis (a imagem da galeria chega pelo canal privado) + as reações a voar */
function SlideTel({ sala, v, privado }: Pick<PropsSevira, 'sala' | 'v'> & { privado: PrivadoSevira | null }) {
  if (!v.slideAtual) return null;
  const chave = `${v.apresentador}:${v.slide}`;
  return (
    <div class="sv-tel-slide">
      <SlideBranco sala={sala} titulo={v.titulo ?? ''} s={v.slideAtual} imagem={privado?.chave === chave ? privado.imagem : null} n={v.slide + 1} total={v.nSlides} chave={chave} />
      <Reacoes lista={v.reacoes} />
    </div>
  );
}

export function TelemovelSevira({ sala, v, agora, eu, tag, enviar, privado = null }: PropsSevira & { eu: string; tag: string; enviar: Enviar; privado?: PrivadoSevira | null }) {
  const a = v.apresentador;
  const souEu = a === eu;
  const semTv = !!sala.semTv;
  useSoRascunho(v.fase === 'preparar' && v.participantes.includes(eu) && !v.enviaram.includes(eu) ? `${sala.codigo}:sevira:p` : null);
  const lider = sala.vipId === eu;
  const [ajuda, setAjuda] = useState(false);
  return (
    <div class="pag tel-sevira">
      <div class="topo">
        <span>{t('svOpcoesNome')}</span>
        <button class="chip" aria-label={t('comoJogar')} onClick={() => setAjuda(!ajuda)}>
          ⓘ
        </button>
        <AcabarPartida sala={sala} eu={eu} enviar={enviar} />
        {v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
      </div>
      {ajuda && (
        <div class="cartao" onClick={() => setAjuda(false)}>
          <b>{t('svOpcoesNome')}</b> — {t('ajudaSevira')}
        </div>
      )}
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}

      {v.fase === 'preparar' &&
        (v.participantes.includes(eu) ? <Preparar key={tag} sala={sala} v={v} tag={tag} eu={eu} enviar={enviar} /> : <p class="centro">{t(semTv ? 'svEsperaPreparar' : 'olhaTv')}</p>)}

      {v.fase === 'tema' && a && (
        <div class="cartao centro">
          {souEu ? (
            <h2>{t(semTv ? 'svEsTuSemTv' : 'svEsTu')}</h2>
          ) : (
            <>
              <p>{t('svVaiApresentar')}</p>
              <Avatar n={avatarDe(sala, a)} tam={96} />
              <h2>{nomeDe(sala, a)}</h2>
            </>
          )}
          {/* sem TV, a capa (o tema) vê-se aqui */}
          {semTv && v.titulo && <h2 class="sv-tel-tema">«{v.titulo}»</h2>}
        </div>
      )}

      {v.fase === 'apresentar' && semTv && <SlideTel sala={sala} v={v} privado={privado} />}

      {v.fase === 'apresentar' &&
        (souEu ? (
          <div class={'sv-comando' + (semTv ? ' sem-tv' : '')}>
            <p class="sv-slide-de">{t('svSlideDe', { n: v.slide + 1, t: v.nSlides })}</p>
            <div class="sv-setas">
              <button class="botao sec" disabled={v.slide === 0} onClick={() => jogo(enviar, { tipo: 'sv_slide', id: '', dir: -1 })} aria-label="◀">
                ◀
              </button>
              {v.slide >= v.nSlides - 1 ? (
                // último slide: o ▶ passa a "Terminar apresentação" (vai logo à Nota)
                <button class="botao sv-terminar" onClick={() => jogo(enviar, { tipo: 'sv_terminar', id: '' })}>
                  🏁
                  <span>{t('svTerminar')}</span>
                </button>
              ) : (
                <button class="botao" onClick={() => jogo(enviar, { tipo: 'sv_slide', id: '', dir: 1 })} aria-label="▶">
                  ▶
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <p class="centro">{t('svReaja')}</p>
            <div class={'sv-reagir' + (semTv ? ' sem-tv' : '')}>
              {REACOES.map((r) => (
                <button key={r} class="botao sec" aria-label={NOME_REACAO[r] ?? r} onClick={() => jogo(enviar, { tipo: 'sv_reagir', id: '', r })}>
                  {r}
                </button>
              ))}
            </div>
          </>
        ))}

      {v.fase === 'nota' &&
        a &&
        (souEu ? (
          <p class="cartao centro">{t('svPlateiaNota')}</p>
        ) : (
          <>
            <h2 class="centro">{t('svNotaPara', { nome: nomeDe(sala, a) })}</h2>
            <Nota key={a} enviar={enviar} />
          </>
        ))}

      {v.fase === 'fim' && (
        <>
          <h1 class="pergunta">{t('fim')}</h1>
          <div class="cartao">
            <PlacarSevira sala={sala} v={v} tam={40} />
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
      )}
    </div>
  );
}
