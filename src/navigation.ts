/**
 * ============================================================================
 * TIPAGEM DAS ROTAS DE NAVEGAÇÃO (React Navigation Param Lists)
 * ============================================================================
 * 
 * Por que tipamos as rotas no React Navigation?
 * 1. Autocompletar e Validação no VS Code: Ao chamar `navigation.navigate(...)`,
 *    o TypeScript só permite navegar para telas que realmente existem.
 * 2. Segurança de Parâmetros: Garante que você não esqueça de passar os parâmetros
 *    obrigatórios de uma tela (ex: `{ id, name }` no Detalhe do Produto).
 * 
 * Regra de Valores:
 * - `undefined`: A rota não recebe nenhum parâmetro (ex: `navigation.navigate('Cart')`).
 * - `{ id: string, name: string }`: A rota EXIGE esses parâmetros na navegação.
 */

/**
 * 1. Pilha de Telas de Autenticação (AuthStack)
 * Telas exibidas quando o usuário NÃO está autenticado.
 */
export type AuthStackParamList = {
  SignIn: undefined;         // Tela de Login
  SignUp: undefined;         // Tela de Cadastro
  ForgotPassword: undefined; // Tela de Recuperação de Senha
};

/**
 * 2. Pilha de Telas Principais do App (RootStack)
 * Telas do fluxo de navegação do catálogo e compras.
 */
export type RootStackParamList = {
  Products: undefined;                       // Tela da Vitrine / Catálogo de Produtos
  ProductDetail: { id: string; name: string }; // Tela de Detalhes (exige ID e Nome do produto)
  Cart: undefined;                           // Tela do Carrinho de Compras
  Checkout: undefined;                       // Tela de Checkout
  Order: { id: string };                     // Tela de Pedido
  Orders: undefined;                         // Tela de Pedidos
  Favorites: undefined;                      // Tela de Favoritos do Comprador
};
