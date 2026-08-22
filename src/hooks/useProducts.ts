import { useQuery } from '@tanstack/react-query';
import { listProducts, type ListProductsParams } from '@/services/products';
import { queryKeys } from '@/lib/queryKeys';

/**
 * ============================================================================
 * HOOK: useProducts (Lista de Produtos com Filtros e Paginação)
 * ============================================================================
 * 
 * Usado na tela principal (Catálogo de Produtos).
 * 
 * @param params - Objeto com filtros opcionais (busca por texto, categoria, página, etc.).
 *                 Exemplo: `{ search: 'camiseta', page: 1, pageSize: 10 }`.
 *                 Se não passar nada, assume o objeto vazio `{}`.
 */
export function useProducts(params: ListProductsParams = {}) {
  return useQuery({
    /**
     * 1. `queryKey: ['products', 'list', params]`
     * A chave do cache inclui os filtros (`params`)!
     * Isso significa que o React Query cria um cache separado para cada busca:
     * - Busca 'tenis' -> guarda na chave `['products', 'list', { search: 'tenis' }]`
     * - Busca 'camiseta' -> guarda na chave `['products', 'list', { search: 'camiseta' }]`
     * Ao trocar de busca, o React Query já re-dispara a busca automaticamente!
     */
    queryKey: queryKeys.products.list(params),

    /**
     * 2. `queryFn: () => listProducts(params)`
     * Função que chama a API enviando os parâmetros de busca/paginação.
     */
    queryFn: () => listProducts(params),

    /**
     * 3. `placeholderData: (previous) => previous` (UX Otimizada / Sem Piscar Tela)
     * Quando o usuário muda de página (ex: da pág. 1 para a pág. 2) ou digita uma nova busca:
     * - Sem isso: A tela piscaria um `<Loading />` em tela cheia toda vez.
     * - Com isso: Mantém a lista anterior visível na tela enquanto a nova página carrega
     *   em segundo plano. A experiência de navegação fica super fluida e sem "flashes"!
     */
    placeholderData: (previous) => previous,
  });
}
