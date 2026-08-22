import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setCustomerToken } from '@/services/http';
import { login as loginService, register as registerService } from '@/services/auth';
import { queryKeys } from '@/lib/queryKeys';
import type { Customer } from '@/types/api';

/**
 * ============================================================================
 * GERENCIAMENTO DE SESSÃO GLOBAL (React Context API + useSession)
 * ============================================================================
 * 
 * Por que usamos Context API aqui?
 * O estado de autenticação (saber se o usuário está logado ou não e quem ele é)
 * precisa ser acessado por dezenas de telas e componentes diferentes:
 * - O Header precisa saber se exibe o nome do usuário ou botão de login.
 * - O Carrinho precisa saber se o usuário pode finalizar a compra.
 * - O botão de Adicionar ao Carrinho precisa saber se está habilitado.
 * 
 * O Context API permite compartilhar esse estado GLOBALMENTE sem precisar passar
 * propriedades manualmente de pai para filho em todas as telas (evita "Prop Drilling").
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
  // Estado local do usuário autenticado
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  // Cliente do TanStack Query para manipular o cache global
  const queryClient = useQueryClient();

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
      isLoggedIn: customer !== null, // Se customer não for nulo, está logado

      // Fluxo de Login
      async signIn(email, password) {
        const res = await loginService(email, password);
        setCustomerToken(res.token); // Salva o token no interceptor do Axios
        setCustomer(res.customer);   // Salva os dados do usuário no estado
      },

      // Fluxo de Cadastro (Registro)
      async signUp(name, email, password) {
        const res = await registerService(name, email, password);
        setCustomerToken(res.token); // Salva o token no interceptor do Axios
        setCustomer(res.customer);   // Salva os dados do usuário no estado
      },

      // Fluxo de Logout
      signOut() {
        setCustomerToken(null); // Remove o token do Axios
        setCustomer(null);      // Zera os dados do usuário

        // Limpeza de Segurança do Cache:
        // Remove todos os dados do carrinho da memória para que um próximo usuário
        // não veja os itens do carrinho do usuário anterior!
        queryClient.removeQueries({ queryKey: queryKeys.cart.all });
      },
    }),
    [customer, queryClient], // Só recria o objeto se o `customer` ou `queryClient` mudarem
  );

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
