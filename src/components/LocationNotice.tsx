import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { theme } from '@/lib/theme';
import type { LocationStatus } from '@/hooks/useDeviceLocation';

type Props = {
  status: LocationStatus;
  canAskAgain: boolean;
  onRetry: () => void;
};

/**
 * Aviso discreto sobre a localização. Existe só quando há algo a
 * avisar, sempre explica o motivo e sempre oferece um caminho:
 *   denied + pode perguntar -> "Permitir localização"
 *   denied + não pode       -> "Abrir configurações"
 *   error                   -> "Tentar de novo"
 */
export function LocationNotice({ status, canAskAgain, onRetry }: Props) {
  if (status === 'ok' || status === 'idle') return null;

  if (status === 'loading') {
    return (
      <View style={[styles.box, styles.row]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.text}>Obtendo sua localização…</Text>
      </View>
    );
  }

  const denied = status === 'denied';

  return (
    <View style={styles.box}>
      <Text style={styles.text}>
        {denied
          ? 'Sem acesso à sua localização, os pontos aparecem em ordem alfabética, sem distância.'
          : 'Não conseguimos obter sua posição (GPS desligado ou sem sinal). Os pontos aparecem em ordem alfabética, sem distância.'}
      </Text>
      <Button
        label={denied ? (canAskAgain ? 'Permitir localização' : 'Abrir configurações') : 'Tentar de novo'}
        variant="ghost"
        onPress={denied && !canAskAgain ? () => Linking.openSettings() : onRetry}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flex: 1, fontSize: 13, color: theme.colors.primaryDark, lineHeight: 18 },
  button: { paddingVertical: 8, backgroundColor: theme.colors.white },
});