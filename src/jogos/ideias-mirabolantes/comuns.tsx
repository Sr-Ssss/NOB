import type { VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { Quadro } from '../../ui/tela';
import type { Traco } from '../../ui/tracos';
import { avatarDe, nomeDe, Estado } from '../5050/tv';
import type { LinhaRanking, VistaIdeias } from './regras';
import './ideias.css';

export const ETAPAS_TXT = ['imEtapa0', 'imEtapa1', 'imEtapa2'] as const;

export interface PropsIdeias {
  sala: VistaSala;
  v: VistaIdeias;
  agora: () => number;
}

export function Topo({ v, agora }: { v: VistaIdeias; agora: () => number }) {
  return (
    <div class="topo">
      <span>{v.fase === 'pitch' && v.total > 0 ? t('imInvencao', { n: v.atual + 1, t: v.total }) : t('imOpcoesNome')}</span>
      {v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
    </div>
  );
}

/** o desenho em papel azul quadriculado (projeto de inventor) */
export function Planta({ tracos, animar = false, legenda }: { tracos: Traco[]; animar?: boolean; legenda?: string }) {
  return (
    <div class="planta">
      <Quadro tracos={tracos} animar={animar} planta />
      {legenda && <span class="planta-legenda">{legenda}</span>}
    </div>
  );
}

function Inventor({ sala, id, tam }: { sala: VistaSala; id: string; tam: number }) {
  return (
    <span class="im-inventor">
      <Avatar n={avatarDe(sala, id)} tam={tam} /> {nomeDe(sala, id)}
    </span>
  );
}

/** barras de dinheiro a subir (revelar) */
export function Barras({ sala, linhas, compacto = false }: { sala: VistaSala; linhas: LinhaRanking[]; compacto?: boolean }) {
  const max = Math.max(100, ...linhas.map((l) => l.euros));
  return (
    <div class={'barras' + (compacto ? ' compacto' : '')}>
      {linhas.map((l, i) => (
        <div key={l.inventor} class={'barra-col' + (l.vencedora ? ' vence' : '')}>
          <b class="barra-euros">{l.euros} €</b>
          <div class="barra-poco">
            <div class="barra" style={{ height: `${Math.max(2, (l.euros / max) * 100)}%`, animationDelay: `${i * 0.25}s` }} />
          </div>
          <div class="barra-nome">
            {l.vencedora && '★ '}
            {l.nome}
          </div>
          <Inventor sala={sala} id={l.inventor} tam={compacto ? 28 : 40} />
        </div>
      ))}
    </div>
  );
}

export function PlacarIdeias({ sala, v, tam = 48 }: { sala: VistaSala; v: VistaIdeias; tam?: number }) {
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

/** o que a TV mostra (também o Painel sem TV) */
export function Palco({ sala, v, compacto = false }: Omit<PropsIdeias, 'agora'> & { compacto?: boolean }) {
  const tam = compacto ? 40 : 72;
  if (v.fase === 'problema' || v.fase === 'inventar' || v.fase === 'investir') {
    const titulo = v.fase === 'problema' ? t('imProblemaTv') : v.fase === 'inventar' ? t('imInventarTv') : t('imInvestirTv');
    return (
      <div class="im-centro">
        <h1 class="pergunta">{titulo}</h1>
        {v.fase === 'investir' && (
          <div class="im-cartoes">
            {v.cartoes.map((c) => (
              <div key={c.inventor} class="im-cartao">
                <b>{c.nome}</b>
                {c.slogan && <i>“{c.slogan}”</i>}
                <Inventor sala={sala} id={c.inventor} tam={compacto ? 24 : 32} />
              </div>
            ))}
          </div>
        )}
        <Estado sala={sala} ids={v.espera} feitos={v.enviaram} tam={tam} />
      </div>
    );
  }
  if (v.fase === 'pitch' && v.pitch) {
    const p = v.pitch;
    return (
      <div class={'im-pitch' + (compacto ? ' compacto' : '')}>
        <div class="im-problema">
          <small>{t('imEtapa0')}</small>
          <div>{p.problema}</div>
        </div>
        <div class="im-pitch-corpo">
          {p.tracos ? <Planta tracos={p.tracos} animar legenda="fig. 1" /> : <div class="planta vazia" />}
          <div class="im-lado">
            {p.nome ? (
              <>
                <h1 class="im-nome">{p.nome}</h1>
                {p.slogan && <p class="im-slogan">“{p.slogan}”</p>}
              </>
            ) : (
              <p class="im-slogan">{t('imOuvir', { nome: nomeDe(sala, p.inventor) })}</p>
            )}
            <Inventor sala={sala} id={p.inventor} tam={compacto ? 36 : 56} />
            <div class="im-etapas">
              {ETAPAS_TXT.map((k, i) => (
                <span key={k} class={i <= v.etapa ? 'on' : ''}>
                  {t(k)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (v.fase === 'revelar') {
    const venc = v.ranking.filter((l) => l.vencedora);
    if (!v.ranking.length) return <h1 class="pergunta">{t('imNinguem')}</h1>;
    return (
      <div class={'im-revelar' + (compacto ? ' compacto' : '')}>
        <h1 class="pergunta">{t('imRanking')}</h1>
        <Barras sala={sala} linhas={v.ranking} compacto={compacto} />
        {venc.length > 0 && (
          <div class="im-vencedoras">
            {venc.map((l) => (
              <div key={l.inventor} class="im-vencedora">
                <Planta tracos={l.tracos} />
                <div>
                  <b>★ {t('imVencedora')}: {l.nome}</b>
                  <div class="mini">{t('imAutorProblema', { nome: nomeDe(sala, l.autor) })}: {l.problema}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
}
