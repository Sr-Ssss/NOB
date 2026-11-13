# Proximidade iOS + Android (NPN)

Objetivo: saber se dois telemóveis estão a ~1 m, no bolso, sem gesto e sem som.

## O que não serve
| Técnica | Porquê |
|---|---|
| Web Bluetooth (PWA) | Não existe no iOS; no Android não faz scan de RSSI. |
| Ultrassons | Testado e falhou. O iOS corta o microfone em segundo plano. |
| GPS | Erro de 5–50 m, pior em interiores. |
| Wi-Fi Aware / RTT | Só existe no Android. |
| UWB (Nearby Interaction) | Só modelos topo de gama; iPhone↔Android não funciona. |
| API de Exposição COVID (GAEN) | Reservada a autoridades de saúde. |

## O único caminho real
- **App nativa nos dois sistemas, com BLE** (anunciar + fazer scan em segundo plano).
- Armadilhas iOS em segundo plano:
  - o UUID do serviço vai para a "overflow area" → o Android não o encontra pelo UUID;
  - o scan em segundo plano só encontra UUIDs pedidos explicitamente.
- Solução conhecida: **protocolo Herald** (open source, feito para as apps COVID do Reino Unido e da Austrália): o Android liga-se por GATT ao iPhone para ler o ID e o RSSI e ajuda a "acordar" iPhones bloqueados. Usar como referência; o projeto pode estar parado.

## Alternativa: crachá de hardware (ESP32) — iPhones e Androids iguais
- Cada jogador leva no bolso um ESP32 (anuncia e faz scan BLE ao mesmo tempo) e o crachá envia "quem está perto" por **Wi-Fi** para o servidor.
- O telemóvel fica só com a PWA (GitHub Pages) e deixa de precisar de Bluetooth e de app nativa.
- Wi-Fi: a festa precisa de rede (ou de um hotspot de um telemóvel).
- Não enviar os dados do crachá para o telemóvel por Bluetooth: isso volta a esbarrar no iPhone.
- Bateria: com BLE e Wi-Fi gasta cerca de 80–120 mA, por isso uma bateria de 400 mAh dá ≈3–4 h. Para durar mais: Wi-Fi em rajadas a cada 5–10 s.
- Placas (preços aproximados, confirmar):
  - Seeed XIAO ESP32-C3: ~5–7 €, já carrega LiPo. Com bateria e caixa fica ≈8–10 €.
  - ESP32-C3 SuperMini: ~2–3 €, mas precisa de um carregador à parte (TP4056).
  - M5StickC Plus2: ~20 €, já traz bateria, ecrã, botões e buzzer. Bom para protótipos.

## Armadilhas Android (APK nativo)
- O scan com ecrã desligado precisa de **foreground service** (notificação fixa) e de **filtro** no scan; sem isso o Android corta-o.
- No máximo **5 arranques de scan a cada 30 s**: arrancar uma vez e deixar a correr.
- Xiaomi, Samsung, Huawei e outros matam a app → pedir no arranque para desligar a otimização de bateria.
- Há telemóveis baratos que não conseguem anunciar (`isMultipleAdvertisementSupported`). Juntar a deteção no servidor: se A vê B, contam os dois como perto.
- O RSSI tem ruído: usar a mediana de 3–5 s e calibrar por modelo. O corpo entre os telemóveis tira cerca de 10 dB. A precisão real é "perto (0,5–2 m)" ou "longe", não centímetros.
- Permissões: Android 12+ pede `BLUETOOTH_SCAN/ADVERTISE/CONNECT`; Android ≤11 precisa da Localização ligada.

## Distribuição a 0 €
- Android: APK ou Play Store (a conta já está paga).
- iOS sem 99 $: compila-se o .ipa no GitHub Actions (runner macOS) e instala-se com Sideloadly/AltStore (funciona no Windows) com um Apple ID grátis.
  - Limites: renova-se a cada 7 dias, no máximo 3 apps por Apple ID e precisa de computador.
  - Serve para um grupo fixo de amigos, não para convidados de ocasião.
