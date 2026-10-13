/**
 * A estrela.
 *
 * Existe como componente proprio porque aparece em dois lugares com pesos
 * visuais diferentes (o card da lista e o detalhe) e precisa se comportar
 * igual nos dois: mesma area de toque, mesmo rotulo para leitor de tela,
 * mesmo simbolo.
 *
 * A ANIMACAO DAQUI E A MAIS IMPORTANTE DO APP.
 *
 * Favoritar nao tem confirmacao: nao abre alerta, nao navega, nao mostra
 * mensagem. A unica prova de que funcionou e a estrela mudar. Uma mudanca
 * instantanea de cor e facil de perder no meio de uma lista — por isso o
 * "pulo": ele custa 300ms e resolve a pergunta "salvou ou nao?".
 */
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DURACAO, MOLA_TOQUE, ANIMACOES_ATIVADAS } from '../lib/animacoes';
import { useAnimacoes } from '../contexts/AnimacoesContext';
import { cores } from '../lib/tema';

type Props = {
  ativo: boolean;
  aoPressionar: () => void;
  tamanho?: number;
};

export function BotaoFavorito({ ativo, aoPressionar, tamanho = 24 }: Props) {
  const { animacoesAtivas } = useAnimacoes();
  const escala = useSharedValue(1);

  /**
   * O pulo reage a `ativo`, e nao ao toque.
   *
   * Parece detalhe, mas nao e: quem manda na estrela e o estado que veio do
   * contexto de favoritos, nao o dedo. Se a gravacao falhar e o estado voltar
   * atras, a animacao nao pode ter dito que deu certo.
   *
   * E anima so ao ATIVAR. Remover dos favoritos nao merece comemoracao.
   */
  useEffect(() => {
    if (!ativo || !ANIMACOES_ATIVADAS || !animacoesAtivas) return;

    /**
     * `withSequence` encadeia: cresce rapido e volta com mola. Repare que o
     * segundo passo nao tem duracao — ele acaba quando a mola se acomoda.
     */
    escala.value = withSequence(
      withTiming(1.35, { duration: DURACAO.rapida }),
      withSpring(1, MOLA_TOQUE),
    );
  }, [ativo, escala, animacoesAtivas]);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  return (
    <Pressable
      onPress={aoPressionar}
      /**
       * `hitSlop` amplia a area de toque sem mudar o layout. Uma estrela de
       * 24px e menor que o alvo minimo confortavel (~44px) — sem isto, o
       * usuario erra o toque e abre o produto em vez de favoritar.
       */
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={ativo ? 'Remover dos salvos' : 'Salvar produto'}
      style={e.area}
    >
      <Animated.Text style={[e.estrela, { fontSize: tamanho }, ativo && e.ativa, estiloAnimado]}>
        {ativo ? '★' : '☆'}
      </Animated.Text>
    </Pressable>
  );
}

const e = StyleSheet.create({
  area: { padding: 4 },
  estrela: { color: cores.neutro },
  ativa: { color: cores.destaque },
});
