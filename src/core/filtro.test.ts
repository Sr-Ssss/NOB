import { describe, expect, it } from 'vitest';
import { filtrarTextos, limparTexto } from './filtro';
import { novaSala, reduzSala, type EstadoSala } from './sala';
import { DEF_PADRAO_SEVIRA } from '../jogos/se-vira/regras';

describe('filtro de palavrões', () => {
  it('troca a palavra inteira por estrelas; o resto fica igual', () => {
    expect(limparTexto('Que merda de pergunta!')).toBe('Que ★★★★★ de pergunta!');
    expect(limparTexto('What the FUCKING hell')).toBe('What the ★★★★★★ hell');
    expect(limparTexto('caralhooo')).toBe('★★★★★★');
    expect(limparTexto('sh1t')).toBe('★★★★');
  });

  it('não apanha palavras normais (nem as que mudam de sentido entre PT e BR)', () => {
    for (const s of ['O puto está na bicha', 'Shitake? Não, cogumelo', 'circunstância', 'Scunthorpe', 'cabra no monte', 'um pinto amarelo', 'computador']) {
      expect(limparTexto(s)).toBe(s);
    }
  });

  it('nas ações: só o texto livre, nunca ids, tipos ou endereços', () => {
    const a = filtrarTextos({ tipo: 'jogo', acao: { tipo: 'enviar', id: 'merda', texto: 'merda?', a: 'sim', b: 'porra', fraseId: 'cu' } });
    expect(a).toEqual({ tipo: 'jogo', acao: { tipo: 'enviar', id: 'merda', texto: '★★★★★?', a: 'sim', b: '★★★★★', fraseId: 'cu' } });
    expect(filtrarTextos({ tipo: 'jogo', acao: { tipo: 'pistas', id: 'x', pistas: ['sol', 'shit', 'mar'] } }).acao.pistas).toEqual(['sol', '★★★★', 'mar']);
  });

  it('no host: o nome de quem entra também passa', () => {
    const s = reduzSala(novaSala('ABCD', 'pt-BR'), { tipo: 'entrar', id: 'j1', nome: 'Porra', avatar: 1, tag: 't' }, 0);
    expect(s.jogadores[0].nome).toBe('★★★★★');
  });
});

describe('Se Vira!: links colados', () => {
  function sevira(links: boolean): EstadoSala {
    let s = novaSala('ABCD', 'pt-BR');
    for (let i = 1; i <= 3; i++) s = reduzSala(s, { tipo: 'entrar', id: `j${i}`, nome: `N${i}`, avatar: i, tag: `t${i}` }, 0);
    s = reduzSala(s, { tipo: 'definir_sevira', id: 'j1', def: { ...DEF_PADRAO_SEVIRA, links } }, 0);
    return reduzSala(s, { tipo: 'comecar', id: 'j1', jogo: 'sevira' }, 0);
  }
  const link = { tipo: 'jogo', acao: { tipo: 'sv_imagem', id: 'j2', i: 0, img: { tipo: 'link', url: 'https://exemplo.pt/a.png' } } } as const;

  it('desligados por defeito: o host recusa', () => {
    expect(DEF_PADRAO_SEVIRA.links).toBe(false);
    const s = sevira(false);
    expect(reduzSala(s, link, 1).sevira!.rascunhos.j2).toBeUndefined();
  });

  it('se o líder ligar, passam', () => {
    const s = sevira(true);
    expect(reduzSala(s, link, 1).sevira!.rascunhos.j2?.[0]).toEqual({ tipo: 'link', url: 'https://exemplo.pt/a.png' });
  });
});
