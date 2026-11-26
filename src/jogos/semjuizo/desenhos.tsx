import type { JSX } from 'preact';
import { Avatar } from '../../ui/comuns';

/** desenhos nossos do tribunal: peças dos casos e das sentenças (80×80), peruca, martelo e selo de lacre */

const T = { stroke: '#2b1a10', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const;

const PECAS: Record<string, JSX.Element> = {
  pato: (
    <g {...T}>
      <path d="M14 48q4 22 28 22t26-22q-14 6-24-2-4-24-18-24-12 0-12 13z" fill="#f6c945" />
      <path d="M14 33l-11 5 10 5z" fill="#e8833a" />
      <circle cx="22" cy="32" r="2" fill="#2b1a10" />
    </g>
  ),
  bolo: (
    <g {...T}>
      <path d="M12 42h56v28H12z" fill="#e9a3b5" />
      <path d="M12 42q0-12 28-12t28 12q-6 9-14 2-7 9-14 0-7 9-14 0-8 7-14-2z" fill="#fff4e0" />
      <path d="M40 30V16" />
      <path d="M40 16q-5-5 0-11 5 6 0 11z" fill="#f2a03d" />
    </g>
  ),
  meia: (
    <g {...T}>
      <path d="M28 8h24v32l14 14q8 10-4 15-10 4-20-6L28 48z" fill="#5f8fd0" />
      <path d="M28 18h24M28 28h24" stroke="#fff" />
    </g>
  ),
  gato: (
    <g {...T}>
      <path d="M16 12l12 10h24l12-10v32q0 24-24 24T16 44z" fill="#8d8794" />
      <circle cx="30" cy="40" r="3" fill="#2b1a10" />
      <circle cx="50" cy="40" r="3" fill="#2b1a10" />
      <path d="M36 50h8l-4 4zM40 54q-5 8-10 2M40 54q5 8 10 2M22 50H8M58 50h14" fill="none" />
    </g>
  ),
  controle: (
    <g {...T}>
      <rect x="26" y="6" width="28" height="68" rx="9" fill="#3f4654" />
      <circle cx="40" cy="18" r="5" fill="#e5484d" />
      <path d="M34 34h1M45 34h1M34 45h1M45 45h1M34 56h1M45 56h1" stroke="#fff" stroke-width="6" />
    </g>
  ),
  sofa: (
    <g {...T}>
      <path d="M16 40V24q0-8 8-8h32q8 0 8 8v16z" fill="#b5523b" />
      <path d="M6 38q0-6 7-6t7 8v8h40v-8q0-8 7-8t7 6v26H6z" fill="#cf6a4f" />
      <path d="M14 64v7M66 64v7" />
    </g>
  ),
  coroa: (
    <g {...T}>
      <path d="M10 62l-4-38 18 16L40 14l16 26 18-16-4 38z" fill="#f2c230" />
      <circle cx="40" cy="50" r="5" fill="#b3261e" />
    </g>
  ),
  banana: (
    <g {...T}>
      <path d="M16 10q0 46 48 46l4 8Q10 78 8 14z" fill="#f7d94c" />
      <path d="M8 14l1-8 7 4z" fill="#6b4a1f" />
    </g>
  ),
  queijo: (
    <g {...T}>
      <path d="M6 44L54 16q18 6 20 28z" fill="#ffdf7a" />
      <path d="M6 44h68v24H6z" fill="#f5c542" />
      <circle cx="24" cy="56" r="5" fill="#d99f22" />
      <circle cx="50" cy="58" r="4" fill="#d99f22" />
    </g>
  ),
  pizza: (
    <g {...T}>
      <path d="M8 20q32-16 64 0L40 74z" fill="#f7cf63" />
      <path d="M8 20q32-16 64 0l-4 8q-28-12-56 0z" fill="#c9803a" />
      <circle cx="32" cy="36" r="5" fill="#c53b2c" />
      <circle cx="47" cy="44" r="5" fill="#c53b2c" />
    </g>
  ),
  guardachuva: (
    <g {...T}>
      <path d="M40 12v50q0 10-8 10t-8-8" fill="none" />
      <path d="M6 42q0-32 34-32t34 32q-8-7-17 0-8-7-17 0-9-7-17 0-9-7-17 0z" fill="#7a4fa3" />
    </g>
  ),
  balao: (
    <g {...T}>
      <path d="M40 52q-6 12 2 24" fill="none" />
      <path d="M40 54q-24-12-22-30Q22 4 40 4t22 20q2 18-22 30z" fill="#e5484d" />
      <path d="M28 22q2-8 9-9" stroke="#fff" fill="none" />
    </g>
  ),
  vassoura: (
    <g {...T}>
      <path d="M62 8L38 42" stroke-width="6" />
      <path d="M30 36l18 14-6 22q-18 4-32-12z" fill="#dcae4a" />
      <path d="M28 46l-8 14M36 50l-6 16" fill="none" />
    </g>
  ),
  sorvete: (
    <g {...T}>
      <path d="M24 38h32L40 76z" fill="#d9974f" />
      <circle cx="40" cy="26" r="19" fill="#f3a9bd" />
      <circle cx="40" cy="8" r="5" fill="#c53b2c" />
    </g>
  ),
  despertador: (
    <g {...T}>
      <circle cx="20" cy="18" r="9" fill="#c9a227" />
      <circle cx="60" cy="18" r="9" fill="#c9a227" />
      <path d="M22 64l-6 9M58 64l6 9" />
      <circle cx="40" cy="44" r="27" fill="#fff4e0" />
      <path d="M40 28v16l11 7" fill="none" />
    </g>
  ),
  planta: (
    <g {...T}>
      <path d="M30 54V22q0-12 10-12t10 12v32z" fill="#4f9a52" />
      <path d="M30 40H20q-4 0-4-5v-7M50 34h9q4 0 4-5v-5" fill="none" stroke="#4f9a52" stroke-width="8" />
      <path d="M20 54h40l-5 20H25z" fill="#b5673b" />
    </g>
  ),
  chinelo: (
    <g {...T}>
      <path d="M26 8q20-6 24 14 0 12-2 22 6 26-10 28-18 0-16-28-6-28 4-36z" fill="#3ea7a0" />
      <path d="M36 18L24 40M36 18l14 22" fill="none" stroke="#fff" stroke-width="5" />
    </g>
  ),
  travesseiro: (
    <g {...T}>
      <path d="M8 18q32 8 64 0-6 22 0 44-32-8-64 0 6-22 0-44z" fill="#f4efe4" />
      <path d="M24 32q16 6 32 0" fill="none" stroke="#b9b09c" />
    </g>
  ),
  bicicleta: (
    <g {...T} fill="none">
      <circle cx="18" cy="52" r="15" />
      <circle cx="62" cy="52" r="15" />
      <path d="M18 52l14-24h22l8 24M32 28l10 24H18M42 52l12-24-4-10h9M26 24h12" stroke="#b3261e" />
    </g>
  ),
  ovo: <path {...T} d="M40 6q24 22 24 42t-24 26q-24-6-24-26T40 6z" fill="#fff4e0" />,
};

export const PECAS_CENA = Object.keys(PECAS);

/** o caso ou a sentença em desenho, numa folha do processo */
export function Cena({ cena }: { cena: string[] }) {
  return (
    <svg class="sj-cena" viewBox="0 0 220 120" aria-hidden="true">
      <path d="M4 6h212l-3 108H7z" fill="#f3e3bd" {...T} />
      <path d="M14 104h192" stroke="#c9ac72" stroke-width="4" />
      {cena.map((c, i) => (
        <g key={i} transform={cena.length > 1 ? `translate(${22 + i * 94} 20) rotate(${i ? 6 : -6} 40 40)` : 'translate(66 16) scale(1.1)'}>
          {PECAS[c]}
        </g>
      ))}
    </svg>
  );
}

/** boneco da app de peruca branca */
export function Emperucado({ n, tam }: { n: number; tam: number }) {
  return (
    <span class="sj-perucado" style={{ width: tam, height: tam }}>
      <Avatar n={n} tam={tam} />
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <g fill="#f7f3ea" stroke="#8c8474" stroke-width="2.5">
          <path d="M16 34Q18 0 50 0t34 34q-12-16-34-16T16 34z" />
          {[0, 1, 2].map((i) => (
            <>
              <ellipse cx="12" cy={38 + i * 13} rx="10" ry="7.5" />
              <ellipse cx="88" cy={38 + i * 13} rx="10" ry="7.5" />
            </>
          ))}
        </g>
      </svg>
    </span>
  );
}

/** martelo do tribunal; `tapado` = com selo de lacre por cima */
export function Martelo({ tam = 48, cor = '#8a5a2b', tapado = false }: { tam?: number; cor?: string; tapado?: boolean }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 80 80" aria-hidden="true">
      <g {...T}>
        <path d="M36 36l8-8 32 34-8 8z" fill="#b98045" />
        <path d="M8 30L34 4l18 18-26 26z" fill={cor} />
      </g>
      {tapado && <Lacre />}
    </svg>
  );
}

function Lacre() {
  return (
    <g>
      <path d="M40 18q8-5 14 2 9 1 9 10 6 7 0 14-1 9-10 9-6 7-13 2-9 4-14-3-9-2-8-11-5-7 1-13 1-9 10-9 4-5 11-1z" fill="#a3201b" stroke="#6d1310" stroke-width="3" />
      <circle cx="40" cy="37" r="11" fill="none" stroke="#d4574f" stroke-width="3" />
    </g>
  );
}
