/**
 * ---------------------------------------------------------------------------
 * HOOKS DE CARRINHO E PEDIDO  (ja vem pronto)
 * ---------------------------------------------------------------------------
 * Nao e o conteudo da aula. Esta aqui porque avaliar exige ter comprado.
 * ---------------------------------------------------------------------------
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../contexts/AuthContext';
import {
  adicionarAoCarrinho,
  buscarCarrinho,
  finalizarCompra,
  listarPedidos,
  pagarPedido,
  removerDoCarrinho,
} from '../services/carrinhoService';
import { MetodoPagamento } from '../types/pedido';

export const chavesCompra = {
  carrinho: ['carrinho'] as const,
  pedidos: ['pedidos'] as const,
};

export function useCarrinho() {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: chavesCompra.carrinho,
    queryFn: buscarCarrinho,
    enabled: Boolean(usuario),
  });
}

export function useAdicionarAoCarrinho() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (params: { variantId: string; quantidade?: number }) =>
      adicionarAoCarrinho(params.variantId, params.quantidade ?? 1),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chavesCompra.carrinho }),
  });
}

export function useRemoverDoCarrinho() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removerDoCarrinho(itemId),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chavesCompra.carrinho }),
  });
}

export function useFinalizarCompra() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (pontoRetiradaId?: string) => finalizarCompra(pontoRetiradaId),
    onSuccess: () => {
      // O carrinho virou pedido: os dois caches mudaram.
      cliente.invalidateQueries({ queryKey: chavesCompra.carrinho });
      cliente.invalidateQueries({ queryKey: chavesCompra.pedidos });
    },
  });
}

export function usePagarPedido() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (params: { pedidoId: string; metodo: MetodoPagamento; simular?: 'approve' | 'decline' }) =>
      pagarPedido(params.pedidoId, params.metodo, params.simular),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chavesCompra.pedidos });
      /**
       * Pagar muda o "pode avaliar": antes do pagamento a API responde
       * NOT_PURCHASED, depois libera. Sem invalidar, o botao de avaliar
       * continuaria escondido ate o app ser reaberto.
       */
      cliente.invalidateQueries({ queryKey: ['avaliacoes'] });
    },
  });
}

export function usePedidos() {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: chavesCompra.pedidos,
    queryFn: listarPedidos,
    enabled: Boolean(usuario),
  });
}
