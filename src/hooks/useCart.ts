import { useQuery } from '@tanstack/react-query';
import { getCart } from '@/services/cart';
import { queryKeys } from '@/lib/queryKeys';
import { useSession } from '@/session/session';

/**
 * ============================================================================
 * CONCEITOS FUNDAMENTAIS: O QUE ESTÁ ACONTECENDO AQUI?
 * ============================================================================
 * 
 * 1. O que é um "Custom Hook" (Hook Customizado)?
 *    - Toda função JavaScript/TypeScript que começa com a palavra "use" (como `useCart`, `useSession`, `useProducts`)
 *      é chamada de Hook no ecossistema React.
 *    - Para que serve: Encapsular lógica de dados para que qualquer tela do aplicativo
 *      (ex: Home, Tela de Carrinho, Header) possa acessar o carrinho com apenas UMA linha:
 *      `const { data: cart, isLoading, error } = useCart();`
 * 
 * 2. O que é o TanStack Query (antigo React Query)?
 *    - É uma biblioteca especializada em gerenciar "Server State" (dados que vêm de um servidor/API).
 *    - Antigamente fazíamos: `useEffect` + `useState` + `fetch` + `try/catch` + `setIsLoading(true)`...
 *    - O TanStack Query resolve tudo isso sozinho:
 *      * Cache automático inteligente (evita ficar chamando a API toda vez que o usuário troca de tela).
 *      * Gerencia estados de `isLoading`, `isError`, `data` e `refetch` automaticamente.
 *      * Atualiza dados em segundo plano (background refetching).
 */

/**
 * Hook `useCart`
 * 
 * Busca e sincroniza os dados do carrinho de compras do usuário logado.
 */
export function useCart() {
  /**
   * 1. `useSession()`:
   * Hook que nos informa o estado da autenticação do usuário.
   * `isLoggedIn` é um booleano: `true` se o usuário fez login, `false` se não fez.
   */
  const { isLoggedIn } = useSession();

  /**
   * 2. `useQuery({...})`:
   * A função principal do TanStack Query para realizar buscas (GETs) e salvar em cache.
   */
  return useQuery({
    /**
     * A) `queryKey` (A Chave de Identificação no Cache):
     * - O TanStack Query funciona como um grande armário com gavetas etiquetadas.
     * - A `queryKey` é a "etiqueta" dessa gaveta (definida em `queryKeys.cart.all`, que é `['cart']`).
     * - Por que isso é incrível? Quando o usuário clica em "Adicionar ao Carrinho" ou "Remover do Carrinho"
     *   em qualquer outra tela do app, nós só precisamos chamar:
     *   `queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })`
     *   E todas as telas que usam o `useCart()` se atualizam sozinhas na mesma hora!
     */
    queryKey: queryKeys.cart.all,

    /**
     * B) `queryFn` (A Função que Busca os Dados):
     * - É a função assíncrona que realmente faz a chamada HTTP (o `fetch` ou `axios` até o backend).
     * - Aqui usamos a função `getCart` que criamos na pasta `@/services/cart`.
     * - O TanStack Query executa o `getCart`, aguarda a resposta e guarda o resultado na `queryKey`.
     */
    queryFn: getCart,

    /**
     * C) `enabled` (Busca Condicional / Trava de Execução):
     * - Controla se a busca DEVE ou NÃO rodar automaticamente.
     * - Como passamos `enabled: isLoggedIn`:
     *   * Se o usuário NÃO estiver logado (`isLoggedIn = false`):
     *     O React Query NÃO faz a requisição à API. Isso evita que o app tome erro `401 Unauthorized`
     *     e economiza dados móveis e bateria do celular.
     *   * Se o usuário fizer login (`isLoggedIn` vira `true`):
     *     O React Query percebe a mudança automaticamente e dispara a busca do carrinho na hora!
     */
    enabled: isLoggedIn,
  });
}
