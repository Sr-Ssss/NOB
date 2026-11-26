# Arquitetura NOB

## Decisões (fechadas)
- **Só online.** Todos os dispositivos precisam de internet. Não existe modo offline.
- **Produto = 1 app "NOB" na Play Store** (Android TV + telemóvel), com 2 modos:
  - **Ser a TV**: host;
  - **Jogar**: comando.
- **iPhones e amigos sem app**: jogam no browser pelo link do GitHub Pages (`https://<user>.github.io/nob/jogar?sala=ABCD`), que é o mesmo código.
- **Código**: Vite + TypeScript + Preact. Testes com Vitest, lint com ESLint + typescript-eslint, e2e com Playwright.
- **App Android**: Capacitor a embrulhar o mesmo build (sem plugins nativos de rede).
- **Tempo real**: Supabase Realtime (Broadcast + Presence), plano grátis. Tabelas só para a party (ver "Party").
  - Todo o acesso passa por `core/canal.ts`, para se poder trocar de serviço sem mexer nos jogos.
- **A TV manda**: o estado do jogo vive na memória do host. Os telemóveis só enviam intenções e recebem vistas.
- **Conteúdo**: só família, PT (pt-BR) + EN, em JSON dentro do repo.
- **Nomes originais**: nada de nomes, textos ou aspeto de jogos comerciais. As mecânicas de género podem usar-se.
- **Dinheiro**: todos os jogos grátis + anúncio de rodapé + compra "Remover anúncios" (ver Fase 9).

## Estrutura de pastas
```
src/
  core/        sala.ts, canal.ts (Supabase), relogio.ts, tipos.ts, ids.ts
  ui/          componentes partilhados (Botao, Temporizador, Votacao, Placar, CampoTexto, Canvas, Avatar)
  tv/          host: Lobby, MenuJogos, EcraJogo, navegação D-pad
  jogar/       comando: Entrar, Lobby, EcraJogo
  jogos/<id>/  regras.ts (reducer puro) · tv.tsx · telemovel.tsx · conteudo.json · regras.test.ts
android/       projeto Capacitor (Fase 3)
```

## Sala
- Código de 4 letras sem letras ambíguas (sem I/O), gerado pelo host.
- O host mostra um QR com o link do GitHub Pages + o código em grande. A app Android em modo Jogar também aceita o código à mão.
- Jogador: `id` aleatório de 128 bits em `localStorage`, `nome` (máx. 12), `avatar` (emoji + cor).
- O 1.º a entrar é o **líder** (antes "VIP"; ver "Ecrãs"): escolhe o jogo e começa. O host também aceita comandos por D-pad.
- 3–8 **jogadores**. A partir do 9.º entram como **audiência** (votam, não pontuam).
- Desligado: fica na lista em cinzento durante 5 min. Volta com o mesmo `id` e recebe um snapshot.

## Idiomas
- **2 idiomas desde a v1: PT (= português do Brasil) e EN**, na interface e no conteúdo. Não há versão pt-PT na app (decisão do utilizador). Mais idiomas no futuro.
- O idioma escolhe-se na sala (criador). Por defeito segue a língua do dispositivo.
- Textos da interface em `src/i18n/{pt-BR,en}.json`; conteúdo por idioma em `jogos/<id>/conteudo.{pt-BR,en}.json`. Os pacotes EN não são traduções literais (trocadilhos e cultura adaptados).
- Nomes dos jogos (escolhidos pelo utilizador a 13/11; ficheiros em `info/jogos/` mantêm os nomes antigos):
| Antigo | PT | EN |
|---|---|---|
| Meio a Meio | 50/50 | 50/50 |
| Respostas Rápidas | Pensa-Dores | Deep Thinkers |
| Apresentação Surpresa | Se Vira! | Wing It! |
| Rabiscos | Mona Lixa | Mona Lies |
| Invenções Inúteis | Ideias Mirabolantes | Harebrained Ideas |
| Pirata a Bordo | Pirata | Pirate |
| Dois Lados | O Rei e o Dragão | The King and the Dragon |
| Motim em Órbita | Revolução das Máquinas (novo tema) | Machine Uprising |
| Encriptado | Senha do Wi-Fi | Wi-Fi Password |
| Rinha de Robôs | Ragerob | Ragerob |
| Operação N.P.N. | Operação N.P.N. | Operation N.P.N. |

- Evitar nomes com marca registada (Picasso, Van Gogh…) e títulos de filmes ("Rise of the Machines"). "Moaning" foi rejeitado (conotação sexual em EN).

## Design da app (menus)
- **Escolhido: "Noite de jogos"**:
  - fundo azul-noite (#26215C), cartões creme (#F1EFE8), uma só cor de destaque (coral #F0997B);
  - letra redonda (Baloo 2);
  - avatares em forma de bonecos com olhos;
  - código da sala sempre no topo.
- Botões e cartões **parados**; só podem mexer decorações de fundo, devagar.
- Cada jogo tem o seu próprio estilo visual por dentro (a decidir jogo a jogo).

### Ecrãs (ponto 1 do planeamento)
- **TV = palco 1920×1080** (fase 3, 20/11): tudo cabe num ecrã, sem scroll. `src/ui/palco.tsx` escala um ecrã virtual ≥ 1920×1080 ao ecrã real; no CSS usar `cqw`/`cqh` (nunca `vw`/`vh`). Vigiado por `e2e/tv-scroll.spec.ts`. Ecrã sempre ligado: `src/ui/ecraLigado.ts` + `FLAG_KEEP_SCREEN_ON` no APK.
- **Ecrã inicial do telemóvel (escolhido: B, "código em destaque")**: logo NOB no topo; cartão com campo "Código da party" (4 caracteres) e botão coral "Entrar"; "ou"; botão "Criar party"; rodapé com Histórico, Como jogar e Definições.
- **Código da party sempre visível em baixo**, em todos os ecrãs de quem está numa party (TV e telemóveis).
- **Líder da party** (antes "VIP"): o primeiro a entrar. Passa a liderança tocando num jogador → "Passar liderança". Se sair, passa ao membro mais antigo.
- **Nomes únicos na party**: nome de alguém desligado = volta a ser essa pessoa; nome de alguém ligado = recebe um número aleatório no fim (ver "Voltar a entrar sem login").
- **Lobby do telemóvel (jogador normal; também quem entra pelo QR/link)**: topo com "Sair"; o meu boneco em grande com um **lápis no canto** → abre em **popup** a grelha de bonecos (A); por baixo do boneco, o **meu nome** (editável); fila dos bonecos dos outros; botão "Pronto"; código em baixo.
- **Lobby do telemóvel do líder, com TV**: igual ao do jogador + botão **"Comando da TV"**. Abre um comando virtual: setas ↑↓←→, OK ao centro, Voltar, Menu, dispostos como um comando real; no topo, "Recarregar" (reload da TV) e "Sair do comando" (volta ao lobby). O comando físico da TV também funciona.
- **Lobby do telemóvel do líder, sem TV**: igual ao do jogador + botão **"Escolher jogo"** → menu igual ao da TV mas **vertical e sem vídeo** (pesquisa, filtros, esbatidos com o porquê).
- **Lobby da TV** = o ecrã do menu de jogos (destaque + lista à direita) + **faixa inferior** com QR code e o código bem destacado ao lado + os bonecos da party.
- **Tutorial em vídeo**: opção "Mostrar tutorial antes de jogar"; se ligada, o vídeo passa ao mesmo tempo em todos os telemóveis (e na TV). Vídeos feitos no fim do projeto.
- **Modos de escolha do líder**:
  - **Jogo rápido**: escolhe 1 jogo e começa;
  - **Votação**: escolhe 2, 3 ou 4 jogos (ou "Aleatório") e os jogadores votam;
  - **Torneio**: **3 rondas** por omissão (o líder pode mudar o número); em cada ronda o líder escolhe o jogo (ou "Aleatório"), que pode repetir-se. **Pontos por colocação, não pelos pontos do jogo**: com N jogadores, 1.º = +N, 2.º = +N−1, …, último = +1 (ex.: 4 jogadores → 4/3/2/1; 10 jogadores → 10/9/…/1). Boa prática: empate na colocação = mesmos pontos; empate no total final → desempata quem tiver mais 1.os lugares. No fim, pódio do torneio.
- **Escolha do boneco (escolhido: A, "grelha pronta")**: grelha de bonecos prontos (escolhe-se com um toque); os que já foram escolhidos na party ficam esbatidos e não dá para os escolher; por baixo, o campo do nome (boa prática: pré-preenchido com o último nome usado, editável, máx. 12 caracteres); botão coral "Entrar". Quantos bonecos há e como são → ponto 2.
- **Menu de jogos na TV (escolhido: B adaptado)**:
  - à esquerda, **destaque** do jogo selecionado: nome, 1 linha de descrição, nº de jogadores, duração e um **vídeo curto em loop (5–10 s, sem som) a mostrar como se joga**. O vídeo é conteúdo, não botão: os cartões continuam parados;
  - à direita, **lista de todos os jogos com scroll**; no topo da lista, uma **lupa (pesquisa)** e **filtros**: Rápidos, Nº de pessoas, Precisa de TV (e Sem TV);
  - **compatibilidade automática**: a app vê os dispositivos ligados à party (nº de jogadores, iOS/Android, TV sim/não). Os jogos que não dão ficam **na lista, esbatidos**, com aviso e o **porquê por baixo** (ex.: "Precisa de 4 jogadores (têm 3)", "Precisa de Android: o João está no iPhone", "Precisa de TV"). O VIP não os pode lançar.
  - Boa prática: o foco do D-pad começa no último jogo jogado; vídeos leves (comprimidos, carregados só quando o jogo está em destaque).
- **Histórico (escolhido: A + B + detalhe do jogo)**, 3 níveis:
  1. **Lista de parties**: data, nº de jogos (ou "Torneio"), nº de pessoas, 🏆 vencedor;
  2. **Party**: pódio da party + lista dos jogos jogados com o vencedor de cada um;
  3. **Jogo**: quem jogou, o **papel de cada um** quando o jogo tem papéis (ex.: Pirata, Assassino, robô traidor) e os **pontos/colocação** de cada um.
  - Boa prática: guardado no telemóvel (cópia local), funciona sem internet; botão "Apagar histórico" nas Definições.
- **Definições da app (escolhido: A, uma só página por grupos)**; são por dispositivo, sem login:
  - **Perfil**: nome e boneco padrão (pré-preenchem ao entrar numa party); sem PIN (rejeitado: volta-se pelo nome);
  - **Geral**: idioma (PT-BR/EN), vibração, tutorial antes de jogar, texto grande;
  - **Conta e compras**: entrar com Google (opcional), Remover anúncios, Restaurar compra;
  - **Outros**: apagar histórico, política de privacidade, ajuda; versão da app em baixo.
  - As opções de cada jogo ficam no lobby, só para o líder.
- **Como jogar (escolhido: C + B + detalhes)**:
  - entrada = lista dos jogos (C);
  - cada jogo = **cartões ilustrados** que se passam para o lado (B; ~4 por jogo);
  - depois, **"Personagens e regras"**: o que cada papel faz e as explicações detalhadas;
  - acesso: rodapé do ecrã inicial (junta-se a Histórico e Definições), no início de cada jogo, e um **botão ⓘ durante a partida** que abre a ajuda daquele jogo sem sair.
- **Conta Google ≠ nome na party**: o login só serve para sincronizar o histórico; o nome na party é livre e escolhido em cada party.
- **Login opcional (Google)**: ecrã próprio em Definições → Conta ("Guarda o teu histórico… Não é preciso para jogar") + aviso pequeno no Histórico, só depois da 1.ª party, que se pode fechar e não volta a aparecer.
- **Remover anúncios**: ecrã simples em Definições (texto "Todos os jogos continuam grátis…", botão **2,99 €**, compra única, + "Restaurar compra") + um **✕ pequeno ao lado do anúncio do rodapé** que abre o mesmo ecrã. Nunca aparece sozinho em popup.
- **Bonecos (ponto 2)**:
  - **18 bonecos**, **formas abstratas com cara** que não precisam de representar nada, ar de **rabisco à mão (tipo Paint)**: traço preto grosso e irregular, formas imperfeitas, **cores vivas** (nada de pastel, 18/11); cada um único na forma **e** na cor (distinguem-se mesmo sem ver cores);
  - **lista (v2, 18/11)**: 1 amassado · 2 torre torta · 3 pingente · 4 bolhas · 5 rabo de espiral · 6 **rasgado** · 7 **lasca** · 8 esticado de lado · 9 **pentágono torto** · 10 **trapézio torto** · 11 ondulado · 12 pião · 13 mordido · 14 escadinha · 15 gosma · 16 peludo · 17 **crista** · 18 **nuvem** (grelha 3×6 no telemóvel);
  - **formas novas (18/11)**: rasgado = pentágono irregular, um lado bem maior, base rasgada em zigue-zague; lasca = hexágono torto, como uma lasca partida; pentágono torto = pentágono de cantos moles com um lado bem maior; trapézio torto = largo em cima, estreito em baixo, inclinado; crista = bloco de cantos redondos com crista de 3 bicos em cima; nuvem = nuvem simples de desenho, 3 altos em cima e base reta (pedida pelo utilizador a 18/11, sai da lista de rejeitados). O utilizador prefere formas **abstratas** a coisas reais distorcidas;
  - **saíram (18/11, o utilizador achou-os esquisitos)**: cubo mole, feijão, polvo DJ, dois bicos, tampa com buraco; zigue-zague (demasiado básico). Também rejeitados na v2: sanfona, dobrado, oito, calombo, gancho, triângulo gordo, rosca, batata, quadrado inchado, ovo torto, mancha, meio reto meio mole, caído;
  - **cores vivas (v2, 18/11)**: 1 #FF2A2A vermelho · 2 #2255FF azul · 3 #FF7A00 laranja · 4 #1DCC4A verde · 5 #9B2CFF roxo · 6 #FFDD00 amarelo · 7 #00D4FF ciano · 8 #FF22DD magenta · 9 #B4FF00 lima · 10 #FF3D8B rosa-choque · 11 #00C2A8 turquesa · 12 #C77DFF violeta · 13 #FFAA00 âmbar · 14 #FF6B4A coral · 15 #3DFFA2 menta-viva · 16 #D6004F framboesa · 17 #29A8FF azul-céu · 18 #5A3CFF índigo;
  - referências: **gosma** (pingos em baixo, 3 olhos, **sem antenas**), **peludo** (contorno aos picos). Rejeitados: pera, raio, casinha, tijolo, ciclope, animais misturados e humanos;
  - evitar formas iguais às de outros jogos conhecidos (estrela, lua, gota, cacto, cocó);
  - **caras (aprovado 16/11, revisto 18/11)**: cada boneco tem olhos e boca próprios, com personalidade que vem da forma; **todos piscam** (incluindo a nuvem, de pálpebra a meio, e a gosma, os 3 olhos juntos):

    | # | boneco | olhos | boca | personalidade |
    |---|---|---|---|---|
    | 1 | amassado | um grande e um pequeno | ondulada "~" | atrapalhado |
    | 2 | torre torta | inclinados (um mais alto, como a torre) | reta, com um dente a morder | concentrado |
    | 3 | pingente | a olhar para cima (para o fio) | sorriso pequeno | sonhador |
    | 4 | bolhas | pontos pretos com brilho, um em cada bolha: pequeno na de cima, maior na grande | sorriso com a língua de fora para o lado | brincalhão |
    | 5 | rabo de espiral | em espiral, de tamanhos diferentes e um mais alto | ondulada aberta | tonto |
    | 6 | rasgado | zangados (sobrancelhas em V) | dentes em zigue-zague | resmungão |
    | 7 | lasca | a olhar para cima e para o lado | traço curto de lado ("hmm") | pensativo |
    | 8 | esticado de lado | muito afastados, um em cada ponta | sorriso larguíssimo | satisfeito |
    | 9 | pentágono torto | grandes e redondos | "O" grande, a cantar | cantor |
    | 10 | trapézio torto | grandes, com brilho | aberta em "D" | entusiasmado |
    | 11 | ondulado | com 3 pestanas + bochechas rosa | sorriso de lado | vaidoso |
    | 12 | pião | vesgos (pupilas para dentro) | risinho torto | distraído |
    | 13 | mordido | arregalados, pupilas mínimas, sobrancelhas no ar; o do lado da dentada é maior | tremida para baixo | assustado |
    | 14 | escadinha | quadrados | reta e firme | teimoso |
    | 15 | gosma | 3 olhos | aberta, com um pingo de baba | guloso |
    | 16 | peludo | pequeninos a espreitar por baixo do pelo; branco do olho bem visível e pupila preta; franja e boca em creme, para se lerem no framboesa | pequenina | tímido |
    | 17 | crista | semicerrados (pálpebra reta), pupilas de lado | sorriso de lado | manhoso |
    | 18 | nuvem | a dormir: pálpebra a meio, pupila em baixo, olheiras | bocejo oval | dorminhoco |

  - boa prática: detalhes finos (pestanas, olheiras, brilhos) com traço grosso, para se lerem a 32 px; cada cara reconhece-se também a preto e branco;
  - boa prática: piscar dessincronizado entre bonecos e desligado com "reduzir movimento" (`prefers-reduced-motion`);
  - animação: só **piscar os olhos**, devagar, de vez em quando;
  - desempenho (25/11): nada de animações CSS infinitas nos bonecos; o piscar vem de um só relógio (`src/ui/piscar.ts`) e cada boneco é uma imagem feita uma vez (`bonecos.tsx`), porque o filtro de rabisco é caro de repintar;
  - inspiração no estilo geral de party games desenhados à mão, **sem copiar personagens de outro jogo**.
- **Logo e ícone (ponto 4, aprovado 18/11)**:
  - **ícone**: fundo azul-noite (#26215C), cantos redondos; ao centro um **O grosso coral-vivo (#FF6B4A)** com buraco no meio, traço preto rabiscado como os bonecos; a **cara fica só na parte de baixo do O** (2 olhos pequenos + sorriso). Os olhos piscam só na app, nunca no ícone;
  - **logo**: "N" + o mesmo O com cara + "B", letras creme (#F1EFE8) em Baloo 2 (800), com contorno preto;
  - boa prática: ícone adaptativo do Android (o desenho fica nos 66% do centro, que é a zona segura); ícone da Play Store 512×512; testar a 48 px;
  - medidas do desenho (viewBox 100×100): anel `M14 48 A36 36 0 1 0 86 48 A36 36 0 1 0 14 48 Z M38 48 A12 12 0 1 0 62 48 A12 12 0 1 0 38 48 Z` (evenodd); olhos em (42,69) e (58,69), rx4.6 ry5.6, pupila r2.4; boca `M45 78 Q50 82 55 78`.
- Boas práticas: alvos de toque ≥ 48 dp; contraste ≥ 4.5:1; o campo do código só aceita letras/números e mostra erro claro se a party não existir; ecrã "Sem internet" com botão Tentar de novo.

## Modo sem TV
- Ao criar a sala: "Tenho TV" ou "Sem TV". Sem TV, o criador cria a sala no telemóvel (modo Jogar). Quem cria a sala sem TV também joga.
- Sem TV, cada telemóvel tem 2 separadores: **Eu** (o meu ecrã de jogo) e **Painel** (o que a TV mostraria: tempo, listas, contadores, resultados).
- Som: sem TV não há som; só vibração.

## Som (TV) — decidido 13/11/2026
- Só a TV toca som; os telemóveis só vibram.
- Música: 1 faixa NOB para o menu e o lobby + 1 faixa curta em loop por jogo, no estilo desse jogo (11 no total). Fica baixa e desce de volume nas revelações e nos textos importantes.
- Efeitos iguais em todos os jogos: entrar na sala, enviar ✅, últimos 5 s da contagem, revelação, pontos e vitória. Cada jogo pode juntar poucos efeitos seus.
- Jogos com papéis secretos: só sons neutros. Nenhum som depende do papel de alguém; a tensão fica nas votações e nas revelações.
- Boa prática: na TV, volume separado para música e efeitos; ficheiros OGG curtos, pré-carregados no lobby.
- Por decidir mais tarde: de onde vêm os sons e que licenças têm.
- O host (estado + timers) passa a ser o telemóvel do criador. Se ele fechar a app, outro telemóvel assume (17/11, `src/core/passagem.ts`):
  - o host escolhe um **herdeiro** (o líder, se não é ele; senão o ligado mais antigo) e manda-lhe, no máximo a cada 2 s e pelo menos a cada 10 s, uma **cópia** (estado, sal dos sorteios, chaves dos telemóveis) cifrada só para ele, com **chaves novas de host** já assinadas pelas suas;
  - publica a vista pelo menos a cada 3 s; a vista leva `prox` (impressão das chaves do herdeiro, dentro da assinatura) e a `cadeia` de passagens;
  - o herdeiro, 15 s sem vistas, passa a host (`#/criar`) com a cópia; o relógio retoma onde estava quando o host se calou;
  - os outros telemóveis só trocam de host com uma cadeia assinada a partir do host que fixaram, para o herdeiro anunciado, e com esse host calado há 8 s;
  - o criador passa a ser um jogador qualquer: sai pela regra de saídas a meio (tolerância, pausa se faz falta) e volta pelo `#/jogar` com o mesmo papel; se reabrir o `#/criar` no mesmo separador, vê que foi substituído e passa a jogador.
  - Limite: o herdeiro tem o estado todo no aparelho (papéis de todos). É o preço de não depender de servidor; só um herdeiro de cada vez.
- **Recarregar o host não apaga a party** (TV e sem TV, 17/11): o host grava o estado e o sal no separador (`sessionStorage`, `nob.tv.estado`) a cada 2 s, ao sair da página e ao sair do ecrã, e recupera-o ao arrancar (mesmo código, < 1 h). O relógio retoma da hora da gravação e o `seq` continua a subir. Fechar o separador apaga a gravação; aí vale a passagem ao herdeiro.

| Jogo | Sem TV? |
|---|---|
| Meio a Meio, Respostas Rápidas, Pirata a Bordo, Dois Lados, Motim em Órbita, Encriptado | ✅ |
| Rabiscos, Invenções Inúteis | ✅ (os desenhos aparecem no telemóvel; fica pior) |
| Apresentação Surpresa (Se Vira!), Rinha de Robôs (Ragerob) | ✅ desde 20/11 (Fase 10): Se Vira! — o slide atual em todos os telemóveis (imagem da galeria pelo canal privado); Ragerob — a física corre no host (telemóvel que tem a sala) e manda quadros da arena (`rr_quadro`) que cada telemóvel desenha em pequeno |

## Party (substitui o "placar da noite")
- **Party** = grupo com um código, que dura enquanto houver alguém lá dentro (+24 h para quem se desligou voltar).
- Guarda no Supabase (tabelas `party`, `membro`, `jogo_jogado`, `resultado`):
  - membros, com hora de entrada e de saída;
  - cada jogo jogado: hora, jogadores, classificação e pontos;
  - placar total da party.
- Quem entra a meio aparece só nos jogos em que participou. O placar total soma só o que cada um jogou.
- Quando a party acaba (sai o último), cada telemóvel guarda uma cópia local (**"Histórico"**: lista de parties → jogos → classificação).
- **Voltar a entrar sem login**:
  - mesmo telemóvel → automático (`id` guardado no dispositivo);
  - outro telemóvel → **pelo nome** (sem PIN, sem "Sou eu"): entrar com o mesmo nome de um membro **desligado** = volta a ser essa pessoa (mesmos pontos e boneco). Mudar de nome = pessoa nova.
  - Se o nome pertence a alguém **ligado**, prioridade a quem entrou primeiro: o novo fica com o nome + número aleatório (ex.: "Rita 37") e a app avisa "Já há uma Rita". Se o boneco escolhido já estiver ocupado, recebe outro livre.
- **Login é opcional** (Google): só para sincronizar o histórico entre dispositivos. Não é preciso para jogar.
- **Anúncios e "Remover anúncios" não precisam de login**: o AdMob funciona sem conta e a compra fica ligada à conta Google Play do telemóvel (restaura-se automaticamente).
- Só o **líder da party** (o 1.º a entrar; ver "Ecrãs") mexe em configurações. Se ele sair, a liderança passa ao membro mais antigo.

## Protocolo (Supabase Broadcast)
- Canal `sala:ABCD`:
  - o host publica `vista_publica` (fase, temporizador, placar);
  - os telemóveis enviam `{tipo, jogadorId, dados}`.
- Canal privado `p:<segredo>`: o segredo tem 128 bits, é gerado pelo host e entregue uma única vez ao entrar. Leva o papel secreto, o prompt e as cartas.
- Mensagens com `seq`. O telemóvel ignora as antigas e pede `snapshot` quando há buracos.
- Temporizadores: o host envia `terminaEm` (epoch ms); o telemóvel corrige com o desvio medido num `ping`.
- Poupança de mensagens: enviar a vista só quando muda; inputs contínuos (Rinha) só quando mudam e no máximo 15×/s.

## Motor de jogo
- Cada jogo é um reducer puro: `(estado, acao, agora) => estado`, mais `vistaTV(estado)` e `vistaJogador(estado, id)`.
- `tempo_esgotado` e `todos_responderam` passam pelo mesmo reducer, por isso é testável sem rede.
- Fases genéricas: `escrever`, `desenhar`, `votar`, `revelar`, `placar`.
- Sem resposta a tempo: entra uma resposta de recurso, marcada "🤖 sem resposta".

## Qualidade
- Testes do reducer em cada jogo: 3 e 8 jogadores, desligar a meio, tempo esgotado, empates.
- e2e (Playwright: 1 host + 3 comandos em separadores) no núcleo e num jogo por fase.
- Ecrã TV a 1920×1080 a 3 m: texto ≥ 32 px, sem rato.
