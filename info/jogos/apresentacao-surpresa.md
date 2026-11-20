# Apresentação Surpresa ✅ planeado
Um jogador de cada vez apresenta na TV slides que nunca viu; os outros dão nota.

- Jogadores: 3–16. Com mais de 8, o padrão é "apresentam 8 sorteados" (o VIP pode escolher "todos").

## Definições (VIP)
| Opção | Valores | Padrão |
|---|---|---|
| Tempo de apresentação | 60 · 90 · 120 s | 90 s |
| Nº de slides | 4 · 6 · 8 | 6 |
| Quem apresenta | Todos · 8 sorteados | ≤8: todos; >8: sorteados |

## Fluxo
1. **Preparar (60 s)**: cada jogador recebe o tema de outra pessoa (derangement, sem saber de quem).
   - O título sorteado vem por defeito e pode ser editado.
   - Até 3 imagens: da galeria, de uma pesquisa GIPHY ou de um link colado.
   - Enviar + caixinha ✅/❌. Quem não enviar fica com o tema sorteado.
   - Se nem todos apresentam (8 sorteados), o telemóvel avisa "Só N de M apresentam: o seu deck pode não ser apresentado".
   - ⓘ no topo do telemóvel: resumo das regras.
2. Para cada apresentador:
   - **Tema** (10 s);
   - **Apresentar** (padrão 90 s): ◀ ▶ no telemóvel; os outros mandam reações 😂 👏 🤯 😴 que voam na TV;
     - no último slide, o ▶ do apresentador passa a **"Terminar apresentação"** (🏁): acaba antes do tempo e passa logo à Nota (ação `sv_terminar`, só do apresentador e só no último slide);
   - **Nota** (12 s): 1–5 ⭐, ninguém se avalia a si próprio; caixinha ✅/❌.
3. Pódio.

## Slides (feedback de 20/11: nada de slides só de texto)
- **Todos os slides têm imagem** + um texto. Combinações: imagem + legenda absurda ("foto"), imagem + gráfico absurdo, imagem + citação inventada, imagem + **1 tópico**, imagem + conclusão (1 palavra gigante).
- A imagem é a do jogador (até 3, obrigatórias, em posições sorteadas fora da conclusão) ou uma automática (GIPHY; Pexels se houver chave), com um termo diferente em cada slide do deck.
- Se a pesquisa não der nada: a outra fonte, depois outro termo ("funny", "office"); só no fim o emoji grande. Uma imagem que não carrega também cai no emoji.
- Cada apresentação tem **pelo menos 1 de cada tipo**; o resto é sorteado (`baralhar`, com o sal). Com 4 slides não cabem os 5: conclusão + 3 tipos diferentes sorteados. O último é sempre a conclusão.
- TV: "foto" = imagem grande + legenda por baixo; os outros = imagem à esquerda (42%) e texto à direita. Cabe em 16:9 (720p e 1080p) sem scroll.

## Imagens (só links, nada guardado na app)
- GIPHY e Pexels: pesquisados pela API e mostrados pelo link direto. As que o jogo sorteia usam classificação **G**. O selo "Powered by GIPHY" tem de aparecer.
- Link colado pelo jogador: usado tal como está, sem filtro.
- Galeria: reduzida no telemóvel para WebP de 800 px (≤100 KB) e enviada pelo canal da sala diretamente para a TV. Não fica guardada em lado nenhum.
- **Sem TV** (feito 20/11, Fase 10): o slide atual aparece em todos os telemóveis (apresentador e plateia), sincronizado com o ◀ ▶ do apresentador, com as reações a voar por cima. A imagem da galeria do slide atual vai pelo canal privado, cifrada para cada telemóvel (`privadoSevira`; nunca aos bots); as reações vão na vista, sem quem reagiu. Sem TV, o tema aparece no cartão "Vai apresentar".
- Chaves grátis GIPHY + Pexels: criadas pelo utilizador. `VITE_GIPHY_KEY` já existe; `VITE_PEXELS_KEY` está vazia no `.env` e em `.github/workflows/pages.yml` até o utilizador criar a chave (pexels.com/api).

## Pontos
- Só o apresentador pontua: média das ⭐ × 200 (até 1000) + 5 por reação (até +200).

## Visual — "reunião de escritório"
- **TV**: fundo com as **cores da app** (azul-noite #26215C, como o 50/50); no centro, slide branco "sério" de empresa (cantos retos, letra limpa) com conteúdo absurdo; topo "Reunião urgente · <nome>" + timer; reações a voar por baixo.
- **Telemóvel** (cores da app, código em baixo):
  - **Preparar**: título sorteado editável (✎) + 3 quadrados "+" para imagens (Galeria · GIPHY · Link) + Enviar;
  - **Apresentador**: "Slide 3 de 6" + botões ◀ ▶ gigantes;
  - **Plateia**: 4 reações grandes (😂 👏 🤯 😴);
  - **Nota**: **slider vertical**; à **esquerda**, 5 níveis, cada um com **uma só estrela** e um **tracinho** a marcar a posição na barra; estrelas acima da nota escolhida ficam **cinzentas**; a barra só tem cor **por baixo** do slider (degradê **vermelho em baixo → verde em cima**, até à posição) e fica **cinzenta por cima**; o slider só para nas estrelas: largado entre duas, **volta à estrela anterior** (arredonda para baixo); botão "Enviar nota".

## Conteúdo
- 150 títulos família, 200 legendas, 150 tópicos, 80 citações, 120 rótulos de gráfico.
