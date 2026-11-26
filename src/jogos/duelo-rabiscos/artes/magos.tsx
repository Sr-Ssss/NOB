import type { ComponentChildren } from 'preact';
import { Riscos, type Camada } from './lapis';

/** quadro 200×330 (o chapéu ocupa y < 30); o avatar (quadrado) entra aqui, entre as costas e a frente */
export const VB_MAGO = '0 -66 200 330';
export const ENCAIXE = { x: 50, y: 12, tam: 100 };
/** ponta da varinha (para efeitos) */
export const PONTA_VARINHA = { x: 184, y: 104 };

const PELE = '#f6e3d0';
const OURO = '#ffe066';
const tunica = (cor: string): Camada => ['M74 109Q100 101 126 109L134 160L160 248Q100 264 40 248L66 160Z', cor, 5];
/** mangas largas em sino */
const mangas = (cor: string, dentro: string): Camada[] => [
  ['M78 110Q50 120 22 178Q42 200 64 196Q70 162 82 148Z', cor, 5],
  ['M22 178Q34 172 46 182Q58 184 64 196Q42 200 22 178Z', dentro, 4],
  ['M122 110Q152 112 184 138Q186 164 164 186Q146 160 120 150Z', cor, 5],
  ['M184 138Q172 150 172 164Q164 172 164 186Q186 168 184 138Z', dentro, 4],
];
const maos: Camada = ['M34 196a10 10 0 1 0 20 0a10 10 0 1 0 -20 0M158 162a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', PELE, 4];
const varinha: Camada[] = [['M163 178L181 114', undefined, 7], ['M184 88L188 100L198 104L188 108L184 119L179 108L169 104L179 100Z', '#fff0a0', 4]];
/** faixa na cintura com fivela */
const faixa = (cor: string): Camada[] => [['M66 160Q100 170 134 160L138 176Q100 186 62 176Z', cor, 4], ['M92 163L108 163L108 183L92 183Z', OURO, 4]];
const bico = (cor: string): Camada => ['M56 24Q74 -8 92 -42Q100 -62 126 -56Q116 -44 120 -30Q130 -4 144 24Z', cor, 5];
const aba = (cor: string): Camada => ['M36 26Q100 4 164 26Q170 36 150 36Q100 24 50 36Q30 36 36 26Z', cor, 5];
const fita = (cor: string): Camada => ['M64 8Q100 -2 136 8L142 22Q100 10 58 22Z', cor, 4];

export const MAGOS = {
  trovoada: {
    costas: [['M74 108Q20 160 8 238L30 230L40 250L60 236L80 254L100 238L120 254L140 236L160 250L170 230L192 238Q180 160 126 108Z', '#6f78b5', 5]],
    frente: [tunica('#9aa4dc'), ...mangas('#9aa4dc', '#5f6699'), ...faixa('#5f6699'), maos, ['M60 122Q54 108 70 106Q76 96 90 104Q100 96 112 104Q126 96 130 107Q146 110 140 122Q100 134 60 122Z', '#eef0fa', 5], ['M108 134L88 156L100 156L94 176M70 214L60 232L70 230L64 246M134 208L126 228L138 226L132 244', OURO, 4], ['M104 190L84 220L98 220L90 248L118 212L103 212L114 190Z', OURO, 4]],
    chapeu: [bico('#6f78b5'), fita('#eef0fa'), aba('#6f78b5'), ['M106 -44L92 -18L104 -18L96 2L120 -26L108 -26L116 -44Z', OURO, 4]],
  },
  lencol: {
    costas: [['M100 2Q152 2 156 70Q164 150 190 214Q176 208 166 224L34 224Q24 208 10 214Q36 150 44 70Q48 2 100 2Z', '#e0d6f0', 5]],
    frente: [['M74 109Q100 101 126 109L134 160L160 240Q150 254 138 242Q126 230 114 246Q100 260 88 246Q76 232 64 244Q50 254 40 240L66 160Z', '#fbf9ff', 5], ...mangas('#fbf9ff', '#d3c7e8'), maos, ['M66 160Q100 172 134 160M62 174Q100 186 138 174M74 184L66 222M126 184L134 222', undefined, 3], ['M108 116Q90 118 92 134Q98 146 112 142Q100 134 108 116Z', '#c9b8ea', 4], ['M100 194L104 206L116 210L104 214L100 226L96 214L84 210L96 206Z', '#c9b8ea', 4]],
    chapeu: [bico('#fbf9ff'), fita('#c9b8ea'), aba('#fbf9ff'), ['M36 28Q22 60 30 96M164 28Q178 60 170 96', undefined, 4], ['M108 -34a6 6 0 1 0 12 0a6 6 0 1 0 -12 0M94 -14a5 5 0 1 0 10 0a5 5 0 1 0 -10 0', '#c9b8ea', 3]],
  },
  pijama: {
    costas: [],
    frente: [tunica('#8fb4e6'), ['M48 248Q44 262 66 262L96 262L96 254ZM152 248Q156 262 134 262L104 262L104 254Z', '#f5c6d6', 5], ...mangas('#8fb4e6', '#f5c6d6'), maos, ['M82 108L100 130L118 108', undefined, 5], ['M66 160Q100 170 134 160L136 170Q100 180 64 170Z', '#f5c6d6', 4], ['M104 174L92 206M106 174L112 208', undefined, 5], ['M82 132l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1ZM132 196l4 7 8 1-6 6 2 8-8-4-7 4 1-8-6-6 8-1ZM68 222l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z', '#fff0a0', 3], ['M72 186Q62 194 68 206Q78 210 84 200Q72 200 72 186ZM106 222Q98 230 103 240Q112 243 118 235Q106 235 106 222ZM116 130Q108 136 113 146Q121 148 125 141Q116 141 116 130Z', '#fff0a0', 3]],
    chapeu: [['M54 22Q66 -40 112 -48Q168 -46 178 22Q168 8 158 12Q150 -14 134 -14Q140 4 146 22Z', '#8fb4e6', 5], ['M162 26a14 14 0 1 0 28 0a14 14 0 1 0 -28 0', '#fffdf2', 5], ['M46 16Q100 4 154 16Q162 34 148 36Q100 24 52 36Q38 34 46 16Z', '#f5c6d6', 5], ['M100 -34l4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1Z', '#fff0a0', 3]],
  },
  peles: {
    costas: [['M66 108Q30 170 28 244L172 244Q170 170 134 108Z', '#94714f', 5]],
    frente: [tunica('#a8554a'), ['M40 248L46 226L58 236L70 226L84 238L100 228L116 238L130 226L142 236L154 226L160 248Q100 264 40 248Z', '#d9b88f', 5], ...mangas('#a8554a', '#d9b88f'), ['M76 128Q100 138 124 128L130 162Q100 178 70 162Z', '#cdd3d8', 5], ['M100 134L100 170M76 148Q100 158 126 148', undefined, 3], ...faixa('#6e4f36'), maos, ['M52 128L44 116L54 114L54 102L66 108L74 98L84 108L94 100L100 110L108 100L118 108L128 98L134 108L146 102L146 114L156 116L148 128L138 122L130 136L122 124L112 136L102 126L90 136L80 124L70 136L62 122Z', '#d9b88f', 5], ['M100 196L112 212L100 228L88 212ZM100 204L100 220', OURO, 4]],
    chapeu: [bico('#a8554a'), ['M40 34L34 22L46 18L48 6L62 12L72 2L84 10L100 0L114 10L128 2L138 12L152 6L154 18L166 22L160 34L148 28L138 38L124 28L112 36L100 28L88 36L76 28L62 38L52 28Z', '#d9b88f', 5], ['M106 -36L116 -24L106 -12L96 -24Z', '#cdd3d8', 4]],
  },
  pedreiro: {
    costas: [],
    frente: [tunica('#d98b5f'), ['M44 232L156 232M50 216L68 216M132 216L150 216M60 232L58 252M140 232L142 252M100 232L100 258M80 248L120 250M44 244L80 248M120 250L158 244', undefined, 3], ...mangas('#d98b5f', '#8f5a3c'), ['M82 112L86 136M118 112L114 136', undefined, 5], ['M84 134L116 134L122 162L138 168L142 222Q100 234 58 222L62 168L78 162Z', '#e8c08a', 5], ...faixa('#8f5a3c'), maos, ['M76 190L124 190L122 220L78 220Z', '#f2d7ae', 4], ['M112 200L90 206L112 212ZM100 190L88 178', '#e6e9ec', 4], ['M100 140l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z', OURO, 3]],
    chapeu: [bico('#b5674a'), ['M70 0L130 0M84 -22L122 -22M96 -44L118 -44M100 0L100 -22M80 0L78 16M122 0L124 16M108 -22L106 -44', undefined, 3], ['M60 14Q100 0 140 14L144 24Q100 10 56 24Z', '#e8c08a', 4], aba('#d98b5f')],
  },
  ilusionista: {
    costas: [['M74 108Q30 164 18 246L62 232L100 190L138 232L182 246Q170 164 126 108Z', '#5d3566', 5]],
    frente: [tunica('#f0e2f5'), ['M76 109L94 106L84 254Q58 254 40 248L66 160ZM124 109L106 106L116 254Q142 254 160 248L134 160Z', '#a868a8', 5], ...mangas('#a868a8', OURO), maos, ['M66 134L88 160L86 172L64 168M134 134L112 160L114 172L136 168', undefined, 4], ['M82 112L100 121L118 112L118 132L100 124L82 132Z', OURO, 4], ['M100 144L100 145M100 162L100 163M100 180L100 181', undefined, 7], ['M66 200l6 10-6 10-6-10ZM134 200l6 10-6 10-6-10ZM70 228l5 8-5 8-5-8ZM130 228l5 8-5 8-5-8ZM100 204l8 12-8 12-8-12Z', OURO, 3]],
    chapeu: [bico('#a868a8'), fita(OURO), aba('#5d3566'), ['M104 -30l7 10-7 10-7-10Z', OURO, 4], ['M140 -44l3 8 8 3-8 3-3 8-3-8-8-3 8-3ZM62 -24l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z', '#fff0a0', 3]],
  },
} satisfies Record<string, { costas: Camada[]; frente: Camada[]; chapeu: Camada[] }>;
export type RoupaMago = keyof typeof MAGOS;

/** `children` = avatar, p. ex. <Boneco18 n={n} tam={ENCAIXE.tam} /> */
export function Mago({ roupa, tam = 96, chapeu = true, children }: { roupa: RoupaMago; tam?: number; chapeu?: boolean; children?: ComponentChildren }) {
  const m = MAGOS[roupa];
  return (
    <svg class="dr-mago" viewBox={VB_MAGO} width={tam} height={tam * 1.65} aria-hidden="true">
      <Riscos c={m.costas} />
      <g transform={`translate(${ENCAIXE.x} ${ENCAIXE.y})`}>{children}</g>
      <Riscos c={m.frente} />
      <Riscos c={varinha} />
      {chapeu && <Riscos c={m.chapeu} />}
    </svg>
  );
}
