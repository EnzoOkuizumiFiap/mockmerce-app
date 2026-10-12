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
import { useState } from 'react';
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
import { ehAppError } from '../errors/AppError';
import { useCriarAvaliacao } from '../hooks/useAvaliacoes';
import { cores } from '../lib/tema';
import { AppStackParamList } from '../navigation/tipos';
import { arquivoDaUri, enviarImagem } from '../services/uploadService';

type Props = NativeStackScreenProps<AppStackParamList, 'Avaliar'>;

const MAX_FOTOS = 5;

/** Foto ja enviada: guardamos o id (vai para a API) e a url (vai para a tela). */
type FotoPronta = { mediaId: string; url: string };

export function AvaliarScreen({ route, navigation }: Props) {
  const { produtoId, produtoNome } = route.params;

  const [nota, setNota] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [comentario, setComentario] = useState('');
  const [fotos, setFotos] = useState<FotoPronta[]>([]);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const criar = useCriarAvaliacao(produtoId);

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

    criar.mutate(
      {
        rating: nota,
        title: titulo.trim() || null,
        comment: comentario.trim(),
        mediaIds: fotos.map((f) => f.mediaId),
      },
      {
        onSuccess: () => navigation.goBack(),
        onError: (erro) => {
          /**
           * Os dois erros de negocio desta tela:
           *   403 nao comprou   409 ja avaliou
           * A mensagem vem pronta da API (o interceptor traduz), entao aqui
           * so exibimos — nao reescrevemos o texto.
           */
          Alert.alert(
            'Nao foi possivel avaliar',
            ehAppError(erro) ? erro.mensagem : 'Tente novamente.',
          );
        },
      },
    );
  }

  return (
    <ScrollView style={e.container} contentContainerStyle={e.conteudo}>
      <Text style={e.produto}>{produtoNome}</Text>

      <Text style={e.rotulo}>Sua nota</Text>
      <SeletorEstrelas nota={nota} aoEscolher={setNota} />

      <Text style={e.rotulo}>Titulo (opcional)</Text>
      <TextInput
        style={e.campo}
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Resuma em poucas palavras"
        placeholderTextColor={cores.placeholder}
        maxLength={120}
      />

      <Text style={e.rotulo}>Comentario</Text>
      <TextInput
        style={[e.campo, e.campoGrande]}
        value={comentario}
        onChangeText={setComentario}
        placeholder="O que voce achou do produto?"
        placeholderTextColor={cores.placeholder}
        multiline
        maxLength={2000}
      />

      <Text style={e.rotulo}>
        Fotos ({fotos.length}/{MAX_FOTOS})
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
        style={[e.botao, (criar.isPending || nota === 0) && e.botaoDesativado]}
        onPress={enviar}
        disabled={criar.isPending || nota === 0}
      >
        {criar.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={e.botaoTexto}>Enviar avaliacao</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 16, gap: 8, paddingBottom: 40 },
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
