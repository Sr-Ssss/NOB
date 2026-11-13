# 🤖 Rinha de Robôs (Robot Brawl) — v2 em planeamento
Robôs modulares lutam sozinhos (IA) num torneio visto de cima (2D) na TV. Os jogadores apostam, compram módulos em leilão e podem pagar para controlar o seu robô durante uns segundos.

- Jogadores: 2–10. **Precisa de TV.**
- Assets das locomoções: reaproveitar do projeto `../Rob/assets/sprites/robot/loco_*.svg`. Carroçarias e cabeças são novas.

## Robô = Carroçaria + Locomoção + Cabeça + Módulos
### Carroçarias (o número de encaixes = módulos)
| Forma | Encaixes |
|---|---|
| 🔺 Triângulo | 3 |
| ⚪ Bola | 3 |
| 🟦 Quadrado | 4 |
| ▬ Retângulo | 4 em linha |
| ⬟ Pentágono | 5 |

### Locomoção (o número de rodas/pernas é só visual e adapta-se à carroçaria)
| Tipo | Comportamento |
|---|---|
| Rodas | rápido, escorrega |
| Lagartas | lento, difícil de empurrar |
| Pernas | passa por cima de perigos no chão; não escorrega no óleo |
- Só 3 tipos (decisão do utilizador): Rodas, Pernas, Lagartas.

### Cabeças (personalidade da IA)
| Cabeça | Arma | IA |
|---|---|---|
| 🐓 Galo | crista-serra, dano contínuo | ataca de frente |
| 🐊 Crocodilo | morde e agarra | persegue e agarra |
| 🦏 Rinoceronte | pico; muito dano em investida | investe de longe |
| 🐐 Bode | estica a cabeça e recolhe-a, empurrando forte | atira os outros contra perigos |
| 🦔 Ouriço | **tambor giratório à frente** (só o tambor gira, o corpo não); demora a ganhar velocidade; no impacto projeta os 2 robôs, com mais dano no inimigo | ganha rotação longe, depois ataca |

### Módulos (10)
| Módulo | Efeito |
|---|---|
| 🔩 Picos laterais | dano fixo a quem bate de lado |
| 🔨 Martelo | pancada forte na zona à frente |
| 🔥 Lança-chamas | rajada de 1 s, depois uma recarga curta |
| 🛡️ Escudo | bloqueia um dos lados |
| 🚀 Propulsor | acelera de repente |
| 🛢️ Óleo | larga poças escorregadias |
| 🎆 Fogo de artifício | dano em área |
| 🥊 Pistão lateral | soco de lado que empurra |
| 💧 Canhão de água | jato que empurra e deixa poças de água; apaga o fogo |
| ⚡ Bobina elétrica | descarga de dano à volta do robô |

### Combos
- Óleo + Lança-chamas/Fogo de artifício → poça a arder durante uns segundos.
- Água + óleo a arder → apaga e faz vapor (corta o combo do fogo).
- Água + Bobina → **poça eletrificada**: dano a quem estiver em cima (incluindo o próprio robô).
- Bode/Pistão + perigos da arena ou poças → empurra o inimigo para cima delas.
- Bode/Pistão do inimigo contra os teus Picos laterais → dano extra.
- Propulsor + Rinoceronte → investida devastadora.
- Escudo contra Galo/Ouriço → bloqueia (faíscas).

## Comando (quando um humano controla)
- Estilo de carrinho telecomandado antigo:
  - lado esquerdo: ▲ frente / ▼ trás;
  - lado direito: ◀ ▶ rodar.
- Os módulos e a cabeça atuam sozinhos (IA). O humano só conduz.

## Torneio (padrão 3 rondas, configurável)
- 8 robôs gerados ao acaso.
- Ronda 1: 2 combates de 4, passam 2 de cada.
- Ronda 2: 1 combate de 4, passam 2.
- Final: 1 contra 1.
- Com mais rondas começam mais robôs (12/16).
- Arena com perigos (serras no chão, buracos, paredes com picos, martelos que caem) e eventos aleatórios (gravidade baixa, chuva de parafusos, arena a encolher).

## Dinheiro (todo dos jogadores, sem banca)
- **Apostas** antes de cada combate: 1 robô por jogador, valor livre, mínimo 50.
- **Loja** por ronda, com 5 módulos:
  - partilhada: ofertas secretas e ao mesmo tempo; no fim do tempo ganha a oferta mais alta; empate = sorteio;
  - opção nas definições: loja privada (5 módulos por jogador, sem leilão).
  - Trocar um módulo que já existe custa +50%.
- **Controlar**: paga-se para conduzir durante 5 s **o robô em que se apostou**; 1 pessoa de cada vez por robô (fila).
- **Módulos**: ficam no inventário de quem os compra. Só se instalam no robô em que esse jogador apostou no combate atual (ordem: comprar → apostar → instalar).
- **O dinheiro conserva-se**: nunca aparece dinheiro novo. Só sai do bolso de alguém em compras ou numa aposta perdida, e só entra no bolso de alguém vindo do bolo de apostas.
- **Proposta: Entrada obrigatória** (para quem aposta ganhar mais do que quem não aposta):
  - Em cada combate, todos põem automaticamente uma **entrada** (padrão 50) no bolo.
  - Quem escolhe um robô: a entrada conta como aposta, mas tem de juntar **pelo menos +50** (aposta mínima num robô = 100). Pode juntar mais.
  - Quem tem menos de 50 paga o que tem. Com 0 fica a assistir (sem apostas nem compras).
  - Quem não escolhe: perde a entrada para o bolo.
  - O bolo é dividido por quem apostou no **vencedor** do combate, proporcionalmente.
  - Se ninguém acertou, o bolo passa para o combate seguinte (acumula).
  - No fim do torneio, se ainda sobrar bolo, vai para quem apostou no campeão; se ninguém, divide-se pelos que apostaram na final.
- **Preços propostos** (usados na partida simulada):
  - capital inicial **1500** (decidido);
  - Óleo/Escudo/Água 100; Picos/Propulsor/Pistão 150; Lança-chamas/Martelo/Fogo de artifício/Bobina 200;
  - trocar um módulo: +50% do preço do novo;
  - controlar o robô durante 5 s: 100.
  - Leilão: só se pode licitar em módulos que se consigam pagar. Arredondamento do bolo: para baixo; o resto vai para quem apostou mais.
- O robô parte só com carroçaria + locomoção + cabeça; os módulos vêm todos da loja.
- ✅ Confirmado pelo utilizador. Entrada e mínimo configuráveis (padrão 50 + 50).

## Modo Pilotos
- Cada jogador monta e controla o seu robô; a IA completa até 8.
- Sem apostas. O dinheiro para a loja ganha-se pelo desempenho (dano, sobrevivência, eliminações).
- ✅ Decidido (13/11/2026):
  - **Formato liga**: ninguém é eliminado. Em cada ronda há combates de 4 com grupos sorteados (os bots completam os grupos). Todos jogam todas as rondas. Rondas: padrão 4, configurável.
  - **Conduzir**: cada humano conduz o seu robô durante todo o combate (o comando é o mesmo). A cabeça e os módulos atuam sozinhos.
  - **Pontos de colocação** por combate: 1.º 3, 2.º 2, 3.º 1, 4.º 0. Ganha quem tiver mais pontos no fim. Desempate: dano total causado.
  - **Dinheiro por combate** (aqui o dinheiro é novo, não há bolo): 200 por participar + 1 por cada ponto de dano causado + 100 por KO + colocação (1.º 300 / 2.º 200 / 3.º 100). O último da tabela recebe +100 de recuperação.
  - Capital inicial 1500. Loja e preços iguais aos do modo normal. O dinheiro só serve para comprar e não conta para a vitória.
  - Boa prática: o dano por combate tem um teto de 300, para um robô não "farmar" um bot parado. Os bots compram com a mesma regra, para manter o equilíbrio.
