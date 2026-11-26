/**
 * Ecrãs de cada jogo do registo (src/core/registo.ts): TV, telemóvel e opções do líder.
 * Está à parte do registo para a sala (lógica pura) não carregar a UI. O tipo de `ECRAS`
 * obriga a uma entrada por jogo registado, com os tipos certos desse jogo.
 */
import type { JSX } from 'preact';
import { t } from '../core/i18n';
import { LISTA, type DefDe, type EstadoDe, type Registado, type VistaDe } from '../core/registo';
import type { AcaoSala, VistaSala } from '../core/sala';
import { Tv5050 } from './5050/tv';
import { Telemovel5050 } from './5050/telemovel';
import { Definicoes5050 } from './5050/definicoes';
import { TvPensa } from './pensa-dores/tv';
import { TelemovelPensa } from './pensa-dores/telemovel';
import { DefinicoesPensa } from './pensa-dores/definicoes';
import { TvWifi } from './senha-wifi/tv';
import { TelemovelWifi } from './senha-wifi/telemovel';
import { DefinicoesWifi } from './senha-wifi/definicoes';
import type { PrivadoWifi } from './senha-wifi/regras';
import { TvSevira } from './se-vira/tv';
import { TelemovelSevira } from './se-vira/telemovel';
import { DefinicoesSevira } from './se-vira/definicoes';
import { extraTv, type PrivadoSevira } from './se-vira/regras';
import { TvMona } from './mona-lixa/tv';
import { TelemovelMona } from './mona-lixa/telemovel';
import { DefinicoesMona } from './mona-lixa/definicoes';
import { TvIdeias } from './ideias-mirabolantes/tv';
import { TelemovelIdeias } from './ideias-mirabolantes/telemovel';
import { DefinicoesIdeias } from './ideias-mirabolantes/definicoes';
import { TvPirata } from './pirata/tv';
import { TelemovelPirata } from './pirata/telemovel';
import { DefinicoesPirata } from './pirata/definicoes';
import type { PrivadoPirata } from './pirata/regras';
import { TvMaquinas } from './revolucao-maquinas/tv';
import { TelemovelMaquinas } from './revolucao-maquinas/telemovel';
import { DefinicoesMaquinas } from './revolucao-maquinas/definicoes';
import type { PrivadoMaquinas } from './revolucao-maquinas/regras';
import { TvRei } from './rei-dragao/tv';
import { TelemovelRei } from './rei-dragao/telemovel';
import { DefinicoesRei } from './rei-dragao/definicoes';
import type { PrivadoRei } from './rei-dragao/regras';
import { TvSemJuizo } from './semjuizo/tv';
import { TelemovelSemJuizo } from './semjuizo/telemovel';
import { DefinicoesSemJuizo } from './semjuizo/definicoes';
import { fotosMesa, type PrivadoSemJuizo } from './semjuizo/regras';
import { MotorRagerob,TvRagerob } from './ragerob/tv';
import { TelemovelRagerob } from './ragerob/telemovel';
import { DefinicoesRagerob } from './ragerob/definicoes';
import { TvDuelo } from './duelo-rabiscos/tv';
import { TelemovelDuelo } from './duelo-rabiscos/telemovel';
import { DefinicoesDuelo } from './duelo-rabiscos/definicoes';
import { PREPARACAO, desenhosDuelo, type Desenhos } from './duelo-rabiscos/regras';
import { TXT as TXT_DUELO } from './duelo-rabiscos/textos';

/** `g`: o estado do jogo (só a TV, que é o host, o tem) */
export type PropsTv<G, V> = {
  g: G;
  v: V;
  sala: VistaSala;
  agora: () => number;
  selFim: number;
  onOutraVez: () => void;
  onMenu: () => void;
  /** a TV também manda ações (ex.: o Ragerob, cuja física corre na TV, manda o fim do combate) */
  acao?: (a: AcaoSala) => void;
};
/** `marca()`: a marca "és tu" deste telemóvel; `privado`: o que chegou pelo canal privado */
export type PropsTel<V> = { v: V; sala: VistaSala; agora: () => number; eu: string; marca: () => string; privado: unknown; enviar: (a: AcaoSala) => void };
export type PropsOpcoes<D> = { def: D; sala: VistaSala; n: number; mudar: (d: Partial<D>) => void };

export interface Ecras<G, V, D> {
  tv(p: PropsTv<G, V>): JSX.Element;
  telemovel(p: PropsTel<V>): JSX.Element;
  /** opções no lobby do líder (com TV) e no menu do telemóvel (sem TV) */
  opcoes: { nome(): string; render(p: PropsOpcoes<D>): JSX.Element };
  /** muda quando o telemóvel deve vibrar (fase nova) */
  vibrar(v: V): string;
  /** jogos com canal privado: muda quando o telemóvel deve voltar a pedir o privado */
  versaoPrivado?(v: V): string;
  /** sem TV: o que a TV faria como host (ex.: a física do Ragerob), montado no telemóvel que tem a sala (src/jogar/Criar.tsx) */
  motor?(p: Pick<PropsTv<G, V>, 'g' | 'v' | 'sala' | 'agora' | 'acao'>): JSX.Element | null;
  /** durante a barra de 5 s antes do jogo (src/ui/abertura.tsx): carrega imagens, sons… que o jogo vai usar */
  precarregar?(): void | Promise<unknown>;
}

export const ECRAS: { [J in Registado as J['id']]: Ecras<EstadoDe<J>, VistaDe<J>, DefDe<J>> } = {
  '5050': {
    tv: (p) => <Tv5050 sala={p.sala} v={p.v} agora={p.agora} selFim={p.selFim} onOutraVez={p.onOutraVez} onMenu={p.onMenu} />,
    telemovel: (p) => <Telemovel5050 sala={p.sala} v={p.v} agora={p.agora} eu={p.eu} tag={p.marca()} enviar={p.enviar} />,
    opcoes: { nome: () => '50/50', render: (p) => <Definicoes5050 def={p.def} mudar={p.mudar} /> },
    vibrar: (v) => `${v.fase}:${v.ronda}:${v.dilema?.texto ?? ''}`,
  },
  pensa: {
    tv: (p) => <TvPensa sala={p.sala} v={p.v} agora={p.agora} selFim={p.selFim} onOutraVez={p.onOutraVez} onMenu={p.onMenu} />,
    telemovel: (p) => <TelemovelPensa sala={p.sala} v={p.v} agora={p.agora} eu={p.eu} tag={p.marca()} enviar={p.enviar} />,
    opcoes: { nome: () => t('pdOpcoesNome'), render: (p) => <DefinicoesPensa def={p.def} mudar={p.mudar} /> },
    vibrar: (v) => `p:${v.fase}:${v.ronda}:${v.atual}`,
  },
  wifi: {
    tv: (p) => <TvWifi sala={p.sala} v={p.v} agora={p.agora} selFim={p.selFim} onOutraVez={p.onOutraVez} onMenu={p.onMenu} />,
    telemovel: (p) => <TelemovelWifi key={p.eu} sala={p.sala} v={p.v} agora={p.agora} eu={p.eu} privado={(p.privado as PrivadoWifi | null) ?? null} enviar={p.enviar} />,
    opcoes: { nome: () => t('swOpcoesNome'), render: (p) => <DefinicoesWifi def={p.def} idioma={p.sala.idioma} mudar={p.mudar} /> },
    vibrar: (v) => `w:${v.fase}:${v.ronda}:${v.turno}:${v.passo}`,
    versaoPrivado: (v) => `${v.fase}:${v.ronda}`,
  },
  sevira: {
    tv: (p) => <TvSevira sala={p.sala} v={p.v} extra={extraTv(p.g)} agora={p.agora} selFim={p.selFim} onOutraVez={p.onOutraVez} onMenu={p.onMenu} />,
    telemovel: (p) => <TelemovelSevira sala={p.sala} v={p.v} agora={p.agora} eu={p.eu} tag={p.marca()} enviar={p.enviar} privado={(p.privado as PrivadoSevira | null) ?? null} />,
    opcoes: { nome: () => t('svOpcoesNome'), render: (p) => <DefinicoesSevira def={p.def} n={p.n} mudar={p.mudar} /> },
    vibrar: (v) => `s:${v.fase}:${v.atual}`,
    // sem TV: a imagem da galeria do slide atual (src/jogos/se-vira/regras.ts → privadoSevira)
    versaoPrivado: (v) => (v.fase === 'apresentar' ? `${v.atual}:${v.slide}` : ''),
  },
  mona: {
    tv: (p) => <TvMona sala={p.sala} v={p.v} agora={p.agora} selFim={p.selFim} onOutraVez={p.onOutraVez} onMenu={p.onMenu} />,
    telemovel: (p) => <TelemovelMona sala={p.sala} v={p.v} agora={p.agora} eu={p.eu} tag={p.marca()} enviar={p.enviar} />,
    opcoes: { nome: () => t('mlOpcoesNome'), render: (p) => <DefinicoesMona def={p.def} n={p.n} mudar={p.mudar} /> },
    vibrar: (v) => `m:${v.fase}:${v.ronda}:${v.atual}`,
  },
  ideias: {
    tv: (p) => <TvIdeias sala={p.sala} v={p.v} agora={p.agora} selFim={p.selFim} onOutraVez={p.onOutraVez} onMenu={p.onMenu} />,
    telemovel: (p) => <TelemovelIdeias sala={p.sala} v={p.v} agora={p.agora} eu={p.eu} tag={p.marca()} enviar={p.enviar} />,
    opcoes: { nome: () => t('imOpcoesNome'), render: (p) => <DefinicoesIdeias def={p.def} n={p.n} mudar={p.mudar} /> },
    vibrar: (v) => `i:${v.fase}:${v.atual}`,
  },
  pirata: {
    tv: (p) => <TvPirata sala={p.sala} v={p.v} agora={p.agora} selFim={p.selFim} onOutraVez={p.onOutraVez} onMenu={p.onMenu} />,
    telemovel: (p) => <TelemovelPirata key={p.eu} sala={p.sala} v={p.v} agora={p.agora} eu={p.eu} privado={(p.privado as PrivadoPirata | null) ?? null} enviar={p.enviar} />,
    opcoes: { nome: () => t('prNome'), render: (p) => <DefinicoesPirata def={p.def} n={p.n} mudar={p.mudar} /> },
    vibrar: (v) => `r:${v.fase}:${v.noite}`,
    versaoPrivado: (v) => `${v.fase}:${v.noite}`,
  },
  maquinas: {
    tv: (p) => <TvMaquinas sala={p.sala} v={p.v} agora={p.agora} selFim={p.selFim} onOutraVez={p.onOutraVez} onMenu={p.onMenu} />,
    telemovel: (p) => <TelemovelMaquinas key={p.eu} sala={p.sala} v={p.v} agora={p.agora} eu={p.eu} privado={(p.privado as PrivadoMaquinas | null) ?? null} enviar={p.enviar} />,
    opcoes: { nome: () => t('rmNome'), render: (p) => <DefinicoesMaquinas def={p.def} mudar={p.mudar} /> },
    vibrar: (v) => `rm:${v.fase}:${v.comandante}`,
    versaoPrivado: (v) => `${v.fase}:${v.comandante}:${v.sabotagens}`,
  },
  rei: {
    tv: (p) => <TvRei sala={p.sala} v={p.v} agora={p.agora} selFim={p.selFim} onOutraVez={p.onOutraVez} onMenu={p.onMenu} />,
    telemovel: (p) => <TelemovelRei key={p.eu} sala={p.sala} v={p.v} agora={p.agora} eu={p.eu} privado={(p.privado as PrivadoRei | null) ?? null} enviar={p.enviar} />,
    opcoes: { nome: () => t('rdNome'), render: (p) => <DefinicoesRei def={p.def} mudar={p.mudar} /> },
    vibrar: (v) => `rd:${v.fase}:${v.ronda}`,
    versaoPrivado: (v) => `${v.fase}:${v.seq}`,
  },
  semjuizo: {
    tv: (p) => <TvSemJuizo sala={p.sala} v={p.v} fotos={fotosMesa(p.g)} agora={p.agora} selFim={p.selFim} onOutraVez={p.onOutraVez} onMenu={p.onMenu} />,
    telemovel: (p) => <TelemovelSemJuizo key={p.eu} sala={p.sala} v={p.v} agora={p.agora} eu={p.eu} privado={(p.privado as PrivadoSemJuizo | null) ?? null} enviar={p.enviar} />,
    opcoes: { nome: () => t('sjNome'), render: (p) => <DefinicoesSemJuizo def={p.def} mudar={p.mudar} /> },
    vibrar: (v) => `sj:${v.fase}:${v.julgamento}:${v.mesa.length}`,
    versaoPrivado: (v) => `${v.fase}:${v.julgamento}:${v.mesa.length}`,
  },
  ragerob: {
    tv: (p) => <TvRagerob g={p.g} v={p.v} sala={p.sala} agora={p.agora} selFim={p.selFim} onOutraVez={p.onOutraVez} onMenu={p.onMenu} acao={p.acao} />,
    telemovel: (p) => <TelemovelRagerob key={p.eu} sala={p.sala} v={p.v} agora={p.agora} eu={p.eu} enviar={p.enviar} />,
    motor: (p) => <MotorRagerob g={p.g} v={p.v} sala={p.sala} agora={p.agora} acao={p.acao} />,
    opcoes: { nome: () => 'Ragerob', render: (p) => <DefinicoesRagerob def={p.def} mudar={p.mudar} /> },
    vibrar: (v) => `rr:${v.fase}:${v.ronda}:${v.combateIdx}`,
  },
  duelo: {
    tv: (p) => <TvDuelo sala={p.sala} v={p.v} agora={p.agora} desenhos={desenhosDuelo(p.g)} selFim={p.selFim} onOutraVez={p.onOutraVez} onMenu={p.onMenu} />,
    telemovel: (p) => <TelemovelDuelo key={p.eu} sala={p.sala} v={p.v} agora={p.agora} eu={p.eu} privado={(p.privado as Desenhos | null) ?? null} enviar={p.enviar} />,
    opcoes: { nome: () => TXT_DUELO.nome, render: (p) => <DefinicoesDuelo def={p.def} mudar={p.mudar} /> },
    // só a vez de quem joga, não cada dado
    vibrar: (v) => `dr:${v.fase}:${v.volta}:${v.fase === 'vez' ? v.vez : ''}`,
    versaoPrivado: (v) => String(PREPARACAO.includes(v.fase)),
  },
};

/** um jogo do registo com os seus ecrãs, sem os tipos de cada jogo (para o código genérico da TV e do telemóvel) */
export interface JogoComEcras {
  id: string;
  chave: string;
  chaveDef: string;
  definir: string;
  padrao: unknown;
  soTv?: boolean;
  e: Ecras<unknown, unknown, unknown>;
}

export const COM_ECRAS: readonly JogoComEcras[] = LISTA.map((j) => ({
  id: j.id,
  chave: j.chave,
  chaveDef: j.chaveDef,
  definir: j.definir,
  padrao: j.padrao,
  soTv: j.soTv,
  e: (ECRAS as unknown as Record<string, Ecras<unknown, unknown, unknown>>)[j.id],
}));

const campos = (x: object) => x as Record<string, unknown>;

/** o jogo em curso numa vista (ou estado) e o que lá está para ele */
export function emCurso(x: object): { j: JogoComEcras; g: unknown } | null {
  const j = COM_ECRAS.find((y) => campos(x)[y.chave]);
  return j ? { j, g: campos(x)[j.chave] } : null;
}

/** as opções de `j` como estão na vista (ou as de origem) */
export const opcoesNaVista = (v: VistaSala, j: JogoComEcras): unknown => campos(v)[j.chaveDef] ?? j.padrao;

/** a ação do líder que muda as opções de `j` */
export const acaoDefinir = (j: JogoComEcras, def: unknown): AcaoSala => ({ tipo: j.definir, id: '', def }) as unknown as AcaoSala;
