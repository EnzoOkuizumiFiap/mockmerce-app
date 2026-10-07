/**
 * ---------------------------------------------------------------------------
 * CONFIGURACAO DE AMBIENTE
 * ---------------------------------------------------------------------------
 * Um lugar so para ler as variaveis do `.env`, com uma checagem na abertura.
 *
 * POR QUE NAO LER `process.env` DIRETO NO client.ts?
 *
 * Porque `process.env.EXPO_PUBLIC_API_KEY` pode vir `undefined` — arquivo
 * `.env` esquecido, nome digitado errado, servidor do Expo iniciado antes de
 * criar o arquivo. Sem a checagem, o app sobe normalmente e so falha na
 * primeira requisicao, com um 401 que parece problema de senha.
 *
 * Falhar cedo e com mensagem clara custa menos tempo de aula do que depurar
 * um 401 fantasma.
 * ---------------------------------------------------------------------------
 */

/**
 * O Expo substitui `process.env.EXPO_PUBLIC_X` pelo valor literal em tempo de
 * build. Por isso a leitura precisa ser escrita por extenso: se voce montar o
 * nome da variavel dinamicamente (`process.env['EXPO_' + 'PUBLIC_API_URL']`),
 * o Expo nao encontra o padrao e nao substitui nada.
 */
const URL_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.mockmerce.com.br/v1';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';
const RM = process.env.EXPO_PUBLIC_STUDENT_RM ?? '';

if (__DEV__ && !API_KEY) {
  console.warn(
    '[config] EXPO_PUBLIC_API_KEY esta vazia.\n' +
      'Copie .env.example para .env, cole a API key do seu grupo e reinicie o\n' +
      'servidor do Expo com `npx expo start --clear`. Sem a chave, TODA\n' +
      'requisicao volta 401 — inclusive o login.',
  );
}

export const config = {
  /** Base de todas as chamadas. Ja inclui o `/v1`. */
  urlBase: URL_BASE,

  /** Identifica a LOJA (o grupo). Vai no header X-API-Key. */
  apiKey: API_KEY,

  /**
   * Identifica QUEM esta desenvolvendo. Vai no header X-Student-RM.
   * E opcional para a API funcionar, mas e por ele que o professor enxerga
   * a participacao de cada integrante do grupo.
   */
  rm: RM,
} as const;
