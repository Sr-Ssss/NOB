# Burocracia antes da Play Store (17/11/2026)

Feito no código (ver `2026-11-17.md`): fontes dentro da app (sem Google Fonts), política de privacidade em `app/public/privacidade.html` (link nas Definições), links colados do Se Vira! desligados por defeito, filtro de palavrões no host (`src/core/filtro.ts`).

## O que só tu podes fazer (por ordem)

### 1. Decidir o público-alvo (muda tudo o resto) — ✅ decidido a 17/11: **13+**
- Na Play Console, em "Público-alvo e conteúdo", escolher só as faixas 13–15, 16–17 e 18+. A política de privacidade já diz 13+.
- **Escolhido: 13+** ("adolescentes e adultos, conteúdo familiar"). A app fica fora do programa "Famílias" e as regras são as normais.
- **Se incluíres menores de 13:** entra a política "Famílias" da Play Store:
  - só SDKs de anúncios certificados para famílias; AdMob com "tratamento para crianças" e conteúdo máximo G; nada de anúncios personalizados;
  - o texto e os desenhos livres entre jogadores (UGC) pedem mais moderação do que um filtro: denunciar/bloquear e controlo do adulto;
  - os termos da GIPHY pedem utilizadores com 13+: terias de desligar a GIPHY nesse caso.

### 2. Completar a política de privacidade
- Em `app/public/privacidade.html`, preencher os campos amarelos: **nome do responsável** e **e-mail de contacto** (a idade, 13+, já está).
- Depois de publicada no GitHub Pages fica em `https://sr-ssss.github.io/NOB/privacidade.html`: é este o link que vai na Play Console.

### 3. Play Console
- **Política de privacidade**: o link do ponto 2.
- **Segurança dos dados** (Data safety), resposta honesta com o que a app faz hoje:
  - recolhe: nome na party e conteúdo do jogo (texto, desenhos, imagens) — "conteúdo gerado pelo utilizador";
  - não é partilhado com terceiros para publicidade; é transmitido cifrado; não fica guardado num servidor;
  - o utilizador apaga tudo limpando os dados da app.
- **Classificação de conteúdo** (questionário IARC): responder que há **interação entre utilizadores** e **conteúdo gerado pelo utilizador** (com filtro), sem compras dentro da app por agora.
- **Público-alvo e conteúdo**: o do ponto 1.

### 4. Serviços
- **GIPHY**: pedir a **chave de produção** (grátis) em developers.giphy.com e trocá-la no `.env` e no `.github/workflows/pages.yml`. A atual é de teste (100 pedidos/hora).
- **Supabase**: aceitar o acordo de tratamento de dados (DPA) da Supabase, para o RGPD.
- **Supabase keep-alive**: o projeto grátis pausa ao fim de 7 dias sem uso. O workflow `.github/workflows/keepalive.yml` lê uma tabela pequena 2× por semana. Falta (1 minuto, uma vez): no painel da Supabase → SQL Editor → correr:
  ```sql
  create table if not exists public.keepalive (id int primary key);
  insert into public.keepalive (id) values (1) on conflict do nothing;
  alter table public.keepalive enable row level security;
  create policy "ler keepalive" on public.keepalive for select to anon using (true);
  ```
  Só dá para ler aquela linha; ninguém escreve. Depois do push, testar uma vez em GitHub → Actions → "Supabase keep-alive" → "Run workflow".
  Nota: o GitHub desliga workflows agendados num repositório sem commits há 60 dias (manda e-mail antes; volta a ligar-se com um clique).

### 5. Anúncios (quando entrarem)
- Formulário de consentimento da Google (UMP) para utilizadores na UE, antes de qualquer anúncio.
- Anúncios não personalizados; rever a política de privacidade antes de publicar.

### 6. Copyright (relatório §7) — ✅ decidido e feito a 17/11 (ver 2026-11-17.md)
- Revolução das Máquinas: mudar os números iguais aos do Secret Hitler.
- O Rei e o Dragão: renomear papéis tirados do Two Rooms and a Boom.
- "Senha do Wi-Fi": "Wi-Fi" é marca registada (manter com risco ou mudar o nome).

### Nota sobre o filtro
- `info/jogos/meio-a-meio.md` e `respostas-rapidas.md` diziam "sem filtro". O filtro passou a estar sempre ligado por ser uma app familiar. Se quiseres, pode virar uma opção do líder.
