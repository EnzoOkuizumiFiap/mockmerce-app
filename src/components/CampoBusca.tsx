/**
 * Campo de busca. Componente burro: recebe o valor e avisa quando muda.
 * Quem decide o que fazer com o texto e a tela.
 */
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { cores } from '../lib/tema';

type Props = {
  valor: string;
  aoMudar: (texto: string) => void;
};

export function CampoBusca({ valor, aoMudar }: Props) {
  return (
    <View style={e.container}>
      <TextInput
        style={e.campo}
        value={valor}
        onChangeText={aoMudar}
        placeholder="Buscar produtos..."
        placeholderTextColor={cores.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {/* O botao de limpar so aparece quando ha texto. Detalhe pequeno que
          evita o usuario apagar letra por letra. */}
      {valor.length > 0 && (
        <Pressable
          onPress={() => aoMudar('')}
          hitSlop={10}
          style={e.limpar}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
        >
          <Text style={e.limparTexto}>{'×'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const e = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  campo: { flex: 1, paddingVertical: 10, fontSize: 15, color: cores.textoForte },
  limpar: { padding: 4 },
  limparTexto: { fontSize: 22, color: cores.placeholder, lineHeight: 24 },
});
