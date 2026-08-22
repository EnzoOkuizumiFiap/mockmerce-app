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
import type { AuthStackParamList, RootStackParamList } from '@/navigation';

/**
 * ============================================================================
 * ARQUIVO RAIZ: App.tsx (Ponto de Entrada e Navegação por Autenticação)
 * ============================================================================
 * 
 * Este arquivo configura:
 * 1. A árvore de Provedores Globais (SafeArea, React Query, Session).
 * 2. As duas pilhas de navegação (Fluxo de Autenticação vs Fluxo do App).
 * 3. A troca dinâmica de telas baseada no estado de login (`isLoggedIn`).
 */

// Cria as duas pilhas de navegação nativas separadas
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<RootStackParamList>();

/**
 * 1. FLUXO DE AUTENTICAÇÃO (AuthFlow)
 * Telas acessíveis apenas para usuários DESLOGADOS.
 * `headerShown: false` oculta a barra superior nativa para termos design limpo.
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
 * Telas acessíveis após o usuário estar LOGADO.
 */
function AppFlow() {
  return (
    <AppStack.Navigator>
      {/* Vitrine de Produtos */}
      <AppStack.Screen 
        name="Products" 
        component={ProductsScreen} 
        options={{ title: 'Loja da Turma' }} 
      />
      {/* Detalhes do Produto (Título dinâmico com o nome do produto selecionado) */}
      <AppStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      {/* Carrinho de Compras */}
      <AppStack.Screen 
        name="Cart" 
        component={CartScreen} 
        options={{ title: 'Carrinho' }} 
      />
    </AppStack.Navigator>
  );
}

/**
 * 3. NAVEGADOR RAIZ CONDICIONAL (RootNavigator)
 * 
 * Padrão Recomendado pelo React Navigation (Authentication Flow):
 * Em vez de navegar manualmente com `navigation.navigate('Products')`,
 * nós apenas trocamos a pilha de navegação inteira baseada em `isLoggedIn`:
 * - Se `isLoggedIn === true`  -> Exibe `AppFlow` (Catálogo, Detalhes, Carrinho)
 * - Se `isLoggedIn === false` -> Exibe `AuthFlow` (Login, Cadastro, Recuperação)
 * 
 * Vantagem de Segurança: Impede que o usuário volte para a tela de login pelo
 * botão nativo de "Voltar" do celular após já estar autenticado!
 */
function RootNavigator() {
  const { isLoggedIn } = useSession();
  return isLoggedIn ? <AppFlow /> : <AuthFlow />;
}

/**
 * 4. COMPONENTE PRINCIPAL (App)
 * Monta a hierarquia de Providers do aplicativo.
 */
export default function App() {
  return (
    // 1º Nível: Gestão de áreas seguras da tela (notches físicos e bordas)
    <SafeAreaProvider>
      {/* 2º Nível: Provedor de Cache e Requisições Assíncronas (TanStack Query) */}
      <QueryClientProvider client={queryClient}>
        {/* 3º Nível: Provedor de Estado de Autenticação do Usuário */}
        <SessionProvider>
          {/* 4º Nível: Contêiner de Navegação Nativa */}
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          
          <StatusBar style="dark" />
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
