// Gera duelo-rabiscos.html a partir dos TSX. Na raiz: node info/desenhos/duelo-rabiscos.gerar.mjs
import { rolldown } from 'rolldown';
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = process.cwd().replaceAll('\\', '/');
const A = raiz + '/src/jogos/duelo-rabiscos/artes/';
const folha = ['lapis', 'dados', 'tabuleiro', 'obstaculos', 'icones', 'magos', 'moldes', 'carta'].map((n) => `export * from '${A}${n}.tsx';`).join('') + `export {h} from 'preact';`;
const b = await rolldown({
  input: 'folha',
  plugins: [{ name: 'folha', resolveId: (i) => (i === 'folha' ? raiz + '/folha.js' : null), load: (i) => (i.endsWith('/folha.js') ? folha : null) }],
});
const { output } = await b.generate({ format: 'esm' });
const m = await import('data:text/javascript,' + encodeURIComponent(output[0].code));
const { h } = m;
const s = (v) => {
  if (v == null || v === false || v === true) return '';
  if (Array.isArray(v)) return v.map(s).join('');
  if (typeof v !== 'object') return String(v);
  if (typeof v.type === 'function') return s(v.type(v.props));
  const at = Object.entries(v.props).filter(([k, x]) => k !== 'children' && k !== 'style' && x != null).map(([k, x]) => ` ${k}="${x}"`).join('');
  if (v.type === 'br') return '<br>';
  return `<${v.type}${at}>${s(v.props.children)}</${v.type}>`;
};
const cx = (n, ...x) => `<figure>${x.join('')}<figcaption>${n}</figcaption></figure>`;
const sec = (t, x) => `<h2>${t}</h2><div class="l">${x.join('')}</div>`;
const par = (C, p) => [96, 48].map((tam) => s(h(C, { ...p, tam }))).join('');
const cabeca = h('g', {}, h('circle', { cx: 50, cy: 52, r: 44, fill: '#fff', stroke: '#999', 'stroke-width': 3, 'stroke-dasharray': '6 6' }), h('text', { x: 50, y: 58, 'text-anchor': 'middle', 'font-size': 18, fill: '#666' }, 'avatar'));
const N = { feridaEspada: 'Ferimento: 1 espada', feridaEscudo: 'Ferimento: bloqueia 1', feridaCoracao: 'Ferimento: cura 1', feridaGema: 'Ferimento: 1 gema', feridaVazio: 'Ferimento: vazio (2 faces)', fazerAlgo: 'Fazer algo', ataqueVazio: 'Ataque: vazio', ataque1: 'Ataque: 1 espada', ataque2: 'Ataque: 2 espadas', defesaVazio: 'Defesa: vazio', defesa1: 'Defesa: bloqueia 1', poca: 'Poça', arvore: 'Árvore', ruina: 'Ruína', trovoada: 'Capa de trovoada', lencol: 'Lençol e véu', pijama: 'Pijama de estrelas', peles: 'Armadura com peles', pedreiro: 'Avental de pedreiro', ilusionista: 'Casaca de ilusionista', sapinho: 'Sapinho Saltitão', dragaozinho: 'Dragãozinho', raposa: 'Raposa Espadachim', velhoPescador: 'Velho Pescador', mumia: 'Múmia', carvalho: 'Carvalho Vivo', guardiao: 'Guardião', barbaro: 'Bárbaro', aceso: 'Aceso para andar' };
const nm = (k) => N[k] ?? k[0].toUpperCase() + k.slice(1);
const svg = (x, w) => `<svg viewBox="-46 -52 92 104" width="${w}">${x}</svg>`;
const obs = Object.keys(m.OBSTACULOS);
const est = (c, l) => ({ '3,3': 'alvo', '2,4': 'aceso', '1,4': 'aceso', '2,5': 'aceso', '3,5': 'aceso', '5,2': 'bloqueado' })[`${c},${l}`] ?? 'normal';
const onde = { '4,1': 0, '1,2': 1, '6,3': 2, '4,4': 3, '5,6': 4, '2,6': 5 };
const dentro = (c, l) => (onde[`${c},${l}`] != null ? h(m.Obstaculo, { tipo: obs[onde[`${c},${l}`]] }) : null);
const chaves = Object.keys;
const html = `<!doctype html><html lang="pt-PT"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Duelo de Rabiscos: artes</title><style>
body{margin:0 auto;max-width:1100px;padding:16px;background:#f6f1e4;color:#2b2a33;font:15px system-ui,sans-serif}h1{margin:0}h2{margin:28px 0 8px;border-bottom:2px solid}
.l{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;padding:10px;background:#fffdf7;border:1px solid #d8d0bd;border-radius:8px;text-align:center}figure svg{margin:0 4px;vertical-align:bottom;max-width:100%}figcaption{margin-top:6px}.t{max-width:700px}${readFileSync(A + 'carta.css', 'utf8')}</style>
<h1>Duelo de Rabiscos: artes</h1><p>Cada arte em grande e a 48 px.</p>${[
  sec('Cartas', chaves(m.MOLDES).map((c) => s(h(m.Carta, { criatura: c, ferimentos: c === 'ogre' ? 1 : 0 })))),
  sec('Cartas dos magos', chaves(m.MAGOS).map((r) => s(h(m.CartaMago, { roupa: r }, cabeca)))),
  sec('Status', chaves(m.ICONES_STATUS).map((c) => cx(nm(c), par(m.Arte, { c: m.ICONES_STATUS[c] })))),
  sec('Dados', chaves(m.DADOS).map((f) => cx(nm(f), par(m.Dado, { face: f })))),
  sec('Hexágonos', chaves(m.HEXAGONOS).map((e) => cx(nm(e), ...[90, 48].map((w) => svg(s(h(m.Hexagono, { estado: e })), w))))),
  sec('Obstáculos (2 versões)', obs.map((t) => cx(nm(t), ...[0, 1].flatMap((v) => [90, 48].map((w) => svg(s(h(m.Hexagono, {}, h(m.Obstaculo, { tipo: t, versao: v }))), w)))))),
  `<h2>Colmeia 8×8</h2><div class="t">${s(h(m.Colmeia, { estado: est, dentro }))}</div>`,
  sec('Magos', chaves(m.MAGOS).map((r) => cx(nm(r), s(h(m.Mago, { roupa: r, tam: 150 }, cabeca)), s(h(m.Mago, { roupa: r, tam: 48 }))))),
  sec('Moldes (tela 400×300)', chaves(m.MOLDES).map((c) => cx(nm(c), s(h(m.Molde, { criatura: c, tam: 220 })), s(h(m.Molde, { criatura: c, tam: 96, cheio: true })), s(h(m.Molde, { criatura: c, tam: 48, cheio: true }))))),
  sec('Classes', chaves(m.ICONES_CLASSE).map((c) => cx(nm(c), par(m.IconeClasse, { classe: c })))),
  sec('Marcas de golpe', chaves(m.MARCAS).map((c) => cx(nm(c), par(m.MarcaGolpe, { marca: c })))),
].join('')}</html>`;
writeFileSync('info/desenhos/duelo-rabiscos.html', html);
