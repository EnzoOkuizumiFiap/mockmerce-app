/**
 * ---------------------------------------------------------------------------
 * TELA: DETALHE
 * ---------------------------------------------------------------------------
 * Mesma disciplina de estados da listagem, com uma diferenca: aqui nao existe
 * "vazio". Ou o produto veio, ou deu erro (um 404 e erro, com mensagem
 * propria vinda do interceptor).
 * ---------------------------------------------------------------------------
 */
import { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EstadoCarregando } from '../components/EstadoCarregando';
import { EstadoErro } from '../components/EstadoErro';
import { Estrelas } from '../components/Estrelas';
import { SecaoAvaliacoes } from '../components/SecaoAvaliacoes';
import { useFavoritos } from '../contexts/FavoritosContext';
import { ehAppError } from '../errors/AppError';
import { useAdicionarAoCarrinho } from '../hooks/useCompra';
import { useProduto } from '../hooks/useProdutos';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { PrecoAnimado } from '../components/PrecoAnimado';
import { Pressionavel } from '../components/Pressionavel';
import { formatarFaixaDePreco, formatarPreco } from '../lib/formatar';
import { resumoDeDetalhe } from '../lib/produto';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AppStackParamList, 'DetalheProduto'>;

export function DetalheProdutoScreen({ route, navigation }: Props) {
  const { id } = route.params;

  // A chave de cache inclui o id (ver hooks/useProdutos.ts). Sem isso, abrir
  // o segundo produto mostraria o primeiro, vindo do cache.
  const { data, isPending, isError, error, refetch } = useProduto(id);
  const { alternarFavorito, ehFavorito } = useFavoritos();
  const adicionar = useAdicionarAoCarrinho();

  /**
   * O que vai para os favoritos e o RESUMO, nao o detalhe.
   *
   * `useMemo` porque `resumoDeDetalhe` percorre as variantes: sem ele, a
   * conversao rodaria a cada render, inclusive nos que so mudam a estrela.
   * Aqui a lista e curta e o ganho e pequeno — o habito e que importa.
   */
  const resumo = useMemo(() => (data ? resumoDeDetalhe(data) : null), [data]);

  if (isPending) return <EstadoCarregando />;

  if (isError) {
    return (
      <EstadoErro
        mensagem={ehAppError(error) ? error.mensagem : 'Algo inesperado aconteceu.'}
        aoTentarNovamente={() => refetch()}
      />
    );
  }

  const favoritado = ehFavorito(data.id);
  const principal = data.images.find((i) => i.isPrimary) ?? data.images[0];
  /**
   * `variants[0]` pode ser undefined para o TypeScript mesmo apos checar o
   * length (`noUncheckedIndexedAccess`). Resolver com uma variavel e melhor
   * do que um `!`: se um dia a API devolver um produto sem variante, a tela
   * cai no ramo da faixa em vez de quebrar.
   */
  const varianteUnica = data.variants.length === 1 ? data.variants[0] : undefined;

  return (
    <ScrollView style={e.container} contentContainerStyle={e.conteudo}>
      {/*
        A imagem entra com fade simples, sem deslocamento: ela e o maior
        elemento da tela, e mover algo desse tamanho chama mais atencao do
        que a troca de tela merece.
      */}
      {principal ? (
        <Animated.Image entering={FadeIn.duration(300)} source={{ uri: principal.url }} style={e.imagem} />
      ) : (
        <View style={[e.imagem, e.semImagem]}>
          <Text style={e.semImagemTexto}>Produto sem foto</Text>
        </View>
      )}

      {/*
        O texto entra DEPOIS da imagem e de baixo para cima. O escalonamento
        (80ms, 140ms) cria uma ordem de leitura: nome, marca, preco. Sem ele,
        tudo aparece junto e o olho decide sozinho por onde comecar.
      */}
      <Animated.Text entering={FadeInDown.delay(80).duration(260)} style={e.titulo}>
        {data.name}
      </Animated.Text>

      {data.brand && (
        <Animated.Text entering={FadeInDown.delay(110).duration(260)} style={e.marca}>
          {data.brand.name}
        </Animated.Text>
      )}

      {/*
        Quando ha uma variante unica, o preco e um numero — e um numero pode
        MUDAR enquanto a tela esta aberta (o push de queda de preco da Semana
        6). Nesse caso usamos o <PrecoAnimado />, que se anuncia ao mudar.
        Com faixa ("de X a Y") nao ha o que animar: e texto.
      */}
      <Animated.View entering={FadeInDown.delay(140).duration(260)}>
        {varianteUnica ? (
          <PrecoAnimado valor={varianteUnica.price} style={e.preco} />
        ) : (
          <Text style={e.preco}>
            {resumo ? formatarFaixaDePreco(resumo.priceFrom, resumo.priceTo) : ''}
          </Text>
        )}
      </Animated.View>

      {/* A nota vem JUNTO com o produto (`rating`), nao das avaliacoes.
          Desenhar as estrelas aqui nao custa nenhuma requisicao a mais. */}
      {data.rating.count > 0 ? (
        <View style={e.notaLinha}>
          <Estrelas nota={data.rating.average} tamanho={15} />
          <Text style={e.notaTexto}>
            {data.rating.average.toFixed(1)} ({data.rating.count})
          </Text>
        </View>
      ) : null}

      <Pressionavel
        style={[e.botao, favoritado && e.botaoAtivo]}
        onPress={() => resumo && alternarFavorito(resumo)}
        accessibilityRole="button"
      >
        <Text style={[e.textoBotao, favoritado && e.textoBotaoAtivo]}>
          {favoritado ? '★  Salvo' : '☆  Salvar'}
        </Text>
      </Pressionavel>

      {/* Compra: e ela que habilita a avaliacao (so quem comprou avalia). */}
      <Pressionavel
        style={e.comprar}
        onPress={() => {
          const variante = data.variants.find((v) => v.isDefault) ?? data.variants[0];
          if (!variante) return;
          adicionar.mutate(
            { variantId: variante.id },
            { onSuccess: () => navigation.navigate('Carrinho') },
          );
        }}
        disabled={adicionar.isPending || resumo?.stock === 0}
      >
        <Text style={e.comprarTexto}>
          {adicionar.isPending ? 'Adicionando...' : 'Adicionar ao carrinho'}
        </Text>
      </Pressionavel>

      {data.description && <Text style={e.descricao}>{data.description}</Text>}

      {/* Produto VARIABLE tem varias variantes (tamanho, cor). Mostrar a
          lista deixa claro de onde saiu o "a partir de" do preco. */}
      {data.variants.length > 1 && (
        <View style={e.bloco}>
          <Text style={e.blocoTitulo}>Opcoes</Text>
          {data.variants.map((v) => (
            <View key={v.id} style={e.variante}>
              <Text style={e.varianteNome}>{v.label ?? v.sku ?? 'Padrao'}</Text>
              <Text style={e.variantePreco}>{formatarPreco(v.price)}</Text>
            </View>
          ))}
        </View>
      )}

      {resumo?.stock === 0 && <Text style={e.semEstoque}>Produto sem estoque.</Text>}

      <SecaoAvaliacoes
        produtoId={data.id}
        aoAvaliar={() => navigation.navigate('Avaliar', { produtoId: data.id, produtoNome: data.name })}
      />
    </ScrollView>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.superficie },
  conteudo: { padding: 20, gap: 10 },
  imagem: { width: '100%', height: 220, borderRadius: 12, backgroundColor: cores.neutroClaro },
  semImagem: { alignItems: 'center', justifyContent: 'center' },
  semImagemTexto: { color: cores.placeholder, fontSize: 14 },
  titulo: { fontSize: 22, fontWeight: '700', color: cores.textoForte, marginTop: 4 },
  marca: { fontSize: 14, color: cores.textoFraco },
  preco: { fontSize: 20, fontWeight: '700', color: cores.primaria },
  botao: {
    borderWidth: 1.5,
    borderColor: cores.primaria,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoAtivo: { backgroundColor: cores.primaria },
  textoBotao: { color: cores.primaria, fontWeight: '700', fontSize: 15 },
  textoBotaoAtivo: { color: '#FFFFFF' },
  descricao: { fontSize: 15, lineHeight: 22, color: cores.texto, marginTop: 8 },
  bloco: { marginTop: 12, gap: 6 },
  blocoTitulo: { fontSize: 16, fontWeight: '700', color: cores.textoForte },
  variante: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  varianteNome: { fontSize: 14, color: cores.texto },
  variantePreco: { fontSize: 14, fontWeight: '600', color: cores.textoForte },
  semEstoque: { marginTop: 12, color: cores.perigo, fontWeight: '600' },
  notaLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notaTexto: { fontSize: 13, color: cores.textoFraco },
  comprar: {
    backgroundColor: cores.primaria, borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  comprarTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
