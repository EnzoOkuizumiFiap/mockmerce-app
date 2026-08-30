/**
 * ============================================================================
 * ARMAZENAMENTO SEGURO DE SESSÃO (Criptografia Nativa de Chaves e Tokens)
 * ============================================================================
 * 
 * 💡 ANALOGIA DIDÁTICA: COFRE DE SEGURANÇA vs CADERNO DE ANOTAÇÕES
 * - AsyncStorage é como um "caderno de anotações comum": qualquer processo ou pessoa
 *   com acesso ao sistema de arquivos do aparelho pode abrir o arquivo XML/JSON e ler
 *   o token em texto puro (sem criptografia).
 * - SecureStore é como um "cofre de banco acoplado ao chip": ele utiliza o hardware de
 *   segurança física do celular (iOS Keychain / Android Keystore) e criptografa a chave
 *   com algoritmos AES-256 antes de gravar.
 * 
 * Por que isso é vital para o e-commerce?
 * O Token JWT é a identidade digital do comprador. Se for clonado, um invasor poderia
 * fazer pedidos, ver o endereço e usar o saldo do cliente.
 */

import * as SecureStore from 'expo-secure-store';

// Chave identificadora única utilizada dentro do chaveiro do sistema operacional
const TOKEN_KEY = 'mockmerce_customer_jwt_token';

/**
 * Salva o token JWT de forma criptografada no chaveiro do dispositivo.
 * 
 * @param token - Token JWT devolvido pelo backend após login ou cadastro
 */
export async function saveStoredToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Recupera o token gravado no chaveiro criptografado durante a inicialização do app.
 * 
 * @returns O token JWT salvo ou null se não houver sessão ativa
 */
export async function getStoredToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

/**
 * Remove o token do cofre criptografado quando o usuário clica em "Sair" (Logout).
 */
export async function removeStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
