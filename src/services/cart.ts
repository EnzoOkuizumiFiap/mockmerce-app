import { http } from './http';
import type { Cart } from '@/types/api';

/**
 * ============================================================================
 * SERVIÇOS DO CARRINHO DE COMPRAS (Cart API Services)
 * ============================================================================
 * 
 * Camada de comunicação HTTP responsável por todas as operações de leitura
 * e alteração do carrinho de compras do comprador no servidor.
 * 
 * Requisito: Todas estas rotas exigem que o cabeçalho `Authorization: Bearer <token>`
 * esteja presente (injetado automaticamente pelo interceptor de `http.ts`).
 */

/**
 * 1. Buscar Carrinho do Usuário
 * 
 * Realiza uma requisição GET para obter o estado atual do carrinho com todos os itens,
 * subtotais, contagem total de unidades e valor financeiro total.
 * 
 * @returns Promise<Cart> - Objeto completo do carrinho
 */
export async function getCart(): Promise<Cart> {
  const { data } = await http.get<Cart>('/cart');
  return data;
}

/**
 * 2. Adicionar Item ao Carrinho
 * 
 * Realiza uma requisição POST enviando a variante do produto e a quantidade desejada.
 * Se o produto já existir no carrinho, o backend soma a quantidade enviada.
 * 
 * @param variantId - ID único da variante do produto (ex: "var_camiseta_preta_g")
 * @param quantity - Quantidade de unidades a adicionar (ex: 1)
 * @returns Promise<Cart> - Retorna o carrinho atualizado após a inserção
 */
export async function addCartItem(variantId: string, quantity: number): Promise<Cart> {
  const { data } = await http.post<Cart>('/cart/items', { variantId, quantity });
  return data;
}

/**
 * 3. Atualizar Quantidade de um Item Específico
 * 
 * Realiza uma requisição PATCH para sobrescrever o número exato de unidades de um item.
 * (Usado pelos botões de "+" e "−" na tela do carrinho).
 * 
 * @param variantId - ID da variante que terá sua quantidade alterada
 * @param quantity - A nova quantidade total do item (ex: 2, 3, etc.)
 * @returns Promise<Cart> - Retorna o carrinho atualizado com os novos totais recalculados
 */
export async function updateCartItem(variantId: string, quantity: number): Promise<Cart> {
  const { data } = await http.patch<Cart>(`/cart/items/${variantId}`, { quantity });
  return data;
}

/**
 * 4. Remover Item Completamente do Carrinho (DELETE /cart/items/:variantId)
 * 
 * Realiza uma requisição DELETE para excluir uma variante inteira do carrinho.
 * 
 * @param variantId - ID da variante a ser removida
 * @returns Promise<Cart> - Retorna o carrinho atualizado sem o item excluído
 */
export async function removeCartItem(variantId: string): Promise<Cart> {
  const { data } = await http.delete<Cart>(`/cart/items/${variantId}`);
  return data;
}
