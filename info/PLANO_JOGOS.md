# Plano dos jogos — do mais simples ao mais difícil (16/11/2026)

Uma sessão filha por jogo, **uma de cada vez**: a seguinte só arranca quando a anterior tem testes verdes, lint a 0 e capturas em `info/progresso/`.
Base: o MVP do 50/50 (`src/jogos/5050/`, `src/core/`, `src/ui/`). Cada jogo segue `src/jogos/5050/` como modelo (reducer puro `regras.ts` + `tv.tsx` + `telemovel.tsx`) e regista-se em `src/core/jogos.ts`.

| # | Jogo (PT / EN) | Regras + visual | Porque nesta posição | Visual definido? |
|---|---|---|---|---|
| 1 | Pensa-Dores / Deep Thinkers | `jogos/respostas-rapidas.md` | Só texto e votos; reaproveita quase tudo do 50/50 | sim (quadro de giz; confirmar com o utilizador, estava "a rever") |
| 2 | Senha do Wi-Fi / Wi-Fi Password | `jogos/encriptado.md` | Texto + equipas + resposta partilhada; sem desenho | **não**: propor 2–3 |
| 3 | Se Vira! / Wing It! | `jogos/apresentacao-surpresa.md` | Gerador de slides + imagens (GIPHY/Pexels/galeria) + slider de nota; precisa de TV | sim (reunião de escritório) |
| 4 | Mona Lixa / Mona Lies | `jogos/rabiscos.md` | Introduz o canvas partilhado | sim (museu) |
| 5 | Ideias Mirabolantes / Harebrained Ideas | `jogos/invencoes-inuteis.md` | Reaproveita o canvas + pitch + investir | sim (planta de inventor) |
| 6 | Pirata / Pirate | `jogos/pirata-a-bordo.md` | Primeiro de papéis secretos: canal privado, noite/dia, vigia por limiar | sim (A + B + C) |
| 7 | Revolução das Máquinas / Machine Uprising | `jogos/motim-em-orbita.md` | Papéis secretos + baralho + poderes + veto | **não**: propor 2–3 (robô+baterias ⭐, sala de controlo, terminal) |
| 8 | O Rei e o Dragão / The King and the Dragon | `jogos/dois-lados.md` | 2 divisões, líderes com votação, reféns, 16 papéis, batata quente, troca mútua | sim (dois castelos e o dragão) |
| 9 | Ragerob | `jogos/rinha-de-robos.md` | Física (Matter.js), IA dos robôs, economia, leilões, modo Pilotos; precisa de TV | sim ("sucata no quintal") |

## Regras para todas as sessões de jogo
- Seguir **à letra** as regras, os pontos, as definições, os nomes e o visual do `.md` do jogo e de `arquitetura.md` (Idiomas, Ecrãs, Bonecos, Design da app, Modo sem TV, regra "Identidade" para papéis secretos). Não inventar regras; se faltar algo, perguntar.
- Conteúdo: usar `conteudo/<jogo>.json` (`{id, pt, en, tags}`) se existir; se não, gerar um lote inicial pt-BR + en família (como o 50/50) e dizê-lo.
- Testes do reducer (mínimo e máximo de jogadores, tempo esgotado, desligar e voltar, empates, casos especiais do `.md`).
- Capturas em `info/progresso/<n>-<jogo>/` (TV 1920×1080 + telemóvel 412×915).
- Marcar ✅ aqui e atualizar `info/PROXIMA_SESSAO.md` no fim.

| Estado | # |
|---|---|
| ✅ 50/50 (MVP) | 0 |
| ✅ Pensa-Dores (16/11) | 1 |
| ✅ Senha do Wi-Fi (16/11) | 2 |
| ✅ Se Vira! (16/11; GIPHY ok, Pexels sem chaves novas) | 3 |
| ✅ Mona Lixa (16/11; canvas partilhado em `src/ui/tela.tsx` + `tracos.ts`) | 4 |
| ✅ Ideias Mirabolantes (16/11; `Tela`/`Quadro` ganharam `planta`) | 5 |
| ✅ Pirata (16/11; canal privado reutilizável em `src/core/privado.ts` + `privadoSala`) | 6 |
| ✅ Revolução das Máquinas (16/11; reaproveita o canal privado do Pirata) | 7 |
| ✅ O Rei e o Dragão (17/11; visual mudou para "duas torres e uma ponte"; equipas Corte / Rebeldes) | 8 |
| ✅ Ragerob (18/11; visual "sucata no quintal"; física Matter.js só na TV; modos Apostas e Pilotos) | 9 |
