/**
 * ---------------------------------------------------------------------------
 * TIPOS DE NAVEGACAO
 * ---------------------------------------------------------------------------
 * SAO DOIS STACKS, E NAO UM.
 *
 * A tentacao e declarar um `RootStackParamList` com todas as telas e trocar
 * o conteudo conforme o login. O problema aparece na hora de digitar
 * `navigation.navigate(...)`: o TypeScript passa a aceitar
 * `navigate('Perfil')` dentro da tela de login, porque para ele as duas telas
 * vivem no mesmo stack. Compila, e quebra em tempo de execucao.
 *
 * Dois stacks separados = o compilador so oferece as telas que existem
 * naquele momento da vida do app.
 * ---------------------------------------------------------------------------
 */

/** Telas de quem NAO esta logado. */
export type AuthStackParamList = {
  Login: undefined;
  Cadastro: undefined;
};

/** Telas de quem ESTA logado. */
export type AppStackParamList = {
  ListaProdutos: undefined;

  /**
   * O `nome` viaja junto com o `id` de proposito.
   *
   * Ele nao e usado para buscar nada — a busca e pelo id. Serve para o
   * cabecalho ja mostrar o nome do produto enquanto o detalhe carrega, em vez
   * de um titulo generico que muda meio segundo depois.
   */
  DetalheProduto: { id: string; nome: string };

  Favoritos: undefined;
  Perfil: undefined;

  // ---- Compra (ja vinha pronto) -------------------------------------------
  Carrinho: undefined;
  Checkout: undefined;
  Pedido: { pedidoId: string };

  // ---- Conteudo desta aula ------------------------------------------------
  /**
   * O `produtoNome` viaja junto pelo mesmo motivo do detalhe: o cabecalho ja
   * mostra de que produto e a avaliacao, sem esperar requisicao nenhuma.
   */
  Avaliar: { produtoId: string; produtoNome: string };

  PontosRetirada: undefined;
};
