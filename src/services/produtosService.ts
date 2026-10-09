/**
 * ---------------------------------------------------------------------------
 * SERVICE DE PRODUTOS
 * ---------------------------------------------------------------------------
 * O service traduz "o que o app quer" para "qual endpoint chamar".
 * A tela nao sabe a URL, nem o formato do envelope, nem o metodo HTTP.
 *
 * REGRA: o service devolve o DADO LIMPO, nunca a resposta crua do Axios.
 * ---------------------------------------------------------------------------
 */

import { api } from '../api/client';
import { ProdutoDetalhe, ProdutoResumo, RespostaListaProdutos } from '../types/produto';

/**
 * Lista de produtos publicados da loja.
 *
 * O generic <RespostaListaProdutos> diz ao TypeScript o formato do campo
 * `data`. Sem ele, `resposta.data` seria `any` e toda a checagem cairia.
 */
export async function listarProdutos(pageSize = 20): Promise<ProdutoResumo[]> {
  const resposta = await api.get<RespostaListaProdutos>('/products', {
    // `params` monta a query string com escape correto — melhor do que
    // concatenar string na mao, que quebra com acento e espaco.
    params: { page: 1, pageSize },
  });

  // Devolvemos so o array. O envelope (page, pageSize, total) fica aqui
  // dentro: a tela nao precisa saber que a API pagina.
  return resposta.data.data;
}

/**
 * Busca por termo.
 *
 * REPARE QUE E O MESMO ENDPOINT DA LISTAGEM, com um parametro a mais. Nao ha
 * `/products/search` nesta API — buscar e listar com filtro. Por isso as duas
 * funcoes tem a mesma forma e o mesmo tipo de retorno.
 */
export async function buscarProdutosPorTermo(termo: string): Promise<ProdutoResumo[]> {
  const resposta = await api.get<RespostaListaProdutos>('/products', {
    params: { search: termo, page: 1, pageSize: 20 },
  });
  return resposta.data.data;
}

/**
 * Um produto pelo id.
 *
 * Aqui o generic e `ProdutoDetalhe` direto: este endpoint nao usa envelope, e
 * devolve MAIS campos que a listagem (descricao, variantes, todas as imagens).
 */
export async function buscarProdutoPorId(id: string): Promise<ProdutoDetalhe> {
  const resposta = await api.get<ProdutoDetalhe>(`/products/${id}`);
  return resposta.data;
}
