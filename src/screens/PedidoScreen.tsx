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
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EstadoCarregando } from '../components/EstadoCarregando';
import { EtapasCompra } from '../components/EtapasCompra';
import { Pressionavel } from '../components/Pressionavel';
import { ehAppError } from '../errors/AppError';
import { usePagarPedido, usePedidos } from '../hooks/useCompra';
import { formatarPreco } from '../lib/formatar';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AppStackParamList, 'Pedido'>;

export function PedidoScreen({ route, navigation }: Props) {
  const { pedidoId } = route.params;
  const { data: pedidos, isPending } = usePedidos();
  const pagar = usePagarPedido();

  if (isPending) return <EstadoCarregando mensagem="Abrindo detalhes do pedido..." />;

  const pedido = pedidos?.find((p) => p.id === pedidoId);
  if (!pedido) return <EstadoCarregando mensagem="Consultando seu pedido de livros..." />;

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
    <ScrollView style={e.container} contentContainerStyle={e.conteudo} showsVerticalScrollIndicator={false}>
      {/* Indicador de Etapas (Etapa 3) */}
      <EtapasCompra etapaAtual={3} />

      {/* Card Principal do Pedido */}
      <View style={e.cardPrincipal}>
        <View style={e.cabecalho}>
          <View>
            <Text style={e.numero}>Pedido #{pedido.id.slice(-6)}</Text>
            <Text style={e.dataCriacao}>
              {new Date(pedido.createdAt).toLocaleDateString('pt-BR')} às{' '}
              {new Date(pedido.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={[e.statusBadge, pago ? e.statusBadgePago : e.statusBadgePendente]}>
            <Text style={[e.statusTexto, pago ? e.statusTextoPago : e.statusTextoPendente]}>
              {pago ? '✓ PAGO' : 'AGUARDANDO PIX'}
            </Text>
          </View>
        </View>

        {/* Notificação de Sucesso se Pago */}
        {pago ? (
          <View style={e.cardSucesso}>
            <Text style={e.iconeSucesso}>🎉</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={e.tituloSucesso}>Pagamento Confirmado!</Text>
              <Text style={e.textoSucesso}>
                Seus exemplares já foram reservados. Como você comprou, a avaliação destas obras está liberada!
              </Text>
            </View>
          </View>
        ) : null}

        {/* Detalhes de Retirada se aplicável */}
        {pedido.pickup ? (
          <View style={e.retirada}>
            <View style={e.linhaRetiradaTopo}>
              <Text style={e.retiradaIcone}>📍</Text>
              <Text style={e.retiradaTitulo}>Retirada em {pedido.pickup.name}</Text>
            </View>
            {pedido.pickup.address.street ? (
              <Text style={e.retiradaTexto}>
                {pedido.pickup.address.street}, {pedido.pickup.address.number} —{' '}
                {pedido.pickup.address.city}
              </Text>
            ) : null}
            {pedido.pickup.hours ? (
              <Text style={e.retiradaHorario}>🕒 Horário: {pedido.pickup.hours}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Itens do Pedido */}
        <View style={e.secaoItens}>
          <Text style={e.subtituloItens}>ITENS DESTE PEDIDO</Text>
          {pedido.items.map((item) => (
            <View key={item.variantId} style={e.itemLinha}>
              <View style={e.iconeItemBox}>
                <Text style={e.iconeItemTexto}>📖</Text>
              </View>
              <View style={e.infoItem}>
                <Text style={e.itemNome} numberOfLines={2}>{item.productName}</Text>
                <Text style={e.itemDetalhe}>
                  {item.quantity} {item.quantity === 1 ? 'volume' : 'volumes'} × {formatarPreco(item.unitPrice)}
                </Text>
              </View>
              <Text style={e.itemSubtotal}>
                {formatarPreco(item.unitPrice * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={e.divisor} />

        {/* Linha de Total */}
        <View style={e.totalLinha}>
          <Text style={e.totalRotulo}>Total pago</Text>
          <Text style={e.totalValor}>{formatarPreco(pedido.total)}</Text>
        </View>
      </View>

      {/* Ações: Pagar com PIX ou Ações Pós-Compra */}
      {!pago ? (
        <View style={e.acoesBox}>
          {/* Caixa de PIX */}
          <View style={e.cardPix}>
            <View style={e.linhaPixTopo}>
              <Text style={e.pixIcone}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={e.pixTitulo}>PIX Instantâneo</Text>
                <Text style={e.pixSubtitulo}>Aprovação imediata no backend da turma</Text>
              </View>
            </View>
            <View style={e.chavePixBox}>
              <Text style={e.chavePixTexto}>livroaberto-pix@mockmerce.com.br</Text>
            </View>
          </View>

          <Pressionavel
            style={e.botaoPagar}
            onPress={() => pagarCom('approve')}
            disabled={pagar.isPending}
            accessibilityRole="button"
            accessibilityLabel="Pagar com PIX"
          >
            {pagar.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={e.botaoPagarTexto}>⚡ Confirmar Pagamento com PIX</Text>
            )}
          </Pressionavel>

          <Pressionavel
            style={e.botaoRecusa}
            onPress={() => pagarCom('decline')}
            disabled={pagar.isPending}
            accessibilityRole="button"
            accessibilityLabel="Simular recusa para testes"
          >
            <Text style={e.botaoRecusaTexto}>Simular recusa de pagamento (Testes)</Text>
          </Pressionavel>
        </View>
      ) : (
        <View style={e.acoesPosPago}>
          <Pressionavel
            style={e.botaoAvaliarObra}
            onPress={() => navigation.navigate('ListaProdutos')}
            accessibilityRole="button"
            accessibilityLabel="Avaliar obras compradas no acervo"
          >
            <Text style={e.botaoAvaliarObraTexto}>✍️ Avaliar obras compradas no acervo</Text>
          </Pressionavel>

          <Pressionavel
            style={e.botaoVoltarCatalogo}
            onPress={() => navigation.navigate('Favoritos')}
            accessibilityRole="button"
            accessibilityLabel="Ir para Minha Estante"
          >
            <Text style={e.botaoVoltarCatalogoTexto}>📚 Ver Minha Estante de Livros</Text>
          </Pressionavel>
        </View>
      )}
    </ScrollView>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  conteudo: { padding: 16, gap: 14, paddingBottom: 40 },
  cardPrincipal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    gap: 14,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  numero: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  dataCriacao: { fontSize: 12, color: cores.textoFraco, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgePendente: { backgroundColor: '#FEF3C7' },
  statusBadgePago: { backgroundColor: '#D1FAE5' },
  statusTexto: { fontSize: 11, fontWeight: '800' },
  statusTextoPendente: { color: '#B45309' },
  statusTextoPago: { color: '#047857' },
  cardSucesso: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconeSucesso: { fontSize: 26 },
  tituloSucesso: { fontSize: 15, fontWeight: '800', color: '#065F46' },
  textoSucesso: { fontSize: 12, color: '#047857', lineHeight: 17 },
  retirada: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  linhaRetiradaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retiradaIcone: { fontSize: 16 },
  retiradaTitulo: { fontSize: 14, fontWeight: '800', color: '#1E40AF' },
  retiradaTexto: { fontSize: 13, color: '#334155' },
  retiradaHorario: { fontSize: 12, color: cores.primaria, fontWeight: '600', marginTop: 2 },
  secaoItens: { gap: 10 },
  subtituloItens: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  iconeItemBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconeItemTexto: { fontSize: 18 },
  infoItem: { flex: 1, gap: 2 },
  itemNome: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  itemDetalhe: { fontSize: 12, color: cores.textoFraco },
  itemSubtotal: { fontSize: 14, fontWeight: '700', color: cores.primaria },
  divisor: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 2 },
  totalLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRotulo: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  totalValor: { fontSize: 22, fontWeight: '800', color: cores.primaria },
  acoesBox: { gap: 10 },
  cardPix: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  linhaPixTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pixIcone: { fontSize: 24 },
  pixTitulo: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  pixSubtitulo: { fontSize: 12, color: cores.textoFraco },
  chavePixBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  chavePixTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  botaoPagar: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  botaoPagarTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  botaoRecusa: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoRecusaTexto: { color: '#64748B', fontSize: 13, fontWeight: '700' },
  acoesPosPago: { gap: 10 },
  botaoAvaliarObra: {
    backgroundColor: cores.primaria,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: cores.primaria,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  botaoAvaliarObraTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  botaoVoltarCatalogo: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: cores.primaria,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botaoVoltarCatalogoTexto: { color: cores.primaria, fontSize: 15, fontWeight: '700' },
});
