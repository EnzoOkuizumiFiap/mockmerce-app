/**
 * ---------------------------------------------------------------------------
 * SERVICE DE RETIRADA
 * ---------------------------------------------------------------------------
 * A tela nao conhece URL nem query string.
 *
 * REGRA DA API: `GET /pickup-points` so ordena por distancia se receber
 * latitude E longitude. Sem elas, devolve na ordem de cadastro e com
 * `distanceKm: null`. Isso e esperado, nao e bug: e o que permite a lista
 * continuar aparecendo quando o usuario nega o GPS.
 * ---------------------------------------------------------------------------
 */

import { api } from '../api/client';
import { Coordinate, PickupPointsResponse } from '../types/location';

export async function listarPontosRetirada(
  posicao: Coordinate | null,
): Promise<PickupPointsResponse> {
  const resposta = await api.get<PickupPointsResponse>('/pickup-points', {
    // `undefined` faz o Axios nem enviar os parametros.
    params: posicao
      ? { latitude: posicao.latitude, longitude: posicao.longitude }
      : undefined,
  });
  return resposta.data;
}