# Plano MVP — APK jogável (objetivo: hoje)

Âmbito mínimo: app Android com **um** jogo (50/50) a funcionar de ponta a ponta, online, estilo "Noite de jogos".
Fora do MVP: party persistente/histórico, anúncios, outros jogos, login, iOS/Pages, modo sem TV.

Ler antes: `CLAUDE.md`, `info/arquitetura.md` (decisões, protocolo, design), `info/jogos/meio-a-meio.md` (= 50/50).

## Ambiente (verificado a 13/11)
- Node 24, npm 11.
- Android SDK em `%LOCALAPPDATA%\Android\Sdk` (platforms 34–37, build-tools 36).
- JDK: `C:\Program Files\Android\Android Studio\jbr` → usar `JAVA_HOME` com este caminho para o Gradle.
- Sem `gh` e sem repo: o build é feito localmente (`npx cap sync android` + `gradlew assembleDebug`).

## Ecrãs do MVP (estilo Noite de jogos: fundo #26215C, cartões #F1EFE8, destaque coral #F0997B, Baloo 2, botões parados)
1. **Início**: logo NOB + botões "Ser a TV" e "Jogar".
2. **Entrar** (Jogar): código de 4 letras + nome + boneco (6 cores/formas fixas) → Entrar.
3. **Lobby TV**: código grande no topo, lista de bonecos que entram, grelha de jogos (só 50/50 ativo; os outros aparecem como "em breve"), definições do 50/50, botão Começar (ou o VIP no telemóvel).
4. **Lobby telemóvel**: "Estás dentro", o teu boneco, os outros; o VIP vê "Escolher jogo / Começar".
5. **50/50** completo conforme `info/jogos/meio-a-meio.md` (escrever, votar, revelar, placar, pódio).
6. **Fim**: pódio + "Jogar outra vez" / "Menu".

## Fases
1. ✅ **Base** (Capacitor só com `capacitor.config.json`; falta `cap add android`) — Vite + TS + Preact, ESLint, Vitest; i18n pt-BR + en (só os textos do MVP); Capacitor Android (`android/`), app id `app.nob.party`; tema Noite de jogos.
2. ✅ **Sala** — `core/canal.ts` (Supabase Broadcast + Presence, atrás de uma interface), código de sala, entrar/sair/voltar, VIP, a TV como autoridade. Testes do reducer da sala.
3. ✅ **50/50** — reducer puro + testes (3, 4, 8 jogadores; tempo esgotado; voto ímpar; desligar), ecrãs TV e telemóvel, 60 frases pt-BR + 60 en para o MVP (as 300 ficam para depois).
4. **APK** — `gradlew assembleDebug`, APK em `dist-apk/nob-debug.apk`; testar no emulador ou num telemóvel (TV num separador do browser via `npm run dev` + 2 telemóveis).

## Do lado do utilizador
- Criar o projeto Supabase grátis e dar o **URL** e a **anon key** (vão para `.env`, que **não** é versionado).
- Ter um telemóvel Android com "Instalar apps de fontes desconhecidas" para testar o APK.
