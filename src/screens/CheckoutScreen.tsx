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
import { Button, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';

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
        ListHeaderComponent={<Text style={styles.h}>Revise seu pedido</Text>}
        ListEmptyComponent={<Text style={styles.empty}>Seu carrinho está vazio.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name} numberOfLines={2}>
              {item.quantity}× {item.name}
            </Text>
            {/* Formata o subtotal monetário para o padrão Real (R$ 0,00) */}
            <Text style={styles.sub}>{money(item.subtotal)}</Text>
          </View>
        )}
      />

      {/* Rodapé fixo com total e botão de confirmação */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 16, gap: 8 },
  h: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  name: { flex: 1, fontSize: 14, color: '#374151' },
  sub: { fontSize: 14, fontWeight: '600', color: '#111827' },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 24 },
  footer: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, color: '#374151' },
  total: { fontSize: 20, fontWeight: '800', color: '#111827' },
  erro: { color: '#b91c1c', fontSize: 13 },
});
