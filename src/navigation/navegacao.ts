/**
 * ---------------------------------------------------------------------------
 * NAVEGAR DE FORA DA ARVORE DE COMPONENTES
 * ---------------------------------------------------------------------------
 * O toque numa notificacao nao acontece dentro de uma tela: acontece no
 * sistema operacional, e chega no app por um listener. Ali nao existe
 * `useNavigation()` — nao ha componente nenhum no meio.
 *
 * A saida oficial do React Navigation e uma REFERENCIA ao container.
 *
 * E aqui mora o caso mais chato do assunto: quando o app estava FECHADO, o
 * toque abre o aplicativo e o listener dispara ANTES de o navegador existir.
 * Navegar nesse instante nao faz nada e nao avisa — e a notificacao "nao
 * funciona so quando o app esta fechado", que e exatamente quando ela mais
 * importa.
 *
 * Por isso guardamos a rota pendente e a consumimos no `onReady`.
 * ---------------------------------------------------------------------------
 */
import { createNavigationContainerRef } from '@react-navigation/native';

import { AppStackParamList } from './tipos';

export const navegacaoRef = createNavigationContainerRef<AppStackParamList>();

type Destino =
  | { tela: 'DetalheProduto'; params: AppStackParamList['DetalheProduto'] }
  | { tela: 'Favoritos' }
  | { tela: 'ListaProdutos' };

let pendente: Destino | null = null;

/** Navega agora, ou guarda para quando o navegador estiver de pe. */
export function navegarPara(destino: Destino): void {
  if (!navegacaoRef.isReady()) {
    pendente = destino;
    return;
  }
  executar(destino);
}

/** Chamado pelo `onReady` do NavigationContainer. */
export function consumirNavegacaoPendente(): void {
  if (!pendente) return;
  const destino = pendente;
  pendente = null;
  executar(destino);
}

function executar(destino: Destino): void {
  if (destino.tela === 'DetalheProduto') {
    navegacaoRef.navigate('DetalheProduto', destino.params);
    return;
  }
  navegacaoRef.navigate(destino.tela);
}
