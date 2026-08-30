/**
 * ============================================================================
 * TELA DE DETALHES DO PEDIDO (SEMANA 3 - OrderScreen.tsx)
 * ============================================================================
 * 
 * Demonstração prática e visual da MÁQUINA DE ESTADOS do pedido:
 * 
 *           ┌──────────────┐
 *           │   PENDING    │ ◄── Pedido recém-criado pelo Checkout
 *           └──────┬───────┘
 *                  │
 *        ┌─────────┴─────────┐
 *        ▼                   ▼
 *   [ Pagar ]           [ Cancelar ]
 *        │                   │
 *   ┌────┴────┐              ▼
 *   ▼         ▼        ┌───────────┐
 * [Aprovar] [Recusar]  │ CANCELLED │
 *   │         │        └───────────┘
 *   ▼         ▼
 * ┌──────┐ ┌──────────────┐
 * │ PAID │ │ CONTINUA     │
 * └──────┘ │ PENDING      │
 *          └──────────────┘
 * 
 * 💡 Recursos Didáticos nesta Tela:
 * 1. Simulação Interativa (Chips): Permite escolher o método (PIX, Cartão, Boleto)
 *    e forçar o resultado (Aprovar vs Recusar) para testar os dois fluxos de UI.
 * 2. Visualização de Timeline: Renderiza os eventos históricos de auditoria do pedido.
 * 3. Badge Dinâmico: Rótulo colorido que reflete o estado atual da máquina.
 */

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useOrder, useOrderTimeline } from '@/hooks/useOrders';
import { useCancelOrder, usePayOrder, useRefundOrder } from '@/hooks/useOrderActions';
import { Alert } from 'react-native';
import { statusColor, statusLabel } from '@/lib/orders';
import { money } from '@/lib/format';
import { Badge, Button, Card, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError, PaymentMethod } from '@/types/api';
import { theme } from '@/lib/theme';

// Props recebidas via navegação: exige route.params.id
type Props = NativeStackScreenProps<RootStackParamList, 'Order'>;

// Lista de métodos de pagamento suportados para renderização dos botões/chips
const METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'PIX', label: 'PIX' },
  { key: 'CREDIT_CARD', label: 'Cartão' },
  { key: 'BOLETO', label: 'Boleto' },
];

export function OrderScreen({ route, navigation }: Props) {
  const { id } = route.params;

  // 1. Busca os detalhes do pedido e a linha do tempo em paralelo via TanStack Query
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const { data: timeline } = useOrderTimeline(id);

  // 2. Mutações para acionar transições na máquina de estados
  const pay = usePayOrder();
  const cancel = useCancelOrder();
  const refund = useRefundOrder();

  // 3. Estados locais para controlar o formulário de simulação de pagamento
  const [method, setMethod] = useState<PaymentMethod>('PIX');
  const [simulate, setSimulate] = useState<'approve' | 'decline'>('approve');

  // Tratamento de telas de carregamento e erro
  if (isLoading) return <Loading label="Carregando pedido…" />;
  if (isError || !order) return <ErrorState message={(error as ApiError)?.message ?? 'Falha ao carregar pedido'} onRetry={() => refetch()} />;

  // Flags auxiliares derivadas do status atual do pedido
  const pending = order.status === 'PENDING';
  const paid = order.status === 'PAID';
  // O pagamento rodou com sucesso, mas como simulamos 'decline', o pedido permaneceu PENDING
  const recusado = pay.isSuccess && pay.data?.status === 'PENDING';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Card 1: Resumo do Pedido e Lista de Itens */}
      <Card style={styles.card}>
        {/* Cabeçalho com ID resumido e Badge de status */}
        <View style={styles.head}>
          <View>
            <Text style={styles.pedidoLabel}>RESUMO DO PEDIDO</Text>
            <Text style={styles.pedido}>Pedido #{order.id.slice(-6).toUpperCase()}</Text>
          </View>
          <Badge label={statusLabel(order.status)} color={statusColor(order.status)} />
        </View>

        <View style={styles.divider} />

        {/* Lista de itens congelados no pedido */}
        <View style={styles.itemsList}>
          {order.items.map((it) => (
            <View key={it.variantId} style={styles.row}>
              <View style={styles.itemInfo}>
                <Text style={styles.name} numberOfLines={2}>
                  {it.quantity}× {it.productName}
                  {it.variantName ? ` (${it.variantName})` : ''}
                </Text>
                {it.unitPrice ? (
                  <Text style={styles.unitPrice}>Unitário: {money(it.unitPrice)}</Text>
                ) : null}
              </View>
              <Text style={styles.sub}>{money(it.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Linha do Valor Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total do Pedido</Text>
          <Text style={styles.total}>{money(order.total)}</Text>
        </View>

        {/* Feedback positivo se o pedido estiver pago */}
        {paid && (
          <View style={styles.paidBanner}>
            <Text style={styles.ok}>✓ Pagamento aprovado com sucesso!</Text>
          </View>
        )}
      </Card>

      {/* Card 2: Seção de Pagamento Interativo (Apenas enquanto o pedido estiver PENDENTE) */}
      {pending && (
        <Card style={styles.card}>
          <Text style={styles.section}>SIMULAR PAGAMENTO</Text>
          <Text style={styles.sectionSubtitle}>Escolha o método e simule o comportamento do gateway:</Text>

          {/* Seleção do Método de Pagamento (PIX, Cartão ou Boleto) */}
          <Text style={styles.fieldLabel}>MÉTODO</Text>
          <View style={styles.chips}>
            {METHODS.map((m) => (
              <Text
                key={m.key}
                onPress={() => setMethod(m.key)}
                style={[styles.chip, method === m.key && styles.chipActive]}
              >
                {m.label}
              </Text>
            ))}
          </View>

          {/* Controle de Simulação: aprovar x recusar para testar ambos os fluxos */}
          <Text style={[styles.fieldLabel, { marginTop: 6 }]}>GATEWAY</Text>
          <View style={styles.chips}>
            <Text
              onPress={() => setSimulate('approve')}
              style={[styles.chip, simulate === 'approve' && styles.chipActive]}
            >
              Simular: Aprovar
            </Text>
            <Text
              onPress={() => setSimulate('decline')}
              style={[styles.chip, simulate === 'decline' && styles.chipActiveDanger]}
            >
              Simular: Recusar
            </Text>
          </View>

          {/* Avisos de recusa ou erros de requisição */}
          {recusado && (
            <View style={styles.errorBox}>
              <Text style={styles.erro}>Pagamento recusado. Tente outro método ou selecione aprovar.</Text>
            </View>
          )}
          {pay.isError && (
            <View style={styles.errorBox}>
              <Text style={styles.erro}>{(pay.error as ApiError).message}</Text>
            </View>
          )}

          {/* Botões de Ação */}
          <View style={styles.btnStack}>
            {/* Botão Primário de Pagar */}
            <Button
              label={pay.isPending ? 'Processando…' : 'Confirmar Pagamento'}
              onPress={() => pay.mutate({ id: order.id, method, simulate })}
              disabled={pay.isPending}
            />
            
            {/* Botão Secundário (Ghost) de Cancelamento */}
            <Button
              label={cancel.isPending ? 'Cancelando…' : 'Cancelar Pedido'}
              variant="ghost"
              onPress={() => cancel.mutate(order.id)}
              disabled={cancel.isPending}
            />
          </View>
        </Card>
      )}

      {/* Card 3: Linha do Tempo / Histórico de Auditoria */}
      {timeline && timeline.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.section}>HISTÓRICO DO PEDIDO</Text>
          <View style={styles.timelineList}>
            {timeline.map((t, i) => (
              <View key={i} style={styles.tlRow}>
                <View style={styles.tlDotContainer}>
                  <View style={styles.tlDot} />
                  {i < timeline.length - 1 && <View style={styles.tlLine} />}
                </View>
                <View style={styles.tlContent}>
                  <Text style={styles.tlStatus}>{statusLabel(t.to)}</Text>
                  {t.note ? <Text style={styles.tlNote}>{t.note}</Text> : null}
                  {t.at ? (
                    <Text style={styles.tlDate}>
                      {new Date(t.at).toLocaleString('pt-BR')}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Card 4: Reembolso do pedido (se PAGO) */}
      {paid && (
        <Card style={styles.card}>
          <Text style={styles.section}>ESTORNO / REEMBOLSO</Text>
          <Text style={styles.sectionSubtitle}>
            Caso queira cancelar uma compra já aprovada e estornar o valor:
          </Text>
          {refund.isError && (
            <View style={styles.errorBox}>
              <Text style={styles.erro}>{(refund.error as ApiError).message}</Text>
            </View>
          )}
          <Button
            label={refund.isPending ? 'Reembolsando…' : 'Reembolsar Pedido'}
            variant="ghost"
            onPress={() =>
              // Confirmação explícita: é uma ação de estorno de dinheiro real (simulado),
              // sem volta — vale o mesmo cuidado que teríamos com qualquer PATCH/DELETE crítico.
              Alert.alert('Reembolsar pedido', 'O estoque será revertido e o pagamento estornado. Confirmar?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Reembolsar', style: 'destructive', onPress: () => refund.mutate(order.id) },
              ])
            }
            disabled={refund.isPending}
          />
        </Card>
      )}

      {/* Botão de navegação para o histórico completo de pedidos */}
      <View style={styles.allOrders}>
        <Button
          label="📦 Ver todos os meus pedidos"
          variant="ghost"
          onPress={() => navigation.navigate('Orders')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, gap: 14, backgroundColor: theme.colors.light, paddingBottom: 32 },
  card: { padding: 18, gap: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pedidoLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.greyDark, letterSpacing: 0.5 },
  pedido: { fontSize: 18, fontWeight: '800', color: theme.colors.dark, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
  itemsList: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  itemInfo: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: theme.colors.dark },
  unitPrice: { fontSize: 12, color: theme.colors.greyDark },
  sub: { fontSize: 14, fontWeight: '800', color: theme.colors.primaryDark },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: theme.colors.dark },
  total: { fontSize: 20, fontWeight: '800', color: theme.colors.primaryDark },
  paidBanner: {
    backgroundColor: theme.colors.mintLight,
    padding: 10,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  ok: { fontSize: 13, fontWeight: '700', color: theme.colors.mintDark },
  section: { fontSize: 12, fontWeight: '800', color: theme.colors.dark, letterSpacing: 0.5 },
  sectionSubtitle: { fontSize: 13, color: theme.colors.greyDark, marginTop: -6 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.greyDark, letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.greyLight,
    borderRadius: theme.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
    color: theme.colors.dark,
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: '#ffffff',
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
  chipActiveDanger: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorLight,
    color: theme.colors.error,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: theme.colors.errorLight,
    padding: 10,
    borderRadius: theme.radius.md,
  },
  erro: { color: theme.colors.error, fontSize: 13, textAlign: 'center', fontWeight: '600' },
  btnStack: { gap: 8, marginTop: 4 },
  timelineList: { gap: 0, marginTop: 4 },
  tlRow: { flexDirection: 'row', gap: 12, minHeight: 44 },
  tlDotContainer: { alignItems: 'center', width: 14 },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary, marginTop: 4 },
  tlLine: { width: 2, flex: 1, backgroundColor: theme.colors.greyLight, marginVertical: 2 },
  tlContent: { flex: 1, paddingBottom: 12, gap: 2 },
  tlStatus: { fontSize: 13, fontWeight: '700', color: theme.colors.dark },
  tlNote: { fontSize: 12, color: theme.colors.greyDark },
  tlDate: { fontSize: 11, color: '#94a3b8' },
  allOrders: { marginTop: 4 },
});
