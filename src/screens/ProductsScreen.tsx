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
      {/* Cabeçalho Azul com Marca e Barra de Busca */}
      <View style={styles.topHeader}>
        {/* Brand Header */}
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>📖</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>{theme.storeName}</Text>
            <Text style={styles.brandSubtitle}>Encontre seu próximo livro</Text>
          </View>
        </View>

        {/* Barra de Pesquisa */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.search}
            placeholder="O que você está procurando?"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch} // A cada letra digitada, o React Query dispara nova busca
            autoCorrect={false}      // Desativa o corretor automático do teclado
          />
        </View>

        {/* Botões de Acesso Rápido a Pedidos e Carrinho */}
        <View style={styles.actionRow}>
          <Pressable
            style={styles.actionBtnOutline}
            onPress={() => navigation.navigate('Orders')}
          >
            <Text style={styles.actionBtnTextOutline}>📦 Pedidos</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtnFilled}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.actionBtnTextFilled}>🛒 Carrinho</Text>
          </Pressable>
        </View>
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
              colors={[theme.colors.primary]}
            />
          }

          // Componente exibido automaticamente quando nenhum produto for encontrado
          ListEmptyComponent={<Text style={styles.empty}>Nenhum livro encontrado.</Text>}

          // Renderização de cada card de produto
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('ProductDetail', { id: item.id, name: item.name })} // Ao clicar no card, navega para a tela de Detalhes passando ID e Nome
            >
              {/* Foto do Produto ou Miniatura de Livro com Lombada */}
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.thumb} />
              ) : (
                <View style={styles.bookPlaceholder}>
                  <View style={styles.bookSpine} />
                  <Text style={{ fontSize: 24 }}>📖</Text>
                </View>
              )}

              {/* Informações do Produto (Nome, Marca e Preço) */}
              <View style={styles.cardBody}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                
                {item.brand ? <Text style={styles.brand}>{item.brand}</Text> : null}
                
                {/* Badge com faixa de preço */}
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>
                    {/* Se o preço de todas as variações for igual, mostra valor único. Senão, mostra a faixa de preço */}
                    {item.priceFrom === item.priceTo
                      ? money(item.priceFrom)
                      : `${money(item.priceFrom)} – ${money(item.priceTo)}`}
                  </Text>
                </View>
              </View>

              {/* Seta indicativa de navegação */}
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light },
  topHeader: {
    backgroundColor: theme.colors.primary,
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 14,
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 26,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#e0f2fe',
    marginTop: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  search: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.dark,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnOutline: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: theme.radius.full,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnTextOutline: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtnFilled: {
    flex: 1,
    backgroundColor: '#0d9488',
    borderRadius: theme.radius.full,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnTextFilled: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  list: { padding: 14, gap: 12, paddingBottom: 28 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.greyLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
  },
  bookPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: theme.colors.primary,
  },
  cardBody: { flex: 1, justifyContent: 'center', gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: theme.colors.dark },
  brand: { fontSize: 12, color: theme.colors.greyDark },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.mintLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    marginTop: 2,
  },
  priceText: { fontSize: 13, fontWeight: '800', color: theme.colors.mintDark },
  chevron: { fontSize: 24, fontWeight: '600', color: '#94a3b8', paddingRight: 4 },
  empty: { textAlign: 'center', color: theme.colors.greyDark, marginTop: 40, fontSize: 14 },
});
