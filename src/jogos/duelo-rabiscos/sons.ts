/** Sons do Duelo, feitos na hora (Web Audio, sem ficheiros): dados a rolar e o golpe. Se o browser não deixar, fica calado. */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** um "toc" curto: frequência, início (s) e volume */
function toc(a: AudioContext, freq: number, quando: number, vol: number, dura = 0.06, tipo: OscillatorType = 'triangle') {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(freq, a.currentTime + quando);
  g.gain.setValueAtTime(vol, a.currentTime + quando);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + quando + dura);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + quando);
  o.stop(a.currentTime + quando + dura);
}

/** dados a rolar: toques secos que abrandam */
export function somDados(): void {
  const a = audio();
  if (!a) return;
  for (let i = 0; i < 7; i++) toc(a, 700 + ((i * 137) % 500), i * 0.05 + i * i * 0.006, 0.12);
}

/** o golpe: grave a descer; `caiu` = alguém caiu (mais forte) */
export function somGolpe(caiu: boolean): void {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(caiu ? 220 : 160, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(50, a.currentTime + 0.3);
  g.gain.setValueAtTime(caiu ? 0.2 : 0.1, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.35);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + 0.36);
}
