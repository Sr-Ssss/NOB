import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

/** Interface do transporte em tempo real. Os jogos só falam com isto. */
export interface Canal {
  /** envia um evento para todos os outros na sala */
  enviar(evento: string, dados: unknown): void;
  ouvir(evento: string, cb: (dados: unknown) => void): void;
  /** ids presentes (atualiza a cada entrada/saída) */
  aoMudarPresenca(cb: (ids: string[]) => void): void;
  aoLigar(cb: (ok: boolean) => void): void;
  sair(): void;
}

let cliente: SupabaseClient | null = null;

function supabase(): SupabaseClient {
  if (!cliente) {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;
    if (!url || !key) throw new Error('Falta VITE_SUPABASE_URL / VITE_SUPABASE_KEY no .env');
    cliente = createClient(url, key, { realtime: { params: { eventsPerSecond: 20 } } });
  }
  return cliente;
}

/** abre o canal `sala:CODIGO`; `eu` é a chave de presença */
export function abrirCanal(codigo: string, eu: string): Canal {
  const ch: RealtimeChannel = supabase().channel(`sala:${codigo}`, {
    config: { broadcast: { self: false }, presence: { key: eu } },
  });
  const ouvintes = new Map<string, ((d: unknown) => void)[]>();
  let presenca: (ids: string[]) => void = () => {};
  let ligado: (ok: boolean) => void = () => {};
  const fila: [string, unknown][] = [];
  let pronto = false;

  ch.on('presence', { event: 'sync' }, () => presenca(Object.keys(ch.presenceState())));

  const registar = (evento: string) =>
    ch.on('broadcast', { event: evento }, (msg) => ouvintes.get(evento)?.forEach((cb) => cb(msg.payload)));

  // os ouvintes têm de ser registados antes do subscribe: guardamos os eventos pedidos
  const eventos = ['acao', 'vista', 'pedir', 'privado'];
  eventos.forEach(registar);

  ch.subscribe(async (estado) => {
    if (estado === 'SUBSCRIBED') {
      pronto = true;
      await ch.track({ em: Date.now() });
      fila.splice(0).forEach(([e, d]) => ch.send({ type: 'broadcast', event: e, payload: d }));
      ligado(true);
    } else if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') {
      ligado(false);
    }
  });

  return {
    enviar(evento, dados) {
      if (!pronto) fila.push([evento, dados]);
      else void ch.send({ type: 'broadcast', event: evento, payload: dados });
    },
    ouvir(evento, cb) {
      if (!eventos.includes(evento)) throw new Error(`evento não registado: ${evento}`);
      ouvintes.set(evento, [...(ouvintes.get(evento) ?? []), cb]);
    },
    aoMudarPresenca(cb) {
      presenca = cb;
    },
    aoLigar(cb) {
      ligado = cb;
    },
    sair() {
      void supabase().removeChannel(ch);
    },
  };
}
