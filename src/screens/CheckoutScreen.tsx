/**
 * ============================================================================
 * TELA DE CHECKOUT (SEMANA 3 - CheckoutScreen.tsx)
 * ============================================================================
 * 
 * Esta tela representa a etapa de revisão e fechamento da compra:
 * 1. Exibe os itens atuais do carrinho e o valor total acumulado.
 * 2. Permite ao usuário escolher o método de entrega (Receber em casa ou Retirar na loja).
 * 3. Gerencia a busca de pontos de retirada e geolocalização quando o modo de retirada é selecionado.
 * 4. Ao clicar em "Confirmar pedido", dispara a mutation `useCheckout()` enviando o ID do ponto de retirada (se aplicável).
 * 5. Após sucesso, substitui a tela de Checkout pela tela do Pedido gerado (`OrderScreen`).
 * 
 * 💡 Analogia: É a "esteira do caixa do supermercado" onde você confere as mercadorias
 * antes de o operador registrar a compra e emitir a comanda para pagamento.
 */

import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useOrderActions';
import { usePickupPoints } from '@/hooks/usePickupPoints';
import { LocationNotice } from '@/components/LocationNotice';
import { PickupPointCard } from '@/components/PickupPointCard';
import { money } from '@/lib/format';
import { Button, Card, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';
import { theme } from '@/lib/theme';
 
// Tipagem estrita das propriedades de navegação recebidas pelo React Navigation
type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

type Delivery = 'DELIVERY' | 'PICKUP';

export function CheckoutScreen({ navigation }: Props) {
  // 1. Busca os dados atuais do carrinho em cache / API
  const { data: cart, isLoading, isError, error, refetch } = useCart();
  
  // 2. Hook de mutation para criar o pedido
  const checkout = useCheckout();
 
  const [mode, setMode] = useState<Delivery>('DELIVERY');
  const [pointId, setPointId] = useState<string | null>(null);
 
  // Só liga (e só pede permissão) quando a pessoa escolhe retirar na loja.
  const pickup = usePickupPoints({ enabled: mode === 'PICKUP' });
 
  // Tratamento de estados de carregamento e erro da consulta do carrinho
  if (isLoading) return <Loading label="Carregando carrinho…" />;
  if (isError) return <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />;
 
  const items = cart?.items ?? [];
  const vazio = items.length === 0;
  const points = pickup.data?.data ?? [];
  const missingPoint = mode === 'PICKUP' && !pointId;
 
  /**
   * Dispara o fechamento do carrinho.
   */
  function confirmar() {
    const pickupPointId = mode === 'PICKUP' ? pointId ?? undefined : undefined;
    checkout.mutate(pickupPointId, {
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
 
  const pickupSection = (
    <View style={styles.pickupBox}>
      {pickup.isPending ? (
        <View style={styles.inline}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.hint}>
            {pickup.waitingLocation ? 'Obtendo sua localização…' : 'Buscando pontos de retirada…'}
          </Text>
        </View>
      ) : pickup.isError ? (
        <View style={styles.inline}>
          <Text style={[styles.hint, { color: theme.colors.error }]}>
            {(pickup.error as ApiError)?.message ?? 'Não foi possível carregar os pontos.'}
          </Text>
          <Button label="Tentar de novo" variant="ghost" onPress={() => pickup.refetch()} />
        </View>
      ) : points.length === 0 ? (
        <Text style={styles.hint}>A loja ainda não tem pontos de retirada.</Text>
      ) : (
        <>
          <LocationNotice
            status={pickup.locationStatus}
            canAskAgain={pickup.canAskAgain}
            onRetry={pickup.retryLocation}
          />
          {points.map((point) => (
            <PickupPointCard
              key={point.id}
              point={point}
              selected={point.id === pointId}
              onPress={() => setPointId(point.id)}
            />
          ))}
        </>
      )}
    </View>
  );
 
  const deliverySection = (
    <View style={styles.delivery}>
      <Text style={styles.section}>Como você quer receber?</Text>
      <View style={styles.options}>
        <Pressable
          style={[styles.option, mode === 'DELIVERY' && styles.optionActive]}
          onPress={() => setMode('DELIVERY')}
        >
          <Text style={[styles.optionText, mode === 'DELIVERY' && styles.optionTextActive]}>
            Receber em casa
          </Text>
        </Pressable>
        <Pressable
          style={[styles.option, mode === 'PICKUP' && styles.optionActive]}
          onPress={() => setMode('PICKUP')}
        >
          <Text style={[styles.optionText, mode === 'PICKUP' && styles.optionTextActive]}>
            Retirar na loja
          </Text>
        </Pressable>
      </View>
      {mode === 'PICKUP' ? pickupSection : null}
    </View>
  );
 
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
        ListFooterComponent={vazio ? null : deliverySection}
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
            <Text style={styles.totalCount}>
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </Text>
          </View>
          <Text style={styles.total}>{money(cart?.total ?? 0)}</Text>
        </View>
 
        {missingPoint ? <Text style={styles.hint}>Escolha o ponto onde você vai retirar o pedido.</Text> : null}
 
        {/* Exibe mensagem de erro caso o backend recuse o checkout (ex: estoque esgotado) */}
        {checkout.isError && <Text style={styles.erro}>{(checkout.error as ApiError).message}</Text>}
 
        {/* Botão de confirmação com feedback de carregamento da mutation */}
        <Button
          label={checkout.isPending ? 'Criando pedido…' : 'Confirmar pedido'}
          onPress={confirmar}
          disabled={vazio || checkout.isPending || missingPoint} // Desativa se o carrinho estiver vazio, criando ou faltando selecionar ponto
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
  itemCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: theme.radius.lg },
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
  thumbSpine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: theme.colors.primary },
  itemInfo: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: theme.colors.dark },
  unitInfo: { fontSize: 11, color: theme.colors.greyDark },
  sub: { fontSize: 14, fontWeight: '800', color: theme.colors.primaryDark },
  empty: { color: theme.colors.greyDark, textAlign: 'center', marginTop: 40, fontSize: 14 },
 
  delivery: { marginTop: 14, gap: 10 },
  section: { fontSize: 16, fontWeight: '800', color: theme.colors.dark },
  options: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.greyLight,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
  },
  optionActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  optionText: { fontSize: 14, fontWeight: '600', color: theme.colors.dark },
  optionTextActive: { color: theme.colors.primaryDark, fontWeight: '800' },
  pickupBox: { gap: 8 },
  inline: { gap: 8 },
  hint: { fontSize: 13, color: theme.colors.greyDark, textAlign: 'center' },
 
  stickyFooter: {
    backgroundColor: theme.colors.white,
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
