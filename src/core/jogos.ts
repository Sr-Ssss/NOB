import type { Idioma } from './sala';

/** catálogo para o menu de jogos (nomes: info/arquitetura.md; jogadores: info/jogos/*.md) */
export interface InfoJogo {
  id: string;
  pt: string;
  en: string;
  descPt: string;
  descEn: string;
  min: number;
  max: number;
  minutos: number; // duração típica (estimada)
  precisaTv: boolean;
  feito: boolean; // já se pode jogar nesta versão
}

export const CATALOGO: InfoJogo[] = [
  { id: '5050', pt: '50/50', en: '50/50', descPt: 'Escreva uma pergunta que divida a sala ao meio.', descEn: 'Write a question that splits the room in half.', min: 3, max: 16, minutos: 10, precisaTv: false, feito: true },
  { id: 'pensa', pt: 'Pensa-Dores', en: 'Deep Thinkers', descPt: 'Duelos de respostas: a sala vota na mais engraçada.', descEn: 'Answer duels: the room votes for the funniest.', min: 4, max: 16, minutos: 15, precisaTv: false, feito: false },
  { id: 'sevira', pt: 'Se Vira!', en: 'Wing It!', descPt: 'Apresente slides que você nunca viu.', descEn: "Present slides you've never seen.", min: 3, max: 16, minutos: 20, precisaTv: true, feito: false },
  { id: 'mona', pt: 'Mona Lixa', en: 'Mona Lies', descPt: 'Desenhe, invente títulos falsos e adivinhe o verdadeiro.', descEn: 'Draw, fake the titles, guess the real one.', min: 3, max: 16, minutos: 15, precisaTv: false, feito: false },
  { id: 'ideias', pt: 'Ideias Mirabolantes', en: 'Harebrained Ideas', descPt: 'Invenções inúteis para problemas bobos.', descEn: 'Useless inventions for silly problems.', min: 3, max: 16, minutos: 20, precisaTv: false, feito: false },
  { id: 'pirata', pt: 'Pirata', en: 'Pirate', descPt: 'Há piratas a bordo. Descubra quem são antes que joguem você no mar.', descEn: 'Pirates on board. Find them before you walk the plank.', min: 5, max: 16, minutos: 20, precisaTv: false, feito: false },
  { id: 'rei', pt: 'O Rei e o Dragão', en: 'The King and the Dragon', descPt: 'Duas salas, duas equipes e trocas de reféns.', descEn: 'Two rooms, two teams, hostage swaps.', min: 6, max: 24, minutos: 15, precisaTv: false, feito: false },
  { id: 'maquinas', pt: 'Revolução das Máquinas', en: 'Machine Uprising', descPt: 'Robôs leais contra robôs rebeldes.', descEn: 'Loyal robots versus rebel robots.', min: 5, max: 10, minutos: 25, precisaTv: false, feito: false },
  { id: 'wifi', pt: 'Senha do Wi-Fi', en: 'Wi-Fi Password', descPt: 'Dê pistas em código sem a outra equipe perceber.', descEn: 'Give coded clues without the other team cracking them.', min: 4, max: 16, minutos: 25, precisaTv: false, feito: false },
  { id: 'ragerob', pt: 'Ragerob', en: 'Ragerob', descPt: 'Aposte, compre peças e pilote robôs de luta.', descEn: 'Bet, buy parts and pilot battle robots.', min: 2, max: 10, minutos: 20, precisaTv: true, feito: false },
];

export function nome(j: InfoJogo, i: Idioma): string {
  return i === 'en' ? j.en : j.pt;
}

export function descricao(j: InfoJogo, i: Idioma): string {
  return i === 'en' ? j.descEn : j.descPt;
}

export type Motivo = { tipo: 'em_breve' } | { tipo: 'poucos'; precisa: number; tem: number } | { tipo: 'muitos'; max: number; tem: number };

/** porque é que o jogo não dá (null = dá); a party desta versão tem sempre TV */
export function motivo(j: InfoJogo, jogadores: number): Motivo | null {
  if (!j.feito) return { tipo: 'em_breve' };
  if (jogadores < j.min) return { tipo: 'poucos', precisa: j.min, tem: jogadores };
  if (jogadores > j.max && j.id !== '5050') return { tipo: 'muitos', max: j.max, tem: jogadores };
  return null;
}

export type Filtro = 'rapidos' | 'pessoas' | 'tv' | 'semtv';

export function filtrar(lista: InfoJogo[], pesquisa: string, filtros: Filtro[], jogadores: number, i: Idioma): InfoJogo[] {
  const q = pesquisa.trim().toLowerCase();
  return lista.filter(
    (j) =>
      (!q || nome(j, i).toLowerCase().includes(q)) &&
      (!filtros.includes('rapidos') || j.minutos <= 15) &&
      (!filtros.includes('pessoas') || (jogadores >= j.min && jogadores <= j.max)) &&
      (!filtros.includes('tv') || j.precisaTv) &&
      (!filtros.includes('semtv') || !j.precisaTv),
  );
}
