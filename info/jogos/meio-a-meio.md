# Meio a Meio ✅ planeado
O autor escreve uma pergunta com 2 respostas e tenta dividir a sala exatamente ao meio.

- Jogadores: 3–16 (com 3 aparece um aviso). A partir do 17.º entram como audiência (vota e conta para a divisão, mas não pontua).
- Com 10 ou mais jogadores, o padrão passa a 2 rondas. A grelha da TV passa a 2 linhas.

## Definições (VIP, no lobby)
| Opção | Valores | Padrão |
|---|---|---|
| Rondas | 2 · 3 · 5 | 3 |
| Escrever | 30 · 60 · 90 · 120 s | 60 s |
| Votar | 10 · 15 · 30 s | 15 s |
| Mostrar quem votou o quê | Sim · Não | Sim |
| Temas | Todos · escolher | Todos |
- Fixos: mostrar 6 s, revelar 6 s, placar 8 s.

## Escrever
- O ecrã abre já preenchido com uma frase aleatória com lacuna e as respostas **SIM / NÃO**.
- Botão de alternância **Completar | Escrever a minha**, que se pode trocar a qualquer momento; os dois rascunhos ficam guardados.
  - No modo Completar há 🔄 para trocar de frase, até 2× por ronda.
- Limite de 150 caracteres. As duas respostas podem ser editadas (por defeito Sim/Não).
- **Sem filtro** no texto do jogador. Só as frases do jogo têm de ser família.
- Botão Enviar. Caixinha de estado (✅ enviou / ❌ ainda não) na TV e nos telemóveis.
- A fase acaba quando todos enviarem ou quando o tempo terminar.
- **Não enviou = não conta**: o dilema não vai a votos e o autor faz 0 pontos. Sem preenchimento automático.

## Votar (por dilema, por ordem aleatória)
- Mostrar → votar (todos menos o autor; fecha quando todos votam, por isso o ecrã não promete mudar o voto; caixinha ✅/❌) → revelar (barra, autor e, se a opção estiver ligada, os avatares de cada lado).
- O autor fica anónimo até à revelação.
- **Quem vota não ganha pontos.**

## Pontos (só o autor)
- `n` = votos, `d` = |A − B|.
- Pontos = `round(1000 × (1 − d/n))`. Com `d ≤ 1`: +500 (divisão perfeita).
- 0 votos → 0 pontos. Última ronda ×2.

## Visual
- **TV: balança grande, com ar meio 3D** (o utilizador pode mandar um desenho de referência):
  - pergunta no topo;
  - **SIM e NÃO dentro dos pratos** da balança;
  - **timer no meio da balança** (no eixo);
  - na revelação, os bonecos caem **um de cada vez** no prato que votaram e a balança vai pendendo; divisão perfeita = balança direita.
- **Telemóvel — escrever**: modo **Completar** = frase + 🔄 e as 2 respostas como **2 botões coloridos** (vermelho SIM / azul NÃO), editáveis com um toque; modo **Escrever a minha** = **formulário simples** (caixa da pergunta + 2 campos de resposta). Botão Enviar em baixo; ⓘ no topo.
- **Telemóvel — votar**: pergunta no topo + **2 botões gigantes** (metade do ecrã cada um, vermelho/azul); o voto escolhido fica com ✓ ("Voto registado"); pode mudar-se enquanto falta alguém, mas o ecrã não o promete. Com "Mostrar quem votou = Não" a vista só leva contagens.
- **Telemóvel (geral)**: com TV, o telemóvel fica no ecrã de votar até ao fim; **sem TV**, no fim da votação o telemóvel mostra a balança.

## Fim
- Pódio (empates partilham o lugar).
- Prémios só para mostrar: Mestre do Meio, Unanimidade, Último Segundo.
- "Jogar outra vez" (sem repetir frases) ou "Menu".

## Casos especiais
- Votante desliga-se: não conta para `n`.
- Quem volta a entrar retoma na fase atual.
- VIP desliga-se: passa para o jogador seguinte.
- Menos de 3 ligados: o jogo pausa.

## Conteúdo
- 300 frases família (pt-BR + EN), 6 temas × 50 (Comida, Escola/Trabalho, Animais, Superpoderes, Férias, Casa).
- Cada sessão sorteia sem repetir.
