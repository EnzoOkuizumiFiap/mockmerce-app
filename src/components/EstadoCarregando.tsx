/**
 * Estado de carregamento.
 *
 * O `ActivityIndicator` continua ali — ele e nativo e acessivel. O que a
 * animacao acrescenta e o PULSO do texto: um movimento lento e continuo que
 * diz "ainda estou trabalhando", diferente de uma tela que simplesmente
 * congelou.
 *
 * Repare na diferenca de intencao com as outras animacoes do app: esta NAO
 * responde a nada. Ela e um sinal de vida, e por isso e lenta, discreta e
 * infinita.
 */
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { cores } from '../lib/tema';
import { useAnimacoes } from '../contexts/AnimacoesContext';

export function EstadoCarregando({ mensagem = 'Carregando...' }: { mensagem?: string }) {
  const { animacoesAtivas } = useAnimacoes();
  const opacidade = useSharedValue(1);

  useEffect(() => {
    if (!animacoesAtivas) {
      opacidade.value = 1;
      return;
    }

    /**
     * `withRepeat(animacao, -1)` repete para sempre (-1 = sem fim).
     *
     * O "vai e volta" aqui vem do `withSequence`: desce ate 0.35 e sobe de
     * volta. Existe um atalho — `withRepeat(withTiming(0.35), -1, true)`, em
     * que o terceiro parametro inverte a cada ciclo. Os dois funcionam; a
     * sequencia foi escolhida por deixar os dois tempos visiveis no codigo.
     *
     * O que NAO funciona e repetir so a ida: a opacidade voltaria a 1 num
     * corte seco a cada ciclo, e o pulso viraria um piscar.
     *
     * IMPORTANTE: animacao infinita precisa PARAR quando a tela sai. Como o
     * shared value morre junto com o componente, aqui isso e automatico — mas
     * se voce guardar a animacao em outro lugar, lembre de cancelar
     * (`cancelAnimation`), senao ela segue rodando na thread de UI.
     */
    opacidade.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
    );
  }, [animacoesAtivas, opacidade]);

  const estiloAnimado = useAnimatedStyle(() => ({ opacity: opacidade.value }));

  return (
    <View style={e.container}>
      <ActivityIndicator size="large" color={cores.primaria} />
      <Animated.Text style={[e.texto, estiloAnimado]}>{mensagem}</Animated.Text>
    </View>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  texto: { fontSize: 15, color: cores.textoFraco },
});
