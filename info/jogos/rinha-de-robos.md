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
| 🦔 Ouriço | **mangual**: bola de espinhos (ouriço enrolado) presa por corrente, gira à volta do robô (só a bola gira, o corpo não); demora a ganhar velocidade; no impacto projeta os 2 robôs, com mais dano no inimigo (16/11: trocado do tambor, para não repetir a serra do Galo) | ganha rotação longe, depois ataca |

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
| ⚡ Bobina elétrica | raio elétrico curto para o lado onde aponta (16/11: antes era à volta do robô) |

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
- Arena com perigos (serras no chão, paredes com picos, martelos que caem, espinhos do chão, pistão de parede, tapete rolante, prato giratório; cada arena sorteia 3–4) e eventos aleatórios (íman da grua, chuva de parafusos, arena a encolher). Nada mata de uma vez (16/11: saíram os buracos e a gravidade baixa).

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

## Visual — "sucata no quintal"
- ✅ Escolhido pelo utilizador (16/11/2026), entre 3 propostas (A prancheta azul-noite, **B sucata no quintal**, C desenho à mão com lápis de cor). O jogo foge às cores da app de propósito (estilo próprio do jogo).
- **TV (vista de cima, 2D)**:
  - chão de **terra batida** (bege/castanho) com pedrinhas; pista marcada com **tinta castanha tracejada**;
  - **pneus empilhados** nos cantos e sucata espalhada (chapas, latas) como decoração parada;
  - perigos e poças rabiscados (ver "Peças" → "Perigos, poças e eventos");
  - **robôs**: traço preto grosso e irregular (como os bonecos), cores base vivas, olhos que **só piscam**; locomoção reaproveitada de `../Rob/assets/sprites/robot/loco_*.svg`; cabeça à frente; módulos desenhados nos encaixes (percebe-se o robô sem ler);
  - por cima de cada robô: barra de vida; quando alguém conduz, aparece "⚡ Rita a conduzir · 3 s";
  - painel à direita (chapa de metal): bolo, quem apostou em cada robô, combos ativos; no modo Pilotos, tabela de pontos;
  - faixa inferior castanho-escuro com o código (código sempre em baixo).
- **Telemóvel** (mesmo tema: fundo creme-areia, botões em **metal cinzento** com contorno escuro; parados):
  1. **Comando**: topo com o nome do robô + vida + tempo restante; à esquerda ▲/▼ grandes, à direita ◀/▶; nota "cabeça e módulos atuam sozinhos";
  2. **Apostas**: lista dos robôs do combate (desenho + nome) + valor (mínimo indicado) + Apostar;
  3. **Leilão / loja**: topo "Leilão · tempo" + o meu dinheiro; 5 cartões de módulo, cada um com o campo da oferta (esbatido se não dá para pagar); botão **Enviar ofertas** + caixinha ✅/❌ de quem já enviou;
  4. **Instalar**: o meu robô com os encaixes vazios; tocar num módulo do inventário → encaixe;
  5. **Fim do combate**: ganhaste/perdeste + dinheiro + "Olha para a TV".
- Sem TV: o Painel mostra a arena em pequeno + tabela.
- Boa prática: cada robô tem **nome com cor** (ex.: "Galo Pimenta", "Rino Couve"), para se distinguir também sem ver cores.
- Boa prática: o chão de terra é claro e os robôs têm contorno preto, o que dá contraste à distância na TV; os perigos distinguem-se também pela forma, não só pela cor.
- Boa prática: os botões do comando têm ≥ 72 dp e ficam fixos nos cantos, para se conduzir sem olhar.

### Peças (desenho, uma a uma)
- **Carroçarias** ✅ (16/11):
  - chapa vista de cima, contorno preto grosso, cantos tortos, 1–2 riscos de "amolgadela" num tom mais escuro da mesma cor;
  - encaixe = **parafuso cinzento** com cruz; fica tapado quando se instala um módulo;
  - pequena **seta preta** no lado da frente (onde vai a cabeça);
  - encaixes: triângulo 3 (1 à frente, 2 atrás), bola 3, quadrado 4 (2×2), retângulo 4 em linha, pentágono 5;
  - boa prática: a forma diz o tipo e a cor é sorteada por robô, sem repetir no mesmo combate.
- **Locomoções** ✅ (16/11) — base nos `loco_*.svg` do Rob (cinzento-escuro, traço preto):
  - **Rodas**: pneus pretos com 2 riscos; rasto fino tracejado;
  - **Lagartas**: 2 lagartas com elos; rasto largo;
  - **Pernas**: 4 pernas de caranguejo articuladas (anca redonda + 2 segmentos); pegadas;
  - o número de rodas/pernas acompanha a carroçaria (ex.: triângulo 3, retângulo 6, pentágono 4);
  - **rasto/pegadas na terra** que somem em 2 s; boa prática: diz o tipo de locomoção mesmo com o robô tapado por fumo ou fogo.
- **Cabeças** — estilo comum: placas angulosas com contorno preto grosso (como o crocodilo), cada uma com a arma de um robô de combate real e o traço do animal; **olhos próprios do animal** (só piscam). Cor fixa por animal; a carroçaria é que é sorteada.
  - **Galo** ✅: 2 placas vermelhas que fecham em bico amarelo; **serra circular vertical** a sair pela frente, entre as placas (vista de cima: lâmina fina com dentes nas pontas); sem crista dos lados; olhos redondos laranja com pupila pequena (de lado).
  - **Rinoceronte** ✅: cunha cinzenta blindada em 2 camadas; **lança** comprida creme à frente + pico pequeno; olhos pequenos pretos com sobrancelha zangada.
  - **Bode** ✅: **rampa** larga creme (lança os outros, como um *flipper*) num pistão; chifres castanhos enrolados nos cantos; olhos amarelos com pupila retangular deitada.
  - **Crocodilo** ✅: **visto de cima**, com 2 estados: à espera, a mandíbula de cima fica levantada e vê-se só a de baixo (boca rosa, dentes brancos nas bordas); ao bater, **fecha** e vê-se o focinho verde com narinas e escamas + linhas de impacto. Olhos amarelos com pupila em fenda, em saliências.
  - **Ouriço** ✅: **ouriço enrolado** numa bola castanha de espinhos (focinho creme pequeno + olhos pretos com brilho), presa à frente por uma **corrente** — um **mangual**. Ganha rotação à volta do robô (círculo tracejado no chão mostra o alcance) e projeta quem apanha. Mecânica diferente da serra do Galo.
- **Módulos** ✅ (16/11) — cada um numa **base cinzenta aparafusada** que tapa o encaixe; peça em metal + **1 cor de destaque** (a mesma no cartão da loja):
  - **Direção fixa**: cada encaixe aponta do centro do robô para fora (nos cantos, na diagonal). O módulo dispara/atua sempre para esse lado, **sem mira automática**: quem mira é o robô, ao rodar. Todos os módulos têm algo a apontar para fora;
  - seta vermelha da direção só na loja/instalação e no tutorial, nunca no combate (boa prática: ecrã limpo);
  - **Picos laterais**: lâminas creme para fora; **Martelo**: de pé com a cabeça alinhada para fora (vê-se de cima, face clara para fora) → na pancada o cabo deita para fora e a cabeça bate **com a face** no chão; **Lança-chamas**: depósito vermelho + bocal laranja para fora; **Escudo**: arco azul do lado de fora; **Propulsor**: tubeira para fora, empurra o robô para o lado contrário (escrito no ℹ️ da loja); **Óleo**: bidão preto com bico para fora, a poça cai desse lado; **Fogo de artifício**: 3 foguetes coloridos inclinados para fora; **Pistão lateral**: luva de boxe vermelha num pistão; **Canhão de água**: depósito azul + mangueira; **Bobina**: espiral de cobre com **2 elétrodos para fora** e raio curto amarelo nessa direção.
- **Perigos, poças e eventos** ✅ (16/11) — **nada mata de uma vez**; tudo o que dá dano tem **aviso antes** (faixa laranja tracejada, alvo ou nuvem). Cada arena sorteia 3–4 perigos (boa prática: arena não poluída):
  - **Serra no chão**: disco cinzento com dentes + faixa laranja de aviso;
  - **Parede com picos**: barra cinzenta com picos creme, na borda da pista;
  - **Martelo que cai**: alvo vermelho tracejado no chão 1 s antes;
  - **Espinhos do chão**: placa de metal com furos; os espinhos saem de vez em quando (aviso 1 s antes); dano;
  - **Pistão de parede**: placa laranja que sai da borda; **só empurra**;
  - **Tapete rolante**: faixa escura com setas laranja; arrasta para um lado (as lagartas resistem);
  - **Prato giratório**: disco de metal com setas curvas; roda o robô e estraga a mira (joga com a direção fixa dos módulos);
  - ❌ Buraco (rejeitado: "caiu, morreu"). Jato de ar (atira para trás, sem dano) ficou de fora, não foi escolhido.
  - **Poças**: óleo (preto com brilho), óleo a arder (labaredas laranja/vermelhas), água (azul), água eletrificada (azul + raios amarelos), vapor (nuvem creme, só tapa a vista);
  - **Eventos**: placa creme no topo da TV durante 3 s (ícone + nome):
    - **Íman da grua**: grua com um íman vermelho; puxa todos os robôs para um ponto durante 4 s;
    - **Chuva de parafusos**: parafusos caem do céu;
    - **Arena a encolher**: borda vermelha tracejada que avança;
    - ❌ Gravidade baixa (rejeitada: não faz sentido aqui).
