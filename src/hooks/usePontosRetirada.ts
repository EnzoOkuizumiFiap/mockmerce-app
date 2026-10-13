/**
 * ---------------------------------------------------------------------------
 * HOOK: PONTOS DE RETIRADA
 * ---------------------------------------------------------------------------
 * Une localizacao + lista de pontos. Uma fonte de dados, dois lugares que a
 * usam: a tela do mapa e o checkout.
 *
 * - A busca so dispara quando a localizacao RESOLVEU (ok, negada ou erro).
 *   Assim a primeira resposta ja vem ordenada, sem duas buscas seguidas.
 * - Com `habilitado: false` nem pedimos permissao. O checkout so liga isto
 *   quando a pessoa escolhe "Retirar na loja": permissao no momento em que
 *   ela entende para que serve.
 * ---------------------------------------------------------------------------
 */
import { useQuery } from '@tanstack/react-query';

import { listarPontosRetirada } from '../services/localizacaoService';
import { useLocalizacao } from './useLocalizacao';

export const chavesPontos = {
  todos: ['pontos-retirada'] as const,
  lista: (posicao: { latitude: number; longitude: number } | null) =>
    ['pontos-retirada', 'lista', posicao] as const,
};

/** ~110 m. Evita uma query nova a cada oscilacao do GPS. */
const arredondar = (n: number) => Math.round(n * 1000) / 1000;

export function usePontosRetirada({ habilitado = true }: { habilitado?: boolean } = {}) {
  const localizacao = useLocalizacao(habilitado);

  const resolvida =
    localizacao.status === 'ok' ||
    localizacao.status === 'negada' ||
    localizacao.status === 'erro';

  const posicaoNaChave = localizacao.posicao
    ? {
        latitude: arredondar(localizacao.posicao.latitude),
        longitude: arredondar(localizacao.posicao.longitude),
      }
    : null;

  const consulta = useQuery({
    queryKey: chavesPontos.lista(posicaoNaChave),
    queryFn: () => listarPontosRetirada(localizacao.posicao),
    enabled: habilitado && resolvida,
    // Ao tentar a localizacao de novo, a lista anterior continua na tela.
    placeholderData: (anterior) => anterior,
  });

  return {
    data: consulta.data,
    isPending: consulta.isPending,
    isError: consulta.isError,
    error: consulta.error,
    refetch: consulta.refetch,
    posicao: localizacao.posicao,
    statusLocalizacao: localizacao.status,
    podePerguntarDeNovo: localizacao.podePerguntarDeNovo,
    tentarLocalizacaoNovamente: localizacao.tentarNovamente,
    /** true enquanto ainda esperamos a localizacao resolver. */
    aguardandoLocalizacao: habilitado && !resolvida,
  };
}