/**
 * ============================================================================
 * ARQUIVO PRINCIPAL DO APP: App.tsx (Ponto de Entrada e Navegação Condicional)
 * ============================================================================
 * 
 * 💡 CONCEITO ARQUITETURAL: GUARDA DE ROTAS (Route Guard)
 * - Em vez de navegar manualmente chamando `navigation.navigate('Home')` após o login,
 *   utilizamos o padrão de Navegação Declarativa/Condicional recomendada pelo React Navigation.
 * - O componente `RootNavigator` observa o booleano `isLoggedIn` da sessão:
 *   * Se `isLoggedIn === false` -> Monta a pilha `AuthFlow` (Login, Cadastro, Esqueci a Senha).
 *   * Se `isLoggedIn === true`  -> Monta a pilha `AppFlow` (Catálogo, Detalhes, Carrinho, Checkout, Pedidos).
 * 
 * 🔒 Vantagem de Segurança do Fluxo Declarativo:
 * Impede que o usuário autenticado consiga voltar para as telas de login usando o
 * botão físico/gesto de "Voltar" do celular (o histórico da pilha anterior é destruído).
 */

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { queryClient } from '@/lib/queryClient';
import { SessionProvider, useSession } from '@/session/session';
import { SignInScreen } from '@/screens/SignInScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { ForgotPasswordScreen } from '@/screens/ForgotPasswordScreen';
import { ProductsScreen } from '@/screens/ProductsScreen';
import { ProductDetailScreen } from '@/screens/ProductDetailScreen';
import { CartScreen } from '@/screens/CartScreen';
import { CheckoutScreen } from '@/screens/CheckoutScreen';
import { OrderScreen } from '@/screens/OrderScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
import type { AuthStackParamList, RootStackParamList } from '@/navigation';

// Criação das duas pilhas de navegação nativa separadas por domínio
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<RootStackParamList>();

/**
 * 1. FLUXO DE AUTENTICAÇÃO (AuthFlow)
 * Pilha de telas acessíveis apenas para usuários NÃO logados.
 * `headerShown: false` remove a barra de título superior para mantermos o visual limpo.
 */
function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * 2. FLUXO PRINCIPAL DO APP (AppFlow)
 * Pilha de telas comerciais acessíveis após autenticação bem-sucedida.
 */
function AppFlow() {
  return (
    <AppStack.Navigator>
      {/* Vitrine do Catálogo */}
      <AppStack.Screen name="Products" component={ProductsScreen} options={{ title: 'Livro Aberto' }} />

      {/* Detalhe do Produto: título dinâmico com o nome do produto passado via params */}
      <AppStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ route }) => ({ title: route.params.name })}
      />

      {/* Carrinho de Compras */}
      <AppStack.Screen name="Cart" component={CartScreen} options={{ title: 'Carrinho' }} />

      {/* Fluxo da Semana 3: Checkout, Detalhe do Pedido e Histórico */}
      <AppStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <AppStack.Screen name="Order" component={OrderScreen} options={{ title: 'Pedido' }} />
      <AppStack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Meus pedidos' }} />
    </AppStack.Navigator>
  );
}

/**
 * 3. NAVEGADOR RAIZ CONDICIONAL (RootNavigator)
 * 
 * A "guarda" do aplicativo: avalia o estado de login e alterna a pilha de navegação.
 */
function RootNavigator() {
  const { isLoggedIn } = useSession();
  return isLoggedIn ? <AppFlow /> : <AuthFlow />;
}

/**
 * 4. COMPONENTE RAIZ DA APLICAÇÃO (App)
 * 
 * Configura a árvore global de Providers (provedores de contexto) do React Native.
 * 
 * Analogia: Cada Provider funciona como uma "camada de infraestrutura":
 * - SafeAreaProvider: Mede as bordas físicas da tela do aparelho.
 * - QueryClientProvider: Entrega o motor de cache e sincronização da internet.
 * - SessionProvider: Disponibiliza o token e os dados do usuário para qualquer tela.
 * - NavigationContainer: Gerencia o histórico de telas e transições nativas.
 */
export default function App() {
  return (
    // 1º Nível: Gestão de áreas seguras da tela (notches físicos, ilha dinâmica e bordas)
    <SafeAreaProvider>
      {/* 2º Nível: Provedor de Cache e Requisições Assíncronas (TanStack Query) */}
      <QueryClientProvider client={queryClient}>
        {/* 3º Nível: Provedor de Estado de Autenticação do Usuário */}
        <SessionProvider>
          {/* 4º Nível: Contêiner de Navegação Nativa */}
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>

          {/* Barra de status do sistema operacional (ícones de bateria, wifi e hora em tom escuro) */}
          <StatusBar style="dark" />
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
