/**
 * ---------------------------------------------------------------------------
 * TIPOS DE NOTIFICACAO
 * ---------------------------------------------------------------------------
 * O `data` de um push do FCM e um mapa de STRING para STRING. Sem excecao.
 *
 * O servidor manda `precoNovo: 149.9` e o aparelho recebe `"149.9"`. Isso nao
 * e um detalhe: se voce escrever `dados.precoNovo.toFixed(2)` o app quebra em
 * producao, com um erro que nao aparece em nenhum teste feito com objeto
 * literal. Por isso o tipo aqui declara string — a conversao e explicita,
 * na hora de usar.
 * ---------------------------------------------------------------------------
 */

/** Para onde o toque na notificacao deve levar. */
export type RotaNotificacao = 'produto' | 'favoritos' | 'home';

/**
 * O que o backend coloca em `data`. Tudo opcional de proposito: a
 * notificacao pode vir de uma versao mais nova do servidor, com campos que
 * este app ainda nao conhece — e ele nao pode quebrar por causa disso.
 */
export interface DadosNotificacao {
  rota?: RotaNotificacao | string;
  produtoId?: string;
  variantId?: string;
  slug?: string;
  precoAntigo?: string;
  precoNovo?: string;
  /** Qualquer campo novo que o servidor mandar cai aqui, sem quebrar nada. */
  [chave: string]: string | undefined;
}
