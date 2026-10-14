/**
 * ---------------------------------------------------------------------------
 * TELA: AVALIAR PRODUTO
 * ---------------------------------------------------------------------------
 * O formulario: nota, titulo, comentario e ate 5 fotos.
 *
 * A FOTO E O PONTO DELICADO, e vale entender a ordem antes de ler o codigo:
 *
 *   1. o usuario escolhe a imagem      (ImagePicker, so no celular)
 *   2. a imagem sobe SOZINHA           (POST /uploads -> devolve mediaId)
 *   3. a avaliacao leva os mediaIds    (POST /products/:id/reviews)
 *
 * Por que nao mandar a foto junto com a avaliacao, numa requisicao so? Porque
 * seriam duas coisas muito diferentes no mesmo envio: um arquivo pesado e um
 * JSON leve. Separando, a foto sobe enquanto a pessoa ainda esta escrevendo,
 * e um erro no upload nao joga fora o texto que ela digitou.
 * ---------------------------------------------------------------------------
 */
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { SeletorEstrelas } from '../components/Estrelas';
import { useAuth } from '../contexts/AuthContext';
import { ehAppError } from '../errors/AppError';
import {
  useAvaliacoes,
  useCriarAvaliacao,
  useEditarAvaliacao,
  usePodeAvaliar,
} from '../hooks/useAvaliacoes';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';
import { arquivoDaUri, enviarImagem } from '../services/uploadService';

type Props = NativeStackScreenProps<AppStackParamList, 'Avaliar'>;

const MAX_FOTOS = 5;

/** Foto ja enviada: guardamos o id (vai para a API) e a url (vai para a tela). */
type FotoPronta = { mediaId: string; url: string };

export function AvaliarScreen({ route, navigation }: Props) {
  const { produtoId, produtoNome, avaliacaoInicial } = route.params;
  const { usuario } = useAuth();

  const { data: avaliacoesData } = useAvaliacoes(produtoId);
  const { data: permissao } = usePodeAvaliar(produtoId);

  // Busca a avaliação do próprio leitor caso não tenha vindo em route.params
  const avaliacaoExistente = useMemo(() => {
    if (avaliacaoInicial) return avaliacaoInicial;
    if (!avaliacoesData?.data) return null;
    return (
      avaliacoesData.data.find(
        (a) =>
          (permissao?.reviewId && a.id === permissao.reviewId) ||
          (usuario?.id && a.author?.id === usuario.id) ||
          a.isMine,
      ) ?? null
    );
  }, [avaliacaoInicial, avaliacoesData, permissao, usuario]);

  const [nota, setNota] = useState(avaliacaoInicial?.rating ?? 0);
  const [titulo, setTitulo] = useState(avaliacaoInicial?.title ?? '');
  const [comentario, setComentario] = useState(avaliacaoInicial?.comment ?? '');
  const [fotos, setFotos] = useState<FotoPronta[]>(
    avaliacaoInicial?.images.map((img) => ({
      mediaId: img.mediaId ?? img.id,
      url: img.url,
    })) ?? [],
  );
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  // Identificador da avaliação existente para edição
  const reviewIdParaEditar = avaliacaoInicial?.id ?? avaliacaoExistente?.id ?? permissao?.reviewId;
  const ehEdicao = Boolean(reviewIdParaEditar || permissao?.reason === 'ALREADY_REVIEWED');

  // Se a avaliação inicial não veio via rota mas foi resolvida via query, ajusta os campos
  const [prevIdCarregado, setPrevIdCarregado] = useState<string | null>(
    avaliacaoInicial?.id ?? null,
  );

  if (
    avaliacaoExistente &&
    avaliacaoExistente.id !== prevIdCarregado &&
    nota === 0 &&
    !comentario
  ) {
    setPrevIdCarregado(avaliacaoExistente.id);
    setNota(avaliacaoExistente.rating);
    setTitulo(avaliacaoExistente.title ?? '');
    setComentario(avaliacaoExistente.comment ?? '');
    setFotos(
      avaliacaoExistente.images.map((img) => ({
        mediaId: img.mediaId ?? img.id,
        url: img.url,
      })),
    );
  }

  const criar = useCriarAvaliacao(produtoId);
  const editar = useEditarAvaliacao(produtoId);
  const isEnviando = criar.isPending || editar.isPending;

  /**
   * Escolher + enviar a foto.
   *
   * Repare que o upload acontece AQUI, e nao no submit. Quando a pessoa
   * aperta "Enviar avaliacao", as fotos ja estao no servidor e so os ids
   * viajam — o envio final e instantaneo.
   */
  async function adicionarFoto() {
    if (fotos.length >= MAX_FOTOS) {
      Alert.alert('Limite de fotos', `Voce pode enviar ate ${MAX_FOTOS} fotos.`);
      return;
    }

    // A galeria tambem pede permissao. Negada, nao ha o que fazer alem de avisar.
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        'Sem acesso as fotos',
        'Libere o acesso a galeria nos ajustes do aparelho para anexar imagens.',
      );
      return;
    }

    const escolha = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],

      /**
       * `quality: 0.6` nao e economia de disco — e tempo de upload.
       *
       * Uma foto de celular moderno tem 3 a 6 MB. Nessa qualidade ela cai
       * para algumas centenas de KB, sem diferenca visivel num card de
       * avaliacao. Na rede da faculdade isso e a diferenca entre 2 segundos
       * e meio minuto.
       */
      quality: 0.6,
    });

    // `canceled` ja garante que ha asset, mas o TypeScript nao sabe disso —
    // e conferir e mais barato que um `!` que um dia vira crash.
    const imagem = escolha.canceled ? null : escolha.assets[0];
    if (!imagem) return;

    setEnviandoFoto(true);
    try {
      const midia = await enviarImagem(arquivoDaUri(imagem.uri));
      setFotos((atuais) => [...atuais, { mediaId: midia.id, url: midia.url }]);
    } catch (erro) {
      Alert.alert(
        'Nao foi possivel enviar a foto',
        ehAppError(erro) ? erro.mensagem : 'Tente novamente.',
      );
    } finally {
      setEnviandoFoto(false);
    }
  }

  function removerFoto(mediaId: string) {
    setFotos((atuais) => atuais.filter((f) => f.mediaId !== mediaId));
  }

  function enviar() {
    if (nota === 0) {
      Alert.alert('Escolha a nota', 'Toque nas estrelas para dar sua nota.');
      return;
    }

    const payload = {
      rating: nota,
      title: titulo.trim() || null,
      comment: comentario.trim(),
      mediaIds: fotos.map((f) => f.mediaId),
    };

    if (ehEdicao && reviewIdParaEditar) {
      editar.mutate(
        {
          avaliacaoId: reviewIdParaEditar,
          dados: payload,
        },
        {
          onSuccess: () => navigation.goBack(),
          onError: (erro) => {
            Alert.alert(
              'Não foi possível atualizar a avaliação',
              ehAppError(erro) ? erro.mensagem : 'Tente novamente.',
            );
          },
        },
      );
    } else {
      criar.mutate(payload, {
        onSuccess: () => navigation.goBack(),
        onError: (erro) => {
          Alert.alert(
            'Não foi possível avaliar',
            ehAppError(erro) ? erro.mensagem : 'Tente novamente.',
          );
        },
      });
    }
  }

  return (
    <ScrollView style={e.container} contentContainerStyle={e.conteudo}>
      {ehEdicao && (
        <View style={e.badgeModoEdicao}>
          <Text style={e.textoModoEdicao}>✏️ Editando sua avaliação registrada</Text>
        </View>
      )}

      <Text style={e.produto}>📖 {produtoNome}</Text>

      <Text style={e.rotulo}>Sua nota para o livro</Text>
      <SeletorEstrelas nota={nota} aoEscolher={setNota} />

      <Text style={e.rotulo}>Título da resenha (opcional)</Text>
      <TextInput
        style={e.campo}
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Resuma sua impressão sobre a leitura"
        placeholderTextColor={cores.placeholder}
        maxLength={120}
      />

      <Text style={e.rotulo}>Sua opinião sobre a leitura</Text>
      <TextInput
        style={[e.campo, e.campoGrande]}
        value={comentario}
        onChangeText={setComentario}
        placeholder="Conte o que achou da história, escrita, personagens ou edição..."
        placeholderTextColor={cores.placeholder}
        multiline
        maxLength={2000}
      />

      <Text style={e.rotulo}>
        Fotos do seu exemplar ({fotos.length}/{MAX_FOTOS})
      </Text>
      <View style={e.fotos}>
        {fotos.map((foto) => (
          <Pressable key={foto.mediaId} onPress={() => removerFoto(foto.mediaId)}>
            <Image source={{ uri: foto.url }} style={e.foto} />
            <View style={e.remover}>
              <Text style={e.removerTexto}>x</Text>
            </View>
          </Pressable>
        ))}

        {fotos.length < MAX_FOTOS ? (
          <Pressable style={e.adicionar} onPress={adicionarFoto} disabled={enviandoFoto}>
            {enviandoFoto ? (
              <ActivityIndicator color={cores.primaria} />
            ) : (
              <Text style={e.adicionarTexto}>+</Text>
            )}
          </Pressable>
        ) : null}
      </View>

      <Pressable
        style={[e.botao, (isEnviando || nota === 0) && e.botaoDesativado]}
        onPress={enviar}
        disabled={isEnviando || nota === 0}
        accessibilityRole="button"
        accessibilityLabel="Publicar avaliação"
      >
        {isEnviando ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={e.botaoTexto}>
            {ehEdicao ? 'Salvar alterações da avaliação' : 'Publicar avaliação literária'}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 16, gap: 8, paddingBottom: 40 },
  badgeModoEdicao: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  textoModoEdicao: {
    fontSize: 12,
    fontWeight: '700',
    color: cores.primaria,
  },
  produto: { fontSize: 18, fontWeight: '700', color: cores.textoForte, marginBottom: 4 },
  rotulo: { fontSize: 13, fontWeight: '600', color: cores.texto, marginTop: 12 },
  campo: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: cores.textoForte,
  },
  campoGrande: { height: 110, textAlignVertical: 'top' },
  fotos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foto: { width: 72, height: 72, borderRadius: 8, backgroundColor: cores.neutroClaro },
  remover: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: cores.perigo, width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  removerTexto: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  adicionar: {
    width: 72, height: 72, borderRadius: 8,
    borderWidth: 1, borderColor: cores.borda, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: cores.superficie,
  },
  adicionarTexto: { fontSize: 28, color: cores.primaria },
  botao: {
    backgroundColor: cores.primaria, borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  botaoDesativado: { backgroundColor: cores.primariaDesativada },
  botaoTexto: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
