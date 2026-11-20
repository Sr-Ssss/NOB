# Fases do feedback de 20/11/2026 (1.º teste real: Se Vira!)

Uma sessão por fase, por ordem. O utilizador diz quando lançar a seguinte.
Estado: ⬜ por fazer · 🟡 em curso · ✅ feito.

## Fase 1 — Se Vira! ✅ (20/11; detalhes em `info/PROXIMA_SESSAO.md`)
- **"Terminar apresentação"**: no último slide, o apresentador pode acabar antes do tempo (passa logo à Nota).
- **Slides sempre com imagem**: o objetivo é não haver slides só de texto.
  - Todos os slides sem imagem do jogador levam um GIF/foto automático (GIPHY; Pexels se houver chave).
  - Combinações válidas: imagem + legenda, imagem + tópico, imagem + citação, imagem + gráfico, imagem + conclusão.
  - **Lista = 1 tópico só** (já não são 3).
  - Cada apresentação tem **pelo menos 1 de cada tipo** (foto, gráfico, citação, tópico, conclusão); o resto é sorteado.
  - Se a pesquisa falhar: tentar outro termo antes de cair no emoji.
- **Pexels**: o código já a suporta, mas falta `VITE_PEXELS_KEY` no `.env` e em `.github/workflows/pages.yml`. A chave é grátis (pexels.com/api) e é o utilizador que a cria.
- Também da auditoria (se ainda não estiver feito): aviso "o teu deck pode não ser apresentado" e ⓘ no telemóvel.

## Fase 2 — Lobby, menus e escolher jogo ✅ (20/11; detalhes em `info/PROXIMA_SESSAO.md`)
- Tela inicial: ⚙️ só a engrenagem, no canto superior esquerdo; "Como jogar" = um livro com "?".
- "Criar party" cria logo. Sem o botão "Eu tenho TV".
- **TV escolhida pelo líder**: na lista de jogadores, "tornar TV" (pode ser ele próprio), com um popup a explicar para que serve e que essa pessoa sai do jogo, + Cancelar / Confirmar.
- Código da party: tocar → popup com QR + código + ✕. O "Fechar party" passa a ser só um 🔒 ao lado do código.
- Tocar em "Líder" (em cima) → lista da sala → escolher o novo líder (o atual deixa de ser).
- Bot: botão "+🤖" a seguir ao último jogador (ou por baixo, se não couber).
- Botão "Escolher jogo": outra cor, outro emoji, outra apresentação.
- Menu de jogos sem filtros: os disponíveis em cima, ordenados por tempo de jogo; os indisponíveis no fim.
- Tocar num jogo → popup com o vídeo tutorial; ⚙️ no canto superior esquerdo abre as opções num 2.º popup por cima; caixa "Mostrar tutorial a todos"; "Jogar".
- Depois de "Jogar": quem está pronto + Cancelar + Forçar início.
- Antes de cada jogo, em todos os ecrãs: nome do jogo + barra de 5 s (pré-carrega os assets) → tutorial, se escolhido (com TV: só na TV).
- Menos botões para o líder em geral.

## Fase 3 — TV e ecrã ligado ✅ (20/11; detalhes em `info/PROXIMA_SESSAO.md`)
- TV: tudo cabe num ecrã, sem scroll e sem mudar de ecrã (ver todos os jogos na TV, 16:9, 720p e 1080p).
- Manter o ecrã ligado na TV e nos telemóveis (Screen Wake Lock API; no APK, `FLAG_KEEP_SCREEN_ON`; voltar a pedir quando a app volta ao primeiro plano).
- Menos toques e menos scroll em toda a app.

## Fase 4 — 50/50: frases ✅ (20/11; detalhes em `info/PROXIMA_SESSAO.md`)
- As frases não fazem sentido ou pedem palavras muito específicas. Rever `conteudo/` do 50/50: frases mais gerais, que aceitem muitas respostas.

## Fase 5 — Modos que faltam ✅ (20/11; detalhes em `info/PROXIMA_SESSAO.md`)
- "Escolher aleatório" (jogo sorteado), torneio (vários jogos seguidos com pontos somados), etc. Planear com o utilizador primeiro.
- Decidido com o utilizador (20/11):
  - **Aleatório**: o líder marca os jogos que podem sair (por defeito todos os que dão agora); roleta curta (~3 s) em todos os ecrãs; depois o "Preparar" normal.
  - **Torneio**: 3 ou 5 jogos sorteados, sem repetir, dos mesmos jogos marcados; roleta antes de cada um.
  - **Pontos**: por lugar em cada jogo — 1.º = nº de jogadores, 2.º = n−1… (empates partilham o lugar).
  - **Entre jogos**: placar geral ("Jogo 2 de 5", pontos ganhos) + "Próximo jogo" do líder. **No fim**: pódio do torneio + Menu.
  - Se o jogo sorteado deixar de dar (mudou o nº de jogadores): sorteia outro que dê; se nenhum der, acaba com o pódio.
  - Outros modos: nenhum por agora.

# Feedback de 20/11/2026 (2.ª ronda, depois do 1.º teste real)
Ordem (máx. 2 sessões ao mesmo tempo): Ronda A = Fase 6 ∥ Fase 9 · Ronda B = Fase 8 (sozinha: mexe em todas as `regras.ts` e no `sala.ts`) · Ronda C = Fase 7 + 11 ∥ Fase 10.

## Fase 6 — Revolução das Máquinas + barra de "segurar" ✅ (20/11; detalhes em `info/PROXIMA_SESSAO.md`)
- O jogo só começa depois de todos terem visto a identidade pelo menos 1 vez.
- Todos os botões "segurar para ver" (todos os jogos; `src/ui/acessibilidade.ts`, `chaveSegurar`): barra amarela/laranja enche o botão enquanto se segura, até ao fim.
- Medidores de pressão ("velocímetros") mais pequenos ou numa barra de lado fora das fases de conversar/votar.
- A carta parece mais uma carta: fundo mais apagado, bordas mais à vista (design de cada carta fica para depois).

## Fase 7 — "À espera" e mensagens repetidas ✅ (20/11; detalhes em `info/PROXIMA_SESSAO.md`)
- À espera de alguém responder: trocar o ✗ (parece um "não") por um balão de pensamento com 3 pontinhos que pulam em onda, param e repetem (estilo WhatsApp). Em todos os jogos.
- Mensagens repetidas no telemóvel (ex.: "Conversem, olhem para a TV" 2+ vezes): procurar e corrigir em todos os jogos.

## Fase 8 — Bots com "IA jogável" ✅ (20/11; detalhes em `info/PROXIMA_SESSAO.md`)
- Lobby: tocar num bot → menu com Expulsar + interruptor "IA jogável" (ligado por defeito; por bot; bolinha verde = ligada, cinzenta = desligada).
- IA ligada: o bot joga sozinho em todos os jogos — escolhe ao acaso entre as opções; em textos manda o texto que já existe, uma palavra ao acaso ou um placeholder; não desenha. Simples, não precisa de jogar bem. Objetivo: testar sem o líder jogar por cada bot.
- IA ligada: o líder já não pode "jogar como" esse bot.
- Sai a aba "Jogando como bot X / voltar a eu".
- Ver como os bots funcionam hoje (`src/core/sala.ts`, `regras.ts` de cada jogo).

## Fase 9 — Página inicial + "Acabar partida" ✅ (20/11; detalhes em `info/PROXIMA_SESSAO.md`)
- Início (`src/main.tsx`): "Como jogar" (📖?) passa para o canto superior esquerdo.
- Dentro dos jogos, só o líder: junto do "Como jogar"/ⓘ, "Acabar partida" → "Tem certeza que deseja acabar a partida? O progresso será perdido" + Sim / Não. Sim → volta ao lobby/menu.

## Fase 10 — Todos os jogos sem TV ✅ (20/11; detalhes em `info/PROXIMA_SESSAO.md`)
- Todos os jogos jogáveis só com telemóveis. Os que hoje têm `precisaTv` (`src/core/jogos.ts`: Se Vira!, Ragerob) passam a funcionar sem TV.
- Decisões (20/11): Se Vira! sem TV → o slide atual aparece em todos os telemóveis, sincronizado com o apresentador (+ reações). Ragerob sem TV → cada telemóvel mostra a arena pequena por cima dos controlos.

## Fase 11 — O Rei e o Dragão ✅ (20/11; detalhes em `info/PROXIMA_SESSAO.md`)
- Tirar o botão de identidade ("mostrar carta" já a revela).
- Sem TV: não mostrar as torres durante o tempo de conversa.
