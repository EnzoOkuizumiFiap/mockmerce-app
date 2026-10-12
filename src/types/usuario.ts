/**
 * ---------------------------------------------------------------------------
 * TIPOS DE AUTENTICACAO
 * ---------------------------------------------------------------------------
 * Espelham exatamente o que a API da turma devolve. Confira em
 * https://api.mockmerce.com.br/docs -> "Auth Cliente".
 * ---------------------------------------------------------------------------
 */

/**
 * O cliente final da loja — o comprador, nao o aluno que administra a loja.
 *
 * Repare que o `id` e STRING (um cuid, tipo "cmse4k..."), e nao numero.
 * Isso importa em todo lugar que usa o id: chave de favoritos, keyExtractor
 * da FlatList, parametro de navegacao.
 */
export type Usuario = {
  id: string;
  name: string;
  email: string;

  /**
   * A API ainda nao guarda foto do cliente. O campo existe aqui como opcional
   * para o dia em que guardar — e a tela de perfil ja sabe cair para as
   * iniciais do nome quando ele vier vazio (ver components/Avatar.tsx).
   */
  image?: string | null;
};

/** Corpo do POST /auth/login. O "usuario" desta API e o e-mail. */
export type Credenciais = {
  email: string;
  password: string;
};

/**
 * Corpo do POST /auth/register.
 *
 * E `Credenciais` mais o nome — por isso o `extends`, e nao tres campos
 * repetidos. Se a API mudar o formato do login, este tipo acompanha sozinho.
 *
 * O `document` (CPF) e opcional na API e nao aparece na tela: pedir documento
 * num cadastro que so precisa de e-mail afasta gente. Quando o checkout
 * precisar dele, pede-se ali.
 */
export type NovoCliente = Credenciais & {
  name: string;
  document?: string;
};

/**
 * Resposta de POST /auth/login e POST /auth/register.
 *
 * NOTA SOBRE O refreshToken: esta API emite um token so, de vida longa, e
 * nao devolve refreshToken. O campo fica opcional porque o app ja sabe
 * guarda-lo e apaga-lo — no dia em que a API passar a emitir, nada muda
 * aqui. Ver storage/chavesArmazenamento.ts.
 */
export type RespostaLogin = {
  token: string;
  refreshToken?: string;
  customer: Usuario;
};
