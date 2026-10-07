/**
 * ---------------------------------------------------------------------------
 * HOOKS DE AVALIACAO
 * ---------------------------------------------------------------------------
 * Aqui aparece a diferenca entre os dois tipos de operacao do TanStack Query:
 *
 *   useQuery     LER   — cacheia, revalida, roda sozinha ao abrir a tela
 *   useMutation  ESCREVER — roda quando VOCE manda, e depois avisa o cache
 *
 * O `invalidateQueries` no fim da mutation e o que faz a tela se atualizar
 * sozinha depois de enviar a avaliacao. Sem ele, o usuario envia, volta para
 * a lista e nao ve a propria avaliacao — ela esta no servidor, mas a tela
 * continua mostrando o cache antigo. E o bug mais comum de quem esta
 * comecando com cache.
 * ---------------------------------------------------------------------------
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../contexts/AuthContext';
import {
  OrdemAvaliacao,
  apagarAvaliacao,
  criarAvaliacao,
  editarAvaliacao,
  listarAvaliacoes,
  podeAvaliar,
} from '../services/avaliacoesService';
import { NovaAvaliacao } from '../types/avaliacao';

export const chavesAvaliacao = {
  todas: ['avaliacoes'] as const,
  doProduto: (produtoId: string, ordem: OrdemAvaliacao, comFoto: boolean) =>
    ['avaliacoes', produtoId, ordem, comFoto] as const,
  podeAvaliar: (produtoId: string) => ['avaliacoes', 'pode', produtoId] as const,
};

export function useAvaliacoes(
  produtoId: string,
  opcoes: { ordem?: OrdemAvaliacao; comFoto?: boolean } = {},
) {
  const ordem = opcoes.ordem ?? 'recent';
  const comFoto = opcoes.comFoto ?? false;

  return useQuery({
    queryKey: chavesAvaliacao.doProduto(produtoId, ordem, comFoto),
    queryFn: () => listarAvaliacoes(produtoId, { ordem, withPhotos: comFoto }),
  });
}

/**
 * Pode avaliar este produto?
 *
 * O `enabled` e a peca importante: esta rota EXIGE cliente logado, e chamar
 * sem sessao devolveria 401 — que o interceptor trata como "sessao expirou" e
 * derruba o usuario para o login. Ou seja: sem o `enabled`, abrir o detalhe
 * de um produto deslogado expulsaria a pessoa do app.
 */
export function usePodeAvaliar(produtoId: string) {
  const { usuario } = useAuth();

  return useQuery({
    queryKey: chavesAvaliacao.podeAvaliar(produtoId),
    queryFn: () => podeAvaliar(produtoId),
    enabled: Boolean(usuario),
  });
}

export function useCriarAvaliacao(produtoId: string) {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: (dados: NovaAvaliacao) => criarAvaliacao(produtoId, dados),

    onSuccess: () => {
      /**
       * Tres caches ficaram velhos de uma vez:
       *   1. a lista de avaliacoes  (falta a nova)
       *   2. o can-review           (agora e ALREADY_REVIEWED)
       *   3. o produto              (a media mudou!)
       *
       * O terceiro e o que passa despercebido: a nota do produto vem de
       * `GET /products/:id`, nao das avaliacoes. Sem invalidar, a tela
       * mostraria a avaliacao nova com a media velha ao lado.
       */
      cliente.invalidateQueries({ queryKey: chavesAvaliacao.todas });
      cliente.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
}

export function useEditarAvaliacao(produtoId: string) {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: (params: { avaliacaoId: string; dados: Partial<NovaAvaliacao> }) =>
      editarAvaliacao(params.avaliacaoId, params.dados),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chavesAvaliacao.todas });
      cliente.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
}

export function useApagarAvaliacao() {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: (avaliacaoId: string) => apagarAvaliacao(avaliacaoId),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chavesAvaliacao.todas });
      cliente.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
}
