import { useCart } from '@/hooks/useCart';
import { StyleSheet, Text, View } from 'react-native';

export function CartScreen() {
  const { data: cart, isLoading, isError, error, refetch } = useCart();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🛒</Text>
      <Text style={styles.title}>Carrinho — a construir na Semana 2</Text>
      <Text style={styles.body}>
        Blocos 2 e 3 de quarta: login do comprador, useCart e mutations otimistas.
        Siga o exercicios.md §2 e compare com o app do professor.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10, backgroundColor: '#fff' },
  emoji: { fontSize: 48 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' },
  body: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
});
