import { http } from './http';
import type { Paginated, Product, ProductSummary } from '@/types/api';

/**
 * ============================================================================
 * SERVIÇOS DE PRODUTOS (Products API Services)
 * ============================================================================
 * 
 * Camada de comunicação HTTP responsável por consultar o catálogo de produtos.
 */

/**
 * Parâmetros aceitos para filtrar e paginar a listagem de produtos.
 */
export interface ListProductsParams {
  search?: string;     // Termo de busca digitado pelo usuário (ex: "camisa")
  categoryId?: string; // ID da categoria para filtrar
  page?: number;       // Número da página atual (ex: 1, 2, 3...)
  pageSize?: number;   // Quantidade de produtos por página (ex: 10, 20)
}

/**
 * 1. Listar Produtos com Filtros e Paginação
 * 
 * Realiza uma requisição GET para `/products`.
 * O Axios pega o objeto `{ params }` e converte automaticamente em Query String na URL:
 * Exemplo: `GET /products?search=tenis&page=1&pageSize=10`
 * 
 * @param params - Filtros opcionais de pesquisa e paginação
 * @returns Promise<Paginated<ProductSummary>> - Retorna o objeto paginado com o array de
 *          resumos de produtos (`data`), número da página e total de itens no banco.
 */
export async function listProducts(params: ListProductsParams = {}): Promise<Paginated<ProductSummary>> {
  const { data } = await http.get<Paginated<ProductSummary>>('/products', { params });
  return data;
}

/**
 * 2. Buscar Detalhes Completos de um Único Produto
 * 
 * Realiza uma requisição GET para `/products/:id`.
 * Diferente do `ProductSummary` (que traz dados resumidos para os cards da vitrine),
 * o `Product` completo traz:
 * - Descrição detalhada do produto;
 * - Todas as imagens da galeria;
 * - Lista de todas as variantes disponíveis (com estoque individual, SKU e opções).
 * 
 * @param id - ID único do produto (ex: "prod_123")
 * @returns Promise<Product> - Objeto detalhado do produto
 */
export async function getProduct(id: string): Promise<Product> {
  const { data } = await http.get<Product>(`/products/${id}`);
  return data;
}
