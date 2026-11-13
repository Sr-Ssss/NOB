# Plano NOB — v3 (atualizado a 13/11/2026)

Uma sessão filha por fase, uma de cada vez (a seguinte só arranca quando a anterior está testada). Cada sessão marca a sua fase com ✅ no fim.
- **Imagens do progresso (obrigatório)**: no fim de cada fase, a sessão guarda capturas dos ecrãs novos (TV 1920×1080 e telemóvel 412×915, via Playwright ou pelo browser) em `info/progresso/<n>-<fase>/NN-nome.png`. A sessão-mãe mostra-as ao utilizador.
- Ordem: MVP (`PLANO_MVP.md`) → 1 Núcleo (atualiza o código do MVP com as regras novas: líder, nomes, código em baixo, sem TV) → 2 Party → 3 Kit + 50/50 → 4 Host Android → 5 a 9 jogos → 10 a 12.
Ler sempre `CLAUDE.md` e `info/arquitetura.md` antes de começar.
- O MVP (APK jogável já) corre à parte em `info/PLANO_MVP.md`. Este plano é o caminho completo; as fases que o MVP já fez marcam-se aqui com ✅ quando estiverem testadas.
- Regras dos jogos: `info/jogos/<ficheiro>.md` (os ficheiros mantêm os nomes antigos; tabela em `arquitetura.md` → "Idiomas").
- Conteúdo (frases, perguntas, palavras): gerado em `conteudo/<jogo>/conteudo.{pt-BR,en}.json`, revisto pelo utilizador. Cada fase de jogo copia-o para `src/jogos/<id>/`.

## Do lado do utilizador
- [ ] Antes da Fase 1: criar o projeto Supabase grátis (região UE) e dar o **URL** e a **anon key** (são públicos).
- [ ] Antes da Fase 1: criar o repo **público** `nob` no GitHub (o Pages grátis precisa de repo público) e ligar o Pages ao GitHub Actions.
- [ ] Fase 3: confirmar que a conta Play aceita apps Android TV.
- [ ] Rever e aprovar o conteúdo de cada jogo antes da fase desse jogo.

## Fases

### 1. Núcleo — sessão "nucleo"
Ler: `info/arquitetura.md` (Sala, Ecrãs, Bonecos, Idiomas, Protocolo).
1. Vite + TS + Preact, ESLint, Vitest, Playwright, estrutura de pastas, i18n PT (pt-BR) + EN.
2. `core/`: sala, canal Supabase (atrás de uma interface), relógio, ids, protocolo com `seq` + `snapshot`, reconexão.
3. `/tv`: criar sala, QR com o link do Pages, **código sempre em baixo**, lobby com bonecos, menu de jogos (lista com pesquisa e filtros), navegação D-pad.
4. `/jogar`: entrar por QR ou código, nome + boneco, lobby, ecrã de espera.
5. **Líder** = 1.º a entrar; "Passar liderança"; se sair, passa ao membro mais antigo. Só o líder mexe em definições.
6. **Nomes únicos e voltar pelo nome** (sem PIN, sem "Sou eu"): ver `arquitetura.md` → "Party".
7. **Modo sem TV**: o criador é o host no telemóvel; separadores Eu / Painel.
8. GitHub Actions: lint + testes + deploy no Pages; cron semanal de keep-alive do Supabase.
- Feito quando: 1 TV + 3 separadores entram, saem, voltam (mesmo telemóvel e pelo nome noutro) e mantêm o lugar (teste e2e verde).

### 2. Party + modos de escolha — sessão "party"
Ler: `arquitetura.md` → "Party" e "Ecrãs" (modos do líder, Histórico).
1. Tabelas Supabase `party`, `membro`, `jogo_jogado`, `resultado` (com RLS). Boa prática: migrações SQL no repo.
2. Placar total da party; quem entra a meio só conta os jogos que jogou; party dura +24 h para quem se desligou.
3. Modos do líder: **Jogo rápido**, **Votação** (2–4 jogos ou Aleatório), **Torneio** (3 rondas por omissão, pontos por colocação, pódio).
4. Histórico local no telemóvel; login Google opcional só para o sincronizar.
- Feito quando: uma party com torneio de 3 jogos guarda e mostra o placar certo, com alguém a entrar a meio (testes + 1 e2e).

### 3. Kit de jogo + 50/50 — sessão "kit"
Ler: `info/jogos/meio-a-meio.md`.
1. `ui/`: Temporizador, Votacao, CampoTexto (texto pré-preenchido editável), botão Enviar com caixinhas ✅/❌, Placar, Revelar; motor de fases genérico.
2. 50/50 completo, com o conteúdo aprovado.
- Feito quando: o jogo corre de ponta a ponta com 3 e 8 jogadores, com e sem TV (testes do reducer + 1 e2e).

### 4. App host Android (TV + telemóvel) — sessão "host"
Ler: `info/regras/plataforma.md`.
1. Capacitor em `android/`: ecrã inicial "Ser a TV" / "Jogar". No modo Jogar, entrada por código ou leitura de QR.
2. Intent leanback (TV) + launcher normal (telemóvel), banner 320×180, ecrã sempre ligado no modo TV.
3. Foco D-pad em todos os ecrãs da TV; tecla Back = voltar/sair com confirmação. "Comando da TV" no telemóvel do líder.
4. Build do APK/AAB em GitHub Actions. Checklist da ficha Play TV em `info/play-tv.md`.
- Feito quando: o APK instala no emulador Android TV e joga 50/50 com 1 app em modo Jogar + 2 browsers (link do Pages).

### 5. Pensa-Dores + Se Vira! — sessão "texto"
Ler: `info/jogos/respostas-rapidas.md`, `info/jogos/apresentacao-surpresa.md`.
1. Pensa-Dores (Deep Thinkers).
2. Se Vira! (Wing It!) com gerador de slides (versão emoji). Precisa de TV. As fotos CC0 entram no fim, se houver tempo.

### 6. Canvas + Mona Lixa + Ideias Mirabolantes — sessão "desenho"
Ler: `info/jogos/rabiscos.md`, `info/jogos/invencoes-inuteis.md`.
1. Canvas partilhado (traços simplificados, ≤ 30 KB, animação na TV).
2. Mona Lixa (Mona Lies). 3. Ideias Mirabolantes (Harebrained Ideas).

### 7. Pirata + O Rei e o Dragão — sessão "segredos"
Ler: `info/jogos/pirata-a-bordo.md`, `info/jogos/dois-lados.md`.
1. Canal privado por jogador: teste que prova que a vista da TV nunca leva segredos. Botão **Identidade** (segurar 3 s); texto igual para todos.
2. Pirata (narração + voz opcional). 3. O Rei e o Dragão.

### 8. Revolução das Máquinas + Senha do Wi-Fi — sessão "equipas"
Ler: `info/jogos/motim-em-orbita.md`, `info/jogos/encriptado.md`.
1. Revolução das Máquinas (Machine Uprising): todos são robôs; papéis com os nomes antigos. 5–10 jogadores.
2. Senha do Wi-Fi (Wi-Fi Password): resposta partilhada da equipa.

### 9. Ragerob (v2) — sessão "robos"
Ler: `info/jogos/rinha-de-robos.md`. Precisa de TV.
1. Medir a latência (p95) e as mensagens por combate; se o p95 passar de 150 ms, usar PeerJS no combate. Registar os valores.
2. Robô = carroçaria + locomoção + cabeça + módulos; arena Matter.js vista de cima.
3. Modo normal: apostas, leilão de módulos, controlo pago durante uns segundos, torneio.
4. **Modo Pilotos**: liga (ninguém é eliminado), combates de 4 com bots, cada humano conduz o seu robô, pontos de colocação + dinheiro por desempenho.

### 10. Polimento — sessão "polimento"
Ler: `arquitetura.md` → "Som (TV)".
- Som: só a TV toca (telemóveis vibram); 1 faixa NOB + 1 por jogo; efeitos comuns; volume separado música/efeitos. Origem e licenças dos sons por decidir.
- Animações de transição, ecrã "Como jogar" por jogo, arte final dos bonecos, logo e ícone (por desenhar).
- Testes em telemóveis Android reais, acessibilidade (contraste, tamanhos; texto ≥ 32 px na TV).

### 11. Dinheiro — sessão "dinheiro" (só depois de verificar as políticas)
- **Decisão do utilizador: todos os jogos grátis. NADA de pagar para jogar.**
- **Anúncios de rodapé** (AdMob banner, modo família), só quando há internet:
  - modo Jogar: rodapé no lobby e nos ecrãs de espera, nunca a tapar botões de jogo;
  - modo Ser a TV: rodapé discreto no lobby/placar, se o AdMob for permitido em Android TV (confirmar antes).
- **"Remover anúncios"**: compra única pela Play Billing, ligada à conta Google Play (restaura-se sozinha; não precisa de login na app).
- Sem intersticiais, sem anúncios recompensados obrigatórios.
- iPhones (browser): sem anúncios.

### 12. Play Store — sessão "loja" (pode bloquear a publicação; por planear)
- Conteúdo dos jogadores → forma de denunciar/ocultar (ex.: "🚩 ocultar" no ecrã do criador).
- Regras de família da Google: AdMob em modo família, política de privacidade.
- Ficha da loja: descrição, capturas, classificação etária.

### Depois: Operação N.P.N. — parado até o utilizador pedir
Ler: `info/jogos/npn.md`, `info/regras/proximidade.md`.
- Android only, modo NPN dentro da app NOB. Plugin nativo Kotlin: BLE em foreground service + MediaSession (volume com o ecrã desligado). Regras no servidor (Supabase).
- Agora só existe o ecrã de teste BLE. Faltam design, Batata Quente com BLE, calibração e definições.
