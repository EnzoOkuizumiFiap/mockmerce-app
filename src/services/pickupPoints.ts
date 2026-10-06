import { http } from './http';
import type { Coordinate, PickupPointsResponse } from '@/types/location';

/**
 * GET /pickup-points
 *
 *   COM posição -> lista ordenada por proximidade, com distanceKm
 *   SEM posição -> ordem de cadastro, com distanceKm = null
 *
 * O segundo caso NÃO é erro: é o que acontece quando o usuário nega o GPS.
 * O Axios omite params `undefined`, então não precisamos de `if` por parâmetro.
 */
export async function listPickupPoints(
  position: Coordinate | null,
  maxKm?: number,
): Promise<PickupPointsResponse> {
  const { data } = await http.get<PickupPointsResponse>('/pickup-points', {
    params: {
      latitude: position?.latitude,
      longitude: position?.longitude,
      maxKm,
    },
  });
  return data;
}