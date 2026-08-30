/**
 * ============================================================================
 * TELA DE CHECKOUT (SEMANA 3 - CheckoutScreen.tsx)
 * ============================================================================
 * 
 * Esta tela representa a etapa de revisão e fechamento da compra:
 * 1. Exibe os itens atuais do carrinho e o valor total acumulado.
 * 2. Ao clicar em "Confirmar pedido", dispara a mutation `useCheckout()` (POST /orders/checkout).
 * 3. Após sucesso, substitui a tela de Checkout pela tela do Pedido gerado (`OrderScreen`).
 * 
 * 💡 Analogia: É a "esteira do caixa do supermercado" onde você confere as mercadorias
 * antes de o operador registrar a compra e emitir a comanda para pagamento.
 */

import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useOrderActions';
import { money } from '@/lib/format';
import { Button, Card, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';
import { theme } from '@/lib/theme';

// Tipagem estrita das propriedades de navegação recebidas pelo React Navigation
type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

export function CheckoutScreen({ navigation }: Props) {
  // 1. Busca os dados atuais do carrinho em cache / API
  const { data: cart, isLoading, isError, error, refetch } = useCart();
  
  // 2. Hook de mutation para criar o pedido
  const checkout = useCheckout();

  // Tratamento de estados de carregamento e erro da consulta do carrinho
  if (isLoading) return <Loading label="Carregando carrinho…" />;
  if (isError) return <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />;

  const items = cart?.items ?? [];
  const vazio = items.length === 0;

  /**
   * Dispara o fechamento do carrinho.
   */
  function confirmar() {
    checkout.mutate(undefined, {
      /**
       * 💡 Por que usamos `navigation.replace` em vez de `navigation.navigate`?
       * - `replace`: Substitui a tela atual na pilha de navegação.
       * - Motivo: Uma vez que o carrinho foi transformado em pedido no backend,
       *   ele deixa de existir. Não faz sentido permitir que o usuário clique em "Voltar"
       *   e caia novamente na tela de checkout de um carrinho já finalizado!
       */
      onSuccess: (order) => navigation.replace('Order', { id: order.id }),
    });
  }

  return (
    <View style={styles.container}>
      {/* Lista de itens do pedido com cabeçalho e estado vazio */}
      <FlatList
        data={items}
        keyExtractor={(it) => it.variantId} // Chave única por variante
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.h}>Revise seu pedido</Text>
            <Text style={styles.subHeader}>Confira os itens antes de gerar a cobrança</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Seu carrinho está vazio.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            <View style={styles.thumbBox}>
              <View style={styles.thumbSpine} />
              <Text style={{ fontSize: 20 }}>📖</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.name} numberOfLines={2}>
                {item.quantity}× {item.name}
              </Text>
              <Text style={styles.unitInfo}>Unitário: {money(item.unitPrice)}</Text>
            </View>
            {/* Formata o subtotal monetário para o padrão Real (R$ 0,00) */}
            <Text style={styles.sub}>{money(item.subtotal)}</Text>
          </Card>
        )}
      />

      {/* Rodapé fixo com total e botão de confirmação */}
      <View style={styles.stickyFooter}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Total do Pedido</Text>
            <Text style={styles.totalCount}>{items.length} {items.length === 1 ? 'item' : 'itens'}</Text>
          </View>
          <Text style={styles.total}>{money(cart?.total ?? 0)}</Text>
        </View>

        {/* Exibe mensagem de erro caso o backend recuse o checkout (ex: estoque esgotado) */}
        {checkout.isError && (
          <Text style={styles.erro}>{(checkout.error as ApiError).message}</Text>
        )}

        {/* Botão de confirmação com feedback de carregamento da mutation */}
        <Button
          label={checkout.isPending ? 'Criando pedido…' : 'Confirmar pedido'}
          onPress={confirmar}
          disabled={vazio || checkout.isPending} // Desativa se o carrinho estiver vazio ou criando
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light },
  list: { padding: 14, gap: 10, paddingBottom: 24 },
  header: { marginBottom: 8, gap: 2 },
  h: { fontSize: 20, fontWeight: '800', color: theme.colors.dark },
  subHeader: { fontSize: 13, color: theme.colors.greyDark, marginBottom: 6 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: theme.radius.lg,
  },
  thumbBox: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.sm,
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
    width: 5,
    backgroundColor: theme.colors.primary,
  },
  itemInfo: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: theme.colors.dark },
  unitInfo: { fontSize: 11, color: theme.colors.greyDark },
  sub: { fontSize: 14, fontWeight: '800', color: theme.colors.primaryDark },
  empty: { color: theme.colors.greyDark, textAlign: 'center', marginTop: 40, fontSize: 14 },
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
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '800', color: theme.colors.dark },
  totalCount: { fontSize: 12, color: theme.colors.greyDark, marginTop: 1 },
  total: { fontSize: 22, fontWeight: '800', color: theme.colors.primaryDark },
  erro: { color: theme.colors.error, fontSize: 13, textAlign: 'center' },
});
