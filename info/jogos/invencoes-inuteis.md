# Invenções Inúteis ✅ planeado
Problemas parvos → invenções desenhadas → pitch → a sala investe.

- Jogadores: 3–16. Com >8, apresentam 8 sorteados (o VIP pode escolher "todos"); os outros escrevem problemas e investem.

## Definições (VIP)
| Opção | Valores | Padrão |
|---|---|---|
| Inventar | 90 · 120 · 180 s | 120 s |
| Pitch | 30 · 45 · 60 s | 45 s |
| Quem apresenta | Todos · 8 sorteados | ≤8: todos; >8: sorteados |
- Fixos: problema 45 s, investir 30 s.

## Fluxo
1. **Problema**: sorteado por defeito, editável. Enviar + caixinha ✅/❌. Quem não enviar fica com o sorteado.
2. **Inventar**: cada apresentador recebe o problema de outra pessoa (derangement) e faz desenho (canvas dos Rabiscos) + nome (≤40) + slogan (≤80). Quem não enviar não apresenta: aos 15 s do fim o telemóvel avisa "Faltam 15 s!".
3. **Pitch**: problema → desenho → nome + slogan; o inventor passa as etapas no telemóvel.
4. **Investir**: 3 notas de 100 € para as invenções dos outros (pode pôr todas na mesma; não pode investir na sua).
5. **Revelar**: ranking com barras de dinheiro.

## Pontos
- Inventor: € × 10. A mais financiada: +1000.
- Autor do problema da vencedora: **+500** (decisão do utilizador, 18/11; antes +300).
- Investidores: 0.

## Visual — "planta de inventor"
- **TV**: fundo nas cores da app; o desenho aparece em **papel azul quadriculado** (projeto de inventor); nome grande + slogan entre aspas ao lado; revelação com **barras de dinheiro** a subir.
- **Telemóvel**: inventar = canvas sobre papel quadriculado + campos nome/slogan; investir = invenções em cartões com botões +100 € / −100 € e as 3 notas visíveis; cores da app, código em baixo.

## Conteúdo
- 200 problemas família.

## Pausa
- Pausa abaixo de 3 participantes ligados; a audiência não conta (18/11).

## Design novo (27/11, em curso — falta aprovar o fim + telemóvel)
Maquetes: `prints-montra/proposta-ideias-patente.html` (TV pitch + revelar, **escolhida**) e `proposta-ideias-final.html` (fim, problema/inventar, investir, telemóvel) (+ `.png`). Recusadas: `-oficina`, `-palco`. Capturas do estado atual: `node prints-montra/prints-ideias.mjs tv|tel [fases]`; montagem: `prints-montra/montagem.mjs`.
- **TV — "Pedido de Patente"**: tampo verde de mesa de desenho (quadrícula ténue, moldura de madeira), régua amarela em baixo, esquadro e lápis. Pitch: planta azul presa com fita-cola à esquerda; **ficha "PEDIDO DE PATENTE Nº…"** à direita com campos Problema / Invenção (nome grande azul) / Slogan / Inventor(a) (boneco) e 3 caixas de verificação = etapas. Tempo num relógio redondo de papel.
- **Revelar**: uma ficha pequena por invenção (planta + nome + boneco + €) com **pilha de moedas** por cima (1 moeda = 100 €); a vencedora leva o carimbo vermelho **PATENTEADO**.
- **Problema/Inventar**: ficha-título ("Pedido de patente · passo N") + uma ficha por jogador (boneco + nome) com lápis = a escrever, carimbo verde **ENTREGUE** = enviou.
- **Investir**: fichas pequenas das invenções (planta, nome, slogan, boneco) + bonecos com ✓ de quem confirmou. Notas passam a **moedas de 100 €**.
- **Fim**: ficha "PATENTE CONCEDIDA · X venceu! · invenção arrecadou N €"; planta vencedora com PATENTEADO + ficha do problema (autor +500); `PodioEscada` ao meio; ficha "Investimento" com as outras; botões Outra vez / Menu.
- **Telemóvel** (`var(--fundo)`): problema = ficha de patente com o campo; inventar = problema numa tira + planta (canvas) + cores/ferramentas + ficha com nome/slogan + "Entregar pedido"; o meu pitch = ficha com 3 caixas (atual com orla coral) + Voltar/Seguinte; investir = 3 moedas em cima + fichas com miniatura, − / € / +; espera = planta enrolada + lápis + carimbo ENTREGUE + "Olhem para a TV".
