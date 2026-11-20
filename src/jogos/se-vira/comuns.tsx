import { useState } from 'preact/hooks';
import type { VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Avatar } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import { useFoto } from './imagens';
import type { Slide, Txt, Visual, VistaSevira } from './regras';
import './sevira.css';

export const txt = (x: Txt | undefined, sala: Pick<VistaSala, 'idioma'>): string => (x ? (sala.idioma === 'en' ? x.en : x.pt) : '');

const CORES = ['#3E63DD', '#E5484D', '#30A46C', '#F0997B'];

function Selo() {
  return <span class="sv-giphy">{t('svPowered')}</span>;
}

function Foto({ url, giphy, aoFalhar }: { url: string; giphy: boolean; aoFalhar?: () => void }) {
  return (
    <div class="sv-foto">
      {url ? <img src={url} alt="" referrerpolicy="no-referrer" onError={aoFalhar} /> : <span class="sv-sem">{t('svSemImagem')}</span>}
      {giphy && <Selo />}
    </div>
  );
}

function FotoGerada({ busca, emoji, chave }: { busca: string; emoji: string; chave: string }) {
  const r = useFoto(busca, chave);
  // a imagem que não carrega também cai no emoji
  const [falhou, setFalhou] = useState<string | null>(null);
  return r && falhou !== r.url ? <Foto url={r.url} giphy={r.fonte === 'giphy'} aoFalhar={() => setFalhou(r.url)} /> : <div class="sv-foto sv-emoji">{emoji}</div>;
}

/** a imagem do slide: a do jogador (galeria chega só à TV, em `imagem`) ou a automática */
function ImagemSlide({ v, imagem, chave }: { v: Visual; imagem?: string | null; chave: string }) {
  if (v.tipo === 'auto') return <FotoGerada key={chave} busca={v.busca} emoji={v.emoji} chave={chave} />;
  return <Foto url={v.img.tipo === 'galeria' ? imagem ?? '' : v.img.url} giphy={v.img.tipo === 'giphy'} />;
}

function Grafico({ s, sala }: { s: Extract<Slide, { tipo: 'grafico' }>; sala: VistaSala }) {
  const max = Math.max(...s.valores);
  const nomes = ['Q1', 'Q2', 'Q3', 'Q4'];
  if (s.forma === 'pizza') {
    const total = s.valores.reduce((a, b) => a + b, 0);
    let acc = 0;
    const fatias = s.valores.map((v, i) => {
      const de = (acc / total) * 360;
      acc += v;
      return `${CORES[i]} ${de}deg ${(acc / total) * 360}deg`;
    });
    return (
      <div class="sv-grafico">
        <h2>{txt(s.rotulo, sala)}</h2>
        <div class="sv-pizza-linha">
          <div class="sv-pizza" style={{ background: `conic-gradient(${fatias.join(',')})` }} />
          <ul class="sv-legenda">
            {s.valores.map((v, i) => (
              <li key={i}>
                <i style={{ background: CORES[i] }} /> {nomes[i]} · {Math.round((v / total) * 100)}%
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  return (
    <div class="sv-grafico">
      <h2>{txt(s.rotulo, sala)}</h2>
      <div class="sv-barras">
        {s.valores.map((v, i) => (
          <div key={i} class="sv-barra">
            <b>{v}</b>
            <div style={{ height: `${(v / max) * 100}%`, background: v === max ? CORES[1] : CORES[0] }} />
            <span>{nomes[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** um slide branco "de empresa" (cantos retos, letra limpa) */
export function SlideBranco({ sala, titulo, s, imagem, n, total, chave }: { sala: VistaSala; titulo: string; s: Slide; imagem?: string | null; n: number; total: number; chave: string }) {
  return (
    <div class="sv-slide">
      <div class="sv-slide-cab">
        <span>{titulo}</span>
        <span>
          {n}/{total}
        </span>
      </div>
      {s.tipo === 'foto' ? (
        <div class="sv-slide-corpo">
          <ImagemSlide v={s.visual} imagem={imagem} chave={chave} />
          <p class="sv-legenda-foto">{txt(s.legenda, sala)}</p>
        </div>
      ) : (
        // imagem à esquerda, texto à direita
        <div class="sv-slide-corpo sv-duo">
          <ImagemSlide v={s.visual} imagem={imagem} chave={chave} />
          <div class="sv-texto">
            {s.tipo === 'grafico' && <Grafico s={s} sala={sala} />}
            {s.tipo === 'citacao' && <blockquote class="sv-citacao">{txt(s.texto, sala)}</blockquote>}
            {s.tipo === 'lista' && (
              <ul class="sv-lista">
                {s.itens.map((x) => (
                  <li key={x.id}>{txt(x, sala)}</li>
                ))}
              </ul>
            )}
            {s.tipo === 'conclusao' && <div class="sv-conclusao">{txt(s.palavra, sala)}</div>}
          </div>
        </div>
      )}
      <div class="sv-slide-pe">NOB Corp. · {t('svReuniao')}</div>
    </div>
  );
}

export function PlacarSevira({ sala, v, tam = 48 }: { sala: VistaSala; v: VistaSevira; tam?: number }) {
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
