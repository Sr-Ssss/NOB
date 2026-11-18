# Próxima sessão

## 18/11/2026 — Ragerob (jogo 9)
- `src/jogos/ragerob/`: `pecas.ts` (carroçarias, locomoções, cabeças, 10 módulos, preços, perigos, cores com nome), `regras.ts` (reducer puro: dinheiro, leilão/loja privada, apostas com entrada, torneio, liga Pilotos, controlar 5 s), `fisica.ts` (Matter.js, só na TV: cabeças, módulos com direção fixa, combos, 7 perigos, 3 eventos, arena a encolher a arder, IA por cabeça), `desenho.tsx` (robôs, arena, poças, efeitos em SVG), `tv.tsx`, `telemovel.tsx`, `comuns.tsx`, `definicoes.tsx`, `ragerob.css`, `demo.tsx`.
- Ligação: entrada `ragerob` em `src/core/registo.ts` (`soTv`, `rr_vidas`/`rr_fim` só da TV pelo `soLider`) e em `src/jogos/ecras.tsx`; `PropsTv` ganhou `acao` (a TV manda ações; passado em `src/tv/Tv.tsx`); `podeComecar` passou a usar o menor mínimo dos jogos (o Ragerob joga-se a 2); catálogo `feito: true`; textos `rr*` em `src/i18n/`; dependência `matter-js` (+ `@types/matter-js`).
- A física anda pelo relógio real (rAF + reserva de 100 ms), por isso continua com a TV escondida/abrandada.
- Decisões do utilizador (17/11): leilão 30 s, apostas 20 s, instalar 20 s, combate 90 s e depois a arena encolhe a arder até sobrar 1 (ou nenhum); colocação = ordem de KO (KO ao mesmo tempo = empate); Pilotos: cada um escolhe carroçaria + locomoção + cabeça (20 s; sem escolha = sorteio), bots e quem larga o comando = IA; 9–10 pilotos = 12 robôs; visual da proposta aprovado.
- Decisões tomadas sem o utilizador (confirmar):
  - modo normal: 2, 3 ou 4 rondas (4/8/16 robôs; 12 não dá grupos de 4 a passar 2);
  - o dinheiro gasto (leilão, trocas, controlar) vai para o bolo (assim conserva-se); no Pilotos desaparece;
  - sobra do bolo no fim: quem apostou no campeão → quem apostou na final → todos por igual;
  - trocar um módulo: o antigo perde-se; "Instalar" salta-se quando ninguém tem módulos; ofertas do leilão juntas não podem passar do dinheiro;
  - passam 2 por combate de 4: ordem de KO, empate pelo dano causado; final sem vencedor = mais dano;
  - Pilotos: recuperação +100 a todos os empatados em último no fim de cada ronda; a IA licita 1 módulo por ronda (preço + 0–50) e instala logo;
  - pausa fora do combate com menos de 2 ligados; resultado 8 s; rede de segurança: se a TV não mandar o fim em 200 s, ordena pela vida.
- Testes: `regras.test.ts` (18) + `fisica.test.ts` (2: o combate acaba sempre; o humano conduz).
- Capturas: `info/progresso/9-ragerob/` (rota dev `#/demo-ragerob?fase=montar|loja|aposta|instalar|combate|resultado|fim&modo=normal|pilotos&ecra=tv|tel[&eu=j2][&zoom=…]`; Playwright + Edge, script no scratchpad da sessão).
- Por fazer / limites: sem som; o líder pode mandar `rr_vidas`/`rr_fim` (o `soLider` aceita o líder além da TV); sem ecrã ⓘ de ajuda próprio; IA simples (sem desvio fino de perigos).

## Coordenação (17/11, fim da sessão de auditoria)
- A sessão de auditoria ficou demasiado longa (~700k tokens) e foi arquivada; uma sessão nova "Auditoria · jogos e app" continua o trabalho.
- Estado (17/11, tarde, coordenação "Auditoria · jogos e app"):
  - "Segurança da sala" — ✅ acabada e verificada pela coordenação (284 testes, tsc e lint a 0; browser: código de 5 letras, expulsar, fechar/abrir, barrado com aviso);
  - "Registo de jogos: tirar o código repetido" — ✅ acabado a 18/11 (secção abaixo) e verificado pela coordenação (296 testes, tsc e lint a 0; Mona Lixa sem TV no browser);
  - "Textos 'Segure' com tocar para mostrar" — ✅ feito a 18/11: `chaveSegurar()` (`src/ui/acessibilidade.ts`) + chaves `prSeguraTocar`, `rmCartaTocar`, `rmVerTocar`, `idSegurar(Tocar)`; ajudas Pirata/Máquinas/Rei e `rdInfoRegras` com `{segurar}`; aviso "Segure 2 s" do Rei escondido no modo tocar. 298 testes, tsc e lint a 0; demos vistas no browser nos dois modos. Modo desligado: a frase das ajudas passou a ser igual nos 3 jogos ("Segure “Identidade” 3 s para ver quem você é.");
  - cartão "Auditoria: balanceamento dos jogos" — por começar (à espera do utilizador).
- Passagem do anfitrião sem TV (`src/core/passagem.ts`) e anfitrião a recarregar: ✅ verificados no browser pela coordenação (detalhes em `info/auditoria/2026-11-17.md` → "Verificado pela coordenação").
- Testes de rede no browser: `.claude/launch.json` → `nob-semhmr` (Vite sem HMR; config no scratchpad da coordenação, pode desaparecer; **não tem o `define` de `__VERSAO__`** do `vite.config.ts`: a app não arranca lá — usar `nob-5199` ou juntar o `define`). O pane do browser não mostra `confirm()` nativo (ver E6).
- Por propor/confirmar com o utilizador: decisões "tomadas sem o utilizador" dos jogos 1–8 (secções abaixo).
- Nada tem commit desde 2c4fe63. O utilizador ainda tem de fazer o que está em `info/auditoria/burocracia-playstore.md` (SQL do keep-alive, nome/e-mail na política, Play Console, chave GIPHY de produção, DPA da Supabase).

## 18/11/2026 — Passagem do anfitrião: relógio, rascunhos; nomes dos bonecos em EN
- ✅ Relógio: o herdeiro retomava na hora da **última vista** (os ~15 s sem anfitrião não contavam → relógio saltava para cima, 32 → 42 s). Agora retoma na hora que os telemóveis viam ao assumir (`Date.now() + desvio`) mais o tempo até `#/criar` arrancar: `horaRetoma(a, agoraLocal)` em `src/core/passagem.ts`, `guardarAssumir` em `useCliente` (`src/core/ligacao.ts`). Teste do caso real (50/50 a 3) em `passagem.test.ts`.
- ✅ Rascunhos: `src/ui/rascunho.ts` (`useRascunho` = `useState` guardado no `sessionStorage` por grupo código+jogo+ronda; `useSoRascunho(ativo)` no ecrã do jogo apaga o resto fora das fases de escrever, para o "jogar outra vez" começar limpo). Usado no 50/50 (frase sorteada, trocas, textos), Pensa (post-its + final), Mona (desenho + título; título falso), Ideias (problema; desenho + nome + slogan), Se Vira (título + imagens), Wi-Fi (pistas).
- ✅ Nomes dos bonecos: chave `nomesBonecos` (18 nomes separados por `|`) em `src/i18n/*.json`, `nomeBoneco(n)` em `src/ui/bonecos.tsx` (grelha de `Jogar.tsx` e `aria-label` do desenho).
- Verificado no browser (Supabase real, Vite sem HMR `nob-semhmr2` → 5196, config no scratchpad desta sessão): 50/50 Ana + Bruno + bot; fechar Ana → Bruno assume em 93 s e pausa, rascunho/frase/trocas iguais; Ana volta → retoma em ~92 s. Repetido ao contrário (fechar Bruno → Ana assume em 66 s, retoma ~65 s). O `nob-semhmr` antigo já não arranca (falta o `define` de `__VERSAO__`).
- 311 testes, tsc e lint a 0.

## 18/11/2026 — Auditoria E2, E3, E5, E6, T13 (lobby com TV, tutorial na TV, popups)
- Lobby do líder com TV: um cartão "Jogo e opções" (escolher jogo → só as opções dele, "Mostrar tutorial", "▶ Começar"): `OpcoesComTv` (`src/jogar/MenuJogos.tsx`) + `src/jogar/lobbyTv.ts`.
- TV: `TutorialTv` em `src/tv/Tv.tsx` (OK/Voltar = saltar). A TV passa a dar aos ecrãs dos jogos a hora do anfitrião (`agora` do `useHost`) em vez de `Date.now`: depois de recarregar a TV, o relógio dela ficava ~15 s atrás dos telemóveis.
- Popup da app `src/ui/confirmar.tsx` (`Confirmar`) em vez de `confirm()`; também em `src/ui/saidas.tsx` ("Acabar"). Já não há `confirm()` nativo no `src`.
- `Jogar.tsx`: 6 s à espera → "Party não encontrada" + Voltar (`useEsgotado`).
- Versão: `package.json` (0.3.0) → `__VERSAO__` (`vite.config.ts`, `define`). Ao subir a versão do APK, mudar só o `package.json`.
- CSS: `select` com o estilo dos `input`; checkboxes com tamanho próprio (antes esticavam a 100%).
- Por fazer: OK na TV sobre o jogo em destaque não sabe da caixa do tutorial (precisava de um campo na sala).

## 18/11/2026 — Registo de jogos (auditoria §9)
- **Jogo novo, como ligar** (nada mais em `sala.ts`, `Tv.tsx`, `Jogar.tsx`, `MenuJogos.tsx` ou `saidas.ts`):
  1. pasta `src/jogos/<jogo>/` com `regras.ts` (estado com `fase`, `terminaEm`, `pausaRestante`, `participantes`, `audiencia`, `usadas`), `tv.tsx`, `telemovel.tsx`, `definicoes.tsx`;
  2. entrada em `JOGOS` de `src/core/registo.ts`: `id`, `chave` (campo na sala), `chaveDef`, `definir` (ação das opções), `padrao`, `min`/`max`, `soTv?`, `novo`, `reduz`, `aceita` (as ações do jogo), `soLider?`, `vista`, `privado?`, `ganchos?` (saídas a meio). Os tipos de `EstadoSala`, `VistaSala` e `AcaoSala` saem daqui sozinhos;
  3. entrada em `ECRAS` de `src/jogos/ecras.tsx` (o TypeScript obriga): `tv`, `telemovel`, `opcoes` (nome + render), `vibrar`, `versaoPrivado?`;
  4. linha no menu: `CATALOGO` em `src/core/jogos.ts` (com `feito: true`).
- O teste `src/core/registo.test.ts` corre para todos os jogos do registo: a vista pública não leva tags nem segredos (papéis do Pirata/Máquinas, cartas do Rei, palavras do Wi-Fi, mão e pontos das Máquinas). Num jogo novo com segredos, juntar uma linha a `SEGREDOS`.
- Helpers comuns em `src/core/jogo.ts`: `podio`, `irPara`, `pausaPorFalta`, `quantosLigados`, `normalizar` (usados pelos 9 jogos; o `irPara` do Se Vira! e do Wi-Fi ficaram locais, porque tratam o relógio do fim de outra maneira).
- As opções do 50/50 passaram de `src/tv/Tv.tsx` para `src/jogos/5050/definicoes.tsx` (`Definicoes5050`).
- O Ragerob ainda não está ligado à sala: entra no registo quando for ligado.
- 296 testes verdes (12 novos), tsc e lint a 0. Browser: com TV (50/50: opções, enviar, "é a sua", voto de bot) e sem TV (menu, Pirata com papel pelo canal privado). Sem commit.

## 17/11/2026 — Segurança da sala (T8)
- Código da sala com 5 letras (`codigoSala`, `CODIGO_VALIDO` 4–6 em `src/core/ids.ts`).
- Fechar party e expulsar: regras puras em `src/core/membros.ts` (chamadas por `reduzSala`: `entrar`, `fechar`, `expulsar`; estado `fechada`/`barrados`/`expulsos`); o host barra id + chave (`ProtocoloHost.barrar`, chamado em `useHost.despachar`); UI em `src/ui/membros.tsx` (popup do jogador no lobby, botão fechar, "👥 Jogadores" em jogo, avisos de expulso/à porta).
- **Registo de jogos**: ao refazer `sala.ts`, manter o guarda de expulsos no topo de `reduzBase`, a `porta()` no `entrar` e o filtro de expulsos no `ligados`.
- 284 testes verdes (10 novos); tsc e lint a 0. Verificado no browser (TV + 3 telemóveis): fechar/abrir, barrado com aviso, expulsar no lobby e a meio do 50/50. Sem commit.

## 17/11/2026 — Auditoria + "Segredos e segurança"
- Relatório: `info/auditoria/2026-11-17.md` (achados por jogo e por tema; topo = o que já foi corrigido).
- Corrigido: sorteios com sal secreto (`src/core/ids.ts`); vista assinada pela TV, ações cifradas/autenticadas e sem repetição, privados cifrados por aparelho (`src/core/cripto.ts`, `protocolo.ts`, `ligacao.ts`, `privado.ts`; dependências novas `@noble/curves`, `@noble/ciphers`, `@noble/hashes`); marcas em vez de tags nas vistas (`contextoMarca`/`minhaMarca`); Wi-Fi pelo privado; Máquinas sem pontos a meio; Mona sem placa denunciada; 50/50 com o autor anónimo nas caixinhas.
- O QR da TV leva `&k=<impressão>`; links antigos sem `k` continuam a dar (confia na 1.ª TV).
- Jogos novos: segredos só em `privadoSala`; "és tu" só por `tagDe` (que já devolve a marca); nunca `agora` como única fonte de sorte (o `baralhar` já tem o sal).
- 222 testes verdes; tsc e lint a 0. Verificado no browser com o Supabase real. Sem commit.
- Ecrã único sem TV feito: `src/ui/ecraunico.tsx` (`Espera`, `Progresso`); sem separadores "Eu / Painel" em nenhum jogo. Jogos novos: à espera → `<Espera semTv texto palco>`; com ação → ação + `<Progresso>`; o palco compacto por baixo quando faz sentido.
- Saídas/entradas a meio feitas: `src/core/saidas.ts` (tolerância 10 s, pausa se faz falta, líder decide: trocar por espectador / seguir sem / acabar) + `src/ui/saidas.tsx`. **Jogo novo**: se alguém lhe faz falta, junta `importanteX`, `sairX` (e `foraX`/`podeSeguirSemX` se precisar) em `GANCHOS` de `saidas.ts`. Encravos do Rei, 50/50, Wi-Fi e Se Vira corrigidos.
- Acessibilidade feita: `src/ui/acessibilidade.ts` (teclado e "tocar para mostrar" nos botões de segurar, "texto grande"), contraste, foco, movimento reduzido, nomes acessíveis. **Jogo novo com "segurar para ver"**: usar `eventosSegurar`.
- Burocracia (parte do código) feita: fontes locais, política de privacidade (`app/public/privacidade.html`), links do Se Vira! desligados por defeito, filtro de palavrões (`src/core/filtro.ts`). O resto é do utilizador: `info/auditoria/burocracia-playstore.md`. **Decisão do utilizador (17/11): público-alvo 13+** (fora do programa "Famílias"; a GIPHY pode ficar).
- Keep-alive: `.github/workflows/keepalive.yml` (seg. e qui.) lê `public.keepalive`; o utilizador tem de criar a tabela (SQL em `info/auditoria/burocracia-playstore.md`) e fazer push.
- Copyright feito (decisões do utilizador): Máquinas com números próprios (7🔧/12💥, veto e IA-Piloto aos 4💥, poderes novos); Rei com nomes novos (Vidente, Caçador/Fugitivo/Sósia, Sapo Enfeitiçado); "Senha do Wi-Fi" mantém o nome.
- Próximo (do relatório): balanceamento; segurança do código da sala; registo de jogos.

## 17/11/2026 — O Rei e o Dragão (jogo 8)
- `src/jogos/rei-dragao/`: `regras.ts` (reducer puro), `tv.tsx`, `telemovel.tsx` (Eu/Painel sem TV; Identidade a segurar 3 s; ℹ️ Informações), `comuns.tsx` (`Castelos` = 2 torres + ponte + relógio; `Segurar` vem da Revolução), `definicoes.tsx`, `rei.css`, `demo.tsx`.
- Canal privado: o mesmo (`privadoSala` → `privadoRei`: carta, equipa real, batata, pedidos/trocas, voto, reféns do líder). A vista tem `seq` (muda a cada ação) para os telemóveis voltarem a pedir. Pirata e Revolução intactos.
- Sala: `EstadoSala.rei`/`defRei`, `definir_rei`, `comecar` com `jogo: 'rei'`; ações `rd_*`. Catálogo: `feito: true`, 6–24, com e sem TV. `src/core/jogos.test.ts`: o exemplo "em breve" passou do Rei para o Ragerob.
- Decisões do utilizador (17/11):
  - visual: **duas torres** (Sala 1 azul, Sala 2 vermelha) **ligadas por uma ponte**; à meia-noite o boneco do jogador Dragão vira dragão e cospe fogo na torre dele (não há dragão a dormir);
  - equipas: 🔵 **Corte / Court**, 🔴 **Rebeldes / Rebels**; o papel 😤 Rebelde chama-se **Duque Rebelde / Rebel Duke**;
  - Rei e Dragão sempre; o resto são membros simples da Corte/Rebeldes; extras ligam/desligam um a um nas opções avançadas; ajuste "Rebeldes a mais/menos" (−2…+2; padrão equilibrado);
  - Escudeiro/Domador: só objetivo próprio (+500), não decidem a vitória;
  - **sem troca mútua** (nem botão "Trocar com…"): quem tem a 🥔 segura "Mostrar carta", ao largar escolhe a quem mostrou, e essa pessoa aceita (fica com a batata) ou recusa;
  - "Mostrar cor" e "Mostrar carta" ficam em baixo; é preciso segurar 2 s (barra de progresso); toque curto = aviso "Segure 2 s para revelar"; a carta some ao largar;
  - o líder nunca é refém e continua líder; Traidor: carta de uma cor, joga pela outra; Gémeos e Rivais: um 🔵 e um 🔴.
- Decisões tomadas sem o utilizador (confirmar):
  - extras até metade dos lugares (sem Rei/Dragão), sorteados entre os ligados; extras de cor livre vão para a equipa a que faltam mais;
  - salas e líderes sorteados; "Pronto"/"OK" sem limite de tempo (quem desliga deixa de contar); líderes mostrados 6 s;
  - troca de reféns também na última ronda; fase da troca 30 s ou até todos os reféns carregarem "Cheguei";
  - votação de líder: pode mudar o voto; maioria absoluta dos que estão na sala; ao trocar de líder, os reféns escolhidos apagam-se;
  - os 🔵🔴 só ganham o +500 do papel se a equipa ganhou; quem fica com a batata no fim perde tudo (0 pontos);
  - Arqueiro: +1000 se apontar ao Alvo; aposta/alvo 30 s (acaba cedo); sem Apostador nem Arqueiro, salta direto para a meia-noite;
  - "Mostrar cor/carta" é só local (não muda o estado); quem pediu para passar a 🥔 pode cancelar; pausa abaixo de 3 ligados; sem sons ainda.
- Conteúdo: o jogo não precisa (só textos em `src/i18n/`, pt-BR + en).
- Testes: `regras.test.ts` (16) + `sala.test.ts` (2). 220 verdes; tsc e lint a 0.
- Verificado no browser (sem TV, Supabase real, líder + 5 bots): Pronto → cartas privadas certas para cada bot → líderes → votação de líder (2 de 3) → reféns nos últimos 30 s → troca com "Cheguei" → rondas seguintes pelo tempo até à meia-noite. A 🥔 só pelos testes e pela demo (não calhou no sorteio).
- Capturas: `info/progresso/8-rei-dragao/` (rota dev `#/demo-rei?fase=ir|carta|lider|ronda|refens|batata|votar|troca|aposta|fim&ecra=tv|tel[&eu=j1][&id=1][&semtv=1][&zoom=1.2136]`; Edge headless `--screenshot`, 500 px + zoom para o telemóvel).
- Próximo: jogo 9, Ragerob (visual por decidir: propor 2–3).

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
