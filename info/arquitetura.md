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
  - **18 bonecos**, **formas abstratas com cara** que não precisam de representar nada, ar de **rabisco à mão (tipo Paint)**: traço preto grosso e irregular, formas imperfeitas, **cores base**; cada um único na forma **e** na cor (distinguem-se mesmo sem ver cores);
  - **12 já aprovados**: amassado, torre torta, pingente, bolhas (boca: sorriso com a língua de fora para o lado), rabo de espiral, zigue-zague, tampa com buraco, esticado de lado, gosma, peludo, polvo DJ, feijão, cubo mole, dois bicos, ondulado, pião, mordido, escadinha → **18 bonecos** (grelha 3×6 no telemóvel);
  - **cores (uma por boneco, bem distintas)**: 1 amassado #E6194B vermelho · 2 torre torta #4363D8 azul · 3 pingente #F58231 laranja · 4 bolhas #3CB44B verde · 5 espiral #911EB4 roxo · 6 zigue-zague #FFE119 amarelo · 7 tampa #42D4F4 ciano · 8 esticado #F032E6 magenta · 9 cubo mole #BFEF45 lima · 10 dois bicos #FABED4 rosa-claro · 11 ondulado #469990 verde-azulado · 12 pião #DCBEFF lilás · 13 mordido #9A6324 castanho · 14 escadinha #808000 oliva · 15 gosma #AAFFC3 menta · 16 peludo #800000 bordô · 17 polvo DJ #A9A9A9 cinzento · 18 feijão #FFD8B1 pêssego;
  - referências: **gosma** (pingos em baixo, 3 olhos, **sem antenas**), **peludo** (contorno aos picos), **polvo DJ** (tentáculos + auscultadores), **feijão** (forma torta, olhos a dormir). Rejeitados: pera, nuvem, raio, casinha, tijolo, ciclope, animais misturados e humanos;
  - evitar formas iguais às de outros jogos conhecidos (estrela, lua, gota, cacto, cocó);
  - animação: só **piscar os olhos**, devagar, de vez em quando;
  - inspiração no estilo geral de party games desenhados à mão, **sem copiar personagens de outro jogo**.
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
- O host (estado + timers) passa a ser o telemóvel do criador. Se ele se desligar, a sala pausa até voltar.

| Jogo | Sem TV? |
|---|---|
| Meio a Meio, Respostas Rápidas, Pirata a Bordo, Dois Lados, Motim em Órbita, Encriptado | ✅ |
| Rabiscos, Invenções Inúteis | ✅ (os desenhos aparecem no telemóvel; fica pior) |
| Apresentação Surpresa, Rinha de Robôs | ❌ precisam de ecrã grande |

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
