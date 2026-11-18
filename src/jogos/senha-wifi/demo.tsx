import { paramsHash } from '../../core/ids';
import { usarIdioma } from '../../core/i18n';
import type { VistaSala } from '../../core/sala';
import { palavrasWifi } from './conteudo';
import { criptografo, novoWifi, privadoWifi, reduzWifi, respondentes, vistaWifi as vista, type AcaoWifi, type EstadoWifi, type Lado } from './regras';
import { TelemovelWifi } from './telemovel';
import { TvWifi } from './tv';

/** só em dev: `#/demo-wifi?fase=palavras|cripto|resposta|revelar|fim&ecra=tv|tel` (para as capturas) */
const NOMES = ['Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fê'];
const PISTAS = [
  ['milho', 'listras', 'pulo'],
  ['cinema', 'pescoço', 'grade'],
  ['manteiga', 'savana', 'canguru'],
  ['estouro', 'alto', 'mancha'],
];

function estado(fase: string): EstadoWifi {
  const ids = NOMES.map((_, i) => `j${i + 1}`);
  const T = 1_700_000_000_000;
  let e = novoWifi(ids, {}, T, palavrasWifi());
  const ap = (a: AcaoWifi[]) => (e = a.reduce((s, x) => reduzWifi(s, x, T), e));
  if (fase === 'palavras') return ap([{ tipo: 'trocar', id: e.equipas.b[0], i: 1 }, { tipo: 'prontas', id: e.equipas.p[0] }]);
  ap(ids.map((id) => ({ tipo: 'prontas' as const, id })));
  const responder = (certo: boolean, confirmar = true) => {
    const l = e.turno;
    const c = e.codigos[l];
    const nums = certo ? c : [c[1], c[0], c[2]];
    const r = respondentes(e);
    ap(nums.map((num, linha) => ({ tipo: 'resposta' as const, id: r[linha % r.length], linha, num })));
    if (confirmar) ap(r.map((id) => ({ tipo: 'confirmar' as const, id })));
  };
  const ronda = (k: number, falhar?: Lado) => {
    ap((['b', 'p'] as Lado[]).map((l, i) => ({ tipo: 'pistas' as const, id: criptografo(e, l), pistas: PISTAS[(k + i) % PISTAS.length] })));
    for (let t = 0; t < 2; t++) {
      if (e.passo === 'intercetar') responder(false);
      responder(falhar !== e.turno);
      e = reduzWifi(e, { tipo: 'tick' }, e.terminaEm);
    }
  };
  ronda(0);
  ronda(1, 'p');
  if (fase === 'cripto') return e;
  ap((['b', 'p'] as Lado[]).map((l, i) => ({ tipo: 'pistas' as const, id: criptografo(e, l), pistas: PISTAS[(2 + i) % PISTAS.length] })));
  if (fase === 'resposta') {
    // interceção dos Pretos, a meio: 2 linhas escolhidas, 1 confirmação
    const r = respondentes(e);
    const c = e.codigos.b;
    ap([{ tipo: 'resposta', id: r[1], linha: 0, num: c[0] }, { tipo: 'resposta', id: r[2], linha: 1, num: c[1] === 4 ? 2 : 4 }]);
    return e;
  }
  responder(true);
  responder(true);
  if (fase === 'revelar') return e;
  e = reduzWifi(e, { tipo: 'tick' }, e.terminaEm);
  responder(false);
  responder(false);
  e = reduzWifi(e, { tipo: 'tick' }, e.terminaEm);
  return e;
}

export function DemoWifi() {
  const p = paramsHash();
  const fase = p.get('fase') ?? 'cripto';
  usarIdioma('pt-BR');
  const e = { ...estado(fase), terminaEm: Date.now() + 42_000 };
  const sala: VistaSala = {
    codigo: 'ABCD',
    idioma: 'pt-BR',
    jogadores: NOMES.map((nome, i) => ({ id: `j${i + 1}`, nome, avatar: i * 3, ligado: true, desligadoEm: null, pronto: false })),
    vipId: 'j1',
    def: { rondas: 3, escrever: 60, votar: 15, mostrarVotos: true, temas: [] },
    jogo: null,
    defPensa: { rondas: 2, final: true, escrever: 90, votar: 15, mostrarVotos: true },
    pensa: null,
    semTv: p.get('semtv') === '1',
    tutorial: null,
    aliases: {},
  };
  return <Demo e={e} sala={sala} ecra={p.get('ecra') ?? 'tv'} quem={p.get('eu')} zoom={Number(p.get('zoom') ?? 1)} fase={fase} />;
}

function Demo({ e, sala, ecra, quem, zoom, fase }: { e: EstadoWifi; sala: VistaSala; ecra: string; quem: string | null; zoom: number; fase: string }) {
  const v = vista(e);
  const nada = () => {};
  // o Edge headless não desce abaixo de 500 px: o zoom simula um ecrã de 412 px
  if (zoom !== 1) (document.documentElement.style as unknown as { zoom: string }).zoom = String(zoom);
  // por omissão, mostra quem interessa à fase: o Criptógrafo dos Brancos ou quem interceta
  const eu = quem ?? (fase === 'cripto' ? criptografo(e, 'b') : fase === 'resposta' ? respondentes(e)[0] : e.equipas.b[0]);
  return ecra === 'tel' ? <TelemovelWifi sala={sala} v={v} agora={Date.now} eu={eu} privado={privadoWifi(e, eu)} enviar={nada} /> : <TvWifi sala={sala} v={v} agora={Date.now} onOutraVez={nada} onMenu={nada} />;
}
