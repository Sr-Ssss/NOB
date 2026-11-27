import type { ComponentChildren } from 'preact';
import { CRIATURAS, type Classe, type Criatura } from '../criaturas';
import { NOME_CLASSE, NOME_MODO, TEXTO_CRIATURA } from '../textos';
import { ICONES_STATUS, type Status } from './carta';
import { Dado, type FaceDado } from './dados';
import { IconeClasse } from './icones';
import { Arte, type Camada } from './lapis';
import { Molde } from './moldes';
import './cartaJogo.css';

/** estilo escolhido (26/11): cor da classe; os outros 2 saíram */
export type EstiloCarta = 'classe';
export type Ranhura = 'andar' | 'atacar' | 'especial';
/** livre; acesa = o dado escolhido encaixa aqui; usada = já fez isto nesta volta (o dado fica lá dentro) */
export type EstadoRanhura = 'livre' | 'acesa' | 'usada' | 'fechada' | 'luta';

/** cores fortes de cada classe (escolha do utilizador, 26/11: "cor da classe", mais vibrante) */
export const COR_CLASSE: Record<Classe, string> = {
  lacaio: '#2fa84f',
  batedor: '#1f86d6',
  pescador: '#0ea596',
  arqueiro: '#e2a200',
  guardiao: '#6d63a8',
  duelista: '#d8333f',
  barbaro: '#e8650f',
};
const FACE: Record<Ranhura, FaceDado> = { andar: 'andar', atacar: 'fazerAlgo', especial: 'habilidade' };

/** distância: régua com setas nas pontas */
const DISTANCIA: Camada[] = [['M18 50L82 50', undefined, 7, '1 12'], ['M30 32L12 50L30 68', undefined, 8], ['M70 32L88 50L70 68', undefined, 8]];

export type Simbolo = 'habilidade' | 'distancia' | 'ferimento' | 'defesa' | 'ataque' | 'passos';
/** palavras que viram símbolos (PT, BR e EN), por esta ordem */
const PALAVRAS: [Simbolo, RegExp][] = [
  ['habilidade', /(?:Com o dado Habilidade|With the Ability die),?\s*/],
  ['distancia', /(?:a )?até (\d)(?: de distância)?|up to (\d)(?: away)?|(?<=atira )a (\d)|(?<=shoots )at (\d)/],
  ['defesa', /\+(\d) (?:dado de defesa|defence die)/],
  ['ataque', /\+(\d) (?:dado de ataque|attack die|dado|die)/],
  ['ferimento', /(?:(\d) )?(?:ferimentos?|wounds?)/],
  ['passos', /(?:anda|moves) (\d)/],
];
/** [símbolo, regex, quantos grupos tem] */
const GRUPOS = PALAVRAS.map(([s, r]) => [s, r, new RegExp(`${r.source}|`).exec('')!.length - 1] as const);
const TODAS = new RegExp(PALAVRAS.map(([, r]) => `(${r.source})`).join('|'), 'g');

/** o texto partido em palavras e símbolos (com o número, se tiver) */
export function simbolos(texto: string): (string | { s: Simbolo; n?: string })[] {
  const partes: (string | { s: Simbolo; n?: string })[] = [];
  let ult = 0;
  for (const m of texto.matchAll(TODAS)) {
    if (m.index > ult) partes.push(texto.slice(ult, m.index));
    // qual das alternativas apanhou: cada uma é um grupo, seguido dos seus próprios grupos
    let g = 1;
    let s: Simbolo = 'habilidade';
    let n: string | undefined;
    for (const [nome, , k] of GRUPOS) {
      if (m[g] !== undefined) {
        s = nome;
        n = m.slice(g + 1, g + 1 + k).find((x) => x !== undefined);
        break;
      }
      g += 1 + k;
    }
    partes.push({ s, n: s === 'ataque' || s === 'defesa' ? `+${n}` : n });
    ult = m.index + m[0].length;
  }
  if (ult < texto.length) partes.push(texto.slice(ult));
  return partes;
}

const ICONE_SIMBOLO: Record<Exclude<Simbolo, 'habilidade'>, Camada[]> = {
  distancia: DISTANCIA,
  ferimento: ICONES_STATUS.ferimento,
  defesa: ICONES_STATUS.defesa,
  ataque: ICONES_STATUS.ataque,
  passos: ICONES_STATUS.passos,
};

function ComSimbolos({ texto }: { texto: string }) {
  return (
    <>
      {simbolos(texto).map((p, i) =>
        typeof p === 'string' ? (
          p
        ) : (
          <span class="cj-simbolo" key={i}>
            {p.s === 'ataque' || p.s === 'defesa' ? p.n : null}
            {p.s === 'habilidade' ? <Dado face="habilidade" tam={17} /> : <Arte c={ICONE_SIMBOLO[p.s]} tam={15} />}
            {p.s === 'ataque' || p.s === 'defesa' ? null : p.n}
          </span>
        ),
      )}
    </>
  );
}

function Stat({ s, n }: { s: Status; n: number }) {
  return (
    <span class="cj-stat">
      <Arte c={ICONES_STATUS[s]} tam={14} />
      <b>{n}</b>
    </span>
  );
}

/**
 * Carta da batalha: nome e classe em cima; o desenho com os números numa caixinha à esquerda; em baixo, as ranhuras
 * onde os dados encaixam (Andar, Atacar e, se tiver, Especial). `aoTocar` numa ranhura acesa escolhe a ação.
 */
export function CartaJogo({
  criatura,
  estilo,
  ferimentos = 0,
  ranhuras = {},
  aoTocar,
  efeitos,
  children,
}: {
  criatura: Criatura;
  estilo: EstiloCarta;
  ferimentos?: number;
  ranhuras?: Partial<Record<Ranhura, EstadoRanhura>>;
  aoTocar?: (r: Ranhura) => void;
  /** efeitos dos poderes por cima da criatura (sono, escudo…) */
  efeitos?: ComponentChildren;
  children?: ComponentChildren;
}) {
  const f = CRIATURAS[criatura];
  const t = TEXTO_CRIATURA[criatura];
  const lista: Ranhura[] = t.habilidade ? ['andar', 'atacar', 'especial'] : ['andar', 'atacar'];
  return (
    <div class={`cj cj-e-${estilo}`} style={{ '--cj-cor': COR_CLASSE[f.classe] }}>
      {/* o desenho ocupa a carta toda; tudo o resto fica por cima dele */}
      <div class="cj-imagem">
        <div class="cj-desenho">{children ?? <Molde criatura={criatura} tam={150} cheio />}</div>
        <div class="cj-faixa">
          <b class="cj-nome">{t.nome}</b>
          <span class="cj-sub" role="img" aria-label={NOME_CLASSE[f.classe]} title={NOME_CLASSE[f.classe]}>
            <IconeClasse classe={f.classe} tam={18} />
          </span>
        </div>
        <div class="cj-stats" aria-label={`ataque ${f.dados}, defesa ${f.defesa}, passos ${f.passos}`}>
          <Stat s="ataque" n={f.dados} />
          <Stat s="defesa" n={f.defesa} />
          <Stat s="passos" n={f.passos} />
        </div>
        {/* custo em tinta: no canto de cima à esquerda, numa gota */}
        <span class="cj-tinta" aria-label={`custa ${f.tinta} de tinta`}>
          <Arte c={ICONES_STATUS.tinta} tam={34} />
          <b>{f.tinta}</b>
        </span>
        <div class="cj-direita">
          {ferimentos > 0 && (
            <span class="cj-feridas" aria-label={`ferimentos ${ferimentos}`}>
              <Arte c={ICONES_STATUS.ferimento} tam={14} />
              <b>{ferimentos}</b>
            </span>
          )}
          {efeitos}
        </div>
        <p class="cj-especial">
          <ComSimbolos texto={t.especial} />
        </p>
      </div>
      <div class="cj-ranhuras">
        {lista.map((r) => {
          const e = ranhuras[r] ?? 'livre';
          return (
            <button
              key={r}
              class={`cj-ranhura cj-r-${r} cj-${e}`}
              aria-label={NOME_MODO[r]}
              disabled={(e !== 'acesa' && e !== 'luta') || !aoTocar}
              onClick={(ev) => {
                ev.stopPropagation();
                aoTocar?.(r);
              }}
            >
              {e === 'luta' ? <Dado face="ataque2" tam={36} /> : e === 'usada' ? <Dado face={FACE[r]} tam={34} /> : <span class="cj-fantasma"><Dado face={FACE[r]} tam={30} /></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
