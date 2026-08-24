/**
 * ============================================================================
 * SERVIÇO DE PEDIDOS E CHECKOUT (SEMANA 3 - Orders Service)
 * ============================================================================
 * 
 * Este módulo isola todas as chamadas HTTP relacionadas ao ciclo de vida do pedido:
 * 1. Checkout (Conversão do Carrinho -> Pedido PENDING).
 * 2. Listagem e Detalhes do Pedido.
 * 3. Pagamento Simulado (Aprovação ou Recusa).
 * 4. Cancelamento de Pedido e Liberação de Estoque.
 * 5. Linha do Tempo / Histórico de Auditoria.
 * 
 * 💡 Autenticação Automática via Interceptor:
 * Todas as rotas aqui exigem que o cliente esteja autenticado. Não precisamos passar
 * o token manualmente porque o interceptor do Axios em `http.ts` atua como uma "catraca",
 * injetando automaticamente o header `Authorization: Bearer <token>` em cada requisição.
 */

import { http } from './http';
import type { Order, PaymentMethod, TimelineEntry } from '@/types/api';

/**
 * POST /orders/checkout
 * 
 * Transforma o carrinho ativo do comprador em um novo pedido com status inicial 'PENDING'.
 * 
 * 💡 O que acontece nos bastidores do backend?
 * 1. Valida o saldo de estoque atual de cada variante do carrinho.
 * 2. Reserva as unidades no estoque para garantir que outro usuário não compre ao mesmo tempo.
 * 3. Esvazia o carrinho de compras do cliente no banco de dados.
 * 4. Retorna a entidade `Order` recém-criada.
 */
export async function checkout(): Promise<Order> {
  const { data } = await http.post<Order>('/orders/checkout');
  return data;
}

/**
 * GET /orders
 * 
 * Recupera o histórico completo de pedidos realizados pelo cliente autenticado.
 * Utilizado para renderizar a lista na tela `OrdersScreen`.
 */
export async function listOrders(): Promise<Order[]> {
  const { data } = await http.get<Order[]>('/orders');
  return data;
}

/**
 * GET /orders/:id
 * 
 * Busca os dados detalhados de um pedido específico pelo seu ID (ex: itens, total, status atual).
 * 
 * @param id - Identificador único do pedido (ex: "ord_abc123").
 */
export async function getOrder(id: string): Promise<Order> {
  const { data } = await http.get<Order>(`/orders/${id}`);
  return data;
}

/**
 * POST /orders/:id/pay
 * 
 * Processa ou simula o pagamento de um pedido pendente.
 * 
 * @param id - ID do pedido a ser pago.
 * @param method - Meio de pagamento escolhido ('CREDIT_CARD' | 'PIX' | 'BOLETO').
 * @param simulate - 'approve' para simular aprovação imediata (status vai para PAID)
 *                   ou 'decline' para simular recusa (status continua PENDING ou PAYMENT_FAILED).
 * 
 * 💡 Por que simular?
 * Em ambiente de estudos/desenvolvimento, o switch de simulação permite exercitar
 * os dois caminhos da interface sem necessidade de cartões ou chaves reais de gateway.
 */
export async function payOrder(
  id: string,
  method: PaymentMethod,
  simulate: 'approve' | 'decline',
): Promise<Order> {
  const { data } = await http.post<Order>(`/orders/${id}/pay`, { method, simulate });
  return data;
}

/**
 * POST /orders/:id/cancel
 * 
 * Cancela um pedido com status PENDING e devolve os itens reservados para o estoque geral da loja.
 * 
 * @param id - ID do pedido a ser cancelado.
 */
export async function cancelOrder(id: string): Promise<Order> {
  const { data } = await http.post<Order>(`/orders/${id}/cancel`);
  return data;
}

/**
 * GET /orders/:id/timeline
 * 
 * Retorna os eventos da linha do tempo do pedido (diário de bordo de transições de status).
 * 
 * @param id - ID do pedido.
 * @returns Array de `TimelineEntry` com histórico auditável de quem alterou e quando.
 */
export async function getOrderTimeline(id: string): Promise<TimelineEntry[]> {
  const { data } = await http.get<TimelineEntry[]>(`/orders/${id}/timeline`);
  return data;
}
