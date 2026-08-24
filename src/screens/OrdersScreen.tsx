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
      refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} />}
      ListEmptyComponent={<Text style={styles.empty}>Você ainda não fez pedidos.</Text>}
      renderItem={({ item }) => (
        // Card clicável que leva aos detalhes do pedido selecionado
        <Pressable 
          style={styles.card} 
          onPress={() => navigation.navigate('Order', { id: item.id })}
        >
          <View style={styles.top}>
            {/* Exibe apenas os últimos 6 caracteres do ID para não poluir visualmente */}
            <Text style={styles.pedido}>#{item.id.slice(-6)}</Text>
            {/* Badge com rótulo amigável ("Aguardando pagamento", "Pago") e cor semântica */}
            <Badge label={statusLabel(item.status)} color={statusColor(item.status)} />
          </View>

          {/* Quantidade de itens e valor total formatado em moeda */}
          <Text style={styles.sub}>
            {item.items.length} {item.items.length === 1 ? 'item' : 'itens'} · {money(item.total)}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 12, gap: 10 },
  card: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, gap: 6 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pedido: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 13, color: '#6b7280' },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 40 },
});
