import { http } from './http';
import type { AuthResponse, Customer } from '@/types/api';

/**
 * ============================================================================
 * SERVIÇOS DE AUTENTICAÇÃO (Auth API Services)
 * ============================================================================
 * 
 * Camada de comunicação HTTP responsável por interagir com os endpoints de
 * autenticação, registro e recuperação de contas de usuários (compradores).
 * 
 * Todas as funções utilizam a instância `http` do Axios configurada em `./http.ts`.
 */

/**
 * 1. Login de Usuário Existente
 * 
 * Envia as credenciais para o backend autenticar o usuário.
 * 
 * @param email - E-mail cadastrado na conta
 * @param password - Senha da conta
 * @returns Promise<AuthResponse> - Retorna o token JWT e os dados do cliente:
 *          `{ token: string, customer: { id, name, email } }`
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

/**
 * 2. Cadastro de Novo Usuário (Sign Up)
 * 
 * Cria uma nova conta no banco de dados do e-commerce.
 * O backend já retorna imediatamente o token JWT para que o app logue o usuário na hora.
 * 
 * @param name - Nome completo do comprador
 * @param email - E-mail único do usuário
 * @param password - Senha escolhida (mínimo de 6 caracteres)
 * @returns Promise<AuthResponse> - Retorna o token JWT e os dados do novo cliente cadastrado
 */
export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/register', { name, email, password });
  return data;
}

/**
 * 3. Solicitação de Código de Recuperação de Senha (Esqueci a Senha - Fase 1)
 * 
 * Informa ao backend para gerar um código numérico de 6 dígitos e enviar
 * por e-mail para o usuário.
 * 
 * @param email - E-mail da conta que precisa recuperar o acesso
 * @returns Promise<void> - Retorna vazio em caso de sucesso (Status 200/204)
 */
export async function forgotPassword(email: string): Promise<void> {
  await http.post('/auth/forgot-password', { email });
}

/**
 * 4. Redefinição de Senha com Código (Esqueci a Senha - Fase 2)
 * 
 * Envia o e-mail, o código de 6 dígitos recebido e a nova senha.
 * Se o código for válido, o backend atualiza a senha e já devolve o token JWT atualizado.
 * 
 * @param email - E-mail da conta
 * @param code - Código numérico de 6 dígitos recebido por e-mail
 * @param newPassword - Nova senha definida pelo usuário
 * @returns Promise<AuthResponse> - Retorna o novo token JWT e os dados do cliente para autenticação imediata
 */
export async function resetPassword(email: string, code: string, newPassword: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/reset-password', { email, code, newPassword });
  return data;
}

/**
 * 5. Obter Perfil do Usuário Autenticado (GET /auth/me)
 * 
 * Valida o token JWT no servidor e retorna os dados cadastrais atualizados do cliente.
 * Utilizado na inicialização do aplicativo para restaurar a sessão segura.
 * 
 * @returns Promise<Customer> - Dados do comprador autenticado
 */
export async function getMe(): Promise<Customer> {
  const { data } = await http.get<Customer>('/auth/me');
  return data;
}
