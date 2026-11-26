import { t, type Chave } from '../../core/i18n';
import type { VistaSala } from '../../core/sala';
import { nomeDe } from '../5050/tv';
import { Avatar, Feito } from '../../ui/comuns';
import { ModuloMini, RoboCartao } from './desenho';
import { CORES, ICONE_MODULO, NOME_CABECA, PRECO, type Cabeca, type Corpo, type Evento, type Loco, type Modulo, type Perigo, type Robo } from './pecas';
import { premiosDe, type VistaRagerob } from './regras';

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

/** ✅ / balão de pensamento de quem já enviou */
export function QuemEnviou({ sala, ids, feitos }: { sala: VistaSala; ids: string[]; feitos: string[] }) {
  return (
    <div class="rr-quem">
      {ids.map((id) => (
        <span key={id} class={'rr-chip' + (feitos.includes(id) ? ' ok' : '')}>
          <Feito ok={feitos.includes(id)} /> {nomeDe(sala, id)}
        </span>
      ))}
    </div>
  );
}

/** o rosto de quem licita/aposta: o boneco do jogador ou, nos Pilotos, o robô da IA */
export function Rosto({ v, sala, id, tam = 48 }: { v: Pick<VistaRagerob, 'robos'>; sala: VistaSala; id: string; tam?: number }) {
  const j = sala.jogadores.find((x) => x.id === id);
  const robo = j ? undefined : roboPorId(v, id);
  return (
    <span class="rr-rosto" role="img" aria-label={robo ? nomeRobo(robo, sala) : nomeDe(sala, id)}>
      {j ? <Avatar n={j.avatar} tam={tam} /> : robo ? <RoboCartao robo={robo} tam={tam} /> : '🙂'}
    </span>
  );
}

/** ao vivo: o rosto de quem apostou neste robô */
export function Apostadores({ v, sala, robo, tam = 40 }: { v: VistaRagerob; sala: VistaSala; robo: string; tam?: number }) {
  return (
    <span class="rr-apostadores" style={{ minHeight: tam + 'px' }}>
      {Object.entries(v.apostas)
        .filter(([, r]) => r === robo)
        .map(([j]) => (
          <Rosto key={j} v={v} sala={sala} id={j} tam={tam} />
        ))}
    </span>
  );
}

/** quanto paga cada lugar neste combate */
export function Premios({ v }: { v: VistaRagerob }) {
  return (
    <div class="rr-premios">
      {premiosDe(v.grupos[v.combateIdx]?.length ?? 4).map((n, i) => (
        <span key={i}>
          {['🥇', '🥈', '🥉', '4️⃣'][i]} <b>{n}</b>
        </span>
      ))}
    </div>
  );
}

/** leilão ao vivo (TV e telemóvel): o módulo em palco, quem lidera e por quanto, e a fila dos cinco */
export function Palco({ v, sala, tv = false }: { v: VistaRagerob; sala: VistaSala; tv?: boolean }) {
  const l = v.leilao;
  if (!l) return null;
  const m = v.loja[l.item];
  return (
    <div class={'rr-palco' + (tv ? ' grande' : '') + (l.martelo ? ' martelo' : '')}>
      <div class="rr-palco-mod">
        <ModuloMini m={m} tam={tv ? 260 : 130} />
        <b>{etiquetaModulo(m)}</b>
      </div>
      <div class="rr-lance" role="status" aria-live="polite" aria-label={l.lance ? t('rrLidera', { nome: roboPorId(v, l.lance.id) ? nomeRobo(roboPorId(v, l.lance.id)) : nomeDe(sala, l.lance.id), n: l.lance.valor }) : undefined}>
        {l.lance ? (
          <div key={l.item + ':' + l.lance.valor} class="rr-lance-novo">
            <Rosto v={v} sala={sala} id={l.lance.id} tam={tv ? 170 : 84} />
            <b>{moeda(l.lance.valor)}</b>
          </div>
        ) : (
          <b class="rr-preco-base">{l.martelo ? '💨' : moeda(PRECO[m])}</b>
        )}
        {l.martelo && <span class="rr-martelo">🔨 {t(l.lance ? 'rrVendido' : 'rrNinguemQuis')}</span>}
      </div>
      <div class="rr-fila-mods" aria-hidden="true">
        {v.loja.map((x, k) => {
          const dono = v.vendidos[k];
          return (
            <span key={k} class={'rr-fila-mod' + (k === l.item ? ' on' : k < l.item ? ' passou' : '')}>
              <ModuloMini m={x} tam={tv ? 76 : 40} />
              {dono && <Rosto v={v} sala={sala} id={dono.id} tam={tv ? 42 : 24} />}
            </span>
          );
        })}
      </div>
    </div>
  );
}
