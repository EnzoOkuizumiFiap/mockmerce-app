/**
 * ---------------------------------------------------------------------------
 * SERVICE DE NOTIFICACOES
 * ---------------------------------------------------------------------------
 * Duas chamadas, e as duas precisam do cliente LOGADO: o backend guarda o
 * aparelho junto do cliente, porque e assim que ele sabe para quem mandar
 * "o preco do produto que VOCE salvou caiu".
 * ---------------------------------------------------------------------------
 */
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { api } from '../api/client';

export interface AparelhoRegistrado {
  id: string;
  platform: 'ANDROID' | 'IOS' | 'WEB';
  deviceName: string | null;
  tokenPreview: string;
  active: boolean;
}

/**
 * Registra este aparelho para receber push.
 *
 * CHAME A CADA ABERTURA DO APP, nao so uma vez no primeiro login. O token do
 * FCM e por INSTALACAO e pode mudar sozinho: reinstalacao, limpar dados do
 * app, restaurar backup em outro aparelho, ou rotacao decidida pelo proprio
 * Firebase. Um app que registra so uma vez para de receber push um dia,
 * sem ninguem mexer em nada.
 *
 * O backend faz upsert pelo token, entao chamar toda vez nao duplica.
 */
export async function registrarAparelho(token: string): Promise<AparelhoRegistrado> {
  const resposta = await api.post<AparelhoRegistrado>('/customers/me/devices', {
    token,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    // Serve so para voce se achar na lista do painel quando houver varios.
    deviceName: Device.deviceName ?? Device.modelName ?? undefined,
    appVersion: Constants.expoConfig?.version ?? undefined,
  });
  return resposta.data;
}

/**
 * Tira este aparelho da lista.
 *
 * PRECISA acontecer no logout, e ANTES de apagar o token da sessao — a rota
 * exige o cliente autenticado. Sem isso, quem sair da conta continua
 * recebendo notificacao dirigida ao dono anterior, o que alem de errado e
 * vazamento: "o preco do produto que voce salvou caiu" conta o que a outra
 * pessoa tinha salvo.
 */
export async function removerAparelho(token: string): Promise<void> {
  await api.delete(`/customers/me/devices/${encodeURIComponent(token)}`);
}
