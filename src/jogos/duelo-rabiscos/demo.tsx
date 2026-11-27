import { useEffect, useState } from 'preact/hooks';
import { paramsHash } from '../../core/ids';
import { usarIdioma } from '../../core/i18n';
import type { VistaSala } from '../../core/sala';
import { MAGOS_PODERES, exercitosProntos, type Criatura, type RoupaMago } from './criaturas';
import { DefinicoesDuelo } from './definicoes';
import { jogadaBot } from './bot';
import { DEF_PADRAO_DUELO, desenhosDuelo, livre, novoDuelo, podeComprar, privadoDuelo, reduzDuelo, vistaDuelo, type AcaoDuelo, type EstadoDuelo } from './regras';
import { TelemovelDuelo } from './telemovel';
import { TvDuelo } from './tv';
import { GaleriaEstruturas } from './galeria';
import { vizinhas, type Obstaculos } from './tabuleiro';

/**
 * Só em dev: `#/demo-duelo?fase=mago|exercito|desenhar|rodar|vez|batalha|lobo|fim&ecra=tv|tel[&n=2..4][&avatar=0..17][&semtv=1][&opcoes=1][&obst=nenhum|poucos|muitos]`.
 * `roupa=trovoada|lencol|…` escolhe o teu mago; `gemas=7` dá gemas; `ritmo=ms` muda a espera entre jogadas dos outros.
 * No telemóvel joga-se mesmo (j1); os outros jogam sozinhos. Na TV, da batalha em diante, jogam todos sozinhos.
 */
const NOMES = ['Ana', 'Beto', 'Caio', 'Duda'];

/** os outros fazem a sua parte da fase */
function outros(e: EstadoDuelo, agora: number): EstadoDuelo {
  for (const id of e.participantes.slice(1)) {
    const m = e.magos[id];
    let a: AcaoDuelo | null = null;
    if (e.fase === 'mago' && !m.roupa) {
      const usadas = e.participantes.map((x) => e.magos[x].roupa);
      a = { tipo: 'dr_mago', id, roupa: (Object.keys(MAGOS_PODERES) as RoupaMago[]).reverse().find((r) => !usadas.includes(r))! };
    } else if (e.fase === 'exercito' && !m.exercito) a = { tipo: 'dr_exercito', id, exercito: exercitosProntos(e.def.tinta)[1] };
    else if (e.fase === 'desenhar' && !e.acabaram.includes(id)) a = { tipo: 'dr_desenho', id, criatura: Object.keys(m.exercito!)[0] as Criatura, tracos: [], pronto: true };
    if (a) e = reduzDuelo(e, a, agora);
  }
  return e;
}

/** uma jogada da batalha (bot) de quem não está no telemóvel */
function jogarOutros(e: EstadoDuelo, agora: number, todos: boolean): EstadoDuelo {
  for (const id of todos ? e.participantes : e.participantes.slice(1)) {
    const a = jogadaBot(vistaDuelo(e), id);
    const novo = a ? reduzDuelo(e, a, agora) : e;
    if (novo !== e) return novo;
  }
  return e;
}

/** joga sozinho até à fase pedida (e até ser a altura do j1) */
function avancar(e: EstadoDuelo, fase: string, agora: number): EstadoDuelo {
  const minha = () =>
    e.fase === fase &&
    (fase === 'rodar' || fase === 'fim' || (fase === 'vez' && e.vez === 'j1') || (fase === 'batalha' && podeComprar(e, 'j1')) || (fase === 'lobo' && e.criaturas.some((c) => c.id === e.lobo && c.dono === 'j1')));
  for (let i = 0; i < 3_000 && !minha() && e.fase !== 'fim'; i++) e = jogarOutros(e, agora, true);
  return e;
}

/** um rabisco qualquer, para ver desenhos na colmeia */
const RABISCO = [
  { c: 2, g: 1, p: [120, 80, 280, 80, 300, 200, 200, 260, 100, 200, 120, 80] },
  { c: 1, g: 1, p: [160, 130, 165, 130] },
  { c: 1, g: 1, p: [240, 130, 245, 130] },
  { c: 0, g: 0, p: [150, 190, 200, 220, 250, 190] },
];

function inicio(fase: string, n: number, roupa: RoupaMago, gemas: number): EstadoDuelo {
  const agora = Date.now();
  let e = novoDuelo(NOMES.slice(0, n).map((_, i) => `j${i + 1}`), { obstaculos: (paramsHash().get('obst') ?? undefined) as Obstaculos | undefined }, agora);
  if (fase === 'mago') return outros(e, agora);
  e = reduzDuelo(e, { tipo: 'dr_mago', id: 'j1', roupa }, agora);
  e = outros(e, agora);
  if (fase === 'exercito') return outros(e, agora);
  e = reduzDuelo(outros(e, agora), { tipo: 'dr_exercito', id: 'j1', exercito: exercitosProntos(e.def.tinta)[fase === 'lobo' ? 2 : 0] }, agora);
  e = outros(e, agora);
  if (fase === 'desenhar') return e;
  const criatura = Object.keys(e.magos.j1.exercito!)[0] as Criatura;
  e = reduzDuelo(e, { tipo: 'dr_desenho', id: 'j1', criatura, tracos: RABISCO, pronto: true }, agora);
  if (gemas) for (const id of e.participantes) e.magos[id].gemas = gemas;
  e = avancar(e, fase, agora);
  // colado=1: uma criatura tua já ao lado de um inimigo (para ver a luta sem dado)
  if (paramsHash().get('colado')) {
    const minha = e.criaturas.find((c) => c.dono === 'j1');
    const inimiga = e.criaturas.find((c) => c.dono !== 'j1');
    const casa = inimiga && vizinhas(inimiga.casa).find((x) => livre(e, x));
    if (minha && casa) minha.casa = casa;
  }
  return e;
}

export function DemoDuelo() {
  const p = paramsHash();
  usarIdioma('pt-BR');
  const n = Number(p.get('n') ?? 2);
  const avatar = Number(p.get('avatar') ?? 0);
  const [e, setE] = useState(() => inicio(p.get('fase') ?? 'mago', n, (p.get('roupa') as RoupaMago | null) ?? 'trovoada', Number(p.get('gemas') ?? 0)));
  const tel = p.get('ecra') === 'tel';
  const [def, setDef] = useState(DEF_PADRAO_DUELO);
  const agir = (a: AcaoDuelo) => setE((x) => outros(reduzDuelo(x, a, Date.now()), Date.now()));
  useEffect(() => {
    const i = setInterval(() => agir({ tipo: 'tick' }), 500);
    const k = setInterval(() => setE((x) => jogarOutros(x, Date.now(), !tel)), Number(p.get('ritmo') ?? 2_000));
    return () => {
      clearInterval(i);
      clearInterval(k);
    };
  }, []);
  if (p.get('galeria')) return <GaleriaEstruturas />;
  if (p.get('opcoes'))
    return (
      <div class="pag">
        <div class="cartao">
          <DefinicoesDuelo def={def} mudar={(d) => setDef({ ...def, ...d })} />
        </div>
      </div>
    );
  const sala: VistaSala = {
    codigo: 'ABCD',
    idioma: 'pt-BR',
    jogadores: NOMES.slice(0, n).map((nome, i) => ({ id: `j${i + 1}`, nome, avatar: (avatar + i * 5) % 18, ligado: true, desligadoEm: null, pronto: false })),
    vipId: 'j1',
    semTv: p.get('semtv') === '1',
    tutorial: null,
    aliases: {},
  } as unknown as VistaSala;
  const v = vistaDuelo(e);
  const deNovo = () => setE(inicio('mago', n, 'trovoada', 0));
  if (!tel) return <TvDuelo sala={sala} v={v} agora={Date.now} desenhos={desenhosDuelo(e)} onOutraVez={deNovo} onMenu={deNovo} />;
  return <TelemovelDuelo sala={sala} v={v} agora={Date.now} eu="j1" privado={privadoDuelo(e)} enviar={(a) => (a.tipo === 'jogo' ? agir({ ...a.acao, id: 'j1' } as unknown as AcaoDuelo) : deNovo())} />;
}