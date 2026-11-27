import { useMemo, useState } from 'preact/hooks';
import { usarIdioma } from '../core/i18n';
import { paramsHash } from '../core/ids';
import { LISTA, jogoEmCurso } from '../core/registo';
import { minhaMarca, novaSala, privadoSala, reduzSala, vistaSala, type AcaoSala, type EstadoSala } from '../core/sala';
import { COM_ECRAS, emCurso } from '../jogos/ecras';

/**
 * Só em dev: `#/montra?jogo=pensa&n=6&semtv=0`. Joga o jogo sozinho com bots (o mesmo motor de src/core/ia.test.ts)
 * e guarda cada fase (entrada e fim, até 2 vezes cada); mostra a TV e 3 telemóveis (o líder parado + 2 bots).
 * Para ver os ecrãs todos sem jogar e sem gastar tokens: o utilizador abre e navega sozinho.
 */
interface Foto {
  rotulo: string;
  s: EstadoSala;
  t: number;
}

const TAGS: Record<string, string> = { eu: 'te' };

function simular(jogo: string, n: number, semTv: boolean): Foto[] {
  const r = (s: EstadoSala, a: AcaoSala, t: number) => reduzSala(s, a, t);
  let s = r(novaSala('ABCD', 'pt-BR'), { tipo: 'entrar', id: 'eu', nome: 'Eu', avatar: 0, tag: 'te' }, 100);
  for (let i = 1; i < n; i++) {
    TAGS[`bot-${i}`] = `tb${i}`;
    s = r(s, { tipo: 'bot_add', id: 'eu', bot: `bot-${i}`, tag: `tb${i}` }, 100);
  }
  if (semTv) s = { ...s, semTv: true };
  s = r(s, { tipo: 'comecar', id: 'eu', jogo } as AcaoSala, 1000);
  // o que só o líder humano faz (como em ia.test.ts)
  const lider = (a: object) => (s = r(s, { tipo: 'jogo', acao: { ...a, id: 'eu' } } as AcaoSala, 1000));
  if (jogo === 'wifi') lider({ tipo: 'fechar_equipas' });
  if (jogo === 'rei') for (let k = 0; k < 2; k++) lider({ tipo: 'rd_avancar' });
  if (jogo === 'maquinas') lider({ tipo: 'rm_vi' });
  if (jogo === 'mona') lider({ tipo: 'ml_desenho', tracos: [{ c: 0, g: 0, p: [1, 1, 5, 5] }] });

  const fotos: Foto[] = [];
  const vezes: Record<string, number> = {};
  let chave = '';
  let ultimo: Foto | null = null;
  const nome = (s: EstadoSala) => {
    const g = jogoEmCurso(s)?.g as { fase: string; ronda?: number; atual?: number } | undefined;
    if (!g) return '';
    return [g.fase, g.ronda != null ? `ronda ${g.ronda}` : '', g.atual != null ? `#${g.atual + 1}` : ''].filter(Boolean).join(' · ');
  };
  const guardar = (f: Foto | null, fim: boolean) => {
    if (!f) return;
    const fase = (jogoEmCurso(f.s)?.g.fase ?? '') + (fim ? '/fim' : '');
    vezes[fase] = (vezes[fase] ?? 0) + 1;
    if (vezes[fase] <= 2 || fase.startsWith('fim')) fotos.push({ ...f, rotulo: f.rotulo + (fim ? ' (fim)' : '') });
  };
  for (let t = 1000; t < 5_400_000; t += 250) {
    s = r(s, { tipo: 'tick' }, t);
    const k = nome(s);
    if (!k) continue;
    if (k !== chave) {
      if (ultimo && ultimo.s !== fotos[fotos.length - 1]?.s) guardar(ultimo, true);
      chave = k;
      guardar({ rotulo: k, s, t }, false);
    }
    ultimo = { rotulo: k, s, t };
    if (jogoEmCurso(s)?.g.fase === 'fim') break;
  }
  return fotos;
}

const nada = () => {};

export function Montra() {
  usarIdioma('pt-BR');
  const p = paramsHash();
  const [jogo, setJogo] = useState(p.get('jogo') ?? 'pensa');
  const def = LISTA.find((j) => j.id === jogo);
  const [n, setN] = useState(Number(p.get('n')) || 6);
  const [semTv, setSemTv] = useState(p.get('semtv') === '1');
  const [i, setI] = useState(0);
  const [k, setK] = useState(0.45);
  const nn = Math.max(def?.min ?? 3, Math.min(def?.max ?? 16, n));
  const fotos = useMemo(() => {
    try {
      return simular(jogo, nn, semTv);
    } catch (e) {
      console.error(e);
      return [];
    }
  }, [jogo, nn, semTv]);
  const f = fotos[Math.min(i, fotos.length - 1)];
  const ecras = COM_ECRAS.find((j) => j.id === jogo)?.e;

  const barra = (
    <div class="montra-barra">
      <select value={jogo} onChange={(e) => (setJogo(e.currentTarget.value), setI(0))}>
        {LISTA.map((j) => (
          <option key={j.id} value={j.id}>
            {j.id}
          </option>
        ))}
      </select>
      <label>
        👥 <input type="number" min={def?.min} max={def?.max ?? 16} value={nn} onChange={(e) => (setN(Number(e.currentTarget.value)), setI(0))} style={{ width: 60 }} />
      </label>
      <label>
        <input type="checkbox" checked={semTv} onChange={(e) => (setSemTv(e.currentTarget.checked), setI(0))} /> sem TV
      </label>
      <label>
        🔍 <input type="range" min={0.25} max={1} step={0.05} value={k} onInput={(e) => setK(Number(e.currentTarget.value))} />
      </label>
      <button onClick={() => setI(Math.max(0, i - 1))}>◀</button>
      <button onClick={() => setI(Math.min(fotos.length - 1, i + 1))}>▶</button>
      <span>
        {fotos.length ? i + 1 : 0}/{fotos.length}
      </span>
    </div>
  );

  if (!f || !ecras) return <div class="montra">{barra}<p>Sem fases (ver a consola).</p></div>;
  const vista = vistaSala(f.s);
  const v = emCurso(vista)?.g;
  const g = jogoEmCurso(f.s)?.g;
  const agora = () => f.t;
  const ids = ['eu', ...f.s.jogadores.filter((j) => j.bot).slice(0, 2).map((j) => j.id)];
  const kTel = Math.min(1, k * 1.6);

  return (
    <div class="montra">
      {barra}
      <div class="montra-fases">
        {fotos.map((x, j) => (
          <button key={j} class={j === i ? 'foco' : ''} onClick={() => setI(j)}>
            {x.rotulo}
          </button>
        ))}
      </div>
      <div class="montra-ecras" key={`${jogo}-${nn}-${semTv}-${i}`}>
        {!semTv && (
          <figure style={{ width: 1920 * k, height: 1080 * k }}>
            <div class="montra-tv" style={{ transform: `scale(${k})` }}>
              {ecras.tv({ g, v, sala: vista, agora, selFim: 0, onOutraVez: nada, onMenu: nada, acao: nada })}
              <div class="rodape-codigo tv">{vista.codigo}</div>
            </div>
            <figcaption>TV</figcaption>
          </figure>
        )}
        {ids.map((id) => (
          <figure key={id} style={{ width: 412 * kTel, height: 915 * kTel }}>
            <div class="montra-tel" style={{ transform: `scale(${kTel})` }}>
              {ecras.telemovel({ v, sala: vista, agora, eu: id, marca: () => minhaMarca(vista, TAGS[id] ?? ''), privado: privadoSala(f.s, id), enviar: nada })}
              <div class="rodape-codigo">{vista.codigo}</div>
            </div>
            <figcaption>{id === 'eu' ? 'líder (parado)' : id}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
