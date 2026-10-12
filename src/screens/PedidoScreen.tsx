/**
 * ---------------------------------------------------------------------------
 * TELA: PEDIDO  (pagar)
 * ---------------------------------------------------------------------------
 * O pedido nasce PENDING. Pagar muda para PAID — e e so entao que a API
 * libera avaliar os produtos dele.
 *
 * O botao "simular recusa" nao e enfeite: e como se testa o caminho triste
 * sem precisar de um cartao sem limite. Pagamento recusado e o estado que
 * todo app esquece de tratar.
 * ---------------------------------------------------------------------------
 */
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EstadoCarregando } from '../components/EstadoCarregando';
import { ehAppError } from '../errors/AppError';
import { usePagarPedido, usePedidos } from '../hooks/useCompra';
import { formatarPreco } from '../lib/formatar';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AppStackParamList, 'Pedido'>;

export function PedidoScreen({ route }: Props) {
  const { pedidoId } = route.params;
  const { data: pedidos, isPending } = usePedidos();
  const pagar = usePagarPedido();

  if (isPending) return <EstadoCarregando />;

  const pedido = pedidos?.find((p) => p.id === pedidoId);
  if (!pedido) return <EstadoCarregando mensagem="Carregando pedido..." />;

  const pago = pedido.status !== 'PENDING' && pedido.status !== 'CANCELLED';

  function pagarCom(simular: 'approve' | 'decline') {
    pagar.mutate(
      { pedidoId, metodo: 'PIX', simular },
      {
        onSuccess: (atualizado) => {
          if (atualizado.status === 'PENDING') {
            Alert.alert('Pagamento recusado', 'O pedido continua aguardando pagamento.');
          }
        },
        onError: (erro) =>
          Alert.alert('Erro ao pagar', ehAppError(erro) ? erro.mensagem : 'Tente novamente.'),
      },
    );
  }

  return (
    <ScrollView style={e.container} contentContainerStyle={e.conteudo}>
      <View style={e.cabecalho}>
        <Text style={e.numero}>Pedido #{pedido.id.slice(-6)}</Text>
        <Text style={[e.status, pago ? e.statusPago : e.statusPendente]}>{pedido.status}</Text>
      </View>

      {/* Quando e retirada, o cliente precisa saber ONDE buscar. */}
      {pedido.pickup ? (
        <View style={e.retirada}>
          <Text style={e.retiradaTitulo}>Retirar em {pedido.pickup.name}</Text>
          {pedido.pickup.address.street ? (
            <Text style={e.retiradaTexto}>
              {pedido.pickup.address.street}, {pedido.pickup.address.number} -{' '}
              {pedido.pickup.address.city}
            </Text>
          ) : null}
          {pedido.pickup.hours ? (
            <Text style={e.retiradaTexto}>{pedido.pickup.hours}</Text>
          ) : null}
        </View>
      ) : null}

      {pedido.items.map((item) => (
        <View key={item.variantId} style={e.item}>
          {/* No PEDIDO o campo e productName (no carrinho era name). */}
          <Text style={e.itemNome}>{item.productName}</Text>
          <Text style={e.itemDetalhe}>
            {item.quantity} x {formatarPreco(item.unitPrice)}
          </Text>
        </View>
      ))}

      <View style={e.totalLinha}>
        <Text style={e.totalRotulo}>Total</Text>
        <Text style={e.totalValor}>{formatarPreco(pedido.total)}</Text>
      </View>

      {!pago ? (
        <View style={e.acoes}>
          <Pressable style={e.botao} onPress={() => pagarCom('approve')} disabled={pagar.isPending}>
            {pagar.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={e.botaoTexto}>Pagar com PIX</Text>
            )}
          </Pressable>

          <Pressable style={e.botaoSecundario} onPress={() => pagarCom('decline')} disabled={pagar.isPending}>
            <Text style={e.botaoSecundarioTexto}>Simular recusa</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={e.pagoAviso}>
          Pedido pago. Agora voce pode avaliar os produtos deste pedido.
        </Text>
      )}
    </ScrollView>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 16, gap: 10 },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: { fontSize: 18, fontWeight: '700', color: cores.textoForte },
  status: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  statusPendente: { backgroundColor: '#FEF3C7', color: '#92400E' },
  statusPago: { backgroundColor: '#D1FAE5', color: '#047857' },
  retirada: { backgroundColor: cores.primariaClara, borderRadius: 10, padding: 12, gap: 2 },
  retiradaTitulo: { fontSize: 14, fontWeight: '700', color: cores.primariaEscura },
  retiradaTexto: { fontSize: 13, color: cores.texto },
  item: { backgroundColor: cores.superficie, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: cores.borda },
  itemNome: { fontSize: 15, fontWeight: '600', color: cores.textoForte },
  itemDetalhe: { fontSize: 13, color: cores.textoFraco },
  totalLinha: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  totalRotulo: { fontSize: 16, color: cores.texto },
  totalValor: { fontSize: 20, fontWeight: '700', color: cores.textoForte },
  acoes: { gap: 8, marginTop: 12 },
  botao: { backgroundColor: cores.primaria, borderRadius: 10, padding: 16, alignItems: 'center' },
  botaoTexto: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  botaoSecundario: { borderWidth: 1.5, borderColor: cores.neutro, borderRadius: 10, padding: 14, alignItems: 'center' },
  botaoSecundarioTexto: { color: cores.textoFraco, fontSize: 14, fontWeight: '600' },
  pagoAviso: { marginTop: 12, fontSize: 14, color: '#047857' },
});
