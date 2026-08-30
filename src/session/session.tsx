import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setCustomerToken, setUnauthorizedCallback } from '@/services/http';
import { getMe, login as loginService, register as registerService } from '@/services/auth';
import { getStoredToken, removeStoredToken, saveStoredToken } from './secureStore';
import { queryKeys } from '@/lib/queryKeys';
import type { Customer } from '@/types/api';
import { Loading } from '@/components/ui';

/**
 * ============================================================================
 * GERENCIAMENTO DE SESSÃO GLOBAL (React Context API + useSession)
 * ============================================================================
 * 
 * 💡 ANALOGIA DIDÁTICA: CONTEXT API COMO UM "TUBO GLOBAL DE DADOS"
 * - Sem Context API, para passar os dados do usuário do topo do app até o botão
 *   de favoritar dentro do card de um livro, teríamos que passar `customer` como
 *   propriedade em 6 arquivos intermediários (o chamado "Prop Drilling").
 * - O Context API funciona como um tubo global: nós injetamos os dados no topo
 *   (`SessionProvider`) e qualquer componente ou tela pode abrir a torneira
 *   usando o hook `useSession()` para pegar os dados instantaneamente.
 */

/**
 * Contrato (Interface) com todos os dados e funções expostos pela sessão
 */
interface SessionValue {
  customer: Customer | null;                                             // Dados do comprador (id, nome, email) ou null se deslogado
  isLoggedIn: boolean;                                                   // Booleano: true se logado, false se deslogado
  signIn: (email: string, password: string) => Promise<void>;            // Função para fazer login
  signUp: (name: string, email: string, password: string) => Promise<void>; // Função para criar conta
  signOut: () => void;                                                   // Função para deslogar (logout)
}

// 1. Cria o Contexto da Sessão (inicialmente nulo)
const SessionContext = createContext<SessionValue | null>(null);

/**
 * 2. Componente Provedor (SessionProvider)
 * 
 * Deve envolver a raiz do aplicativo (`App.tsx`).
 * Todos os componentes filhos colocados dentro dele terão acesso instantâneo
 * aos dados da sessão através do hook `useSession()`.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  // Estado local com os dados cadastrais do comprador autenticado
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  // Flag de inicialização: impede flashes de tela de login enquanto verificamos o token no cofre seguro
  const [restoring, setRestoring] = useState(true);
  
  // Cliente do TanStack Query para manipular e invalidar o cache de requisições
  const queryClient = useQueryClient();

  /**
   * Restauração Segura de Sessão na Abertura do App:
   * 1. Lê o token criptografado gravado no SecureStore.
   * 2. Se encontrar, injeta no Axios e chama `GET /auth/me` para validar com o servidor.
   * 3. Se o token for válido, preenche o estado com o perfil atualizado do cliente.
   * 4. Se for inválido, adulterado ou expirado, zera o token e limpa o cofre.
   */
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedToken = await getStoredToken();
        if (savedToken) {
          // Injeta o token na catraca do Axios para assinar as requisições
          setCustomerToken(savedToken);
          // Consulta o endpoint de perfil para garantir que o token ainda é válido no backend
          const me = await getMe();
          setCustomer(me);
        }
      } catch {
        // Se o servidor rejeitar o token (ex: 401 ou token adulterado), expurga a sessão
        setCustomerToken(null);
        await removeStoredToken();
        setCustomer(null);
      } finally {
        // Conclui a fase de restauração e libera a renderização da interface
        setRestoring(false);
      }
    }

    restoreSession();
  }, []);

  /**
   * Tratamento Global de 401 (Unauthorized):
   * Conecta um ouvinte no interceptor do Axios. Se qualquer rota do app receber
   * uma resposta 401 (token expirou durante o uso), a sessão é encerrada
   * automaticamente e o usuário é redirecionado para a tela de login.
   */
  useEffect(() => {
    setUnauthorizedCallback(() => {
      setCustomerToken(null);
      removeStoredToken();
      setCustomer(null);
      queryClient.clear(); // Limpa todo o cache em memória para segurança
    });

    return () => {
      setUnauthorizedCallback(null);
    };
  }, [queryClient]);

  /**
   * useMemo: Memorização do Objeto de Sessão
   * 
   * Por que usar useMemo no valor do Context?
   * Se não usássemos `useMemo`, um novo objeto seria criado em memória a cada
   * pequena renderização do Provider, forçando TODOS os componentes do app
   * que usam `useSession()` a renderizarem novamente sem necessidade.
   */
  const value = useMemo<SessionValue>(
    () => ({
      customer,
      isLoggedIn: customer !== null, // Se customer não for nulo, está autenticado

      // Fluxo de Login: autentica, grava no cofre e atualiza estado
      async signIn(email, password) {
        const res = await loginService(email, password);
        await saveStoredToken(res.token); // Salva de forma persistente e criptografada
        setCustomerToken(res.token);      // Alimenta o interceptor do Axios
        setCustomer(res.customer);        // Atualiza os dados do usuário no estado
      },

      // Fluxo de Cadastro: cria a conta, grava token e loga imediatamente
      async signUp(name, email, password) {
        const res = await registerService(name, email, password);
        await saveStoredToken(res.token); // Salva no cofre seguro
        setCustomerToken(res.token);      // Alimenta o Axios
        setCustomer(res.customer);        // Preenche o perfil
      },

      // Fluxo de Logout: desloga, remove do cofre e limpa os caches privados
      async signOut() {
        setCustomerToken(null);           // Remove o token do Axios
        await removeStoredToken();        // Deleta do SecureStore
        setCustomer(null);                // Zera os dados do usuário

        // Limpeza de Segurança do Cache:
        // Remove dados privados (carrinho e favoritos) para que uma próxima conta não os herde
        queryClient.removeQueries({ queryKey: queryKeys.cart.all });
        queryClient.removeQueries({ queryKey: queryKeys.favorites.all });
      },
    }),
    [customer, queryClient], // Só recria o objeto se o `customer` ou `queryClient` mudarem
  );

  // Enquanto verifica o cofre de chaves no boot, exibe o spinner sem piscar telas
  if (restoring) {
    return <Loading label="Iniciando Livro Aberto…" />;
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * 3. Hook Customizado: `useSession()`
 * 
 * Permite que qualquer tela ou componente acesse a sessão com apenas 1 linha:
 * `const { customer, isLoggedIn, signOut } = useSession();`
 * 
 * Inclui uma trava de segurança que avisa o desenvolvedor caso ele esqueça
 * de envolver o app com `<SessionProvider>`.
 */
export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession precisa estar dentro de <SessionProvider>.');
  return ctx;
}
