import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProduct } from '@/hooks/useProduct';
import { useCartMutations } from '@/hooks/useCartMutations';
import { useSession } from '@/session/session';
import { money } from '@/lib/format';
import { Button, Card, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError, ProductVariant } from '@/types/api';
import { theme } from '@/lib/theme';

// Tipagem das props de navegação da tela de Detalhe do Produto
type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

/**
 * ============================================================================
 * TELA: ProductDetailScreen (Detalhes do Produto e Seleção de Variantes)
 * ============================================================================
 * 
 * Responsabilidades desta tela:
 * 1. Obter o ID do produto via parâmetros de rota (`route.params.id`).
 * 2. Buscar os dados detalhados do produto via `useProduct(id)`.
 * 3. Gerenciar a seleção de variantes (ex: Tamanhos P, M, G ou Cores).
 * 4. Adicionar o item ao carrinho via mutação otimista (`addItem.mutate`).
 */
export function ProductDetailScreen({ route, navigation }: Props) {
  // 1. Extrai o ID do produto enviado na navegação da tela anterior
  const { id } = route.params;

  // 2. Busca os dados do produto específico via TanStack Query (com cache)
  const { data: product, isLoading, isError, error, refetch } = useProduct(id);

  // 3. Verifica se o usuário está logado (necessário para comprar)
  const { isLoggedIn } = useSession();

  // 4. Hook de mutação para adicionar itens ao carrinho
  const { addItem } = useCartMutations();

  // Estado que armazena a variante selecionada pelo usuário (ex: id da variante "Tamanho M")
  const [variantId, setVariantId] = useState<string | null>(null);

  /**
   * useMemo: Seleção Inteligente de Variante
   * 
   * Por que usar useMemo aqui?
   * O `useMemo` memoriza o cálculo da variante ativa e só recalcula se `product` ou `variantId` mudarem.
   * 
   * Ordem de Prioridade (Fallback):
   * 1º A variante que o usuário clicou (`variantId`);
   * 2º Se ainda não clicou, a variante marcada como padrão pelo backend (`isDefault`);
   * 3º Se não houver padrão, a primeira variante da lista (`variants[0]`).
   */
  const selected: ProductVariant | undefined = useMemo(() => {
    if (!product) return undefined;
    return (
      product.variants.find((v) => v.id === variantId) ??
      product.variants.find((v) => v.isDefault) ??
      product.variants[0]
    );
  }, [product, variantId]);

  // --------------------------------------------------------------------------
  // ESTADOS DE TELA CHEIA (Early Returns / Retornos Antecipados)
  // --------------------------------------------------------------------------
  // 1. Carregando: Enquanto a API busca os dados, exibe o spinner
  if (isLoading) return <Loading label="Carregando produto…" />;

  // 2. Erro ou Produto Não Encontrado:
  // - `(error as ApiError)?.message`: Converte o erro para o tipo ApiError e extrai a mensagem retornada pelo servidor.
  // - `?? 'Falha'`: Se por algum motivo não houver mensagem, usa 'Falha' como texto padrão.
  // - `onRetry={() => refetch()}`: Passa a função do React Query para o botão "Tentar de novo" recarregar os dados.
  if (isError || !product) return <ErrorState message={(error as ApiError)?.message ?? 'Falha'} onRetry={() => refetch()} />;

  // Verifica se a variante atual está esgotada
  const outOfStock = !selected || selected.stock <= 0;

  /**
   * Dispara a mutação para adicionar ao carrinho e redireciona para a tela do Carrinho
   */
  function handleAdd() {
    if (!product || !selected) return;

    addItem.mutate(
      {
        variantId: selected.id,
        quantity: 1,
        // Se a variante tem label (ex: "G"), monta "Camiseta Básica (G)"
        name: selected.label ? `${product.name} (${selected.label})` : product.name,
        unitPrice: selected.price,
      },
      {
        // onSuccess: Assim que disparar com sucesso, navega para a tela do carrinho
        onSuccess: () => navigation.navigate('Cart'),
      },
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Card 1: Mockup da Capa do Livro ou Imagem */}
        <Card style={styles.coverCard}>
          {product.images[0] ? (
            <Image source={{ uri: product.images[0].url }} style={styles.hero} resizeMode="contain" />
          ) : (
            <View style={styles.bookMockup}>
              <View style={styles.mockupSpine} />
              <View style={styles.mockupBody}>
                <View style={styles.mockupIconCircle}>
                  <Text style={{ fontSize: 30 }}>📖</Text>
                </View>
                <Text style={styles.mockupTitle} numberOfLines={3}>{product.name}</Text>
                <View style={styles.mockupBadge}>
                  <Text style={styles.mockupBadgeText}>CAPA INDISPONÍVEL</Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* Card 2: Informações da Obra, Preço e Estoque */}
        <Card style={styles.infoCard}>
          {/* Nome da Obra */}
          <Text style={styles.name}>{product.name}</Text>

          {/* Linha de Preço e Status de Estoque */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>VALOR</Text>
              {selected && <Text style={styles.price}>{money(selected.price)}</Text>}
            </View>

            {/* Badge de Saldo de Estoque */}
            <View style={[styles.stockPill, outOfStock && styles.stockPillOut]}>
              <Text style={[styles.stockPillText, outOfStock && styles.stockPillTextOut]}>
                {outOfStock ? '• Sem estoque' : `• ${selected?.stock} em estoque`}
              </Text>
            </View>
          </View>

          {/* Divisor */}
          <View style={styles.divider} />

          {/* Se o produto for 'VARIABLE' (tem tamanhos/cores), exibe a lista de opções. Se for 'SIMPLE', este bloco é ignorado */}
          {product.type === 'VARIABLE' && (
            <View style={styles.variants}>
              <Text style={styles.sectionLabel}>OPÇÕES DE FORMATO</Text>
              <View style={styles.variantRow}>
                {/* .map(): Percorre todas as variantes e cria um botão (chip) para cada uma */}
                {product.variants.map((v) => {
                  // Verifica se esta opção é a que está atualmente selecionada
                  const active = v.id === selected?.id;

                  return (
                    <Text
                      key={v.id}
                      // Ao tocar no chip, atualiza o estado variantId com a opção escolhida
                      onPress={() => setVariantId(v.id)}
                      style={[
                        styles.chip,                         // Estilo base (botão arredondado)
                        active && styles.chipActive,         // Destaque se estiver selecionado
                        v.stock <= 0 && styles.chipDisabled, // Fica apagado (opacidade 0.4) se esgotado
                      ]}
                    >
                      {/* Exibe o nome amigável (ex: "Capa Dura"). Se não tiver, exibe o código SKU */}
                      {v.label ?? v.sku}
                    </Text>
                  );
                })}
              </View>
            </View>
          )}

          {/* Descrição / Sinopse */}
          {product.description ? (
            <View style={styles.descSection}>
              <Text style={styles.sectionLabel}>SOBRE A OBRA</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </View>
          ) : null}

          {/* Aviso caso o usuário não esteja logado */}
          {!isLoggedIn && (
            <Text style={styles.loginHint}>Você precisa estar logado para comprar (veja a tela do carrinho).</Text>
          )}
        </Card>
      </ScrollView>

      {/* Rodapé Fixo com Botão de Adicionar ao Carrinho */}
      <View style={styles.footer}>
        <Button
          label={addItem.isPending ? 'Adicionando…' : 'Adicionar ao carrinho'}
          onPress={handleAdd}
          disabled={outOfStock || !isLoggedIn || addItem.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.light },
  container: { padding: 14, gap: 14, paddingBottom: 24 },
  coverCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: theme.radius.xl,
    backgroundColor: '#ffffff',
  },
  hero: { width: '100%', height: 260, borderRadius: theme.radius.lg },
  bookMockup: {
    width: 200,
    height: 270,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  mockupSpine: {
    width: 22,
    backgroundColor: '#93c5fd',
    borderRightWidth: 1,
    borderRightColor: '#60a5fa',
  },
  mockupBody: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mockupIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  mockupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.dark,
    textAlign: 'center',
    lineHeight: 18,
  },
  mockupBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  mockupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  infoCard: {
    padding: 20,
    gap: 12,
    borderRadius: theme.radius.xl,
  },
  name: { fontSize: 20, fontWeight: '800', color: theme.colors.dark },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.greyDark,
    letterSpacing: 0.5,
  },
  price: { fontSize: 24, fontWeight: '800', color: theme.colors.mintDark, marginTop: 2 },
  stockPill: {
    backgroundColor: theme.colors.mintLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  stockPillOut: {
    backgroundColor: theme.colors.errorLight,
  },
  stockPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.mintDark,
  },
  stockPillTextOut: {
    color: theme.colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  variants: { gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: theme.colors.dark, letterSpacing: 0.5 },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  chipDisabled: { opacity: 0.4 },
  descSection: { gap: 6, marginTop: 4 },
  desc: { fontSize: 14, color: theme.colors.greyDark, lineHeight: 22 },
  loginHint: { fontSize: 13, color: '#b45309', marginTop: 4 },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 6,
  },
});
