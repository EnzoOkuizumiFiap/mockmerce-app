/**
 * ---------------------------------------------------------------------------
 * SERVICE DE AVALIACOES
 * ---------------------------------------------------------------------------
 * Traduz "o que a tela quer" em endpoint. A tela nao conhece URL nem metodo.
 *
 * As tres regras que a API impoe (e que aparecem aqui como erro):
 *   403  so quem comprou avalia
 *   409  uma avaliacao por cliente em cada produto
 *   400  nota fora de 1..5, mais de 5 fotos, mediaId inexistente
 * ---------------------------------------------------------------------------
 */

import { api } from '../api/client';
import {
  Avaliacao,
  NovaAvaliacao,
  PodeAvaliar,
  RespostaAvaliacoes,
} from '../types/avaliacao';

export type OrdemAvaliacao = 'recent' | 'rating_desc' | 'rating_asc';

/**
 * Avaliacoes de um produto, ja com o resumo (media + distribuicao).
 *
 * NAO exige login: qualquer visitante da loja ve as avaliacoes.
 */
export async function listarAvaliacoes(
  produtoId: string,
  opcoes: { rating?: number; withPhotos?: boolean; ordem?: OrdemAvaliacao } = {},
): Promise<RespostaAvaliacoes> {
  const resposta = await api.get<RespostaAvaliacoes>(`/products/${produtoId}/reviews`, {
    params: {
      page: 1,
      pageSize: 20,
      rating: opcoes.rating,
      withPhotos: opcoes.withPhotos,
      sort: opcoes.ordem ?? 'recent',
    },
  });
  return resposta.data;
}

/**
 * Pergunta ANTES de mostrar o formulario.
 *
 * Exige cliente logado. Se o app chamar isto sem token, volta 401 — por isso
 * o hook so dispara quando ha sessao (ver useAvaliacoes.ts).
 */
export async function podeAvaliar(produtoId: string): Promise<PodeAvaliar> {
  const resposta = await api.get<PodeAvaliar>(`/products/${produtoId}/reviews/can-review`);
  return resposta.data;
}

export async function criarAvaliacao(
  produtoId: string,
  dados: NovaAvaliacao,
): Promise<Avaliacao> {
  const resposta = await api.post<Avaliacao>(`/products/${produtoId}/reviews`, dados);
  return resposta.data;
}

/**
 * Editar SUBSTITUI as fotos pela lista enviada.
 *
 * Para manter uma foto antiga, reenvie o `mediaId` dela junto com as novas.
 * Mandar `mediaIds: []` apaga todas.
 */
export async function editarAvaliacao(
  avaliacaoId: string,
  dados: Partial<NovaAvaliacao>,
): Promise<Avaliacao> {
  const resposta = await api.patch<Avaliacao>(`/reviews/${avaliacaoId}`, dados);
  return resposta.data;
}

export async function apagarAvaliacao(avaliacaoId: string): Promise<void> {
  await api.delete(`/reviews/${avaliacaoId}`);
}
