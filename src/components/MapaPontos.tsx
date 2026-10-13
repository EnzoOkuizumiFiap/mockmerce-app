/**
 * ---------------------------------------------------------------------------
 * MAPA DOS PONTOS  (versao NATIVA: Android e iOS)
 * ---------------------------------------------------------------------------
 * O `react-native-maps` so existe no celular. No Expo Web ele quebra NA
 * IMPORTACAO ("codegenNativeComponent is not a function"), antes de qualquer
 * tela abrir. Por isso o mapa vive neste componente isolado:
 * Para o seu funcionamento, adicione uma chave do Maps no app.json (Não é utilizado para pedidos!)
 * ---------------------------------------------------------------------------
 */
import { useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { cores } from '../lib/tema';
import { Coordenada, PontoRetirada } from '../types/localizacao';

export type MapaPontosProps = {
  pontos: PontoRetirada[];
  /** Posicao da pessoa, ou null (sem permissao / sem GPS). */
  posicao: Coordenada | null;
  selecionadoId: string | null;
  aoSelecionar: (id: string) => void;
};

/** Usado so ate o mapa enquadrar os pontos (Sao Paulo). */
const REGIAO_INICIAL = {
  latitude: -23.55,
  longitude: -46.63,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

const MARGEM = { top: 60, right: 60, bottom: 60, left: 60 };

/**
 * No ANDROID o mapa e do Google e exige uma chave dentro do app. Sem ela o
 * `<MapView>` derruba a tela ("API key not found ... AndroidManifest.xml").
 * No iOS o mapa e o da Apple e nao precisa de chave.
 *
 * A chave mora em `android.config.googleMaps.apiKey` do app.json. Lemos dali
 * (e nao de uma variavel a parte) para a checagem e o manifesto nativo
 * olharem a MESMA fonte. O texto "COLE_A_CHAVE..." e o valor de exemplo do
 * app.json: enquanto ele estiver la, tratamos como "sem chave".
 */
const chaveDoMapa = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
const TEM_CHAVE_DO_MAPA =
  Platform.OS !== 'android' || Boolean(chaveDoMapa && !chaveDoMapa.startsWith('COLE_'));

export function MapaPontos(props: MapaPontosProps) {
  if (!TEM_CHAVE_DO_MAPA) {
    return (
      <View style={e.semMapa}>
        <Text style={e.semMapaTexto}>Mapa indisponivel neste aparelho.</Text>
        <Text style={e.semMapaTexto}>Use a lista abaixo para escolher o ponto.</Text>
      </View>
    );
  }
  return <MapaNativo {...props} />;
}

function MapaNativo({ pontos, posicao, selecionadoId, aoSelecionar }: MapaPontosProps) {
  const mapaRef = useRef<MapView>(null);
  const [pronto, setPronto] = useState(false);

  // Enquadra todos os pontos (+ a pessoa, se houver posicao).
  useEffect(() => {
    if (!pronto || pontos.length === 0) return;
    const coordenadas = pontos.map((p) => p.coordinate);
    if (posicao) coordenadas.push(posicao);
    mapaRef.current?.fitToCoordinates(coordenadas, { edgePadding: MARGEM, animated: true });
  }, [pronto, pontos, posicao]);

  // Tocou num cartao da lista: o mapa vai ate o ponto.
  useEffect(() => {
    if (!pronto || !selecionadoId) return;
    const ponto = pontos.find((p) => p.id === selecionadoId);
    if (!ponto) return;
    mapaRef.current?.animateToRegion(
      {
        latitude: ponto.coordinate.latitude,
        longitude: ponto.coordinate.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      350,
    );
    // So reage a troca de selecao, nao a cada refetch da lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionadoId, pronto]);

  return (
    <MapView
      ref={mapaRef}
      style={e.mapa}
      initialRegion={REGIAO_INICIAL}
      showsUserLocation={posicao !== null}
      onMapReady={() => setPronto(true)}
    >
      {pontos.map((ponto) => (
        <Marker
          key={ponto.id}
          coordinate={ponto.coordinate}
          title={ponto.name}
          description={ponto.hours ?? undefined}
          pinColor={ponto.id === selecionadoId ? cores.primaria : undefined}
          onPress={() => aoSelecionar(ponto.id)}
        />
      ))}
    </MapView>
  );
}

const e = StyleSheet.create({
  mapa: { height: 260, width: '100%' },
  semMapa: {
    height: 120,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: cores.neutroClaro,
  },
  semMapaTexto: { fontSize: 13, color: cores.textoFraco, textAlign: 'center' },
});