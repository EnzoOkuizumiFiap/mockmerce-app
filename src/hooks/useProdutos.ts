/**
 * ---------------------------------------------------------------------------
 * HOOKS DE PRODUTOS
 * ---------------------------------------------------------------------------
 * Cada hook e uma linha de useQuery no lugar dos ~25 de useState + useEffect
 * + try/catch que a mao exigiria — e de brinde vem cache, revalidacao e
 * deduplicacao de requisicoes.
 * ---------------------------------------------------------------------------
 */

import { useQuery } from '@tanstack/react-query';

import {
  buscarProdutoPorId,
  buscarProdutosPorTermo,
  listarProdutos,
} from '../services/produtosService';

/**
 * Chaves de cache centralizadas, pelo mesmo motivo das chaves de
 * armazenamento: o editor autocompleta e o TypeScript confere.
 */
export const chaves = {
  todos: ['produtos'] as const,
  lista: (pageSize: number) => ['produtos', 'lista', pageSize] as const,
  detalhe: (id: string) => ['produtos', 'detalhe', id] as const,
  busca: (termo: string) => ['produtos', 'busca', termo] as const,
};

export function useProdutos(pageSize = 20) {
  return useQuery({
    queryKey: chaves.lista(pageSize),
    queryFn: () => listarProdutos(pageSize),
  });
}

/**
 * O `id` PRECISA estar na chave.
 *
 * Com uma chave fixa, abrir o produto A e depois o produto B devolveria o
 * produto A do cache — sem erro nenhum no console. E o tipo de bug que passa
 * despercebido no teste com um produto so.
 */
export function useProduto(id: string) {
  return useQuery({
    queryKey: chaves.detalhe(id),
    queryFn: () => buscarProdutoPorId(id),
  });
}

/**
 * Busca por termo.
 *
 * O `enabled` e a peca-chave: com o campo vazio ou com menos de 2 letras, a
 * query nem roda. Sem ele, o app faria uma busca por string vazia toda vez
 * que a tela montasse.
 */
export function useBuscaProdutos(termo: string) {
  return useQuery({
    queryKey: chaves.busca(termo),
    queryFn: () => buscarProdutosPorTermo(termo),
    enabled: termo.trim().length >= 2,
  });
}
