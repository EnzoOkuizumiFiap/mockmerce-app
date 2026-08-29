import { useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProducts } from '@/hooks/useProducts';
import { money } from '@/lib/format';
import { Button, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';
import { theme } from '@/lib/theme';

// Tipagem das propriedades de navegação da tela de Listagem de Produtos
type Props = NativeStackScreenProps<RootStackParamList, 'Products'>;

/**
 * ============================================================================
 * TELA: ProductsScreen (Catálogo Principal de Produtos)
 * ============================================================================
 * 
 * Funcionalidades principais:
 * 1. Campo de busca por texto em tempo real (com cache automático pelo React Query).
 * 2. Listagem virtualizada em FlatList com suporte a "Puxar para Atualizar" (Pull-to-Refresh).
 * 3. Exibição de faixa de preço (ex: "R$ 50,00 – R$ 80,00" para produtos com variações).
 * 4. Navegação para a tela de Detalhes do Produto e tela do Carrinho.
 */
export function ProductsScreen({ navigation }: Props) {
  // Estado local para o texto digitado na barra de pesquisa
  const [search, setSearch] = useState('');

  // Busca a lista de produtos passando o filtro de pesquisa atual
  // - data: Resposta paginada com a lista de produtos
  // - isLoading: True apenas no primeiro carregamento (sem cache)
  // - isFetching: True sempre que houver requisição rodando em segundo plano
  // - refetch: Função para forçar uma nova busca
  const { data, isLoading, isError, error, refetch, isFetching } = useProducts({ search });

  return (
    <View style={styles.container}>
      {/* Barra de Pesquisa e Botões de Acesso Rápido a Pedidos e Carrinho */}
      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="Buscar produto…"
          value={search}
          onChangeText={setSearch} // A cada letra digitada, o React Query dispara nova busca
          autoCorrect={false}      // Desativa o corretor automático do teclado
        />
        <Button label="Pedidos" variant="ghost" onPress={() => navigation.navigate('Orders')} />
        <Button label="Carrinho" variant="ghost" onPress={() => navigation.navigate('Cart')} />
      </View>

      {/* Renderização Condicional: Loading vs Erro vs Lista de Produtos */}
      {isLoading ? (
        // 1. Carregamento inicial da tela
        <Loading label="Buscando produtos…" />
      ) : isError ? (
        // 2. Estado de erro na API com botão de tentar novamente
        <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />
      ) : (
        // 3. Lista Virtualizada de Produtos
        <FlatList
          data={data?.data ?? []} // data.data é o array de produtos da resposta paginada
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          
          // Gesto de "Puxar para Atualizar" (Pull-to-Refresh nativo)
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading} // Gira o spinner apenas em recargas secundárias
              onRefresh={() => refetch()}           // Dispara a revalidação dos dados
            />
          }

          // Componente exibido automaticamente quando nenhum produto for encontrado
          ListEmptyComponent={<Text style={styles.empty}>Nenhum produto encontrado.</Text>}

          // Renderização de cada card de produto
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('ProductDetail', { id: item.id, name: item.name })} // Ao clicar no card, navega para a tela de Detalhes passando ID e Nome
            >
              {/* Foto do Produto ou Placeholder cinza se não tiver imagem */}
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]} />
              )}

              {/* Informações do Produto (Nome, Marca e Preço) */}
              <View style={styles.cardBody}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                
                {item.brand && <Text style={styles.brand}>{item.brand}</Text>}
                
                <Text style={styles.price}>
                  {/* Se o preço de todas as variações for igual, mostra valor único. Senão, mostra a faixa de preço */}
                  {item.priceFrom === item.priceTo
                    ? money(item.priceFrom)
                    : `${money(item.priceFrom)} – ${money(item.priceTo)}`}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', gap: 8, padding: 12, alignItems: 'center' },
  search: {
    flex: 1,
    borderWidth: 1,
    borderBottomWidth: 4,
    borderColor: theme.colors.greyLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  list: { paddingHorizontal: 12, paddingBottom: 24, gap: 10 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: theme.colors.secondaryLight, borderRadius: 12, padding: 10 },
  thumb: { width: 72, height: 72, borderRadius: 8, backgroundColor: theme.colors.secondaryDark },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, justifyContent: 'center', gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: theme.colors.dark },
  brand: { fontSize: 12, color: theme.colors.light },
  price: { fontSize: 15, fontWeight: '700', color: theme.colors.dark, marginTop: 2 },
  empty: { textAlign: 'center', color: theme.colors.secondaryDark, marginTop: 40 },
});
