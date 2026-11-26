# Sem Juízo / Out of Order — regras (25/11, APROVADAS, incluindo os (P); programado)
Julgamento de um crime parvo: réu e acusador defendem-se com provas absurdas em foto, em voz alta; o júri e o juiz decidem. Sem escrita durante o julgamento.
Itens com (P) = proposta da sessão, aprovada com o resto.

## Jogadores e papéis
- **3–10** (máximo (P)). Votantes sempre humanos: bots não são juiz nem júri (P).
- Por julgamento: 1 **réu**, 1 **acusador**, 1 **juiz**; todos os outros são o **júri**. O juiz não é júri.
- Cada pessoa tem **1 papel por partida** (réu ou acusador): ⌈jogadores ÷ 2⌉ julgamentos. Ser juiz ou júri não conta como papel.
- Número ímpar: no último julgamento, quem falta joga contra quem tiver menos pontos entre os que já jogaram (empate: à sorte); este faz o papel que ainda não fez e conta só o melhor dos seus dois julgamentos (P).
- O juiz roda entre quem não é réu nem acusador (primeiro quem foi juiz menos vezes) (P).

## Provas
- Fotos da net e do telemóvel, como no Se Vira! (`apresentacao-surpresa.md`, "Imagens"): GIPHY (classificação G, selo obrigatório) / Pexels; galeria reduzida a WebP de 800 px (≤100 KB), nada guardado.
- Galeria opcional na sala de espera: quem junta fotos aceita que apareçam a todos. Entram no monte, à sorte, com as da net (P).
- Se uma imagem falhar: outra fonte, depois emoji grande.
- Cada lado recebe **5** e joga **3**.
- Definição **Provas**: **Aleatórias** (padrão) ou **O júri escolhe**. Sem júri (3 jogadores) são sempre aleatórias.
- O júri escolhe: 20 s; os jurados enviam provas aos dois lados em partes iguais; o que faltar vem à sorte (P).

## Julgamento
1. **Caso**: crime parvo em desenho + 1 frase curta.
2. **3 rondas**: acusador e depois réu põem 1 prova na mesa e explicam-na em voz alta, 20 s cada. A partir da segunda prova, ligam-na com uma linha a uma já jogada. Sem escolha a tempo: prova e ligação à sorte (P).
3. **Interrupções**: cada lado tem 1 de cada por julgamento; só uma ativa de cada vez (P).
   - ✋ **Protesto**: durante a explicação do outro, a prova dele troca por uma à sorte e ele continua, com mais 10 s (P).
   - ⚡ **Contradição**: marca 2 provas do outro lado que não batem certo; ele tem 10 s para se safar; juiz e júri votam com as mesmas regras do veredito. Se falhar, a prova mais recente das duas deixa de poder receber estrela (P).
   - 🐔 **Testemunha**: juiz ou jurado à sorte fala 15 s no papel que quem chamou inventar em voz alta. Continua a votar (P).
4. **Veredito**: o júri vota culpado ou inocente em segredo (15 s (P)). Depois o **juiz vê, só ele, os votos** e decide por último (20 s). A TV mostra martelos tapados.
   - O voto do juiz vale **2** se o total de votantes (juiz + júri) for **par**; senão vale 1. Nunca há empate.
   - Jurado sem voto a tempo ou desligado: voto à sorte. Juiz sem voto: segue a maioria; empate ou sem júri, à sorte (P).
5. **Estrela**: juiz e jurados dão 1 estrela à melhor prova.
6. **Revelação** e sentença parva em desenho.

| Jogadores | Juiz + júri | Voto do juiz |
|---|---|---|
| 3 | 1 + 0 | 1 |
| 4 | 1 + 1 | 2 (decide sempre) |
| 5 | 1 + 2 | 1 |
| 6 | 1 + 3 | 2 |
| 7 | 1 + 4 | 1 |
| 8 | 1 + 5 | 2 |
| 9 | 1 + 6 | 1 |
| 10 | 1 + 7 | 2 |

## Pontos
- 100 pontos repartidos pelo peso dos votos: o réu fica com a parte "inocente", o acusador com a parte "culpado" (arredondado).
- Quem ganha o veredito: **+50**.
- Estrela: **+25** por estrela a quem jogou a prova, máximo **50** por julgamento.
- Juiz e júri não ganham pontos.

## Ecrãs
- TV: caso, mesa com provas e linhas, interrupções, martelos tapados, veredito.
- Telemóvel: mão secreta e botões; júri só com martelos e estrela.
- Sem TV: mesa em todos os telemóveis; mão e votos só para quem devem, pelo canal privado.
- Saída do réu ou do acusador: espera o tempo normal da app; se não voltar, o julgamento anula-se (P).

## Visual
- **Tribunal antigo**: madeira, perucas brancas e selos de lacre. Bonecos da app de peruca. Arte, casos e sentenças nossos.

## Inspirações (só ideias gerais)
- Jogos de tribunal com contradições e provas; jogos de improviso com cartas. Nada copiado.

## Estado (25/11)
- Nome: pesquisa na net sem nenhum jogo "Sem Juízo" nem "Out of Order" (há outros de tribunal: Camera Court, Prove It, All Rise!).
- **Programado**, com e sem TV: `src/jogos/semjuizo/` (`regras.ts`, `tv.tsx`, `telemovel.tsx`, `desenhos.tsx`, `galeria.tsx`…), id `semjuizo`. Demo `#/demo-semjuizo`. Capturas em `info/progresso/10-sem-juizo/`.
- Conteúdo: lote inicial em `conteudo/sem-juizo.json`: 30 casos, 22 sentenças, 60 termos de prova (pt-BR + en, família).
- Galeria: fotos na sala (`sj_foto`, `EstadoSala.fotos`), máx. 3 por pessoa e 35 KB cada, 3 por julgamento; vão pelo canal privado, nunca na vista, e **ficam fora da cópia da passagem do anfitrião** (`semFotos`, mensagens ≤256 KB): quem assume a party mostra o emoji no lugar delas.
- Por ver em aparelhos a sério: Supabase com fotos da galeria; perucas em bonecos baixos ficam soltas.
- Escolhas da sessão onde as regras não dizem (confirmadas pelo utilizador, 25/11): revelação 12 s, galeria com os limites acima, 15 s para escolher a prova (a explicação tem os seus 20 s), 15 s para a estrela, resultado da contradição 4 s, interrupções só durante uma explicação, sem juiz humano (só em testes com bots) o voto é à sorte.

## Por fazer
- Ver "Estado".
