import { t, type Chave } from '../../core/i18n';
import type { VistaSala } from '../../core/sala';
import { nomeDe } from '../5050/tv';
import { CORES, ICONE_MODULO, NOME_CABECA, type Cabeca, type Corpo, type Evento, type Loco, type Modulo, type Perigo, type Robo } from './pecas';
import type { VistaRagerob } from './regras';

const en = () => t('rrLang') === 'en';

/** nome com cor (ex.: "Galo Pimenta"); no modo Pilotos junta o piloto */
export function nomeRobo(r: Robo | undefined, sala?: VistaSala): string {
  if (!r) return '?';
  const base = `${NOME_CABECA[r.cabeca][en() ? 'en' : 'pt']} ${CORES[r.cor % CORES.length][en() ? 'en' : 'pt']}`;
  return r.dono && sala ? `${base} (${nomeDe(sala, r.dono)})` : base;
}

export const roboPorId = (v: Pick<VistaRagerob, 'robos'>, id: string | null | undefined) => v.robos.find((r) => r.id === id);

export const nomeModulo = (m: Modulo) => t(('rrM' + m) as Chave);
export const infoModulo = (m: Modulo) => t(('rrI' + m) as Chave);
export const nomeCabeca = (c: Cabeca) => t(('rrC' + c) as Chave);
export const nomeLoco = (l: Loco) => t(('rrL' + l) as Chave);
export const nomeCorpo = (c: Corpo) => t(('rrB' + c) as Chave);
export const nomePerigo = (p: Perigo) => t(('rrP' + p) as Chave);
export const nomeEvento = (e: Evento) => t(('rrE' + e) as Chave);
export const etiquetaModulo = (m: Modulo) => `${ICONE_MODULO[m]} ${nomeModulo(m)}`;

export function nomeFase(v: VistaRagerob): string {
  if (v.fase === 'combate' || v.fase === 'resultado') {
    const final = v.def.modo === 'normal' && v.grupos[v.combateIdx]?.length === 2;
    return final ? t('rrFinal') : t('rrCombate', { n: v.combateIdx + 1, t: v.grupos.length });
  }
  return t(('rrFase' + v.fase) as Chave);
}

export const moeda = (n: number) => `🪙 ${n}`;

/** ✅/❌ de quem já enviou */
export function QuemEnviou({ sala, ids, feitos }: { sala: VistaSala; ids: string[]; feitos: string[] }) {
  return (
    <div class="rr-quem">
      {ids.map((id) => (
        <span key={id} class={'rr-chip' + (feitos.includes(id) ? ' ok' : '')}>
          {feitos.includes(id) ? '✅' : '❌'} {nomeDe(sala, id)}
        </span>
      ))}
    </div>
  );
}
