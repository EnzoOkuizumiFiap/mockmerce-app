/**
 * ============================================================================
 * MUTATIONS DE AÇÕES DE PEDIDOS (SEMANA 3 - useCheckout / usePayOrder / useCancelOrder)
 * ============================================================================
 * 
 * 💡 CONCEITO TEÓRICO IMPORTANTE: POR QUE NÃO USAMOS ATUALIZAÇÃO OTIMISTA AQUI?
 * - No carrinho de compras (Semana 2), usamos mutações otimistas para resposta visual
 *   imediata (+ / - quantidade) porque o risco é baixo e fácil de reverter.
 * - Já no Checkout, Pagamento e Cancelamento, estamos lidando com operações críticas de
 *   negócio (reserva de estoque físico, autorização de cobrança e transações financeiras).
 * - Portanto, NUNCA adivinhamos o resultado na UI: aguardamos a resposta real e definitiva
 *   do servidor para então sincronizar e reconciliar o cache do TanStack Query.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelOrder, checkout, payOrder } from '@/services/orders';
import { queryKeys } from '@/lib/queryKeys';
import type { Order, PaymentMethod } from '@/types/api';

/**
 * Mutation para criar o pedido a partir do carrinho ativo (POST /orders/checkout).
 * 
 * Efeito no Cache:
 * 1. Invalida `cart`: Como o carrinho virou pedido no backend, o carrinho esvaziou.
 * 2. Invalida `orders`: O cliente agora tem um novo pedido gerado em sua lista.
 */
export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkout, // Chama POST /orders/checkout
    onSuccess: () => {
      // 1. Marca o cache do carrinho como obsoleto para forçar refetch e mostrar carrinho zerado
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
      // 2. Marca a lista de pedidos como obsoleta para que a tela de histórico traga o novo pedido
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Mutation para simular e processar o pagamento de um pedido (POST /orders/:id/pay).
 * 
 * Efeito no Cache:
 * 1. `setQueryData`: Atualiza imediatamente o cache do detalhe com o `Order` retornado (ex: status PAID).
 * 2. `invalidateQueries(orders.list)`: Garante que a lista de pedidos mostre o novo status.
 * 3. `invalidateQueries(orders.timeline)`: Força a busca dos novos eventos registrados na timeline.
 */
export function usePayOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { id: string; method: PaymentMethod; simulate: 'approve' | 'decline' }) =>
      payOrder(v.id, v.method, v.simulate),
    onSuccess: (order: Order) => {
      // Escreve os dados do pedido recebidos diretamente no cache do detalhe
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
      // Invalida a lista para atualizar o card na tela de pedidos
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
      // Invalida a timeline para buscar o evento de transição de status recém-criado
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.timeline(order.id) });
    },
  });
}

/**
 * Mutation para cancelar um pedido pendente (POST /orders/:id/cancel).
 * 
 * Efeito no Cache:
 * 1. `setQueryData`: Atualiza o cache do pedido com o status 'CANCELLED'.
 * 2. `invalidateQueries`: Atualiza a listagem e a timeline de eventos.
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: (order: Order) => {
      // Atualiza o cache local com a resposta do pedido cancelado
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
      // Notifica a lista de histórico sobre a mudança de status
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
      // Atualiza a timeline com o carimbo de cancelamento
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.timeline(order.id) });
    },
  });
}
