import { useState } from 'preact/hooks';
import type { AcaoSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Temporizador } from '../../ui/comuns';
import { Tela } from '../../ui/tela';
import type { Traco } from '../../ui/tracos';
import { MAX_TITULO, type Titulo } from './regras';
import { Moldura, Palco, PlacarMona, type PropsMona } from './comuns';

type Enviar = (a: AcaoSala) => void;
const jogo = (enviar: Enviar, acao: Record<string, unknown>) => enviar({ tipo: 'jogo', acao: { id: '', ...acao } as never });

/** tela branca 4:3 + título sorteado (editável) + Enviar */
function Desenhar({ sorteado, idioma, enviar }: { sorteado: Titulo | undefined; idioma: string; enviar: Enviar }) {
  const original = sorteado ? (idioma === 'en' ? sorteado.en : sorteado.pt) : '';
  const [tracos, setTracos] = useState<Traco[]>([]);
  const [titulo, setTitulo] = useState(original);
  const [editar, setEditar] = useState(false);
  const [aviso, setAviso] = useState(false);
  return (
    <div class="mona-tel">
      <div class="mona-titulo">
        <span>{t('mlDesenhe')}</span>
        {editar ? (
          <input value={titulo} maxLength={MAX_TITULO} onInput={(e) => setTitulo(e.currentTarget.value)} onBlur={() => setEditar(false)} autoFocus />
        ) : (
          <b class="cresce">{titulo || original}</b>
        )}
        <button class="chip" aria-label={t('mlEditar')} onClick={() => setEditar(!editar)}>
          ✎
        </button>
      </div>
      <Tela
        tracos={tracos}
        mudar={(x) => {
          setTracos(x);
          setAviso(false);
        }}
      />
      {aviso && <p class="centro mini">{t('mlVazio')}</p>}
      <button
        class="botao grande"
        onClick={() => {
          if (!tracos.length) return setAviso(true);
          jogo(enviar, { tipo: 'ml_desenho', tracos, titulo: titulo.trim() || original });
        }}
      >
        {t('enviar')}
      </button>
    </div>
  );
}

function Inventar({ recusado, enviar }: { recusado: boolean; enviar: Enviar }) {
  const [texto, setTexto] = useState('');
  return (
    <div class="cartao mona-tel">
      <label>{t('mlInventar')}</label>
      {recusado && <div class="aviso">{t('mlRecusado')}</div>}
      <input value={texto} maxLength={MAX_TITULO} onInput={(e) => setTexto(e.currentTarget.value)} />
      <div class="mini centro">
        {texto.length}/{MAX_TITULO}
      </div>
      <button class="botao grande" disabled={!texto.trim()} onClick={() => jogo(enviar, { tipo: 'ml_falso', texto })}>
        {t('enviar')}
      </button>
    </div>
  );
}

function Eu({ sala, v, eu, tag, enviar }: Omit<PropsMona, 'agora'> & { eu: string; tag: string; enviar: Enviar }) {
  const [escolha, setEscolha] = useState<{ chave: string; i: number } | null>(null);
  const participa = v.participantes.includes(eu);
  const souAutor = v.autorTag === tag;
  const chave = `${v.ronda}:${v.atual}`;
  const meu = escolha?.chave === chave ? escolha.i : null;
  const espero = (txt: string) => <div class="cartao centro">{txt}</div>;

  if (v.fase === 'desenhar') {
    if (!participa) return espero(t('mlPlateia'));
    if (v.enviaram.includes(eu)) return espero('✅ ' + t('mlEnviado'));
    return <Desenhar key={v.ronda} sorteado={v.sorteados[tag]} idioma={sala.idioma} enviar={enviar} />;
  }
  if (v.fase === 'inventar' || v.fase === 'escolher') {
    const obra = sala.semTv && <Moldura v={v} animar={false} />;
    if (souAutor) return <>{obra}{espero('🎨 ' + t('mlTeuDesenho'))}</>;
    if (v.fase === 'inventar') {
      if (!participa) return <>{obra}{espero(t('mlPlateia'))}</>;
      if (v.enviaram.includes(eu)) return <>{obra}{espero('✅ ' + t('mlEnviado'))}</>;
      return (
        <>
          {obra}
          <Inventar key={chave} recusado={v.recusados.includes(tag)} enviar={enviar} />
        </>
      );
    }
    const ja = v.enviaram.includes(eu);
    return (
      <>
        {obra}
        <h2 class="centro">{t('mlEscolher')}</h2>
        {!participa && <p class="centro mini">{t('mlPlateia')}</p>}
        <div class="placas-tel">
          {v.opcoes.map((o, i) => {
            const minha = o.tags.includes(tag);
            return (
              <button
                key={i}
                class={'placa' + (minha ? ' minha' : '') + (meu === i ? ' escolhida' : '')}
                disabled={minha || ja}
                onClick={() => {
                  setEscolha({ chave, i });
                  jogo(enviar, { tipo: 'ml_escolher', i });
                }}
              >
                <div class="placa-texto">
                  {meu === i && '✓ '}
                  {o.texto}
                  {minha && <small> ({t('mlSua')})</small>}
                </div>
              </button>
            );
          })}
        </div>
        {ja && <p class="centro mini">{t('mlEscolheu')}</p>}
      </>
    );
  }
  if (v.fase === 'revelar') return <Palco sala={sala} v={v} compacto />;
  return null;
}

export function TelemovelMona({ sala, v, agora, eu, tag, enviar }: PropsMona & { eu: string; tag: string; enviar: Enviar }) {
  const [ajuda, setAjuda] = useState(false);
  const [painel, setPainel] = useState(false);
  const lider = sala.vipId === eu;
  const fimOuPlacar = v.fase === 'placar' || v.fase === 'fim';
  return (
    <div class="pag jogo-mona">
      <div class="topo">
        <span>{t('ronda', { n: v.ronda, t: v.rondas })}</span>
        <button class="chip" aria-label={t('comoJogar')} onClick={() => setAjuda(!ajuda)}>
          ⓘ
        </button>
        {v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
      </div>
      {ajuda && (
        <div class="cartao" onClick={() => setAjuda(false)}>
          <b>{t('mlOpcoesNome')}</b> — {t('ajudaMona')}
        </div>
      )}
      {v.restante !== null && <div class="aviso">{t('pausa')}</div>}
      {sala.semTv && !fimOuPlacar && (
        <div class="separadores">
          <button class={painel ? '' : 'on'} onClick={() => setPainel(false)}>
            {t('swEu')}
          </button>
          <button class={painel ? 'on' : ''} onClick={() => setPainel(true)}>
            {t('swPainel')}
          </button>
        </div>
      )}
      {fimOuPlacar ? (
        <>
          {v.fase === 'fim' && <h1 class="pergunta">{t('fim')}</h1>}
          <div class="cartao">
            <PlacarMona sala={sala} v={v} tam={40} />
          </div>
          {v.fase === 'fim' && lider && (
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
        <Palco sala={sala} v={v} compacto />
      ) : (
        <Eu sala={sala} v={v} eu={eu} tag={tag} enviar={enviar} />
      )}
    </div>
  );
}
