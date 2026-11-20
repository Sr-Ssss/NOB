# 🤖 Rinha de Robôs (Robot Brawl) — v2 em planeamento
Robôs modulares lutam sozinhos (IA) num torneio visto de cima (2D) na TV. Os jogadores apostam, compram módulos em leilão e podem pagar para controlar o seu robô durante uns segundos.

- Jogadores: 2–10. Com ou sem TV (sem TV desde 20/11: arena pequena em cada telemóvel).
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
| 🦔 Ouriço | **tambor pequeno** à frente: o ouriço enrolado, deitado, gira como um rolo de espinhos; demora a ganhar velocidade; no impacto projeta os 2 robôs, com mais dano no inimigo; área pequena e dano moderado (20/11: o mangual era forte demais e passou a tambor, a pedido do utilizador) | ganha rotação longe, depois ataca |

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
- **O dinheiro conserva-se** (exceção desde 20/11: a consolação, ver abaixo): nunca aparece dinheiro novo. Só sai do bolso de alguém em compras ou numa aposta perdida, e só entra no bolso de alguém vindo do bolo de apostas.
- **Proposta: Entrada obrigatória** (para quem aposta ganhar mais do que quem não aposta):
  - Em cada combate, todos põem automaticamente uma **entrada** (padrão 50) no bolo.
  - Quem escolhe um robô: a entrada conta como aposta, mas tem de juntar **pelo menos +50** (aposta mínima num robô = 100). Pode juntar mais.
  - Quem tem menos de 50 paga o que tem. Com 0 fica a assistir (sem apostas nem compras).
  - Quem não escolhe: perde a entrada para o bolo.
  - O bolo é dividido por quem apostou no **vencedor** do combate, proporcionalmente.
  - Se ninguém acertou, o bolo passa para o combate seguinte (acumula).
  - ✅ **Consolação** (decidido 20/11/2026): em cada combate, quem apostou num robô que perdeu recebe de volta uma parte calculada sobre **metade do bolo**, contando do fim: último 10%, penúltimo 20%, antepenúltimo 30% (num combate de 4: 4.º 10%, 3.º 20%, 2.º 30%; na final, o perdedor 10%). É **dinheiro novo** (não sai do bolo, que vai inteiro para quem acertou). Vários apostadores no mesmo robô dividem pelo valor apostado (para baixo; o resto para quem apostou mais). Paga-se mesmo quando ninguém acertou (o bolo acumula na mesma). KO ao mesmo tempo = os robôs empatados ficam no lugar mais alto do grupo.
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
- Sem TV (feito 20/11, Fase 10): a física corre no host (o telemóvel que tem a sala, `MotorRagerob` montado no `src/jogar/Criar.tsx`), que manda ~8 quadros/s (`rr_quadro`, só o host; `src/jogos/ragerob/quadro.ts`); cada telemóvel desenha a arena pequena por cima dos controlos, interpolando entre os 2 últimos quadros. No resultado e no fim, o telemóvel mostra a ordem/classificação; no fim o líder tem "Jogar outra vez" / "Menu".
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
  - **Ouriço** ✅ (20/11): **ouriço enrolado** deitado à frente, como um **tambor** castanho de espinhos (focinho creme pequeno + olhos pretos), num suporte de metal; os espinhos correm conforme gira; um arco laranja mostra quando está carregado. Projeta quem toca.
- **Crocodilo** (20/11): depois de morder, procura o perigo mais perto (serra, parede com picos, espinhos, fogo, água eletrificada) e arrasta a presa até lá (até 3 s); aí atira-a para dentro.
- **Perigos sólidos** (20/11): a serra e a parede com picos têm colisão; serra, parede, espinhos, pistão de parede e martelo que cai dão **knockback** (como ferro a tocar num disco).
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
  - **Eventos**: aviso **por baixo da arena** (fora da zona do combate) durante 3 s: caixa com riscas vermelhas e amarelas, ⚠️ dos dois lados, ícone + nome, pisca 3 vezes (20/11; antes era uma placa creme no topo):
    - **Íman da grua**: grua com um íman vermelho; puxa todos os robôs para um ponto durante 4 s;
    - **Chuva de parafusos**: parafusos caem do céu;
    - **Arena a encolher**: borda vermelha tracejada que avança;
    - ❌ Gravidade baixa (rejeitada: não faz sentido aqui).

## Estado da implementação e próximo passo (20/11/2026)
Para continuar numa sessão nova: ler isto, `info/arquitetura.md` (Ecrãs, Design) e a secção "Ragerob" de `info/PROXIMA_SESSAO.md`.

### Onde está
- Código em `src/jogos/ragerob/`:
  - `pecas.ts`: as peças, preços, cores com nome e direção dos encaixes;
  - `regras.ts`: o reducer puro (dinheiro, leilão/loja privada, apostas com entrada e consolação, torneio, liga Pilotos, controlar 5 s);
  - `fisica.ts`: Matter.js, só na TV (cabeças, módulos, combos, perigos sólidos com knockback, eventos, arena a encolher, IA);
  - `desenho.tsx`: robôs, arena e efeitos em SVG;
  - `tv.tsx`, `telemovel.tsx`, `comuns.tsx`, `definicoes.tsx`, `ragerob.css`;
  - `demo.tsx`: rota dev `#/demo-ragerob?fase=montar|loja|aposta|instalar|combate|resultado|fim&modo=normal|pilotos&ecra=tv|tel[&eu=j2]`.
- Ligações ao núcleo:
  - a entrada `ragerob` em `src/core/registo.ts` e em `src/jogos/ecras.tsx`;
  - `PropsTv.acao`, pela qual a TV manda `rr_vidas`/`rr_fim`;
  - `podeComecar`, que agora usa o mínimo de jogadores mais baixo entre os jogos (o Ragerob joga-se a 2);
  - os textos `rr*` em `src/i18n/`;
  - a dependência `matter-js`.
- A física anda pelo relógio real (rAF + `setInterval` de reserva), por isso continua a correr com a TV escondida.
- IA (`fisica.ts` → `ia()`): é uma máquina de estados que passa por rodear (vai para o flanco ou as costas do alvo), alinhar (pára e aponta a arma com o corpo), atacar e recuar (troca de lado). Também esquiva cargas de frente e larga o empurra-empurra ao fim de 0,45 s (o Galo aguenta 0,9 s).
  - Cada robô tem uma personalidade sorteada: agressividade, paciência, distância, flanco preferido, gosto por módulos e se prefere o alvo mais fraco.
  - Comportamento por cabeça:
    - Rino: carrega de longe;
    - Ouriço: espera que o tambor ganhe rotação;
    - Bode: põe o alvo entre si e um perigo;
    - Crocodilo: arrasta a presa até um perigo.
  - Quem leva um golpe forte fica "atordoado": perde aderência uns instantes, para o knockback se ver.
- Testes:
  - `regras.test.ts` (19);
  - `fisica.test.ts` (4): o combate acaba sempre; a IA passa por todos os estados sem ficar presa; o Crocodilo arrasta até à serra e a serra é sólida; o humano conduz.
  - O projeto inteiro tinha 322 testes verdes, com lint e tsc a 0.
- Verificado no browser (TV + líder + 1 bot):
  - modo Apostas: partida inteira, ainda antes da consolação;
  - modo Pilotos: liga inteira (2 rondas), já com a IA nova mas antes das mudanças de 20/11 à tarde;
  - o aviso de evento (riscas, ⚠️, por baixo da arena) foi visto numa luta da demo.
- Capturas em `info/progresso/9-ragerob/`, feitas com Playwright + Edge (o script `cap-ragerob.mjs` ficou no scratchpad de uma sessão antiga). São anteriores às mudanças de 20/11 (IA nova, tambor do Ouriço, aviso de evento).

### Decisões tomadas sem o utilizador (por confirmar)
- Modo normal com 2, 3 ou 4 rondas (4/8/16 robôs).
- O dinheiro gasto vai para o bolo; no modo Pilotos desaparece.
- A sobra do bolo no fim vai para quem apostou no campeão; se ninguém, para quem apostou na final; se ninguém, para todos por igual.
- Ao trocar um módulo, o antigo perde-se.
- A fase "Instalar" salta-se quando ninguém tem módulos.
- Passam os 2 primeiros na ordem de KO; os empates desfazem-se pelo dano causado.
- No Pilotos, a IA licita 1 módulo por ronda.
- A pausa (fora do combate) acontece com menos de 2 jogadores ligados.
- Rede de segurança: se a TV não mandar o fim do combate em 200 s, a ordem fica pela vida.
- A serra trava também os robôs de pernas (mas não lhes tira vida).

### Verificação de 20/11 (sessão seguinte)
- 23 testes do ragerob verdes; eslint e tsc a 0.
- Demo `fase=combate`: luta corre sem erros na consola, aviso "Arena encolhendo" visível.
- Demo `fase=resultado`: ecrã de dinheiro mostra perdas parciais (consolação) e entradas perdidas.
- Falta: o utilizador avaliar força/equilíbrio a jogar; capturas novas (precisa de refazer o script Playwright).

### Próximo passo
1. Ver no browser, a jogar, as mudanças de 20/11: o Crocodilo a arrastar até à serra, o knockback dos perigos e o tambor do Ouriço. Perguntar ao utilizador se a força e o equilíbrio estão bons.
2. Voltar a fazer as capturas em `info/progresso/9-ragerob/` com a IA e o Ouriço novos.
3. Jogar outra vez uma partida no modo Apostas no browser, para ver a consolação no ecrã de resultado.
4. Por fazer:
   - som;
   - ⓘ de ajuda própria do jogo;
   - ~~`rr_vidas`/`rr_fim` aceites do líder~~ — feito: novo campo `soTvManda` no registo (só `ID_TV`);
   - ~~fundo~~ — feito: fundo do jogo (fora da arena) em `--noite`, texto claro; cartões mantêm texto escuro;
   - nos cartões da loja e da instalação não se vê o tambor do Ouriço carregado (só na arena).
5. Confirmar com o utilizador as decisões acima.
