/**
 * ============================================================================
 * TELA DE FAVORITOS (FavoritesScreen.tsx - Lista de Desejos do Comprador)
 * ============================================================================
 * 
 * Exibe a lista de obras e produtos favoritados pelo comprador logado:
 * 1. Consome o hook `useFavorites()` alimentado por `GET /customers/me/favorites`.
 * 2. Trata os 4 estados de UI exigidos: Carregando, Erro, Vazio e Sucesso.
 * 3. Suporta remoção com invalidação automática de cache via `useRemoveFavorite()`.
 * 4. Permite adicionar o livro favoritado diretamente ao carrinho de compras.
 * 
 * 💡 CONCEITO DIDÁTICO: POR QUE TRATAR OS 4 ESTADOS DE UI?
 * Uma aplicação mobile de alta qualidade nunca deixa o usuário no escuro:
 * - Se a internet estiver lenta -> Mostramos o indicador de carregamento (`<Loading />`).
 * - Se a API falhar -> Mostramos a mensagem em português com botão de recarregar (`<ErrorState />`).
 * - Se a lista estiver zerada -> Mostramos o card explicativo amigável (`ListEmptyComponent`).
 * - Se houver dados -> Renderizamos a `FlatList` com cards otimizados.
 */

import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites';
import { useCartMutations } from '@/hooks/useCartMutations';
import { money } from '@/lib/format';
import { BookIcon, Button, Card, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError, FavoriteItem } from '@/types/api';
import { theme } from '@/lib/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

export function FavoritesScreen({ navigation }: Props) {
  // Consulta a lista de favoritos através do TanStack Query
  const { data: favorites, isLoading, isError, error, refetch, isFetching } = useFavorites();
  
  // Hook de mutação para remover item dos favoritos
  const removeMut = useRemoveFavorite();
  
  // Hook de mutação para adicionar o livro diretamente ao carrinho de compras
  const { addItem } = useCartMutations();

  // 1. Estado de Carregamento inicial de tela cheia (quando o cache está vazio)
  if (isLoading) return <Loading label="Carregando favoritos…" />;

  // 2. Estado de Erro na API com botão para o usuário tentar novamente (refetch)
  if (isError) return <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />;

  const items = favorites ?? [];

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(item) => item.variantId}
      contentContainerStyle={styles.list}
      /**
       * Gesto "Puxar para Atualizar" (Pull-to-Refresh):
       * `refreshing={isFetching && !isLoading}` ativa a animação giratória apenas
       * durante recargas manuais do usuário, sem disparar a tela cheia de loading.
       */
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={() => refetch()}
          colors={[theme.colors.primary]}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Meus Favoritos ❤️</Text>
          <Text style={styles.subtitle}>
            Livros e edições que você salvou para ler ou comprar mais tarde
          </Text>
        </View>
      }
      // 3. Estado Vazio tratado amigavelmente com ilustração e botão de ação
      ListEmptyComponent={
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyTitle}>Sua lista de favoritos está vazia</Text>
          <Text style={styles.emptySubtitle}>
            Toque no coração ao navegar pelos livros do catálogo para guardá-los aqui.
          </Text>
          <Button
            label="Explorar Catálogo"
            variant="secondary"
            onPress={() => navigation.navigate('Products')}
            style={styles.exploreBtn}
          />
        </Card>
      }
      // 4. Estado de Sucesso: renderização de cada card de livro favoritado
      renderItem={({ item }: { item: FavoriteItem }) => {
        const displayName = item.productName || item.name || 'Livro Sem Título';
        const displayPrice = item.price ? money(item.price) : 'Consulte';

        return (
          <Card style={styles.card}>
            <View style={styles.topRow}>
              {/* Miniatura reutilizável com ícone e lombada de livro */}
              <BookIcon size="md" />
              
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>
                  {displayName}
                </Text>
                {item.variantName ? (
                  <Text style={styles.variant}>{item.variantName}</Text>
                ) : null}
                <Text style={styles.price}>{displayPrice}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.actionsRow}>
              {/* Botão de remoção rápida */}
              <Pressable
                onPress={() => removeMut.mutate(item.variantId)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeText}>
                  {removeMut.isPending ? 'Removendo…' : '🗑️ Remover'}
                </Text>
              </Pressable>

              {/* Botão para mover dos favoritos diretamente para o carrinho */}
              <Button
                label={addItem.isPending ? 'Adicionando…' : '🛒 Comprar'}
                variant="primary"
                onPress={() =>
                  addItem.mutate({
                    variantId: item.variantId,
                    quantity: 1,
                    name: displayName,
                    unitPrice: item.price ?? 0,
                  })
                }
                style={styles.buyBtn}
              />
            </View>
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light },
  list: { padding: 16, gap: 14, paddingBottom: 32 },
  header: { marginBottom: 4, gap: 2 },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.dark },
  subtitle: { fontSize: 13, color: theme.colors.greyDark, marginBottom: 8 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.greyLight,
  },
  topRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: theme.colors.dark, lineHeight: 22 },
  variant: { fontSize: 12, color: theme.colors.greyDark, fontWeight: '500' },
  price: { fontSize: 16, fontWeight: '800', color: theme.colors.mintDark, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  removeBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  removeText: { fontSize: 13, fontWeight: '600', color: theme.colors.danger },
  buyBtn: { paddingVertical: 8, paddingHorizontal: 18, minHeight: 38 },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.dark, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: theme.colors.greyDark, textAlign: 'center', lineHeight: 18 },
  exploreBtn: { marginTop: 8, width: '100%' },
});
