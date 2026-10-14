/**
 * Card de produto.
 *
 * Componente "burro": recebe o produto e duas funcoes, e nao sabe de onde o
 * dado veio. E por isso que ele serve tanto para a listagem (dado da API)
 * quanto para os favoritos (dado do disco) sem uma linha de diferenca.
 */
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutRight, LinearTransition } from 'react-native-reanimated';

import { formatarFaixaDePreco } from '../lib/formatar';
import { cores } from '../lib/tema';
import { ProdutoResumo } from '../types/produto';
import { BotaoFavorito } from './BotaoFavorito';
import { Pressionavel } from './Pressionavel';
import { useAnimacoes } from '../contexts/AnimacoesContext';

type Props = {
  produto: ProdutoResumo;
  aoPressionar: (id: string) => void;
  ehFavorito?: boolean;
  aoFavoritar?: (produto: ProdutoResumo) => void;
  /**
   * Posicao na lista, so para escalonar a entrada.
   *
   * Sem isto os 20 cards aparecem no mesmo instante e o efeito vira um
   * "flash" — o olho nao acompanha nada. Com 40ms de diferenca entre eles, a
   * lista parece se montar, e de quebra o movimento guia a leitura de cima
   * para baixo.
   */
  indice?: number;
};

/**
 * Teto do escalonamento.
 *
 * Sem limite, o card 40 esperaria 1,6 segundo para aparecer — o usuario ja
 * rolou ate la e encontra espaco em branco. Animacao que atrapalha o uso
 * deixou de ser enfeite e virou defeito.
 */
const ATRASO_MAXIMO = 300;

export function CardProduto({ produto, aoPressionar, ehFavorito, aoFavoritar, indice = 0 }: Props) {
  const { animacoesAtivas } = useAnimacoes();

  return (
    /**
     * `entering` e a animacao declarativa de ENTRADA: o Reanimated a executa
     * quando o componente e montado, sem shared value nem useEffect. Para
     * "apareceu/sumiu" ela resolve quase tudo.
     */
    <Animated.View
      entering={animacoesAtivas ? FadeInDown.delay(Math.min(indice * 40, ATRASO_MAXIMO)).duration(260) : undefined}
      /**
       * `exiting` roda quando o item SAI da lista — e o que torna "remover
       * dos favoritos" legivel: o card desliza para fora em vez de sumir.
       *
       * `layout` e o par indispensavel dele. Sem `layout`, os cards que
       * ficaram PULAM para a posicao nova no mesmo frame, e o efeito da saida
       * se perde no solavanco. Com ele, sobem juntos.
       *
       * (Em tutorial antigo isto aparece como `Layout`; o nome atual e
       * `LinearTransition`.)
       */
      exiting={animacoesAtivas ? FadeOutRight.duration(200) : undefined}
      layout={animacoesAtivas ? LinearTransition.springify().damping(18) : undefined}
    >
      <Pressionavel style={e.card} onPress={() => aoPressionar(produto.id)}>
        {/* Capa do livro com proporção vertical (2:3) */}
        {produto.image ? (
          <Image source={{ uri: produto.image }} style={e.capa} resizeMode="cover" />
        ) : (
          <View style={[e.capa, e.semCapa]}>
            <Text style={e.semCapaIcone}>📖</Text>
            <Text style={e.semCapaTexto}>Sem capa</Text>
          </View>
        )}

        <View style={e.info}>
          <Text style={e.titulo} numberOfLines={2}>
            {produto.name}
          </Text>

          {produto.brand && (
            <Text style={e.editora} numberOfLines={1}>
              📚 {produto.brand}
            </Text>
          )}

          <Text style={e.preco}>
            {formatarFaixaDePreco(produto.priceFrom, produto.priceTo)}
          </Text>

          {produto.stock === 0 ? (
            <Text style={e.esgotado}>• Esgotado no momento</Text>
          ) : produto.stock !== undefined && produto.stock <= 3 ? (
            <Text style={e.poucoEstoque}>• Apenas {produto.stock} exemplares restantes</Text>
          ) : null}
        </View>

        {/* Favoritar na estante */}
        {aoFavoritar && (
          <BotaoFavorito ativo={ehFavorito ?? false} aoPressionar={() => aoFavoritar(produto)} />
        )}
      </Pressionavel>
    </Animated.View>
  );
}

const e = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: cores.superficie,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: cores.borda,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  capa: {
    width: 84,
    height: 122,
    borderRadius: 8,
    backgroundColor: cores.papelAzul,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  semCapa: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.papelAzul,
  },
  semCapaIcone: {
    fontSize: 22,
    marginBottom: 2,
  },
  semCapaTexto: {
    fontSize: 9,
    fontWeight: '600',
    color: cores.placeholder,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  info: { flex: 1, gap: 3 },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: cores.textoForte,
    lineHeight: 20,
  },
  editora: {
    fontSize: 12,
    color: cores.textoFraco,
    fontWeight: '500',
  },
  preco: {
    fontSize: 16,
    fontWeight: '800',
    color: cores.primaria,
    marginTop: 2,
  },
  esgotado: {
    fontSize: 11,
    color: cores.perigo,
    fontWeight: '600',
  },
  poucoEstoque: {
    fontSize: 11,
    color: cores.destaque,
    fontWeight: '600',
  },
});
