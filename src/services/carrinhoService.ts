/**
 * ---------------------------------------------------------------------------
 * SERVICE DE CARRINHO E PEDIDOS  (ja vem pronto)
 * ---------------------------------------------------------------------------
 * Nao e o conteudo desta aula: esta aqui porque so quem comprou pode avaliar.
 *
 * Uma observacao que vale para a vida: TUDO aqui exige cliente logado. O
 * carrinho e do cliente, nao do aparelho — trocar de celular e continuar com
 * o mesmo carrinho e consequencia de ele viver no servidor.
 * ---------------------------------------------------------------------------
 */

import { api } from '../api/client';
import { Carrinho, MetodoPagamento, Pedido } from '../types/pedido';

export async function buscarCarrinho(): Promise<Carrinho> {
  const resposta = await api.get<Carrinho>('/cart');
  return resposta.data;
}

export async function adicionarAoCarrinho(
  variantId: string,
  quantidade = 1,
): Promise<Carrinho> {
  const resposta = await api.post<Carrinho>('/cart/items', { variantId, quantity: quantidade });
  return resposta.data;
}

export async function removerDoCarrinho(itemId: string): Promise<void> {
  await api.delete(`/cart/items/${itemId}`);
}

/**
 * Fecha o pedido. O `pickupPointId` e opcional:
 *   sem ele  -> entrega no endereco
 *   com ele  -> RETIRADA naquele ponto (o pedido volta com `pickup` preenchido)
 */
export async function finalizarCompra(pontoRetiradaId?: string): Promise<Pedido> {
  const resposta = await api.post<Pedido>('/orders/checkout', {
    pickupPointId: pontoRetiradaId,
  });
  return resposta.data;
}

/**
 * Paga o pedido. `simulate` existe porque este e um pagamento de mentira:
 * e assim que se testa o caminho do RECUSADO sem precisar de cartao sem
 * limite. O caminho triste e o que os apps esquecem de tratar.
 */
export async function pagarPedido(
  pedidoId: string,
  metodo: MetodoPagamento,
  simular: 'approve' | 'decline' = 'approve',
): Promise<Pedido> {
  const resposta = await api.post<Pedido>(`/orders/${pedidoId}/pay`, {
    method: metodo,
    simulate: simular,
  });
  return resposta.data;
}

export async function listarPedidos(): Promise<Pedido[]> {
  const resposta = await api.get<Pedido[]>('/orders');
  return resposta.data;
}
