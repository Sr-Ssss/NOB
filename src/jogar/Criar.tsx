import { useState } from 'preact/hooks';
import { useHost, type Entrada } from '../core/ligacao';
import { idiomaDispositivo, t, usarIdioma } from '../core/i18n';
import { meuId } from '../core/ids';
import { vistaSala, type AcaoSala } from '../core/sala';
import { EcraJogador, EscolherBoneco, guardar } from './Jogar';

/**
 * Modo sem TV: o telemóvel do criador é o host (estado + relógio) e também joga.
 * Vê o mesmo que um jogador normal; como líder tem "Escolher jogo" (menu vertical, sem vídeo).
 * Também é aqui que chega o herdeiro quando assume a party (src/core/passagem.ts): já está no estado, entra sozinho.
 */
export function Criar() {
  const eu = meuId();
  const { estado, ligado, acaoDe, privadoDe, agora } = useHost(idiomaDispositivo(), undefined, { eu });
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
  return <EcraJogador vista={vista} eu={real} entrada={entrada} mudar={entrar} enviar={enviar} agora={agora} privadoDe={privadoDe} />;
}
