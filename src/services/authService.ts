/**
 * ---------------------------------------------------------------------------
 * SERVICE DE AUTENTICACAO
 * ---------------------------------------------------------------------------
 * Traduz "entrar no app" para "POST /auth/login" e "criar conta" para
 * "POST /auth/register".
 *
 * Repare no que ele NAO faz: nao guarda token, nao mexe em estado, nao navega.
 * Um service so conversa com a API e devolve o dado limpo. Quem decide o que
 * fazer com o resultado e o AuthContext.
 * ---------------------------------------------------------------------------
 */

import { api } from '../api/client';
import { Credenciais, NovoCliente, RespostaLogin } from '../types/usuario';

/**
 * O `X-API-Key` vai junto automaticamente (ver api/client.ts). E por isso que
 * o login ja acontece "dentro" de uma loja: a mesma senha em outro grupo e
 * outro cliente.
 */
export async function login(credenciais: Credenciais): Promise<RespostaLogin> {
  const resposta = await api.post<RespostaLogin>('/auth/login', credenciais);
  return resposta.data;
}

/**
 * Cadastro do cliente final.
 *
 * A API devolve o MESMO formato do login — token + customer — ou seja, quem
 * se cadastra ja entra. Isso evita o padrao irritante de criar a conta e cair
 * de volta na tela de login para digitar tudo de novo.
 *
 * Erros previsiveis:
 *   409  ja existe cliente com este e-mail NESTA loja
 *   400  senha com menos de 6 caracteres, ou e-mail mal formado
 */
export async function cadastrar(dados: NovoCliente): Promise<RespostaLogin> {
  const resposta = await api.post<RespostaLogin>('/auth/register', dados);
  return resposta.data;
}
