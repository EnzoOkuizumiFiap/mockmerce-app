import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getProduct } from '@/services/products';
import { money } from '@/lib/format';
import { Button, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError, Product, ProductVariant } from '@/types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route }: Props) {
  const { id } = route.params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    setErro(null);
    getProduct(id)
      .then((p) => vivo && setProduct(p))
      .catch((e: ApiError) => vivo && setErro(e.message))
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, [id]);

  const selected: ProductVariant | undefined = useMemo(() => {
    if (!product) return undefined;
    return (
      product.variants.find((v) => v.id === variantId) ??
      product.variants.find((v) => v.isDefault) ??
      product.variants[0]
    );
  }, [product, variantId]);

  if (loading) {
    return <Loading label="Carregando produto…" />;
  }
  if (erro || !product) {
    return <ErrorState message={erro ?? 'Falha'} />;
  }

  const outOfStock = !selected || selected.stock <= 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {product.images[0] && <Image source={{ uri: product.images[0].url }} style={styles.hero} />}
      <Text style={styles.name}>{product.name}</Text>
      {selected && <Text style={styles.price}>{money(selected.price)}</Text>}
      {product.description && <Text style={styles.desc}>{product.description}</Text>}

      {product.type === 'VARIABLE' && (
        <View style={styles.variants}>
          <Text style={styles.label}>Opções</Text>
          <View style={styles.variantRow}>
            {product.variants.map((v) => {
              const active = v.id === selected?.id;
              return (
                <Text
                  key={v.id}
                  onPress={() => setVariantId(v.id)}
                  style={[styles.chip, active && styles.chipActive, v.stock <= 0 && styles.chipDisabled]}
                >
                  {v.label ?? v.sku}
                </Text>
              );
            })}
          </View>
        </View>
      )}

      <Text style={styles.stock}>{outOfStock ? 'Sem estoque' : `${selected?.stock} em estoque`}</Text>

      {/* TODO Semana 2 (Bloco 3): trocar este Alert pela mutation otimista
          addItem.mutate({ variantId, quantity: 1, name, unitPrice }). */}
      <Button
        label="Adicionar ao carrinho"
        onPress={() => Alert.alert('Semana 2', 'Ligar o carrinho: useCartMutations + login (Blocos 2 e 3).')}
        disabled={outOfStock}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  hero: { width: '100%', height: 260, borderRadius: 14, backgroundColor: '#e5e7eb' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  price: { fontSize: 20, fontWeight: '800', color: '#111827' },
  desc: { fontSize: 14, color: '#374151', lineHeight: 20 },
  variants: { gap: 6, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  chipDisabled: { opacity: 0.4 },
  stock: { fontSize: 13, color: '#6b7280' },
});
