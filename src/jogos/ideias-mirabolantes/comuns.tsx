import type { ComponentChildren } from 'preact';
import type { VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { Quadro } from '../../ui/tela';
import type { Traco } from '../../ui/tracos';
import { avatarDe, nomeDe } from '../5050/tv';
import { VALOR_NOTA, type LinhaRanking, type VistaIdeias } from './regras';
import './ideias.css';

/** Visual "Pedido de Patente" (info/jogos/invencoes-inuteis.md → Design novo) */
export const ETAPAS_TXT = ['imEtapa0', 'imEtapa1', 'imEtapa2'] as const;
const ROT = [-2, 1.5, -1, 2, -1.5, 1];
export const rot = (i: number) => ({ '--rot': `${ROT[i % ROT.length]}deg` });

export interface PropsIdeias {
  sala: VistaSala;
  v: VistaIdeias;
  agora: () => number;
}

/** folha de papel (ficha de patente) */
export function Ficha({ class: c = '', estilo, children }: { class?: string; estilo?: Record<string, string>; children: ComponentChildren }) {
  return (
    <div class={'im-ficha ' + c} style={estilo}>
      {children}
    </div>
  );
}

export function Carimbo({ txt, cor = 'verde' }: { txt: string; cor?: 'verde' | 'verm' }) {
  return <span class={'im-carimbo ' + cor}>{txt}</span>;
}

/** ficha-título + relógio de papel (TV) */
export function Titulo({ v, agora, rotulo, titulo }: { v: VistaIdeias; agora: () => number; rotulo: string; titulo: string }) {
  return (
    <div class="im-cabeca">
      <Ficha class="im-titulo">
        <small>{rotulo}</small>
        <h1>{titulo}</h1>
      </Ficha>
      {v.fase !== 'fim' && (
        <div class="im-relogio">
          <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />
        </div>
      )}
    </div>
  );
}

/** o desenho em papel azul quadriculado, preso com fita-cola */
export function Planta({ tracos, animar = false, legenda, presa = false }: { tracos: Traco[]; animar?: boolean; legenda?: string; presa?: boolean }) {
  return (
    <div class={'planta' + (presa ? ' presa' : '')}>
      <Quadro tracos={tracos} animar={animar} planta />
      {legenda && <span class="planta-legenda">{legenda}</span>}
    </div>
  );
}

/** ecrãs vazios do telemóvel: planta enrolada + lápis */
export function PlantaEnrolada() {
  return (
    <svg class="im-enrolada" viewBox="0 0 300 240" aria-hidden="true">
      <g transform="rotate(-8 150 120)">
        <rect x="70" y="40" width="200" height="150" fill="#1f4e8c" stroke="#e8eef7" stroke-width="5" />
        <path d="M80 70h180M80 100h180M80 130h180M80 160h180M110 45v140M150 45v140M190 45v140M230 45v140" stroke="#fff" stroke-opacity=".18" stroke-width="2" />
        <g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round">
          <rect x="120" y="90" width="100" height="50" />
          <circle cx="140" cy="152" r="11" />
          <circle cx="200" cy="152" r="11" />
          <path d="M170 90v-30l20-10" />
        </g>
        <circle cx="170" cy="115" r="15" fill="none" stroke="#ffd23a" stroke-width="7" />
        <rect x="50" y="30" width="34" height="172" rx="17" fill="#2a5e9c" stroke="#000" stroke-width="4" />
      </g>
      <g transform="rotate(-35 170 200)">
        <rect x="80" y="192" width="170" height="18" fill="#f3c64a" stroke="#000" stroke-width="3" />
        <path d="M250 192l20 9-20 9z" fill="#f4dcb0" stroke="#000" stroke-width="3" />
      </g>
    </svg>
  );
}

function Inventor({ sala, id, tam }: { sala: VistaSala; id: string; tam: number }) {
  return (
    <span class="im-inventor">
      <Avatar n={avatarDe(sala, id)} tam={tam} /> {nomeDe(sala, id)}
    </span>
  );
}

/** pilha de moedas (1 moeda = 100 €) */
export function Moedas({ n }: { n: number }) {
  return (
    <div class="im-moedas" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} class="im-moeda" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  );
}

/** revelar: uma ficha por invenção com a pilha de moedas por cima */
export function Fichas({ sala, linhas, compacto = false }: { sala: VistaSala; linhas: LinhaRanking[]; compacto?: boolean }) {
  return (
    <div class={'im-fichas' + (compacto ? ' compacto' : '')}>
      {linhas.map((l, i) => (
        <div key={l.inventor} class="im-col">
          <Moedas n={Math.round(l.euros / VALOR_NOTA)} />
          <Ficha class="im-mini" estilo={rot(i)}>
            {!compacto && <Planta tracos={l.tracos} />}
            <b class="im-mini-nome">{l.nome}</b>
            <Inventor sala={sala} id={l.inventor} tam={compacto ? 22 : 36} />
            <b class="im-euros">{l.euros} €</b>
            {l.vencedora && <Carimbo txt={t('imPatenteado')} cor="verm" />}
          </Ficha>
        </div>
      ))}
    </div>
  );
}

/** a ficha do pitch: problema, invenção, slogan, inventor e as 3 caixas das etapas */
function FichaPatente({ sala, v, compacto }: { sala: VistaSala; v: VistaIdeias; compacto: boolean }) {
  const p = v.pitch!;
  return (
    <Ficha class="im-patente">
      <small class="im-num">{t('imPatenteN', { n: String(v.atual + 1).padStart(3, '0') })}</small>
      <label>{t('imCampoProblema')}</label>
      <div class="im-campo">{p.problema}</div>
      <label>{t('imCampoInvencao')}</label>
      <div class="im-campo im-nome">{p.nome ?? '…'}</div>
      {!compacto && (
        <>
          <label>{t('imCampoSlogan')}</label>
          <div class="im-campo im-slogan">{p.slogan ? `“${p.slogan}”` : '…'}</div>
        </>
      )}
      <label>{t('imCampoInventor')}</label>
      <Inventor sala={sala} id={p.inventor} tam={compacto ? 28 : 64} />
      <div class="im-caixas">
        {ETAPAS_TXT.map((k, i) => (
          <span key={k} class={i <= v.etapa ? 'on' : ''}>
            {t(k)}
          </span>
        ))}
      </div>
    </Ficha>
  );
}

/** o que a TV mostra (também o Painel sem TV) */
export function Palco({ sala, v, compacto = false }: Omit<PropsIdeias, 'agora'> & { compacto?: boolean }) {
  if (v.fase === 'problema' || v.fase === 'inventar') {
    return (
      <div class={'im-jogadores' + (compacto ? ' compacto' : '')}>
        {v.espera.map((id, i) => (
          <Ficha key={id} class="im-jog" estilo={rot(i)}>
            <Avatar n={avatarDe(sala, id)} tam={compacto ? 32 : 88} />
            <b>{nomeDe(sala, id)}</b>
            {v.enviaram.includes(id) ? <Carimbo txt={t('imEntregue')} /> : <span class="im-lapis" aria-hidden="true" />}
          </Ficha>
        ))}
      </div>
    );
  }
  if (v.fase === 'investir') {
    return (
      <>
        <div class={'im-jogadores im-invs' + (compacto ? ' compacto' : '')}>
          {v.cartoes.map((c, i) => (
            <Ficha key={c.inventor} class="im-inv" estilo={rot(i)}>
              <b class="im-mini-nome">{c.nome}</b>
              {c.slogan && !compacto && <i>“{c.slogan}”</i>}
              <Inventor sala={sala} id={c.inventor} tam={compacto ? 22 : 40} />
            </Ficha>
          ))}
        </div>
        <div class="im-quem">
          {v.espera.map((id) => (
            <span key={id} class={'im-quem-1' + (v.enviaram.includes(id) ? ' ok' : '')}>
              <Avatar n={avatarDe(sala, id)} tam={compacto ? 28 : 64} />
              <small>{nomeDe(sala, id)}</small>
            </span>
          ))}
        </div>
      </>
    );
  }
  if (v.fase === 'pitch' && v.pitch) {
    const p = v.pitch;
    return (
      <div class={'im-pitch' + (compacto ? ' compacto' : '')}>
        {p.tracos ? <Planta tracos={p.tracos} animar legenda="fig. 1" presa /> : <div class="planta vazia presa" />}
        <FichaPatente sala={sala} v={v} compacto={compacto} />
      </div>
    );
  }
  if (v.fase === 'revelar') {
    if (!v.ranking.length) return <Ficha class="im-titulo">{t('imNinguem')}</Ficha>;
    return (
      <div class={'im-revelar' + (compacto ? ' compacto' : '')}>
        {compacto && <h2 class="centro">{t('imRanking')}</h2>}
        <Fichas sala={sala} linhas={v.ranking} compacto={compacto} />
      </div>
    );
  }
  return null;
}

/** fim: vencedora carimbada, problema (autor +500) e a ficha do investimento */
export function Vencedora({ sala, v }: { sala: VistaSala; v: VistaIdeias }) {
  const l = v.ranking.find((x) => x.vencedora);
  if (!l) return null;
  return (
    <div class="im-venc">
      <div class="im-venc-planta">
        <Planta tracos={l.tracos} presa />
        <Carimbo txt={t('imPatenteado')} cor="verm" />
      </div>
      <Ficha class="im-venc-prob">
        <label>{t('imAutorProblema', { nome: nomeDe(sala, l.autor) })} · +500</label>
        <div>{l.problema}</div>
      </Ficha>
    </div>
  );
}

export function Investimento({ sala, v }: { sala: VistaSala; v: VistaIdeias }) {
  if (!v.ranking.length) return null;
  return (
    <Ficha class="im-invest">
      <small class="im-num">{t('imInvestimento')}</small>
      {v.ranking.map((l) => (
        <div key={l.inventor} class="im-invest-l">
          <Avatar n={avatarDe(sala, l.inventor)} tam={36} />
          <span class="cresce">{l.nome}</span>
          <b>{l.euros} €</b>
        </div>
      ))}
    </Ficha>
  );
}
