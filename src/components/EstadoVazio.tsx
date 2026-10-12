import { StyleSheet, Text, View } from 'react-native';

import { cores } from '../lib/tema';

export function EstadoVazio({ mensagem = 'Nada por aqui ainda.' }: { mensagem?: string }) {
  return (
    <View style={e.container}>
      <Text style={e.texto}>{mensagem}</Text>
    </View>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  texto: { fontSize: 16, color: cores.textoFraco, textAlign: 'center' },
});
