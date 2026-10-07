/**
 * ---------------------------------------------------------------------------
 * CONTEXTO: NOTIFICACOES PUSH
 * ---------------------------------------------------------------------------
 * Tres assuntos que costumam ser confundidos, e que aqui ficam separados:
 *
 *   1. PERMISSAO  -> o usuario deixa este app notificar?
 *   2. TOKEN      -> qual e o endereco deste aparelho no FCM?
 *   3. ENTREGA    -> o que fazer quando uma notificacao chega ou e tocada?
 *
 * Os tres sao independentes. Da para ter permissao e nao ter token (Expo Go),
 * ter token e nunca receber nada (credencial de outro projeto Firebase no
 * servidor), e receber sem nunca ter tocado.
 *
 * A PERMISSAO SEGUE A MESMA REGRA DA LOCALIZACAO (ver useLocalizacao):
 *
 *   O APP PRECISA FUNCIONAR SEM ELA.
 *
 * Quem recusa notificacao continua com a loja inteira funcionando. A unica
 * coisa que ele perde e o aviso de queda de preco.
 *
 * POR QUE CONTEXTO, E NAO UM HOOK SOLTO?
 *
 * Porque o motor tem que rodar UMA VEZ. Se duas telas chamassem o mesmo hook,
 * seriam dois pares de listeners — e o toque numa notificacao navegaria duas
 * vezes, empilhando a mesma tela. O provider garante uma instancia; as telas
 * so leem o estado.
 * ---------------------------------------------------------------------------
 */
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { useAuth } from './AuthContext';
import { navegarPara } from '../navigation/navegacao';
import { registrarAparelho } from '../services/notificacoesService';
import { DadosNotificacao } from '../types/notificacao';
import { prepararCanalAndroid } from '../lib/notificacoes';

/**
 * Os TRES desfechos de uma permissao — os mesmos da localizacao.
 * `indisponivel` e o quarto, e nao e sobre o usuario: e o ambiente que nao
 * tem como entregar push (emulador sem Google Play, Expo Go no Android).
 */
export type StatusNotificacoes =
  | 'verificando'
  | 'concedida'
  | 'negada'
  | 'indisponivel';

/**
 * O token fica aqui fora do React porque o logout precisa dele DEPOIS de o
 * componente ja ter desmontado o usuario. Um modulo e o lugar honesto para
 * um dado que pertence a instalacao, e nao a uma tela.
 */
let tokenAtual: string | null = null;
export const obterTokenAtual = (): string | null => tokenAtual;

interface NotificacoesContextValor {
  status: StatusNotificacoes;
  token: string | null;
  /** Explica o `indisponivel`/`negada` para a tela mostrar algo util. */
  motivo: string | null;
  tentarNovamente: () => Promise<void>;
}

const NotificacoesContext = createContext<NotificacoesContextValor | null>(null);

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [status, setStatus] = useState<StatusNotificacoes>('verificando');
  const [token, setToken] = useState<string | null>(null);
  const [motivo, setMotivo] = useState<string | null>(null);

  /**
   * Evita registrar o mesmo token duas vezes seguidas. Sem isto, cada
   * re-render que mexa em `usuario` dispara uma chamada de rede a toa.
   */
  const jaRegistrado = useRef<string | null>(null);

  // ---- 1 + 2: permissao e token ------------------------------------------
  const preparar = useCallback(async () => {
    setStatus('verificando');
    setMotivo(null);

    /**
     * Emulador/simulador sem servicos do Google nao recebe push remoto.
     * Checar aqui evita uma excecao generica mais adiante e permite dizer ao
     * usuario o que de fato acontece.
     */
    if (!Device.isDevice) {
      setStatus('indisponivel');
      setMotivo('Push remoto precisa de aparelho fisico ou de um emulador com Google Play.');
      return;
    }

    await prepararCanalAndroid();

    /**
     * PERGUNTE ANTES DE PEDIR.
     *
     * `getPermissionsAsync` le o estado atual sem incomodar ninguem.
     * `requestPermissionsAsync` abre o dialogo do sistema — e no Android e
     * no iOS esse dialogo aparece UMA VEZ na vida do app. Se o usuario
     * recusar, pedir de novo nao mostra nada: a segunda chamada volta
     * negada na hora. Por isso nao se pede permissao na abertura, antes de
     * o usuario entender o que ganha com ela.
     */
    const atual = await Notifications.getPermissionsAsync();
    let concedida = atual.granted;

    if (!concedida && atual.canAskAgain) {
      const pedida = await Notifications.requestPermissionsAsync();
      concedida = pedida.granted;
    }

    if (!concedida) {
      setStatus('negada');
      setMotivo('Voce recusou notificacoes. Para reativar, va em Ajustes do sistema.');
      return;
    }

    try {
      /**
       * `getDevicePushTokenAsync` devolve o token NATIVO — o do FCM no
       * Android, o do APNs no iOS. E o que o nosso backend usa, porque ele
       * fala com o FCM direto.
       *
       * O outro metodo, `getExpoPushTokenAsync`, devolve um
       * `ExponentPushToken[...]`, que so serve para o servico de push da
       * Expo. Trocar um pelo outro da INVALID_ARGUMENT no envio, e a
       * mensagem do Google nao diz que o problema e esse.
       *
       * No Expo Go isto LANCA: desde o SDK 53 nao ha push remoto la. A
       * mensagem abaixo e para voce nao perder meia hora procurando o erro
       * no servidor.
       */
      const { data } = await Notifications.getDevicePushTokenAsync();
      tokenAtual = data;
      setToken(data);
      setStatus('concedida');
    } catch (erro) {
      tokenAtual = null;
      setToken(null);
      setStatus('indisponivel');
      setMotivo(
        'Nao foi possivel obter o token do aparelho. No Expo Go isso e esperado: ' +
          'push remoto exige um development build. Detalhe: ' +
          (erro instanceof Error ? erro.message : String(erro)),
      );
    }
  }, []);

  useEffect(() => {
    preparar();
  }, [preparar]);

  // ---- registro no backend (so com cliente logado) ------------------------
  useEffect(() => {
    if (!usuario || !token) return;
    if (jaRegistrado.current === token) return;

    registrarAparelho(token)
      .then(() => {
        jaRegistrado.current = token;
      })
      .catch((erro) => {
        // Falhar aqui nao pode derrubar o app: o usuario so fica sem push.
        console.warn('[push] nao consegui registrar o aparelho:', erro?.message ?? erro);
      });
  }, [usuario, token]);

  // ---- 3: entrega --------------------------------------------------------
  /**
   * Guarda o identificador da ultima notificacao ja tratada.
   *
   * POR QUE ISSO E NECESSARIO: no cold start, o toque chega por DOIS
   * caminhos — o `getLastNotificationResponseAsync` (a resposta atrasada que
   * abriu o app) e o listener, que pode disparar logo em seguida para a
   * mesma notificacao. Sem deduplicar, o deep link roda duas vezes e a tela
   * do produto entra empilhada: o botao voltar precisa de dois toques para
   * sair. O proprio `useLastNotificationResponse` da Expo faz exatamente
   * esta comparacao por dentro.
   */
  const ultimaTratada = useRef<string | null>(null);

  useEffect(() => {
    /**
     * DOIS LISTENERS, PARA DOIS MOMENTOS DIFERENTES.
     *
     * `Received` = a notificacao CHEGOU (app aberto ou em segundo plano).
     * O usuario nao fez nada ainda. Serve para atualizar a tela por baixo:
     * recarregar a lista, marcar um badge.
     *
     * `Response` = o usuario TOCOU. E so aqui que se navega. Navegar no
     * `Received` levaria a tela do produto na cara de quem estava fazendo
     * outra coisa.
     */
    const aoReceber = Notifications.addNotificationReceivedListener((notificacao) => {
      const dados = notificacao.request.content.data as DadosNotificacao;
      console.log('[push] chegou:', notificacao.request.content.title, dados);
    });

    const aoTocar = Notifications.addNotificationResponseReceivedListener((resposta) => {
      tratarToque(resposta);
    });

    /**
     * O CASO DO APP FECHADO.
     *
     * Se o app estava morto, o toque que o abriu ja aconteceu antes de este
     * listener existir — e ele nunca dispara. `getLastNotificationResponse`
     * devolve esse toque atrasado. Sem estas quatro linhas, tocar na
     * notificacao com o app fechado abre a home, e nao o produto: o bug
     * classico deste assunto.
     */
    Notifications.getLastNotificationResponseAsync().then((resposta) => {
      if (!resposta) return;
      tratarToque(resposta);
    });

    /** Um toque = uma navegacao, venha ele por qual caminho for. */
    function tratarToque(resposta: Notifications.NotificationResponse) {
      const id = resposta.notification.request.identifier;
      if (ultimaTratada.current === id) return;
      ultimaTratada.current = id;
      abrirDaNotificacao(resposta.notification.request.content.data as DadosNotificacao);
    }

    return () => {
      aoReceber.remove();
      aoTocar.remove();
    };
  }, []);

  return (
    <NotificacoesContext.Provider value={{ status, token, motivo, tentarNovamente: preparar }}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes(): NotificacoesContextValor {
  const contexto = useContext(NotificacoesContext);
  if (!contexto) {
    throw new Error('useNotificacoes precisa estar dentro de um NotificacoesProvider');
  }
  return contexto;
}

/**
 * O DEEP LINK.
 *
 * Aqui e onde "notificacao" vira "navegacao": o `data` que o servidor mandou
 * decide a tela. Repare que nada disso depende do texto da notificacao — o
 * titulo e para o humano, o `data` e para o app.
 */
function abrirDaNotificacao(dados: DadosNotificacao | undefined): void {
  if (!dados) return;

  if (dados.rota === 'produto' && dados.produtoId) {
    navegarPara({
      tela: 'DetalheProduto',
      params: {
        id: dados.produtoId,
        // O nome nao vem no push (o `data` tem limite de tamanho), entao o
        // cabecalho abre generico e a tela corrige quando o detalhe carrega.
        nome: 'Produto',
      },
    });
    return;
  }

  if (dados.rota === 'favoritos') {
    navegarPara({ tela: 'Favoritos' });
    return;
  }

  navegarPara({ tela: 'ListaProdutos' });
}
