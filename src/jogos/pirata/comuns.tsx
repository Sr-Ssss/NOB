import type { ComponentChildren } from 'preact';
import type { VistaSala } from '../../core/sala';
import { t, type Chave } from '../../core/i18n';
import { Avatar, Temporizador } from '../../ui/comuns';
import { avatarDe, nomeDe } from '../5050/tv';
import type { Papel, VistaPirata } from './regras';
import './pirata.css';

export interface PropsPirata {
  sala: VistaSala;
  v: VistaPirata;
  agora: () => number;
}

/* Design de 27/11 (info/jogos/pirata-a-bordo.md → "Design novo"; maquetes em prints-montra/proposta-pirata-*.html):
   parede de tábuas da cabine, cada jogador é um cartaz "PROCURADO"; vigia redonda, lanterna e tabuleta pendurada. */
export const SIMBOLO: Record<Papel, string> = { pirata: '☠️', vigia: '🔭', medico: '🩹', artilheiro: '💣', marinheiro: '⚓' };
export const nomePapel = (p: Papel) => t(('prPapel_' + p) as Chave);

function aleatorio(semente: number) {
  let s = semente;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** parede de tábuas (gerada uma vez; à noite escurece por CSS) */
function tabuasSvg(): string {
  const rnd = aleatorio(11);
  let c = '';
  for (let k = 0; k * 60 < 720; k++) {
    const y = k * 60;
    c += `<rect y="${y}" width="1280" height="60" fill="${k % 2 ? '#6e4524' : '#7a4e2a'}"/><line x1="0" y1="${y}" x2="1280" y2="${y}" stroke="#2a1608" stroke-width="3"/>`;
    for (let x = ((k * 173) % 260) + 60; x < 1280; x += 300 + ((k * 37) % 120))
      c += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 60}" stroke="#2a1608" stroke-width="3"/><circle cx="${x - 10}" cy="${y + 8}" r="2.5" fill="#2a1608"/><circle cx="${x + 10}" cy="${y + 8}" r="2.5" fill="#2a1608"/>`;
    for (let i = 0; i < 14; i++) c += `<path d="M${(rnd() * 1280).toFixed(0)} ${(y + 6 + rnd() * 48).toFixed(0)} h${(30 + rnd() * 60).toFixed(0)}" stroke="#000" stroke-width="1.5" opacity=".18"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="none">${c}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
let tabuas: string | null = null;
export const TABUAS = () => (tabuas ??= tabuasSvg());

/** vigia (janela redonda de latão): mar de dia com um barco; à noite lua e estrelas */
export function Vigia({ noite = false }: { noite?: boolean }) {
  const id = noite ? 'prvn' : 'prvd';
  return (
    <svg class="pr-vigia" viewBox="-100 -100 200 200" aria-hidden="true">
      <defs>
        <linearGradient id={id + 'c'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color={noite ? '#0b0d2e' : '#8fc6ec'} />
          <stop offset="1" stop-color={noite ? '#2a2f6a' : '#e8f4fb'} />
        </linearGradient>
        <linearGradient id={id + 'l'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f3d27a" />
          <stop offset=".5" stop-color="#b8862e" />
          <stop offset="1" stop-color="#7a5518" />
        </linearGradient>
        <clipPath id={id + 'r'}>
          <circle r="84" />
        </clipPath>
      </defs>
      <g clip-path={`url(#${id}r)`}>
        <rect x="-90" y="-90" width="180" height="180" fill={`url(#${id}c)`} />
        {noite ? (
          <>
            {[[-50, -40], [-20, -60], [10, -30], [-60, -10], [40, -10], [-30, -20]].map(([x, y]) => (
              <circle key={x + ':' + y} cx={x} cy={y} r="1.8" fill="#fff" />
            ))}
            <circle cx="35" cy="-40" r="20" fill="#f6eed2" stroke="#000" stroke-width="3" />
            <circle cx="44" cy="-46" r="17" fill="#141844" />
          </>
        ) : (
          <>
            <path d="M-50 -50 q6 -6 12 0 q6 -6 12 0" stroke="#333" stroke-width="2.5" fill="none" />
            {/* o barco assenta na água: o casco fica um pouco por baixo das ondas (desenhadas a seguir) */}
            <g transform="translate(0 28)">
              <g class="pr-barquinho">
                <path d="M10 -18 l30 0 l-12 -40Z" fill="#fff" stroke="#000" stroke-width="2" />
                <path d="M5 -16 h42 l-6 10 h-30Z" fill="#7a4e2a" stroke="#000" stroke-width="2" />
              </g>
            </g>
          </>
        )}
        <path d="M-90 20 q12 -9 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 V90 H-90Z" fill={noite ? '#1c3a66' : '#2f6fa8'} />
      </g>
      <circle r="84" fill="none" stroke="#000" stroke-width="30" />
      <circle r="84" fill="none" stroke={`url(#${id}l)`} stroke-width="22" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <circle key={i} cx={Math.cos((i * Math.PI) / 4) * 84} cy={Math.sin((i * Math.PI) / 4) * 84} r="5" fill="#4a3210" stroke="#000" stroke-width="2" />
      ))}
    </svg>
  );
}

/** lanterna pendurada (a luz à volta é CSS) */
export function Lanterna() {
  return (
    <div class="pr-lanterna" aria-hidden="true">
      <svg viewBox="0 0 100 170">
        <line x1="50" y1="0" x2="50" y2="30" stroke="#000" stroke-width="5" />
        <path d="M10 50 h80 l-10 -20 h-60Z" fill="#3a2a1a" stroke="#000" stroke-width="5" />
        <rect x="15" y="50" width="70" height="100" rx="10" fill="#ffd98a" stroke="#000" stroke-width="6" />
        <path class="pr-chama" d="M50 72 q20 30 0 60 q-20 -30 0 -60Z" fill="#ff9a3c" stroke="#c0501c" stroke-width="3" />
        <line x1="50" y1="50" x2="50" y2="150" stroke="#3a2a1a" stroke-width="5" />
        <path d="M5 150 h90 l-12 18 h-66Z" fill="#3a2a1a" stroke="#000" stroke-width="5" />
      </svg>
    </div>
  );
}

/** tabuleta de madeira pendurada com o texto grande; o tempo vai num lacre ao lado */
export function Tabuleta({ texto, v, agora }: { texto: string; v?: VistaPirata; agora?: () => number }) {
  return (
    <div class="pr-tabuleta">
      <h1>{texto}</h1>
      {v && agora && v.fase !== 'fim' && (
        <span class="pr-lacre-tempo">
          <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />
        </span>
      )}
    </div>
  );
}

/** fita com o papel (revelação) */
export function Fita({ papel }: { papel: Papel }) {
  return (
    <span class={'pr-fita ' + papel}>
      {SIMBOLO[papel]} {nomePapel(papel)}
    </span>
  );
}

/** cartaz "PROCURADO": boneco + nome; `marca` = lacre (✓, nº de votos, 💣); `fora` = carimbo "AO MAR" */
export function Cartaz({ sala, id, k = 0, marca, fora = false, papel }: { sala: VistaSala; id: string; k?: number; marca?: string; fora?: boolean; papel?: Papel | null }) {
  return (
    <div class={'pr-cartaz' + (fora ? ' fora' : '')} style={{ '--rot': [-3, 2, -1.5, 3, 2.5, -2, 3, -2.5][k % 8] + 'deg' }}>
      <span class="pr-prego" />
      <div class="pr-papel">
        <small>{t('prProcurado')}</small>
        <Avatar n={avatarDe(sala, id)} tam={110} />
        <b>{nomeDe(sala, id)}</b>
      </div>
      {fora && !papel && <span class="pr-carimbo">{t('prAoMar')}</span>}
      {marca && <span class="pr-lacre">{marca}</span>}
      {papel && <Fita papel={papel} />}
    </div>
  );
}

/** grelha de cartazes; o tamanho de cada um vem do nº de jogadores */
export function Cartazes({ n, children, compacto = false }: { n: number; children: ComponentChildren; compacto?: boolean }) {
  const filas = compacto ? Math.ceil(n / 4) : n <= 5 ? 1 : n <= 10 ? 2 : 3;
  const cols = Math.ceil(n / filas);
  return (
    <div class="pr-cartazes" style={{ '--filas': filas, '--cols': cols }}>
      {children}
    </div>
  );
}

/** página do diário de bordo pregada (amanhecer / disparo) */
export function Diario({ sala, titulo, texto, id, papel }: { sala: VistaSala; titulo: string; texto: string; id: string | null; papel?: Papel | null }) {
  return (
    <div class="pr-diario">
      <span class="pr-prego" />
      <small>{titulo}</small>
      {id && <Avatar n={avatarDe(sala, id)} tam={160} />}
      <h1>{texto}</h1>
      {id && papel && <Fita papel={papel} />}
      {id && <span class="pr-ondas" />}
    </div>
  );
}

/** histórico das noites num papel ("Diário de bordo") */
export function Historico({ sala, v }: { sala: VistaSala; v: VistaPirata }) {
  const nome = (id: string | null) => (id ? nomeDe(sala, id) : t('prNinguem'));
  if (!v.historico.length) return null;
  return (
    <div class="pr-hist">
      <b>{t('prDiarioTit')}</b>
      {v.historico.map((h) => (
        <div key={h.n}>{t('prHistNoite', { n: h.n, alvo: nome(h.alvo), salvo: h.salvo ? t('prSalvo') : '', vigia: nome(h.vigia), medico: nome(h.medico) })}</div>
      ))}
    </div>
  );
}

/** fim: cartazes de todos com a fita do papel (+ histórico) */
export function Revelacao({ sala, v, compacto = false }: { sala: VistaSala; v: VistaPirata; compacto?: boolean }) {
  return (
    <div class={'pr-revela' + (compacto ? ' compacto' : '')}>
      {compacto && <h2>{v.vencedor === 'piratas' ? '☠️ ' + t('prVencemPiratas') : '⚓ ' + t('prVenceTripulacao')}</h2>}
      <Cartazes n={v.participantes.length} compacto={compacto}>
        {v.participantes.map((id, k) => (
          <Cartaz key={id} sala={sala} id={id} k={k} fora={!v.vivos.includes(id)} papel={v.papeis[id]} />
        ))}
      </Cartazes>
      {compacto && <Historico sala={sala} v={v} />}
    </div>
  );
}

/** o texto grande da TV (também lido em voz alta) */
export function narracao(sala: VistaSala, v: VistaPirata): string {
  const nome = (id: string) => nomeDe(sala, id);
  switch (v.fase) {
    case 'carta':
      return t('prCartaTv');
    case 'noite':
      return t('prNoiteTv');
    case 'amanhecer':
      return v.vitima ? t('prFoiAtirado', { nome: nome(v.vitima) }) : t('prNinguemAtirado');
    case 'artilheiro':
      return v.artilheiro ? t('prArtilheiroTv', { nome: nome(v.artilheiro.id) }) : '';
    case 'disparo':
      return v.artilheiro?.levou ? t('prDisparo', { nome: nome(v.artilheiro.levou) }) : t('prDisparoNada');
    case 'discussao':
      return t('prDiscussaoTv');
    case 'votar':
      return t('prVotarTv');
    case 'resultado':
      return v.expulso ? t('prResultadoTv', { nome: nome(v.expulso) }) : t('prNinguemSai');
    case 'fim':
      return v.vencedor === 'piratas' ? t('prVencemPiratas') : t('prVenceTripulacao');
  }
}

/** a parede com os cartazes da tripulação (marcas da fase atual) */
function Tripulacao({ sala, v, compacto }: { sala: VistaSala; v: VistaPirata; compacto: boolean }) {
  const marcas: Record<string, string> = {};
  if (v.fase === 'votar') v.votaram.forEach((id) => (marcas[id] = '✓'));
  if (v.fase === 'resultado') Object.entries(v.contagem).forEach(([id, n]) => id && (marcas[id] = String(n)));
  if (v.fase === 'artilheiro' && v.artilheiro) marcas[v.artilheiro.id] = '💣';
  return (
    <Cartazes n={v.participantes.length} compacto={compacto}>
      {v.participantes.map((id, k) => (
        <Cartaz key={id} sala={sala} id={id} k={k} marca={marcas[id]} fora={!v.vivos.includes(id)} papel={v.fora.find((x) => x.id === id)?.papel} />
      ))}
    </Cartazes>
  );
}

/** o palco da TV (também o "Painel" sem TV, `compacto`) */
export function Palco({ sala, v, agora, compacto = false }: { sala: VistaSala; v: VistaPirata; agora?: () => number; compacto?: boolean }) {
  const txt = narracao(sala, v);
  const noite = v.fase === 'carta' || v.fase === 'noite';
  const diario = v.fase === 'amanhecer' || v.fase === 'disparo';
  const idDiario = v.fase === 'amanhecer' ? v.vitima : (v.artilheiro?.levou ?? null);
  return (
    <div class={'pr-cabine' + (noite ? ' noite' : '') + (compacto ? ' compacto' : '')} style={{ backgroundImage: TABUAS() }}>
      {!compacto && <Tabuleta texto={v.fase === 'amanhecer' ? t('prAmanhecer') : v.fase === 'disparo' ? SIMBOLO.artilheiro + ' ' + nomePapel('artilheiro') : txt} v={v} agora={agora} />}
      {compacto && !diario && <h2 class="pr-narra">{txt}</h2>}
      <div class="pr-parede">
        {!compacto && <Vigia noite={noite} />}
        <Tripulacao sala={sala} v={v} compacto={compacto} />
        {!compacto && <Lanterna />}
      </div>
      {diario && (
        <div class="pr-sobre">
          <Diario sala={sala} titulo={t('prDiario', { n: v.noite })} texto={txt} id={idDiario} papel={v.fora.find((x) => x.id === idDiario)?.papel} />
        </div>
      )}
      {v.fase === 'resultado' && v.contagem[''] ? (
        <p class="pr-ninguem">
          {t('prNinguem')}: {v.contagem['']}
        </p>
      ) : null}
    </div>
  );
}
