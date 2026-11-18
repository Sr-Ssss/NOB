import { useMemo, useState } from 'preact/hooks';
import type { AcaoSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { conteudoDe, textoEm, type Item } from '../../core/conteudo';
import reserva from './conteudo.json';
import { MAX_RESPOSTA, MAX_TEXTO, type Lado } from './regras';
import { Balanca, Cabecalho, Placar, Premios, nomeDe, type PropsJogo } from './tv';
import { Progresso } from '../../ui/ecraunico';
import { useRascunho, useSoRascunho } from '../../ui/rascunho';

interface Frase {
  id: string;
  tema: string;
  texto: string;
}

const LACUNA = '___';

function sortear(lista: Frase[], evitar: string[]): Frase {
  const livres = lista.filter((f) => !evitar.includes(f.id));
  const de = livres.length ? livres : lista;
  return de[Math.floor(Math.random() * de.length)];
}

/** resposta num botão colorido; um toque abre a edição */
function RespostaEditavel({ valor, mudar, lado }: { valor: string; mudar: (s: string) => void; lado: Lado }) {
  const [editar, setEditar] = useState(false);
  const cls = 'resposta ' + (lado === 'a' ? 'sim' : 'nao');
  if (editar) {
    return (
      <input
        class={cls}
        value={valor}
        maxLength={MAX_RESPOSTA}
        autoFocus
        onInput={(e) => mudar(e.currentTarget.value)}
        onBlur={() => setEditar(false)}
        onKeyDown={(e) => e.key === 'Enter' && setEditar(false)}
      />
    );
  }
  return (
    <button class={cls} onClick={() => setEditar(true)}>
      {valor || '…'}
      <small>✏️ {t('tocarEditar')}</small>
    </button>
  );
}

function Escrever({ sala, v, enviar }: Pick<PropsJogo, 'sala' | 'v'> & { enviar: (a: AcaoSala) => void }) {
  const frases: Frase[] = useMemo(() => {
    const itens: Item[] = conteudoDe('5050', reserva);
    const todas = itens.map((i) => ({ id: i.id, tema: i.tags[0] ?? '', texto: textoEm(i, sala.idioma) }));
    const f = v.def.temas.length ? todas.filter((x) => v.def.temas.includes(x.tema)) : todas;
    return f.length ? f : todas;
  }, [sala.idioma, v.def.temas.join()]);

  // o rascunho sobrevive a remontar (passagem do anfitrião, recarregar): src/ui/rascunho.ts
  const g = `${sala.codigo}:5050:${v.ronda}`;
  const [modo, setModo] = useRascunho<'completar' | 'minha'>(g, 'modo', 'completar');
  const [frase, setFrase] = useRascunho(g, 'frase', () => sortear(frases, v.usadas), (x) => frases.some((f) => f.id === (x as Frase | null)?.id));
  const [vistas, setVistas] = useRascunho<string[]>(g, 'vistas', []);
  const [trocas, setTrocas] = useRascunho(g, 'trocas', 0);
  const [lacuna, setLacuna] = useRascunho(g, 'lacuna', '');
  const [minha, setMinha] = useRascunho(g, 'minha', '');
  const [a, setA] = useRascunho(g, 'a', t('sim'));
  const [b, setB] = useRascunho(g, 'b', t('nao'));
  const [minhaA, setMinhaA] = useRascunho(g, 'minhaA', t('sim'));
  const [minhaB, setMinhaB] = useRascunho(g, 'minhaB', t('nao'));

  const [antes, depois] = frase.texto.split(LACUNA);
  const completar = modo === 'completar';
  const texto = completar ? `${antes}${lacuna.trim()}${depois ?? ''}` : minha;
  const pronto = completar ? lacuna.trim().length > 0 : minha.trim().length > 0;

  const trocar = () => {
    const ja = [...vistas, frase.id];
    setVistas(ja);
    setFrase(sortear(frases, [...v.usadas, ...ja]));
    setTrocas(trocas + 1);
  };

  return (
    <>
      <div class="alternar">
        <button class={completar ? 'on' : ''} onClick={() => setModo('completar')}>
          {t('completar')}
        </button>
        <button class={!completar ? 'on' : ''} onClick={() => setModo('minha')}>
          {t('escreverMinha')}
        </button>
      </div>

      {completar ? (
        <>
          <div class="cartao">
            <p class="frase">
              {antes}
              <b class="lacuna">{lacuna || '_____'}</b>
              {depois}
            </p>
            <input value={lacuna} maxLength={Math.max(1, MAX_TEXTO - frase.texto.length + LACUNA.length)} placeholder={t('lacuna')} onInput={(e) => setLacuna(e.currentTarget.value)} />
            <button class="chip trocar" disabled={trocas >= 2} onClick={trocar}>
              🔄 {t('trocar')} ({2 - trocas})
            </button>
          </div>
          <div class="respostas">
            <RespostaEditavel valor={a} mudar={setA} lado="a" />
            <RespostaEditavel valor={b} mudar={setB} lado="b" />
          </div>
        </>
      ) : (
        <div class="cartao formulario">
          <label>{t('pergunta')}</label>
          <textarea value={minha} maxLength={MAX_TEXTO} onInput={(e) => setMinha(e.currentTarget.value)} />
          <div class="mini">
            {minha.length}/{MAX_TEXTO}
          </div>
          <label>{t('respostaA')}</label>
          <input value={minhaA} maxLength={MAX_RESPOSTA} onInput={(e) => setMinhaA(e.currentTarget.value)} />
          <label>{t('respostaB')}</label>
          <input value={minhaB} maxLength={MAX_RESPOSTA} onInput={(e) => setMinhaB(e.currentTarget.value)} />
        </div>
      )}

      <button
        class="botao grande enviar"
        disabled={!pronto}
        onClick={() =>
          enviar({
            tipo: 'jogo',
            acao: {
              tipo: 'enviar',
              id: '',
              texto,
              a: completar ? a : minhaA,
              b: completar ? b : minhaB,
              fraseId: completar ? frase.id : undefined,
            },
          })
        }
      >
        {t('enviar')}
      </button>
    </>
  );
}

/** pergunta no topo + 2 botões gigantes (metade do ecrã cada um) */
function Votar({ texto, a, b, voto, ativo, aoVotar }: { texto: string; a: string; b: string; voto: Lado | null; ativo: boolean; aoVotar: (l: Lado) => void }) {
  return (
    <div class="votar">
      <div class="cartao pergunta-tel">{texto}</div>
      {(['a', 'b'] as const).map((l) => (
        <button key={l} class={'gigante ' + (l === 'a' ? 'sim' : 'nao') + (voto === l ? ' escolhido' : '')} disabled={!ativo} onClick={() => aoVotar(l)}>
          {voto === l && <span class="visto">✓</span>}
          {l === 'a' ? a : b}
        </button>
      ))}
    </div>
  );
}

export function Telemovel5050({
  sala,
  v,
  agora,
  eu,
  tag,
  enviar,
}: PropsJogo & { eu: string; tag: string; enviar: (a: AcaoSala) => void }) {
  const [meuVoto, setMeuVoto] = useState<{ chave: string; lado: Lado } | null>(null);
  const [ajuda, setAjuda] = useState(false);
  const participa = v.participantes.includes(eu);
  const lider = sala.vipId === eu;
  const dil = v.dilema ?? (v.resultado ? { texto: v.resultado.texto, a: v.resultado.a, b: v.resultado.b, autorTag: undefined } : undefined);
  const chave = `${v.ronda}:${dil?.texto}`;
  const eAutor = !!v.dilema?.autorTag && v.dilema.autorTag === tag;
  const voto = meuVoto?.chave === chave ? meuVoto.lado : null;
  useSoRascunho(v.fase === 'escrever' && participa && !v.enviaram.includes(eu) ? `${sala.codigo}:5050:${v.ronda}` : null);

  const votar = (lado: Lado) => {
    setMeuVoto({ chave, lado });
    enviar({ tipo: 'jogo', acao: { tipo: 'votar', id: '', lado } });
  };

  return (
    <div class="pag tel-5050">
      <div class="topo">
        <Cabecalho v={v} agora={agora} />
        <button class="chip" aria-label={t('comoJogar')} onClick={() => setAjuda(!ajuda)}>
          ⓘ
        </button>
      </div>
      {ajuda && (
        <div class="cartao" onClick={() => setAjuda(false)}>
          <b>50/50</b> — {t('ajuda5050')}
        </div>
      )}
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}

      {v.fase === 'escrever' &&
        (!participa ? (
          <p class="centro">{t('audiencia')}</p>
        ) : v.enviaram.includes(eu) ? (
          <div class="cartao centro">✅ {t('enviado')}</div>
        ) : (
          <>
            <Progresso semTv={sala.semTv} ids={v.participantes} feitos={v.enviaram} />
            <Escrever key={v.ronda} sala={sala} v={v} enviar={enviar} />
          </>
        ))}

      {/* sem TV, um só ecrã: no fim de cada votação o telemóvel mostra a balança da TV */}
      {v.fase === 'revelar' && sala.semTv && v.resultado && (
        <>
          <div class="cartao pergunta-tel">{v.resultado.texto}</div>
          <Balanca sala={sala} a={v.resultado.a} b={v.resultado.b} segundos={null} r={v.resultado} mostrarVotos={v.def.mostrarVotos} />
          <div class="cartao centro">
            {t('autor', { nome: nomeDe(sala, v.resultado.autor) })} <b>+{v.resultado.pontos}</b>
            {v.resultado.perfeito && <span> · {t('perfeito')}</span>}
          </div>
        </>
      )}

      {(v.fase === 'mostrar' || v.fase === 'votar' || (v.fase === 'revelar' && !sala.semTv)) &&
        dil && (
          // o autor vê o mesmo ecrã (o voto dele não conta), para não se denunciar
          <>
            <Votar texto={dil.texto} a={dil.a} b={dil.b} voto={voto} ativo={v.fase === 'votar'} aoVotar={votar} />
            <p class="centro mini">{v.fase === 'votar' ? (voto ? t('votoFeito') : t('fVotar')) : v.fase === 'mostrar' ? t('fMostrar') : t('olhaTv')}</p>
            {eAutor && <p class="centro mini">🤞 {t('esTuAutor')}</p>}
            {v.fase === 'votar' && <Progresso semTv={sala.semTv} ids={v.votantes} feitos={v.votaram} />}
          </>
        )}

      {(v.fase === 'placar' || v.fase === 'fim') && (
        <>
          {v.fase === 'fim' && <h1 class="pergunta">{t('fim')}</h1>}
          <div class="cartao">
            <Placar sala={sala} v={v} tam={40} />
          </div>
          {v.fase === 'fim' && <Premios sala={sala} v={v} />}
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
          {v.fase === 'placar' && <p class="centro mini">{t('esperaFim')}</p>}
        </>
      )}
    </div>
  );
}
