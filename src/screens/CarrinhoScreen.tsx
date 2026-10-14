/**
 * ---------------------------------------------------------------------------
 * TELA: CARRINHO  (ja vem pronta)
 * ---------------------------------------------------------------------------
 * Nao e o conteudo da aula. Existe para o aluno conseguir COMPRAR — e so
 * depois de comprar a API libera avaliar.
 * ---------------------------------------------------------------------------
 */
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EstadoCarregando } from '../components/EstadoCarregando';
import { EstadoVazio } from '../components/EstadoVazio';
import { EtapasCompra } from '../components/EtapasCompra';
import { Pressionavel } from '../components/Pressionavel';
import { useCarrinho, useFinalizarCompra } from '../hooks/useCompra';
import { formatarPreco } from '../lib/formatar';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AppStackParamList, 'Carrinho'>;

export function CarrinhoScreen({ navigation }: Props) {
  const { data, isPending } = useCarrinho();
  const finalizar = useFinalizarCompra();

  if (isPending) return <EstadoCarregando mensagem="Abrindo sua sacola de livros..." />;
  if (!data || data.items.length === 0) {
    return (
      <View style={e.containerVazio}>
        <EstadoVazio mensagem="Sua sacola de livros está vazia.\nEscolha uma obra no acervo para começar sua leitura!" />
        <Pressionavel
          style={e.botaoExplorar}
          onPress={() => navigation.navigate('ListaProdutos')}
          accessibilityRole="button"
          accessibilityLabel="Explorar catálogo de livros"
        >
          <Text style={e.textoBotaoExplorar}>📖 Explorar o Acervo</Text>
        </Pressionavel>
      </View>
    );
  }

  return (
    <View style={e.container}>
      <FlatList
        data={data.items}
        keyExtractor={(item) => item.variantId}
        contentContainerStyle={e.lista}
        ListHeaderComponent={<EtapasCompra etapaAtual={1} />}
        renderItem={({ item }) => (
          <View style={e.item}>
            <View style={e.iconeLivroContainer}>
              <Text style={e.iconeLivro}>📖</Text>
            </View>

            <View style={e.infoLivro}>
              <Text style={e.nome} numberOfLines={2}>{item.name}</Text>
              <View style={e.linhaQuantidade}>
                <View style={e.badgeExemplares}>
                  <Text style={e.textoBadgeExemplares}>
                    {item.quantity} {item.quantity === 1 ? 'exemplar' : 'exemplares'}
                  </Text>
                </View>
                <Text style={e.precoUnitario}>× {formatarPreco(item.unitPrice)}</Text>
              </View>
            </View>

            <Text style={e.subtotal}>{formatarPreco(item.subtotal)}</Text>
          </View>
        )}
      />

      {/* Rodapé Fixo de Resumo & Checkout */}
      <View style={e.rodape}>
        <View style={e.resumoBox}>
          <View style={e.linhaResumo}>
            <Text style={e.resumoLabel}>Itens na sacola</Text>
            <Text style={e.resumoValorSecundario}>
              {data.items.reduce((acc, i) => acc + i.quantity, 0)} volumes
            </Text>
          </View>
          <View style={e.linhaResumo}>
            <Text style={e.resumoLabel}>Embalagem e separação</Text>
            <Text style={e.resumoGratis}>✓ Grátis</Text>
          </View>
          <View style={e.divisorResumo} />
          <View style={e.totalLinha}>
            <Text style={e.totalRotulo}>Total do pedido</Text>
            <Text style={e.totalValor}>{formatarPreco(data.total)}</Text>
          </View>
        </View>

        <Pressionavel
          style={e.botao}
          onPress={() => navigation.navigate('Checkout')}
          disabled={finalizar.isPending}
          accessibilityRole="button"
          accessibilityLabel="Avançar para retirada e pagamento"
        >
          <Text style={e.botaoTexto}>Continuar para entrega e retirada →</Text>
        </Pressionavel>
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  containerVazio: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  botaoExplorar: {
    backgroundColor: cores.primaria,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 16,
  },
  textoBotaoExplorar: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  lista: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  iconeLivroContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeLivro: {
    fontSize: 22,
  },
  infoLivro: {
    flex: 1,
    gap: 4,
  },
  nome: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  linhaQuantidade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeExemplares: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  textoBadgeExemplares: {
    fontSize: 12,
    fontWeight: '600',
    color: cores.textoFraco,
  },
  precoUnitario: {
    fontSize: 12,
    color: cores.textoFraco,
  },
  subtotal: {
    fontSize: 16,
    fontWeight: '800',
    color: cores.primaria,
  },
  rodape: {
    padding: 16,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    elevation: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  resumoBox: {
    gap: 6,
  },
  linhaResumo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resumoLabel: {
    fontSize: 13,
    color: cores.textoFraco,
  },
  resumoValorSecundario: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  resumoGratis: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  divisorResumo: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  totalLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRotulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalValor: {
    fontSize: 22,
    fontWeight: '800',
    color: cores.primaria,
  },
  botao: {
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
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
