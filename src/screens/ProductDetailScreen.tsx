import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProduct } from '@/hooks/useProduct';
import { useCartMutations } from '@/hooks/useCartMutations';
import { useSession } from '@/session/session';
import { money } from '@/lib/format';
import { Button, ErrorState, Loading } from '@/components/ui';
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
    <ScrollView contentContainerStyle={styles.container}>
      {/* Imagem Principal do Produto */}
      {product.images[0] && <Image source={{ uri: product.images[0].url }} style={styles.hero} />}

      {/* Nome e Preço */}
      <Text style={styles.name}>{product.name}</Text>
      {selected && <Text style={styles.price}>{money(selected.price)}</Text>}

      {/* Descrição */}
      {product.description && <Text style={styles.desc}>{product.description}</Text>}

      {/* Se o produto for 'VARIABLE' (tem tamanhos/cores), exibe a lista de opções. Se for 'SIMPLE', este bloco é ignorado */}
      {product.type === 'VARIABLE' && (
        <View style={styles.variants}>
          <Text style={styles.label}>Opções</Text>
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
                    active && styles.chipActive,         // Destaque preto se estiver selecionado
                    v.stock <= 0 && styles.chipDisabled, // Fica apagado (opacidade 0.4) se esgotado
                  ]}
                >
                  {/* Exibe o nome amigável (ex: "G"). Se não tiver, exibe o código SKU */}
                  {v.label ?? v.sku}
                </Text>
              );
            })}
          </View>
        </View>
      )}

      {/* Indicador de Estoque */}
      <Text style={styles.stock}>{outOfStock ? 'Sem estoque' : `${selected?.stock} em estoque`}</Text>

      {/* Aviso caso o usuário não esteja logado */}
      {!isLoggedIn && (
        <Text style={styles.loginHint}>Você precisa estar logado para comprar (veja a tela do carrinho).</Text>
      )}

      {/* Botão de Adicionar ao Carrinho com travas de segurança */}
      <Button
        label={addItem.isPending ? 'Adicionando…' : 'Adicionar ao carrinho'}
        onPress={handleAdd}
        disabled={outOfStock || !isLoggedIn || addItem.isPending}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  hero: { width: '100%', height: 260, borderRadius: 14, backgroundColor: theme.colors.light },
  name: { fontSize: 20, fontWeight: '700', color: theme.colors.dark },
  price: { fontSize: 20, fontWeight: '800', color: theme.colors.dark },
  desc: { fontSize: 14, color: theme.colors.greyDark, lineHeight: 20 },
  variants: { gap: 6, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.greyDark },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.colors.greyLight, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, overflow: 'hidden', color: theme.colors.dark },
  chipActive: { borderColor: theme.colors.dark, backgroundColor: theme.colors.dark, color: '#fff' },
  chipDisabled: { opacity: 0.4 },
  stock: { fontSize: 13, color: theme.colors.greyDark },
  loginHint: { fontSize: 13, color: '#b45309' },
});
