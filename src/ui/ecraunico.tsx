import type { ComponentChildren } from 'preact';

/**
 * Modo sem TV: um só ecrã (sem separadores "Eu / Painel").
 * - Quando tenho algo a fazer: a minha ação (+ `Progresso` de quem já fez).
 * - Quando estou à espera: uma frase curta em cima e, por baixo, o que a TV mostraria (`palco`).
 * Com TV, "à espera" é só a frase (a TV mostra o resto).
 */
export function Espera({ semTv, texto, palco }: { semTv: boolean; texto: ComponentChildren; palco?: ComponentChildren }) {
  if (!semTv || !palco) return <div class="cartao centro">{texto}</div>;
  return (
    <>
      <p class="espera-faixa" role="status">
        {texto}
      </p>
      <div class="palco-tel">{palco}</div>
    </>
  );
}

/** "✅ 3/5": quem já fez a sua parte (o que a TV mostra nas caixinhas), em pequeno */
export function Progresso({ semTv, feitos, ids }: { semTv: boolean; feitos: string[]; ids: string[] }) {
  if (!semTv || !ids.length) return null;
  const n = ids.filter((id) => feitos.includes(id)).length;
  return (
    <p class="progresso-tel" role="status">
      ✅ {n}/{ids.length}
    </p>
  );
}
