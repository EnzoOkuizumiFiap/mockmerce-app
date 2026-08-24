/**
 * ============================================================================
 * UTILITÁRIOS DE FORMATAÇÃO DE STATUS DE PEDIDOS (lib/orders.ts)
 * ============================================================================
 * 
 * Centraliza as regras de apresentação visual dos status de pedidos para a UI.
 * 
 * 💡 Por que isolar essas funções em um arquivo utilitário?
 * 1. Princípio DRY (Don't Repeat Yourself): Telas diferentes (`OrdersScreen`, `OrderScreen`)
 *    precisam exibir o mesmo texto em português e a mesma cor para o mesmo status.
 * 2. Tolerância a Falhas: Se o backend devolver um novo status desconhecido (ex: "IN_TRANSIT"),
 *    as funções utilizam Fallback Seguro (Nullish Coalescing `??`) para não quebrar a renderização.
 */

// Categorias de tons semânticos para feedback visual
type Tone = 'warn' | 'ok' | 'bad' | 'muted';

// Dicionário de tradução dos status técnicos do backend para textos amigáveis em português
const LABELS: Record<string, string> = {
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
  FULFILLED: 'Enviado',
  REFUNDED: 'Reembolsado',
};

// Mapeamento semântico entre o status e o tom visual correspondente
const TONES: Record<string, Tone> = {
  PENDING: 'warn',      // Tom de alerta/atenção (amarelo/âmbar)
  PAID: 'ok',           // Sucesso/concluído (verde)
  FULFILLED: 'ok',      // Sucesso/enviado (verde)
  CANCELLED: 'bad',     // Erro/cancelamento (vermelho)
  REFUNDED: 'muted',    // Neutro/reembolsado (cinza)
};

/**
 * Traduz o status técnico (ex: "PENDING") para um rótulo amigável (ex: "Aguardando pagamento").
 * 
 * @param status - Código de status retornado pela API.
 * @returns Texto em português ou o próprio código caso não exista tradução mapeada.
 */
export function statusLabel(status: string): string {
  // `?? status`: Se LABELS[status] for undefined, exibe o próprio texto original
  return LABELS[status] ?? status;
}

/**
 * Retorna o código de cor hexadecimal correspondente ao status do pedido.
 * 
 * @param status - Código de status retornado pela API.
 * @returns Código de cor hex (ex: '#15803d' para verde, '#b91c1c' para vermelho).
 */
export function statusColor(status: string): string {
  // Obtém o tom semântico correspondente ou assume 'muted' por padrão
  const tone = TONES[status] ?? 'muted';

  // Paleta de cores acessíveis de alto contraste
  const colorMap: Record<Tone, string> = {
    warn: '#b45309',  // Âmbar / Laranja escuro para pendente
    ok: '#15803d',    // Verde escuro para aprovado/entregue
    bad: '#b91c1c',   // Vermelho para cancelado/recusado
    muted: '#6b7280', // Cinza neutro para estados indefinidos
  };

  return colorMap[tone];
}
