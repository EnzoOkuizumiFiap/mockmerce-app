/**
 * ---------------------------------------------------------------------------
 * ARMAZENAMENTO SEGURO — para credenciais
 * ---------------------------------------------------------------------------
 * Envolve o expo-secure-store, que usa o Keychain no iOS e o Keystore no
 * Android. O sistema operacional criptografa o conteudo.
 *
 * POR QUE ENVOLVER EM VEZ DE CHAMAR DIRETO?
 *
 *   1. Se um dia trocarmos de biblioteca, muda so este arquivo.
 *   2. Da para tratar o erro em um lugar so.
 *   3. O resto do app fala em "token", nao em "SecureStore".
 *
 * E a mesma logica do client.ts: nenhuma tela importa axios; nenhuma tela
 * importa SecureStore.
 * ---------------------------------------------------------------------------
 */

import * as SecureStore from 'expo-secure-store';

/**
 * Guarda um valor criptografado.
 *
 * ATENCAO: o SecureStore so aceita STRING, tem limite de tamanho pequeno e e
 * mais lento que o AsyncStorage. Ele e para credencial, nao para dado.
 */
export async function guardarSeguro(chave: string, valor: string): Promise<void> {
  await SecureStore.setItemAsync(chave, valor);
}

/**
 * Le um valor. Devolve `null` se a chave nao existir.
 *
 * Repare que retornamos `null` em vez de lancar erro quando nao existe.
 * "Nao ha token guardado" e uma situacao NORMAL — e o caso de quem nunca
 * logou. Erro seria o SecureStore estar indisponivel.
 */
export async function lerSeguro(chave: string): Promise<string | null> {
  return SecureStore.getItemAsync(chave);
}

/** Apaga uma chave. Usado no logout. */
export async function apagarSeguro(chave: string): Promise<void> {
  await SecureStore.deleteItemAsync(chave);
}

/**
 * NOTA SOBRE A WEB
 * O SecureStore nao funciona em navegador: nao existe Keychain no browser.
 * Se voces rodarem `npx expo start --web`, esta camada quebra. Em app mobile
 * isso nao e problema — e o nosso caso.
 */
