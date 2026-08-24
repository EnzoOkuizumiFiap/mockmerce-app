/**
 * ============================================================================
 * HOOKS DE CONSULTA DE PEDIDOS (SEMANA 3 - useOrders / useOrder / useOrderTimeline)
 * ============================================================================
 * 
 * Este arquivo encapsula as leituras assíncronas do domínio de Pedidos usando o
 * TanStack Query (`useQuery`).
 * 
 * 💡 Por que usar Hooks customizados com useQuery?
 * 1. Gerenciamento Automático de Cache: Dados de pedidos já carregados ficam na memória,
 *    evitando telas brancas e requisições repetitivas ao navegar entre telas.
 * 2. Estados Derivados Nativos: O TanStack Query nos entrega de bandeja `isLoading`,
 *    `isError`, `error`, `isFetching` e a função `refetch()`.
 * 3. Query Keys Hierárquicas: Permitem invalidar o cache de forma precisa e cirúrgica.
 */

import { useQuery } from '@tanstack/react-query';
import { getOrder, getOrderTimeline, listOrders } from '@/services/orders';
import { queryKeys } from '@/lib/queryKeys';
import { useSession } from '@/session/session';

/**
 * Hook para buscar o histórico de pedidos do cliente autenticado.
 * 
 * 💡 Por que `enabled: isLoggedIn`?
 * - Evita disparar requisição para `GET /orders` se o usuário estiver deslogado,
 *   prevenindo erros 401 Unauthorized desnecessários.
 */
export function useOrders() {
  const { isLoggedIn } = useSession();

  return useQuery({
    queryKey: queryKeys.orders.list(), // Chave: ['orders', 'list']
    queryFn: listOrders,               // Função que executa a chamada HTTP
    enabled: isLoggedIn,               // Só executa se houver sessão ativa
  });
}

/**
 * Hook para carregar os dados detalhados de um pedido específico.
 * 
 * @param id - ID do pedido a ser consultado (ex: route.params.id).
 * 
 * 💡 Por que `enabled: Boolean(id)`?
 * - Enquanto a tela está montando ou se o ID vier vazio/indefinido, o TanStack Query
 *   aguarda e NÃO dispara requisições inválidas como `GET /orders/undefined`.
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id), // Chave: ['orders', 'detail', id]
    queryFn: () => getOrder(id),           // Busca detalhada pelo ID
    enabled: Boolean(id),                  // Trava de segurança: só busca se o ID existir
  });
}

/**
 * Hook para carregar a linha do tempo (audit trail / histórico de status) do pedido.
 * 
 * @param id - ID do pedido.
 * 
 * 💡 Por que separar a timeline em uma query própria?
 * - Mantém a flexibilidade: o detalhe do pedido e sua linha do tempo podem ser
 *   atualizados ou invalidados de forma independente no cache.
 */
export function useOrderTimeline(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.timeline(id), // Chave: ['orders', 'timeline', id]
    queryFn: () => getOrderTimeline(id),     // Busca os eventos da timeline
    enabled: Boolean(id),                    // Só busca se o ID for válido
  });
}
