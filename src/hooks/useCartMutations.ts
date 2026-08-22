import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { addCartItem, removeCartItem, updateCartItem } from '@/services/cart';
import { queryKeys } from '@/lib/queryKeys';
import type { Cart, CartItem } from '@/types/api';

/**
 * ============================================================================
 * CONCEITO CHAVE: ATUALIZAÇÕES OTIMISTAS (OPTIMISTIC UPDATES)
 * ============================================================================
 * 
 * O que é uma Atualização Otimista?
 * - No mobile, se você clicar em "+" para aumentar a quantidade de um produto e
 *   esperar a internet responder (300ms a 2s), o app parece lerdo e travado.
 * - Na Atualização Otimista nós somos "otimistas": assumimos que a internet vai
 *   funcionar e atualizamos a tela INSTANTANEAMENTE no mesmo milissegundo do toque!
 * 
 * O fluxo de 4 passos do TanStack Query:
 * 1. `onMutate`: Pausa buscas em andamento, tira uma "foto" (snapshot) do estado atual
 *    e atualiza a tela na hora com o novo valor.
 * 2. `mutationFn`: Envia a requisição real para o servidor em segundo plano.
 * 3. `onError`: Se a internet cair ou der erro 500, fazemos o **Rollback** (restauramos
 *    a foto anterior, desfazendo a alteração).
 * 4. `onSettled`: Quando tudo termina (com sucesso ou erro), sincronizamos com os dados
 *    finais oficiais do servidor.
 */

// Estrutura de um carrinho vazio padrão
const EMPTY_CART: Cart = { id: 'optimistic', items: [], total: 0, itemCount: 0 };

/**
 * ============================================================================
 * FUNÇÃO: recomputeCart (Recalcular os Totais do Carrinho)
 * ============================================================================
 * 
 * Quando adicionamos, alteramos ou removemos produtos no modo otimista, nós
 * temos a lista atualizada de itens, mas precisamos recalcular:
 * 1. O valor financeiro total (R$)
 * 2. A quantidade total de itens (ex: 2 camisetas + 1 meia = 3 itens)
 * 
 * COMO FUNCIONA O .reduce()?
 * O `.reduce()` serve para "reduzir" (acumular) um array inteiro em um ÚNICO valor final.
 * 
 * Ele recebe dois parâmetros principais:
 * 1. Uma função com `(acumulador, itemAtual)`
 * 2. O valor inicial do acumulador (aqui passamos `, 0`)
 * 
 * Exemplo prático do `total`:
 * Carrinho com 2 itens: Camiseta (R$ 50) e Tênis (R$ 200)
 * - Começa em: `sum = 0`
 * - 1º item: `sum = 0 + 50 = 50`
 * - 2º item: `sum = 50 + 200 = 250`
 * - Resultado final retornado: 250
 */
function recomputeCart(items: CartItem[]): Cart {
    // Soma o subtotal de todos os itens do carrinho (R$)
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    // Soma a quantidade de unidades de todos os itens (1 + 2 + ...)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return { id: EMPTY_CART.id, items, total, itemCount };
}

/**
 * Helper reutilizável para aplicar Atualização Otimista no Carrinho.
 * Elimina toda a repetição de código das mutations!
 */
async function updateCartOptimistically(
    queryClient: QueryClient,
    updater: (currentItems: CartItem[]) => CartItem[],
) {
    const key = queryKeys.cart.all;

    // 1. Cancela qualquer busca do carrinho que esteja em andamento (para evitar conflito de dados)
    await queryClient.cancelQueries({ queryKey: key });

    // 2. Tira uma foto (snapshot) do carrinho como ele está agora
    const previous = queryClient.getQueryData<Cart>(key);
    const base = previous ?? EMPTY_CART;

    // 3. Aplica a alteração nos itens e calcula os novos totais
    const updatedItems = updater(base.items);
    queryClient.setQueryData<Cart>(key, recomputeCart(updatedItems));

    // 4. Retorna a foto anterior para ser usada no rollback se a API falhar
    return { previous };
}

/**
 * Hook `useCartMutations`
 * 
 * Centraliza todas as ações de escrita (Mutations) do carrinho:
 * - `addItem`: Adiciona um novo produto ou incrementa a quantidade.
 * - `setQuantity`: Altera o número de unidades (se 0, remove).
 * - `removeItem`: Remove o item completamente do carrinho.
 */
export function useCartMutations() {
    const queryClient = useQueryClient();
    const key = queryKeys.cart.all;

    // Se der erro na API, restaura o carrinho anterior (Rollback)
    const rollbackOnError = (_err: unknown, _vars: unknown, ctx?: { previous?: Cart }) => {
        if (ctx?.previous) {
            queryClient.setQueryData(key, ctx.previous);
        }
    };

    /**
     * ==========================================================================
     * FUNÇÃO: settle / onSettled (Sincronização Final com o Servidor)
     * ==========================================================================
     * 
     * `queryClient.invalidateQueries({ queryKey: key })`
     * 
     * O que `invalidateQueries` faz?
     * 1. Marca os dados do carrinho em cache como "desatualizados / obsoletos" (stale).
     * 2. Faz uma nova chamada GET à API em segundo plano para trazer a versão OFICIAL do backend.
     * 
     * Por que isso é necessário se já fizemos o cálculo otimista na tela?
     * Porque o servidor pode ter regras que o app não sabe na hora:
     * - Descontos de cupom aplicados pelo backend.
     * - Frete calculado.
     * - Limite de estoque que estourou.
     * Assim garantimos que o app sempre termina 100% sincronizado com o banco de dados real.
     */
    const settle = () => {
        queryClient.invalidateQueries({ queryKey: key });
    };

    // --------------------------------------------------------------------------
    // 1. MUTATION: Adicionar Item ao Carrinho
    // --------------------------------------------------------------------------
    const addItem = useMutation({
        mutationFn: (v: { variantId: string; quantity: number; name: string; unitPrice: number }) =>
            addCartItem(v.variantId, v.quantity),

        onMutate: (v) =>
            updateCartOptimistically(queryClient, (items) => {
                // .find(): Procura se o produto que estamos adicionando já está dentro da lista de itens
                const existing = items.find((it) => it.variantId === v.variantId);

                // Se o item já existe no carrinho, nós só alteramos a quantidade dele
                if (existing) {
                    const newQty = existing.quantity + v.quantity;
                    // .map(): Percorre a lista e devolve uma nova lista.
                    // Quando encontra o item correspondente, atualiza a quantidade e o subtotal.
                    return items.map((it) =>
                        it.variantId === v.variantId
                            ? { ...it, quantity: newQty, subtotal: it.unitPrice * newQty }
                            : it,
                    );
                }

                // Se é um item que ainda não estava no carrinho, criamos um novo CartItem e colocamos no final
                const newItem: CartItem = {
                    variantId: v.variantId,
                    name: v.name,
                    sku: '',
                    unitPrice: v.unitPrice,
                    quantity: v.quantity,
                    subtotal: v.unitPrice * v.quantity,
                };
                // [...items, newItem]: Pega todos os itens antigos e adiciona o novo no final do array
                return [...items, newItem];
            }),

        onError: rollbackOnError,
        onSettled: settle,
    });

    // --------------------------------------------------------------------------
    // 2. MUTATION: Atualizar Quantidade (+ / - ou digitado)
    // --------------------------------------------------------------------------
    const setQuantity = useMutation({
        mutationFn: (v: { variantId: string; quantity: number }) =>
            updateCartItem(v.variantId, v.quantity),

        onMutate: (v) =>
            updateCartOptimistically(queryClient, (items) =>
                items
                    // 1. .map(): Altera a quantidade e o subtotal do item modificado
                    .map((it) =>
                        it.variantId === v.variantId
                            ? { ...it, quantity: v.quantity, subtotal: it.unitPrice * v.quantity }
                            : it,
                    )
                    // 2. .filter(): Se a quantidade ficou 0 ou negativa (ex: usuário clicou "-" até zerar),
                    // o filter remove o produto da lista!
                    .filter((it) => it.quantity > 0),
            ),

        onError: rollbackOnError,
        onSettled: settle,
    });

    // --------------------------------------------------------------------------
    // 3. MUTATION: Remover Item
    // --------------------------------------------------------------------------
    const removeItem = useMutation({
        mutationFn: (variantId: string) => removeCartItem(variantId),

        onMutate: (variantId) =>
            updateCartOptimistically(queryClient, (items) =>
                /**
                 * COMO FUNCIONA O .filter() AQUI?
                 * 
                 * `items.filter((it) => it.variantId !== variantId)`
                 * 
                 * O método `.filter()` percorre cada item da lista e faz a seguinte pergunta:
                 * "O ID deste item é DIFERENTE (!==) do ID que eu mandei excluir?"
                 * 
                 * - Se for DIFERENTE (true) -> O item CONTINUA na lista.
                 * - Se for IGUAL (false)     -> O item é EXCLUÍDO da nova lista.
                 * 
                 * Exemplo Prático:
                 * Lista atual: [{ variantId: 'camisa' }, { variantId: 'tenis' }, { variantId: 'meia' }]
                 * Chamamos: removeItem('tenis')
                 * 1. 'camisa' !== 'tenis' -> Verdadeiro -> Fica!
                 * 2. 'tenis'  !== 'tenis' -> Falso      -> SAI fora!
                 * 3. 'meia'   !== 'tenis' -> Verdadeiro -> Fica!
                 * Resultado final: [{ variantId: 'camisa' }, { variantId: 'meia' }]
                 */
                items.filter((it) => it.variantId !== variantId),
            ),

        onError: rollbackOnError,
        onSettled: settle,
    });

    return { addItem, setQuantity, removeItem };
}
