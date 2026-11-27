import { useEffect, useState } from 'preact/hooks';
import type { VistaSala } from '../../core/sala';
import { t } from '../../core/i18n';
import { Avatar, Boneco, COR_NAO, COR_SIM, CORAL, Feito, Temporizador } from '../../ui/comuns';
import { PodioEscada } from '../../ui/podio';
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

export function Placar({ sala, v, tv = false }: { sala: VistaSala; v: Vista5050; tv?: boolean }) {
  return <PodioEscada sala={sala} podio={v.podio} tv={tv} />;
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
        {/* fios de latão */}
        <g stroke="#1d1b26" stroke-width="6">
          <line x1={x} y1={PIVO_Y} x2={x - 120} y2={PIVO_Y + 205} />
          <line x1={x} y1={PIVO_Y} x2={x + 120} y2={PIVO_Y + 205} />
        </g>
        <g stroke="#f5c542" stroke-width="2">
          <line x1={x} y1={PIVO_Y} x2={x - 120} y2={PIVO_Y + 205} />
          <line x1={x} y1={PIVO_Y} x2={x + 120} y2={PIVO_Y + 205} />
        </g>
        {/* prato: taça com volume e brilho + aro de latão */}
        <path d={`M${x - 160} ${PIVO_Y + 205} Q${x} ${PIVO_Y + 330} ${x + 160} ${PIVO_Y + 205} Z`} fill={`url(#b5-${lado})`} stroke="#1d1b26" stroke-width="7" />
        <path d={`M${x - 125} ${PIVO_Y + 228} Q${x - 70} ${PIVO_Y + 262} ${x - 15} ${PIVO_Y + 268}`} fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="9" stroke-linecap="round" />
        <ellipse cx={x} cy={PIVO_Y + 205} rx="160" ry="24" fill="url(#b5-lat)" stroke="#1d1b26" stroke-width="6" />
        <ellipse cx={x} cy={PIVO_Y + 207} rx="140" ry="14" fill={cor} />
        <ellipse cx={x} cy={PIVO_Y + 207} rx="140" ry="14" fill="#000" opacity="0.3" />
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
      <defs>
        <linearGradient id="b5-mad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f0bf86" /><stop offset=".45" stop-color="#d4945a" /><stop offset="1" stop-color="#9c6533" /></linearGradient>
        <linearGradient id="b5-madV" x1="0" x2="1"><stop offset="0" stop-color="#a86d38" /><stop offset=".35" stop-color="#e3a86c" /><stop offset=".6" stop-color="#d0904f" /><stop offset="1" stop-color="#8f5a2b" /></linearGradient>
        <linearGradient id="b5-lat" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff1b8" /><stop offset=".3" stop-color="#f5c542" /><stop offset=".75" stop-color="#c98a1c" /><stop offset="1" stop-color="#8a5a0e" /></linearGradient>
        <radialGradient id="b5-a" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#ff8f8f" /><stop offset=".5" stop-color={COR_SIM} /><stop offset="1" stop-color="#9c2d31" /></radialGradient>
        <radialGradient id="b5-b" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#8fb0ff" /><stop offset=".5" stop-color={COR_NAO} /><stop offset="1" stop-color="#26408f" /></radialGradient>
        <radialGradient id="b5-mostr" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff" /><stop offset=".7" stop-color="#F1EFE8" /><stop offset="1" stop-color="#cfcabb" /></radialGradient>
      </defs>
      {/* base e coluna de madeira polida (com anel de latão) */}
      <ellipse cx="500" cy="548" rx="230" ry="12" fill="#0b0820" opacity="0.5" />
      <path d="M340 545 h320 q8 0 4 -10 l-26 -36 h-276 l-26 36 q-4 10 4 10 z" fill="url(#b5-mad)" stroke="#1d1b26" stroke-width="7" stroke-linejoin="round" />
      <path d="M372 511 h256" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round" />
      <path d="M360 530 q60 -6 120 0 t120 0" fill="none" stroke="#8f5a2b" stroke-width="3" opacity=".7" />
      <rect x="474" y={PIVO_Y} width="52" height="352" rx="12" fill="url(#b5-madV)" stroke="#1d1b26" stroke-width="7" />
      <path d={`M490 ${PIVO_Y + 90} q6 60 0 120 t2 120 M512 ${PIVO_Y + 110} q-5 50 0 100`} fill="none" stroke="#8f5a2b" stroke-width="3" opacity=".7" />
      <rect x="462" y="474" width="76" height="26" rx="8" fill="url(#b5-lat)" stroke="#1d1b26" stroke-width="6" />
      {prato('a', PIVO_X - BRACO, a, COR_SIM)}
      {prato('b', PIVO_X + BRACO, b, COR_NAO)}
      {/* braço de latão polido, curvo, com pontas */}
      <g class="braco" style={{ transform: `rotate(${-graus}deg)` }}>
        <path d={`M${PIVO_X - BRACO - 20} ${PIVO_Y} Q${PIVO_X} ${PIVO_Y - 40} ${PIVO_X + BRACO + 20} ${PIVO_Y}`} fill="none" stroke="#1d1b26" stroke-width="36" stroke-linecap="round" />
        <path d={`M${PIVO_X - BRACO - 20} ${PIVO_Y} Q${PIVO_X} ${PIVO_Y - 40} ${PIVO_X + BRACO + 20} ${PIVO_Y}`} fill="none" stroke="url(#b5-lat)" stroke-width="24" stroke-linecap="round" />
        <path d={`M${PIVO_X - BRACO + 10} ${PIVO_Y - 10} Q${PIVO_X} ${PIVO_Y - 44} ${PIVO_X + BRACO - 10} ${PIVO_Y - 10}`} fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round" />
        <path d={`M${PIVO_X - BRACO - 30} ${PIVO_Y} l-24 -16 v32 z M${PIVO_X + BRACO + 30} ${PIVO_Y} l24 -16 v32 z`} fill="url(#b5-lat)" stroke="#1d1b26" stroke-width="5" />
        <circle cx={PIVO_X - BRACO} cy={PIVO_Y} r="14" fill="url(#b5-lat)" stroke="#1d1b26" stroke-width="5" />
        <circle cx={PIVO_X + BRACO} cy={PIVO_Y} r="14" fill="url(#b5-lat)" stroke="#1d1b26" stroke-width="5" />
      </g>
      {/* eixo com o relógio: moldura de madeira com marcas */}
      <circle cx={PIVO_X} cy={PIVO_Y} r="72" fill="url(#b5-mad)" stroke="#1d1b26" stroke-width="7" />
      <path d={`M${PIVO_X} ${PIVO_Y - 64} v10 M${PIVO_X} ${PIVO_Y + 54} v10 M${PIVO_X - 64} ${PIVO_Y} h10 M${PIVO_X + 54} ${PIVO_Y} h10`} stroke="#1d1b26" stroke-width="4" stroke-linecap="round" />
      <circle cx={PIVO_X} cy={PIVO_Y} r="52" fill={segundos !== null && segundos <= 5 ? CORAL : 'url(#b5-mostr)'} stroke="#1d1b26" stroke-width="5" />
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
        <div class="escrever-tv">
          <div class="icone-balanca" aria-hidden="true">⚖️</div>
          <h1 class="pergunta">{t('fEscrever')}</h1>
          <p class="contagem">
            {v.enviaram.length}/{v.participantes.length} ✅
          </p>
          <Estado sala={sala} ids={v.participantes} feitos={v.enviaram} tam={110} />
        </div>
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
        <>
          <h1 class="pergunta">{t('placar')}</h1>
          {v.enviaram.length === 0 && <p class="centro">{t('semDilemas')}</p>}
          <Placar sala={sala} v={v} tv />
        </>
      )}

      {v.fase === 'fim' && (
        <>
          <h1 class="pergunta">{t('fim')}</h1>
          <Placar sala={sala} v={v} tv />
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
