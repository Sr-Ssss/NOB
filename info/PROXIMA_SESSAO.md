# Próxima sessão

## 16/11/2026 — Revolução das Máquinas (jogo 7)
- `src/jogos/revolucao-maquinas/`: `regras.ts` (reducer puro), `tv.tsx`, `telemovel.tsx` (Eu/Painel sem TV; Identidade a segurar 3 s), `comuns.tsx` (`Consola`: 2 manómetros + bateria das falhas + fila de postos; `Segurar`), `definicoes.tsx`, `maquinas.css`, `demo.tsx`.
- Canal privado: o mesmo do Pirata (`privadoSala` → `privadoMaquinas`: papel, aliados, IA, mão de cartas, veto, resultado do 🔍/👀). Pirata intacto.
- Sala: `EstadoSala.maquinas`/`defMaquinas`, `definir_maquinas`, `comecar` com `jogo: 'maquinas'`; ações `rm_*` (`rm_seguir` só o líder). Catálogo: `feito: true`, 5–10, com e sem TV.
- Decisões do utilizador: 45 s por escolha (sem escolha = sorteio; voto em falta = Não; veto sem resposta = recusado); discussão 60 s (30 s–3 min) + "Seguir" do líder; pontos: equipa +1000, IA vencedora +500, **+100 por carta da sua cor que entra com você no governo** (Comandante e Piloto).
- Decisões tomadas sem o utilizador (o utilizador deixou ao meu critério ou não perguntei; confirmar): depois de 3 falhas ninguém fica bloqueado; se não houver ninguém elegível, ignoram-se os bloqueios; a votação acaba quando todos os vivos votam; voto só uma vez; "votos revelados" 6 s, "entrou a carta" 5 s, resultado do 🔍/👀 10 s (o Comandante pode tocar OK); 🔍 mostra a IA como 🔴 Amotinado; 👀 não tira as cartas; 📢 a rotação continua a seguir ao Comandante normal; veto aceite → falha +1 e discussão; pausa abaixo de 3 ligados; a carta de caos não dá pontos nem poder.
- Conteúdo: o jogo não precisa (só textos em `src/i18n/`, pt-BR + en).
- Testes: `regras.test.ts` (16) + `sala.test.ts` (2). 202 verdes; tsc e lint a 0.
- Verificado no browser: partida inteira sem TV (líder + 4 bots, Supabase real), jogada com um ciclo que toca nos botões de cada um: governos rejeitados e aprovados, sessão secreta, 👀 Espiar, até ao fim (Amotinados ganharam; IA 1700 = 1000 + 500 + 2 cartas). Com TV: só pela demo.
- Capturas: `info/progresso/7-revolucao-maquinas/` (rota dev `#/demo-maquinas?fase=carta|nomear|votar|votos|comandante|piloto|poder|ver|discussao|fim&ecra=tv|tel[&eu=j1][&id=1][&semtv=1][&zoom=1.2136]`; Edge headless com `--user-data-dir` próprio, senão fica pendurado).
- APK `NOB_v0.2.0.apk` (versionCode 200) foi feito **antes** deste jogo; o jogo 7 ainda não está no GitHub nem num APK.
- Próximo: jogo 8, O Rei e o Dragão.

## 16/11/2026 — Pirata (jogo 6)
- `src/jogos/pirata/`: `regras.ts` (reducer puro), `tv.tsx` (com voz `speechSynthesis`), `telemovel.tsx` (Eu/Painel sem TV; botão Identidade a segurar 3 s), `comuns.tsx` (`Barco`, `Diario`, `Conves` + prancha, `Revelacao`, `Palco`), `definicoes.tsx`, `pirata.css`, `demo.tsx`.
- **Canal privado (para os jogos 7 e 8)**: `src/core/privado.ts`. Um canal por jogador `p:<código>:<tag>` (a tag nunca vai na vista).
  - Host: `EmissorPrivado` (em `useHost`) abre/fecha os canais e só envia quando muda.
  - Telemóvel: `usePrivados(codigo, {id: tag}, versao)` volta a pedir quando a fase muda (recupera mensagens perdidas). O líder também ouve os canais dos seus bots.
  - Sem TV: `privadoDe` lê direto do estado.
  - Um jogo novo só tem de devolver os dados em `privadoSala` (`src/core/sala.ts`) e lê-los com a prop `privadoDe` do `Ecra`.
  - Limite: um cliente modificado podia ler as tags nas mensagens `entrar` (públicas). Para segredo a sério: ECDH + AES-GCM (por fazer).
- Sala: `EstadoSala.pirata`/`defPirata`, `definir_pirata`, `comecar` com `jogo: 'pirata'`; ações `pr_noite`, `pr_votar`, `pr_levar`, `pr_votar_ja` (só o líder). Catálogo: `feito: true`, 5–16, com e sem TV.
- Decisões do utilizador: votação do dia = mais votado ("Ninguém" conta; empate no topo = ninguém sai); noite sem escolha dos piratas = ninguém morre; Artilheiro sem escolha em 20 s = não leva ninguém; carta 20 s; visual A + B + C aprovado.
- Decisões tomadas sem o utilizador (confirmar):
  - amanhecer 10 s, resultado do dia 8 s, ecrã do disparo do Artilheiro 8 s;
  - a votação acaba mais cedo quando todos os vivos votaram; voto só uma vez;
  - os piratas sabem quem são os outros piratas (na Identidade); podem escolher outro pirata;
  - só o Médico se pode escolher a si próprio; o Artilheiro também vigia à noite, mas não conta para a vigia;
  - o Artilheiro escolhe depois do amanhecer (ou do resultado do dia); vê-se o fim só depois;
  - pausa abaixo de 3 ligados; sem som do mar (os sons ainda não têm fonte decidida).
- Conteúdo: o jogo não precisa de conteúdo (só textos da interface em `src/i18n/`).
- Testes: `regras.test.ts` (15) + `sala.test.ts` (5, inclui o canal privado com canais falsos). 184 verdes; tsc e lint a 0.
- Verificado no browser (Supabase real, TV + líder + 4 bots): cada um recebe só o seu papel, ao trocar para um bot vê-se o papel dele, noite → amanhecer (Vigia e vigia dos marinheiros certas) → discussão ("Votar já") → votação → prancha → fim com papéis e pontos. Na 1.ª tentativa um resultado privado não chegou; daí o "voltar a pedir" ao mudar de fase.
- Capturas: `info/progresso/6-pirata/` (rota dev `#/demo-pirata?fase=carta|noite|amanhecer|artilheiro|disparo|discussao|votar|resultado|fim&ecra=tv|tel[&eu=j1][&id=1][&semtv=1][&zoom=1.2136]`; Edge headless).
- Próximo: jogo 7, Revolução das Máquinas (visual por decidir: propor 2–3).

## 16/11/2026 — Ideias Mirabolantes (jogo 5)
- `src/jogos/ideias-mirabolantes/`: `regras.ts` (reducer puro), `tv.tsx`, `telemovel.tsx` (Eu/Painel sem TV), `comuns.tsx` (`Planta`, `Barras`, `Palco`), `definicoes.tsx`, `conteudo.ts` (lê `conteudo/ideias-mirabolantes.json`: 200 problemas), `ideias.css`, `demo.tsx`.
- Canvas: `pintar`/`Quadro`/`Tela` têm `planta` (papel azul quadriculado; o preto passa a branco). Por omissão nada muda (Mona Lixa intacta).
- Sala: `EstadoSala.ideias`/`defIdeias`, `definir_ideias`, `comecar` com `jogo: 'ideias'`; ações `im_problema`, `im_invencao`, `im_etapa`, `im_acabei`, `im_investir`. Catálogo: `feito: true`, com e sem TV; os a mais de 16 ficam na audiência.
- Decisões do utilizador: visual "planta" aprovado; pitch acaba no tempo ou com "Acabei" na última etapa; investir numa só fase de 30 s no fim, notas não postas perdem-se, acaba cedo quando todos confirmam as 3; empate = todos os empatados +1000 e os autores dos problemas +300; todos escrevem problema e investem (audiência sem pontos); 1 só ronda.
- Decisões tomadas sem o utilizador (confirmar): problema até 80 caracteres; derangement = roda sorteada sobre todos os jogadores (cada apresentador recebe o problema do seguinte); a audiência investe e o dinheiro conta para o inventor; ninguém investe = sem bónus; ninguém inventa = revelação vazia e fim; revelação 12 s; pausa abaixo de 3 ligados; na revelação só vão os traços das vencedoras.
- Testes: `regras.test.ts` (15) + `sala.test.ts` (3). 164 verdes; tsc e lint a 0.
- Verificado no browser: partida inteira sem TV com 2 bots (problema, inventar com desenho, pitch com etapas e "Acabei", investir, revelar) até ao pódio, pontos certos. Com TV: só pela demo e pelo reducer.
- Capturas: `info/progresso/5-ideias-mirabolantes/` (rota dev `#/demo-ideias?fase=problema|inventar|pitch|investir|revelar|fim&ecra=tv|tel[&etapa=0..2][&eu=j1][&semtv=1][&zoom=1.2136]`; Edge headless).
- Próximo: jogo 6, Pirata.

## 16/11/2026 — Bonecos com caras novas (app)
- `src/ui/bonecos.tsx`: `CARAS` (uma por boneco, segue a tabela de `arquitetura.md` → Bonecos): `olhos` (piscam) e `resto` (boca, sobrancelhas, bochechas, olheiras). Feijão e polvo DJ: pálpebra reta a meio; gosma: 3 olhos a piscar juntos; peludo: franja de pelo por cima dos olhos.
- Piscar: duração 6–9 s e atraso diferentes por boneco; parado com `prefers-reduced-motion` (estilo dentro do próprio SVG).
- Teste: `src/ui/bonecos.test.ts` (3). 146 verdes. Lint dos meus ficheiros a 0; `npm run lint` falha em `src/ui/tela.tsx` (da sessão Ideias Mirabolantes, não mexi).
- Captura: `info/progresso/app-bonecos/`.

## 16/11/2026 — Mona Lixa (jogo 4)
- `src/jogos/mona-lixa/`: `regras.ts` (reducer puro), `tv.tsx`, `telemovel.tsx` (separadores Eu/Painel sem TV), `comuns.tsx` (moldura dourada, placas, `Palco`), `definicoes.tsx`, `conteudo.ts` (lê `conteudo/mona-lixa.json`: 300 desenhos + 150 falsos), `mona.css`, `demo.tsx`.
- **Canvas partilhado** (para o jogo 5): `src/ui/tracos.ts` (grelha 400×300, 8 cores, 2 grossuras, simplificação RDP, `limparTracos` corta a 30 KB) e `src/ui/tela.tsx` (`Tela` = editor com desfazer/limpar; `Quadro` = mostra e anima traço a traço).
- Sala: `EstadoSala.mona`/`defMona`, `definir_mona`, `comecar` com `jogo: 'mona'`; ações `ml_desenho`, `ml_falso`, `ml_escolher`. Catálogo: `feito: true`, com e sem TV; os a mais de 16 ficam na audiência.
- Decisões do utilizador: visual "museu" do desenho aprovado; a "caixinha ✅/❌" = estado de envio; audiência escolhe sem pontos mas conta como enganada/acertou.
- Decisões tomadas sem o utilizador (confirmar):
  - quem não desenhou a tempo continua a inventar e a escolher nos desenhos dos outros;
  - falsos iguais (sem acentos/maiúsculas/pontuação) juntam-se numa placa e os autores ganham os dois; quem o escreveu não a pode escolher;
  - o falso da casa não se repete se for igual a outro título; com >8 opções, os 7 vão sorteados entre os falsos + a casa;
  - revelação: placas por ordem de menos escolhidas; a da casa só aparece se alguém a escolheu; o verdadeiro no fim;
  - placar no fim de cada rodada (8 s); pausa abaixo de 3 ligados; título editável até 60 caracteres;
  - sem TV, o desenho aparece também no separador "Eu" ao inventar/escolher.
- Testes: `regras.test.ts` (16) + `sala.test.ts` (3). 143 verdes; tsc e lint a 0.
- Verificado no browser: partida inteira sem TV com 2 bots (desenhar, recusa do título igual, placas, revelar) até ao pódio. Com TV: só pela demo e pelo reducer.
- Capturas: `info/progresso/4-mona-lixa/` (rota dev `#/demo-mona?fase=desenhar|inventar|escolher|revelar|placar|fim&ecra=tv|tel[&semtv=1][&zoom=1.2136]`; telemóvel com Edge headless 500 px + zoom).
- Próximo: jogo 5, Ideias Mirabolantes (reaproveita `Tela`/`Quadro`).

## 16/11/2026 — Bots para testar sozinho (app)
- Decisões do utilizador: "+ Bot" **sempre** visível (não só em dev); **só o líder** cria, remove e troca; bots **parados** (sem resposta ao calhas); TV só mostra a marca 🤖.
- Sala (`src/core/sala.ts`): `Jogador.bot`; ações `bot_add` (id `bot-…` e tag gerados no telemóvel do líder), `bot_del` (só no lobby), `como` (o líder age como bot: só `jogo` e `pronto`). Bots ficam sempre ligados e nunca são líderes.
- UI (`src/jogar/Jogar.tsx`): lobby com "🤖 + Bot" e 🤖 nos bonecos (tocar num bot = remover). Em jogo, o líder com bots vê a barra `TrocaJogador` (Eu / Bot 1…) e o aviso "Jogando como X · ← Eu". Tags dos bots em `sessionStorage` (`nob.bots`).
- Testes: `src/core/sala-bots.test.ts` (6). 124 verdes, lint 0.
- Verificado no browser: partida inteira de 50/50 sem TV com 3 bots, até ao pódio. Capturas: `info/progresso/app-bots/` (50/50, Pensa-Dores, Senha do Wi-Fi). Se Vira! precisa de TV: só testado pelo reducer (mesmo caminho `como` → jogo), não no browser.
- Limite: no fim, a agir como bot, não aparecem os botões do líder (voltar a "Eu").

## 16/11/2026 — Se Vira! (jogo 3)
- `src/jogos/se-vira/`: `regras.ts` (reducer puro), `tv.tsx`, `telemovel.tsx` (preparar, ◀ ▶, reações, slider de nota), `comuns.tsx` (slide branco, gráficos, pódio), `definicoes.tsx`, `imagens.ts` (GIPHY/Pexels + galeria → WebP 800 px ≤100 KB), `conteudo.ts` (lê `conteudo/se-vira.json`), `sevira.css`, `demo.tsx`.
- Sala: `EstadoSala.sevira`/`defSevira`, `definir_sevira`, `comecar` com `jogo: 'sevira'`; ações `sv_*`. Catálogo: `feito: true`.
- **Só com TV** (decisão do utilizador, segue `arquitetura.md`): sem TV não começa e o menu mostra "Precisa de TV" (`motivo(j, n, semTv)`).
- Imagens: `VITE_GIPHY_KEY` está no `.env` (chave beta grátis, sem prazo, 100 pedidos/hora; conta GIPHY do utilizador, app "NOB Party Games"). **Pexels: emissão de chaves novas suspensa** (16/11): `VITE_PEXELS_KEY` fica vazio e as fotos geradas vêm todas da GIPHY. Pesquisas em cache por termo. Sem chave nenhuma: emoji grande, e o telemóvel só tem Galeria + Link.
- Galeria: vai pelo canal só para a TV (ação `sv_imagem`); a vista publicada nunca leva os dados nem as reações (`extraTv`).
- Decisões tomadas sem o utilizador (confirmar):
  - todos preparam um deck, mesmo com "8 sorteados"; só os decks de quem calha na roda são usados;
  - derangement = roda sorteada: cada apresentador recebe o deck do seguinte;
  - quem não envia: tema sorteado **e sem as imagens** que já tinha posto;
  - slides: o último é sempre a conclusão; as imagens do jogador também levam legenda absurda; gráfico com Q1–Q4 (barras ou pizza);
  - palavras da conclusão (30, pt-BR + en) estão em `conteudo.ts`: o `conteudo/se-vira.json` não as tem;
  - pesquisa GIPHY do jogador também com classificação G (só família);
  - reações: 1 a cada 0,4 s por jogador conta; a audiência (quem entra a meio) também reage e dá nota;
  - slider da nota começa em 3 ⭐; nota só 1 vez; fase acaba quando todos os ligados derem;
  - pausa abaixo de 3 ligados; o apresentador não pode acabar mais cedo.
- Capturas: `info/progresso/3-se-vira/` (rota dev `#/demo-sevira?fase=preparar|tema|apresentar|nota|fim&ecra=tv|tel[&slide=0..5][&papel=apresentador]`).
- 118 testes verdes; tsc e lint a 0.
- `VITE_GIPHY_KEY` também em `.github/workflows/pages.yml` (aprovado pelo utilizador). Falta: Pexels quando reabrir. Regra do utilizador: só serviços grátis, sem free trials.
- Próximo: jogo 4, Mona Lixa (`info/PLANO_JOGOS.md`).

## 16/11/2026 — Senha do Wi-Fi (jogo 2)
- `src/jogos/senha-wifi/`: `regras.ts` (reducer puro), `tv.tsx`, `telemovel.tsx` (com separadores Eu/Painel sem TV), `comuns.tsx` (router, post-its, fichas), `definicoes.tsx`, `conteudo.ts` (lê `conteudo/senha-do-wifi.json`: 500 palavras, 10 temas), `wifi.css`, `demo.tsx`.
- Visual: router da sala com post-its (○ Brancos creme à esquerda, ● Pretos quase preto à direita; luzes 1–4 acendem na revelação).
- Sala: `EstadoSala.wifi`/`defWifi`, `definir_wifi`, `comecar` com `jogo: 'wifi'`; `mover`/`fechar_equipas` só do líder. Catálogo: `feito: true`.
- Decisões tomadas (o utilizador deixou ao critério; confirmar):
  - pistas por enviar no fim do tempo → "🤖 sem pista" e a ronda segue;
  - resposta sem confirmar no fim do tempo → vale como está; incompleta = errada;
  - própria equipa responde sem o Criptógrafo; interceção = a outra equipa toda;
  - preparação: 🔄 1× por palavra, acaba com metade de cada equipa em Pronto ou 45 s;
  - pausa se uma equipa ficar com menos de 2 ligados; revelação dura 8 s;
  - palavras e código vão na vista pública indexados pela tag secreta (canal privado só no Pirata).
- Capturas: `info/progresso/2-senha-wifi/` (rota dev `#/demo-wifi?fase=palavras|cripto|resposta|revelar|fim&ecra=tv|tel[&semtv=1]`).
- 93 testes verdes; tsc e lint a 0.
- Próximo: jogo 3, Se Vira! (`info/PLANO_JOGOS.md`).

## 16/11/2026 — Pensa-Dores (jogo 1) + modo sem TV
- `src/jogos/pensa-dores/`: `regras.ts` (reducer puro), `tv.tsx`, `telemovel.tsx`, `definicoes.tsx`, `comuns.tsx`, `pensa.css`, `conteudo.ts` (lê `conteudo/pensa-dores.json`: 400 normais + 60 de final).
- Visual escolhido: **B** = quadro de giz azul-noite com moldura creme e coral; telemóvel a escrever = carteira de madeira + balão + post-it.
- Decisões tomadas sem estar no `.md` (confirmar): ×2 só na última ronda normal (com 2+ rondas); votar na final dura 2× o tempo de votar; pausa abaixo de 3 ligados; o telemóvel vota pela posição (`#0`, `#1`…), a TV traduz para o autor.
- Sala genérica: `EstadoSala.pensa`/`defPensa`, `comecar` com `jogo`, `definir_pensa`.
- **Modo sem TV**: início → "Criar party" → "Tenho TV" (`#/tv`) ou "Sem TV" (`#/criar`). Sem TV, o telemóvel do criador é o host e joga como um jogador normal; o líder tem "Escolher jogo" (`src/jogar/MenuJogos.tsx`: vertical, sem vídeo, opções do jogo). Tutorial só se o líder marcar "Mostrar tutorial antes de jogar": passa a todos 15 s (vídeos por fazer), o líder pode "Pular".
- Falta no sem TV: separador "Painel" (o que a TV mostraria) para o 50/50 e o Pensa-Dores.
- Capturas: `info/progresso/1-pensa-dores/` (rota dev `#/demo-pensa?fase=…&ecra=tv|tel`, Edge headless).
- 73 testes verdes; tsc e lint a 0.
- Próximo: jogo 2, Senha do Wi-Fi (`info/PLANO_JOGOS.md`).


Estado (2026-11-13): MVP web do 50/50 jogável, só no browser, testado de ponta a ponta (TV + 3 jogadores em separadores, Supabase real).

Feito:
- Vite + TS + Preact (`app/index.html` → `src/main.tsx`; a raiz `index.html` é o protótipo antigo e não foi alterada).
- `src/core/`: `sala.ts` (reducer da sala), `canal.ts` (Supabase Broadcast + Presence), `ligacao.ts` (hooks `useHost` / `useCliente`), `i18n.ts`, `ids.ts`.
- `src/jogos/5050/`: `regras.ts` (reducer puro), `tv.tsx`, `telemovel.tsx`, 60 frases pt-BR + 60 en.
- Feito depois: Líder (passa a liderança tocando num jogador), nomes únicos (quem tem o nome de um desligado volta a ser essa pessoa; nome de alguém ligado leva um número), código fixo em baixo, vibração ao mudar de fase, olhos dos bonecos a piscar.
- Design v2 (segundo `arquitetura.md` → Ecrãs/Bonecos e `meio-a-meio.md` → Visual):
  - 18 bonecos rabiscados em `src/ui/bonecos.tsx`;
  - ecrã inicial B;
  - escolha de boneco em grelha 6×3, com os já escolhidos esbatidos e únicos por party;
  - lobby do telemóvel: lápis + popup, nome editável, Pronto, comando da TV do líder (D-pad, OK, Voltar, Menu, Recarregar);
  - lobby da TV: menu de jogos com destaque, lista, pesquisa, filtros e esbatidos com o porquê (`src/core/jogos.ts`), e faixa com QR + código + bonecos;
  - 50/50: balança meio 3D (relógio no eixo, bonecos caem um a um), botões vermelho/azul editáveis, votar com 2 botões gigantes, ⓘ.
- Conteúdo: lê `conteudo/<jogo>.json` `{id, pt, en, tags}`, com reserva em `src/jogos/5050/conteudo.json`.
- Ecrã de teste BLE "NPN": Definições → tocar 7× na versão → "NPN (teste)", só no Android. Plugin Kotlin em `android/app/src/main/java/app/nob/party/npn/`. Gradle 9.2.1 (o JBR do Android Studio é Java 25).
- Capturas: `info/progresso/0-mvp/`. Script Playwright (Edge do sistema) fora do repo, no scratchpad da sessão.
- Falta: som na TV, modos rápido/votação/torneio, Histórico, Como jogar, Definições por grupos, vídeos dos jogos, `VITE_LINK_JOGAR` (link do GitHub Pages para o QR).
- 41 testes Vitest verdes; tsc e lint a 0.
- Supabase: organização "NOB", projeto `nob` (eu-north-1). `.env` com o URL e a chave publishable (está no `.gitignore`).

Como testar:
- `npm run dev`, depois abrir `http://localhost:5173/#/tv` (TV).
- Jogadores: `#/jogar?sala=CODIGO&eu=1`, `&eu=2`… (`eu` dá um id diferente a cada separador). Também se joga noutro telemóvel na mesma rede, pelo IP que o Vite mostra.

Falta:
- APK: `npm run build`, `npx cap sync android`, depois `gradlew assembleDebug` com `JAVA_HOME` = JBR → `dist-apk/nob-debug.apk` (gerado a 13/11, design v2 + NPN). Falta testar em telemóveis reais.
- e2e com Playwright no repo.
- 300 frases (há 60 por idioma).
- Publicar no GitHub Pages: o build usa `base: './'`, por isso basta publicar `dist/`.

## Coordenação (sessão-mãe de trabalho, 16/11)
- mvp-nob: acabada e arquivada. Pensa-Dores ✅ (73 testes verdes, lint 0; capturas em `info/progresso/1-pensa-dores/`).
- Próximo: `Jogo · Senha do Wi-Fi` (jogo 2 de `info/PLANO_JOGOS.md`). Está proposto como cartão (task `task_5a47743e`) e **à espera do clique do utilizador**. Um jogo de cada vez.
- O utilizador tem de: clicar no cartão do jogo 2; testar `NOB_v0.1.0.apk` num telemóvel real; rever o conteúdo gerado (`conteudo/`, `src/jogos/*/conteudo.json`).
- Por fazer, para a filha `App · Menus e ecrãs` (não pode correr ao mesmo tempo que um jogo que mexa em `src/core/`): fechar o núcleo v3 (QR, D-pad, menu com pesquisa/filtros, `seq` + `snapshot`, e2e Playwright, GitHub Actions + keep-alive do Supabase, separador "Painel" do modo sem TV), modos rápido/votação/torneio, histórico, definições.
- APK a pedido: `NOB_vX.Y.Z.apk` na Área de Trabalho.
