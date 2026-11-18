import type { VistaSala } from '../../core/sala';
import { t, type Chave } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import type { CartaR, Cor, PapelR, VistaRei } from './regras';
import './rei.css';

export { Segurar } from '../revolucao-maquinas/comuns';

export interface PropsRei {
  sala: VistaSala;
  v: VistaRei;
  agora: () => number;
}

export const BOLA: Record<Cor, string> = { azul: '🔵', vermelho: '🔴', cinza: '⚪' };
export const ICONE: Record<PapelR, string> = {
  rei: '👑', dragao: '🐉', corte: '🏰', rebelde: '🗡️', escudeiro: '🛡️', domador: '🔥', traidor: '🎭', gemeo: '👯', rival: '⚔️',
  medroso: '🏃', curioso: '🤩', pajem: '🙇', duque: '😤', apostador: '🔮', arqueiro: '🏹', alvo: '🦊', isco: '🎭', batata: '🐸',
};
export const nomePapel = (p: PapelR) => t(('rdPapel_' + p) as Chave);
export const nomeEquipa = (c: Cor) => t(('rdEquipa_' + c) as Chave);
export const nomeSala = (v: Pick<VistaRei, 'def'>, k: 0 | 1) => v.def.salas[k]?.trim() || t(k ? 'rdSala2' : 'rdSala1');
export const textoCarta = (c: CartaR) => `${ICONE[c.papel]} ${nomePapel(c.papel)}`;

/** torre rabiscada (SVG decorativo) */
function Torre({ cor }: { cor: string }) {
  return (
    <svg class="rd-torre-svg" viewBox="0 0 200 320" preserveAspectRatio="none" aria-hidden="true">
      <path d="M20 316 V70 h24 v-34 h28 v34 h28 v-34 h28 v34 h28 v-34 h24 V316 Z" fill={cor} stroke="#000" stroke-width="6" stroke-linejoin="round" />
      <path d="M78 316 v-48 a22 22 0 0 1 44 0 v48" fill="#26215c" stroke="#000" stroke-width="5" />
      <path d="M100 36 V4 l26 9 -26 9" fill="#f1efe8" stroke="#000" stroke-width="4" />
    </svg>
  );
}

/** a ponte entre as torres, com quem está a atravessar */
function Ponte({ sala, v, agora }: PropsRei) {
  const fim = v.fase === 'fim';
  return (
    <div class="rd-ponte">
      <div class="rd-relogio">{fim ? '🕛' : <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}</div>
      <svg viewBox="0 0 300 80" class="rd-ponte-svg" aria-hidden="true">
        <path d="M0 30 Q150 0 300 30" fill="none" stroke="#000" stroke-width="8" />
        <path d="M0 60 Q150 30 300 60" fill="none" stroke="#000" stroke-width="5" />
        {[40, 90, 150, 210, 260].map((x) => (
          <line key={x} x1={x} y1={x === 150 ? 15 : 22} x2={x} y2={x === 150 ? 45 : 52} stroke="#000" stroke-width="4" />
        ))}
      </svg>
      {v.fase === 'troca' && (
        <div class="rd-atravessa">
          {v.mudando.map((id) => (
            <span key={id} class={'rd-viajante' + (v.chegaram.includes(id) ? ' chegou' : '')}>
              <Avatar n={avatarDe(sala, id)} tam={40} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** quem está numa torre (líder primeiro) */
function Gente({ sala, v, k, compacto }: { sala: VistaSala; v: VistaRei; k: 0 | 1; compacto: boolean }) {
  const lider = v.lideres[k];
  const lista = [...v.salas[k]].sort((a, b) => (a === lider ? -1 : b === lider ? 1 : 0));
  const fim = v.fase === 'fim';
  return (
    <div class="rd-gente">
      {lista.map((id) => {
        const c = v.cartas[id];
        return (
          <div key={id} class={'rd-pessoa' + (fim && c?.papel === 'dragao' ? ' dragao' : '') + (v.mudando.includes(id) ? ' novo' : '')}>
            <span class="rd-av">
              <Avatar n={avatarDe(sala, id)} tam={compacto ? 30 : 64} />
              {id === lider && !fim && <span class="rd-coroa">👑</span>}
            </span>
            <span class="rd-nome">{nomeDe(sala, id)}</span>
            {fim && c && (
              <b class="rd-carta-fim">
                {BOLA[c.cor]} {textoCarta(c)}
                {v.batata === id ? ' 🐸' : ''}
              </b>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** as duas torres e a ponte (TV, ou o "Painel" sem TV) */
export function Castelos({ sala, v, agora, compacto = false }: PropsRei & { compacto?: boolean }) {
  const fim = v.fase === 'fim';
  const dragao = Object.keys(v.cartas).find((id) => v.cartas[id].papel === 'dragao');
  const salaFogo = fim && dragao ? (v.salas[0].includes(dragao) ? 0 : 1) : null;
  return (
    <div class={'rd-castelos' + (compacto ? ' compacto' : '')}>
      {([0, 1] as const).map((k) => (
        <div key={k} class={'rd-torre' + (salaFogo === k ? ' fogo' : '')} style={{ order: k === 0 ? 0 : 2 }}>
          <Torre cor={k === 0 ? '#3E63DD' : '#E5484D'} />
          <div class="rd-dentro">
            <h2 class="rd-titulo">{nomeSala(v, k)}</h2>
            {!fim && v.lideres[k] && <p class="rd-lider">{t('rdLider', { nome: nomeDe(sala, v.lideres[k]) })}</p>}
            <Gente sala={sala} v={v} k={k} compacto={compacto} />
          </div>
          {salaFogo === k && (
            <div class="rd-fogo" aria-hidden="true">
              🐉<span>🔥🔥🔥</span>
            </div>
          )}
        </div>
      ))}
      <div style={{ order: 1 }}>
        <Ponte sala={sala} v={v} agora={agora} />
      </div>
    </div>
  );
}

/** o texto grande da fase (igual para todos) */
export function narracao(sala: VistaSala, v: VistaRei): string {
  switch (v.fase) {
    case 'ir':
      return t('rdEsperam', { n: v.prontos.length, t: v.participantes.length });
    case 'carta':
      return t('rdSuaCarta') + ' · ' + t('rdEsperam', { n: v.prontos.length, t: v.participantes.length });
    case 'lider':
      return '👑 ' + t('rdLideres');
    case 'ronda':
      return v.novoLider ? t('rdNovoLider', { sala: nomeSala(v, v.novoLider.sala), nome: nomeDe(sala, v.novoLider.id) }) : t('rdRonda', { r: v.ronda, t: v.rondas });
    case 'troca':
      return '🌉 ' + t('rdMudando') + ': ' + v.mudando.map((id) => nomeDe(sala, id)).join(', ');
    case 'aposta':
      return '🌙 ' + t('rdAntesMeiaNoite');
    case 'fim':
      return v.vencedor ? '🕛 ' + t(('rdVence_' + v.vencedor) as Chave) : '';
  }
}

export function PlacarRei({ sala, v, tam = 48 }: { sala: VistaSala; v: VistaRei; tam?: number }) {
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
