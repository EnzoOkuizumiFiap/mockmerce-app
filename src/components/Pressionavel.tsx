/**
 * ---------------------------------------------------------------------------
 * PRESSIONAVEL — a microinteracao de toque, em um lugar so
 * ---------------------------------------------------------------------------
 * Envolve qualquer conteudo e o encolhe enquanto o dedo esta em cima.
 *
 * POR QUE ISSO IMPORTA: sem feedback, o usuario nao sabe se o toque pegou.
 * Ele toca de novo. Em um botao de comprar, tocar de novo e um pedido
 * duplicado. Animacao aqui nao e enfeite — e confirmacao.
 *
 * POR QUE NAO `useState`:
 *
 * A tentacao e `const [pressionado, setPressionado] = useState(false)` e
 * mudar o estilo. Funciona, e esta errado por dois motivos:
 *
 *   1. Cada toque dispara uma re-renderizacao do componente e dos filhos.
 *      Numa lista de 40 cards isso e trabalho a toa na thread de JS.
 *   2. A animacao passa a depender da thread de JS estar livre. Se ela
 *      estiver ocupada (buscando produtos, por exemplo), o botao responde
 *      atrasado — justo quando o app esta ocupado e mais precisa parecer vivo.
 *
 * O `useSharedValue` vive na thread de UI. Mudar ele NAO re-renderiza nada, e
 * o `useAnimatedStyle` recalcula do outro lado, a 60fps, mesmo com a thread
 * de JS travada.
 * ---------------------------------------------------------------------------
 */
import { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ESCALA_PRESSIONADO, MOLA_TOQUE } from '../lib/animacoes';

const AreaAnimada = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Desliga a animacao sem tirar o componente (ex.: item desabilitado). */
  semAnimacao?: boolean;
};

export function Pressionavel({ children, style, semAnimacao, ...resto }: Props) {
  /**
   * Um `sharedValue` e um valor que existe nas DUAS threads e fica
   * sincronizado. Repare que se le e escreve por `.value` — e que mudar isso
   * nao causa render nenhum.
   */
  const escala = useSharedValue(1);

  /**
   * ESTA FUNCAO E UM WORKLET.
   *
   * O plugin de Babel a marca e a envia para a thread de UI, onde ela roda a
   * cada frame. Por isso ela so pode usar o que existe daquele lado: nada de
   * chamar um `setState`, nada de funcao importada que nao seja worklet.
   * Para voltar para o JS existe o `runOnJS`.
   */
  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  return (
    <AreaAnimada
      {...resto}
      style={[style, estiloAnimado]}
      onPressIn={(evento) => {
        if (!semAnimacao) escala.value = withSpring(ESCALA_PRESSIONADO, MOLA_TOQUE);
        resto.onPressIn?.(evento);
      }}
      onPressOut={(evento) => {
        if (!semAnimacao) escala.value = withSpring(1, MOLA_TOQUE);
        resto.onPressOut?.(evento);
      }}
    >
      {children}
    </AreaAnimada>
  );
}
