/**
 * ---------------------------------------------------------------------------
 * TELA: LOGIN
 * ---------------------------------------------------------------------------
 * O "usuario" desta API e o E-MAIL do cliente da loja. Quem nao tem conta
 * ainda vai para a tela de Cadastro — as duas vivem no mesmo AuthStack.
 *
 * Repare que a tela NAO guarda token e NAO navega para lugar nenhum. Ela
 * chama `entrar` e acabou: quando o usuario aparece no contexto, o
 * RootNavigator troca o stack inteiro sozinho.
 * ---------------------------------------------------------------------------
 */
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { config } from '../config/env';
import { useAuth } from '../contexts/AuthContext';
import { ehAppError } from '../errors/AppError';
import { cores } from '../lib/tema';
import { AuthStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const podeEnviar = email.trim().length > 0 && password.length > 0 && !enviando;

  async function aoEntrar() {
    try {
      setErro(null);
      setEnviando(true);
      await entrar({ email: email.trim(), password });
    } catch (e) {
      /**
       * A mensagem ja vem pronta do interceptor — em portugues e escrita para
       * o usuario final ("E-mail ou senha invalidos."). A tela nao decide
       * texto de erro; ela so decide onde mostrar.
       */
      setErro(ehAppError(e) ? e.mensagem : 'Nao foi possivel entrar.');
    } finally {
      /**
       * `finally`, e nao uma linha no fim do `try`. Se o login falhar, o
       * botao precisa voltar ao normal do mesmo jeito — senao o usuario fica
       * com "Entrando..." para sempre e sem como tentar de novo.
       */
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={e.safe}>
      <KeyboardAvoidingView
        style={e.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={e.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={e.marcaCabecalho}>
            <Text style={e.iconeLogo}>📖</Text>
            <Text style={e.titulo}>Livro Aberto</Text>
            <Text style={e.subtitulo}>Sua livraria e sebo digital favorito</Text>
          </View>

          <TextInput
            style={e.campo}
            value={email}
            onChangeText={setEmail}
            placeholder="Seu e-mail de leitor"
            placeholderTextColor={cores.placeholder}
            // Teclado de e-mail, sem maiuscula automatica e sem corretor:
            // os tres juntos evitam a maior parte dos "senha invalida" que na
            // verdade eram "Maria@X.com" com M maiusculo.
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />

          <TextInput
            style={e.campo}
            value={password}
            onChangeText={setPassword}
            placeholder="Sua senha secreta"
            placeholderTextColor={cores.placeholder}
            secureTextEntry
            autoCapitalize="none"
            onSubmitEditing={() => podeEnviar && aoEntrar()}
            returnKeyType="go"
          />

          <Pressable
            style={[e.botao, !podeEnviar && e.botaoOff]}
            onPress={aoEntrar}
            disabled={!podeEnviar}
            accessibilityRole="button"
            accessibilityLabel="Entrar no aplicativo"
          >
            <Text style={e.textoBotao}>{enviando ? 'Entrando no acervo...' : 'Entrar na Livraria'}</Text>
          </Pressable>

          {erro && <Text style={e.erro}>{erro}</Text>}

          <View style={e.rodape}>
            <Text style={e.rodapeTexto}>Ainda não é leitor cadastrado?</Text>
            <Pressable onPress={() => navigation.navigate('Cadastro')} hitSlop={8}>
              <Text style={e.link}>Criar estante agora</Text>
            </Pressable>
          </View>

          {/* Diagnostico de aula: sem a API key, TODA chamada volta 401 —
              inclusive o login. Sem este aviso, o sintoma parece senha errada. */}
          {!config.apiKey && (
            <View style={e.aviso}>
              <Text style={e.avisoTexto}>
                A API key do grupo nao esta configurada. Copie o arquivo{' '}
                <Text style={e.mono}>.env.example</Text> para{' '}
                <Text style={e.mono}>.env</Text>, cole a chave e rode{' '}
                <Text style={e.mono}>npx expo start --clear</Text>.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const e = StyleSheet.create({
  safe: { flex: 1, backgroundColor: cores.superficie },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 10 },
  marcaCabecalho: { alignItems: 'center', marginBottom: 20 },
  iconeLogo: { fontSize: 44, marginBottom: 8 },
  titulo: { fontSize: 32, fontWeight: '800', color: cores.primaria, textAlign: 'center' },
  subtitulo: {
    fontSize: 14,
    color: cores.textoFraco,
    textAlign: 'center',
    marginTop: 4,
  },
  campo: {
    borderWidth: 1,
    borderColor: cores.neutro,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: cores.textoForte,
  },
  botao: {
    backgroundColor: cores.primaria,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  botaoOff: { backgroundColor: cores.primariaDesativada },
  textoBotao: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  erro: { color: cores.perigo, fontSize: 14, textAlign: 'center', marginTop: 8 },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  rodapeTexto: { fontSize: 14, color: cores.textoFraco },
  link: { fontSize: 14, fontWeight: '700', color: cores.primaria },
  aviso: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: cores.primariaClara,
  },
  avisoTexto: { fontSize: 13, color: cores.primariaEscura, lineHeight: 19 },
  mono: { fontWeight: '700' },
});
