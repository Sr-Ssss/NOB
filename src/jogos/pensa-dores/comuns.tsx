import type { VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import { multiplicador, type Pergunta, type ResOpcao, type VistaPensa } from './regras';
import './pensa.css';

export const LETRAS = 'ABCDEFGHIJKLMNOP';

export function textoP(p: Pergunta | undefined, sala: VistaSala): string {
  return p ? (sala.idioma === 'en' ? p.en : p.pt) : '';
}

export function Topo({ v, agora, extra }: { v: VistaPensa; agora: () => number; extra?: preact.ComponentChildren }) {
  const final = v.fase.startsWith('final');
  return (
    <div class="topo">
      <span>
        {final ? t('pdRondaFinal') : t('ronda', { n: v.ronda, t: v.def.rondas })}
        {!final && v.fase === 'escrever' && multiplicador(v) > 1 ? ' · ' + t('pdRondaDupla') : ''}
      </span>
      {extra}
      {v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
    </div>
  );
}

/** avatares que votaram, "desenhados a giz" na caixa */
export function Votos({ sala, o, mostrar, tam = 44 }: { sala: VistaSala; o: ResOpcao; mostrar: boolean; tam?: number }) {
  if (!mostrar) return <div class="giz-conta">{o.votos.length}</div>;
  return (
    <div class="giz-votos">
      {o.votos.map((id, i) => (
        <span key={id + i} class="cair giz-boneco">
          <Avatar n={avatarDe(sala, id)} tam={tam} />
        </span>
      ))}
    </div>
  );
}

export function Autor({ sala, o, tam = 56 }: { sala: VistaSala; o: ResOpcao; tam?: number }) {
  return (
    <div class="giz-autor">
      <Avatar n={avatarDe(sala, o.autor)} tam={tam} />
      <span>{nomeDe(sala, o.autor)}</span>
      <b>+{o.pontos}</b>
      {o.arrasou && <span class="arrasou">{t('pdArrasou')}</span>}
    </div>
  );
}

export function PlacarPensa({ sala, v, tam = 48 }: { sala: VistaSala; v: VistaPensa; tam?: number }) {
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
