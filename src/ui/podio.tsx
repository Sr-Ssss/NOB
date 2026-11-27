import type { VistaSala } from '../core/sala';
import type { Podio } from '../core/jogo';
import { Avatar } from './comuns';

/** Placar padrão de todos os jogos: escadinha para os 3 primeiros (2º · 1º · 3º) e o resto numa lista por baixo. */
export function PodioEscada({ sala, podio, tv = false }: { sala: VistaSala; podio: Podio[]; tv?: boolean }) {
  const jog = (id: string) => sala.jogadores.find((j) => j.id === id);
  const topo = podio.slice(0, 3);
  const resto = podio.slice(3);
  const ordem = [topo[1], topo[0], topo[2]].filter(Boolean) as Podio[];
  const tam = tv ? 120 : 52;
  return (
    <div class={'podio' + (tv ? ' tv' : '')}>
      <div class="podio-escada">
        {ordem.map((p) => (
          <div key={p.id} class={'degrau d' + Math.min(3, p.lugar)}>
            <Avatar n={jog(p.id)?.avatar ?? 0} tam={tam} />
            <span class="podio-nome">{jog(p.id)?.nome ?? '?'}</span>
            <div class="podio-bloco">
              <b>{p.lugar}º</b>
              <span>{p.pontos} pts</span>
            </div>
          </div>
        ))}
      </div>
      {resto.length > 0 && (
        <ol class="podio-resto">
          {resto.map((p) => (
            <li key={p.id}>
              <span class="lugar">{p.lugar}º</span>
              <Avatar n={jog(p.id)?.avatar ?? 0} tam={tv ? 56 : 28} />
              <span class="cresce">{jog(p.id)?.nome ?? '?'}</span>
              <b>{p.pontos}</b>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
