/**
 * ============================================================================
 * SERVIÇO DE FAVORITOS (Comunicação HTTP com a API)
 * ============================================================================
 * 
 * Centraliza as requisições assíncronas de favoritos do comprador autenticado:
 * 1. GET /customers/me/favorites       -> Obter lista de favoritos
 * 2. POST /customers/me/favorites      -> Adicionar aos favoritos
 * 3. DELETE /customers/me/favorites/:id -> Remover dos favoritos
 * 
 * 💡 CONCEITO IMPORTANTE: POR QUE FAVORITAMOS A VARIANTE E NÃO O PRODUTO?
 * - No catálogo, o Produto é o "título geral" (ex: Harry Potter e a Pedra Filosofal),
 *   enquanto a Variante é a "edição física específica" (ex: Edição Ilustrada de Luxo,
 *   com seu próprio SKU, preço e estoque).
 * - Portanto, o comprador guarda nos favoritos a edição exata que deseja adquirir.
 */

import { http } from './http';
import type { FavoriteItem } from '@/types/api';

/**
 * GET /customers/me/favorites
 * 
 * Consulta o servidor para trazer todos os livros favoritados pelo usuário ativo.
 * Utiliza o Bearer Token injetado automaticamente pelo interceptor do Axios.
 */
export async function listFavorites(): Promise<FavoriteItem[]> {
  const { data } = await http.get<FavoriteItem[]>('/customers/me/favorites');
  return data;
}

/**
 * POST /customers/me/favorites
 * 
 * Registra uma variante de livro na lista de desejos do comprador no banco de dados.
 * 
 * @param variantId - Identificador único da variante (edição/formato)
 */
export async function addFavorite(variantId: string): Promise<void> {
  await http.post('/customers/me/favorites', { variantId });
}

/**
 * DELETE /customers/me/favorites/:variantId
 * 
 * Exclui a variante correspondente da lista de favoritos do comprador.
 * 
 * @param variantId - Identificador único da variante a ser desmarcada
 */
export async function removeFavorite(variantId: string): Promise<void> {
  await http.delete(`/customers/me/favorites/${variantId}`);
}
