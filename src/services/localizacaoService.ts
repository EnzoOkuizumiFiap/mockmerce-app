/**
 * ---------------------------------------------------------------------------
 * SERVICE DE LOCALIZACAO
 * ---------------------------------------------------------------------------
 * Uma rota so, com um detalhe que muda tudo: mandar (ou nao) a posicao do
 * cliente.
 *
 *   COM posicao  -> a lista volta ordenada por proximidade, com distanceKm
 *   SEM posicao  -> a lista volta por nome, com distanceKm = null
 *
 * O segundo caso NAO e um erro: e o que acontece quando o usuario nega o GPS.
 * O app continua util, so nao consegue dizer qual ponto e o mais perto.
 * ---------------------------------------------------------------------------
 */

import { api } from '../api/client';
import { Coordenada, RespostaPontos } from '../types/localizacao';

export async function listarPontosRetirada(
  posicao: Coordenada | null,
  raioKm?: number,
): Promise<RespostaPontos> {
  const resposta = await api.get<RespostaPontos>('/pickup-points', {
    /**
     * `params` com valor `undefined` e simplesmente omitido pelo Axios — por
     * isso da para montar tudo num objeto so, sem `if` para cada parametro.
     */
    params: {
      latitude: posicao?.latitude,
      longitude: posicao?.longitude,
      maxKm: raioKm,
    },
  });
  return resposta.data;
}
