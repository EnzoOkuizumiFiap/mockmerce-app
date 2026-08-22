import type { ListProductsParams } from '@/services/products';

/**
 * ============================================================================
 * FÁBRICA DE CHAVES DE CONSULTA (Query Key Factory Pattern)
 * ============================================================================
 * 
 * Por que criamos este arquivo centralizado de chaves?
 * 
 * 1. Evita Erros de Digitação (Bugs Silenciosos):
 *    - Se em uma tela você escrever `['product']` e na outra `['products']`,
 *      o React Query não vai conseguir sincronizar o cache entre elas.
 * 
 * 2. Invalidação de Cache Hierárquica e Precisa:
 *    - Todas as consultas de produtos começam com `['products']`.
 *    - Se quisermos invalidar TUDO de produtos (listas, buscas e detalhes):
 *      `queryClient.invalidateQueries({ queryKey: queryKeys.products.all })`
 *    - Se quisermos invalidar APENAS o detalhe de um produto específico:
 *      `queryClient.invalidateQueries({ queryKey: queryKeys.products.detail('123') })`
 * 
 * 3. O que é o `as const` do TypeScript?
 *    - Informa ao TypeScript que o array é uma tupla somente leitura com valores literais fixos,
 *      garantindo tipagem estrita e autocompletar perfeito no VS Code.
 */
export const queryKeys = {
  products: {
    // Chave base para todas as queries de produtos: ['products']
    all: ['products'] as const,

    // Chave para listagens com filtros/paginação: ['products', 'list', { search: 'tenis', page: 1 }]
    list: (params: ListProductsParams) => ['products', 'list', params] as const,

    // Chave para a página de detalhe de um produto específico: ['products', 'detail', 'prod_123']
    detail: (id: string) => ['products', 'detail', id] as const,
  },

  cart: {
    // Chave do carrinho de compras do usuário: ['cart']
    all: ['cart'] as const,
  },
};
