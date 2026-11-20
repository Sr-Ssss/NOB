import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { VistaSala } from '../../core/sala';
import { t, type Chave } from '../../core/i18n';
import { Avatar, BarraSegurar } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import { REP_VENCE, SAB_VENCE, poderDe, type PapelM, type Poder, type VistaMaquinas } from './regras';
import './maquinas.css';
import { eventosSegurar } from '../../ui/acessibilidade';

export interface PropsMaquinas {
  sala: VistaSala;
  v: VistaMaquinas;
  agora: () => number;
}

export const COR: Record<PapelM, string> = { tripulacao: '🔵', amotinado: '🔴', ia: '🤖' };
export const ICONE: Record<Poder, string> = { investigar: '🔍', espiar: '👀', eleger: '📢', ejetar: '🚀' };
export const nomePapel = (p: PapelM) => t(('rmPapel_' + p) as Chave);
export const T_SEGURAR = 3000;

/** botão que só mostra o conteúdo enquanto se segura 3 s (Identidade e resultados de poderes) */
export function Segurar({ rotulo, children, aberta = false, aoMostrar }: { rotulo: string; children: ComponentChildren; aberta?: boolean; aoMostrar?: () => void }) {
  const [estado, setEstado] = useState<'nada' | 'segura' | 'mostra'>(aberta ? 'mostra' : 'nada');
  const mostrar = () => {
    setEstado('mostra');
    aoMostrar?.();
  };
  const tempo = useRef<number | undefined>(undefined);
  const largar = () => {
    clearTimeout(tempo.current);
    setEstado('nada');
  };
  useEffect(() => () => clearTimeout(tempo.current), []);
  return (
    <>
      {estado === 'mostra' && (
        <div class="rm-segredo" role="dialog" aria-live="assertive">
          {children}
        </div>
      )}
      <button
        class={'rm-botao-id' + (estado === 'mostra' ? ' on' : '')}
        {...eventosSegurar({
          segurar: (e) => {
            e.preventDefault();
            setEstado('segura');
            tempo.current = window.setTimeout(mostrar, T_SEGURAR);
          },
          largar,
          mostrar,
          aberto: estado === 'mostra',
        })}
      >
        {estado === 'segura' && <BarraSegurar ms={T_SEGURAR} />}
        <span class="rotulo-segurar">{estado === 'segura' ? t('rmSegurando') : rotulo}</span>
      </button>
    </>
  );
}

/** manómetro rabiscado: `max` marcas, ponteiro em `n`; `icones` junto a cada marca */
function Manometro({ n, max, cor, rotulo, icones = [] }: { n: number; max: number; cor: string; rotulo: string; icones?: (string | null)[] }) {
  const ang = (k: number) => Math.PI * (1 - k / max); // 180° → 0°
  const p = (k: number, r: number) => [100 + r * Math.cos(ang(k)), 110 - r * Math.sin(ang(k))];
  const [px, py] = p(n, 70);
  return (
    <div class="rm-manometro">
      <svg viewBox="0 0 200 130" aria-hidden="true">
        <path d="M14 110 A86 86 0 0 1 186 110" fill="#F1EFE8" stroke="#000" stroke-width="5" />
        {Array.from({ length: max + 1 }, (_, k) => {
          const [x1, y1] = p(k, 78);
          const [x2, y2] = p(k, 66);
          const [ix, iy] = p(k, 52);
          return (
            <g key={k}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" stroke-width={k <= n && k > 0 ? 6 : 3} />
              {icones[k] && (
                <text x={ix} y={iy + 5} text-anchor="middle" font-size="14">
                  {icones[k]}
                </text>
              )}
            </g>
          );
        })}
        <line x1="100" y1="110" x2={px} y2={py} stroke={cor} stroke-width="7" stroke-linecap="round" class="rm-ponteiro" />
        <circle cx="100" cy="110" r="9" fill="#000" />
      </svg>
      <b>
        {rotulo} {n}/{max}
      </b>
    </div>
  );
}

/** bateria de pé com 3 células = contador de falhas */
function Bateria({ falhas }: { falhas: number }) {
  return (
    <div class="rm-bateria" aria-label={`${t('rmFalhas')} ${falhas}/3`}>
      <div class="rm-polo" />
      <div class="rm-corpo">
        {[2, 1, 0].map((k) => (
          <div key={k} class={'rm-celula' + (k < falhas ? ' on' : '')} />
        ))}
      </div>
      <b>
        {t('rmFalhas')} {falhas}/3
      </b>
    </div>
  );
}

/** fila de postos com os robôs por ordem */
export function Postos({ sala, v, compacto = false }: { sala: VistaSala; v: VistaMaquinas; compacto?: boolean }) {
  const votos = v.ultimaVotacao?.votos ?? {};
  return (
    <div class={'rm-postos' + (compacto ? ' compacto' : '')}>
      {v.participantes.map((id) => {
        const fora = !v.vivos.includes(id);
        const bloq = v.bloqueados.includes(id);
        return (
          <div key={id} class={'rm-posto' + (fora ? ' fora' : '') + (bloq ? ' bloq' : '')}>
            {id === v.comandante && <span class="rm-cargo cmd">{t('rmComandante')}</span>}
            {id === v.piloto && <span class="rm-cargo pil">{t('rmPiloto')}</span>}
            {((v.fase === 'votar' && v.votaram.includes(id)) || (v.fase === 'carta' && v.viram.includes(id))) && <span class="rm-voto">✅</span>}
            {v.fase !== 'votar' && id in votos && <span class={'rm-voto ' + (votos[id] ? 'sim' : 'nao')}>{votos[id] ? t('rmSim') : t('rmNao')}</span>}
            <Avatar n={avatarDe(sala, id)} tam={compacto ? 36 : 96} />
            <span>
              {fora ? '🚀 ' : ''}
              {nomeDe(sala, id)}
            </span>
            {v.fase === 'fim' && v.papeis[id] && <b>{COR[v.papeis[id]] + ' ' + nomePapel(v.papeis[id])}</b>}
          </div>
        );
      })}
    </div>
  );
}

/** o texto grande da fase (igual para todos) */
export function narracao(sala: VistaSala, v: VistaMaquinas): string {
  const nome = (id: string | null) => (id ? nomeDe(sala, id) : '');
  switch (v.fase) {
    case 'carta':
      return t('rmCartaTv');
    case 'nomear':
      return t('rmNomear', { nome: nome(v.comandante) });
    case 'votar':
      return t('rmGoverno', { c: nome(v.comandante), p: nome(v.piloto) });
    case 'votos':
      return v.ultimaVotacao?.aprovado ? t('rmAprovado') : t('rmRejeitado');
    case 'comandante':
    case 'piloto':
      return '🤫 ' + t('rmEspera');
    case 'veto':
      return t('rmVetoPedido');
    case 'entrou':
      return v.entrou ? (v.entrou.caos ? t('rmCaos') + ' · ' : '') + t(('rmEntrou_' + v.entrou.carta) as Chave) : '';
    case 'poder':
    case 'ver':
      return (v.poder ? ICONE[v.poder] + ' ' : '') + t('rmPoderTv', { nome: nome(v.comandante) });
    case 'discussao':
      if (v.poder === 'ejetar' && v.alvoPoder) return t('rmEjetadoTv', { nome: nome(v.alvoPoder) });
      if (v.poder === 'eleger' && v.alvoPoder) return t('rmEleitoTv', { nome: nome(v.alvoPoder) });
      return sala.semTv ? t('conversem') : t('rmDiscussao');
    case 'fim':
      return v.vencedor ? t(('rmVence_' + v.vencedor) as Chave) + ' · ' + t(('rmMotivo_' + v.motivo) as Chave) : '';
  }
}

/** fases em que os medidores interessam (conversar/votar/carta a entrar); nas outras ficam numa barra fina */
const MEDIDORES_GRANDES: VistaMaquinas['fase'][] = ['nomear', 'votar', 'votos', 'entrou', 'discussao', 'fim'];

/** medidores em ponto pequeno: 3 barras de lado (🔧 · 🔋 · 💥) */
function PainelFino({ v }: { v: VistaMaquinas }) {
  const barra = (n: number, max: number, cls: string, rotulo: string) => (
    <div class={'rm-fino ' + cls} role="img" aria-label={`${rotulo} ${n}/${max}`}>
      <span>{rotulo}</span>
      <div class="rm-fino-trilho">
        <div style={{ width: (n / max) * 100 + '%' }} />
      </div>
      <b>
        {n}/{max}
      </b>
    </div>
  );
  return (
    <div class="rm-painel fino">
      {barra(v.reparacoes, REP_VENCE, 'rep', '🔧')}
      {barra(v.falhas, 3, 'fal', '🔋')}
      {barra(v.sabotagens, SAB_VENCE, 'sab', '💥')}
    </div>
  );
}

/** a consola da nave (TV, ou o "Painel" sem TV) */
export function Consola({ sala, v, compacto = false, semNarra = false }: { sala: VistaSala; v: VistaMaquinas; compacto?: boolean; semNarra?: boolean }) {
  const n = v.participantes.length;
  const icones = Array.from({ length: SAB_VENCE + 1 }, (_, k) => {
    const p = k > 0 ? poderDe(n, k) : null;
    return p ? ICONE[p] : null;
  });
  return (
    <div class={'rm-consola' + (compacto ? ' compacto' : '')}>
      {!semNarra && <h1 class="rm-narra">{narracao(sala, v)}</h1>}
      {!MEDIDORES_GRANDES.includes(v.fase) ? (
        <PainelFino v={v} />
      ) : (
        <div class="rm-painel">
          <Manometro n={v.reparacoes} max={REP_VENCE} cor="#185FA5" rotulo={'🔧 ' + t('rmReparacao')} />
          <Bateria falhas={v.falhas} />
          <Manometro n={v.sabotagens} max={SAB_VENCE} cor="#C0392B" rotulo={'💥 ' + t('rmSabotagem')} icones={icones} />
        </div>
      )}
      <Postos sala={sala} v={v} compacto={compacto} />
    </div>
  );
}

export function PlacarMaquinas({ sala, v, tam = 48 }: { sala: VistaSala; v: VistaMaquinas; tam?: number }) {
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
