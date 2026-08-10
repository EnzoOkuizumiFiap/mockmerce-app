import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProductsScreen } from '@/screens/ProductsScreen';
import { ProductDetailScreen } from '@/screens/ProductDetailScreen';
import { CartScreen } from '@/screens/CartScreen';
import type { RootStackParamList } from '@/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/types/api';
import { queryClient } from '@/lib/queryClient';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient} >
        <>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Loja da Turma' }} />
              <Stack.Screen
                name="ProductDetail"
                component={ProductDetailScreen}
                options={({ route }) => ({ title: route.params.name })}
              />
              <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Carrinho' }} />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="dark" />
        </>
      </QueryClientProvider>

    </SafeAreaProvider>
  );
}
