/**
 * ---------------------------------------------------------------------------
 * VOCABULARIO DE ANIMACAO DO APP
 * ---------------------------------------------------------------------------
 * Duracao e curva sao decisao de DESIGN, nao numero solto no meio do
 * componente. Centralizar aqui tem o mesmo motivo do `tema.ts`: quando tudo
 * no app usa `DURACAO.rapida`, o app inteiro tem o mesmo ritmo. Quando cada
 * tela escolhe o proprio 300, 250, 420, o resultado parece descoordenado sem
 * ninguem saber explicar por que.
 *
 * TEMPO x FISICA — as duas familias, e quando usar cada uma:
 *
 *   withTiming  -> voce manda DURAR. Tem comeco, fim e curva previsiveis.
 *                  Use quando o movimento precisa terminar junto com outra
 *                  coisa, ou quando e so "aparecer/sumir".
 *
 *   withSpring  -> voce manda a FISICA. Nao tem duracao: tem massa, rigidez
 *                  e amortecimento, e o movimento acaba quando a mola para.
 *                  Use quando o elemento responde a um toque — o pequeno
 *                  passar do ponto e o que faz parecer que a interface tem
 *                  peso, em vez de um slide de PowerPoint.
 *
 * A regra pratica: se o usuario CAUSOU o movimento com o dedo, mola. Se o
 * movimento apenas informa (entrou, saiu, carregou), tempo.
 * ---------------------------------------------------------------------------
 */
import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

export const DURACAO = {
  /** Microinteracao: feedback de toque. Acima de ~150ms ja parece lento. */
  rapida: 140,
  /** Padrao: aparecer, sumir, trocar de estado. */
  media: 250,
  /** Entrada de tela, algo que o olho precisa acompanhar. */
  lenta: 400,
};

/**
 * `Easing.out` desacelera no fim: o elemento chega e assenta. E o que se usa
 * para ENTRAR. Para SAIR, o contrario (`Easing.in`) costuma ficar melhor —
 * o elemento ganha velocidade ao ir embora e some antes de cansar.
 *
 * O padrao do withTiming e `Easing.inOut(Easing.quad)`, que e simetrico e um
 * pouco sem personalidade.
 */
export const ENTRADA: WithTimingConfig = {
  duration: DURACAO.media,
  easing: Easing.out(Easing.cubic),
};

export const SAIDA: WithTimingConfig = {
  duration: DURACAO.rapida,
  easing: Easing.in(Easing.cubic),
};

/**
 * Mola do toque: curta, com um quique perceptivel mas sem balancar.
 *
 * `damping` alto demais mata o quique (vira timing disfarcado); baixo demais
 * faz a interface parecer gelatina. `stiffness` controla a pressa.
 */
export const MOLA_TOQUE: WithSpringConfig = {
  damping: 12,
  stiffness: 220,
  mass: 0.5,
};

/** Mola mais calma, para algo que se acomoda em vez de responder a um dedo. */
export const MOLA_SUAVE: WithSpringConfig = {
  damping: 18,
  stiffness: 140,
  mass: 0.8,
};

/**
 * Escala de "apertado". 0.96 e quase nada — e e de proposito: o usuario nao
 * deve NOTAR a animacao, ele deve sentir que o botao respondeu. Microinteracao
 * que chama atencao para si mesma falhou.
 */
export const ESCALA_PRESSIONADO = 0.96;
