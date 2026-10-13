/**
 * Paleta em um lugar so.
 *
 * Nao e um design system — e o minimo para que trocar a cor da marca seja uma
 * edicao, e nao uma cacada por `#7C3AED` em doze arquivos.
 *
 * E, para o Checkpoint: mudar estas cores NAO transforma este app no app do
 * grupo. O que se reproduz aqui sao as decisoes de engenharia; a identidade
 * visual e o produto sao decisoes de voces.
 */
export const cores = {
  primaria: '#7C3AED',
  primariaEscura: '#6D28D9',
  primariaClara: '#EDE9FE',
  primariaDesativada: '#C4B5FD',

  fundo: '#F9FAFB',
  superficie: '#FFFFFF',
  borda: '#E5E7EB',

  texto: '#374151',
  textoForte: '#111827',
  textoFraco: '#6B7280',
  placeholder: '#9CA3AF',

  destaque: '#F59E0B',
  /// Usado quando algo melhora para o cliente (preco que caiu, pedido pago).
  sucesso: '#059669',
  perigo: '#EF4444',
  neutro: '#D1D5DB',
  neutroClaro: '#F3F4F6',
} as const;
