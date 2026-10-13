/**
 * ---------------------------------------------------------------------------
 * PONTO DE ENTRADA
 * ---------------------------------------------------------------------------
 * A ORDEM DOS PROVIDERS IMPORTA. De fora para dentro:
 *
 *   QueryClientProvider   nao depende de ninguem
 *     AuthProvider        usa o queryClient (limpa o cache no logout)
 *       FavoritosProvider usa o useAuth (a chave do disco inclui o id)
 *         NotificacoesProvider usa o useAuth (so registra o aparelho logado)
 *           SafeAreaProvider
 *             RootNavigator usa o useAuth para decidir quais telas existem
 *
 * Inverter AuthProvider e FavoritosProvider quebra na primeira renderizacao,
 * com "useAuth precisa estar dentro de um AuthProvider" — a mensagem que o
 * proprio hook lanca, justamente para este caso.
 * ---------------------------------------------------------------------------
 */
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/contexts/AuthContext';
import { FavoritosProvider } from './src/contexts/FavoritosContext';
import { NotificacoesProvider } from './src/contexts/NotificacoesContext';
import { queryClient } from './src/lib/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FavoritosProvider>
          <NotificacoesProvider>
            <SafeAreaProvider>
              <StatusBar style="light" />
              <RootNavigator />
            </SafeAreaProvider>
          </NotificacoesProvider>
        </FavoritosProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
