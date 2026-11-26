/**
 * Os olhos a piscar, com um relógio só para a página: põe `pisca` num boneco durante um instante.
 * Uma animação CSS infinita por boneco obrigava a TV a repintar em todos os frames, mesmo com os olhos parados.
 */
const ALVOS = '.boneco18, .logo-o, .rr-olhos';

export function comecarAPiscar(): () => void {
  let espera = 0;
  let volta = 0;
  const pisca = () => {
    espera = window.setTimeout(pisca, 900 + Math.random() * 1400);
    if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const todos = [...document.querySelectorAll(ALVOS)].filter((e) => !e.closest('.sem-anim, :disabled'));
    const e = todos[Math.floor(Math.random() * todos.length)];
    if (!e) return;
    e.classList.add('pisca');
    volta = window.setTimeout(() => e.classList.remove('pisca'), 150);
  };
  espera = window.setTimeout(pisca, 1500);
  return () => {
    clearTimeout(espera);
    clearTimeout(volta);
    document.querySelectorAll('.pisca').forEach((e) => ALVOS.split(', ').some((s) => e.matches(s)) && e.classList.remove('pisca'));
  };
}
