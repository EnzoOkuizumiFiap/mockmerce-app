/**
 * ---------------------------------------------------------------------------
 * CONFIGURACAO GLOBAL DE NOTIFICACOES
 * ---------------------------------------------------------------------------
 * Este arquivo roda UMA VEZ, no import, antes de qualquer componente montar.
 * Nao e um detalhe de organizacao: o handler precisa estar instalado antes de
 * a primeira notificacao chegar, senao a primeira e engolida em silencio.
 * ---------------------------------------------------------------------------
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { cores } from './tema';

/**
 * O id do canal precisa ser IGUAL ao que o servidor manda em
 * `android.notification.channel_id`. Se nao bater, o Android entrega no canal
 * padrao dele e ignora o som e a prioridade que voce configurou aqui — a
 * notificacao chega, mas muda e sem prioridade, e ninguem entende por que.
 */
export const CANAL_PADRAO = 'default';

/**
 * O QUE ACONTECE COM O APP ABERTO.
 *
 * Por padrao, notificacao que chega com o app em primeiro plano NAO aparece.
 * Faz sentido: o usuario ja esta olhando para o app. Mas "nao aparece" pega
 * todo mundo de surpresa na primeira vez — voce manda o push, o celular fica
 * mudo, e voce vai procurar o erro no servidor.
 *
 * Aqui decidimos mostrar assim mesmo. E uma escolha de produto, nao uma
 * obrigacao tecnica: numa loja, "o preco do que voce salvou caiu" merece
 * interromper mesmo quem esta navegando.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Banner = a tarja que desce no topo.
    shouldShowBanner: true,
    // List = fica guardada na central de notificacoes.
    shouldShowList: true,
    shouldPlaySound: true,
    // Badge = o numerinho no icone. Sem uma regra de "quantos nao lidos",
    // ele so acumula e nunca zera. Melhor nao ligar o que nao se controla.
    shouldSetBadge: false,
  }),
});

/**
 * Cria o canal do Android.
 *
 * Canal e uma exigencia do Android 8+: o usuario pode silenciar UM canal sem
 * silenciar o app inteiro. Criar de novo com o mesmo id nao duplica nada —
 * mas repare que, depois do primeiro registro, o sistema IGNORA mudancas de
 * importancia feitas por codigo. Quem manda a partir dai e o usuario, nas
 * configuracoes. Em desenvolvimento, para testar uma mudanca de canal, e
 * preciso desinstalar o app.
 *
 * No iOS nao existe canal: a funcao simplesmente nao faz nada.
 */
export async function prepararCanalAndroid(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CANAL_PADRAO, {
    name: 'Avisos da loja',
    description: 'Queda de preco dos produtos que voce salvou, status de pedido e novidades.',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: cores.primaria,
  });
}
