import { useQuery } from '@tanstack/react-query';
import { getProduct } from '@/services/products';
import { queryKeys } from '@/lib/queryKeys';

/**
 * ============================================================================
 * HOOK: useProduct (Detalhes de um Único Produto)
 * ============================================================================
 * 
 * Usado na tela de Detalhes do Produto (`ProductDetailScreen`).
 * 
 * @param id - O ID único do produto a ser buscado (ex: "prod_123").
 */
export function useProduct(id: string) {
  return useQuery({
    /**
     * 1. `queryKey: ['products', 'detail', id]`
     * O cache é indexado pelo ID do produto.
     * Se o usuário abrir a "Camisa (id: 1)", o React Query busca da API e guarda no cache.
     * Se depois ele abrir o "Tênis (id: 2)", busca o tênis.
     * Se voltar para a "Camisa (id: 1)", ela já abre INSTANTANEAMENTE porque está em cache!
     */
    queryKey: queryKeys.products.detail(id),

    /**
     * 2. `queryFn: () => getProduct(id)`
     * Função assíncrona que faz o GET na API passando o ID do produto.
     */
    queryFn: () => getProduct(id),

    /**
     * 3. `enabled: Boolean(id)`
     * Trava de segurança: só dispara a requisição se o `id` existir e não for uma string vazia `""`.
     * Se o ID for nulo, indefinido ou vazio, `Boolean(id)` vira `false` e não faz a chamada.
     */
    enabled: Boolean(id),
  });
}
