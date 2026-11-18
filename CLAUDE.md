# NoOneBored (NOB)

Plataforma de party games, só online: app NOB na Play Store (modos "Ser a TV" e "Jogar"); iPhones jogam pelo link do GitHub Pages. Tempo real com Supabase. Conteúdo só família. Jogos grátis com anúncio de rodapé.

## Mapa
- Plano atual: `info/PLANO_NOB.md`
- Arquitetura e decisões técnicas: `info/arquitetura.md`
- Estado / próximo passo: `info/PROXIMA_SESSAO.md`
- Planeamento por terminar: `info/PLANEAMENTO_PENDENTE.md`
- MVP: `info/PLANO_MVP.md`
- Ordem dos jogos (uma sessão por jogo): `info/PLANO_JOGOS.md`
- Jogos (regras de design): `info/jogos/<jogo>.md`
- Armadilhas por assunto: `info/regras/<assunto>.md`
  - `info/regras/plataforma.md` — iOS, Bluetooth, PWA, custos
  - `info/regras/proximidade.md` — como detetar telemóveis perto (iOS + Android)

## Regras da casa
- PT-PT. Curto, em pontos.
- Sem commit, sem mudar de branch, sem build de produção salvo pedido explícito.
- Outras sessões podem estar na mesma pasta: só os teus ficheiros, edições com Edit, sem formatadores em massa.
- Testes verdes e lint a 0 antes de dar por feito.
- Sessões filhas: **não mandar mensagens (`SendMessage`) à sessão-mãe/coordenadora** nem pedir-lhe avisos (gasta muitos tokens). Acabar com um relatório curto; se bloqueado, perguntar ao utilizador na própria sessão.
- Poupar tokens: tarefa nova que não precisa do contexto da conversa = **sessão nova**. Antes, guardar o que importa nos `.md` (`info/PROXIMA_SESSAO.md`, `info/auditoria/`, `.md` do jogo) e dar-lhe um brief completo (o que fazer, ficheiros, onde está o contexto, quando está feito).

## Comandos e entrega
- `npm run dev` · `npm test` · `npm run lint` · `npm run build`.
- APK (só a pedido): pedir o APK = também commit + push para `main` (o Pages publica sozinho). Depois `npx cap sync android` → `android\gradlew assembleDebug` → copiar para `C:\Users\Samuel Henrique\OneDrive - cidadepvc.pt\Ambiente de Trabalho\NOB_vX.Y.Z.apk`; versionCode = X×10000+Y×100+Z.
- Prompts das sessões-mãe: `info/PROMPT_SESSAO_MAE_JOGO.md`, `info/PROMPT_SESSAO_MAE_DESIGN.md`.

## Ficheiros soltos
- `index.html` — protótipo antigo: teste de proximidade por som (ultrassons). Fica como referência, não é a app.
