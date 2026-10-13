/**
 * ---------------------------------------------------------------------------
 * HOOK: PONTOS DE RETIRADA
 * ---------------------------------------------------------------------------
 * Junta duas coisas que mudam em tempos diferentes: a POSICAO do aparelho
 * (que demora e pode nunca vir) e a LISTA da API (que depende da posicao).
 *
 * A decisao de desenho: NAO esperamos o GPS para buscar a lista.
 *
 *   - GPS negado ou com erro  -> busca sem posicao, lista por nome
 *   - GPS ok                  -> busca de novo, agora ordenada por distancia
 *
 * O usuario ve os pontos imediatamente e a ordem melhora quando a posicao
 * chega. O contrario — segurar a tela ate o GPS responder — e o que produz
 * aquela espera de cinco segundos olhando para um spinner.
 * ---------------------------------------------------------------------------
 */

import { useQuery } from '@tanstack/react-query';

import { listarPontosRetirada } from '../services/localizacaoService';
import { useLocalizacao } from './useLocalizacao';

export function usePontosRetirada(raioKm?: number) {
  const { posicao, status, tentarNovamente } = useLocalizacao();

  const consulta = useQuery({
    /**
     * A posicao entra na CHAVE do cache.
     *
     * Sem isso, a busca "sem posicao" e a busca "com posicao" dividiriam a
     * mesma entrada de cache, e a lista ordenada nunca substituiria a lista
     * por nome — o TanStack devolveria a primeira resposta para sempre.
     */
    queryKey: ['pontos-retirada', posicao?.latitude ?? null, posicao?.longitude ?? null, raioKm ?? null],
    queryFn: () => listarPontosRetirada(posicao, raioKm),

    // So espera enquanto o GPS ainda pode responder. Negado ou com erro, a
    // busca sai na hora — sem posicao.
    enabled: status !== 'obtendo',
  });

  return {
    ...consulta,
    posicao,
    statusLocalizacao: status,
    tentarLocalizacaoNovamente: tentarNovamente,
  };
}
