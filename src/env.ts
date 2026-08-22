/**
 * ============================================================================
 * VARIÁVEIS DE AMBIENTE (Environment Configuration)
 * ============================================================================
 * 
 * Como funcionam as variáveis de ambiente no Expo / React Native?
 * 1. O arquivo `.env` armazena as chaves locais do projeto.
 * 2. REGRA DO EXPO: O compilador do Expo só embute variáveis no aplicativo se elas
 *    começarem com o prefixo `EXPO_PUBLIC_`.
 * 3. Qualquer variável sem esse prefixo é ignorada por segurança para não vazar segredos.
 */
export const env = {
  // URL base da API (se não informada, usa a URL padrão da Mockmerce)
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.mockmerce.com.br',

  // Chave pública de API do grupo
  apiKey: process.env.EXPO_PUBLIC_API_KEY ?? '',

  // RM do aluno para identificação da turma nas chamadas
  studentRm: process.env.EXPO_PUBLIC_STUDENT_RM ?? '',
};

// Validação em tempo de desenvolvimento:
// Se a chave de API estiver vazia, exibe um alerta no console para o desenvolvedor
if (!env.apiKey) {
  console.warn(
    '[env] EXPO_PUBLIC_API_KEY vazio. Copie .env.example para .env e preencha a chave do grupo.',
  );
}
