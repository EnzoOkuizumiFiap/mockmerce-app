/**
 * ---------------------------------------------------------------------------
 * PRECO QUE REAGE A MUDANCA
 * ---------------------------------------------------------------------------
 * Liga a Semana 6 com esta.
 *
 * Quando chega o push de "baixou de preco" e o cliente JA ESTA olhando aquele
 * produto, trocar o numero em silencio e pior do que nao avisar: o valor
 * muda sozinho e a pessoa nao sabe se leu errado. Aqui a troca se ANUNCIA —
 * o preco pisca em destaque e volta.
 *
 * Repare que o componente nao sabe de push nenhum. Ele so reage ao valor
 * mudar, venha de onde vier: refetch, cache, notificacao. Animar a partir do
 * DADO, e nao do evento, e o que o mantem simples.
 * ---------------------------------------------------------------------------
 */
import { useEffect, useRef } from 'react';
import { StyleSheet, TextStyle, StyleProp } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { DURACAO } from '../lib/animacoes';
import { useAnimacoes } from '../contexts/AnimacoesContext';
import { formatarPreco } from '../lib/formatar';
import { cores } from '../lib/tema';

type Props = {
  valor: number;
  style?: StyleProp<TextStyle>;
};

export function PrecoAnimado({ valor, style }: Props) {
  const { animacoesAtivas } = useAnimacoes();
  /** 0 = normal, 1 = em destaque. O estilo interpola entre os dois. */
  const destaque = useSharedValue(0);
  const anterior = useRef(valor);

  useEffect(() => {
    if (anterior.current === valor) return;
    const caiu = valor < anterior.current;
    anterior.current = valor;

    // So a queda comemora — mesma regra do push la do backend.
    if (!caiu || !animacoesAtivas) return;

    destaque.value = withSequence(
      withTiming(1, { duration: DURACAO.rapida }),
      withTiming(0, { duration: DURACAO.lenta }),
    );
  }, [valor, destaque, animacoesAtivas]);

  /**
   * `interpolateColor` e um worklet: ele traduz 0..1 em uma cor, a cada
   * frame, na thread de UI. Nao da para fazer isso com `withTiming` direto
   * numa string de cor — cor nao e numero.
   */
  const estiloAnimado = useAnimatedStyle(() => ({
    color: interpolateColor(destaque.value, [0, 1], [cores.textoForte, cores.sucesso]),
    transform: [{ scale: 1 + destaque.value * 0.12 }],
  }));

  return (
    <Animated.Text style={[e.preco, style, estiloAnimado]}>
      {formatarPreco(valor)}
    </Animated.Text>
  );
}

const e = StyleSheet.create({
  preco: { fontSize: 22, fontWeight: '700' },
});
