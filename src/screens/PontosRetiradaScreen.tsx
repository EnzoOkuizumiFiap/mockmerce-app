/**
 * ---------------------------------------------------------------------------
 * TELA: ONDE RETIRAR
 * ---------------------------------------------------------------------------
 * Mapa em cima, lista embaixo. Os dois mostram os mesmos pontos.
 *
 * A TELA FUNCIONA SEM A PERMISSAO. Se a pessoa negou o GPS:
 *   - o mapa e a lista continuam aparecendo (a API ordena por nome);
 *   - o <AvisoLocalizacao /> explica e oferece "tentar de novo";
 *   - so o selo de distancia some dos cartoes.
 *
 * Estados obtendo localizacao / carregando / erro / vazio / lista.
 *
 * Os pontos de retirada SAO os enderecos da loja: cada marcador no mapa e um
 * lugar fisico onde a loja entrega o pedido.
 *
 * A LOJA NO MAPA (RF-46): a localizacao da loja vem de um hook separado
 * (useLocalizacaoLoja). Ela e dado de apoio: se falhar ou nao tiver coordenada,
 * `loja` fica vazia e a tela segue normal, so sem o marcador da loja.
 * ---------------------------------------------------------------------------
 */
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AvisoLocalizacao } from '../components/AvisoLocalizacao';
import { CartaoPontoRetirada } from '../components/CartaoPontoRetirada';
import { EstadoCarregando } from '../components/EstadoCarregando';
import { EstadoErro } from '../components/EstadoErro';
import { MapaPontos } from '../components/MapaPontos';
import { ehAppError } from '../errors/AppError';
import { useLocalizacaoLoja } from '../hooks/useLocalizacaoLoja';
import { usePontosRetirada } from '../hooks/usePontosRetirada';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';
import { PontoRetirada } from '../types/localizacao';

type Props = NativeStackScreenProps<AppStackParamList, 'PontosRetirada'>;

export function PontosRetiradaScreen(_props: Props) {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    posicao,
    statusLocalizacao,
    podePerguntarDeNovo,
    tentarLocalizacaoNovamente,
    aguardandoLocalizacao,
  } = usePontosRetirada();

  // Opcional: erro ou loja sem coordenada nao derrubam a tela (so some o marcador).
  const { data: loja } = useLocalizacaoLoja();

  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  const pontos: PontoRetirada[] = (data?.data ?? []).filter((p) => p.active);

  // ---- Estados ------------------------------------------------------------
  if (aguardandoLocalizacao) return <EstadoCarregando mensagem="Obtendo sua localizacao..." />;

  if (isPending && !isError) return <EstadoCarregando mensagem="Buscando pontos de retirada..." />;

  // So tomamos a tela inteira quando NAO ha nada para mostrar. Com dados em
  // cache (placeholderData), um erro de rede nao esconde a lista.
  if (isError && !data) {
    return (
      <EstadoErro
        mensagem={ehAppError(error) ? error.mensagem : 'Algo inesperado aconteceu.'}
        aoTentarNovamente={() => refetch()}
      />
    );
  }

  return (
    <View style={e.container}>
      <MapaPontos
        pontos={pontos}
        posicao={posicao}
        loja={loja ?? null}
        selecionadoId={selecionadoId}
        aoSelecionar={setSelecionadoId}
      />

      <FlatList
        style={e.lista}
        contentContainerStyle={e.listaConteudo}
        data={pontos}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <AvisoLocalizacao
            status={statusLocalizacao}
            podePerguntarDeNovo={podePerguntarDeNovo}
            aoTentarNovamente={tentarLocalizacaoNovamente}
          />
        }
        ListEmptyComponent={
          <Text style={e.vazio}>A loja ainda nao tem pontos de retirada.</Text>
        }
        ListFooterComponent={
          statusLocalizacao === 'obtendo' ? (
            <ActivityIndicator style={e.carregandoRodape} color={cores.primaria} />
          ) : null
        }
        renderItem={({ item }) => (
          <CartaoPontoRetirada
            ponto={item}
            selecionado={item.id === selecionadoId}
            aoPressionar={() => setSelecionadoId(item.id)}
          />
        )}
      />
    </View>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  lista: { flex: 1 },
  listaConteudo: { padding: 16, gap: 10 },
  vazio: { textAlign: 'center', color: cores.textoFraco, fontSize: 14, marginTop: 24 },
  carregandoRodape: { marginTop: 8 },
});