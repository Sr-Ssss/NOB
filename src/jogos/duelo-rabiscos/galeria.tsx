/** Só em dev: `#/demo-duelo?galeria=1`, as estruturas de obstáculos lado a lado, para escolher */
import { Dado } from './artes/dados';
import { ARTE_EFEITO, EfeitosPeca, type Efeito } from './artes/efeitos';
import { Arte } from './artes/lapis';
import type { Cria } from './regras';
import { CRIATURAS, type Criatura } from './criaturas';
import { CartaJogo } from './artes/cartaJogo';
import { centroHex } from './artes/tabuleiro';
import { INCLINA, projecao } from './colmeia';
import { Estrutura, type TipoEstrutura } from './estruturas';
import { distancia, ler, vizinhas, type Casa } from './tabuleiro';

const NOMES: [TipoEstrutura, string, boolean][] = [
  ['ruina', 'Ruína', false],
  ['arbusto', 'Sebe', false],
  ['tronco', 'Tronco caído', false],
  ['poca', 'Lago', false],
  ['pedra', 'Pedras', false],
  ['arvore', 'Bosque', false],
  ['casa', 'Casa partida', true],
  ['montanha', 'Montanha (pirâmide)', true],
  ['cerca', 'Cerca', true],
  ['carroca', 'Carroça partida', true],
];

const MEIO: Casa = '3,3';
// um grupo de 3 casas coladas e as casas à volta
const GRUPO: Casa[] = ['3,3', '4,3', '3,4'];
const CASAS = [...new Set([MEIO, ...vizinhas(MEIO), ...GRUPO.flatMap(vizinhas)])];

function Uma({ tipo, nome, nova }: { tipo: TipoEstrutura; nome: string; nova: boolean }) {
  const planos = CASAS.map((c) => ({ c, ...centroHex(...ler(c)) }));
  const p = projecao(planos);
  const chao = planos.map((q) => ({ ...q, ...p(q.x, q.y) })).sort((a, b) => a.y - b.y);
  const hex = (ox: number, oy: number) =>
    [0, 1, 2, 3, 4, 5]
      .map((k) => {
        const a = (Math.PI / 3) * k - Math.PI / 2;
        const q = p(ox + 49 * Math.cos(a), oy + 49 * Math.sin(a));
        return `${k ? 'L' : 'M'}${q.x} ${q.y}`;
      })
      .join('') + 'Z';
  const pontos = GRUPO.map((c) => {
    const q = centroHex(...ler(c));
    return p(q.x, q.y);
  });
  const ligacoes = GRUPO.flatMap((a, i) => GRUPO.flatMap((b, j) => (j > i && distancia(a, b) === 1 ? [[i, j] as [number, number]] : [])));
  const xs = chao.map((q) => q.x);
  const ys = chao.map((q) => q.y);
  return (
    <figure class="cartao" style={{ margin: 0, textAlign: 'center', color: 'var(--tinta)' }}>
      <svg viewBox={`${Math.min(...xs) - 60} ${Math.min(...ys) - 150} ${Math.max(...xs) - Math.min(...xs) + 120} ${Math.max(...ys) - Math.min(...ys) + 200}`} width="100%">
        {chao.map((q) => (
          <path key={q.c} d={hex(planos.find((x) => x.c === q.c)!.x, planos.find((x) => x.c === q.c)!.y)} fill={GRUPO.includes(q.c) ? '#cfccc4' : '#fffdf2'} stroke="#2b2a33" stroke-width="2.5" />
        ))}
        <Estrutura tipo={tipo} p={pontos} ligacoes={ligacoes} semente={7} achata={Math.cos(INCLINA)} />
      </svg>
      <figcaption>
        <b>{nome}</b> {nova ? '(nova)' : ''}
      </figcaption>
    </figure>
  );
}

export function GaleriaEstruturas() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(470px, 1fr))', gap: '12px', padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <figure class="cartao" style={{ margin: 0, gridColumn: '1 / -1', display: 'flex', gap: '16px', justifyContent: 'center', color: 'var(--tinta)' }}>
        {(['andar', 'fazerAlgo', 'habilidade', 'coringa', 'ataqueVazio', 'ataque1', 'ataque2', 'ataqueFere', 'ataqueGema', 'defesaVazio', 'defesa1', 'defesaFere', 'defesaGema', 'feridaEspada', 'feridaCoracao', 'feridaDefEscudo', 'feridaDefGema'] as const).map((f) => (
          <span key={f} style={{ textAlign: 'center' }}>
            <Dado face={f} tam={64} />
            <br />
            {f}
          </span>
        ))}
      </figure>
      <figure class="cartao cartas-exemplo" style={{ margin: 0, display: 'flex', gap: '8px', color: 'var(--tinta)' }}>
        <CartaJogo criatura="mumia" estilo="classe" ranhuras={{ andar: 'usada', especial: 'acesa' }} ferimentos={1} />
        <CartaJogo criatura="ogre" estilo="classe" ranhuras={{ atacar: 'acesa' }} />
        <CartaJogo criatura="elfo" estilo="classe" ranhuras={{ andar: 'acesa' }} />
      </figure>
      <figure class="cartao efeitos-galeria" style={{ margin: 0, display: 'flex', gap: '16px', alignItems: 'center', color: 'var(--tinta)' }}>
        {(Object.keys(ARTE_EFEITO) as Efeito[]).map((e) => (
          <span key={e} style={{ textAlign: 'center' }}>
            <Arte c={ARTE_EFEITO[e]} tam={64} />
            <br />
            {e}
          </span>
        ))}
        <svg viewBox="-60 -40 140 60" width="280" height="120">
          <EfeitosPeca c={{ sono: true, escudo: true, furia: true, maisAtaque: true, fantasma: true } as Cria} />
        </svg>
      </figure>
      <figure class="cartao todas-cartas" style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: '8px', gridColumn: '1 / -1' }}>
        {(Object.keys(CRIATURAS) as Criatura[]).map((c) => (
          <CartaJogo key={c} criatura={c} estilo="classe" />
        ))}
      </figure>
      {NOMES.map(([t, n, nova]) => (
        <Uma key={t} tipo={t} nome={n} nova={nova} />
      ))}
    </div>
  );
}
