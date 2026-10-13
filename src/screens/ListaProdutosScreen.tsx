/**
 * ---------------------------------------------------------------------------
 * TELA: LISTAGEM
 * ---------------------------------------------------------------------------
 * Demonstra os QUATRO ESTADOS de uma tela que busca dados do servidor:
 * carregando, erro, vazio e sucesso.
 *
 * E demonstra a busca com debounce: enquanto ha termo, a tela mostra o
 * resultado da busca; sem termo, mostra a listagem normal.
 * ---------------------------------------------------------------------------
 */

import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CampoBusca } from '../components/CampoBusca';
import { CardProduto } from '../components/CardProduto';
import { EstadoCarregando } from '../components/EstadoCarregando';
import { EstadoErro } from '../components/EstadoErro';
import { EstadoVazio } from '../components/EstadoVazio';
import { useFavoritos } from '../contexts/FavoritosContext';
import { useAnimacoes } from '../contexts/AnimacoesContext';
import { ehAppError } from '../errors/AppError';
import { useDebounce } from '../hooks/useDebounce';
import { useBuscaProdutos, useProdutos } from '../hooks/useProdutos';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AppStackParamList, 'ListaProdutos'>;

export function ListaProdutosScreen({ navigation }: Props) {
  const { animacoesAtivas } = useAnimacoes();
  const [termo, setTermo] = useState('');

  // O termo so chega a API 400ms depois da ultima tecla.
  const termoAtrasado = useDebounce(termo, 400);
  const buscando = termoAtrasado.trim().length >= 2;

  /**
   * As DUAS queries sao declaradas sempre.
   *
   * Hook nao pode ficar dentro de `if` — a ordem das chamadas precisa ser a
   * mesma em todo render. Quem decide se a busca roda e o `enabled` dentro de
   * `useBuscaProdutos`, nao um `if` aqui.
   */
  const listagem = useProdutos(20);
  const busca = useBuscaProdutos(termoAtrasado);
  const { alternarFavorito, ehFavorito } = useFavoritos();

  // A tela usa uma fonte ou outra, dependendo de haver termo de busca.
  const consulta = buscando ? busca : listagem;
  const { data, isPending, isError, error, refetch, isFetching } = consulta;

  function conteudo() {
    // ---- ESTADO 1: carregando -------------------------------------------
    // `isPending`, e nao `isFetching`: com isFetching a tela piscaria inteira
    // a cada revalidacao em segundo plano.
    if (isPending) {
      return (
        <EstadoCarregando mensagem={buscando ? 'Buscando...' : 'Carregando produtos...'} />
      );
    }

    // ---- ESTADO 2: erro --------------------------------------------------
    // Vem ANTES do teste de lista vazia. Se a ordem fosse invertida, uma
    // falha de rede mostraria "nenhum produto" e o usuario concluiria que a
    // loja esta vazia, quando o problema e o wi-fi dele.
    if (isError) {
      return (
        <EstadoErro
          mensagem={ehAppError(error) ? error.mensagem : 'Algo inesperado aconteceu.'}
          aoTentarNovamente={() => refetch()}
        />
      );
    }

    // ---- ESTADO 3: vazio -------------------------------------------------
    if (data.length === 0) {
      return (
        <EstadoVazio
          mensagem={
            buscando
              ? `Nenhum produto encontrado para "${termoAtrasado}".`
              : 'Esta loja ainda nao tem produtos publicados.'
          }
        />
      );
    }

    // ---- ESTADO 4: sucesso -----------------------------------------------
    return (
      <FlatList
        data={data}
        extraData={animacoesAtivas}
        keyExtractor={(item) => item.id}
        // `isFetching` aqui, e nao `isPending`: queremos o indicador girando
        // durante a revalidacao, sem esconder a lista que ja esta na tela.
        refreshing={isFetching}
        onRefresh={refetch}
        renderItem={({ item, index }) => (
          <CardProduto
            indice={index}
            produto={item}
            ehFavorito={ehFavorito(item.id)}
            aoFavoritar={alternarFavorito}
            aoPressionar={(id) =>
              navigation.navigate('DetalheProduto', { id, nome: item.name })
            }
          />
        )}
        contentContainerStyle={e.lista}
        // Sem isto, o primeiro toque depois de digitar so fecha o teclado —
        // o usuario precisa tocar duas vezes para abrir um produto.
        keyboardShouldPersistTaps="handled"
      />
    );
  }

  return (
    <View style={e.container}>
      <CampoBusca valor={termo} aoMudar={setTermo} />

      {/* O atalho para os salvos some durante a busca, para nao competir
          com o resultado. */}
      {!buscando && (
        <Pressable style={e.atalho} onPress={() => navigation.navigate('Favoritos')}>
          <Text style={e.atalhoTexto}>{'★  Meus salvos'}</Text>
        </Pressable>
      )}

      {conteudo()}
    </View>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  lista: { padding: 16, paddingTop: 12 },
  atalho: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: cores.primariaClara,
    borderRadius: 10,
  },
  atalhoTexto: { color: cores.primariaEscura, fontWeight: '700', fontSize: 15 },
});
