/**
 * ---------------------------------------------------------------------------
 * TELA: CHECKOUT
 * ---------------------------------------------------------------------------
 * Aqui o conteudo da aula ENCOSTA no fluxo de compra que ja vinha pronto: a
 * escolha entre **receber em casa** e **retirar na loja**.
 *
 * A diferenca entre os dois e UM CAMPO no checkout:
 *
 *   sem pickupPointId  -> entrega
 *   com pickupPointId  -> retirada (o pedido volta com `pickup` preenchido)
 *
 * Repare que a lista de pontos aqui e a MESMA da tela do mapa — mesmo hook,
 * mesma ordenacao por distancia. Uma fonte de dados, dois lugares que a usam.
 * ---------------------------------------------------------------------------
 */
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EtapasCompra } from '../components/EtapasCompra';
import { Pressionavel } from '../components/Pressionavel';
import { ehAppError } from '../errors/AppError';
import { useCarrinho, useFinalizarCompra } from '../hooks/useCompra';
import { usePontosRetirada } from '../hooks/usePontosRetirada';
import { formatarPreco } from '../lib/formatar';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AppStackParamList, 'Checkout'>;

type Entrega = 'ENTREGA' | 'RETIRADA';

export function CheckoutScreen({ navigation }: Props) {
  const { data: carrinho } = useCarrinho();
  const { data: pontos, isPending: carregandoPontos, statusLocalizacao } = usePontosRetirada();
  const finalizar = useFinalizarCompra();

  const [modo, setModo] = useState<Entrega>('ENTREGA');
  const [pontoEscolhido, setPontoEscolhido] = useState<string | null>(null);

  const listaPontos = pontos?.data ?? [];

  function confirmar() {
    if (modo === 'RETIRADA' && !pontoEscolhido) {
      Alert.alert(
        'Escolha o ponto de retirada',
        'Selecione em qual livraria ou ponto parceiro você quer retirar seus livros.',
      );
      return;
    }

    finalizar.mutate(modo === 'RETIRADA' ? pontoEscolhido! : undefined, {
      onSuccess: (pedido) => navigation.replace('Pedido', { pedidoId: pedido.id }),
      onError: (erro) =>
        Alert.alert(
          'Não foi possível fechar o pedido',
          ehAppError(erro) ? erro.mensagem : 'Tente novamente.',
        ),
    });
  }

  return (
    <ScrollView style={e.container} contentContainerStyle={e.conteudo} showsVerticalScrollIndicator={false}>
      {/* Indicador de Etapas (Etapa 2) */}
      <EtapasCompra etapaAtual={2} />

      <Text style={e.titulo}>Como você deseja receber seus livros?</Text>

      {/* Cartões Ricos de Escolha de Modalidade */}
      <View style={e.opcoes}>
        <Pressionavel
          style={[e.cardOpcao, modo === 'ENTREGA' && e.cardOpcaoAtivo]}
          onPress={() => setModo('ENTREGA')}
          accessibilityRole="button"
          accessibilityLabel="Envio para endereço"
        >
          <View style={e.linhaTopoOpcao}>
            <View style={[e.iconeOpcaoBox, { backgroundColor: '#EFF6FF' }]}>
              <Text style={e.iconeOpcaoTexto}>📦</Text>
            </View>
            <View style={[e.radioCirculo, modo === 'ENTREGA' && e.radioCirculoAtivo]}>
              {modo === 'ENTREGA' && <View style={e.radioPonto} />}
            </View>
          </View>
          <Text style={e.opcaoTitulo}>Envio para Endereço</Text>
          <Text style={e.opcaoDescricao}>Entrega no conforto da sua residência</Text>
        </Pressionavel>

        <Pressionavel
          style={[e.cardOpcao, modo === 'RETIRADA' && e.cardOpcaoAtivo]}
          onPress={() => setModo('RETIRADA')}
          accessibilityRole="button"
          accessibilityLabel="Retirada na livraria"
        >
          <View style={e.linhaTopoOpcao}>
            <View style={[e.iconeOpcaoBox, { backgroundColor: '#D1FAE5' }]}>
              <Text style={e.iconeOpcaoTexto}>📍</Text>
            </View>
            <View style={[e.radioCirculo, modo === 'RETIRADA' && e.radioCirculoAtivo]}>
              {modo === 'RETIRADA' && <View style={e.radioPonto} />}
            </View>
          </View>
          <Text style={e.opcaoTitulo}>Retirar na Livraria</Text>
          <Text style={e.opcaoDescricao}>Retire grátis nos pontos parceiros</Text>
        </Pressionavel>
      </View>

      {/* Seção de Pontos de Retirada */}
      {modo === 'RETIRADA' ? (
        <View style={e.secaoPontos}>
          <Text style={e.subtituloSecao}>LIVRARIAS E PONTOS DISPONÍVEIS</Text>

          {carregandoPontos ? (
            <ActivityIndicator color={cores.primaria} style={{ marginVertical: 20 }} />
          ) : listaPontos.length === 0 ? (
            <View style={e.cardAvisoVazio}>
              <Text style={e.avisoTexto}>Esta livraria ainda não possui pontos de retirada cadastrados.</Text>
            </View>
          ) : (
            <>
              {statusLocalizacao !== 'ok' ? (
                <View style={e.bannerLocalizacao}>
                  <Text style={e.bannerLocalizacaoTexto}>
                    📍 Exibindo em ordem alfabética. Ative a localização para ver a distância exata.
                  </Text>
                </View>
              ) : null}

              {listaPontos.map((ponto) => {
                const escolhido = ponto.id === pontoEscolhido;
                return (
                  <Pressionavel
                    key={ponto.id}
                    style={[e.pontoCard, escolhido && e.pontoCardEscolhido]}
                    onPress={() => setPontoEscolhido(ponto.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Ponto ${ponto.name}`}
                  >
                    <View style={e.pontoTopo}>
                      <View style={e.pontoNomeLinha}>
                        <Text style={e.pontoIcone}>🏛️</Text>
                        <Text style={e.pontoNome}>{ponto.name}</Text>
                      </View>
                      {ponto.distanceKm !== null ? (
                        <View style={e.badgeDistancia}>
                          <Text style={e.badgeDistanciaTexto}>{ponto.distanceKm} km</Text>
                        </View>
                      ) : null}
                    </View>

                    {ponto.hours ? (
                      <Text style={e.pontoHorario}>🕒 Atendimento: {ponto.hours}</Text>
                    ) : null}

                    {escolhido && (
                      <View style={e.badgeSelecionado}>
                        <Text style={e.badgeSelecionadoTexto}>✓ Ponto selecionado para retirada</Text>
                      </View>
                    )}
                  </Pressionavel>
                );
              })}
            </>
          )}
        </View>
      ) : null}

      {/* Card de Resumo de Valores */}
      {carrinho ? (
        <View style={e.cardResumo}>
          <View style={e.linhaResumo}>
            <Text style={e.resumoLabel}>Modalidade escolhida</Text>
            <Text style={e.resumoValorSecundario}>
              {modo === 'RETIRADA' ? 'Retirada na Livraria' : 'Envio Convencional'}
            </Text>
          </View>
          <View style={e.linhaResumo}>
            <Text style={e.resumoLabel}>Custo de entrega</Text>
            <Text style={e.resumoGratis}>✓ Grátis</Text>
          </View>
          <View style={e.divisorResumo} />
          <View style={e.linhaTotal}>
            <Text style={e.resumoRotulo}>Total a pagar</Text>
            <Text style={e.resumoValor}>{formatarPreco(carrinho.total)}</Text>
          </View>
        </View>
      ) : null}

      <Pressionavel
        style={e.botao}
        onPress={confirmar}
        disabled={finalizar.isPending}
        accessibilityRole="button"
        accessibilityLabel="Confirmar pedido de livros"
      >
        {finalizar.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={e.botaoTexto}>Continuar para pagamento PIX →</Text>
        )}
      </Pressionavel>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  conteudo: { padding: 16, gap: 14, paddingBottom: 36 },
  titulo: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  opcoes: { flexDirection: 'row', gap: 12 },
  cardOpcao: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    gap: 8,
  },
  cardOpcaoAtivo: {
    borderColor: cores.primaria,
    backgroundColor: '#EFF6FF',
  },
  linhaTopoOpcao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconeOpcaoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeOpcaoTexto: {
    fontSize: 20,
  },
  radioCirculo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCirculoAtivo: {
    borderColor: cores.primaria,
  },
  radioPonto: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: cores.primaria,
  },
  opcaoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  opcaoDescricao: {
    fontSize: 12,
    color: cores.textoFraco,
    lineHeight: 16,
  },
  secaoPontos: {
    gap: 10,
    marginTop: 6,
  },
  subtituloSecao: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  cardAvisoVazio: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avisoTexto: {
    fontSize: 13,
    color: cores.textoFraco,
    textAlign: 'center',
  },
  bannerLocalizacao: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  bannerLocalizacaoTexto: {
    fontSize: 12,
    color: cores.primaria,
    fontWeight: '600',
  },
  pontoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    gap: 8,
  },
  pontoCardEscolhido: {
    borderColor: cores.primaria,
    backgroundColor: '#F8FAFC',
  },
  pontoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pontoNomeLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pontoIcone: {
    fontSize: 18,
  },
  pontoNome: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  badgeDistancia: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDistanciaTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: cores.primaria,
  },
  pontoHorario: {
    fontSize: 12,
    color: cores.textoFraco,
    marginLeft: 26,
  },
  badgeSelecionado: {
    backgroundColor: '#D1FAE5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeSelecionadoTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  cardResumo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    gap: 8,
    marginTop: 6,
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
  linhaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumoRotulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  resumoValor: {
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
    marginTop: 6,
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
