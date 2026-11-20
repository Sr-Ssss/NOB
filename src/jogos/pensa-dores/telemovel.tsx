import { useState } from 'preact/hooks';
import type { AcaoSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Estado } from '../5050/tv';
import { Autor, LETRAS, PlacarPensa, Topo, Votos, textoP } from './comuns';
import { Progresso } from '../../ui/ecraunico';
import { AcabarPartida } from '../../ui/acabarPartida';
import { useRascunho, useSoRascunho } from '../../ui/rascunho';
import { MAX_RESPOSTA, VOTOS_FINAL } from './regras';
import type { PropsPensa } from './tv';

type Enviar = (a: AcaoSala) => void;

/** carteira de madeira: pergunta num balão de pensamento + post-it para escrever */
function PostIt({ pergunta, max, aoEnviar, seguinte, grupo, campo }: { pergunta: string; max: number; aoEnviar: (s: string) => void; seguinte?: () => void; grupo: string; campo: string }) {
  // o rascunho sobrevive a remontar (passagem do anfitrião, recarregar): src/ui/rascunho.ts
  const [texto, setTexto] = useRascunho(grupo, campo, '');
  return (
    <div class="carteira">
      <div class="balao">{pergunta}</div>
      <textarea class="post-it" value={texto} maxLength={max} placeholder={t('pdResposta')} onInput={(e) => setTexto(e.currentTarget.value)} />
      <div class="mini centro">
        {texto.length}/{max}
      </div>
      <div class="linha">
        {seguinte && (
          <button class="botao sec" onClick={seguinte}>
            {t('pdSeguinte')}
          </button>
        )}
        <button class="botao cresce" disabled={!texto.trim()} onClick={() => aoEnviar(texto)}>
          {t('enviar')}
        </button>
      </div>
    </div>
  );
}

function Escrever({ sala, v, eu, enviar }: Pick<PropsPensa, 'sala' | 'v'> & { eu: string; enviar: Enviar }) {
  const meus = v.duelos.map((d, i) => ({ ...d, i })).filter((d) => d.autores.includes(eu));
  const g = `${sala.codigo}:pensa:${v.ronda}`;
  const [feitos, setFeitos] = useRascunho<number[]>(g, 'feitos', []);
  const [pos, setPos] = useRascunho(g, 'pos', 0);
  const falta = meus.filter((d) => !feitos.includes(d.i));
  if (!falta.length || v.enviaram.includes(eu)) return <div class="cartao centro">✅ {t('pdAcabou')}</div>;
  const d = falta[pos % falta.length];
  return (
    <>
      <p class="centro mini">
        {meus.indexOf(meus.find((x) => x.i === d.i)!) + 1}/{meus.length}
      </p>
      <PostIt
        key={d.i}
        grupo={g}
        campo={'texto' + d.i}
        pergunta={textoP(d.pergunta, sala)}
        max={MAX_RESPOSTA}
        seguinte={falta.length > 1 ? () => setPos(pos + 1) : undefined}
        aoEnviar={(texto) => {
          enviar({ tipo: 'jogo', acao: { tipo: 'responder', id: '', duelo: d.i, texto } });
          setFeitos([...feitos, d.i]);
        }}
      />
    </>
  );
}

function VotarFinal({ v, tag, enviar }: Pick<PropsPensa, 'v'> & { tag: string; enviar: Enviar }) {
  const [votos, setVotos] = useState<number[]>([]); // índices das opções, um por voto
  const mandar = (lista: number[]) => {
    setVotos(lista);
    const por: Record<number, number> = {};
    for (const i of lista) por[i] = (por[i] ?? 0) + 1;
    // a TV traduz a posição para o autor: aqui só sabemos a posição
    enviar({ tipo: 'jogo', acao: { tipo: 'votos_final', id: '', votos: Object.fromEntries(Object.entries(por).map(([i, n]) => [`#${i}`, n])) } });
  };
  return (
    <>
      <p class="centro">{t('pdVotosRestam', { n: VOTOS_FINAL - votos.length })}</p>
      <div class="giz-grelha tel">
        {v.opcoes.map((o, i) => {
          const minha = o.tag === tag;
          const n = votos.filter((x) => x === i).length;
          return (
            <button key={i} class={'giz-caixa' + (minha ? ' minha' : '') + (n ? ' escolhido' : '')} disabled={minha || votos.length >= VOTOS_FINAL} onClick={() => mandar([...votos, i])}>
              {o.texto}
              {minha && <small> ({t('pdSua')})</small>}
              {n > 0 && <span class="visto">{'✓'.repeat(n)}</span>}
            </button>
          );
        })}
      </div>
      <button class="botao sec" onClick={() => mandar([])}>
        {t('pdLimpar')}
      </button>
    </>
  );
}

export function TelemovelPensa({ sala, v, agora, eu, tag, enviar }: PropsPensa & { eu: string; tag: string; enviar: Enviar }) {
  const [ajuda, setAjuda] = useState(false);
  const [voto, setVoto] = useState<{ chave: string; i: number } | null>(null);
  const participa = v.participantes.includes(eu);
  const lider = sala.vipId === eu;
  const pergunta = textoP(v.pergunta, sala);
  const chave = `${v.ronda}:${v.atual}`;
  const eAutor = v.opcoes.some((o) => o.tag === tag);
  const meu = voto?.chave === chave ? voto.i : null;
  const escreve = participa && !v.enviaram.includes(eu);
  useSoRascunho(escreve && v.fase === 'escrever' ? `${sala.codigo}:pensa:${v.ronda}` : escreve && v.fase === 'final_escrever' ? `${sala.codigo}:pensa:final` : null);

  return (
    <div class="pag tel-pensa">
      <Topo
        v={v}
        agora={agora}
        extra={
          <>
            <button class="chip" aria-label={t('comoJogar')} onClick={() => setAjuda(!ajuda)}>
              ⓘ
            </button>
            <AcabarPartida sala={sala} eu={eu} enviar={enviar} />
          </>
        }
      />
      {ajuda && (
        <div class="cartao" onClick={() => setAjuda(false)}>
          <b>{t('pdOpcoesNome')}</b> — {t('ajudaPensa')}
        </div>
      )}
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}

      {v.fase === 'escrever' && (participa ? <Escrever key={v.ronda} sala={sala} v={v} eu={eu} enviar={enviar} /> : <p class="centro">{t('audiencia')}</p>)}

      {v.fase === 'final_escrever' &&
        (!participa ? (
          <p class="centro">{t('audiencia')}</p>
        ) : v.enviaram.includes(eu) ? (
          <div class="cartao centro">✅ {t('enviado')}</div>
        ) : (
          <PostIt grupo={`${sala.codigo}:pensa:final`} campo="texto" pergunta={pergunta} max={v.maxFinal} aoEnviar={(texto) => enviar({ tipo: 'jogo', acao: { tipo: 'responder', id: '', duelo: 0, texto } })} />
        ))}

      {(v.fase === 'escrever' || v.fase === 'final_escrever') && <Estado sala={sala} ids={v.participantes} feitos={v.enviaram} tam={36} />}

      {v.fase === 'votar' && (
        <div class="quadro tel">
          <div class="quadro-giz">
            <p class="giz-titulo pequeno">{pergunta}</p>
            {eAutor ? (
              <p class="centro">🤞 {t('pdEsTua')}</p>
            ) : (
              v.opcoes.map((o, i) => (
                <button
                  key={i}
                  class={'giz-caixa grande' + (meu === i ? ' escolhido' : '')}
                  onClick={() => {
                    setVoto({ chave, i });
                    enviar({ tipo: 'jogo', acao: { tipo: 'votar', id: '', autor: `#${i}` } });
                  }}
                >
                  {meu === i && <span class="visto">✓</span>}
                  <span><span class="giz-letra">{LETRAS[i]})</span> {o.texto}</span>
                </button>
              ))
            )}
          </div>
          <Progresso semTv={sala.semTv} ids={v.votantes} feitos={v.votaram} />
        </div>
      )}

      {v.fase === 'revelar' && v.resultado && (
        <div class="quadro tel">
          <div class="quadro-giz">
            <p class="giz-titulo pequeno">{textoP(v.resultado.pergunta, sala)}</p>
            {v.resultado.opcoes.map((o) => (
              <div key={o.autor} class="giz-caixa">
                {o.texto} <b>· {o.votos.length}</b>
                <Autor sala={sala} o={o} tam={36} />
                {/* sem TV, um só ecrã: também quem votou em quê (como na TV) */}
                {sala.semTv && <Votos sala={sala} o={o} mostrar={v.def.mostrarVotos} tam={28} />}
              </div>
            ))}
            {v.resultado.semAdversario && <p class="centro mini">{t('pdSemAdversario')}</p>}
          </div>
        </div>
      )}

      {v.fase === 'final_votar' && (
        <div class="quadro tel">
          <div class="quadro-giz">
            <p class="giz-titulo pequeno">{pergunta}</p>
            <VotarFinal key={pergunta} v={v} tag={tag} enviar={enviar} />
          </div>
        </div>
      )}

      {(v.fase === 'final_revelar' || v.fase === 'placar' || v.fase === 'fim') && (
        <>
          {v.fase === 'fim' && <h1 class="pergunta">{t('fim')}</h1>}
          {v.fase === 'final_revelar' && (
            <div class="quadro tel">
              <div class="quadro-giz">
                <p class="giz-titulo pequeno">{pergunta}</p>
                {[...v.resultadoFinal]
                  .sort((a, b) => b.pontos - a.pontos)
                  .map((o) => (
                    <div key={o.autor} class="giz-caixa">
                      {o.texto}
                      <Autor sala={sala} o={o} tam={32} />
                    </div>
                  ))}
              </div>
            </div>
          )}
          <div class="cartao">
            <PlacarPensa sala={sala} v={v} tam={40} />
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
          {v.fase === 'placar' && <p class="centro mini">{t('esperaFim')}</p>}
        </>
      )}
    </div>
  );
}
