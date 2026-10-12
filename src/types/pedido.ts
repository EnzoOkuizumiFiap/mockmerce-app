/**
 * ---------------------------------------------------------------------------
 * TIPOS DE CARRINHO E PEDIDO
 * ---------------------------------------------------------------------------
 * Este bloco NAO e o conteudo da aula — ele ja vem pronto, porque "so quem
 * comprou pode avaliar": sem um pedido pago, nao ha o que avaliar.
 *
 * Vale uma leitura rapida mesmo assim, por causa de duas armadilhas:
 *
 *   1. Quem vai para o carrinho e a VARIANTE (`variantId`), nunca o produto.
 *      Um produto "Camiseta" nao tem preco nem estoque; quem tem e a
 *      "Camiseta Preta P". Em produto SIMPLE existe uma variante padrao.
 *   2. No item do PEDIDO o nome vem em `productName`; no item do CARRINHO
 *      vem em `name`. Sao telas diferentes lendo campos diferentes.
 * ---------------------------------------------------------------------------
 */

export type ItemCarrinho = {
  variantId: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type Carrinho = {
  id: string;
  items: ItemCarrinho[];
  total: number;
  itemCount: number;
};

export type ItemPedido = {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type StatusPedido =
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'FULFILLED'
  | 'REFUNDED';

export type Pedido = {
  id: string;
  status: StatusPedido;
  total: number;
  items: ItemPedido[];
  payment: { status: string; method: string; amount: number } | null;

  /**
   * Preenchido quando o pedido e RETIRADA; null quando e entrega.
   * E o unico campo do pedido que o conteudo desta aula acrescenta.
   */
  pickup: {
    id: string;
    name: string;
    hours: string | null;
    coordinate: { latitude: number; longitude: number };
    address: {
      cep: string | null; street: string | null; number: string | null;
      district: string | null; city: string | null; state: string | null;
    };
  } | null;

  createdAt: string;
};

export type MetodoPagamento = 'PIX' | 'CREDIT_CARD' | 'BOLETO';
