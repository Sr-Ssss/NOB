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

## Poupar tokens (todas as sessões)
- Fazer exatamente o pedido + o trabalho autónomo que ele implica; nada de extras não pedidos.
- Ler só o necessário: Grep/Glob primeiro, depois Read com `offset`/`limit`. Não reler ficheiros já lidos nem editados.
- Respostas curtas: sem resumos longos, sem repetir o que já foi dito, sem narrar passos.
- Sem subagentes nem sessões novas salvo pedido ou necessidade real.
- Máx. 2 sessões a trabalhar ao mesmo tempo.
- Contexto passa de ~200k tokens: guardar estado/próximo passo no `.md` do assunto (`info/PROXIMA_SESSAO.md` ou `info/jogos/<jogo>.md`) e avisar o utilizador para fazer `/compact` ou passar a uma sessão nova.
- Tarefa acabada: atualizar o `.md` respetivo com o essencial (o contexto fica nos ficheiros, não no histórico).

## Limite semanal: parar a cada 10%
- No início de cada pedido e entre passos longos, ver o limite semanal com `mcp__ccd_session_mgmt__get_usage`.
- Sempre que passar uma nova dezena (10%, 20%, 30% … 90%) desde a última confirmação: terminar o passo atual sem começar outro, guardar o estado no `.md` do assunto e perguntar ao utilizador se quer continuar. Só continuar com um "sim".
- Vale para todas as sessões, incluindo as filhas (perguntam ao utilizador na própria sessão).
