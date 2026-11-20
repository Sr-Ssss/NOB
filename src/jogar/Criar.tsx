import { useState } from 'preact/hooks';
import { useHost, type Entrada } from '../core/ligacao';
import { idiomaDispositivo, t, usarIdioma } from '../core/i18n';
import { meuId } from '../core/ids';
import { vistaSala, type AcaoSala } from '../core/sala';
import { EcraJogador, EscolherBoneco, guardar } from './Jogar';
import { emCurso } from '../jogos/ecras';

/**
 * Modo sem TV: o telemóvel do criador é o host (estado + relógio) e também joga.
 * Vê o mesmo que um jogador normal; como líder tem "Escolher jogo" e pode tornar alguém (ou a si) a TV.
 * Também é aqui que chega o herdeiro quando assume a party (src/core/passagem.ts): já está no estado, entra sozinho.
 */
export function Criar() {
  const eu = meuId();
  const { estado, ligado, acao, acaoDe, privadoDe, agora, impressao } = useHost(idiomaDispositivo(), undefined, { eu });
  const real = estado.aliases[eu] ?? eu;
  const [entrada, setEntrada] = useState<Entrada | null>(() => {
    const j = estado.jogadores.find((x) => x.id === real);
    return j ? { nome: j.nome, avatar: j.avatar, tag: j.tag } : null;
  });
  usarIdioma(estado.idioma);
  const vista = vistaSala(estado);
  const enviar = (a: AcaoSala) => acaoDe(eu, a);

  const entrar = (e: Entrada) => {
    guardar(e);
    setEntrada(e);
    acaoDe(eu, { tipo: 'entrar', id: eu, ...e });
  };

  if (ligado === false) return <div class="pag centro">{t('semLigacao')}</div>;
  if (!entrada || !vista.jogadores.some((j) => j.id === real)) return <EscolherBoneco vista={vista} eu={real} aoEntrar={entrar} />;
  // o que a TV faria como host (ex.: a física do Ragerob) corre aqui, sem se ver
  const ativo = vista.tutorial ? null : emCurso(estado);
  const motor = ativo?.j.e.motor?.({ g: ativo.g, v: emCurso(vista)!.g, sala: vista, agora, acao }) ?? null;
  return (
    <>
      {motor}
      <EcraJogador vista={vista} eu={real} entrada={entrada} mudar={entrar} enviar={enviar} agora={agora} privadoDe={privadoDe} impressao={() => impressao} />
    </>
  );
}
