/**
 * ---------------------------------------------------------------------------
 * TELA: SALVOS (FAVORITOS)
 * ---------------------------------------------------------------------------
 * A tela que so existe por causa da persistencia local.
 *
 * TESTE OBRIGATORIO:
 *   1. Salve dois produtos
 *   2. Feche o app PELO GERENCIADOR DE APLICATIVOS (nao so volte para a tela
 *      inicial do celular — isso nao encerra o processo)
 *   3. Ative o modo aviao
 *   4. Reabra
 * Os dois continuam la, e a tela abre normalmente.
 * ---------------------------------------------------------------------------
 */

import { FlatList, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CardProduto } from '../components/CardProduto';
import { EstadoCarregando } from '../components/EstadoCarregando';
import { EstadoVazio } from '../components/EstadoVazio';
import { useFavoritos } from '../contexts/FavoritosContext';
import { useAnimacoes } from '../contexts/AnimacoesContext';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AppStackParamList, 'Favoritos'>;

export function FavoritosScreen({ navigation }: Props) {
  const { animacoesAtivas } = useAnimacoes();
  const { favoritos, carregando, alternarFavorito, ehFavorito } = useFavoritos();

  if (carregando) return <EstadoCarregando mensagem="Abrindo sua lista..." />;

  /**
   * Repare que NAO existe estado de erro aqui.
   *
   * Ler do disco local nao depende de rede, entao nao ha falha de rede para
   * tratar. Uma tela que le dados locais tem TRES estados, nao quatro — e
   * inventar um botao "tentar novamente" que releria o mesmo disco seria
   * teatro.
   */
  if (favoritos.length === 0) {
    return <EstadoVazio mensagem="Voce ainda nao salvou nenhum produto." />;
  }

  return (
    <View style={e.container}>
      <FlatList
        data={favoritos}
        extraData={animacoesAtivas}
        keyExtractor={(item) => item.id}
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
      />
    </View>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  lista: { padding: 16 },
});
