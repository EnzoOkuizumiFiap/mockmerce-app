/**
 * ---------------------------------------------------------------------------
 * CABECALHO SUSPENSO (Estilo Apple / Cápsula Flutuante)
 * ---------------------------------------------------------------------------
 * Cabeçalho em formato de pílula suspensa translúcida com cantos arredondados,
 * inspirado no design system da Apple (Dynamic Island / VisionOS / Safari).
 *
 * - Lado Esquerdo: Marca "📖 Livro aberto" (ou botão voltar "‹ Voltar")
 * - Centro: Título da obra ou tela quando navegando em profundidade
 * - Lado Direito: Pílula interativa "👤 Perfil"
 * ---------------------------------------------------------------------------
 */
import { useCallback, useEffect } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores } from '../lib/tema';

export function CabecalhoSuspenso({ navigation, route, options, back }: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();
  const ehPerfil = route.name === 'Perfil';

  // Volta sempre diretamente para a tela raiz correspondente a cada página
  const voltarParaRaiz = useCallback(() => {
    // 1. Telas secundárias de fluxo com tela-raiz específica:
    if (route.name === 'Checkout') {
      navigation.reset({
        index: 1,
        routes: [{ name: 'ListaProdutos' }, { name: 'Carrinho' }],
      });
      return;
    }

    if (route.name === 'Avaliar') {
      const params = route.params as { produtoId?: string; produtoNome?: string } | undefined;
      if (params?.produtoId) {
        navigation.reset({
          index: 1,
          routes: [
            { name: 'ListaProdutos' },
            {
              name: 'DetalheProduto',
              params: { id: params.produtoId, nome: params.produtoNome ?? 'Obra' },
            },
          ],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ListaProdutos' }],
        });
      }
      return;
    }

    // 2. Para todas as demais telas (DetalheProduto, Favoritos, Carrinho, Perfil, PontosRetirada, Pedido):
    // A raiz é SEMPRE o Catálogo Inicial (ListaProdutos), limpando qualquer empilhamento
    navigation.reset({
      index: 0,
      routes: [{ name: 'ListaProdutos' }],
    });
  }, [navigation, route.name, route.params]);

  // Sincroniza o botão físico/gesto de voltar do Android para ir sempre à tela raiz
  useEffect(() => {
    if (!back) return;

    const inscricao = BackHandler.addEventListener('hardwareBackPress', () => {
      voltarParaRaiz();
      return true;
    });

    return () => inscricao.remove();
  }, [back, voltarParaRaiz]);

  return (
    <View style={[e.envelope, { paddingTop: insets.top + (Platform.OS === 'android' ? 6 : 4) }]}>
      <View style={e.capsula}>
        {/* Lado Esquerdo: Marca "Livro aberto" ou Botão Voltar para a Raiz */}
        {back ? (
          <Pressable
            style={e.botaoVoltar}
            onPress={voltarParaRaiz}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Text style={e.iconeVoltar}>‹</Text>
            <Text style={e.textoVoltar}>Voltar</Text>
          </Pressable>
        ) : (
          <View style={e.marcaGrupo}>
            <Text style={e.marcaIcone}>📖</Text>
            <Text style={e.marcaTexto}>Livro aberto</Text>
          </View>
        )}

        {/* Centro: Título elegante da tela (quando navegando em sub-telas) */}
        {back ? (
          <View style={e.centro}>
            <Text style={e.tituloTela} numberOfLines={1}>
              {options.title ?? route.name}
            </Text>
          </View>
        ) : null}

        {/* Lado Direito: Pílula Perfil (limpa o histórico para [ListaProdutos, Perfil]) */}
        <Pressable
          style={[e.botaoPerfil, ehPerfil && e.botaoPerfilAtivo]}
          onPress={() => {
            if (ehPerfil) return;
            navigation.reset({
              index: 1,
              routes: [{ name: 'ListaProdutos' }, { name: 'Perfil' }],
            });
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Abrir tela de perfil"
        >
          <Text style={e.iconePerfil}>👤</Text>
          <Text style={[e.textoPerfil, ehPerfil && e.textoPerfilAtivo]}>Perfil</Text>
        </Pressable>
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  envelope: {
    backgroundColor: cores.fundo,
    paddingBottom: 6,
  },
  capsula: {
    marginHorizontal: 6,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  marcaGrupo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  marcaIcone: {
    fontSize: 22,
  },
  marcaTexto: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  centro: {
    flex: 1,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tituloTela: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  botaoVoltar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconeVoltar: {
    fontSize: 20,
    fontWeight: '800',
    color: cores.primaria,
    marginTop: -2,
  },
  textoVoltar: {
    fontSize: 13,
    fontWeight: '700',
    color: cores.primaria,
  },
  botaoPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  botaoPerfilAtivo: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  iconePerfil: {
    fontSize: 15,
  },
  textoPerfil: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  textoPerfilAtivo: {
    color: '#0F172A',
  },
});
