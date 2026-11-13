# Próxima sessão

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

## Coordenação (sessão-mãe do jogo, 13/11)
- A decorrer: mvp-nob (fase 1). Nenhuma filha nova até ela acabar.
- Fases a seguir: as do `PLANO_NOB.md` v3. Depois do núcleo vem a fase 2 "party".
- Quando a mvp-nob acabar, confirmo testes, lint e diff contra o "Feito quando" do núcleo v3. O que faltar vai para uma filha que fecha o núcleo.
- APK a pedido: `NOB_vX.Y.Z.apk` na Área de Trabalho. Já existe `dist-apk/nob-debug.apk`, gerado pela mvp-nob.
