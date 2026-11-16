import { useEffect, useRef, useState } from 'preact/hooks';
import { abrirCanal, type Canal } from './canal';

/**
 * Canal privado (info/arquitetura.md → Protocolo): um canal por jogador, `p:<código>:<tag>`.
 * A tag é o segredo do jogador (nunca vai na vista pública), por isso cada telemóvel só ouve o seu.
 * O host abre um canal por jogador só enquanto o jogo tem algo privado (`privadoSala` ≠ null).
 * Reutilizável: os jogos só têm de devolver os dados em `privadoSala` (src/core/sala.ts).
 */
export const topicoPrivado = (codigo: string, tag: string) => `p:${codigo}:${tag}`;

/** mensagem do host para um só jogador */
export interface MsgPrivado {
  seq: number;
  dados: unknown;
}

/** lado do host: mantém os canais abertos e envia só quando muda */
export class EmissorPrivado {
  private canais = new Map<string, { canal: Canal; ultimo: string; dados: unknown }>();
  private seq = 0;
  constructor(
    private codigo: string,
    private abrir: (topico: string) => Canal = (t) => abrirCanal(t, 'host'),
  ) {}

  /** `jogadores`: id + tag; `dados(id)`: o privado de cada um (null = nada) */
  sincronizar(jogadores: { id: string; tag: string }[], dados: (id: string) => unknown) {
    const vivos = new Set<string>();
    for (const j of jogadores) {
      const d = dados(j.id);
      if (d === null || d === undefined || !j.tag) continue;
      vivos.add(j.tag);
      let c = this.canais.get(j.tag);
      if (!c) {
        const canal = this.abrir(topicoPrivado(this.codigo, j.tag));
        const novo = { canal, ultimo: '', dados: d };
        canal.ouvir('pedir', () => this.mandar(novo, true));
        this.canais.set(j.tag, novo);
        c = novo;
      }
      c.dados = d;
      this.mandar(c, false);
    }
    for (const [tag, c] of this.canais) {
      if (!vivos.has(tag)) {
        c.canal.sair();
        this.canais.delete(tag);
      }
    }
  }

  private mandar(c: { canal: Canal; ultimo: string; dados: unknown }, forcar: boolean) {
    const txt = JSON.stringify(c.dados);
    if (!forcar && txt === c.ultimo) return;
    c.ultimo = txt;
    c.canal.enviar('privado', { seq: ++this.seq, dados: c.dados } satisfies MsgPrivado);
  }

  fechar() {
    this.canais.forEach((c) => c.canal.sair());
    this.canais.clear();
  }
}

/**
 * Lado do telemóvel: ouve os canais privados das tags dadas (a minha e, no líder, as dos bots).
 * Devolve id → últimos dados recebidos.
 * `versao` (ex.: fase pública): quando muda, volta a pedir — se uma mensagem se perder, recupera-se na fase seguinte… ou já nesta.
 */
export function usePrivados(codigo: string, tags: Record<string, string>, versao = ''): Record<string, unknown> {
  const [dados, setDados] = useState<Record<string, unknown>>({});
  const chave = JSON.stringify(Object.entries(tags).sort());
  const canais = useRef<Canal[]>([]);
  useEffect(() => {
    if (!versao) return;
    // dá tempo ao host de enviar; se não chegou, pede outra vez
    const t = setTimeout(() => canais.current.forEach((c) => c.enviar('pedir', {})), 700);
    return () => clearTimeout(t);
  }, [versao, chave]);
  useEffect(() => {
    const abertos: Canal[] = [];
    canais.current = abertos;
    for (const [id, tag] of Object.entries(tags)) {
      if (!tag) continue;
      let c: Canal;
      try {
        c = abrirCanal(topicoPrivado(codigo, tag), 'p-' + id.slice(0, 8));
      } catch {
        continue;
      }
      // a ordem chega certa (um só socket); o seq não serve aqui porque a TV pode recarregar e recomeçar
      c.ouvir('privado', (d) => {
        const m = d as MsgPrivado;
        if (typeof m?.seq !== 'number') return;
        setDados((x) => ({ ...x, [id]: m.dados }));
      });
      c.aoLigar((ok) => ok && c.enviar('pedir', {}));
      abertos.push(c);
    }
    return () => abertos.forEach((c) => c.sair());
  }, [codigo, chave]);
  return dados;
}
