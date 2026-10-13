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
  foto: { backgroundColor: cores.neutroClaro },
  iniciais: {
    backgroundColor: cores.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { color: cores.primariaEscura, fontWeight: '800' },
});
