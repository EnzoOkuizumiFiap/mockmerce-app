/**
 * ---------------------------------------------------------------------------
 * AVATAR
 * ---------------------------------------------------------------------------
 * Mostra a foto do usuario. Quando nao ha foto — que e o caso desta API hoje —
 * desenha as iniciais.
 *
 * POR QUE NAO USAR UM SERVICO DE AVATAR (ui-avatars, gravatar, dicebear)?
 *
 * Porque a tela de perfil precisa abrir em modo aviao. Um avatar remoto
 * transformaria a unica tela 100% offline do app numa tela que depende de
 * rede para ficar apresentavel. Iniciais desenhadas localmente sao instantaneas
 * e nunca falham.
 * ---------------------------------------------------------------------------
 */
import { Image, StyleSheet, Text, View } from 'react-native';

import { iniciais } from '../lib/formatar';
import { cores } from '../lib/tema';

type Props = {
  nome: string;
  imagem?: string | null;
  tamanho?: number;
};

export function Avatar({ nome, imagem, tamanho = 96 }: Props) {
  const base = {
    width: tamanho,
    height: tamanho,
    borderRadius: tamanho / 2,
  };

  if (imagem) {
    return <Image source={{ uri: imagem }} style={[e.foto, base]} />;
  }

  return (
    <View style={[e.iniciais, base]}>
      <Text style={[e.texto, { fontSize: tamanho * 0.36 }]}>{iniciais(nome)}</Text>
    </View>
  );
}

const e = StyleSheet.create({
  foto: {
    backgroundColor: cores.neutroClaro,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  iniciais: {
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#EFF6FF',
    elevation: 5,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  texto: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
