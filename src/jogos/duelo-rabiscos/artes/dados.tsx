import { useEffect, useState } from 'preact/hooks';
import { Arte, type Camada } from './lapis';

/** forma do dado = tipo: ação quadrado, ataque estrela, defesa escudo; ícone = face */
const ACAO: Camada = ['M14 9Q50 6 87 9Q92 10 92 16Q94 50 91 86Q91 91 85 92Q50 94 14 91Q8 91 8 85Q6 50 9 14Q9 9 14 9Z', '#fffdf2', 5];
const QUADRADO = 'M14 9Q50 6 87 9Q92 10 92 16Q94 50 91 86Q91 91 85 92Q50 94 14 91Q8 91 8 85Q6 50 9 14Q9 9 14 9Z';
/** dados da batalha: também quadrados (parecem dados); a cor diz o lado */
const ATAQUE: Camada = [QUADRADO, '#ffd3c7', 5];
const DEFESA: Camada = [QUADRADO, '#cfe3ff', 5];
/** ferimento: redondo e rachado */
/** dados fracos: cor mais apagada que os normais e rachados (vermelho-acinzentado no ataque, azul-acinzentado na defesa) */
const RACHAS: Camada = ['M14 9L22 20L18 28M85 92L78 82L83 76', undefined, 4];
const FERIDO: Camada[] = [[QUADRADO, '#d9a79f', 5], RACHAS];
const FERIDO_D: Camada[] = [[QUADRADO, '#a9b9d3', 5], RACHAS];
const GEMA_ICONE: Camada[] = [['M36 30L64 30L78 47L50 78L22 47Z', '#c9f0e4', 6], ['M22 47L78 47', undefined, 4]];
const CORACAO: Camada = ['M50 78Q20 56 24 40Q28 28 40 31Q48 33 50 41Q52 33 60 31Q72 28 76 40Q80 56 50 78Z', '#f7b3b3', 6];
const VAZIO: Camada = ['M42 50a8 8 0 1 0 16 0a8 8 0 1 0 -16 0', '#fff', 3, '4 6'];

/** duas pegadas: a face Andar e o número de passos da carta (o mesmo símbolo) */
export const PEGADAS: Camada[] = [['M22 72Q20 56 31 54Q42 56 40 72Q39 84 31 84Q23 84 22 72Z', '#9fd38c', 4], ['M20.5 47a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M27.5 45a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M34.5 47a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0', '#9fd38c', 3], ['M50 40Q48 24 59 22Q70 24 68 40Q67 52 59 52Q51 52 50 40Z', '#9fd38c', 4], ['M48.5 15a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M55.5 13a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M62.5 15a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0', '#9fd38c', 3]];

export const DADOS = {
  // duas pegadas: andar
  andar: [ACAO, ...PEGADAS],
  // um raiozinho
  fazerAlgo: [ACAO, ['M58 12L28 54L47 54L38 88L74 42L54 42L64 12Z', '#ffd25a', 5]],
  // redemoinho roxo
  habilidade: [ACAO, ['M50 16Q84 16 84 50Q84 84 50 84Q16 84 16 50Q16 16 50 16Z', '#c7a3f5', 4], ['M51 50Q51 44 57 45Q64 47 62 56Q58 64 48 63Q36 61 37 48Q39 33 56 32Q74 33 76 52Q76 72 54 76Q32 78 24 62', undefined, 6]],
  // só a estrela
  coringa: [ACAO, ['M50 12L62 37L88 40L68 58L74 85L50 71L26 85L32 58L12 40L38 37Z', '#ffd84d', 5]],
  ataqueVazio: [ATAQUE, VAZIO],
  ataque1: [ATAQUE, ['M70 24L72 38L48 64L36 53L59 26Z', '#e9eef2', 5], ['M30 48L53 70M41 59L28 73', undefined, 7]],
  ataque2: [ATAQUE, ['M28 24L26 36L56 66L65 57L40 26Z', '#e9eef2', 5], ['M69 50L50 71M60 61L72 74', undefined, 6], ['M72 24L74 36L44 66L35 57L60 26Z', '#e9eef2', 5], ['M31 50L50 71M40 61L28 74', undefined, 6]],
  // ferimento: gota vermelha com risco (fere o inimigo que sobreviver)
  ataqueFere: [ATAQUE, ['M50 20Q72 46 72 60Q70 80 50 80Q30 80 28 60Q28 46 50 20Z', '#e8505b', 5], ['M56 40L44 56L56 62L46 74', '#fff', 4]],
  ataqueGema: [ATAQUE, ['M36 30L64 30L78 47L50 78L22 47Z', '#c9f0e4', 6], ['M22 47L78 47', undefined, 4]],
  defesaVazio: [DEFESA, VAZIO],
  defesaGema: [DEFESA, ['M36 30L64 30L78 47L50 78L22 47Z', '#c9f0e4', 6], ['M22 47L78 47', undefined, 4]],
  // (já não sai: a defesa só bloqueia)
  defesaFere: [DEFESA, ['M50 20Q72 46 72 60Q70 80 50 80Q30 80 28 60Q28 46 50 20Z', '#e8505b', 5], ['M56 40L44 56L56 62L46 74', '#fff', 4]],
  defesa1: [DEFESA, ['M50 22Q63 29 76 30Q77 61 50 78Q23 61 24 30Q37 29 50 22Z', '#8fbce8', 5], ['M36 49L47 60L65 38', undefined, 8]],
  feridaEspada: [...FERIDO, ['M66 26L70 38L46 66L36 57L60 30Z', '#ffd9a8', 5], ['M31 52L51 70M40 61L28 75', undefined, 6]],
  feridaCoracao: [...FERIDO, CORACAO],
  feridaGema: [...FERIDO, ...GEMA_ICONE],
  feridaVazio: [...FERIDO, VAZIO],
  feridaDefEscudo: [...FERIDO_D, ['M50 28Q62 35 74 36Q75 63 50 78Q25 63 26 36Q38 35 50 28Z', '#8fbce8', 6]],
  feridaDefCoracao: [...FERIDO_D, CORACAO],
  feridaDefGema: [...FERIDO_D, ...GEMA_ICONE],
  feridaDefVazio: [...FERIDO_D, VAZIO],
} satisfies Record<string, Camada[]>;
export type FaceDado = keyof typeof DADOS;

export function Dado({ face, tam = 48 }: { face: FaceDado; tam?: number }) {
  return <Arte c={DADOS[face]} tam={tam} class={`dr-dado dr-dado-${face}`} />;
}

const GRUPOS: FaceDado[][] = [
  ['andar', 'fazerAlgo', 'habilidade', 'coringa'],
  ['ataqueVazio', 'ataque1', 'ataque2', 'ataqueFere', 'ataqueGema'],
  ['defesaVazio', 'defesa1', 'defesaFere', 'defesaGema'],
  ['feridaEspada', 'feridaCoracao', 'feridaGema', 'feridaVazio'],
  ['feridaDefEscudo', 'feridaDefCoracao', 'feridaDefGema', 'feridaDefVazio'],
];
const calmo = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Dado que "rola" quando aparece ou muda de face: abana e troca de face ao acaso ~0,5 s, depois pára no resultado.
 * `rolar={false}`: aparece logo parado (p. ex., a repetir uma batalha já acabada).
 */
export function DadoRola({ face, tam = 48, rolar = true }: { face: FaceDado; tam?: number; rolar?: boolean }) {
  const [mostra, setMostra] = useState(face);
  const [roda, setRoda] = useState(false);
  useEffect(() => {
    if (!rolar || calmo()) {
      setMostra(face);
      return;
    }
    const g = GRUPOS.find((x) => x.includes(face)) ?? [face];
    let k = 0;
    setRoda(true);
    const t = setInterval(() => {
      k++;
      if (k >= 8) {
        clearInterval(t);
        setMostra(face);
        setRoda(false);
      } else setMostra(g[Math.floor(Math.random() * g.length)]);
    }, 65);
    return () => clearInterval(t);
  }, [face]);
  return (
    <span class={'dr-rola' + (roda ? ' a-rodar' : '')}>
      <Dado face={mostra} tam={tam} />
    </span>
  );
}
