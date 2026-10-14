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
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Avatar } from '../components/Avatar';
import { CartaoAnimacoes } from '../components/CartaoAnimacoes';
import { CartaoNotificacoes } from '../components/CartaoNotificacoes';
import { Pressionavel } from '../components/Pressionavel';
import { useAuth } from '../contexts/AuthContext';
import { useFavoritos } from '../contexts/FavoritosContext';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';

export function PerfilScreen() {
  const { usuario, sair } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { favoritos } = useFavoritos();

  if (!usuario) return null;

  const quantidade = favoritos.length;

  return (
    <ScrollView
      style={e.scroll}
      contentContainerStyle={e.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Card do Leitor */}
      <View style={e.heroCard}>
        <View style={e.avatarContainer}>
          <Avatar nome={usuario.name} imagem={usuario.image} tamanho={88} />
        </View>

        <Text style={e.nome}>{usuario.name}</Text>
        <Text style={e.email}>{usuario.email}</Text>

        <View style={e.badgeLeitor}>
          <Text style={e.badgeLeitorTexto}>📖 Leitor Cadastrado · Livro Aberto</Text>
        </View>

        {/* Faixa de Estatísticas Rápidas */}
        <View style={e.faixaEstatisticas}>
          <View style={e.itemEstatistica}>
            <Text style={e.valorEstatistica}>{quantidade}</Text>
            <Text style={e.rotuloEstatistica}>Na Estante</Text>
          </View>
          <View style={e.divisorEstatistica} />
          <View style={e.itemEstatistica}>
            <Text style={e.valorEstatistica}>Ativa</Text>
            <Text style={e.rotuloEstatistica}>Sacola</Text>
          </View>
          <View style={e.divisorEstatistica} />
          <View style={e.itemEstatistica}>
            <Text style={e.valorEstatistica}>3+</Text>
            <Text style={e.rotuloEstatistica}>Livrarias</Text>
          </View>
        </View>
      </View>

      {/* Seção 1: Atalhos Principais (Os 3 cartões vibrantes com mola) */}
      <View style={e.secao}>
        <Text style={e.secaoTitulo}>MINHA JORNADA LITERÁRIA</Text>

        <Pressionavel
          style={e.cardAtalho}
          onPress={() =>
            navigation.reset({
              index: 1,
              routes: [{ name: 'ListaProdutos' }, { name: 'Favoritos' }],
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Abrir minha estante de livros salvos"
        >
          <View style={[e.iconeCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={e.iconeTexto}>📚</Text>
          </View>
          <View style={e.infoCard}>
            <Text style={e.tituloCard}>Minha Estante</Text>
            <Text style={e.subtituloCard}>
              {quantidade === 1 ? '1 livro guardado na estante' : `${quantidade} livros guardados na estante`}
            </Text>
          </View>
          <View style={e.setaContainer}>
            <Text style={e.setaTexto}>›</Text>
          </View>
        </Pressionavel>

        <Pressionavel
          style={e.cardAtalho}
          onPress={() =>
            navigation.reset({
              index: 1,
              routes: [{ name: 'ListaProdutos' }, { name: 'Carrinho' }],
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Abrir sacola de livros"
        >
          <View style={[e.iconeCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={e.iconeTexto}>🛍️</Text>
          </View>
          <View style={e.infoCard}>
            <Text style={e.tituloCard}>Sacola de Livros</Text>
            <Text style={e.subtituloCard}>Seus exemplares selecionados</Text>
          </View>
          <View style={e.setaContainer}>
            <Text style={e.setaTexto}>›</Text>
          </View>
        </Pressionavel>

        <Pressionavel
          style={e.cardAtalho}
          onPress={() =>
            navigation.reset({
              index: 1,
              routes: [{ name: 'ListaProdutos' }, { name: 'PontosRetirada' }],
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Abrir pontos de retirada e livrarias"
        >
          <View style={[e.iconeCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={e.iconeTexto}>📍</Text>
          </View>
          <View style={e.infoCard}>
            <Text style={e.tituloCard}>Onde Retirar</Text>
            <Text style={e.subtituloCard}>Pontos & livrarias parceiras no mapa</Text>
          </View>
          <View style={e.setaContainer}>
            <Text style={e.setaTexto}>›</Text>
          </View>
        </Pressionavel>
      </View>

      {/* Seção 2: Preferências & Sistema */}
      <View style={e.secao}>
        <Text style={e.secaoTitulo}>PREFERÊNCIAS & AJUSTES</Text>
        <CartaoAnimacoes />
        <CartaoNotificacoes />
      </View>

      {/* Botão Sair da Conta */}
      <Pressionavel
        style={e.botaoSair}
        onPress={sair}
        accessibilityRole="button"
        accessibilityLabel="Encerrar sessão e sair da conta"
      >
        <Text style={e.textoBotaoSair}>🚪 Sair da conta</Text>
      </Pressionavel>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  container: {
    padding: 16,
    paddingBottom: 48,
    gap: 20,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  nome: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 14,
    color: cores.textoFraco,
    marginTop: 2,
  },
  badgeLeitor: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },
  badgeLeitorTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: cores.primaria,
  },
  faixaEstatisticas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  itemEstatistica: {
    alignItems: 'center',
    flex: 1,
  },
  valorEstatistica: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  rotuloEstatistica: {
    fontSize: 12,
    fontWeight: '600',
    color: cores.textoFraco,
    marginTop: 2,
  },
  divisorEstatistica: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  secao: {
    gap: 10,
  },
  secaoTitulo: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  cardAtalho: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  iconeCard: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeTexto: {
    fontSize: 22,
  },
  infoCard: {
    flex: 1,
    gap: 2,
  },
  tituloCard: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtituloCard: {
    fontSize: 13,
    color: cores.textoFraco,
  },
  setaContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setaTexto: {
    fontSize: 20,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: -2,
  },
  botaoSair: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBotaoSair: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 15,
  },
});
