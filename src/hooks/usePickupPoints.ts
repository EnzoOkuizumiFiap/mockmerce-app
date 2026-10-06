import { useQuery } from '@tanstack/react-query';
import { listPickupPoints } from '@/services/pickupPoints';
import { queryKeys } from '@/lib/queryKeys';
import { useDeviceLocation } from './useDeviceLocation';

/** ~110 m. Evita uma query nova a cada oscilação do GPS. */
const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Une localização + lista de pontos.
 *
 * - A busca só dispara quando a localização RESOLVEU (ok, denied ou error).
 *   Assim a primeira resposta já vem ordenada, sem duas buscas seguidas.
 * - Com `enabled: false` nem pedimos permissão. O checkout só liga isso quando
 *   a pessoa escolhe "Retirar na loja": permissão no momento em que faz sentido.
 */
export function usePickupPoints({ enabled = true }: { enabled?: boolean } = {}) {
  const location = useDeviceLocation(enabled);

  const resolved =
    location.status === 'ok' || location.status === 'denied' || location.status === 'error';

  const keyPosition = location.position
    ? { latitude: round(location.position.latitude), longitude: round(location.position.longitude) }
    : null;

  const query = useQuery({
    queryKey: queryKeys.pickup.list(keyPosition),
    queryFn: () => listPickupPoints(location.position),
    enabled: enabled && resolved,
    // Ao tentar a localização de novo, a lista anterior fica na tela.
    placeholderData: (previous) => previous,
    select: (response) => ({ ...response, data: response.data.filter((p) => p.active) }),
  });

  return {
    data: query.data,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    position: location.position,
    locationStatus: location.status,
    canAskAgain: location.canAskAgain,
    retryLocation: location.retry,
    /** true enquanto ainda esperamos a localização resolver. */
    waitingLocation: enabled && !resolved,
  };
}