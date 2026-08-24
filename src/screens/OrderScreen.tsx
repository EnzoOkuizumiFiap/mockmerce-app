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
import { useCancelOrder, usePayOrder } from '@/hooks/useOrderActions';
import { statusColor, statusLabel } from '@/lib/orders';
import { money } from '@/lib/format';
import { Badge, Button, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError, PaymentMethod } from '@/types/api';

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
      {/* Cabeçalho com ID resumido (últimos 6 caracteres) e Badge de status */}
      <View style={styles.head}>
        <Text style={styles.pedido}>Pedido #{order.id.slice(-6)}</Text>
        <Badge label={statusLabel(order.status)} color={statusColor(order.status)} />
      </View>

      {/* Lista de itens congelados no pedido */}
      {order.items.map((it) => (
        <View key={it.variantId} style={styles.row}>
          <Text style={styles.name} numberOfLines={2}>
            {it.quantity}× {it.productName}
            {it.variantName ? ` (${it.variantName})` : ''}
          </Text>
          <Text style={styles.sub}>{money(it.subtotal)}</Text>
        </View>
      ))}

      {/* Linha do Valor Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.total}>{money(order.total)}</Text>
      </View>

      {/* Feedback positivo se o pedido estiver pago */}
      {paid && <Text style={styles.ok}>✓ Pagamento aprovado. Obrigado!</Text>}

      {/* Seção de Ações: Apenas exibida enquanto o pedido estiver PENDENTE */}
      {pending && (
        <View style={styles.pay}>
          <Text style={styles.section}>Pagamento</Text>

          {/* Seleção do Método de Pagamento (PIX, Cartão ou Boleto) */}
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
          <View style={styles.chips}>
            <Text
              onPress={() => setSimulate('approve')}
              style={[styles.chip, simulate === 'approve' && styles.chipActive]}
            >
              simular: aprovar
            </Text>
            <Text
              onPress={() => setSimulate('decline')}
              style={[styles.chip, simulate === 'decline' && styles.chipActive]}
            >
              simular: recusar
            </Text>
          </View>

          {/* Avisos de recusa ou erros de requisição */}
          {recusado && <Text style={styles.erro}>Pagamento recusado. Tente outro método ou aprove a simulação.</Text>}
          {pay.isError && <Text style={styles.erro}>{(pay.error as ApiError).message}</Text>}

          {/* Botão Primário de Pagar */}
          <Button
            label={pay.isPending ? 'Processando…' : 'Pagar'}
            onPress={() => pay.mutate({ id: order.id, method, simulate })}
            disabled={pay.isPending}
          />
          
          {/* Botão Secundário (Ghost) de Cancelamento */}
          <Button
            label={cancel.isPending ? 'Cancelando…' : 'Cancelar pedido'}
            variant="ghost"
            onPress={() => cancel.mutate(order.id)}
            disabled={cancel.isPending}
          />
        </View>
      )}

      {/* Linha do Tempo / Histórico de Auditoria */}
      {timeline && timeline.length > 0 && (
        <View style={styles.timeline}>
          <Text style={styles.section}>Linha do tempo</Text>
          {timeline.map((t, i) => (
            <View key={i} style={styles.tl}>
              <Text style={styles.tlDot}>•</Text>
              <Text style={styles.tlText}>
                {statusLabel(t.to)}
                {t.note ? ` — ${t.note}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Botão de navegação para o histórico completo de pedidos */}
      <View style={styles.allOrders}>
        <Button
          label="Ver todos os meus pedidos"
          variant="ghost"
          onPress={() => navigation.navigate('Orders')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pedido: { fontSize: 18, fontWeight: '800', color: '#111827' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  name: { flex: 1, fontSize: 14, color: '#374151' },
  sub: { fontSize: 14, fontWeight: '600', color: '#111827' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  totalLabel: { fontSize: 16, color: '#374151' },
  total: { fontSize: 20, fontWeight: '800', color: '#111827' },
  ok: { fontSize: 15, fontWeight: '700', color: '#15803d', marginTop: 8 },
  pay: { marginTop: 12, gap: 10 },
  section: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
    color: '#111827',
  },
  chipActive: { borderColor: '#111827', backgroundColor: '#111827', color: '#fff' },
  erro: { color: '#b91c1c', fontSize: 13 },
  timeline: { marginTop: 16, gap: 4 },
  tl: { flexDirection: 'row', gap: 8 },
  tlDot: { color: '#9ca3af' },
  tlText: { flex: 1, fontSize: 13, color: '#374151' },
  allOrders: { marginTop: 16, marginBottom: 24 },
});
