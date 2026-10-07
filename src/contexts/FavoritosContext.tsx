/**
 * ---------------------------------------------------------------------------
 * COLECAO PESSOAL (FAVORITOS)
 * ---------------------------------------------------------------------------
 * A colecao do usuario, guardada LOCALMENTE.
 *
 * POR QUE LOCAL?
 * Porque dado local continua disponivel sem internet. Essa e a vantagem que
 * faz aplicativos de verdade manterem uma copia local do que o usuario
 * precisa ver sempre.
 *
 * POR QUE NAO USA TANSTACK QUERY?
 * O Query cuida de estado de SERVIDOR: ele revalida, deduplica, invalida.
 * Favoritos aqui sao estado LOCAL persistido — nao ha servidor para
 * revalidar contra. Coisas diferentes, ferramentas diferentes.
 *
 * POR QUE CONTEXTO, E NAO UM HOOK SOLTO?
 *
 * Esta e a decisao que mais importa neste arquivo. Se cada tela chamasse um
 * `useFavoritos()` com `useState` proprio, cada uma teria a SUA copia da
 * lista:
 *
 *   1. Abra a listagem   -> copia A, lida do disco
 *   2. Entre no detalhe  -> copia B, lida do disco
 *   3. Favorite no detalhe -> copia B muda, disco muda, copia A NAO
 *   4. Volte para a listagem -> a estrela ainda esta apagada
 *
 * A listagem continua montada atras do detalhe; ela nao le o disco de novo.
 * O dado esta certo no disco e errado na tela — o pior tipo de bug, porque
 * fechar e abrir o app "conserta".
 *
 * Um provider da uma copia so para o app inteiro. As quatro telas que leem
 * favoritos (listagem, detalhe, favoritos, perfil) enxergam a mesma lista.
 * ---------------------------------------------------------------------------
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import { guardarLocal, lerLocal } from '../storage/armazenamentoLocal';
import { CHAVES } from '../storage/chavesArmazenamento';
import { ProdutoResumo } from '../types/produto';
import { useAuth } from './AuthContext';

type FavoritosContextValor = {
  favoritos: ProdutoResumo[];
  carregando: boolean;
  alternarFavorito: (produto: ProdutoResumo) => Promise<void>;
  ehFavorito: (id: string) => boolean;
};

const FavoritosContext = createContext<FavoritosContextValor | null>(null);

export function FavoritosProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [favoritos, setFavoritos] = useState<ProdutoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);

  /**
   * A chave inclui o id do usuario.
   *
   * `usuario` pode ser null enquanto a sessao carrega, entao a chave tambem
   * pode ser null. Tratamos isso em vez de usar `usuario!.id` — o `!` calaria
   * o TypeScript e o app quebraria em tempo de execucao.
   */
  const chave = usuario ? CHAVES.favoritos(usuario.id) : null;

  /**
   * Recarrega do disco sempre que a chave muda — ou seja, sempre que troca
   * quem esta logado. E isto que faz o usuario B nao ver a lista do usuario A
   * sem precisar fechar o app.
   */
  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      // Sem usuario nao ha o que carregar. Lista vazia e o estado correto.
      if (!chave) {
        setFavoritos([]);
        setCarregando(false);
        return;
      }

      setCarregando(true);
      const guardados = await lerLocal<ProdutoResumo[]>(chave);

      /**
       * O `cancelado` evita escrever num componente que ja trocou de chave.
       * Sem ele, um logout rapido durante a leitura poderia gravar a lista do
       * usuario anterior por cima do estado ja limpo.
       */
      if (cancelado) return;

      setFavoritos(guardados ?? []);
      setCarregando(false);
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [chave]);

  /**
   * Adiciona ou remove — o mesmo botao faz as duas coisas.
   *
   * O PADRAO A NOTAR: alteramos o estado E gravamos no disco, sempre juntos.
   * So gravar: a tela nao atualiza. So alterar o estado: o dado some ao
   * fechar o app.
   */
  const alternarFavorito = useCallback(
    async (produto: ProdutoResumo) => {
      if (!chave) return;

      const jaEsta = favoritos.some((f) => f.id === produto.id);
      const novaLista = jaEsta
        ? favoritos.filter((f) => f.id !== produto.id)
        : [...favoritos, produto];

      setFavoritos(novaLista);
      await guardarLocal(chave, novaLista);
    },
    [favoritos, chave],
  );

  const ehFavorito = useCallback(
    (id: string) => favoritos.some((f) => f.id === id),
    [favoritos],
  );

  return (
    <FavoritosContext.Provider
      value={{ favoritos, carregando, alternarFavorito, ehFavorito }}
    >
      {children}
    </FavoritosContext.Provider>
  );
}

export function useFavoritos(): FavoritosContextValor {
  const contexto = useContext(FavoritosContext);
  if (!contexto) {
    throw new Error('useFavoritos precisa estar dentro de um FavoritosProvider');
  }
  return contexto;
}

/**
 * NOTA SOBRE UMA DECISAO DE PROJETO
 *
 * Guardamos o objeto inteiro do produto, e nao so o id. Isso ocupa mais
 * espaco e o preco pode ficar desatualizado em relacao ao servidor.
 *
 * A alternativa seria guardar so os ids e buscar os dados na API ao abrir a
 * tela — mas ai os favoritos parariam de funcionar offline, que e justamente
 * o ponto.
 *
 * Nao existe resposta certa: existe trade-off, e a escolha aqui privilegia o
 * offline. Um app de precos volateis escolheria o contrario.
 */
