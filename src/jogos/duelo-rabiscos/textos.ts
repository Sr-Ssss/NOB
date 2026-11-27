import type { Classe, Criatura, Poder, RoupaMago } from './criaturas';
import type { FaceDado } from './artes/dados';
import type { Modo } from './jogadas';
import type { Face } from './regras';
import type { Obstaculos } from './tabuleiro';
import * as BR from './textosBR';
import * as EN from './textosEN';

export const NOME_CLASSE_PT: Record<Classe, string> = {
  lacaio: 'Lacaio',
  batedor: 'Batedor',
  pescador: 'Pescador',
  arqueiro: 'Arqueiro',
  guardiao: 'Guardião',
  duelista: 'Duelista',
  barbaro: 'Bárbaro',
};

/** nome e especial; `habilidade` = o especial usa o dado Habilidade */
export const TEXTO_CRIATURA_PT: Record<Criatura, { nome: string; especial: string; habilidade?: boolean }> = {
  duende: { nome: 'Duende', especial: '+1 dado se outro Lacaio teu estiver colado ao alvo.' },
  sapinho: { nome: 'Sapinho Saltitão', especial: 'Quem o mata leva 1 ferimento.' },
  corvo: { nome: 'Corvo', especial: 'Passa por cima de criaturas e obstáculos.' },
  lobo: { nome: 'Lobo', especial: 'Depois de atacar, anda 1.' },
  velhoPescador: { nome: 'Velho Pescador', especial: 'Com o dado Habilidade, puxa um inimigo até 3, faz-lhe 1 ferimento e luta corpo a corpo.', habilidade: true },
  mumia: { nome: 'Múmia', especial: 'Com o dado Habilidade, tira 1 ferimento a um amigo até 2 de distância.', habilidade: true },
  elfo: { nome: 'Elfo', especial: 'Atira até 3 de distância, mas não colado.' },
  dragaozinho: { nome: 'Dragãozinho', especial: 'Luta colado ou atira a 2; tiro falhado faz 1 ferimento. Com o dado Habilidade, sopra fogo em 2 casas em linha: 1 ferimento a cada.', habilidade: true },
  golem: { nome: 'Golem', especial: 'Amigos colados têm +1 dado de defesa.' },
  carvalho: { nome: 'Carvalho Vivo', especial: 'Com o dado Habilidade, cria uma parede numa casa colada. Dura 2 voltas.', habilidade: true },
  cavaleiro: { nome: 'Cavaleiro', especial: 'Relança 1 dado vazio. Com o dado Habilidade, fica em guarda: +1 dado de defesa nesta volta e +1 dado no próximo ataque.', habilidade: true },
  raposa: { nome: 'Raposa Espadachim', especial: 'Num empate corpo a corpo, ela sobrevive.' },
  minotauro: { nome: 'Minotauro', especial: 'Ao morrer, faz 1 ferimento aos inimigos colados.' },
  ogre: { nome: 'Ogre', especial: '+1 dado de ataque por cada ferimento (máx. +2).' },
};

export const NOME_MAGO_PT: Record<RoupaMago, string> = {
  trovoada: 'Capa de trovoada',
  lencol: 'Lençol e véu',
  pijama: 'Pijama de estrelas',
  peles: 'Armadura com peles',
  pedreiro: 'Avental de pedreiro',
  ilusionista: 'Casaca de ilusionista',
};

export const TEXTO_PODER_PT: Record<Poder, { nome: string; efeito: string }> = {
  empurrao: { nome: 'Empurrão', efeito: 'Empurra uma criatura 1 casa.' },
  escudo: { nome: 'Escudo', efeito: '+1 dado de defesa até ao fim da volta.' },
  retoque: { nome: 'Retoque', efeito: 'Tira 1 ferimento a uma criatura tua.' },
  maisAtaque: { nome: '+1 ataque', efeito: '+1 dado no próximo ataque.' },
  tempestade: { nome: 'Tempestade', efeito: '1 ferimento numa criatura e em todas as coladas.' },
  copia: { nome: 'Cópia Fantasma', efeito: 'Um Duende ao lado de uma criatura tua.' },
  sono: { nome: 'Sono', efeito: 'Um inimigo não age até ao fim da volta.' },
  furia: { nome: 'Fúria', efeito: '+2 dados no próximo ataque.' },
  muralha: { nome: 'Muralha', efeito: 'Bloqueia 3 casas até ao fim da volta seguinte.' },
  troca: { nome: 'Troca', efeito: '2 criaturas trocam de lugar.' },
};

export const OBSTACULOS_PT: [Obstaculos, string][] = [
  ['nenhum', 'Nenhum'],
  ['poucos', 'Poucos'],
  ['muitos', 'Muitos'],
];

/** porque é que o + está apagado */
export const MOTIVO_PT = { variante: 'Já tens a outra variante', classes: 'Já tens 3 classes', tinta: 'Falta tinta' };

/** ecrãs da preparação */
export const TXT_PT = {
  nome: 'Duelo de Rabiscos',
  opTinta: 'Tinta por mago',
  opDesenhar: 'Desenhar cada criatura (s)',
  opObstaculos: 'Obstáculos',
  mais: (x: string) => `Mais: ${x}`,
  menos: (x: string) => `Menos: ${x}`,
  mago: 'Escolham o vosso mago',
  exercito: 'Montem o vosso exército',
  desenhar: 'Desenhem as vossas criaturas',
  teu: 'É o teu',
  pronto: 'Pronto',
  desenhos: (n: number, t: number) => `${n} de ${t} desenhos`,
  resta: (n: number, t: number) => `Tinta: ${n} de ${t}`,
  classes: (n: number, t: number) => `${n}/${t} classes`,
  confirmar: 'Confirmar',
  exercitoPronto: 'Exército pronto',
  comMolde: 'Com molde',
  livre: 'Livre',
  cheio: 'Desenho cheio: desfaz um risco para continuar.',
  vazio: 'Sem desenho, vale o molde.',
  acabei: 'Acabei',
  proxima: 'Próxima',
  acabeiOutraVez: 'Toca outra vez para acabar',
  espera: 'Feito! À espera dos outros magos.',
  soVer: 'Este duelo já está cheio: vê a partida.',
  colmeia: 'Colmeia',
  casa: (l: number, c: number) => `Linha ${l}, casa ${c}`,
  ferimentos: (n: number) => (n === 1 ? '1 ferimento' : `${n} ferimentos`),
  gemas: (n: number) => (n === 1 ? '1 gema' : `${n} gemas`),
  volta: (n: number) => `Volta ${n}`,
  nCriaturas: (n: number) => (n === 1 ? '1 criatura' : `${n} criaturas`),
  eliminado: 'Fora do duelo',
  soVerFora: 'As tuas criaturas caíram todas: agora vê o duelo.',
  todosRodam: 'Todos rodam os dados',
  vezDe: (x: string) => `É a vez de ${x}`,
  lutam: (x: string, y: string) => `${x} ataca ${y}!`,
  loboDe: (x: string) => `O Lobo de ${x} pode andar 1`,
  // rodar
  rodar: 'Os teus dados',
  rodarAjuda: 'Podes tocar num dado para o rodar outra vez (só 1 por volta).',
  rodou: 'Já rodaste um dado outra vez.',
  rodarDado: (x: string) => `Rodar outra vez: ${x}`,
  ficoAssim: 'Pronto',
  aEspera: 'À espera dos outros magos.',
  // vez
  minhaVez: 'É a tua vez!',
  passoDado: '1. Escolhe um dado',
  passoCriatura: '2. Escolhe uma criatura',
  passoAlvo: '3. Toca numa casa acesa',
  semJogada: 'Este dado não serve para nenhuma criatura agora.',
  passar: 'Passar (perde este dado)',
  passarGema: 'Trocar por 1 gema',
  lutarSemDado: 'Lutar colado (não gasta dado) ou escolhe um dado',
  confirmarJogada: 'Confirmar',
  cancelar: 'Voltar',
  poderes: 'Poderes (1 por vez, antes do dado)',
  poderUsar: (x: string) => `Poder: ${x}`,
  muralhaFaltam: (n: number) => (n === 1 ? 'Falta 1 casa.' : `Faltam ${n} casas.`),
  trocaPrimeira: 'Escolhe as 2 criaturas que trocam de lugar.',
  empurraCasa: 'Agora escolhe para onde vai.',
  // fora da vez, batalha, lobo, fim
  meusDados: 'Os teus dados',
  semDados: 'Já não tens dados nesta volta.',
  meuExercito: 'O teu exército',
  relancar: 'Toca num dado teu para o rodar outra vez.',
  relancarGratis: 'A primeira é grátis.',
  relancarGema: 'Custa 1 gema.',
  ficar: 'Ficar assim',
  loboAnda: 'O teu Lobo pode andar 1 casa.',
  loboFica: 'Fica onde está',
  ataca: 'Ataque',
  defende: 'Defesa',
  resultado: (morreu: boolean, morreuQuemAtacou: boolean, atacou: string, defendeu: string) =>
    morreu && morreuQuemAtacou ? 'Caem os dois!' : morreu ? `${defendeu} cai!` : morreuQuemAtacou ? `${atacou} cai!` : 'Ninguém cai!',
  venceu: (x: string) => `${x} ganha o duelo!`,
  empate: 'Empate!',
  zoomMais: 'Aproximar a colmeia',
  zoomMenos: 'Afastar a colmeia',
  magos: 'Magos',
};

export const NOME_FACE_PT: Record<Face, string> = { andar: 'Andar', fazer: 'Fazer algo', habilidade: 'Habilidade', coringa: 'Coringa' };
export const NOME_DADO_PT: Record<FaceDado, string> = {
  andar: 'Andar',
  fazerAlgo: 'Fazer algo',
  habilidade: 'Habilidade',
  coringa: 'Coringa',
  ataqueVazio: 'Vazio',
  ataqueFere: 'Ferimento',
  ataque1: '1 risco',
  ataque2: '2 riscos',
  defesaVazio: 'Vazio',
  defesaFere: 'Ferimento',
  defesa1: '1 bloqueio',
  feridaEspada: 'Ferido (ataque): 1 risco',
  feridaCoracao: 'Ferido (ataque): coração',
  feridaGema: 'Ferido (ataque): gema',
  feridaVazio: 'Ferido (ataque): vazio',
  feridaDefEscudo: 'Ferido (defesa): 1 bloqueio',
  feridaDefCoracao: 'Ferido (defesa): coração',
  feridaDefGema: 'Ferido (defesa): gema',
  feridaDefVazio: 'Ferido (defesa): vazio',
  ataqueGema: 'Gema',
  defesaGema: 'Gema',
};
export const NOME_MODO_PT: Record<Modo, string> = { andar: 'Andar', atacar: 'Atirar', especial: 'Especial', lutar: 'Lutar (sem dado)' };
export const MOTIVO_PODER_PT = { usado: 'Já usaste um poder nesta vez', gemas: 'Faltam gemas', alvo: 'Sem alvo agora' };

/**
 * O que os ecrãs usam: os textos da língua da party (PT-BR ou EN), lidos na hora. A língua vem do `lang` da página,
 * que `usarIdioma` (src/core/i18n.ts) define; sem página (testes), PT-PT.
 */
function porLingua<T extends object>(pt: T, br: T, en: T): T {
  const agora = (): T => {
    const l = typeof document === 'undefined' ? '' : document.documentElement.lang;
    return l === 'en' ? en : l === 'pt-BR' ? br : pt;
  };
  return new Proxy(pt, {
    get: (_, k) => Reflect.get(agora(), k),
    has: (_, k) => Reflect.has(agora(), k),
    ownKeys: () => Reflect.ownKeys(agora()),
    getOwnPropertyDescriptor: (_, k) => Reflect.getOwnPropertyDescriptor(agora(), k),
  });
}
export const NOME_CLASSE = porLingua(NOME_CLASSE_PT, BR.NOME_CLASSE, EN.NOME_CLASSE);
export const TEXTO_CRIATURA = porLingua(TEXTO_CRIATURA_PT, BR.TEXTO_CRIATURA, EN.TEXTO_CRIATURA);
export const NOME_MAGO = porLingua(NOME_MAGO_PT, BR.NOME_MAGO, EN.NOME_MAGO);
export const TEXTO_PODER = porLingua(TEXTO_PODER_PT, BR.TEXTO_PODER, EN.TEXTO_PODER);
export const OBSTACULOS = porLingua(OBSTACULOS_PT, BR.OBSTACULOS, EN.OBSTACULOS);
export const MOTIVO = porLingua(MOTIVO_PT, BR.MOTIVO, EN.MOTIVO);
export const TXT = porLingua(TXT_PT, BR.TXT, EN.TXT);
export const NOME_FACE = porLingua(NOME_FACE_PT, BR.NOME_FACE, EN.NOME_FACE);
export const NOME_DADO = porLingua(NOME_DADO_PT, BR.NOME_DADO, EN.NOME_DADO);
export const NOME_MODO = porLingua(NOME_MODO_PT, BR.NOME_MODO, EN.NOME_MODO);
export const MOTIVO_PODER = porLingua(MOTIVO_PODER_PT, BR.MOTIVO_PODER, EN.MOTIVO_PODER);
