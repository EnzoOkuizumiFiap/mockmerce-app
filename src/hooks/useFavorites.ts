/**
 * ============================================================================
 * HOOKS DE FAVORITOS (TanStack Query - useFavorites / useToggleFavorite)
 * ============================================================================
 * 
 * 💡 CONCEITO TEÓRICO: POR QUE USAR TANSTACK QUERY PARA FAVORITOS?
 * - O TanStack Query atua como uma "camada de cache reativa": ele armazena a lista
 *   de favoritos em memória e gerencia automaticamente os estados de `isLoading`,
 *   `isError` e `data`.
 * - Ao adicionar ou remover um favorito com `useMutation`, executamos uma
 *   "invalidação de cache" (`queryClient.invalidateQueries`). Isso avisa o React Query
 *   que os dados em memória ficaram desatualizados, disparando um novo `GET` em
 *   segundo plano e atualizando todas as telas (detalhes, catálogo e lista de favoritos)
 *   automaticamente, sem necessidade de recarregar a tela inteira!
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addFavorite, listFavorites, removeFavorite } from '@/services/favorites';
import { queryKeys } from '@/lib/queryKeys';
import { useSession } from '@/session/session';
import type { FavoriteItem } from '@/types/api';

/**
 * 1. Hook de Consulta de Favoritos
 * 
 * Busca a lista de livros favoritados pelo usuário ativo no endpoint GET /customers/me/favorites.
 * 
 * Propriedades Importantes:
 * - `enabled: isLoggedIn`: A requisição só é disparada se o usuário estiver autenticado.
 * - `staleTime`: Mantém os dados considerados "frescos" por 2 minutos para economizar bateria e tráfego.
 */
export function useFavorites() {
  const { isLoggedIn } = useSession();

  return useQuery<FavoriteItem[]>({
    queryKey: queryKeys.favorites.list(),
    queryFn: listFavorites,
    enabled: isLoggedIn, // Trava de segurança: não busca se deslogado
    staleTime: 1000 * 60 * 2, // 2 minutos de cache
  });
}

/**
 * 2. Hook de Mutação para Adicionar Favorito
 * 
 * Dispara POST /customers/me/favorites passando o `variantId`.
 * No sucesso (`onSuccess`), invalida o cache de favoritos para sincronizar a UI.
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId: string) => addFavorite(variantId),
    onSuccess: () => {
      // Invalida todas as queries sob a chave ['favorites']
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });
}

/**
 * 3. Hook de Mutação para Remover Favorito
 * 
 * Dispara DELETE /customers/me/favorites/:variantId.
 * No sucesso (`onSuccess`), invalida o cache para que o item suma da lista de favoritos.
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId: string) => removeFavorite(variantId),
    onSuccess: () => {
      // Notifica o TanStack Query para revalidar a lista
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });
}

/**
 * 4. Hook de Conveniência: useToggleFavorite
 * 
 * Combina a consulta de favoritos e as duas mutações (adicionar e remover)
 * em uma interface simples:
 * - `isFavorite(variantId)`: Retorna true se a variante já está favoritada.
 * - `toggle(variantId)`: Se já estiver favorita, remove; caso contrário, adiciona.
 * - `isPending`: Booleano para desativar botões enquanto a mutação está viajando pela rede.
 */
export function useToggleFavorite() {
  const { data: favorites } = useFavorites();
  const addMut = useAddFavorite();
  const removeMut = useRemoveFavorite();

  // Verifica se o variantId existe no array de favoritos da memória
  const isFavorite = (variantId: string) => {
    return favorites?.some((item) => item.variantId === variantId) ?? false;
  };

  // Alterna o estado de favorito de acordo com o status atual
  const toggle = async (variantId: string) => {
    if (isFavorite(variantId)) {
      await removeMut.mutateAsync(variantId);
    } else {
      await addMut.mutateAsync(variantId);
    }
  };

  return {
    isFavorite,
    toggle,
    isPending: addMut.isPending || removeMut.isPending,
  };
}
