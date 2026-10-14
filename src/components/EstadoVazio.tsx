import { StyleSheet, Text, View } from 'react-native';

import { cores } from '../lib/tema';

export function EstadoVazio({
  mensagem = 'Nada por aqui ainda.',
  icone = '📚',
}: {
  mensagem?: string;
  icone?: string;
}) {
  return (
    <View style={e.container}>
      <Text style={e.icone}>{icone}</Text>
      <Text style={e.texto}>{mensagem}</Text>
    </View>
  );
}

const e = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  icone: {
    fontSize: 48,
    marginBottom: 4,
  },
  texto: {
    fontSize: 15,
    color: cores.textoFraco,
    textAlign: 'center',
    lineHeight: 22,
  },
});
