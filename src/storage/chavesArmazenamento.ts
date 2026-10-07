/**
 * ---------------------------------------------------------------------------
 * CHAVES DE ARMAZENAMENTO
 * ---------------------------------------------------------------------------
 * Centralizar as chaves em um arquivo so faz o editor autocompletar e o
 * TypeScript proteger contra erro de digitacao. `'favoritoss.3'` guardado uma
 * vez e lido como `'favoritos.3'` nao gera erro nenhum: a lista simplesmente
 * volta vazia.
 *
 * REPARE NA DIFERENCA ENTRE AS DUAS FAMILIAS.
 *
 * As chaves de SESSAO sao fixas — so existe uma sessao no aparelho por vez.
 * As chaves de DADOS sao FUNCOES que recebem o id do usuario. Com chave fixa,
 * o proximo usuario que logar no mesmo aparelho encontra os dados do
 * anterior. Isso nao gera erro: gera um bug silencioso que so aparece quando
 * alguem testa com duas contas.
 * ---------------------------------------------------------------------------
 */

/** Vai para o SecureStore. Credenciais. */
export const CHAVES_SEGURAS = {
  token: 'auth.token',

  /**
   * A API da turma ainda nao emite refreshToken. A chave existe assim mesmo
   * porque o logout ja apaga as duas: no dia em que a API emitir, nenhum
   * codigo de limpeza precisa ser lembrado.
   */
  refreshToken: 'auth.refreshToken',
} as const;

/** Vai para o AsyncStorage. Dados e preferencias. */
export const CHAVES = {
  /** Dados do usuario logado, para o perfil abrir sem rede. */
  usuario: 'sessao.usuario',

  /**
   * Favoritos POR USUARIO.
   *
   *   cliente cmse4k... -> favoritos.cmse4k...
   *   cliente cmse9p... -> favoritos.cmse9p...
   *
   * A regra: tudo que muda o resultado entra na chave. Aqui quem muda o
   * resultado e a identidade de quem esta logado.
   */
  favoritos: (usuarioId: string) => `favoritos.${usuarioId}`,
} as const;
