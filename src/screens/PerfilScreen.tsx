/**
 * ---------------------------------------------------------------------------
 * TELA: PERFIL
 * ---------------------------------------------------------------------------
 * Mostra quem esta logado e permite sair.
 *
 * NENHUM DADO DESTA TELA VEM DA API.
 *
 * O nome e o e-mail sao lidos do AsyncStorage (gravados no login); a
 * contagem vem dos favoritos, que tambem sao locais; o avatar e desenhado no
 * proprio aparelho quando nao ha foto. Por isso esta tela abre instantanea e
 * funciona em modo aviao.
 *
 * A alternativa seria um GET /auth/me a cada abertura. Estaria "mais certo"
 * no sentido de estar sempre sincronizado — e seria a unica tela do app que
 * quebra sem internet, para mostrar um nome que praticamente nunca muda.
 * ---------------------------------------------------------------------------
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Avatar } from '../components/Avatar';
import { CartaoAnimacoes } from '../components/CartaoAnimacoes';
import { CartaoNotificacoes } from '../components/CartaoNotificacoes';
import { useAuth } from '../contexts/AuthContext';
import { useFavoritos } from '../contexts/FavoritosContext';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';

export function PerfilScreen() {
  const { usuario, sair } = useAuth();
  // `useNavigation` porque esta tela nao recebe props de navegacao (ela e
  // aberta pelo botao do cabecalho, nao por uma rota tipada com params).
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { favoritos } = useFavoritos();

  /**
   * Se o logout acontecer enquanto esta tela esta montada, `usuario` vira
   * null por um instante antes de o RootNavigator trocar o stack. Sem este
   * guard, o render quebraria nesse frame.
   */
  if (!usuario) return null;

  const quantidade = favoritos.length;

  return (
    <ScrollView
      style={e.scroll}
      contentContainerStyle={e.container}
      showsVerticalScrollIndicator={false}
    >
      <Avatar nome={usuario.name} imagem={usuario.image} tamanho={96} />

      <Text style={e.nome}>{usuario.name}</Text>
      <Text style={e.email}>{usuario.email}</Text>

      <Text style={e.contagem}>
        {quantidade === 1 ? '1 item salvo' : `${quantidade} itens salvos`}
      </Text>

      <View style={e.atalhos}>
        <Pressable style={e.atalho} onPress={() => navigation.navigate('Carrinho')}>
          <Text style={e.atalhoTexto}>Carrinho</Text>
        </Pressable>
        <Pressable style={e.atalho} onPress={() => navigation.navigate('PontosRetirada')}>
          <Text style={e.atalhoTexto}>Onde retirar</Text>
        </Pressable>
      </View>

      <CartaoAnimacoes />

      <CartaoNotificacoes />

      <Pressable style={e.botao} onPress={sair} accessibilityRole="button">
        <Text style={e.textoBotao}>Sair</Text>
      </Pressable>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  atalhos: { flexDirection: 'row', gap: 8, marginTop: 16 },
  atalho: {
    borderWidth: 1.5, borderColor: cores.primaria, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  atalhoTexto: { color: cores.primaria, fontWeight: '600', fontSize: 14 },
  scroll: {
    flex: 1,
    backgroundColor: cores.superficie,
  },
  container: {
    alignItems: 'center',
    padding: 32,
    paddingBottom: 48,
    gap: 8,
  },
  nome: { fontSize: 20, fontWeight: '700', color: cores.textoForte, marginTop: 12 },
  email: { fontSize: 14, color: cores.textoFraco },
  contagem: { fontSize: 14, color: cores.primaria, fontWeight: '600', marginTop: 8 },
  botao: {
    marginTop: 32,
    borderWidth: 1.5,
    borderColor: cores.perigo,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  textoBotao: { color: cores.perigo, fontWeight: '700', fontSize: 15 },
});
