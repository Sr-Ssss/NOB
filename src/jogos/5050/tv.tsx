import { useEffect, useState } from 'preact/hooks';
import type { VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Avatar, Boneco, COR_NAO, COR_SIM, CORAL, Feito, Temporizador } from '../../ui/comuns';
import { T_REVELAR, type Resultado, type Vista5050 } from './regras';

export interface PropsJogo {
  sala: VistaSala;
  v: Vista5050;
  agora: () => number;
}

export function nomeDe(sala: VistaSala, id: string): string {
  return sala.jogadores.find((j) => j.id === id)?.nome ?? '?';
}

export function avatarDe(sala: VistaSala, id: string): number {
  return sala.jogadores.find((j) => j.id === id)?.avatar ?? 0;
}

/** segundos que faltam (para o relógio dentro da balança) */
function useSegundos(terminaEm: number, restante: number | null, agora: () => number): number {
  const [, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), 250);
    return () => clearInterval(i);
  }, []);
  return Math.ceil((restante ?? Math.max(0, terminaEm - agora())) / 1000);
}

export function Cabecalho({ v, agora, comTempo = true }: Omit<PropsJogo, 'sala'> & { comTempo?: boolean }) {
  return (
    <div class="topo">
      <span>
        {t('ronda', { n: v.ronda, t: v.def.rondas })}
        {v.ronda === v.def.rondas && v.fase === 'escrever' ? ' · ' + t('ultimaRonda') : ''}
      </span>
      {comTempo && v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
    </div>
  );
}

/** linha de bonecos com ✅ / balão de pensamento */
export function Estado({ sala, ids, feitos, tam }: { sala: VistaSala; ids: string[]; feitos: string[]; tam?: number }) {
  return (
    <div class="estado">
      {ids.map((id) => {
        const j = sala.jogadores.find((x) => x.id === id);
        return j ? <Boneco key={id} j={j} tam={tam} marca={<Feito ok={feitos.includes(id)} />} /> : null;
      })}
    </div>
  );
}

/** barra simples (telemóvel, sem TV) */
export function Barra({ r }: { r: Resultado }) {
  const a = r.votosA.length;
  const b = r.votosB.length;
  const n = a + b || 1;
  return (
    <div class="barra">
      <div style={{ width: `${(a / n) * 100}%`, background: COR_SIM, color: '#fff' }}>{a}</div>
      <div style={{ width: `${(b / n) * 100}%`, background: COR_NAO, color: '#fff' }}>{b}</div>
    </div>
  );
}

export function Placar({ sala, v, tam = 48 }: { sala: VistaSala; v: Vista5050; tam?: number }) {
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

export function Premios({ sala, v }: { sala: VistaSala; v: Vista5050 }) {
  const lista: [string, string, string | undefined][] = [
    ['🎯', t('mestreDoMeio'), v.premios.mestreDoMeio],
    ['🤝', t('unanimidade'), v.premios.unanimidade],
    ['⏱️', t('ultimoSegundo'), v.premios.ultimoSegundo],
  ];
  return (
    <div class="linha">
      {lista
        .filter((p) => p[2])
        .map(([ic, nome, id]) => (
          <div class="premio" key={nome}>
            {ic} {nome}: <b>{nomeDe(sala, id!)}</b>
          </div>
        ))}
    </div>
  );
}

export function Lados({ a, b }: { a: string; b: string }) {
  return (
    <div class="lados">
      <div class="lado sim">{a}</div>
      <div class="lado nao">{b}</div>
    </div>
  );
}

const PIVO_X = 500;
const PIVO_Y = 150;
const BRACO = 360;
const MAX_GRAUS = 14;

/** votos por ordem de queda, alternando os lados (a balança vai pendendo) */
function ordemQueda(r: Resultado): { id: string; lado: 'a' | 'b' }[] {
  const out: { id: string; lado: 'a' | 'b' }[] = [];
  for (let i = 0; i < Math.max(r.votosA.length, r.votosB.length); i++) {
    if (r.votosA[i]) out.push({ id: r.votosA[i], lado: 'a' });
    if (r.votosB[i]) out.push({ id: r.votosB[i], lado: 'b' });
  }
  return out;
}

/** Balança grande "meio 3D": SIM e NÃO nos pratos, relógio no eixo, bonecos caem um a um (também no telemóvel sem TV) */
export function Balanca({
  sala,
  a,
  b,
  segundos,
  r,
  mostrarVotos,
}: {
  sala: VistaSala;
  a: string;
  b: string;
  segundos: number | null;
  r?: Resultado;
  mostrarVotos: boolean;
}) {
  const queda = r ? ordemQueda(r) : [];
  const [caidos, setCaidos] = useState(0);
  const chave = r ? `${r.autor}:${r.ronda}` : '';
  useEffect(() => {
    setCaidos(0);
    if (!queda.length) return;
    const passo = Math.min(650, ((T_REVELAR - 2) * 1000) / queda.length);
    const i = setInterval(() => setCaidos((c) => (c >= queda.length ? c : c + 1)), passo);
    return () => clearInterval(i);
  }, [chave]);

  const vis = queda.slice(0, caidos);
  const na = vis.filter((x) => x.lado === 'a').length;
  const nb = vis.length - na;
  const total = queda.length || 1;
  const graus = ((na - nb) / total) * MAX_GRAUS; // positivo = SIM mais pesado (desce à esquerda)
  const dy = Math.sin((graus * Math.PI) / 180) * BRACO;

  const prato = (lado: 'a' | 'b', x: number, texto: string, cor: string) => {
    const caiu = vis.filter((v) => v.lado === lado);
    return (
      <g class="prato" style={{ transform: `translateY(${lado === 'a' ? dy : -dy}px)` }}>
        <line x1={x} y1={PIVO_Y} x2={x - 110} y2={PIVO_Y + 200} stroke="#1d1b26" stroke-width="4" />
        <line x1={x} y1={PIVO_Y} x2={x + 110} y2={PIVO_Y + 200} stroke="#1d1b26" stroke-width="4" />
        {/* prato: tampo + taça (meio 3D) */}
        <path d={`M${x - 160} ${PIVO_Y + 205} Q${x} ${PIVO_Y + 330} ${x + 160} ${PIVO_Y + 205} Z`} fill={cor} stroke="#1d1b26" stroke-width="6" />
        <ellipse cx={x} cy={PIVO_Y + 205} rx="160" ry="26" fill={cor} stroke="#1d1b26" stroke-width="6" />
        <ellipse cx={x} cy={PIVO_Y + 205} rx="140" ry="16" fill="#000" opacity="0.18" />
        {/* bonecos sentados no prato (filas de 4, de baixo para cima) */}
        {caiu.map((v, i) => {
          const col = i % 4;
          const lin = Math.floor(i / 4);
          return (
            <g key={v.id} transform={`translate(${x - 128 + col * 64 + (lin % 2) * 16} ${PIVO_Y + 150 - lin * 46})`}>
              <g class="cair">
                {mostrarVotos ? (
                  <foreignObject width="68" height="68">
                    <Avatar n={avatarDe(sala, v.id)} tam={68} />
                  </foreignObject>
                ) : (
                  <circle cx="34" cy="34" r="24" fill="#F1EFE8" stroke="#1d1b26" stroke-width="5" />
                )}
              </g>
            </g>
          );
        })}
        <text x={x} y={PIVO_Y + 272} text-anchor="middle" class="texto-prato">
          {texto.length > 18 ? texto.slice(0, 17) + '…' : texto}
        </text>
        {r && caidos >= queda.length && (
          <text x={x} y={PIVO_Y + 318} text-anchor="middle" class="conta-prato">
            {lado === 'a' ? r.votosA.length : r.votosB.length}
          </text>
        )}
      </g>
    );
  };

  return (
    <svg class="balanca" viewBox="0 0 1000 560" role="img" aria-label={`${a} / ${b}`}>
      {/* base e coluna com sombra */}
      <path d="M400 540 L600 540 L570 505 L430 505 Z" fill="#8d89b3" stroke="#1d1b26" stroke-width="6" />
      <rect x="486" y={PIVO_Y} width="28" height="360" fill="#b5b1d6" stroke="#1d1b26" stroke-width="6" />
      <rect x="500" y={PIVO_Y + 4} width="10" height="352" fill="#8d89b3" />
      {prato('a', PIVO_X - BRACO, a, COR_SIM)}
      {prato('b', PIVO_X + BRACO, b, COR_NAO)}
      {/* braço */}
      <g class="braco" style={{ transform: `rotate(${-graus}deg)` }}>
        <rect x={PIVO_X - BRACO - 12} y={PIVO_Y - 12} width={BRACO * 2 + 24} height="24" rx="12" fill="#F1EFE8" stroke="#1d1b26" stroke-width="6" />
        <rect x={PIVO_X - BRACO} y={PIVO_Y + 2} width={BRACO * 2} height="7" rx="3" fill="#bdb8a8" />
      </g>
      {/* eixo com o relógio */}
      <circle cx={PIVO_X} cy={PIVO_Y} r="62" fill={segundos !== null && segundos <= 5 ? CORAL : '#F1EFE8'} stroke="#1d1b26" stroke-width="7" />
      <text x={PIVO_X} y={PIVO_Y + 22} text-anchor="middle" class="relogio">
        {segundos === null ? '⚖' : segundos}
      </text>
    </svg>
  );
}

export function Tv5050({
  sala,
  v,
  agora,
  selFim = 0,
  onOutraVez,
  onMenu,
}: PropsJogo & { selFim?: number; onOutraVez: () => void; onMenu: () => void }) {
  const r = v.resultado;
  const segundos = useSegundos(v.terminaEm, v.restante, agora);
  return (
    <div class="pag tv jogo-5050">
      <Cabecalho v={v} agora={agora} comTempo={v.fase === 'escrever' || v.fase === 'placar'} />
      {/* pausa por saída: o aviso próprio (src/ui/saidas.tsx) explica */}
      {v.restante !== null && !sala.pausaSaida && <div class="aviso">{t('pausa')}</div>}

      {v.fase === 'escrever' && (
        <>
          <h1 class="pergunta">{t('fEscrever')}</h1>
          <Estado sala={sala} ids={v.participantes} feitos={v.enviaram} tam={110} />
        </>
      )}

      {(v.fase === 'mostrar' || v.fase === 'votar') && v.dilema && (
        <>
          <h1 class="pergunta">{v.dilema.texto}</h1>
          <Balanca sala={sala} a={v.dilema.a} b={v.dilema.b} segundos={segundos} mostrarVotos={v.def.mostrarVotos} />
          {v.fase === 'votar' ? <Estado sala={sala} ids={v.votantes} feitos={v.votaram} tam={64} /> : <p class="centro">{t('fMostrar')}</p>}
        </>
      )}

      {v.fase === 'revelar' && r && (
        <>
          <h1 class="pergunta">{r.texto}</h1>
          <Balanca sala={sala} a={r.a} b={r.b} segundos={null} r={r} mostrarVotos={v.def.mostrarVotos} />
          <div class="cartao centro autor-revelado">
            <span>{t('autor', { nome: nomeDe(sala, r.autor) })}</span>
            <b style={{ color: '#c4573a' }}> +{r.pontos}</b>
            {r.perfeito && <span> · {t('perfeito')}</span>}
          </div>
        </>
      )}

      {v.fase === 'placar' && (
        <div class="cartao">
          <h2>{t('placar')}</h2>
          {v.enviaram.length === 0 && <p>{t('semDilemas')}</p>}
          <Placar sala={sala} v={v} tam={72} />
        </div>
      )}

      {v.fase === 'fim' && (
        <>
          <h1 class="pergunta">{t('fim')}</h1>
          <div class="cartao">
            <Placar sala={sala} v={v} tam={80} />
          </div>
          <Premios sala={sala} v={v} />
          <div class="linha">
            <button class={'botao' + (selFim === 0 ? ' foco' : '')} onClick={onOutraVez}>
              {t('jogarOutraVez')}
            </button>
            <button class={'botao sec' + (selFim === 1 ? ' foco' : '')} onClick={onMenu}>
              {t('menu')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
