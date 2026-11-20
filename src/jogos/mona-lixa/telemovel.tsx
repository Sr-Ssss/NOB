import { useState } from 'preact/hooks';
import type { AcaoSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Temporizador } from '../../ui/comuns';
import { Tela } from '../../ui/tela';
import type { Traco } from '../../ui/tracos';
import { MAX_TITULO, type Titulo } from './regras';
import { Moldura, Palco, PlacarMona, type PropsMona } from './comuns';
import { Espera, Progresso } from '../../ui/ecraunico';
import { AcabarPartida } from '../../ui/acabarPartida';
import { useRascunho, useSoRascunho } from '../../ui/rascunho';

type Enviar = (a: AcaoSala) => void;
const jogo = (enviar: Enviar, acao: Record<string, unknown>) => enviar({ tipo: 'jogo', acao: { id: '', ...acao } as never });

/** rascunhos (src/ui/rascunho.ts): o desenho é por ronda, o título falso por obra */
const grupoMona = (codigo: string, v: PropsMona['v'], qual: 'd' | 'i') => (qual === 'd' ? `${codigo}:mona:${v.ronda}:d` : `${codigo}:mona:${v.ronda}:${v.atual}:i`);

/** tela branca 4:3 + título sorteado (editável) + Enviar */
function Desenhar({ sorteado, idioma, enviar, grupo }: { sorteado: Titulo | undefined; idioma: string; enviar: Enviar; grupo: string }) {
  const original = sorteado ? (idioma === 'en' ? sorteado.en : sorteado.pt) : '';
  // o rascunho sobrevive a remontar (passagem do anfitrião, recarregar): src/ui/rascunho.ts
  const [tracos, setTracos] = useRascunho<Traco[]>(grupo, 'tracos', []);
  const [titulo, setTitulo] = useRascunho(grupo, 'titulo', original);
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

function Inventar({ recusado, enviar, grupo }: { recusado: boolean; enviar: Enviar; grupo: string }) {
  const [texto, setTexto] = useRascunho(grupo, 'texto', '');
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
  // sem TV, à espera vê-se o que a TV mostraria (um só ecrã)
  const espero = (txt: string) => <Espera semTv={sala.semTv} texto={txt} palco={<Palco sala={sala} v={v} compacto />} />;

  if (v.fase === 'desenhar') {
    if (!participa) return espero(t('mlPlateia'));
    if (v.enviaram.includes(eu)) return espero('✅ ' + t('mlEnviado'));
    return <><Progresso semTv={sala.semTv} ids={v.espera} feitos={v.enviaram} /><Desenhar key={v.ronda} grupo={grupoMona(sala.codigo, v, 'd')} sorteado={v.sorteados[tag]} idioma={sala.idioma} enviar={enviar} /></>;
  }
  if (v.fase === 'inventar' || v.fase === 'escolher') {
    const obra = sala.semTv && <Moldura v={v} animar={false} />;
    if (souAutor) return espero('🎨 ' + t('mlTeuDesenho'));
    if (v.fase === 'inventar') {
      if (!participa) return espero(t('mlPlateia'));
      if (v.enviaram.includes(eu)) return espero('✅ ' + t('mlEnviado'));
      return (
        <>
          {obra}
          <Progresso semTv={sala.semTv} ids={v.espera} feitos={v.enviaram} />
          <Inventar key={chave} grupo={grupoMona(sala.codigo, v, 'i')} recusado={v.recusados.includes(tag)} enviar={enviar} />
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
        <Progresso semTv={sala.semTv} ids={v.espera} feitos={v.enviaram} />
      </>
    );
  }
  if (v.fase === 'revelar') return <Palco sala={sala} v={v} compacto />;
  return null;
}

export function TelemovelMona({ sala, v, agora, eu, tag, enviar }: PropsMona & { eu: string; tag: string; enviar: Enviar }) {
  const [ajuda, setAjuda] = useState(false);
  const lider = sala.vipId === eu;
  const fimOuPlacar = v.fase === 'placar' || v.fase === 'fim';
  const escreve = v.participantes.includes(eu) && !v.enviaram.includes(eu);
  useSoRascunho(escreve && v.fase === 'desenhar' ? grupoMona(sala.codigo, v, 'd') : escreve && v.fase === 'inventar' && v.autorTag !== tag ? grupoMona(sala.codigo, v, 'i') : null);
  return (
    <div class="pag jogo-mona">
      <div class="topo">
        <span>{t('ronda', { n: v.ronda, t: v.rondas })}</span>
        <button class="chip" aria-label={t('comoJogar')} onClick={() => setAjuda(!ajuda)}>
          ⓘ
        </button>
        <AcabarPartida sala={sala} eu={eu} enviar={enviar} />
        {v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
      </div>
      {ajuda && (
        <div class="cartao" onClick={() => setAjuda(false)}>
          <b>{t('mlOpcoesNome')}</b> — {t('ajudaMona')}
        </div>
      )}
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}
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
      ) : (
        <Eu sala={sala} v={v} eu={eu} tag={tag} enviar={enviar} />
      )}
    </div>
  );
}
