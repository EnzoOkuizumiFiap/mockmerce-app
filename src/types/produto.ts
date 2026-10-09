/**
 * ---------------------------------------------------------------------------
 * TIPOS DO CATALOGO
 * ---------------------------------------------------------------------------
 * REPARE QUE SAO DOIS TIPOS, E NAO UM.
 *
 *   GET /products      -> resumo  (o que cabe num card)
 *   GET /products/:id  -> detalhe (tudo, inclusive variantes e descricao)
 *
 * A tentacao e criar um `Produto` gigante com tudo opcional e usar nos dois
 * lugares. O preco disso e que a tela de detalhe passa a acessar
 * `produto.description?` sem saber se aquilo esta preenchido — e o TypeScript
 * para de ajudar justamente onde ele mais ajudaria.
 *
 * Dois tipos, dois contratos honestos.
 * ---------------------------------------------------------------------------
 */

/** Item da listagem. E ESTE que guardamos nos favoritos. */
export type ProdutoResumo = {
  id: string;
  name: string;
  slug: string;
  type: 'SIMPLE' | 'VARIABLE';
  state: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  brand: string | null;
  categoryId: string | null;

  /**
   * Faixa de preco das variantes. Num produto SIMPLE os dois sao iguais;
   * num VARIABLE ("a partir de R$ X") eles diferem.
   */
  priceFrom: number;
  priceTo: number;

  /** Soma do estoque de todas as variantes. */
  stock: number;

  /** URL da imagem principal, ou null se o produto nao tem imagem. */
  image: string | null;

  variantsCount: number;

  /**
   * Nota media e total de avaliacoes VISIVEIS.
   *
   * Vem junto com o produto de proposito: desenhar as estrelinhas do card nao
   * deve custar uma requisicao por produto da lista.
   */
  rating: { average: number; count: number };
};

/** Envelope paginado de GET /products. */
export type RespostaListaProdutos = {
  data: ProdutoResumo[];
  page: number;
  pageSize: number;
  total: number;
};

export type Imagem = {
  id: string;
  url: string;
  position: number;
  isPrimary: boolean;
};

export type Variante = {
  id: string;
  sku: string | null;
  price: number;
  stock: number;
  isDefault: boolean;
  active: boolean;
  /** Rotulo humano da combinacao de opcoes: "Preto / P". Null em SIMPLE. */
  label: string | null;
};

/** Resposta de GET /products/:id. */
export type ProdutoDetalhe = {
  id: string;
  name: string;
  slug: string;
  type: 'SIMPLE' | 'VARIABLE';
  state: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  description: string | null;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  tags: string[];
  variants: Variante[];
  images: Imagem[];

  /** No detalhe vem tambem a distribuicao por estrela (as barrinhas). */
  rating: {
    average: number;
    count: number;
    distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  };
};
