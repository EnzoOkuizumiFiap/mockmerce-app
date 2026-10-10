/**
 * ---------------------------------------------------------------------------
 * HOOK DE PONTOS DE RETIRADA
 * ---------------------------------------------------------------------------
 * Junta duas coisas: a posicao do aparelho (hook do Gustavo) e a lista da API.
 *
 * DECISAO: a consulta NAO espera o GPS.
 * Se esperasse, um GPS que demora (ou nunca responde) deixaria a tela presa em
 * "Obtendo localizacao". Aqui a lista sai na hora, na ordem de cadastro, e
 * quando a posicao chega a chave do cache muda e a lista e buscada de novo,
 * agora ordenada. `keepPreviousData` evita a tela piscar de volta para
 * "carregando" nessa troca.
 *
 * As coordenadas sao arredondadas na chave: o GPS varia na 5a casa decimal
 * e, sem isso, cada micro-movimento dispararia uma requisicao nova.
 * ---------------------------------------------------------------------------
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listarPontosRetirada } from '../services/retiradaService';
import { useLocation } from './useLocation';

export const chavesRetirada = {
  todas: ['pontos-retirada'] as const,
  lista: (latitude: number | null, longitude: number | null) =>
    ['pontos-retirada', latitude, longitude] as const,
};

const arredondar = (valor: number) => Number(valor.toFixed(3));

export function usePontosRetirada() {
  // Contrato combinado com o Gustavo: { position, status, retry }
  // status: 'obtendo' | 'ok' | 'negada' | 'erro'
  const { position, status, retry } = useLocation();

  const latitude = position ? arredondar(position.latitude) : null;
  const longitude = position ? arredondar(position.longitude) : null;

  const consulta = useQuery({
    queryKey: chavesRetirada.lista(latitude, longitude),
    queryFn: () => listarPontosRetirada(position),
    placeholderData: keepPreviousData,
  });

  return {
    ...consulta,
    posicao: position,
    statusLocalizacao: status,
    tentarLocalizacaoDeNovo: retry,
  };
}