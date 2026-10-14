/**
 * ---------------------------------------------------------------------------
 * TELA: DETALHE
 * ---------------------------------------------------------------------------
 * Mesma disciplina de estados da listagem, com uma diferenca: aqui nao existe
 * "vazio". Ou o produto veio, ou deu erro (um 404 e erro, com mensagem
 * propria vinda do interceptor).
 * ---------------------------------------------------------------------------
 */
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { EstadoCarregando } from '../components/EstadoCarregando';
import { EstadoErro } from '../components/EstadoErro';
import { Estrelas } from '../components/Estrelas';
import { SecaoAvaliacoes } from '../components/SecaoAvaliacoes';
import { useFavoritos } from '../contexts/FavoritosContext';
import { ehAppError } from '../errors/AppError';
import { useAdicionarAoCarrinho } from '../hooks/useCompra';
import { useProduto } from '../hooks/useProdutos';
import { PrecoAnimado } from '../components/PrecoAnimado';
import { Pressionavel } from '../components/Pressionavel';
import { useAnimacoes } from '../contexts/AnimacoesContext';
import { formatarFaixaDePreco } from '../lib/formatar';
import { resumoDeDetalhe } from '../lib/produto';
import { AppStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AppStackParamList, 'DetalheProduto'>;

export function DetalheProdutoScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { animacoesAtivas } = useAnimacoes();

  const { data, isPending, isError, error, refetch } = useProduto(id);
  const { alternarFavorito, ehFavorito } = useFavoritos();
  const adicionar = useAdicionarAoCarrinho();

  const [varianteIdSelecionada, setVarianteIdSelecionada] = useState<string | null>(null);

  const resumo = useMemo(() => (data ? resumoDeDetalhe(data) : null), [data]);

  const varianteAtual = useMemo(() => {
    if (!data) return undefined;
    if (varianteIdSelecionada) {
      const encontrada = data.variants.find((v) => v.id === varianteIdSelecionada);
      if (encontrada) return encontrada;
    }
    return data.variants.find((v) => v.isDefault) ?? data.variants[0];
  }, [data, varianteIdSelecionada]);

  if (isPending) return <EstadoCarregando mensagem="Abrindo detalhes da obra..." />;

  if (isError) {
    return (
      <EstadoErro
        mensagem={ehAppError(error) ? error.mensagem : 'Não foi possível carregar as informações desta obra.'}
        aoTentarNovamente={() => refetch()}
      />
    );
  }

  const favoritado = ehFavorito(data.id);
  const principal = data.images.find((i) => i.isPrimary) ?? data.images[0];

  function aoAdicionarSacola() {
    if (!varianteAtual) return;
    adicionar.mutate(
      { variantId: varianteAtual.id },
      { onSuccess: () => navigation.navigate('Carrinho') },
    );
  }

  return (
    <View style={e.tela}>
      <ScrollView
        style={e.scroll}
        contentContainerStyle={e.conteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Capa do Livro (Idêntico ao livro-detalhes.png) */}
        <Animated.View
          entering={animacoesAtivas ? FadeIn.duration(280) : undefined}
          style={e.cardCapa}
        >
          {principal ? (
            <Animated.Image
              entering={animacoesAtivas ? FadeIn.duration(300) : undefined}
              source={{ uri: principal.url }}
              style={e.capaLivroComFoto}
              resizeMode="cover"
            />
          ) : (
            <View style={e.livroSemCapa}>
              {/* Lombada azul clássica do livro */}
              <View style={e.lombada} />
              <View style={e.corpoSemCapa}>
                <View style={e.circuloIcone}>
                  <Text style={{ fontSize: 28 }}>📖</Text>
                </View>
                <Text style={e.tituloCapa} numberOfLines={3}>
                  {data.name}
                </Text>
                <View style={e.badgeSemCapa}>
                  <Text style={e.textoBadgeSemCapa}>CAPA INDISPONÍVEL</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Card 2: Informações da Obra (Idêntico ao livro-detalhes.png) */}
        <Animated.View
          entering={animacoesAtivas ? FadeInDown.delay(70).duration(260) : undefined}
          style={e.cardInfo}
        >
          <Text style={e.tituloObra}>{data.name}</Text>

          {data.brand && (
            <Text style={e.autorObra}>📚 {data.brand.name}</Text>
          )}

          <View style={e.notaLinha}>
            <Estrelas nota={data.rating.average} tamanho={15} />
            <Text style={e.notaTexto}>
              {data.rating.count > 0
                ? `${data.rating.average.toFixed(1)} (${data.rating.count} ${data.rating.count === 1 ? 'avaliação' : 'avaliações'})`
                : 'Seja o primeiro a avaliar esta obra'}
            </Text>
          </View>

          {/* Linha de Valor e Estoque */}
          <View style={e.linhaValorEstoque}>
            <View>
              <Text style={e.labelValor}>VALOR</Text>
              {varianteAtual ? (
                <PrecoAnimado valor={varianteAtual.price} style={e.valorTexto} />
              ) : (
                <Text style={e.valorTexto}>
                  {resumo ? formatarFaixaDePreco(resumo.priceFrom, resumo.priceTo) : ''}
                </Text>
              )}
            </View>

            {resumo?.stock === 0 ? (
              <View style={[e.badgeEstoque, e.badgeEsgotado]}>
                <Text style={e.textoEsgotado}>• Esgotado</Text>
              </View>
            ) : resumo?.stock !== undefined ? (
              <View style={e.badgeEstoque}>
                <Text style={e.textoEstoque}>• {resumo.stock} em estoque</Text>
              </View>
            ) : null}
          </View>

          {/* Opções de Formato (Chips interativos como no livro-detalhes.png) */}
          {data.variants.length > 1 && (
            <View style={e.secaoFormatos}>
              <Text style={e.subtituloSecao}>OPÇÕES DE FORMATO</Text>
              <View style={e.linhaChipsFormatos}>
                {data.variants.map((v) => {
                  const ativa = v.id === varianteAtual?.id;
                  return (
                    <Pressable
                      key={v.id}
                      style={[e.chipFormato, ativa && e.chipFormatoAtivo]}
                      onPress={() => setVarianteIdSelecionada(v.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar formato ${v.label ?? v.sku ?? 'Padrão'}`}
                    >
                      <Text style={[e.textoChipFormato, ativa && e.textoChipFormatoAtivo]}>
                        {v.label ?? v.sku ?? 'Padrão'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Sobre a Obra (Sinopse) */}
          {data.description && (
            <View style={e.secaoSobre}>
              <Text style={e.subtituloSecao}>SOBRE A OBRA</Text>
              <Text style={e.descricaoTexto}>{data.description}</Text>
            </View>
          )}
        </Animated.View>

        {/* Card 3: Avaliações dos Leitores */}
        <View style={e.cardAvaliacoes}>
          <SecaoAvaliacoes
            produtoId={data.id}
            aoAvaliar={(avaliacaoExistente) =>
              navigation.navigate('Avaliar', {
                produtoId: data.id,
                produtoNome: data.name,
                avaliacaoInicial: avaliacaoExistente,
              })
            }
          />
        </View>
      </ScrollView>

      {/* Barra Fixa Inferior (Idêntica ao livro-detalhes.png) */}
      <View style={e.barraFixa}>
        <Pressionavel
          style={[e.botaoFavoritoFixo, favoritado && e.botaoFavoritoFixoAtivo]}
          onPress={() => resumo && alternarFavorito(resumo)}
          accessibilityRole="button"
          accessibilityLabel="Guardar livro na estante"
        >
          <Text style={e.iconeFavoritoFixo}>{favoritado ? '❤️' : '🤍'}</Text>
        </Pressionavel>

        <Pressionavel
          style={[
            e.botaoAdicionarFixo,
            (adicionar.isPending || resumo?.stock === 0) && e.botaoDesabilitado,
          ]}
          onPress={aoAdicionarSacola}
          disabled={adicionar.isPending || resumo?.stock === 0}
          accessibilityRole="button"
          accessibilityLabel="Adicionar à sacola"
        >
          <Text style={e.textoAdicionarFixo}>
            {adicionar.isPending
              ? 'Colocando na sacola...'
              : resumo?.stock === 0
              ? 'Esgotado'
              : 'Adicionar à sacola'}
          </Text>
        </Pressionavel>
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scroll: {
    flex: 1,
  },
  conteudo: {
    padding: 16,
    paddingBottom: 110,
    gap: 16,
  },
  cardCapa: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  capaLivroComFoto: {
    width: 215,
    height: 305,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  livroSemCapa: {
    width: 215,
    height: 305,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  lombada: {
    width: 32,
    backgroundColor: '#93C5FD',
  },
  corpoSemCapa: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circuloIcone: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  tituloCapa: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 22,
  },
  badgeSemCapa: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textoBadgeSemCapa: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  cardInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    gap: 12,
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  tituloObra: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 30,
  },
  autorObra: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  notaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notaTexto: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  linhaValorEstoque: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  labelValor: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  valorTexto: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0284C7',
  },
  badgeEstoque: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  textoEstoque: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  badgeEsgotado: {
    backgroundColor: '#FEE2E2',
  },
  textoEsgotado: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  secaoFormatos: {
    marginTop: 8,
    gap: 8,
  },
  subtituloSecao: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  linhaChipsFormatos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipFormato: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  chipFormatoAtivo: {
    borderColor: '#0284C7',
    backgroundColor: '#EFF6FF',
  },
  textoChipFormato: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  textoChipFormatoAtivo: {
    color: '#0284C7',
  },
  secaoSobre: {
    marginTop: 8,
    gap: 6,
  },
  descricaoTexto: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  cardAvaliacoes: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  barraFixa: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  botaoFavoritoFixo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoFavoritoFixoAtivo: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F2',
  },
  iconeFavoritoFixo: {
    fontSize: 22,
  },
  botaoAdicionarFixo: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  botaoDesabilitado: {
    backgroundColor: '#94A3B8',
    elevation: 0,
    shadowOpacity: 0,
  },
  textoAdicionarFixo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
