/**
 * ============================================================================
 * TELA DE HISTÓRICO DE PEDIDOS (SEMANA 3 - OrdersScreen.tsx)
 * ============================================================================
 * 
 * Exibe a listagem completa de compras anteriores do usuário logado:
 * 1. Busca os pedidos via `useOrders()` (GET /orders).
 * 2. Suporta funcionalidade "Puxe para Atualizar" (Pull-to-Refresh) com `RefreshControl`.
 * 3. Renderiza cards interativos com o número resumido do pedido, badge de status e valor total.
 * 4. Ao tocar em um card, navega para a tela de detalhes do pedido (`OrderScreen`).
 */

import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useOrders } from '@/hooks/useOrders';
import { statusColor, statusLabel } from '@/lib/orders';
import { money } from '@/lib/format';
import { Badge, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';
import { theme } from '@/lib/theme';

// Props de navegação tipadas para a rota 'Orders'
type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;

export function OrdersScreen({ navigation }: Props) {
  // Busca a lista de pedidos com useQuery
  const { data, isLoading, isError, error, refetch, isFetching } = useOrders();

  // 1. Carregamento inicial de tela cheia (quando o cache ainda está vazio)
  if (isLoading) return <Loading label="Carregando pedidos…" />;
  
  // 2. Estado de erro com possibilidade de tentar novamente via refetch()
  if (isError) return <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />;

  return (
    <FlatList
      style={styles.container}
      data={data ?? []}
      keyExtractor={(o) => o.id} // Identificador único de cada pedido
      contentContainerStyle={styles.list}
      /**
       * 💡 Por que `refreshing={isFetching && !isLoading}`?
       * - `isLoading`: É true apenas no primeiro carregamento (tela cheia).
       * - `isFetching`: É true sempre que uma requisição está em andamento (inclusive em background).
       * - A expressão `isFetching && !isLoading` ativa a animação giratória do Pull-to-Refresh
       *   somente quando o usuário arrasta a lista para baixo, sem disparar o spinner de tela cheia!
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
          <Text style={styles.title}>Meus Pedidos</Text>
          <Text style={styles.subtitle}>Acompanhe o status e histórico das suas compras</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Você ainda não fez nenhum pedido.</Text>}
      renderItem={({ item }) => (
        // Card clicável que leva aos detalhes do pedido selecionado
        <Pressable 
          style={styles.card} 
          onPress={() => navigation.navigate('Order', { id: item.id })}
        >
          <View style={styles.top}>
            <View style={styles.idBox}>
              <Text style={styles.idPrefix}>PEDIDO</Text>
              {/* Exibe apenas os últimos 6 caracteres do ID para não poluir visualmente */}
              <Text style={styles.pedido}>#{item.id.slice(-6).toUpperCase()}</Text>
            </View>
            {/* Badge com rótulo amigável ("Aguardando pagamento", "Pago") e cor semântica */}
            <Badge label={statusLabel(item.status)} color={statusColor(item.status)} />
          </View>

          <View style={styles.divider} />

          <View style={styles.bottomRow}>
            {/* Quantidade de itens */}
            <Text style={styles.itemCount}>
              📦 {item.items.length} {item.items.length === 1 ? 'item' : 'itens'}
            </Text>
            {/* Valor total formatado em moeda */}
            <Text style={styles.totalValue}>{money(item.total)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light },
  list: { padding: 14, gap: 12, paddingBottom: 28 },
  header: { marginBottom: 4, gap: 2 },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.dark },
  subtitle: { fontSize: 13, color: theme.colors.greyDark, marginBottom: 6 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.greyLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idBox: { gap: 1 },
  idPrefix: { fontSize: 10, fontWeight: '800', color: theme.colors.greyDark, letterSpacing: 0.5 },
  pedido: { fontSize: 16, fontWeight: '800', color: theme.colors.dark },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCount: { fontSize: 13, fontWeight: '600', color: theme.colors.greyDark },
  totalValue: { fontSize: 16, fontWeight: '800', color: theme.colors.primaryDark },
  empty: { color: theme.colors.greyDark, textAlign: 'center', marginTop: 40, fontSize: 14 },
});
