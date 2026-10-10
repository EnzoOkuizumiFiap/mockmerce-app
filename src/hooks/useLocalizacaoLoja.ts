/**
 * ---------------------------------------------------------------------------
 * HOOK DA LOCALIZACAO DA LOJA
 * ---------------------------------------------------------------------------
 * DECISAO: a loja e um dado de apoio, nao o conteudo principal da tela.
 * Por isso este hook e separado do de pontos de retirada: se ele falhar,
 * a lista e o mapa dos pontos continuam funcionando, so sem o marcador da loja.
 *
 * `staleTime` longo porque a localizacao da loja quase nunca muda.
 * `retry: 1` para nao ficar insistindo numa informacao opcional.
 * ---------------------------------------------------------------------------
 */

import { useQuery } from '@tanstack/react-query';

import { buscarLocalizacaoLoja } from '../services/lojaService';

export function useLocalizacaoLoja() {
  return useQuery({
    queryKey: ['loja', 'localizacao'] as const,
    queryFn: buscarLocalizacaoLoja,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}