/**
 * ============================================================================
 * UTILITÁRIO: Formatação de Moeda (Real - R$)
 * ============================================================================
 * 
 * Por que fazemos a formatação manual em vez de usar `Intl.NumberFormat`?
 * No React Native (especialmente com o motor JavaScript Hermes no Android),
 * a biblioteca nativa `Intl` nem sempre vem com todos os pacotes de idiomas
 * (locales pt-BR) instalados por padrão, o que pode causar bugs visuais.
 * Esta função manual garante que o valor seja formatado perfeitamente (R$ 1.250,90)
 * em QUALQUER celular Android ou iOS.
 * 
 * @param value - Número vindo da API (ex: 79.9, 1250, 0.5)
 * @returns String formatada em reais (ex: "R$ 79,90", "R$ 1.250,00")
 */
export function money(value: number): string {
  // 1. Arredonda para 2 casas decimais e converte para string (evita erros de precisão do JS como 0.1 + 0.2)
  // Ex: 79.9 -> "79.90" | 1250 -> "1250.00"
  const fixed = (Math.round(value * 100) / 100).toFixed(2);

  // 2. Separa a parte inteira dos centavos pelo ponto
  // Ex: "1250.90" -> intPart = "1250", decPart = "90"
  const [intPart, decPart] = fixed.split('.');

  // 3. Regex para adicionar o ponto de milhar a cada 3 dígitos
  // Ex: "1250" -> "1.250" | "1000000" -> "1.000.000"
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // 4. Junta tudo no padrão brasileiro: R$ + inteiros com ponto + vírgula + centavos
  return `R$ ${withThousands},${decPart}`;
}
