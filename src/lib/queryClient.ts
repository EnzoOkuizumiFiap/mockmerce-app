import { ApiError } from "@/types/api";
import { QueryClient } from "@tanstack/react-query";

/**
 * ============================================================================
 * CONFIGURAÇÃO GLOBAL DO TANSTACK QUERY (QueryClient)
 * ============================================================================
 * 
 * O `QueryClient` é o cérebro central do TanStack Query.
 * Ele gerencia a memória cache de todas as requisições do aplicativo e define
 * as regras globais de quando atualizar dados e o que fazer em caso de erro.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * 1. `staleTime: 30 segundos` (Tempo de "Dado Fresco")
       * - Durante 30 segundos após uma busca, o dado é considerado "fresco" (fresh).
       * - Se o usuário trocar de tela e voltar dentro desses 30s, o app USA O CACHE
       *   e NÃO faz nenhuma nova requisição na internet.
       * - Após 30s, o dado fica "obsoleto" (stale). Quando o usuário voltar à tela,
       *   ele exibe o cache na hora e busca silenciosamente uma versão nova no fundo.
       */
      staleTime: 1000 * 30, // 30s

      /**
       * 2. `gcTime: 5 minutos` (Garbage Collection / Tempo de Vida no Cache)
       * - (Nas versões antigas do React Query se chamava `cacheTime`).
       * - Se uma tela for fechada e ninguém mais estiver usando aqueles dados,
       *   o React Query mantém os dados guardados na memória por 5 minutos.
       * - Se passar de 5 minutos sem uso, ele deleta da memória RAM para não pesar o celular.
       */
      gcTime: 1000 * 60 * 5, // 5min

      /**
       * 3. `retry: Função de Tentativas Automáticas em caso de Falha`
       * - Define se o React Query deve tentar fazer a requisição de novo se der erro.
       * 
       * Regra Inteligente:
       * - Se o erro for do cliente (Status 400 a 499, como 400 Bad Request, 401 Não Autorizado, 404 Não Encontrado):
       *   -> Retorna `false` (NÃO tenta de novo, pois o erro é definitivo e tentar repetidamente só gastaria internet/bateria).
       * - Se for erro de rede/servidor (ex: Erro 500 ou queda momentânea da conexão):
       *   -> Tenta novamente até 2 vezes (`failureCount < 2`).
       */
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error?.status >= 400 && error?.status < 500) {
          return false;
        }

        return failureCount < 2;
      },
    },
  },
});