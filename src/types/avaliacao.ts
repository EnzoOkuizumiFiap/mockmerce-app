/**
 * ---------------------------------------------------------------------------
 * TIPOS DE AVALIACAO
 * ---------------------------------------------------------------------------
 * A API devolve a nota de duas formas, e vale entender a diferenca antes de
 * escrever a tela:
 *
 *   GET /products/:id          -> `rating`: media + contagem + distribuicao
 *   GET /products/:id/reviews  -> as avaliacoes uma a uma, + o mesmo `summary`
 *
 * Ou seja: para desenhar as estrelinhas do card VOCE NAO PRECISA baixar as
 * avaliacoes. A media ja vem junto com o produto. Baixar a lista inteira so
 * para calcular uma media e o erro mais comum aqui.
 * ---------------------------------------------------------------------------
 */

/** Media, total e quantas notas de cada estrela (as barrinhas do resumo). */
export type ResumoNotas = {
  average: number;
  count: number;
  /** { "5": 8, "4": 2, ... } — a chave e a nota, o valor e quantas vezes. */
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
};

export type FotoAvaliacao = {
  id: string;
  url: string;
  mediaId: string | null;
};

export type Avaliacao = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  images: FotoAvaliacao[];

  /** A API devolve "Maria S.", nunca o nome completo de quem comprou. */
  author: { name: string; id: string | null };

  /** Ligada a um pedido pago — e o selo de "compra verificada". */
  verifiedPurchase: boolean;

  /** Ocultada pela loja. So aparece assim na lista do proprio autor. */
  hidden: boolean;

  /** true na avaliacao de quem esta logado agora. */
  isMine: boolean;

  createdAt: string;
  updatedAt: string;
};

/** Envelope de GET /products/:id/reviews — a lista vem com o resumo junto. */
export type RespostaAvaliacoes = {
  data: Avaliacao[];
  page: number;
  pageSize: number;
  total: number;
  summary: ResumoNotas;
};

/**
 * Resposta de GET /products/:id/reviews/can-review.
 *
 * E ELA que decide o que a tela mostra. Chamar isto ANTES de abrir o
 * formulario evita o pior fluxo possivel: o cliente escreve um textao, aperta
 * enviar e so entao descobre que nao podia avaliar.
 */
export type PodeAvaliar = {
  canReview: boolean;
  reason: 'ALREADY_REVIEWED' | 'NOT_PURCHASED' | null;
  message: string;
  /** Quando ja avaliou, vem o id da avaliacao dele (para editar). */
  reviewId: string | null;
};

/** O que a tela envia ao criar ou editar uma avaliacao. */
export type NovaAvaliacao = {
  rating: number;
  title?: string | null;
  comment?: string;
  /** Ids de fotos ja enviadas em POST /uploads (maximo 5). */
  mediaIds?: string[];
};

/** Resposta de POST /uploads — o arquivo ja esta no S3 quando isto chega. */
export type MidiaEnviada = {
  id: string;
  kind: 'IMAGE' | 'VIDEO';
  url: string;
  mimeType: string;
  sizeBytes: number;
};
