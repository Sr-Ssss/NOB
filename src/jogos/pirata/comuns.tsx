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

export const SIMBOLO: Record<Papel, string> = { pirata: '☠️', vigia: '🔭', medico: '🩹', artilheiro: '💣', marinheiro: '⚓' };
export const nomePapel = (p: Papel) => t(('prPapel_' + p) as Chave);

export function Topo({ v, agora }: { v: VistaPirata; agora: () => number }) {
  return (
    <div class="topo">
      <span>
        {t('prNome')}
        {v.noite > 0 && ' · ' + t('prNoiteN', { n: v.noite })}
      </span>
      {v.fase !== 'fim' && <Temporizador terminaEm={v.terminaEm} restante={v.restante} agora={agora} />}
    </div>
  );
}

/** noite: barco rabiscado no mar com a lua */
export function Barco({ texto }: { texto: string }) {
  return (
    <div class="pr-noite">
      <svg viewBox="0 0 800 420" class="pr-barco" aria-hidden="true">
        <circle cx="650" cy="90" r="46" fill="#F1EFE8" stroke="#000" stroke-width="5" />
        <circle cx="672" cy="76" r="38" fill="#1a1640" />
        {[120, 260, 420, 520, 740].map((x, i) => (
          <circle key={x} cx={x} cy={40 + (i % 3) * 30} r="3" fill="#F1EFE8" />
        ))}
        <g class="pr-balanco">
          <path d="M250 300 L560 300 L520 350 L290 350 Z" fill="#7a4a24" stroke="#000" stroke-width="6" stroke-linejoin="round" />
          <path d="M405 300 V110" stroke="#000" stroke-width="8" stroke-linecap="round" />
          <path d="M411 122 L500 230 L411 240 Z" fill="#F1EFE8" stroke="#000" stroke-width="5" stroke-linejoin="round" />
          <path d="M399 132 L330 230 L399 236 Z" fill="#e8e2d0" stroke="#000" stroke-width="5" stroke-linejoin="round" />
          <path d="M405 110 L445 98 L405 88 Z" fill="#111" stroke="#000" stroke-width="3" />
          {[320, 380, 440, 500].map((x) => (
            <circle key={x} cx={x} cy="322" r="7" fill="#F0E2A0" stroke="#000" stroke-width="3" />
          ))}
        </g>
        <path d="M0 345 Q50 325 100 345 T200 345 T300 345 T400 345 T500 345 T600 345 T700 345 T800 345 V420 H0 Z" fill="#2c3f7a" stroke="#000" stroke-width="5" />
        <path d="M30 385 q20 -12 40 0 M220 395 q20 -12 40 0 M520 388 q20 -12 40 0 M690 398 q20 -12 40 0" stroke="#8fa8e0" stroke-width="4" fill="none" stroke-linecap="round" />
      </svg>
      <h1 class="pr-narra">{texto}</h1>
    </div>
  );
}

/** amanhecer / disparo: diário de bordo em pergaminho */
export function Diario({ sala, titulo, texto, id, papel }: { sala: VistaSala; titulo: string; texto: string; id: string | null; papel?: Papel | null }) {
  return (
    <div class="pr-diario">
      <div class="pr-rolo" />
      <div class="pr-folha">
        <small>{titulo}</small>
        <h1>{texto}</h1>
        {id && <Avatar n={avatarDe(sala, id)} tam={180} />}
        {id && papel && (
          <p>
            {SIMBOLO[papel]} {t('prEra', { papel: nomePapel(papel) })}
          </p>
        )}
      </div>
      <div class="pr-rolo" />
    </div>
  );
}

/** dia: convés visto de cima com os bonecos; os que saíram ficam esbatidos; `prancha` = quem anda pela prancha */
export function Conves({ sala, v, marcas = {}, prancha = null, compacto = false }: { sala: VistaSala; v: VistaPirata; marcas?: Record<string, string>; prancha?: string | null; compacto?: boolean }) {
  const tam = compacto ? 40 : 120;
  return (
    <div class={'pr-conves' + (compacto ? ' compacto' : '')}>
      <div class="pr-tabuas">
        {v.participantes
          .filter((id) => id !== prancha)
          .map((id) => {
            const fora = !v.vivos.includes(id);
            const f = v.fora.find((x) => x.id === id);
            return (
              <div key={id} class={'pr-tripulante' + (fora ? ' fora' : '')}>
                {marcas[id] && <span class="pr-marca">{marcas[id]}</span>}
                <Avatar n={avatarDe(sala, id)} tam={tam} />
                <span>
                  {f?.papel ? SIMBOLO[f.papel] + ' ' : ''}
                  {nomeDe(sala, id)}
                </span>
              </div>
            );
          })}
      </div>
      <div class="pr-prancha">
        {prancha && (
          <div class="pr-anda">
            <Avatar n={avatarDe(sala, prancha)} tam={tam} />
            <span>{nomeDe(sala, prancha)}</span>
          </div>
        )}
      </div>
      <div class="pr-agua" />
    </div>
  );
}

/** fim: papéis de todos + histórico das noites */
export function Revelacao({ sala, v, compacto = false }: { sala: VistaSala; v: VistaPirata; compacto?: boolean }) {
  const nome = (id: string | null) => (id ? nomeDe(sala, id) : t('prNinguem'));
  return (
    <div class="pr-revela">
      <h2>{v.vencedor === 'piratas' ? '☠️ ' + t('prVencemPiratas') : '⚓ ' + t('prVenceTripulacao')}</h2>
      <div class="pr-papeis">
        {v.participantes.map((id) => (
          <div key={id} class={'pr-papel-j' + (v.vivos.includes(id) ? '' : ' fora') + (v.papeis[id] === 'pirata' ? ' pirata' : '')}>
            <Avatar n={avatarDe(sala, id)} tam={compacto ? 36 : 72} />
            <span>{nomeDe(sala, id)}</span>
            <b>
              {v.papeis[id] && SIMBOLO[v.papeis[id]]} {v.papeis[id] && nomePapel(v.papeis[id])}
            </b>
          </div>
        ))}
      </div>
      {v.historico.length > 0 && (
        <div class="pr-hist">
          <b>{t('prHistorico')}</b>
          {v.historico.map((h) => (
            <div key={h.n}>{t('prHistNoite', { n: h.n, alvo: nome(h.alvo), salvo: h.salvo ? t('prSalvo') : '', vigia: nome(h.vigia), medico: nome(h.medico) })}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlacarPirata({ sala, v, tam = 48 }: { sala: VistaSala; v: VistaPirata; tam?: number }) {
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

/** o palco da TV (também o "Painel" sem TV) */
export function Palco({ sala, v, compacto = false }: { sala: VistaSala; v: VistaPirata; compacto?: boolean }) {
  const txt = narracao(sala, v);
  if (v.fase === 'carta' || v.fase === 'noite') return <Barco texto={txt} />;
  if (v.fase === 'amanhecer') {
    const f = v.fora.find((x) => x.id === v.vitima);
    return <Diario sala={sala} titulo={t('prDiario', { n: v.noite })} texto={txt} id={v.vitima} papel={f?.papel} />;
  }
  if (v.fase === 'disparo') {
    const id = v.artilheiro?.levou ?? null;
    return <Diario sala={sala} titulo={t('prDiario', { n: v.noite })} texto={txt} id={id} papel={v.fora.find((x) => x.id === id)?.papel} />;
  }
  const marcas: Record<string, string> = {};
  if (v.fase === 'votar') v.votaram.forEach((id) => (marcas[id] = '✅'));
  if (v.fase === 'resultado') Object.entries(v.contagem).forEach(([id, n]) => id && (marcas[id] = String(n)));
  if (v.fase === 'artilheiro' && v.artilheiro) marcas[v.artilheiro.id] = '💣';
  return (
    <div class="pr-dia">
      <h1 class="pr-narra">{txt}</h1>
      <Conves sala={sala} v={v} marcas={marcas} prancha={v.fase === 'resultado' ? v.expulso : null} compacto={compacto} />
      {v.fase === 'resultado' && v.contagem[''] ? <p class="centro">{t('prNinguem')}: {v.contagem['']}</p> : null}
    </div>
  );
}
