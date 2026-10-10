/**
 * ---------------------------------------------------------------------------
 * SERVICO DA LOJA
 * ---------------------------------------------------------------------------
 * Busca a localizacao da loja (GET /store/settings) para o marcador do mapa.
 * A resposta traz muito mais coisa (email, CNPJ, tema...). Aqui so interessam
 * nome e coordenada.
 *
 * Retorna null quando a loja ainda nao tem coordenada cadastrada no painel:
 * "sem loja no mapa" e um caso normal, nao um erro.
 * ---------------------------------------------------------------------------
 */

import { api } from '../api/client';

type ConfiguracaoLoja = {
  storeName: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type LocalizacaoLoja = {
  nome: string;
  latitude: number;
  longitude: number;
};

export async function buscarLocalizacaoLoja(): Promise<LocalizacaoLoja | null> {
  const { data } = await api.get<ConfiguracaoLoja>('/store/settings');

  if (data.latitude == null || data.longitude == null) return null;

  return {
    nome: data.storeName ?? 'Loja',
    latitude: data.latitude,
    longitude: data.longitude,
  };
}