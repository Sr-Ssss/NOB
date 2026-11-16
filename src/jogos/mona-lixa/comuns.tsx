import { useEffect, useState } from 'preact/hooks';
import type { VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { Quadro } from '../../ui/tela';
import { avatarDe, nomeDe, Estado } from '../5050/tv';
import { T_REVELAR, type OpcaoRevelada, type VistaMona } from './regras';
import './mona.css';

export interface PropsMona {
  sala: VistaSala;
  v: VistaMona;
  agora: () => number;
}

export function Topo({ v, agora }: { v: VistaMona; agora: () => number }) {
  const emObra = v.fase === 'inventar' || v.fase === 'escolher' || v.fase === 'revelar';
  return (
    <div class="topo">
      <span>
        {t('ronda', { n: v.ronda, t: v.rondas })}
        {emObra && v.total > 0 ? ' · ' + t('mlObra', { n: v.atual + 1, t: v.total }) : ''}
      </span>
      {v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
    </div>
  );
}

/** o desenho numa moldura dourada, como obra-prima */
export function Moldura({ v, animar = true }: { v: VistaMona; animar?: boolean }) {
  if (!v.desenho) return null;
  return (
    <div class="moldura">
      <Quadro tracos={v.desenho} animar={animar && v.fase === 'inventar'} />
    </div>
  );
}

/** placa de museu (título) */
export function Placa({ texto, class: c = '', children }: { texto: string; class?: string; children?: preact.ComponentChildren }) {
  return (
    <div class={'placa ' + c}>
      <div class="placa-texto">{texto}</div>
      {children}
    </div>
  );
}

/** quantas placas já se viram na revelação (uma de cada vez; a verdadeira no fim) */
function useReveladas(n: number, chave: string): number {
  const semAnim = (window as unknown as { nobSemAnimacao?: boolean }).nobSemAnimacao;
  const [k, setK] = useState(semAnim ? n : 1);
  useEffect(() => {
    if (semAnim) return setK(n);
    setK(1);
    const passo = Math.max(700, (T_REVELAR * 1000 - 1500) / Math.max(1, n));
    const i = setInterval(() => setK((x) => Math.min(n, x + 1)), passo);
    return () => clearInterval(i);
  }, [chave]);
  return k;
}

function PlacaRevelada({ sala, o }: { sala: VistaSala; o: OpcaoRevelada }) {
  return (
    <Placa texto={o.texto} class={'revelada' + (o.verdadeiro ? ' verdadeira' : '')}>
      <div class="placa-quem">
        {o.verdadeiro ? <b>★ {t('mlVerdadeiro')}</b> : o.casa ? <span>🏛 {t('mlDaCasa')}</span> : o.autores.map((a) => <span key={a} class="placa-autor"><Avatar n={avatarDe(sala, a)} tam={28} /> {nomeDe(sala, a)}</span>)}
        {o.pontos > 0 && <b class="placa-pontos">+{o.pontos}</b>}
      </div>
      <div class="placa-bonecos">
        {o.escolheram.map((id) => (
          <span key={id} class="cair">
            <Avatar n={avatarDe(sala, id)} tam={40} />
          </span>
        ))}
      </div>
    </Placa>
  );
}

export function PlacarMona({ sala, v, tam = 48 }: { sala: VistaSala; v: VistaMona; tam?: number }) {
  return (
    <div class="placar">
      <ol>
        {v.podio.map((p) => (
          <li key={p.id}>
            <span class="lugar">{p.lugar}º</span>
            <Avatar n={avatarDe(sala, p.id)} tam={tam} />
            <span class="cresce">{nomeDe(sala, p.id)}</span>
            <span>{p.pontos}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** a sala do museu: o que a TV mostra (também o Painel sem TV) */
export function Palco({ sala, v, compacto = false }: Omit<PropsMona, 'agora'> & { compacto?: boolean }) {
  const tam = compacto ? 44 : 72;
  const n = v.revelacao.length;
  const vistas = useReveladas(n, `${v.ronda}:${v.atual}:${v.fase}`);
  if (v.fase === 'desenhar') {
    return (
      <div class="museu-centro">
        <h1 class="pergunta">{t('mlDesenharTv')}</h1>
        <Estado sala={sala} ids={v.espera} feitos={v.enviaram} tam={tam} />
      </div>
    );
  }
  if (v.fase === 'placar') {
    return (
      <div class="cartao">
        <h2>{t('placar')}</h2>
        <PlacarMona sala={sala} v={v} tam={compacto ? 36 : 56} />
      </div>
    );
  }
  if (v.fase === 'fim') return null;
  return (
    <div class={'museu' + (compacto ? ' compacto' : '')}>
      <div class="museu-obra">
        <Moldura v={v} />
        {v.autor && (
          <div class="museu-autor">
            <Avatar n={avatarDe(sala, v.autor)} tam={compacto ? 32 : 48} /> {t('mlAutor', { nome: nomeDe(sala, v.autor) })}
          </div>
        )}
      </div>
      <div class="museu-lado">
        {v.fase === 'inventar' && (
          <>
            <h2 class="museu-titulo">{t('mlInventarTv')}</h2>
            <Estado sala={sala} ids={v.espera} feitos={v.enviaram} tam={compacto ? 36 : 60} />
          </>
        )}
        {v.fase === 'escolher' && (
          <>
            <h2 class="museu-titulo">{t('mlEscolher')}</h2>
            <div class="placas">
              {v.opcoes.map((o, i) => (
                <Placa key={i} texto={o.texto} />
              ))}
            </div>
            <Estado sala={sala} ids={v.espera} feitos={v.enviaram} tam={compacto ? 32 : 48} />
          </>
        )}
        {v.fase === 'revelar' && (
          <div class="placas">
            {v.revelacao.slice(0, vistas).map((o, i) => (
              <PlacaRevelada key={i} sala={sala} o={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
