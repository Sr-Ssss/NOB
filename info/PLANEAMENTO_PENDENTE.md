# Planeamento — estado e o que falta (13/11/2026)

Ficheiro para continuar o planeamento numa sessão nova. A implementação do MVP corre noutra sessão ("mvp-nob", ver `info/PLANO_MVP.md`); **esta sessão de planeamento não escreve código**.

## Já decidido (fonte de verdade)
- Arquitetura, party, idiomas, nomes dos jogos, design dos menus: `info/arquitetura.md`.
- Armadilhas técnicas e da Play Store: `info/regras/plataforma.md`, `info/regras/proximidade.md`.
- Regras de cada jogo (ficheiros com nomes antigos):
| Ficheiro | Nome atual (PT / EN) | Estado |
|---|---|---|
| `jogos/meio-a-meio.md` | 50/50 | ✅ |
| `jogos/respostas-rapidas.md` | Pensa-Dores / Deep Thinkers | ✅ |
| `jogos/apresentacao-surpresa.md` | Se Vira! / Wing It! | ✅ |
| `jogos/rabiscos.md` | Mona Lixa / Mona Lies | ✅ |
| `jogos/invencoes-inuteis.md` | Ideias Mirabolantes / Harebrained Ideas | ✅ |
| `jogos/pirata-a-bordo.md` | Pirata / Pirate | ✅ |
| `jogos/dois-lados.md` | O Rei e o Dragão / The King and the Dragon | ✅ |
| `jogos/motim-em-orbita.md` | Revolução das Máquinas / Machine Uprising (todos são robôs; nomes de papéis como antes) | ✅ |
| `jogos/encriptado.md` | Senha do Wi-Fi / Wi-Fi Password | ✅ |
| `jogos/rinha-de-robos.md` | Ragerob | ✅ |
| `jogos/npn.md` | Operação N.P.N. | 🟡 regras quase fechadas (ver abaixo) |

## Preferências do utilizador (aprendidas)
- Quer ver propostas curtas e escolher; muitas vezes pede "decide tu". Perguntas por formulário (AskUserQuestion) com ⭐ na recomendada.
- Cria a app sozinho (3.ª app): aceita boas práticas — incluí-las por iniciativa, marcadas "boa prática".
- Rejeitou: PIN / "Sou eu" (volta-se pelo nome).
- Gosta de: escrita livre (sem frases pré-feitas obrigatórias), texto pré-preenchido editável, botão Enviar com caixinha ✅/❌ de quem já enviou, poucas definições (só o criador da sala mexe), ninguém eliminado/aborrecido, nada de sorte pura.
- Não gosta de: filtro de palavrões (só o conteúdo do sistema tem de ser família), preenchimento automático, pagar para jogar, botões a mexer, ecrãs poluídos, temas repetidos (lobisomem, nave espacial já usada).
- Conteúdo da app: PT = **português do Brasil** + EN. Planeamento/conversa: PT-PT.
- Nada de nomes com marca registada (Picasso, Van Gogh…), títulos de filmes ou palavras com duplo sentido em EN.

## Para a próxima sessão (13/11/2026)
- Fechados nesta sessão: ponto 1 (ecrãs) e ponto 2 (bonecos) → `arquitetura.md` secção "Ecrãs"; ponto 3 em pausa (7/10 jogos, visual em cada `jogos/<jogo>.md`).
- Mudanças que a sessão **mvp-nob** ainda não conhece: líder = 1.º a entrar (passa liderança); nomes únicos, volta-se pelo nome (sem PIN); código sempre em baixo; modos rápido/votação/torneio (pontos por colocação); conta Google ≠ nome.
- Começar pelo **ponto 6 (Ragerob · modo Pilotos)**; depois 5, 7, 8, 9, 10; o 4 (logo) e o resto do 3 quando o utilizador quiser voltar ao design.
- Ritmo: o utilizador quer rapidez — 1 proposta visual + 1 pergunta por item, sem animações.

## O que falta planear (por ordem sugerida)
1. ✅ **Ecrãs da app** — fechado em `arquitetura.md` → "Ecrãs". Ficam para depois: vídeos tutoriais e desenhos do "Como jogar" (ponto 3); menu de escolha de jogo no telemóvel do líder sem TV (vertical, já descrito).
2. ✅ **Bonecos (avatares)** — `arquitetura.md` → "Bonecos": 18 formas abstratas rabiscadas (lista fechada), cores base, só piscar. Falta a arte final.
3. 🟡 **Visual de cada jogo** (10) — feitos: 50/50, Pensa-Dores (a rever: o tema sala de aula fugiu ao das cores da app), Se Vira!, Mona Lixa, Ideias Mirabolantes, Pirata, O Rei e o Dragão. **Pausado pelo utilizador** (cansou de design): faltam Revolução das Máquinas (propostas: robô+baterias ⭐, sala de controlo, terminal), Senha do Wi-Fi, Ragerob. Regra para jogos com papéis secretos: texto igual para todos + botão Identidade (segurar 3 s). estilo próprio dentro do jogo; mostrar 2–3 propostas desenhadas por jogo.
4. **Logo e ícone da NOB**.
5. ✅ **Som** — em `arquitetura.md` → "Som (TV)". Falta a origem e a licença dos sons (adiado).
6. ✅ **Ragerob — modo Pilotos** — liga + fórmula mista, em `jogos/rinha-de-robos.md`.
7. 🟡 **Operação N.P.N.** — o jogo fica parado. Ecrã de teste BLE decidido (`jogos/npn.md` → "Agora"). O resto fica para depois:
   - já decidido: Android only; ação = 2 cliques no volume com o ecrã desligado; vitória individual por pontos; sem facção vencedora;
   - Gambler/Apoiantes passam a: Gambler aposta se o Assassino vai ser intercetado (+50); Apoiante N.P.N. +20 se o Assassino for intercetado; Apoiante L.P.E. +20 se nunca for (✅ aprovado);
   - falta: design, Batata Quente com BLE, calibração do Bluetooth, duração/definições finais. Atualizar `jogos/npn.md` (ainda tem a secção "Contacto" rejeitada e a proposta antiga de facção vencedora).
8. 🟡 **Conteúdo** — em curso na sessão "conteudo-nob" (`conteudo/`): milhares de frases/perguntas/palavras em PT-BR + EN. Proposta: Claude gera, o utilizador revê.
9. **Play Store** (pode bloquear a publicação):
   - conteúdo gerado pelos jogadores → a Google exige uma forma de denunciar/ocultar (ex.: "🚩 ocultar" no ecrã do criador);
   - app para família → regras de família da Google (AdMob em modo família, política de privacidade);
   - ficha da loja: descrição, capturas, classificação etária.
10. ✅ **Atualizar `info/PLANO_NOB.md`** — v3 a 13/11: nomes novos, fase Party, líder/nomes/sem TV no núcleo, Ragerob v2 + Pilotos, Play Store, NPN nativo.
