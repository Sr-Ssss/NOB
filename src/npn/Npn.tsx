import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { useEffect, useRef, useState } from 'preact/hooks';
import { LIMITE_MAX, LIMITE_MIN, LIMITE_PADRAO, MAX_REGISTO, atualizar, paraCsv, type Leitura, type LinhaRegisto } from './registo';

interface NpnPlugin {
  iniciar(o: { nome: string; limite: number }): Promise<void>;
  parar(): Promise<void>;
  definirLimite(o: { limite: number }): Promise<void>;
  partilharCsv(o: { texto: string; nome: string }): Promise<void>;
  addListener(evento: 'leitura', cb: (l: Leitura) => void): Promise<PluginListenerHandle>;
}

const Npn = registerPlugin<NpnPlugin>('Npn');

function nomeGuardado(): string {
  try {
    return JSON.parse(localStorage.getItem('nob.eu') ?? '{}').nome ?? '';
  } catch {
    return '';
  }
}

/** Ecrã de teste de proximidade por BLE (só Android, só em modo dev). Não é o jogo NPN. */
export function NpnTeste() {
  const [nome, setNome] = useState(nomeGuardado() || 'NOB');
  const [limite, setLimite] = useState(LIMITE_PADRAO);
  const [distancia, setDistancia] = useState('');
  const [ativo, setAtivo] = useState(false);
  const [erro, setErro] = useState('');
  const [vistos, setVistos] = useState<Leitura[]>([]);
  const registo = useRef<LinhaRegisto[]>([]);
  const ctx = useRef({ limite, distancia });
  ctx.current = { limite, distancia };
  const nativo = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!nativo) return;
    const h = Npn.addListener('leitura', (l) => {
      setVistos((v) => atualizar(v, l));
      if (registo.current.length < MAX_REGISTO) registo.current.push({ ...l, ...ctx.current });
    });
    return () => {
      void h.then((x) => x.remove());
      void Npn.parar();
    };
  }, []);

  const alternar = async () => {
    setErro('');
    try {
      if (ativo) {
        await Npn.parar();
        setAtivo(false);
      } else {
        await Npn.iniciar({ nome: nome.trim().slice(0, 21) || 'NOB', limite });
        setAtivo(true);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const mudarLimite = (n: number) => {
    setLimite(n);
    if (nativo) void Npn.definirLimite({ limite: n });
  };

  const exportar = () =>
    Npn.partilharCsv({
      texto: paraCsv(registo.current),
      nome: `npn-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`,
    }).catch((e) => setErro(String(e)));

  const agora = Date.now();
  return (
    <div class="pag">
      <div class="topo">
        <a href="#/definicoes" class="chip">←</a>
        <b>NPN (teste)</b>
        <span class="mini">dev</span>
      </div>
      {!nativo && <div class="aviso">Só funciona na app Android.</div>}
      <div class="cartao" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label>Nome deste telemóvel</label>
          <input value={nome} maxLength={21} disabled={ativo} onInput={(e) => setNome(e.currentTarget.value)} />
        </div>
        <div>
          <label>
            Alcance (limite de PERTO): {limite} dBm
          </label>
          <input
            type="range"
            min={LIMITE_MIN}
            max={LIMITE_MAX}
            step={1}
            value={limite}
            onInput={(e) => mudarLimite(Number(e.currentTarget.value))}
          />
          <div class="mini">Entra em PERTO com a mediana ≥ limite; sai 4 dB abaixo.</div>
        </div>
        <div>
          <label>Distância anotada (m), vai para o registo</label>
          <input inputMode="decimal" value={distancia} onInput={(e) => setDistancia(e.currentTarget.value)} />
        </div>
      </div>
      <button class="botao grande" disabled={!nativo} onClick={alternar}>
        {ativo ? 'Parar' : 'Começar a procurar'}
      </button>
      {erro && <div class="aviso">{erro}</div>}

      <div class="cartao">
        <h3>Telemóveis encontrados ({vistos.length})</h3>
        {vistos.length === 0 && <p class="mini">{ativo ? 'A procurar…' : 'Parado.'}</p>}
        {vistos.map((v) => (
          <div key={v.id} class="linha entre" style={{ padding: '6px 0', opacity: agora - v.t > 10000 ? 0.4 : 1 }}>
            <div>
              <b>{v.nome}</b> <span class="mini">#{v.id}</span>
              <div class="mini">
                RSSI {v.rssi} · mediana 3 s {v.mediana} dBm
              </div>
            </div>
            <span class={'chip' + (v.perto ? ' on' : '')}>{v.perto ? 'PERTO' : 'LONGE'}</span>
          </div>
        ))}
      </div>
      <button class="botao sec" disabled={!nativo} onClick={exportar}>
        Exportar registo (CSV) · {registo.current.length}
      </button>
    </div>
  );
}
