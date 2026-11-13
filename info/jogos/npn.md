# Operação N.P.N. (No One Poisons No One)

Fonte original: `Operacao_NPN_Regras_OFICIAL_v2.docx` (Downloads). Aqui fica a versão viva.

## Requisito central
- **A vítima não pode saber quem a atacou.** Por isso a deteção tem de ser passiva (no bolso, sem gesto visível). QR / gesto explícito: **rejeitado**.
- Caminho técnico: por decidir (ver `info/regras/plataforma.md`). Existe um teste BLE para Android (`npn-teste-apk.zip`) e um teste de ultrassons (`index.html`).

## Agora: só o ecrã de teste "NPN" (Android, em desenvolvimento) — decidido 13/11
- O jogo NPN fica parado. Só se faz um ecrã de teste para ver se os telemóveis se encontram e se o alcance está certo.
- Onde: botão "NPN (teste)" escondido nas Definições; só aparece em builds de desenvolvimento ou com um interruptor de dev.
- O que faz: anuncia e faz scan por BLE (plugin nativo Kotlin, em foreground service, para funcionar com o ecrã desligado).
- Lista dos telemóveis NOB encontrados: nome, RSSI atual, mediana de 3 s e estado **PERTO / LONGE**. Vibra quando um telemóvel passa a PERTO.
- **Slider de alcance** (−50 a −90 dBm, padrão −65) para afinar o limite de PERTO à mão.
- Contra o ruído (decidido por mim): mediana de 3 s. Entra em PERTO acima do limite e só sai 4 dB abaixo (histerese), para não estar sempre a mudar.
- Boa prática: botão "Exportar registo" que guarda em CSV (hora, telemóvel, RSSI, distância anotada). Assim compara-se o alcance por modelo de telemóvel.
- Permissões: Android 12+ pede `BLUETOOTH_SCAN/ADVERTISE/CONNECT`; Android ≤11 precisa da Localização.

## Decisões (planeamento de 13/11)
- Android only. Modo NPN dentro da app NOB. Plugin nativo Kotlin: BLE em foreground service + MediaSession com VolumeProvider para apanhar o volume com o ecrã desligado (sem AccessibilityService, que a Play recusa). As regras correm no servidor (Supabase), não no telemóvel do criador.
- Duração: padrão 60 min (30–180).
- **Ação = 2 cliques no volume** com o ecrã desligado. 1 vibração curta = alguém ao alcance com a habilidade pronta; 2 vibrações = feito. Alvo = o mais próximo (RSSI mais forte). "Escolher da lista" fica como alternativa.
- Resultados (sintomas, scan, interceção) chegam com atraso aleatório de 1–4 min. Ninguém é eliminado.
- **Vitória: individual, por pontos.** Ganha quem tiver mais pontos no fim (o Assassino pode "perder" e mesmo assim ganhar).
- **Facção vencedora** (para o Gambler e os Apoiantes), proposta: soma dos pontos de Assassino+Ajudante vs Agente+Detetive; a maior vence. Por confirmar.

## Decisões de regras
- Facção má: **L.P.E.**
- Sobrevivente: +20 do papel **acumula** com os +10 base.
- `N = max(5, 100/P)`.
- Papéis que dependem de Detetive/Ajudante só entram com 6+ jogadores.

## ~~Mecânica Contacto~~ (REJEITADA — gesto visível denuncia o atacante)
Substitui a proximidade passiva por Bluetooth/som (impossível na PWA, ver `info/regras/plataforma.md`).

- Toda a interação entre 2 jogadores é um **Contacto**: os dois juntam-se e confirmam no telemóvel.
- **Todos** fazem contactos o tempo todo (é assim que os civis pontuam) → um contacto nunca é suspeito.
- Cada papel liga um efeito secreto ao seu **próximo contacto**: Assassino (seringa letal), Ajudante (falsa), Detetive (scan), Agente (interceção). Para o outro jogador o ecrã é igual em todos os casos.
- Formas de fazer o contacto (configurável):
  - **QR**: um mostra o QR no ecrã, o outro lê com a câmara. Fiável.
  - **Brinde**: os dois tocam os telemóveis/copos; o servidor junta os 2 "toques" do acelerómetro que chegam no mesmo ~0,5 s e pede confirmação com um emoji igual nos dois ecrãs. Mais divertido, menos fiável.
  - **Código**: um diz 3 dígitos, o outro escreve. Recurso.
- Silencioso, sem Bluetooth, sem som, sem app nativa, igual em iPhone e Android.

## Adaptações das regras atuais ao Contacto
- Passiva dos civis: `N/2` para os dois por cada contacto com alguém **novo** (ou cooldown por par, ex. 5 min), em vez de "10 s no range".
- Político: contacto com ≥60% dos jogadores.
- Batata quente: passa no contacto; quem a tiver no fim perde 10.
- Resultado das seringas chega ao alvo com **atraso aleatório** (ex. 1–4 min), para não denunciar o atacante.
- Cooldowns: Assassino 2 min, Ajudante 5, Detetive 5, Agente 10 (iguais ao docx).

## Papéis, sorteio e pontuação
Ver docx v2 (secções 1, 3, 4, 5). Ajustes já decididos depois do docx:
- Cobra só com 6+ jogadores (precisa do Ajudante).
- Político usa percentagem mínima (60%) em vez da sala toda.
