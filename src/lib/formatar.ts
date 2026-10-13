/**
 * Formatacao de valores para a tela.
 *
 * Fica em um arquivo so porque preco aparece em tres lugares (card, detalhe,
 * favoritos) e os tres precisam mostrar igual. Espalhar `toFixed(2)` pelas
 * telas e como o app acaba com "R$ 10.5" numa e "R$ 10,50" na outra.
 */

/** 1234.5 -> "R$ 1.234,50" */
export function formatarPreco(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

/**
 * Faixa de preco de um produto.
 *
 * Produto SIMPLE tem priceFrom === priceTo e mostra so o preco.
 * Produto VARIABLE ("Camiseta P/M/G", cada uma com seu preco) mostra
 * "a partir de", que e o que o usuario espera ver numa listagem.
 */
export function formatarFaixaDePreco(de: number, ate: number): string {
  if (de === ate) return formatarPreco(de);
  return `a partir de ${formatarPreco(de)}`;
}

/** "Maria Silva" -> "MS". Usado no avatar quando nao ha foto. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';

  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';

  return (primeira + ultima).toUpperCase();
}
