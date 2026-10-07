/**
 * ---------------------------------------------------------------------------
 * ARMAZENAMENTO LOCAL — para dados e preferencias
 * ---------------------------------------------------------------------------
 * Envolve o AsyncStorage: rapido, sem limite pratico de tamanho, e guarda em
 * TEXTO PURO. Nao criptografa nada.
 *
 * A REGRA, EM UMA LINHA:
 *
 *   Credencial  -> SecureStore   (token, senha, chave de API)
 *   Dado        -> AsyncStorage  (favoritos, cache, preferencias)
 *
 * Guardar token no AsyncStorage "funciona" — e por isso e perigoso. O app
 * roda igual, nenhum erro aparece, e o token fica legivel em aparelho com
 * root ou num backup do dispositivo.
 * ---------------------------------------------------------------------------
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Guarda um objeto qualquer, convertendo para JSON.
 * O generic <T> preserva o tipo na chamada: quem chama sabe o que esta
 * guardando, e o TypeScript confere.
 */
export async function guardarLocal<T>(chave: string, valor: T): Promise<void> {
  // AsyncStorage so aceita string. JSON.stringify faz a ponte.
  await AsyncStorage.setItem(chave, JSON.stringify(valor));
}

/**
 * Le e converte de volta.
 *
 * REPARE NO try/catch EM VOLTA DO JSON.parse.
 * Se o dado guardado estiver corrompido — versao antiga do app, escrita
 * interrompida — o parse lanca erro. Sem o catch, o app quebra na abertura e
 * o usuario nao consegue nem entrar para limpar os dados.
 *
 * Devolver `null` faz o app tratar como "nao havia nada", que e degradacao
 * elegante: perde-se o dado, nao o aplicativo.
 */
export async function lerLocal<T>(chave: string): Promise<T | null> {
  const bruto = await AsyncStorage.getItem(chave);
  if (bruto === null) return null;

  try {
    return JSON.parse(bruto) as T;
  } catch {
    // Dado corrompido: limpamos para nao repetir o erro na proxima abertura.
    await AsyncStorage.removeItem(chave);
    return null;
  }
}

/** Apaga uma chave. */
export async function apagarLocal(chave: string): Promise<void> {
  await AsyncStorage.removeItem(chave);
}
