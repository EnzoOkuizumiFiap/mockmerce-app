/**
 * ============================================================================
 * CONTRATOS DE DADOS DA API (TypeScript Interfaces & Types)
 * ============================================================================
 * 
 * Tipos da API do e-commerce da turma.
 * Espelham EXATAMENTE o JSON que o backend devolve — confira no Swagger (/docs).
 *
 * 💡 CONCEITO-CHAVE: A UNIDADE VENDÁVEL É A VARIANTE.
 * - Produto SIMPLE  -> tem 1 variante (default).
 * - Produto VARIABLE -> tem N variantes (ex.: Cor x Tamanho).
 * - Analogia: O Produto é o "conceito" no catálogo (ex: Camiseta Oficial),
 *   mas a Variante é a "peça física na prateleira" (ex: Camiseta Azul G, com seu próprio SKU e estoque).
 * - Por isso, carrinho e pedido operam SEMPRE sobre `variantId`, NUNCA sobre o id do produto.
 */

// ----------------------------------------------------------------------------
// 1. PRODUTOS & CATÁLOGO (CATALOG)
// ----------------------------------------------------------------------------

/**
 * Define a estrutura de variação do produto:
 * - 'SIMPLE': Produto único sem variações selecionáveis (ex: Livro, Adesivo). Possui apenas 1 variante padrão.
 * - 'VARIABLE': Produto com grade de opções (ex: Tênis com numerações 39, 40, 41 ou Roupas Cor x Tamanho).
 */
export type ProductType = 'SIMPLE' | 'VARIABLE';

/**
 * Estado do ciclo de vida do produto no backend:
 * - 'DRAFT': Rascunho (visível apenas para administradores no painel).
 * - 'PUBLISHED': Publicado e disponível para visualização e compra na loja.
 * - 'HIDDEN': Oculto temporariamente (ex: fora de catálogo ou desativado).
 */
export type ProductState = 'DRAFT' | 'PUBLISHED' | 'HIDDEN';

/**
 * Envelope Genérico de Paginação (`Paginated<T>`).
 * 
 * Por que usamos Generics (`<T>`)?
 * - Analogia: É uma "caixa de transporte padronizada com etiqueta de controle".
 * - Em vez de criar `PaginatedProducts`, `PaginatedOrders`, etc., usamos `Paginated<ProductSummary>`,
 *   garantindo reuso e tipagem segura para qualquer lista vinda da API.
 */
export interface Paginated<T> {
  data: T[];         // Array contendo os registros da página atual
  page: number;      // Número da página atual requisitada (1-indexed: 1, 2, 3...)
  pageSize: number;  // Limite máximo de itens por página (ex: 10, 20)
  total: number;     // Quantidade total absoluta de registros encontrados no banco
}

/**
 * Item retornado na LISTAGEM (GET /products) — é um resumo leve.
 * 
 * Por que ter um Summary separado de Product?
 * - Performance mobile: Evita trafegar descrições longas em HTML, listas completas de tags
 *   e todas as variantes quando estamos apenas renderizando uma grade/FlatList de produtos.
 */
export interface ProductSummary {
  id: string;               // Identificador único do produto pai
  name: string;             // Nome comercial do produto
  slug: string;             // Identificador amigável para URLs/rotas (ex: "tenis-corrida-pro")
  type: ProductType;        // 'SIMPLE' ou 'VARIABLE'
  state: ProductState;      // 'DRAFT', 'PUBLISHED' ou 'HIDDEN'
  brand: string | null;     // Marca/Fabricante (ou null se não informada)
  categoryId: string | null;// Categoria vinculada
  priceFrom: number;        // Menor preço encontrado entre as variantes (ex: R$ 89,90) - "A partir de"
  priceTo: number;          // Maior preço encontrado entre as variantes (ex: R$ 129,90)
  stock: number;            // Soma total do estoque de todas as variantes combinadas
  image: string | null;     // URL da imagem primária/capa do produto
  variantsCount: number;    // Quantidade total de opções/variantes disponíveis
}

/**
 * Imagem da galeria de fotos do produto.
 */
export interface ProductImage {
  id: string;          // ID único da imagem no armazenamento/CDN
  url: string;         // URL pública para carregar no componente <Image />
  position: number;    // Ordem de ordenação no carrossel de fotos (0, 1, 2...)
  isPrimary: boolean;  // Se true, é a foto principal exibida na vitrine e capa
}

/**
 * Variante do Produto: Onde vivem PREÇO e ESTOQUE reais.
 * 
 * ⚠️ ATENÇÃO: `ProductVariant.id` é o `variantId` exigido pelo carrinho e pelo checkout!
 */
export interface ProductVariant {
  id: string;             // ID da variante (o `variantId` utilizado no carrinho!)
  sku: string;            // Stock Keeping Unit - Código de identificação logística único
  barcode: string | null; // Código de barras EAN/UPC para leitores
  price: number;          // Preço de venda praticado para esta variante específica (R$)
  stock: number;          // Saldo de estoque físico disponível para compra imediata
  minStock: number;       // Ponto de ressuprimento/alerta de estoque baixo
  isDefault: boolean;     // Se true, é a variante pré-selecionada ao abrir a tela de detalhes
  active: boolean;        // Se false, a variante está desativada e não pode ser vendida
  label: string | null;   // Rótulo textual amigável (ex.: "Preto / P", "110V", "32GB")
  options: {              // Atributos que compõem esta variação (ex: Cor: Preto, Tamanho: P)
    option: string;       // Nome do atributo (ex: "Cor", "Tamanho")
    value: string;        // Valor escolhido (ex: "Preto", "P")
  }[];
  images: ProductImage[]; // Fotos específicas desta variante (ex: fotos apenas da camiseta azul)
}

/**
 * Produto DETALHADO (GET /products/:id).
 * 
 * Payload completo retornado ao abrir a tela `ProductDetailScreen`.
 * Contém a árvore completa de opções, variantes e galeria de imagens.
 */
export interface Product {
  id: string;                                                          // ID único do produto
  name: string;                                                        // Nome completo
  slug: string;                                                        // Slug de identificação
  type: ProductType;                                                   // Tipo ('SIMPLE' | 'VARIABLE')
  state: ProductState;                                                 // Estado de publicação
  description: string | null;                                          // Descrição detalhada do produto
  category: { id: string; name: string } | null;                       // Categoria associada
  brand: { id: string; name: string } | null;                          // Marca associada
  tags: string[];                                                      // Tags de busca e filtro (ex: ["esporte", "verão"])
  options: { id: string; name: string; values: { id: string; value: string }[] }[]; // Grade de opções selecionáveis
  variants: ProductVariant[];                                          // Todas as variantes com seus preços e estoques
  images: ProductImage[];                                              // Todas as imagens do catálogo do produto
  createdAt: string;                                                   // Data ISO de criação no sistema
}

// ----------------------------------------------------------------------------
// 2. CARRINHO DE COMPRAS (CART)
// ----------------------------------------------------------------------------

/**
 * Item individual dentro do carrinho de compras (GET /cart).
 * 
 * 💡 Note: Usa `variantId`, NÃO `productId`.
 * Isso ocorre porque o comprador compra uma combinação específica de tamanho/cor/voltagem.
 */
export interface CartItem {
  variantId: string; // Identificador da variante adquirida
  name: string;      // Nome montado do produto + variação (ex: "Camiseta Silk (Preto / P)")
  sku: string;       // SKU da variante
  unitPrice: number; // Preço unitário travado no momento da inclusão (R$)
  quantity: number;  // Quantidade de unidades no carrinho
  subtotal: number;  // Valor calculado: unitPrice * quantity (R$)
}

/**
 * Estado completo do Carrinho do comprador autenticado.
 */
export interface Cart {
  id: string;          // Identificador do carrinho na sessão do backend
  items: CartItem[];   // Lista de itens contidos no carrinho
  total: number;       // Somatório monetário de todos os itens (R$)
  itemCount: number;   // Somatório da quantidade total de peças (ex: 2 camisas + 1 meia = 3)
}

// ----------------------------------------------------------------------------
// 3. CLIENTE & AUTENTICAÇÃO (AUTH & CUSTOMER)
// ----------------------------------------------------------------------------

/**
 * Dados cadastrais do cliente/comprador.
 */
export interface Customer {
  id: string;    // ID único do cliente
  name: string;  // Nome completo do usuário
  email: string; // E-mail cadastrado (usado para login)
}

/**
 * Resposta de autenticação retornada em Login, Registro ou Refresh de Sessão.
 */
export interface AuthResponse {
  token: string;       // Token JWT que deve ser enviado no cabeçalho `Authorization: Bearer <token>`
  customer: Customer;  // Perfil básico do cliente autenticado
}

// ----------------------------------------------------------------------------
// 4. PEDIDOS & PAGAMENTOS (SEMANA 3 - ORDERS & PAYMENTS)
// ----------------------------------------------------------------------------

/**
 * Formas de pagamento aceitas pela API do backend.
 */
export type PaymentMethod = 'CREDIT_CARD' | 'PIX' | 'BOLETO';

/**
 * Estados da máquina de estados do ciclo de vida de um pedido:
 * 
 *   PENDING ──► PAID ──► SHIPPED ──► DELIVERED
 *      │
 *      ├──► PAYMENT_FAILED
 *      └──► CANCELLED
 */
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | string; // Mantém compatibilidade aberta caso o backend introduza novos status

/**
 * Item gravado no histórico do Pedido.
 * 
 * 💡 Diferença para o CartItem:
 * - No carrinho o nome vinha em `name`.
 * - No pedido o backend separa em `productName` e `variantName` para manter
 *   o histórico imutável mesmo se o produto for editado posteriormente.
 */
export interface OrderItem {
  variantId: string;          // ID da variante vendida
  productName: string;        // Nome original do produto no momento da compra
  variantName: string | null; // Nome da variante (ex: "Preto / G") ou null para produtos SIMPLE
  sku: string;                // SKU registrado na transação
  unitPrice: number;          // Preço cobrado por unidade (R$)
  quantity: number;           // Quantidade adquirida
  subtotal: number;           // Preço total do item: unitPrice * quantity (R$)
}

/**
 * Dados do pagamento processado ou registrado para o pedido.
 */
export interface Payment {
  status: string;        // Status da transação (ex: 'APPROVED', 'DECLINED', 'PENDING')
  method: string;        // Método utilizado (ex: 'PIX', 'CREDIT_CARD', 'BOLETO')
  amount: number;        // Valor total liquidado na cobrança (R$)
  transactionId: string; // Código/ID da transação no gateway/adquirente
}

/**
 * Tipo alternativo para compatibilidade de nomenclaturas de pagamento.
 */
export type OrderPayment = Payment;

/**
 * Pedido completo retornado por GET /orders ou GET /orders/:id.
 * 
 * O campo `status` reflete a fase atual na máquina de estados do pedido:
 * `PENDING` -> `PAID` / `PAYMENT_FAILED` / `CANCELLED` / `SHIPPED` / `DELIVERED`
 */
export interface Order {
  id: string;               // ID único do pedido (ex: "ord_123456")
  status: OrderStatus;      // Status atual na máquina de estados
  total: number;            // Valor total do pedido (R$)
  items: OrderItem[];       // Lista de itens congelados no momento do checkout
  payment: Payment | null;  // Informações de pagamento (ou null se ainda não pago/processado)
  createdAt: string;        // Data ISO de emissão do pedido
}

/**
 * Registro de auditoria/evento na linha do tempo do pedido (GET /orders/:id/timeline).
 * 
 * Analogia: É o "diário de bordo" do pacote, registrando cada carimbo de transição de status.
 */
export interface TimelineEntry {
  from: string | null; // Status anterior (ou null se for a criação inicial)
  to: string;          // Novo status após a transição
  actor: string;       // Quem disparou a ação (ex: "customer", "system", "admin", "gateway")
  rm: string | null;   // Registro/Motivo (ou identificador interno)
  note: string | null; // Observação explicativa (ex: "Pagamento aprovado via PIX", "Estoque reservado")
  at: string;          // Data e hora ISO do evento
}

/**
 * Alias de compatibilidade para TimelineEntry.
 */
export type OrderTimelineEvent = TimelineEntry;

/**
 * Resposta da rota de checkout (POST /orders/checkout).
 */
export interface CheckoutResponse {
  order: Order; // Pedido recém-gerado com status inicial 'PENDING'
}

/**
 * Parâmetros enviados para a simulação/processamento de pagamento (POST /orders/:id/pay).
 */
export interface PayOrderInput {
  method: PaymentMethod | string;      // 'CREDIT_CARD' | 'PIX' | 'BOLETO'
  simulate?: 'approve' | 'decline';     // Modo de simulação para testes
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

// ----------------------------------------------------------------------------
// 5. TRATAMENTO DE ERROS PADRONIZADO (ERROR HANDLING)
// ----------------------------------------------------------------------------

/**
 * Classe de Erro Normalizado que a camada de serviços HTTP SEMPRE lança.
 * 
 * Por que estender `Error` nativo?
 * - Permite capturar com `try/catch` ou pelo `onError` do TanStack Query.
 * - Garante acesso seguro a:
 *   1. `error.code`: Código de negócio do backend (ex: 'OUT_OF_STOCK', 'INVALID_CREDENTIALS').
 *   2. `error.message`: Mensagem legível pronta para exibição em `Toast` ou `<Text>`.
 *   3. `error.status`: Código HTTP da resposta (ex: 400, 401, 404, 500).
 * 
 * Analogia: O `ApiError` funciona como um "crachá padronizado" de problemas,
 * garantindo que qualquer tela saiba exatamente como ler a causa do erro.
 */
export class ApiError extends Error {
  constructor(
    public code: string,    // Código interno da regra de negócio da API
    message: string,        // Mensagem explicativa do erro
    public status: number,  // Status code HTTP (ex: 401 = não autorizado, 422 = validação)
  ) {
    super(message);
    this.name = 'ApiError'; // Sobrescreve o nome da classe para identificação em logs
  }
}