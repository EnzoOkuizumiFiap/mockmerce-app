import axios, { AxiosError } from 'axios';
import { env } from '@/env';
import { ApiError } from '@/types/api';

/**
 * ============================================================================
 * CLIENTE HTTP CENTRALIZADO (Instância do Axios com Interceptors)
 * ============================================================================
 * Pense no Interceptor como um "Guarda de Segurança" ou uma "Catraca":
 * 
 * 1. REQUEST INTERCEPTOR (Catraca de Saída):
 *    - Fica entre o seu código e a Internet.
 *    - Quando você faz `http.get('/cart')`, a requisição NÃO vai direto para o servidor.
 *    - Ela para no Interceptor primeiro! O Interceptor inspeciona a requisição,
 *      anexa o Token JWT no cabeçalho e aí sim libera para viajar pela internet.
 * 
 * 2. RESPONSE INTERCEPTOR (Catraca de Entrada):
 *    - Fica entre a Internet e a sua tela (ou hook).
 *    - Quando o servidor responde (com sucesso ou com erro), a resposta NÃO vai direto
 *      para o seu `try/catch`.
 *    - Ela para no Interceptor primeiro! Se for um erro feio de rede ou do Axios,
 *      o Interceptor "higieniza" o erro e transforma na nossa classe amigável `ApiError`.
 * ----------------------------------------------------------------------------
 */

// Criação da instância base do Axios
export const http = axios.create({
  baseURL: `${env.apiUrl}/v1`, // Prefixo padrão de todas as rotas (ex: "https://api.exemplo.com/v1")
  timeout: 15000,              // Timeout de 15 segundos (cancela se a internet travar)
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': env.apiKey,       // Chave pública de identificação da aplicação
    'X-Student-RM': env.studentRm, // RM do aluno para identificação da turma no backend
  },
});

// ----------------------------------------------------------------------------
// 1. GERENCIAMENTO DE TOKEN EM MEMÓRIA & REQUEST INTERCEPTOR
// ----------------------------------------------------------------------------

/**
 * Variável privada em memória que guarda o Token JWT do usuário logado.
 */
let customerToken: string | null = null;

/**
 * Atualiza o token em memória.
 * Chamada pelo `useSession()` sempre que o usuário faz login ou logout.
 */
export function setCustomerToken(token: string | null) {
  customerToken = token;
}

/**
 * INTERCEPTOR DE REQUISIÇÃO (Request Interceptor):
 * Executado AUTOMATICAMENTE antes de toda e qualquer requisição HTTP sair do app.
 */
http.interceptors.request.use((config) => {
  // Se o usuário estiver autenticado, carimba o cabeçalho com o Token Bearer
  if (customerToken) {
    config.headers.set('Authorization', `Bearer ${customerToken}`);
  } else {
    // Se o usuário deslogou, garante que requisições anônimas não enviem token velho
    config.headers.delete('Authorization');
  }
  
  // Libera a requisição para viajar pela internet até o servidor
  return config;
});

// ----------------------------------------------------------------------------
// 2. RESPONSE INTERCEPTOR & NORMALIZAÇÃO DE ERROS
// ----------------------------------------------------------------------------

/**
 * Callback disparado automaticamente quando o backend retorna 401 Unauthorized.
 * Permite que a camada de sessão derrube o login e devolva o usuário à tela de login.
 */
let unauthorizedCallback: (() => void) | null = null;

export function setUnauthorizedCallback(callback: (() => void) | null) {
  unauthorizedCallback = callback;
}

/**
 * INTERCEPTOR DE RESPOSTA (Response Interceptor):
 * Executado AUTOMATICAMENTE assim que uma resposta chega da internet, antes de
 * ser entregue para o seu `try/catch` ou para o React Query.
 */
http.interceptors.response.use(
  // 1º Parâmetro: Se a resposta foi SUCESSO (Status 200, 201, etc.)
  // Apenas entrega os dados sem mexer em nada
  (response) => response,

  // 2º Parâmetro: Se a requisição DEU ERRO (Status 400, 401, 404, 500, sem internet ou timeout)
  (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data?.error;

    // Se qualquer rota protegida responder 401 (token expirado ou adulterado), encerra a sessão imediatamente
    if (status === 401 && unauthorizedCallback) {
      unauthorizedCallback();
    }

    // Cenário A: O backend respondeu com JSON de erro estruturado (ex: 400 com mensagem "E-mail inválido")
    if (payload) {
      return Promise.reject(new ApiError(payload.code ?? 'ERROR', payload.message ?? 'Erro na API', status));
    }

    // Cenário B: Timeout de conexão (o servidor demorou mais de 15s para responder)
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError('TIMEOUT', 'A requisição demorou demais.', status));
    }

    // Cenário C: Erro de Rede (celular sem 4G/Wi-Fi ou servidor fora do ar)
    return Promise.reject(
      new ApiError('NETWORK_ERROR', 'Sem conexão com o servidor. Confira a URL da API.', status),
    );
  },
);

/**
 * Instância "loja" do Axios — usada apenas nas rotas /store/**.
 */
export const storeHttp = axios.create({
  baseURL: `${env.apiUrl}/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': env.apiKey,
    'X-Student-RM': env.studentRm,
    // Sem Authorization de propósito — ver comentário acima.
  },
});

// Reaproveita o mesmo tratamento de erro da instância principal
storeHttp.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data?.error;

    if (payload) {
      return Promise.reject(new ApiError(payload.code ?? 'ERROR', payload.message ?? 'Erro na API', status));
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError('TIMEOUT', 'A requisição demorou demais.', status));
    }
    return Promise.reject(
      new ApiError('NETWORK_ERROR', 'Sem conexão com o servidor. Confira a URL da API.', status),
    );
  },
);