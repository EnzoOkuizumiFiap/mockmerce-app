/**
 * ---------------------------------------------------------------------------
 * TELA: ONDE RETIRAR
 * ---------------------------------------------------------------------------
 * Mapa em cima, lista embaixo.
 *
 * A PERMISSAO MELHORA A TELA, NAO DECIDE SE ELA EXISTE.
 * Com GPS: lista ordenada, distancia em cada item, ponto azul no mapa.
 * Sem GPS (negado ou falhou): a lista continua aparecendo, na ordem de
 * cadastro, com um aviso dizendo por que e um botao para tentar de novo.
 *
 * Quatro estados de tela: carregando, erro, vazio e conteudo.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { EstadoCarregando } from '../components/EstadoCarregando';
import { usePontosRetirada } from '../hooks/usePontosRetirada';
import { cores } from '../lib/tema';
import { PickupPoint } from '../types/location';

const MARGEM_DO_MAPA = { top: 48, right: 48, bottom: 48, left: 48 };

function formatarDistancia(km: number): string {
  return `${km.toFixed(1).replace('.', ',')} km`;
}

function resumoDoEndereco(ponto: PickupPoint): string {
  const { street, number, district, city } = ponto.address;
  const rua = [street, number].filter(Boolean).join(', ');
  return [rua, district, city].filter(Boolean).join(' - ');
}

export function PontosRetiradaScreen() {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    posicao,
    statusLocalizacao,
    tentarLocalizacaoDeNovo,
  } = usePontosRetirada();

  const pontos = useMemo<PickupPoint[]>(() => data?.data ?? [], [data]);

  const mapaRef = useRef<MapView>(null);
  const [mapaPronto, setMapaPronto] = useState(false);

  // Enquadra os pontos (e o usuario, se houver posicao) quando o mapa estiver pronto.
  useEffect(() => {
    if (!mapaPronto || pontos.length === 0) return;

    const coordenadas = pontos.map((p) => p.coordinate);
    if (posicao) coordenadas.push(posicao);

    if (coordenadas.length === 1) {
      mapaRef.current?.animateToRegion(
        { ...coordenadas[0], latitudeDelta: 0.01, longitudeDelta: 0.01 },
        0,
      );
    } else {
      mapaRef.current?.fitToCoordinates(coordenadas, {
        edgePadding: MARGEM_DO_MAPA,
        animated: false,
      });
    }
  }, [mapaPronto, pontos, posicao]);

  function focarNoPonto(ponto: PickupPoint) {
    mapaRef.current?.animateToRegion(
      { ...ponto.coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      350,
    );
  }

  // ---- Estado 1: carregando ----------------------------------------------
  if (isPending) {
    return <EstadoCarregando mensagem="Buscando pontos de retirada..." />;
  }

  // ---- Estado 2: erro -----------------------------------------------------
  if (isError) {
    const mensagem =
      (error as { mensagem?: string } | null)?.mensagem ??
      'Nao foi possivel carregar os pontos de retirada.';
    return (
      <View style={estilos.centro}>
        <Text style={estilos.tituloVazio}>Algo deu errado</Text>
        <Text style={estilos.textoVazio}>{mensagem}</Text>
        <Pressable
          style={estilos.botao}
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Tentar carregar os pontos de novo"
        >
          <Text style={estilos.botaoTexto}>Tentar de novo</Text>
        </Pressable>
      </View>
    );
  }

  // ---- Estado 3: vazio ----------------------------------------------------
  if (pontos.length === 0) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.tituloVazio}>Nenhum ponto de retirada</Text>
        <Text style={estilos.textoVazio}>A loja ainda nao cadastrou pontos de retirada.</Text>
      </View>
    );
  }

  // ---- Estado 4: conteudo -------------------------------------------------
  const semPosicao = statusLocalizacao === 'negada' || statusLocalizacao === 'erro';

  return (
    <View style={estilos.container}>
      <MapView
        ref={mapaRef}
        style={estilos.mapa}
        onMapReady={() => setMapaPronto(true)}
        // Sem permissao o mapa simplesmente nao desenha o ponto azul.
        showsUserLocation={statusLocalizacao === 'ok'}
      >
        {pontos.map((ponto) => (
          <Marker
            key={ponto.id}
            coordinate={ponto.coordinate}
            title={ponto.name}
            description={
              ponto.distanceKm !== null
                ? `${formatarDistancia(ponto.distanceKm)} de voce`
                : resumoDoEndereco(ponto)
            }
          />
        ))}
        {/* TODO (RF-46): marcador da loja. Falta confirmar de onde vem a coordenada. */}
      </MapView>

      {semPosicao && (
        <View style={estilos.aviso} accessibilityRole="alert">
          <Text style={estilos.avisoTexto}>
            {statusLocalizacao === 'negada'
              ? 'Sem acesso a sua localizacao, mostramos os pontos na ordem de cadastro, sem a distancia.'
              : 'Nao conseguimos obter sua posicao agora. Mostramos os pontos sem ordenar por distancia.'}
          </Text>
          <Pressable
            onPress={tentarLocalizacaoDeNovo}
            accessibilityRole="button"
            accessibilityLabel="Tentar obter a localizacao de novo"
          >
            <Text style={estilos.avisoAcao}>Tentar de novo</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={pontos}
        keyExtractor={(ponto) => ponto.id}
        contentContainerStyle={estilos.lista}
        renderItem={({ item }) => (
          <Pressable
            style={estilos.cartao}
            onPress={() => focarNoPonto(item)}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${item.name} no mapa`}
          >
            <View style={estilos.cartaoTopo}>
              <Text style={estilos.cartaoNome}>{item.name}</Text>
              {item.distanceKm !== null && (
                <Text style={estilos.cartaoDistancia}>
                  {formatarDistancia(item.distanceKm)} de voce
                </Text>
              )}
            </View>
            <Text style={estilos.cartaoEndereco}>{resumoDoEndereco(item)}</Text>
            {item.hours && <Text style={estilos.cartaoHorario}>{item.hours}</Text>}
          </Pressable>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  mapa: { height: 260, width: '100%' },
  lista: { padding: 14, gap: 10, paddingBottom: 28 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  tituloVazio: { fontSize: 17, fontWeight: '800', color: '#111827' },
  textoVazio: { fontSize: 14, color: '#4B5563', textAlign: 'center' },
  botao: {
    marginTop: 8,
    backgroundColor: cores.primaria,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  botaoTexto: { color: '#FFFFFF', fontWeight: '700' },
  aviso: {
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  avisoTexto: { fontSize: 13, color: '#7A4B00' },
  avisoAcao: { fontSize: 13, fontWeight: '800', color: cores.primaria },
  cartao: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, gap: 4 },
  cartaoTopo: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cartaoNome: { flexShrink: 1, fontSize: 15, fontWeight: '800', color: '#111827' },
  cartaoDistancia: { fontSize: 13, fontWeight: '700', color: cores.primaria },
  cartaoEndereco: { fontSize: 13, color: '#4B5563' },
  cartaoHorario: { fontSize: 12, color: '#6B7280' },
});