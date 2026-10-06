import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { usePickupPoints } from '@/hooks/usePickupPoints';
import { LocationNotice } from '@/components/LocationNotice';
import { PickupPointCard } from '@/components/PickupPointCard';
import { Center, ErrorState, Loading } from '@/components/ui';
import { addressSummary, formatKm } from '@/lib/pickup';
import { theme } from '@/lib/theme';
import type { ApiError } from '@/types/api';
import type { PickupPoint } from '@/types/location';

const EDGE_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };

/**
 * ============================================================================
 * TELA: PONTOS DE RETIRADA
 * ============================================================================
 * Mapa em cima, lista embaixo. Nos três estados de localização (ok, negada,
 * erro) A LISTA APARECE: a permissão melhora a tela, não decide se ela existe.
 */
export function PickupPointsScreen() {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    position,
    locationStatus,
    canAskAgain,
    retryLocation,
    waitingLocation,
  } = usePickupPoints();

  const points = useMemo<PickupPoint[]>(() => data?.data ?? [], [data]);

  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  // Enquadra pontos (e o usuário, se houver posição) assim que o mapa estiver pronto.
  useEffect(() => {
    if (!mapReady || points.length === 0) return;
    const coords = points.map((p) => p.coordinate);
    if (position) coords.push(position);

    if (coords.length === 1) {
      mapRef.current?.animateToRegion({ ...coords[0], latitudeDelta: 0.01, longitudeDelta: 0.01 }, 0);
    } else {
      mapRef.current?.fitToCoordinates(coords, { edgePadding: EDGE_PADDING, animated: false });
    }
  }, [mapReady, points, position]);

  const focusPoint = useCallback((point: PickupPoint) => {
    mapRef.current?.animateToRegion(
      { ...point.coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      350,
    );
  }, []);

  if (isPending) {
    return <Loading label={waitingLocation ? 'Obtendo sua localização…' : 'Buscando pontos de retirada…'} />;
  }

  if (isError) {
    return (
      <ErrorState
        message={(error as ApiError)?.message ?? 'Não foi possível carregar os pontos.'}
        onRetry={() => refetch()}
      />
    );
  }

  if (points.length === 0) {
    return (
      <Center>
        <Text style={styles.emptyTitle}>Nenhum ponto de retirada</Text>
        <Text style={styles.emptyText}>A loja ainda não cadastrou pontos de retirada.</Text>
      </Center>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onMapReady={() => setMapReady(true)}
        // Sem permissão o mapa simplesmente não desenha o ponto azul.
        showsUserLocation={locationStatus === 'ok'}
      >
        {points.map((point) => (
          <Marker
            key={point.id}
            coordinate={point.coordinate}
            title={point.name}
            description={point.distanceKm !== null ? `${formatKm(point.distanceKm)} de você` : addressSummary(point)}
          />
        ))}
      </MapView>

      <LocationNotice status={locationStatus} canAskAgain={canAskAgain} onRetry={retryLocation} />

      <FlatList
        data={points}
        keyExtractor={(point) => point.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <PickupPointCard point={item} onPress={() => focusPoint(item)} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light },
  map: { height: 260, width: '100%' },
  list: { padding: 14, gap: 10, paddingBottom: 28 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.dark },
  emptyText: { fontSize: 14, color: theme.colors.greyDark, textAlign: 'center' },
});