# Plataforma — armadilhas

- **Web Bluetooth não existe no iPhone** (Safari/qualquer browser iOS). Num Android também não dá para fazer scan de RSSI de outros telemóveis nem anunciar a partir da web. → Proximidade por Bluetooth numa PWA é impossível. Não voltar a planear isto.
- **TestFlight exige a conta paga da Apple (99 €/ano)**. Conta grátis só instala por cabo via Xcode e expira em 7 dias. → iPhone = PWA, sempre.
- **Ultrassons**: precisa de microfone + altifalante ligados, falha com capa/bolso, o iOS corta áudio em segundo plano e há quem ouça 17 kHz (crianças, cães). Não usar como mecânica base.
- **iOS em segundo plano**: a PWA congela com ecrã bloqueado. Nenhuma mecânica pode depender de deteção passiva com o telemóvel no bolso.
- **Mesmo com app nativa paga**, o iOS não deixa um iPhone bloqueado no bolso encontrar outro iPhone bloqueado por BLE de forma fiável (scan em background só vê serviços conhecidos, com atraso). Pagar os 99 $ não resolve tudo.
- **NPN não aceita QR nem gestos visíveis** (o atacante tem de ficar anónimo). Não voltar a propor.
- **Só online** (decisão do utilizador). Rede local foi descartada; não voltar a propor.
- **Supabase grátis**:
  - pausa o projeto ao fim de ~7 dias sem atividade → cron semanal no GitHub Actions que faça um pedido à API;
  - tem limites de ligações simultâneas e de mensagens por mês → confirmar os valores atuais no painel. Medir o consumo por partida (sobretudo a Rinha) e registá-lo aqui;
  - se a app crescer, passa a ter custo, por isso o `core/canal.ts` tem de poder trocar de serviço.
- **O Android TV não tem Chrome**, por isso uma TWA não funciona. O host na TV é uma app Capacitor (WebView), navegável só com D-pad e sem toque.
- **Os anúncios precisam de internet**: jogando offline, não aparecem. Não fazer o jogo depender deles. Modelo: jogos todos grátis + rodapé + compra "Remover anúncios". **Nunca** pôr jogos atrás de pagamento (decisão do utilizador).
- **Anúncios**: o AdSense não aceita `*.github.io` (precisa de domínio próprio). Na app nativa (Capacitor) usa-se o AdMob. Antes de pôr anúncios na app Android TV, confirmar as políticas do AdMob e da Play para TV.
- **Câmara e sensores de movimento no iOS** precisam de HTTPS e de um toque do utilizador para pedir permissão (`DeviceMotionEvent.requestPermission()`).
