/**
 * Tipos de localização e retirada.
 *
 * A API devolve coordenada como `{ latitude, longitude }`, o mesmo formato que
 * o <Marker coordinate={...} /> do react-native-maps espera. Nenhuma tela
 * precisa converter nada; se a API mudasse, a tradução ficaria no service.
 */

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type PickupAddress = {
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
};

export type PickupPoint = {
  id: string;
  name: string;
  address: PickupAddress;
  coordinate: Coordinate;
  /** Texto livre, ex.: "Seg a Sex, 9h às 18h". */
  hours: string | null;
  active: boolean;
  /**
   * Distância até a posição enviada na busca.
   * É `null` sempre que o app NÃO mandou a posição (ex.: GPS negado).
   */
  distanceKm: number | null;
};

export type PickupPointsResponse = {
  data: PickupPoint[];
  /** Posição que a API usou para ordenar, ou null se não foi informada. */
  origin: Coordinate | null;
};