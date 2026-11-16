import type { VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import { MAX_RONDAS, type Entrada, type Lado, type VistaWifi } from './regras';
import './wifi.css';

export const SIMBOLO: Record<Lado, string> = { b: '○', p: '●' };

export function nomeEquipa(l: Lado): string {
  return `${SIMBOLO[l]} ${l === 'b' ? t('swBrancos') : t('swPretos')}`;
}

/** inclinação fixa por post-it (só decoração, nada mexe) */
const inclina = (k: number) => `rotate(${[-3, 2, -1.5, 3, -2.5, 1][k % 6]}deg)`;

export function textoPista(p: string): string {
  return p || t('swSemPista');
}

/** 2 lugares 🎯 + 2 lugares "sem sinal"; vazio tracejado, ganho coral */
export function Fichas({ f }: { f: { alvo: number; erro: number } }) {
  return (
    <div class="fichas">
      {[0, 1].map((i) => (
        <span key={'a' + i} class={'ficha' + (f.alvo > i ? ' ganha' : '')} aria-label={t('swIntercecao')}>
          🎯
        </span>
      ))}
      {[0, 1].map((i) => (
        <span key={'e' + i} class={'ficha sinal' + (f.erro > i ? ' ganha' : '')} aria-label={t('swErro')}>
          📶
        </span>
      ))}
    </div>
  );
}

/** router com 4 luzes = 4 colunas do histórico; por baixo, os post-its das pistas */
export function Router({ lado, historico, acesas, novo }: { lado: Lado; historico: Entrada[]; acesas?: number[]; novo?: number }) {
  return (
    <div class={'router ' + lado}>
      <div class="luzes">
        {[1, 2, 3, 4].map((n) => {
          const o = acesas?.indexOf(n) ?? -1;
          return (
            <div key={n} class={'luz' + (o >= 0 ? ' acesa o' + o : '')}>
              <i />
              <span>{n}</span>
            </div>
          );
        })}
      </div>
      <div class="colunas">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} class="coluna">
            {historico.flatMap((h, hi) =>
              h.codigo.map((c, k) =>
                c === n ? (
                  <div key={hi + ':' + k} class={'postit' + (h.pistas[k] ? '' : ' vazio') + (novo === h.ronda ? ' novo' : '')} style={{ transform: inclina(hi + n + k) }}>
                    {textoPista(h.pistas[k])}
                    <small>{h.ronda}</small>
                  </div>
                ) : null,
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Cripto({ sala, v, l, tam = 56 }: { sala: VistaSala; v: VistaWifi; l: Lado; tam?: number }) {
  const id = v.criptografos[l];
  if (!id) return null;
  return (
    <div class="wifi-cripto">
      <Avatar n={avatarDe(sala, id)} tam={tam} />
      <span>
        {nomeDe(sala, id)} <span class="wifi-simbolo">{SIMBOLO[l]}</span>
        {v.fase === 'pistas' && <span> {v.enviaram.includes(l) ? '✅' : '✍️'}</span>}
      </span>
    </div>
  );
}

export function rondaTexto(v: VistaWifi): string {
  return v.ronda > MAX_RONDAS ? t('swRondaExtra') : `${v.ronda}/${MAX_RONDAS}`;
}

export function faseTexto(v: VistaWifi): string {
  if (v.fase === 'pistas') return t('swFasePistas');
  if (v.fase === 'responder') return v.passo === 'intercetar' ? t('swFaseIntercetar', { eq: nomeEquipa(v.turno === 'b' ? 'p' : 'b') }) : t('swFaseResponder', { eq: nomeEquipa(v.turno) });
  if (v.fase === 'revelar') return t('swFaseRevelar');
  return '';
}

export function Tempo({ v, agora }: { v: VistaWifi; agora: () => number }) {
  if (!v.terminaEm && v.restante === null) return null;
  return <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />;
}

/** o que aconteceu na revelação */
export function Resultado({ v }: { v: VistaWifi }) {
  const r = v.revelacao;
  if (!r) return null;
  const o: Lado = r.lado === 'b' ? 'p' : 'b';
  return (
    <>
      <div class="wifi-codigo">{r.codigo.join(' · ')}</div>
      {r.intercecao && <div class="wifi-res">{r.intercetou ? t('swIntercetou', { eq: nomeEquipa(o) }) : t('swNaoIntercetou', { eq: nomeEquipa(o) })}</div>}
      <div class="wifi-res">{r.errou ? t('swErrou', { eq: nomeEquipa(r.lado) }) : t('swAcertou', { eq: nomeEquipa(r.lado) })}</div>
    </>
  );
}

export function PlacarWifi({ sala, v, tam = 48 }: { sala: VistaSala; v: VistaWifi; tam?: number }) {
  return (
    <div class="placar">
      <ol>
        {v.podio.map((p) => (
          <li key={p.id}>
            <span class="lugar">{p.lugar}º</span>
            <Avatar n={avatarDe(sala, p.id)} tam={tam} />
            <span class="cresce">
              {nomeDe(sala, p.id)} <span class="wifi-simbolo">{SIMBOLO[v.equipas.b.includes(p.id) ? 'b' : 'p']}</span>
            </span>
            <span>{p.pontos}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
