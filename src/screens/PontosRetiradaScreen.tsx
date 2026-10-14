/**
 * ---------------------------------------------------------------------------
 * TELA: PONTOS DE RETIRADA (mapa)
 * ---------------------------------------------------------------------------
 * Mapa em cima, lista embaixo, ordenada pela distancia de quem esta olhando.
 *
 * O ASSUNTO DESTA TELA NAO E O MAPA — e o que acontece quando o GPS NAO
 * responde. Desenhar marcador e facil; o que separa um app publicavel de um
 * exercicio e tratar os tres estados:
 *
 *   status 'ok'      -> lista ordenada, com "2,9 km" em cada ponto
 *   status 'negada'  -> mesma lista, sem distancia, com um aviso discreto
 *   status 'erro'    -> mesma lista, sem distancia, com botao de tentar de novo
 *
 * Nos tres casos A LISTA APARECE. Essa e a regra: a permissao melhora a tela,
 * nao decide se ela existe.
 * ---------------------------------------------------------------------------
 */
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { EstadoCarregando } from '../components/EstadoCarregando';
import { EstadoErro } from '../components/EstadoErro';
import { EstadoVazio } from '../components/EstadoVazio';
import { ehAppError } from '../errors/AppError';
import { usePontosRetirada } from '../hooks/usePontosRetirada';
import { cores } from '../lib/tema';
import { Coordenada, PontoRetirada } from '../types/localizacao';

/** Centro de Sao Paulo — so para o mapa nascer em algum lugar plausivel. */
const REGIAO_PADRAO = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

/** Endereco em uma linha, pulando o que a loja deixou em branco. */
function enderecoResumido(ponto: PontoRetirada): string {
  const { street, number, district, city } = ponto.address;
  return [[street, number].filter(Boolean).join(', '), district, city]
    .filter(Boolean)
    .join(' - ');
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
    tentarLocalizacaoNovamente,
  } = usePontosRetirada();

  const pontos = useMemo(() => data?.data ?? [], [data?.data]);

  /**
   * A regiao inicial do mapa.
   *
   * Prioridade: onde o usuario esta > o primeiro ponto da loja > Sao Paulo.
   * `useMemo` porque `initialRegion` so e lido no primeiro render — recalcular
   * a cada render seria trabalho jogado fora.
   */
  const regiaoInicial = useMemo(() => {
    const alvo: Coordenada | undefined = posicao ?? pontos[0]?.coordinate;
    if (!alvo) return REGIAO_PADRAO;
    return {
      latitude: alvo.latitude,
      longitude: alvo.longitude,
      // ~5 km de area visivel: perto o bastante para ver ruas, longe o
      // bastante para caber mais de um ponto.
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [posicao, pontos]);

  if (isPending) return <EstadoCarregando mensagem="Buscando livrarias e pontos de retirada..." />;

  if (isError) {
    return (
      <EstadoErro
        mensagem={ehAppError(error) ? error.mensagem : 'Não foi possível carregar os pontos de retirada.'}
        aoTentarNovamente={() => refetch()}
      />
    );
  }

  if (pontos.length === 0) {
    return <EstadoVazio mensagem="Esta livraria ainda não possui pontos de retirada parceiros." />;
  }

  return (
    <View style={e.container}>
      <MapView
        style={e.mapa}
        initialRegion={regiaoInicial}
        /**
         * Mostra o ponto azul do usuario. So funciona com permissao — sem
         * ela o mapa simplesmente nao desenha o ponto, sem quebrar nada.
         */
        showsUserLocation={statusLocalizacao === 'ok'}
      >
        {pontos.map((ponto) => (
          <Marker
            key={ponto.id}
            // A API ja devolve no formato que o Marker espera. Nada a converter.
            coordinate={ponto.coordinate}
            title={`📖 ${ponto.name}`}
            description={
              ponto.distanceKm !== null
                ? `${ponto.distanceKm} km de você`
                : enderecoResumido(ponto)
            }
          />
        ))}
      </MapView>

      {/* O aviso so existe quando ha algo a avisar. */}
      {statusLocalizacao === 'negada' ? (
        <View style={e.aviso}>
          <Text style={e.avisoTexto}>
            📍 Sem permissão de localização, os pontos de retirada aparecem em ordem alfabética.
          </Text>
        </View>
      ) : null}

      {statusLocalizacao === 'erro' ? (
        <Pressable style={e.aviso} onPress={tentarLocalizacaoNovamente}>
          <Text style={e.avisoTexto}>
            📍 Não conseguimos sua localização. Toque para tentar de novo.
          </Text>
        </Pressable>
      ) : null}

      <FlatList
        data={pontos}
        keyExtractor={(ponto) => ponto.id}
        contentContainerStyle={e.lista}
        renderItem={({ item }) => (
          <View style={e.card}>
            <View style={e.linhaTitulo}>
              <Text style={e.nome}>📚 {item.name}</Text>

              {/* Sem posicao, distanceKm e null — e o badge some. */}
              {item.distanceKm !== null ? (
                <Text style={e.distancia}>{item.distanceKm} km</Text>
              ) : null}
            </View>

            {enderecoResumido(item) ? (
              <Text style={e.endereco}>{enderecoResumido(item)}</Text>
            ) : null}

            {item.hours ? <Text style={e.horario}>🕒 {item.hours}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  mapa: { height: 260, width: '100%' },
  aviso: { backgroundColor: cores.primariaClara, padding: 10 },
  avisoTexto: { fontSize: 12, color: cores.primariaEscura, textAlign: 'center' },
  lista: { padding: 16, gap: 10 },
  card: {
    backgroundColor: cores.superficie,
    borderRadius: 12,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  linhaTitulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  nome: { fontSize: 15, fontWeight: '600', color: cores.textoForte, flexShrink: 1 },
  distancia: {
    fontSize: 12, fontWeight: '600', color: cores.primariaEscura,
    backgroundColor: cores.primariaClara, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    overflow: 'hidden',
  },
  endereco: { fontSize: 13, color: cores.texto },
  horario: { fontSize: 12, color: cores.textoFraco },
});
