/**
 * ---------------------------------------------------------------------------
 * TIPOS DE LOCALIZACAO
 * ---------------------------------------------------------------------------
 * A API devolve coordenada no formato `{ latitude, longitude }` — exatamente
 * o que o `react-native-maps` espera em `<Marker coordinate={...} />`.
 *
 * Isso nao e coincidencia: quando o backend fala a lingua da biblioteca, a
 * tela nao precisa converter nada. Se a sua API devolvesse `{ lat, lng }`,
 * o lugar de traduzir seria o SERVICE — nunca a tela.
 * ---------------------------------------------------------------------------
 */

export type Coordenada = {
  latitude: number;
  longitude: number;
};

export type PontoRetirada = {
  id: string;
  name: string;
  address: {
    cep: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    district: string | null;
    city: string | null;
    state: string | null;
  };
  coordinate: Coordenada;
  /** Texto livre: "Seg a Sex, 9h as 18h". */
  hours: string | null;
  active: boolean;

  /**
   * Distancia ate a posicao enviada na busca.
   *
   * E `null` quando o app NAO mandou a posicao — o que acontece sempre que o
   * usuario nega a permissao de GPS. A tela precisa saber lidar com os dois
   * casos; ver PontosRetiradaScreen.
   */
  distanceKm: number | null;
};

export type RespostaPontos = {
  data: PontoRetirada[];
  /** A posicao que a API usou para ordenar, ou null se nao foi informada. */
  origin: Coordenada | null;
};

/**
 * O mapa do rastreio, dentro do envio.
 *
 * ATENCAO — este trajeto e SIMULADO pelo backend: a posicao e interpolada em
 * linha reta entre a loja e o destino, e nao segue ruas. Serve para exercitar
 * mapa e Polyline com dados que se movem de verdade a cada chamada.
 */
export type Rastreio = {
  origin: Coordenada | null;
  destination: Coordenada | null;
  /** Onde o pedido esta AGORA. */
  current: Coordenada | null;
  /** Por onde ja passou — e este array que vai na <Polyline />. */
  path: Coordenada[];
};
