/**
 * ---------------------------------------------------------------------------
 * NAVEGADOR RAIZ — com guarda de rotas
 * ---------------------------------------------------------------------------
 * TRES CAMINHOS, NAO DOIS.
 *
 *   1. carregandoSessao  -> ainda lendo o disco, nao sabemos de nada
 *   2. sem usuario       -> so a tela de login existe
 *   3. com usuario       -> so as telas internas existem
 *
 * O terceiro caminho e obvio; o PRIMEIRO e o que costuma faltar. Sem ele, o
 * app renderiza o caminho 2 por um instante enquanto le o SecureStore, e o
 * usuario ve a tela de login piscar toda vez que abre o aplicativo. Parece
 * que a sessao caiu — e nao caiu.
 *
 * REPARE TAMBEM no que NAO existe aqui: nenhum `navigation.navigate('Login')`
 * depois do logout, e nenhum `navigate('ListaProdutos')` depois do login. As
 * telas nao sao "empurradas": elas passam a existir ou deixam de existir.
 * Isso elimina de uma vez a categoria de bug em que o usuario deslogado volta
 * para a tela interna com o botao "voltar" do Android.
 * ---------------------------------------------------------------------------
 */
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Text } from 'react-native';

import { EstadoCarregando } from '../components/EstadoCarregando';
import { useAuth } from '../contexts/AuthContext';
import { cores } from '../lib/tema';
import { DetalheProdutoScreen } from '../screens/DetalheProdutoScreen';
import { FavoritosScreen } from '../screens/FavoritosScreen';
import { ListaProdutosScreen } from '../screens/ListaProdutosScreen';
import { CadastroScreen } from '../screens/CadastroScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { PerfilScreen } from '../screens/PerfilScreen';
import { AvaliarScreen } from '../screens/AvaliarScreen';
import { CarrinhoScreen } from '../screens/CarrinhoScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { PedidoScreen } from '../screens/PedidoScreen';
import { PontosRetiradaScreen } from '../screens/PontosRetiradaScreen';
import { consumirNavegacaoPendente, navegacaoRef } from './navegacao';
import { AppStackParamList, AuthStackParamList } from './tipos';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

export function RootNavigator() {
  const { usuario, carregandoSessao } = useAuth();

  // ---- Caminho 1: ainda lendo o disco -------------------------------------
  if (carregandoSessao) {
    return <EstadoCarregando mensagem="Abrindo..." />;
  }

  // ---- Caminho 2: sem sessao ----------------------------------------------
  if (!usuario) {
    return (
      <NavigationContainer>
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Cadastro" component={CadastroScreen} />
        </AuthStack.Navigator>
      </NavigationContainer>
    );
  }

  // ---- Caminho 3: logado ---------------------------------------------------
  return (
    /**
     * O `ref` e o `onReady` sao o que fazem o toque na notificacao funcionar
     * com o app FECHADO: o destino fica guardado ate o navegador existir.
     * Ver src/navigation/navegacao.ts.
     */
    <NavigationContainer ref={navegacaoRef} onReady={consumirNavegacaoPendente}>
      <AppStack.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: cores.primaria },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate('Perfil')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Abrir perfil"
            >
              <Text style={{ color: '#FFFFFF', fontSize: 20 }}>{'☰'}</Text>
            </Pressable>
          ),
        })}
      >
        <AppStack.Screen
          name="ListaProdutos"
          component={ListaProdutosScreen}
          options={{ title: 'Vitrine' }}
        />
        <AppStack.Screen
          name="DetalheProduto"
          component={DetalheProdutoScreen}
          // O nome do produto ja veio nos parametros: o cabecalho acerta o
          // titulo antes de a requisicao do detalhe terminar.
          options={({ route }) => ({ title: route.params.nome })}
        />
        <AppStack.Screen
          name="Favoritos"
          component={FavoritosScreen}
          options={{ title: 'Meus salvos' }}
        />
        <AppStack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />

        {/* ---- Compra (ja vinha pronto) ---- */}
        <AppStack.Screen name="Carrinho" component={CarrinhoScreen} options={{ title: 'Carrinho' }} />
        <AppStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Finalizar' }} />
        <AppStack.Screen name="Pedido" component={PedidoScreen} options={{ title: 'Pedido' }} />

        {/* ---- Conteudo desta aula ---- */}
        <AppStack.Screen
          name="Avaliar"
          component={AvaliarScreen}
          options={{ title: 'Avaliar produto' }}
        />
        <AppStack.Screen
          name="PontosRetirada"
          component={PontosRetiradaScreen}
          options={{ title: 'Onde retirar' }}
        />
      </AppStack.Navigator>
    </NavigationContainer>
  );
}
