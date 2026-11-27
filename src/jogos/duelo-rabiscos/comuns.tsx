import { useEffect, useRef, useState } from 'preact/hooks';
import type { VistaSala } from '../../core/sala';
import { Boneco18 } from '../../ui/bonecos';
import { avatarDe, nomeDe } from '../5050/tv';
import { ENCAIXE, Mago } from './artes/magos';
import { MOSTRAR_BATALHA, Sinal, Retrato, indice } from './colmeia';
import { DadoRola, type FaceDado } from './artes/dados';
import { MarcaGolpe, type Marca } from './artes/icones';
import { ICONES_STATUS } from './artes/carta';
import { Arte } from './artes/lapis';
import { faceAcao, facesLado, total } from './jogadas';
import { NOME_DADO, TEXTO_CRIATURA, TXT } from './textos';
import { classificacao, cria, feitosPreparacao, foraDuelo, type Batalha, type Cria, type Desenhos, type VistaDuelo } from './regras';
import { somDados, somGolpe } from './sons';
import './duelo.css';

export interface PropsDuelo {
  sala: VistaSala;
  v: VistaDuelo;
  agora: () => number;
}

/** os magos e quem já está pronto: o que a TV mostra na preparação (e o telemóvel à espera, sem TV) */
export function Palco({ sala, v }: Omit<PropsDuelo, 'agora'>) {
  const feitos = feitosPreparacao(v);
  return (
    <div class="dr-palco">
      <h1 class="pergunta">{v.fase === 'mago' ? TXT.mago : v.fase === 'exercito' ? TXT.exercito : TXT.desenhar}</h1>
      <div class="dr-magos">
        {v.participantes.map((id) => {
          const m = v.magos[id];
          const avatar = <Boneco18 n={avatarDe(sala, id)} tam={ENCAIXE.tam} />;
          const pronto = feitos.includes(id);
          return (
            <div key={id} class={'dr-mago-tv' + (pronto ? ' pronto' : '')}>
              {m.roupa ? <Mago roupa={m.roupa}>{avatar}</Mago> : <div class="dr-sem-roupa">{avatar}</div>}
              <b>{nomeDe(sala, id)}</b>
              <span>{pronto ? '✅ ' + TXT.pronto : v.fase === 'desenhar' ? TXT.desenhos(Object.keys(m.desenhos).length, Object.keys(m.exercito ?? {}).length) : '…'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
/** nome com a cor e a forma do mago */
export function NomeMago({ sala, v, id, tam = 24 }: Omit<PropsDuelo, 'agora'> & { id: string; tam?: number }) {
  return (
    <b class="dr-nome">
      <Sinal i={indice(v, id)} tam={tam} /> {nomeDe(sala, id)}
    </b>
  );
}

export function Gemas({ n, tam = 24 }: { n: number; tam?: number }) {
  return (
    <span class="dr-gemas" role="img" aria-label={TXT.gemas(n)}>
      <Arte c={ICONES_STATUS.gema} tam={tam} />
      <b>{n}</b>
    </span>
  );
}

/** de quem é a vez, numa linha */
export function faixa(sala: VistaSala, v: VistaDuelo): string {
  const dono = (id: number | null | undefined) => nomeDe(sala, cria(v, id ?? undefined)?.dono ?? '');
  if (v.fase === 'rodar') return TXT.todosRodam;
  if (v.fase === 'batalha') return TXT.lutam(dono(v.batalha?.de), dono(v.batalha?.alvo));
  if (v.fase === 'lobo') return TXT.loboDe(dono(v.lobo));
  return TXT.vezDe(nomeDe(sala, v.vez));
}

type Quem = Pick<Cria, 'dono' | 'tipo'>;
/** os dois lados da batalha com os dados; `aoTocar` = posso rodar os meus outra vez */
export function Luta({
  sala,
  v,
  desenhos,
  b,
  de,
  alvo,
  tam,
  eu,
  aoTocar,
  rolar = true,
  caiu,
  marca,
  selo,
}: Omit<PropsDuelo, 'agora'> & { desenhos: Desenhos; b: Batalha; de: Quem; alvo: Quem; tam: number; eu?: string; aoTocar?: (i: number) => void; rolar?: boolean; caiu?: [boolean, boolean]; marca?: Marca; selo?: Selo }) {
  // `caiu` (só na batalha acabada): quem caiu fica cinzento, mais pequeno e com a marca do golpe; quem ficou de pé salta
  const lado = (q: Quem, ataca: boolean) => {
    const morreu = caiu?.[ataca ? 0 : 1];
    const [normais, feridas] = ataca ? [b.ataque, b.feridaAtaque] : [b.defesa, b.feridaDefesa];
    const meu = aoTocar && q.dono === eu;
    const dado = (f: FaceDado, i: number) =>
      meu ? (
        <button key={i} class="dr-bt-dado" aria-label={TXT.rodarDado(NOME_DADO[f])} onClick={() => aoTocar(i)}>
          <DadoRola face={f} tam={tam} rolar={rolar} />
          {selo && <SeloDado selo={selo} />}
        </button>
      ) : (
        <span key={i} role="img" aria-label={NOME_DADO[f]}>
          <DadoRola face={f} tam={tam} rolar={rolar} />
        </span>
      );
    return (
      <div class={'dr-lado' + (caiu ? (morreu ? ' dr-caiu' : ' dr-de-pe') : '')}>
        <NomeMago sala={sala} v={v} id={q.dono} tam={tam / 2} />
        <div class="dr-retrato-luta">
          <Retrato criatura={q.tipo} tracos={desenhos[q.dono]?.[q.tipo]} tam={tam * 2} />
          {morreu && marca && (
            <span class="dr-golpe" aria-hidden="true">
              <MarcaGolpe marca={marca} tam={tam * 1.4} />
            </span>
          )}
        </div>
        <span>{TEXTO_CRIATURA[q.tipo].nome}</span>
        <div class="dr-dados">{facesLado(normais, feridas, ataca).map(dado)}</div>
        <b>
          {ataca ? TXT.ataca : TXT.defende} {total(normais, feridas, ataca)}
        </b>
      </div>
    );
  };
  return (
    <div class="dr-luta">
      {lado(de, true)}
      <span class="dr-vs" aria-hidden="true">⚔️</span>
      {lado(alvo, false)}
    </div>
  );
}

/** o que custa tocar num dado para o rodar outra vez: grátis (setinha) ou 1 gema */
export type Selo = 'gratis' | 'gema';
export function SeloDado({ selo }: { selo: Selo }) {
  return (
    <span class={'dr-selo ' + selo} aria-hidden="true">
      {selo === 'gema' ? <Gemas n={1} tam={14} /> : '↻'}
    </span>
  );
}

/** a batalha que está a acontecer, ou a última (com o resultado e a marca no golpe) */
export function BatalhaOuUltima(p: Omit<PropsDuelo, 'agora'> & { desenhos: Desenhos; tam: number; eu?: string; aoTocar?: (i: number) => void; selo?: Selo }) {
  const { v } = p;
  if (v.fase === 'batalha' && v.batalha) {
    const de = cria(v, v.batalha.de);
    const alvo = cria(v, v.batalha.alvo);
    return de && alvo ? <Luta {...p} b={v.batalha} de={de} alvo={alvo} /> : null;
  }
  const u = v.ultimo;
  if (!u) return null;
  return (
    <div class="dr-resultado" role="status">
      <Luta sala={p.sala} v={v} desenhos={p.desenhos} tam={p.tam} b={u.dados} de={u.quemAtacou} alvo={u.quemDefendeu} rolar={false} caiu={[u.morreuQuemAtacou, u.morreu]} marca={u.marca} />
      {/* o resultado vê-se nos retratos; o texto fica só para os leitores de ecrã */}
      <p class="dr-so-leitor">{TXT.resultado(u.morreu, u.morreuQuemAtacou, TEXTO_CRIATURA[u.quemAtacou.tipo].nome, TEXTO_CRIATURA[u.quemDefendeu.tipo].nome)}</p>
    </div>
  );
}

/** uma batalha nova espera um pouco, para se ver a criatura chegar ao lado do inimigo antes da luta tapar a colmeia */
const CHEGAR = 900;
export function useEsperaBatalha(v: VistaDuelo): boolean {
  const chave = v.fase === 'batalha' && v.batalha ? `${v.batalha.de}:${v.batalha.alvo}:${v.ultimo?.n ?? 0}` : '';
  const visto = useRef({ k: '', t: 0 });
  if (chave && visto.current.k !== chave) visto.current = { k: chave, t: Date.now() };
  const [, refazer] = useState(0);
  useEffect(() => {
    if (!chave) return;
    const falta = CHEGAR - (Date.now() - visto.current.t);
    if (falta <= 0) return;
    const i = setTimeout(() => refazer((x) => x + 1), falta);
    return () => clearTimeout(i);
  }, [chave]);
  return !!chave && Date.now() - visto.current.t < CHEGAR;
}

const MOSTRAR = MOSTRAR_BATALHA;
/** há uma batalha acabada há pouco para mostrar? (quem entra a meio não vê as antigas); `som`: toca os dados e o golpe */
export function useBatalhaNova(v: VistaDuelo, som = false): boolean {
  const n = v.ultimo?.n ?? 0;
  const vista = useRef(n);
  const [mostra, setMostra] = useState(false);
  const rolar = v.fase === 'rodar' || v.fase === 'batalha' ? `${v.fase}:${v.volta}:${v.batalha?.de ?? ''}` : '';
  useEffect(() => {
    if (som && rolar) somDados();
  }, [rolar]);
  useEffect(() => {
    if (vista.current === n) return;
    vista.current = n;
    if (som && v.ultimo) somGolpe(v.ultimo.morreu || v.ultimo.morreuQuemAtacou);
    setMostra(true);
    const i = setTimeout(() => setMostra(false), MOSTRAR);
    return () => clearTimeout(i);
  }, [n]);
  return mostra;
}

/** fim: quem ganhou e a classificação */
export function Classificacao({ sala, v, tam }: Omit<PropsDuelo, 'agora'> & { tam: number }) {
  const l = classificacao(v);
  const primeiros = l.filter((p) => p.lugar === 1);
  return (
    <>
      <h1 class="pergunta">{primeiros.length === 1 ? '🏆 ' + TXT.venceu(nomeDe(sala, primeiros[0].id)) : TXT.empate}</h1>
      <ol class="placar dr-placar">
        {l.map((p) => (
          <li key={p.id}>
            <span>{p.lugar}.º</span>
            <Boneco18 n={avatarDe(sala, p.id)} tam={tam} />
            <NomeMago sala={sala} v={v} id={p.id} tam={tam / 2} />
          </li>
        ))}
      </ol>
    </>
  );
}

/** mago no seu canto: roupa, nome, gemas, criaturas e dados por gastar */
export function CantoMago({ sala, v, id }: Omit<PropsDuelo, 'agora'> & { id: string }) {
  const m = v.magos[id];
  const n = v.criaturas.filter((c) => c.dono === id).length;
  const fora = foraDuelo(v, id);
  return (
    <div class={'dr-canto' + (v.fase === 'vez' && v.vez === id ? ' on' : '') + (fora ? ' fora' : '')}>
      {m.roupa && (
        <Mago roupa={m.roupa}>
          <Boneco18 n={avatarDe(sala, id)} tam={ENCAIXE.tam} />
        </Mago>
      )}
      <NomeMago sala={sala} v={v} id={id} tam={36} />
      <span class="dr-canto-linha">
        <Gemas n={m.gemas} tam={40} /> <span>{fora ? TXT.eliminado : TXT.nCriaturas(n)}</span>
      </span>
      <span class="dr-dados">
        {m.dados.map((f, i) => (
          <DadoRola key={i} face={faceAcao(f)} tam={44} />
        ))}
      </span>
      {v.fase === 'rodar' && !fora && <span>{m.pronto ? '✅ ' + TXT.pronto : '…'}</span>}
    </div>
  );
}
