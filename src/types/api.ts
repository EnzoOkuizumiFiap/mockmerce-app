/**
 * ============================================================================
 * CONTRATOS DE DADOS DA API (TypeScript Interfaces & Types)
 * ============================================================================
 * 
 * Este arquivo define a tipagem estrita de todas as respostas e entidades
 * que trafegam entre o backend e o aplicativo mobile.
 */

// ----------------------------------------------------------------------------
// 1. PRODUTOS & CATÁLOGO
// ----------------------------------------------------------------------------

/**
 * Tipo de produto:
 * - 'SIMPLE': Produto único sem variações (ex: Livro, Cabo).
 * - 'VARIABLE': Produto com variações de tamanho, cor ou voltagem (ex: Camiseta P/M/G).
 */
export type ProductType = 'SIMPLE' | 'VARIABLE';

/**
 * Estado de publicação do produto no backend.
 */
export type ProductState = 'DRAFT' | 'PUBLISHED' | 'HIDDEN';

/**
 * Estrutura Genérica de Paginação (`Paginated<T>`).
 * Reutilizável para qualquer recurso que venha paginado da API (ex: produtos, pedidos).
 */
export interface Paginated<T> {
  data: T[];         // O array real de itens da página atual
  page: number;      // Número da página atual (1, 2, 3...)
  pageSize: number;  // Quantidade de itens por página
  total: number;     // Contagem total de itens existentes no banco de dados
}

/**
 * Resumo do Produto (usado nos cards da vitrine / `ProductsScreen`).
 * Contém apenas os dados essenciais para garantir uma listagem rápida e leve.
 */
export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  state: ProductState;
  brand: string | null;
  categoryId: string | null;
  priceFrom: number;      // Menor preço entre todas as variantes (ex: R$ 50,00)
  priceTo: number;        // Maior preço entre todas as variantes (ex: R$ 80,00)
  stock: number;          // Somatório de estoque de todas as variantes
  image: string | null;   // URL da imagem principal de capa
  variantsCount: number;  // Número de variações disponíveis
}

/**
 * Imagem da galeria de um produto.
 */
export interface ProductImage {
  id: string;
  url: string;
  position: number;       // Ordem de exibição no carrossel de fotos
  isPrimary: boolean;     // Se true, é a foto principal de capa
}

/**
 * Variante individual de um produto (ex: Camiseta Azul tamanho G).
 */
export interface ProductVariant {
  id: string;
  sku: string;            // Código de estoque único (Stock Keeping Unit)
  barcode: string | null; // Código de barras
  price: number;          // Preço específico desta variação
  stock: number;          // Quantidade disponível desta variação específica
  minStock: number;
  isDefault: boolean;     // Se true, vem pré-selecionada ao abrir a tela
  active: boolean;
  label: string | null;   // Nome amigável (ex: "G", "Azul / G", "110V")
  options: { option: string; value: string }[]; // Atributos (ex: [{ option: "Tamanho", value: "G" }])
  images: ProductImage[];
}

/**
 * Produto Completo e Detalhado (usado na tela `ProductDetailScreen`).
 */
export interface Product {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  state: ProductState;
  description: string | null;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  tags: string[];
  options: { id: string; name: string; values: { id: string; value: string }[] }[];
  variants: ProductVariant[]; // Matriz completa de variações com estoques e preços
  images: ProductImage[];     // Todas as fotos da galeria
  createdAt: string;
}

// ----------------------------------------------------------------------------
// 2. CARRINHO DE COMPRAS
// ----------------------------------------------------------------------------

/**
 * Item individual armazenado dentro do carrinho.
 */
export interface CartItem {
  variantId: string; // ID da variante adicionada
  name: string;      // Nome do produto (com label da variante se houver)
  sku: string;
  unitPrice: number; // Preço unitário no momento da adição (R$)
  quantity: number;  // Quantidade de unidades no carrinho
  subtotal: number;  // unitPrice * quantity (R$)
}

/**
 * Carrinho de Compras completo do comprador.
 */
export interface Cart {
  id: string;
  items: CartItem[];  // Lista de itens no carrinho
  total: number;      // Valor total acumulado do pedido (R$)
  itemCount: number;  // Quantidade total somada de peças no carrinho
}

// ----------------------------------------------------------------------------
// 3. CLIENTE & AUTENTICAÇÃO
// ----------------------------------------------------------------------------

/**
 * Dados cadastrais do cliente/comprador autenticado.
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
}

/**
 * Resposta padrão retornada após Login, Registro ou Redefinição de Senha.
 */
export interface AuthResponse {
  token: string;       // Token JWT que autentica as próximas requisições
  customer: Customer;  // Dados do cliente logado
}

// ----------------------------------------------------------------------------
// 4. CLASSE DE ERRO PADRONIZADA
// ----------------------------------------------------------------------------

/**
 * Classe customizada de erro que estende a classe nativa `Error` do JavaScript.
 * 
 * Por que criamos ela?
 * Para que todas as telas possam capturar erros com segurança de tipos,
 * acessando diretamente:
 * - `error.code` (código de erro de negócio, ex: 'INVALID_CREDENTIALS', 'NETWORK_ERROR')
 * - `error.message` (mensagem legível para o usuário)
 * - `error.status` (código HTTP retornado, ex: 400, 401, 404, 500)
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
