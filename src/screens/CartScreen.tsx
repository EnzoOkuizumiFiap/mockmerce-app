import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCart } from '@/hooks/useCart';
import { useCartMutations } from '@/hooks/useCartMutations';
import { useSession } from '@/session/session';
import { money } from '@/lib/format';
import { Button, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';

// Tipagem das propriedades de navegação da tela do Carrinho
type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

/**
 * ============================================================================
 * TELA: CartScreen (Tela do Carrinho de Compras)
 * ============================================================================
 * 
 * Esta tela reúne os pilares da aplicação:
 * 1. `useCart()`: Busca e sincroniza os dados do carrinho via TanStack Query.
 * 2. `useCartMutations()`: Dispara alterações otimistas de quantidade e remoção.
 * 3. `useSession()`: Exibe os dados do usuário autenticado e botão de logout.
 * 4. Navegação para Checkout (`navigation.navigate('Checkout')`) e Pedidos (`Orders`).
 */
export function CartScreen({ navigation }: Props) {
  // 1. Busca os dados do carrinho e seus estados de carregamento/erro
  const { data: cart, isLoading, isError, error, refetch } = useCart();

  // 2. Mutações para alterar quantidade e remover itens (com atualização instantânea/otimista)
  const { setQuantity, removeItem } = useCartMutations();

  // 3. Informações da sessão do usuário e função de logout
  const { customer, signOut } = useSession();

  // Estados de tela cheia para carregamento e erro
  if (isLoading) return <Loading label="Carregando carrinho…" />;
  if (isError) return <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />;

  const items = cart?.items ?? [];

  return (
    <View style={styles.container}>
      {/**
       * ======================================================================
       * COMPONENTE: FlatList
       * ======================================================================
       * Por que usamos FlatList e não ScrollView com .map()?
       * A FlatList é otimizada para listas longas no mobile. Ela renderiza apenas
       * os itens visíveis na tela, reciclando memória conforme o usuário rola.
       */}
      <FlatList
        data={items}                                // O array de dados a ser renderizado
        keyExtractor={(it) => it.variantId}         // Chave única para cada linha (evita bugs de renderização)
        contentContainerStyle={styles.list}         // Estilo interno do conteúdo com rolagem
        
        // Cabeçalho da Lista (rola junto com os itens)
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.hi}>
              Olá, {customer?.name}. {items.length ? '' : 'Seu carrinho está vazio.'}
            </Text>
            {/* Botão de atalho para a tela de histórico de pedidos do cliente */}
            <Button
              label="Meus Pedidos"
              variant="ghost"
              onPress={() => navigation.navigate('Orders')}
            />
          </View>
        }

        // Desenha cada item individual do carrinho
        renderItem={({ item }) => (
          <View style={styles.row}>
            {/* Informações do Produto (Nome, Preço Unitário e Subtotal) */}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.sub}>
                {money(item.unitPrice)} · subtotal {money(item.subtotal)}
              </Text>
            </View>

            {/* Controle de Quantidade (+ e -) */}
            <View style={styles.qtyBox}>
              {/* Botão Diminuir: Se chegar a 0, a mutation remove automaticamente */}
              <Text
                style={styles.qtyBtn}
                onPress={() => setQuantity.mutate({ variantId: item.variantId, quantity: item.quantity - 1 })}
              >
                −
              </Text>
              <Text style={styles.qty}>{item.quantity}</Text>
              {/* Botão Aumentar: Incrementa +1 na quantidade */}
              <Text
                style={styles.qtyBtn}
                onPress={() => setQuantity.mutate({ variantId: item.variantId, quantity: item.quantity + 1 })}
              >
                +
              </Text>
            </View>

            {/* Botão Remover: Exclui o item do carrinho */}
            <Text style={styles.remove} onPress={() => removeItem.mutate(item.variantId)}>
              remover
            </Text>
          </View>
        )}

        // Rodapé da Lista (Exibe Total e Botão de Navegar para o Checkout)
        ListFooterComponent={
          items.length ? (
            <View style={styles.footer}>
              <Text style={styles.total}>Total: {money(cart?.total ?? 0)}</Text>
              <Button
                label="Finalizar (checkout)"
                onPress={() => navigation.navigate('Checkout')}
              />
            </View>
          ) : null
        }
      />

      {/* Botão fixo no rodapé para deslogar da conta */}
      <View style={styles.signout}>
        <Button label="Sair da conta" variant="ghost" onPress={signOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 12, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hi: { flex: 1, fontSize: 14, color: '#374151', marginRight: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9fafb', borderRadius: 12, padding: 10 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  sub: { fontSize: 12, color: '#6b7280' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { fontSize: 20, fontWeight: '700', color: '#111827', paddingHorizontal: 6 },
  qty: { fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  remove: { fontSize: 12, color: '#b91c1c', marginLeft: 6 },
  footer: { marginTop: 16, gap: 10 },
  total: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'right' },
  signout: { padding: 12 },
});
