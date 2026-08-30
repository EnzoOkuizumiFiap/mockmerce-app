import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCart } from '@/hooks/useCart';
import { useCartMutations } from '@/hooks/useCartMutations';
import { useSession } from '@/session/session';
import { money } from '@/lib/format';
import { Button, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';
import { theme } from '@/lib/theme';

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
            <Text style={styles.mainTitle}>Meu carrinho</Text>
            <Text style={styles.subTitle}>
              {items.length
                ? 'Revise seus produtos antes de finalizar'
                : `Olá, ${customer?.name ?? 'leitor'}. Seu carrinho está vazio.`}
            </Text>

            {/* Acesso rápido a catálogo, favoritos e histórico de pedidos */}
            <View style={styles.quickNav}>
              <Button
                label="📚 Livros"
                variant="ghost"
                onPress={() => navigation.navigate('Products')}
              />
              <Button
                label="❤️ Favoritos"
                variant="ghost"
                onPress={() => navigation.navigate('Favorites')}
              />
              <Button
                label="📦 Pedidos"
                variant="ghost"
                onPress={() => navigation.navigate('Orders')}
              />
            </View>
          </View>
        }

        // Desenha cada item individual do carrinho
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            {/* Miniatura do Livro */}
            <View style={styles.thumbBox}>
              <View style={styles.thumbSpine} />
              <Text style={{ fontSize: 24 }}>📖</Text>
            </View>

            {/* Informações do Produto (Nome, SKU e Preço Unitário) */}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              {item.sku ? <Text style={styles.sku}>{item.sku}</Text> : null}
              <Text style={styles.unitPrice}>{money(item.unitPrice)} / un.</Text>
            </View>

            {/* Controle de Quantidade, Subtotal e Remoção */}
            <View style={styles.rightActions}>
              {/* Stepper de Quantidade (- 1 +) */}
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setQuantity.mutate({ variantId: item.variantId, quantity: item.quantity - 1 })}
                >
                  <Text style={styles.stepperSymbol}>−</Text>
                </Pressable>
                
                <Text style={styles.stepperQty}>{item.quantity}</Text>
                
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setQuantity.mutate({ variantId: item.variantId, quantity: item.quantity + 1 })}
                >
                  <Text style={styles.stepperSymbol}>+</Text>
                </Pressable>
              </View>

              {/* Subtotal do item */}
              <Text style={styles.itemSubtotal}>{money(item.subtotal)}</Text>

              {/* Botão Remover */}
              <Pressable onPress={() => removeItem.mutate(item.variantId)}>
                <Text style={styles.removeText}>Remover</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* Rodapé Fixo (Exibe Total e Botão de Finalizar Compra) */}
      {items.length > 0 && (
        <View style={styles.stickyFooter}>
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total da compra</Text>
              <Text style={styles.totalCount}>
                {items.length} {items.length === 1 ? 'produto' : 'produtos'}
              </Text>
            </View>
            <Text style={styles.totalAmount}>{money(cart?.total ?? 0)}</Text>
          </View>

          <Button
            label="Finalizar compra"
            onPress={() => navigation.navigate('Checkout')}
          />
        </View>
      )}

      {/* Botão para deslogar da conta */}
      <View style={styles.signoutBox}>
        <Button label="Sair da conta" variant="ghost" onPress={signOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light },
  list: { padding: 14, gap: 12, paddingBottom: 24 },
  header: { marginBottom: 8, gap: 4 },
  mainTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.dark },
  subTitle: { fontSize: 13, color: theme.colors.greyDark, marginBottom: 8 },
  quickNav: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  thumbBox: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  thumbSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: theme.colors.primary,
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: theme.colors.dark },
  sku: { fontSize: 11, fontWeight: '600', color: theme.colors.greyDark },
  unitPrice: { fontSize: 12, color: theme.colors.greyDark },
  rightActions: { alignItems: 'flex-end', gap: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: theme.radius.full,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  stepperSymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  stepperQty: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark,
    minWidth: 20,
    textAlign: 'center',
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    marginTop: 2,
  },
  removeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.error,
  },
  stickyFooter: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.dark,
  },
  totalCount: {
    fontSize: 12,
    color: theme.colors.greyDark,
    marginTop: 1,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  signoutBox: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: theme.colors.light,
  },
});
