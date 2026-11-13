# Pirata a Bordo ✅ planeado
Lobisomem clássico com tema de navio mercante. Os piratas atiram marinheiros ao mar à noite; de dia a tripulação vota.

- Jogadores: 5–16.

## Papéis
| Jogadores | Piratas | Especiais |
|---|---|---|
| 5–6 | 1 | Vigia, Médico |
| 7–10 | 2 | Vigia, Médico, Artilheiro |
| 11–14 | 3 | Vigia, Médico, Artilheiro |
| 15–16 | 4 | Vigia, Médico, Artilheiro |
- 🔭 **Vigia**: revista 1 pessoa por noite e descobre se é pirata.
- 🩹 **Médico**: protege 1 pessoa por noite (não pode repetir na noite seguinte; pode proteger-se a si próprio).
- 💣 **Artilheiro**: quando sai (de noite ou de dia), leva alguém com ele (20 s).
- ⚓ **Marinheiros**: o resto.

## Noite (sempre 45 s completos, mesmo que todos já tenham escolhido)
- O ecrã é igual para todos: lista de jogadores + "Confirmar". Todos os telemóveis vibram no início e no fim.
- Piratas: escolhem a vítima e veem os votos uns dos outros. No fim ganha a maioria; em empate há sorteio entre os empatados.
- Vigia e Médico: fazem a sua ação.
- **Marinheiros: escolhem quem vigiar.**
  - Só conta se **≥ N marinheiros** escolherem a mesma pessoa (N na config; padrão 3, ou 2 com 5–6 jogadores).
  - Nesse caso, **só esses marinheiros** ficam a saber, em privado, se o alvo **saiu da cabine** (= é Pirata, Vigia ou Médico).
  - Quem escolheu um alvo com menos de N votos não recebe nada.
  - Mais do que um alvo pode chegar a N.
  - As escolhas dos piratas e dos especiais não contam para a vigia.

## Dia
1. Amanhecer: a TV diz quem foi atirado ao mar ("ninguém" se o Médico salvou). O papel não é revelado (config).
2. Discussão (padrão 3 min; o VIP pode encurtar).
3. Votação (30 s): cada um vota em alguém ou em "ninguém". Caixinha ✅/❌. A maioria atira ao mar; empate = ninguém sai.

## Visual (A + B + C)
- **Noite (TV)**: barco rabiscado no mar com a lua; "Os piratas escolhem…" + timer.
- **Amanhecer (TV)**: **diário de bordo** em pergaminho conta o que aconteceu ("O Rui foi atirado ao mar").
- **Dia / votação (TV)**: **convés visto de cima** com os bonecos (os que saíram ficam esbatidos); quem é votado anda pela **prancha** até à água.
- **Telemóvel** (cores da app, código em baixo). **Regra: todos os papéis veem ecrãs com o mesmo aspeto e tempo**, só muda a frase de cima, para ninguém se denunciar pelo ecrã:
  - **Pergaminho**: sobre o fundo da app, um pergaminho enrolado que se abre e mostra **todos os jogadores** (bonecos + nomes). O **texto é igual para todos** (ex.: "Noite · escolhe alguém"), em qualquer papel.
  - **Botão "Identidade" em todos os ecrãs**: tem de se **segurar 3 s**; mostra um **símbolo pequeno + nome do papel**; ao tirar o dedo, some.
  1. **Carta** (início): pergaminho fechado + "Segura 3 s para veres quem és";
  2. **Noite**: pergaminho com a lista + Confirmar, igual para todos. A ação de cada papel (atirar ao mar, revistar, proteger, vigiar) é dita só no ecrã da Identidade. Os votos dos outros piratas e o bloqueio do Médico também **só aparecem enquanto se segura a Identidade**, para nada ficar visível a quem espreita;
  3. **Amanhecer**: resultado privado só para quem tem (Vigia: "A Ana é/não é pirata"; marinheiros que chegaram a N: "A Ana saiu/não saiu da cabine"); os outros veem "Nada a reportar";
  4. **Discussão**: "Conversem, olhem para a TV" + timer + botão 👁 "O meu papel";
  5. **Votação**: lista + "Ninguém" + Confirmar;
  6. **Fora do jogo**: "Foste atirado ao mar. Agora és espectador, não fales." (Artilheiro: primeiro escolhe quem leva, 20 s);
  7. **Fim**: "Ganhaste/Perdeste" + pontos; sem TV, o Painel mostra o convés.

## Fim
- Ganham os piratas quando são ≥ os outros vivos. Ganha a tripulação quando não restam piratas.
- A TV revela todos os papéis e o histórico das noites.
- Pontos: equipa vencedora +1000; vivo no fim +300.
- Atirados ao mar: ecrã "🌊 Estás no mar". Não veem os papéis e não falam.

## Definições (VIP)
| Opção | Valores | Padrão |
|---|---|---|
| Discussão | 1 · 2 · 3 · 5 min | 3 min |
| Marinheiros necessários para vigiar | 2 · 3 · 4 · 5 | 3 (2 com 5–6 jogadores) |
| Artilheiro | Sim · Não | Sim |
| Revelar o papel de quem sai | Sim · Não | Não |

## Narração
- Texto grande na TV + som do mar. Voz `speechSynthesis` pt-BR/en se existir.

## Segredo
- Papéis e resultados da vigia vão só pelo canal privado. A vista da TV nunca leva papéis.
