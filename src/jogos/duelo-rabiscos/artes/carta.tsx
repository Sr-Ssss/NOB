import type { ComponentChildren } from 'preact';
import { Dado, PEGADAS } from './dados';
import { CRIATURAS, CUSTO, MAGOS_PODERES, type Criatura, type RoupaMago } from '../criaturas';
import { NOME_CLASSE, NOME_MAGO, TEXTO_CRIATURA, TEXTO_PODER } from '../textos';
import { IconeClasse } from './icones';
import { Arte, type Camada } from './lapis';
import { Mago } from './magos';
import { Molde } from './moldes';

export const ICONES_STATUS = {
  tinta: [['M50 6Q84 48 84 64Q82 94 50 95Q18 94 16 64Q16 48 50 6Z', '#b9c4f5', 7]],
  defesa: [['M50 4Q69 15 92 15Q97 70 50 97Q3 70 8 15Q31 15 50 4Z', '#dcecff', 7], ['M36 49L47 60L65 38', undefined, 8]],
  passos: PEGADAS,
  ferimento: [['M50 5Q80 6 92 34Q99 62 78 84Q52 102 22 84Q0 62 8 34Q20 6 50 5Z', '#eadcf0', 7], ['M60 16L42 40L58 52L40 84', undefined, 8]],
  ataque: [['M92 8L92 30L50 72L30 52L70 10Z', '#e9eef2', 7], ['M18 44L56 82M37 63L14 86', undefined, 10]],
  gema: [['M26 12L74 12L94 40L50 94L6 40Z', '#c9f0e4', 7], ['M6 40L94 40M34 40L50 92L66 40L50 12Z', undefined, 4]],
} satisfies Record<string, Camada[]>;
export type Status = keyof typeof ICONES_STATUS;

function Valor({ s, n }: { s: Status; n: number }) {
  return (
    <span class={`dr-valor dr-valor-${s}`}>
      <Arte c={ICONES_STATUS[s]} tam={24} />
      <b>{n}</b>
    </span>
  );
}

/** `children` = desenho do jogador (senão, o molde); `ferimentos` = na luta. Estilo em carta.css */
export function Carta({ criatura, ferimentos = 0, children }: { criatura: Criatura; ferimentos?: number; children?: ComponentChildren }) {
  const f = CRIATURAS[criatura];
  const t = TEXTO_CRIATURA[criatura];
  const resumo = `${t.nome}, ${NOME_CLASSE[f.classe]}. Tinta ${f.tinta}, ataque ${f.dados}, defesa ${f.defesa}, passos ${f.passos}${ferimentos ? `, ferimentos ${ferimentos}` : ''}. ${t.habilidade ? 'Usa o dado Habilidade. ' : ''}${t.especial}`;
  return (
    <div class={`dr-carta dr-carta-${f.classe}`} role="img" aria-label={resumo}>
      <div class="dr-carta-topo">
        <Valor s="tinta" n={f.tinta} />
        <b class="dr-carta-nome">{t.nome}</b>
        <IconeClasse classe={f.classe} tam={28} />
      </div>
      <div class="dr-carta-desenho">{children ?? <Molde criatura={criatura} tam={180} cheio />}</div>
      <div class="dr-carta-classe">{NOME_CLASSE[f.classe]}</div>
      <div class="dr-carta-status">
        <Valor s="ataque" n={f.dados} />
        <Valor s="defesa" n={f.defesa} />
        <Valor s="passos" n={f.passos} />
        {ferimentos > 0 && <Valor s="ferimento" n={ferimentos} />}
      </div>
      <p class="dr-carta-especial">
        {t.habilidade && <Dado face="habilidade" tam={26} />} {t.especial}
      </p>
    </div>
  );
}

/** `children` = avatar do jogador (ver Mago) */
export function CartaMago({ roupa, children }: { roupa: RoupaMago; children?: ComponentChildren }) {
  const poderes = MAGOS_PODERES[roupa].map((p) => ({ ...TEXTO_PODER[p], p, custo: CUSTO[p] }));
  const resumo = `${NOME_MAGO[roupa]}. ${poderes.map((x) => `${x.nome}, ${x.custo} ${x.custo === 1 ? 'gema' : 'gemas'}: ${x.efeito}`).join(' ')}`;
  return (
    <div class="dr-carta dr-carta-mago" role="img" aria-label={resumo}>
      <div class="dr-carta-topo">
        <b class="dr-carta-nome">{NOME_MAGO[roupa]}</b>
      </div>
      <div class="dr-carta-desenho">
        <Mago roupa={roupa} tam={120}>
          {children}
        </Mago>
      </div>
      {poderes.map((x) => (
        <div key={x.p} class="dr-carta-poder">
          <Valor s="gema" n={x.custo} />
          <p>
            <b>{x.nome}</b>
            <br />
            {x.efeito}
          </p>
        </div>
      ))}
    </div>
  );
}
