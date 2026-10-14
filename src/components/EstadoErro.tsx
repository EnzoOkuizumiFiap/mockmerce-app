/**
 * Estado de erro.
 *
 * O botao "Tentar novamente" e opcional de proposito: so faz sentido onde ha
 * o que repetir. Mostrar um botao que nao resolve nada ensina o usuario a
 * ignorar os botoes do app.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../lib/tema';

type Props = { mensagem: string; aoTentarNovamente?: () => void };

export function EstadoErro({ mensagem, aoTentarNovamente }: Props) {
  return (
    <View style={e.container}>
      <Text style={e.mensagem}>{mensagem}</Text>
      {aoTentarNovamente && (
        <Pressable
          style={e.botao}
          onPress={aoTentarNovamente}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
        >
          <Text style={e.textoBotao}>Tentar novamente</Text>
        </Pressable>
      )}
    </View>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  mensagem: { fontSize: 16, color: cores.texto, textAlign: 'center', lineHeight: 22 },
  botao: {
    backgroundColor: cores.primaria,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  textoBotao: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
