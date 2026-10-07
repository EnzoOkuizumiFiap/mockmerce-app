/** Configuracao do TanStack Query. */
import { QueryClient } from '@tanstack/react-query';

import { AppError } from '../errors/AppError';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Por 1 minuto, o dado em cache e considerado fresco e a tela nao
       * refaz a requisicao ao ser aberta de novo. Voltar do detalhe para a
       * listagem fica instantaneo.
       */
      staleTime: 1000 * 60,

      /**
       * Nem todo erro merece nova tentativa.
       *
       * Um 404 vai continuar 404 na terceira tentativa — insistir so atrasa a
       * mensagem que o usuario precisa ver. Um 401 idem: o interceptor ja
       * derrubou a sessao, e repetir gera mais dois 401 inuteis.
       *
       * Falha de rede, essa sim: o wi-fi pode voltar entre uma tentativa e
       * outra.
       */
      retry: (tentativas, erro) => {
        if (erro instanceof AppError && erro.tipo === 'NAO_ENCONTRADO') return false;
        if (erro instanceof AppError && erro.tipo === 'NAO_AUTORIZADO') return false;
        return tentativas < 2;
      },
    },
  },
});
