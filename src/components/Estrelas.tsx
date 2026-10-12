/**
 * ---------------------------------------------------------------------------
 * ESTRELAS
 * ---------------------------------------------------------------------------
 * SAO DOIS COMPONENTES, e a diferenca entre eles e o conteudo da aula em
 * miniatura:
 *
 *   <Estrelas />        MOSTRA uma nota. Nao responde a toque.
 *   <SeletorEstrelas /> RECEBE uma nota. E um campo de formulario.
 *
 * A tentacao e fazer um componente so com uma prop `editavel`. O problema
 * aparece no uso: quem le `<Estrelas nota={4} />` numa lista precisa parar
 * para conferir se aquilo dispara alguma coisa ao ser tocado.
 *
 * Sem emoji e sem biblioteca de icone: a estrela e desenhada com o caractere
 * "estrela" e duas cores. Menos dependencia, e funciona igual nos dois SOs.
 * ---------------------------------------------------------------------------
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../lib/tema';

const ESTRELA_CHEIA = '★'; // ★
const ESTRELA_VAZIA = '☆'; // ☆

/** Exibicao. Use em cards, listas e no cabecalho do produto. */
export function Estrelas({ nota, tamanho = 16 }: { nota: number; tamanho?: number }) {
  return (
    <View
      style={e.linha}
      // O leitor de tela anuncia "4 de 5 estrelas" em vez de ler cinco
      // caracteres soltos, um por um.
      accessibilityRole="image"
      accessibilityLabel={`${nota} de 5 estrelas`}
    >
      {[1, 2, 3, 4, 5].map((posicao) => (
        <Text
          key={posicao}
          style={[
            { fontSize: tamanho },
            posicao <= Math.round(nota) ? e.cheia : e.vazia,
          ]}
        >
          {posicao <= Math.round(nota) ? ESTRELA_CHEIA : ESTRELA_VAZIA}
        </Text>
      ))}
    </View>
  );
}

/** Campo de formulario: o usuario toca para escolher a nota. */
export function SeletorEstrelas({
  nota,
  aoEscolher,
}: {
  nota: number;
  aoEscolher: (nota: number) => void;
}) {
  return (
    <View style={e.linha}>
      {[1, 2, 3, 4, 5].map((posicao) => (
        <Pressable
          key={posicao}
          onPress={() => aoEscolher(posicao)}
          /**
           * A area de toque e maior que a estrela desenhada.
           *
           * Um alvo de 20px falha muito no dedo — a recomendacao das duas
           * plataformas e ~44px. `hitSlop` aumenta a area sem mudar o visual.
           */
          hitSlop={10}
          accessibilityRole="radio"
          accessibilityState={{ selected: posicao === nota }}
          accessibilityLabel={`${posicao} ${posicao === 1 ? 'estrela' : 'estrelas'}`}
        >
          <Text style={[e.selecionavel, posicao <= nota ? e.cheia : e.vazia]}>
            {posicao <= nota ? ESTRELA_CHEIA : ESTRELA_VAZIA}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const e = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 2 },
  selecionavel: { fontSize: 34 },
  cheia: { color: cores.destaque },
  vazia: { color: cores.neutro },
});
