/**
 * ---------------------------------------------------------------------------
 * TELA: CHECKOUT
 * ---------------------------------------------------------------------------
 * Revisao do carrinho + escolha de como receber:
 *
 *   ENTREGA   -> "Receber em casa"  (nao manda ponto)
 *   RETIRADA  -> "Retirar na loja"  (manda o id do ponto escolhido)
 *
 * Em RETIRADA o botao so habilita depois de escolher um ponto.
 *
 * `navigation.replace` no sucesso: o carrinho virou pedido, entao "voltar"
 * nao pode cair de novo num checkout de carrinho que ja nao existe.
 * ---------------------------------------------------------------------------
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EstadoCarregando } from '../components/EstadoCarregando';
import { EstadoErro } from '../components/EstadoErro';
import { EstadoVazio } from '../components/EstadoVazio';
import { Pressionavel } from '../components/Pressionavel';
import { ModoEntrega, SeletorEntrega } from '../components/SeletorEntrega';
import { ehAppError } from '../errors/AppError';
import { useCarrinho, useFinalizarCompra } from '../hooks/useCompra';
import { formatarPreco } from '../lib/formatar';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AppStackParamList, 'Checkout'>;

export function CheckoutScreen({ navigation }: Props) {
  const { data, isPending, isError, error, refetch } = useCarrinho();
  const finalizar = useFinalizarCompra();

  const [modo, setModo] = useState<ModoEntrega>('ENTREGA');
  const [pontoId, setPontoId] = useState<string | null>(null);

  if (isPending) return <EstadoCarregando />;

  if (isError) {
    return (
      <EstadoErro
        mensagem={ehAppError(error) ? error.mensagem : 'Algo inesperado aconteceu.'}
        aoTentarNovamente={() => refetch()}
      />
    );
  }

  if (data.items.length === 0) return <EstadoVazio mensagem="Seu carrinho esta vazio." />;

  const faltaPonto = modo === 'RETIRADA' && !pontoId;

  function confirmar() {
    // Em ENTREGA nao vai ponto nenhum (undefined): o pedido sai como entrega.
    const pontoRetiradaId = modo === 'RETIRADA' ? (pontoId ?? undefined) : undefined;

    finalizar.mutate(pontoRetiradaId, {
      onSuccess: (pedido) => navigation.replace('Pedido', { pedidoId: pedido.id }),
    });
  }

  return (
    <View style={e.container}>
      <ScrollView contentContainerStyle={e.conteudo}>
        <Text style={e.titulo}>Revise seu pedido</Text>

        {data.items.map((item) => (
          <View key={item.variantId} style={e.item}>
            <View style={e.itemInfo}>
              <Text style={e.nome} numberOfLines={2}>
                {item.quantity} x {item.name}
              </Text>
              <Text style={e.detalhe}>Unitario: {formatarPreco(item.unitPrice)}</Text>
            </View>
            <Text style={e.subtotal}>{formatarPreco(item.subtotal)}</Text>
          </View>
        ))}

        <SeletorEntrega
          modo={modo}
          aoMudarModo={setModo}
          pontoId={pontoId}
          aoEscolherPonto={setPontoId}
        />
      </ScrollView>

      <View style={e.rodape}>
        <View style={e.totalLinha}>
          <Text style={e.totalRotulo}>Total</Text>
          <Text style={e.totalValor}>{formatarPreco(data.total)}</Text>
        </View>

        {faltaPonto ? (
          <Text style={e.dica}>Escolha o ponto onde voce vai retirar o pedido.</Text>
        ) : null}

        {finalizar.isError ? (
          <Text style={e.erro}>
            {ehAppError(finalizar.error)
              ? finalizar.error.mensagem
              : 'Nao foi possivel finalizar a compra.'}
          </Text>
        ) : null}

        <Pressionavel
          style={[e.botao, (faltaPonto || finalizar.isPending) && e.botaoDesabilitado]}
          onPress={confirmar}
          disabled={faltaPonto || finalizar.isPending}
          accessibilityRole="button"
        >
          <Text style={e.botaoTexto}>
            {finalizar.isPending ? 'Criando pedido...' : 'Confirmar pedido'}
          </Text>
        </Pressionavel>
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 16, gap: 12 },
  titulo: { fontSize: 20, fontWeight: '700', color: cores.textoForte },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: cores.superficie,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  itemInfo: { flex: 1, gap: 2 },
  nome: { fontSize: 15, fontWeight: '600', color: cores.textoForte },
  detalhe: { fontSize: 13, color: cores.textoFraco },
  subtotal: { fontSize: 15, fontWeight: '700', color: cores.primaria },
  rodape: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  totalLinha: { flexDirection: 'row', justifyContent: 'space-between' },
  totalRotulo: { fontSize: 16, color: cores.texto },
  totalValor: { fontSize: 20, fontWeight: '700', color: cores.textoForte },
  dica: { fontSize: 13, color: cores.textoFraco, textAlign: 'center' },
  erro: { fontSize: 13, color: cores.perigo, textAlign: 'center' },
  botao: { backgroundColor: cores.primaria, borderRadius: 10, padding: 16, alignItems: 'center' },
  botaoDesabilitado: { opacity: 0.5 },
  botaoTexto: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});