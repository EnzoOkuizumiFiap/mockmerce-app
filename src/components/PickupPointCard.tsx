import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/lib/theme';
import { addressSummary, formatKm } from '@/lib/pickup';
import type { PickupPoint } from '@/types/location';

type Props = {
  point: PickupPoint;
  selected?: boolean;
  onPress?: () => void;
};

/** Mesmo card na tela do mapa e no checkout: uma fonte, dois usos. */
export function PickupPointCard({ point, selected = false, onPress }: Props) {
  const address = addressSummary(point);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
    >
      <View style={styles.titleRow}>
        <Text style={styles.name} numberOfLines={2}>
          {point.name}
        </Text>
        {/* Sem posição, distanceKm é null e o selo some. */}
        {point.distanceKm !== null ? (
          <View style={styles.distance}>
            <Text style={styles.distanceText}>{formatKm(point.distanceKm)}</Text>
          </View>
        ) : null}
      </View>
      {address ? <Text style={styles.address}>{address}</Text> : null}
      {point.hours ? <Text style={styles.hours}>{point.hours}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 14,
    gap: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.greyLight,
  },
  cardSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  pressed: { opacity: 0.8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.colors.dark },
  distance: {
    backgroundColor: theme.colors.mintLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  distanceText: { fontSize: 12, fontWeight: '800', color: theme.colors.mintDark },
  address: { fontSize: 13, color: theme.colors.greyDark },
  hours: { fontSize: 12, color: theme.colors.greyDark },
});