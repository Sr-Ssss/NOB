import { useState } from 'preact/hooks';
import type { VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Avatar } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import { useFoto } from '../se-vira/imagens';
import { Cena, Emperucado, Martelo } from './desenhos';
import type { Caso, Lado, Prova, Txt, VistaSemJuizo } from './regras';
import './semjuizo.css';

export const txt = (x: Txt, sala: Pick<VistaSala, 'idioma'>): string => (sala.idioma === 'en' ? x.en : x.pt);
export const nomeLado = (l: Lado) => t(l === 'reu' ? 'sjReu' : 'sjAcusador');

export interface PropsSemJuizo {
  sala: VistaSala;
  v: VistaSemJuizo;
  agora: () => number;
}

function DaNet({ p }: { p: Prova }) {
  const r = useFoto(p.busca, p.id);
  const [falhou, setFalhou] = useState<string | null>(null);
  if (!r || falhou === r.url) return <span class="sj-emoji">{p.emoji}</span>;
  return (
    <>
      <img src={r.url} alt={p.busca} referrerpolicy="no-referrer" onError={() => setFalhou(r.url)} />
      {r.fonte === 'giphy' && <span class="sj-giphy">{t('svPowered')}</span>}
    </>
  );
}

/** a imagem de uma prova: a da galeria (chega à parte), a da net ou o emoji */
export function FotoProva({ p, fotos }: { p: Prova; fotos: Record<string, string> }) {
  return <span class="sj-foto">{p.foto ? fotos[p.foto] ? <img src={fotos[p.foto]} alt="" /> : <span class="sj-emoji">{p.emoji}</span> : <DaNet key={p.id} p={p} />}</span>;
}

/** a mesa: acusador em cima, réu em baixo; linhas entre as provas ligadas */
export function Mesa({
  v,
  fotos,
  marcadas = [],
  tocar,
  pode = () => true,
  estrelas,
}: {
  v: VistaSemJuizo;
  fotos: Record<string, string>;
  marcadas?: number[];
  tocar?: (i: number) => void;
  pode?: (i: number) => boolean;
  estrelas?: number[];
}) {
  const centro = (i: number) => ({ x: 50 + 100 * Math.floor(i / 2), y: 50 + 100 * (i % 2) });
  return (
    <div class="sj-mesa">
      <svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">
        {v.mesa.map((m, i) => {
          if (m.liga === null) return null;
          const a = centro(m.liga);
          const b = centro(i);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} vector-effect="non-scaling-stroke" />;
        })}
      </svg>
      {v.mesa.map((m, i) => {
        const cls = `sj-prova ${m.lado}` + (marcadas.includes(i) ? ' marcada' : '') + (m.semEstrela ? ' sem-estrela' : '');
        const estilo = { gridColumn: Math.floor(i / 2) + 1, gridRow: (i % 2) + 1 };
        const dentro = (
          <>
            <FotoProva p={m.prova} fotos={fotos} />
            <b class="sj-num">{i + 1}</b>
            {!!estrelas?.[i] && <b class="sj-estrelas">{'⭐'.repeat(estrelas[i])}</b>}
          </>
        );
        return tocar ? (
          <button key={i} class={cls} style={estilo} disabled={!pode(i)} aria-pressed={marcadas.includes(i)} aria-label={`${nomeLado(m.lado)} ${i + 1}`} onClick={() => tocar(i)}>
            {dentro}
          </button>
        ) : (
          <div key={i} class={cls} style={estilo}>
            {dentro}
          </div>
        );
      })}
    </div>
  );
}

export function FolhaCaso({ sala, caso, titulo }: { sala: VistaSala; caso: Caso; titulo: string }) {
  return (
    <div class="sj-folha">
      <b>{titulo}</b>
      <Cena cena={caso.cena} />
      <p>{txt(caso, sala)}</p>
    </div>
  );
}

/** réu, acusador e juiz, com os poderes por gastar */
export function Partes({ sala, v, tam }: { sala: VistaSala; v: VistaSemJuizo; tam: number }) {
  const parte = (id: string, rotulo: string, lado?: Lado) => (
    <div class={'sj-parte ' + (lado ?? 'juiz')}>
      <Emperucado n={avatarDe(sala, id)} tam={tam} />
      <small>{rotulo}</small>
      <b>{nomeDe(sala, id)}</b>
      {lado && (
        <span class="sj-poderes" aria-hidden="true">
          {(['protesto', 'contradicao', 'testemunha'] as const).map((p) => (
            <i key={p} class={v.usados[lado].includes(p) ? 'gasto' : ''}>
              {ICONE[p]}
            </i>
          ))}
        </span>
      )}
    </div>
  );
  return (
    <div class="sj-partes">
      {parte(v.acusador, t('sjAcusador'), 'acusador')}
      {v.juiz && parte(v.juiz, t('sjJuiz'))}
      {parte(v.reu, t('sjReu'), 'reu')}
    </div>
  );
}

export const ICONE = { protesto: '✋', contradicao: '⚡', testemunha: '🐔' } as const;

/** martelos de quem vota: tapados com lacre até à revelação */
export function Martelos({ sala, v, tam }: { sala: VistaSala; v: VistaSemJuizo; tam: number }) {
  const r = v.resultado;
  const ids = [...v.juri, ...(v.juiz ? [v.juiz] : [])];
  const contra = v.fase.startsWith('contra');
  const jaVotou = (id: string) => (v.juri.includes(id) && (v.fase === 'juiz' || v.fase === 'contra_juiz')) || v.feitos.includes(id);
  return (
    <div class="sj-martelos">
      {ids.map((id) => {
        const peso = id === v.juiz && v.pesoJuiz > 1 ? ` ×${v.pesoJuiz}` : '';
        const voto = r && id in r.votos ? r.votos[id] : null;
        return (
          <div key={id} class={jaVotou(id) || r ? '' : 'espera'}>
            <Martelo tam={tam} tapado={!r} cor={voto === null ? undefined : voto ? '#c53b2c' : '#3f8f5a'} />
            <span>
              {nomeDe(sala, id)}
              {peso}
            </span>
            {voto !== null && !contra && <b>{t(voto ? 'sjCulpado' : 'sjInocente')}</b>}
          </div>
        );
      })}
    </div>
  );
}

export function ResultadoSj({ sala, v, fotos }: { sala: VistaSala; v: VistaSemJuizo; fotos: Record<string, string> }) {
  const r = v.resultado;
  if (!r) return null;
  return (
    <div class="sj-resultado">
      <h1 class={'sj-carimbo ' + (r.culpado ? 'culpado' : 'inocente')}>{t(r.culpado ? 'sjCulpado' : 'sjInocente')}</h1>
      <div class="sj-resultado-linha">
        <FolhaCaso sala={sala} caso={r.sentenca} titulo={t('sjSentenca')} />
        <Mesa v={v} fotos={fotos} estrelas={r.estrelas} />
      </div>
      <Martelos sala={sala} v={v} tam={44} />
      <p class="sj-ganhos">
        {nomeDe(sala, v.acusador)} <b>+{r.pontos.acusador}</b> · {nomeDe(sala, v.reu)} <b>+{r.pontos.reu}</b>
      </p>
    </div>
  );
}

export function PlacarSj({ sala, v, tam }: { sala: VistaSala; v: VistaSemJuizo; tam: number }) {
  return (
    <div class="cartao placar">
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

/** a frase do que se está a passar (TV e telemóveis sem TV) */
export function narrar(sala: VistaSala, v: VistaSemJuizo): string {
  const vez = nomeDe(sala, (v.fase === 'escolher' ? v.mesa.length : v.mesa.length - 1) % 2 === 0 ? v.acusador : v.reu);
  switch (v.fase) {
    case 'provas':
      return t('sjJuriDa');
    case 'escolher':
      return t('sjEscolhendo', { nome: vez });
    case 'explicar':
      return t('sjExplica', { nome: vez });
    case 'contra_fala':
      return '⚡ ' + t('sjSafar', { nome: nomeDe(sala, v.contra?.quem === 'reu' ? v.acusador : v.reu) });
    case 'contra_juri':
    case 'contra_juiz':
      return '⚡ ' + t('sjSafouse');
    case 'contra_res':
      return '⚡ ' + t(v.contra?.falhou ? 'sjNaoSafou' : 'sjSafou');
    case 'testemunha':
      return '🐔 ' + t('sjTestemunhaE', { nome: nomeDe(sala, v.testemunha ?? '') });
    case 'juri':
      return t('sjJuriVota');
    case 'juiz':
      return t('sjJuizDecide');
    case 'estrela':
      return t('sjEstrela');
    default:
      return '';
  }
}

export const marcadasDe = (v: VistaSemJuizo) => (v.contra ? [v.contra.a, v.contra.b] : []);
export const aVotarFase = (v: VistaSemJuizo) => ['juri', 'juiz', 'contra_juri', 'contra_juiz'].includes(v.fase);
