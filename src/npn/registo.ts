/** Leitura vinda do plugin nativo (já com mediana de 3 s e histerese). */
export interface Leitura {
  id: string;
  nome: string;
  rssi: number;
  mediana: number;
  perto: boolean;
  t: number;
}

export interface LinhaRegisto extends Leitura {
  limite: number;
  distancia: string; // anotada à mão (m)
}

export const LIMITE_MIN = -90;
export const LIMITE_MAX = -50;
export const LIMITE_PADRAO = -65;
export const MAX_REGISTO = 20000;

function campo(v: string | number): string {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function paraCsv(linhas: LinhaRegisto[]): string {
  const cab = 'hora,telemovel,id,rssi,mediana_3s,estado,limite_dbm,distancia_m';
  const corpo = linhas.map((l) =>
    [new Date(l.t).toISOString(), l.nome, l.id, l.rssi, l.mediana, l.perto ? 'PERTO' : 'LONGE', l.limite, l.distancia]
      .map(campo)
      .join(','),
  );
  return [cab, ...corpo].join('\n') + '\n';
}

/** junta a leitura nova à lista de telemóveis vistos (o mais forte primeiro) */
export function atualizar(vistos: Leitura[], l: Leitura): Leitura[] {
  return [...vistos.filter((v) => v.id !== l.id), l].sort((a, b) => b.mediana - a.mediana);
}
