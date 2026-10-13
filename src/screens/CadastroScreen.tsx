/**
 * ---------------------------------------------------------------------------
 * TELA: CADASTRO
 * ---------------------------------------------------------------------------
 * Cria o cliente final da loja e JA ENTRA — a API devolve o token junto com
 * o cliente criado (ver AuthContext.cadastrar).
 *
 * Por isso, igual ao login, esta tela NAO navega para lugar nenhum depois de
 * dar certo. Ela chama `cadastrar` e acabou: o usuario aparece no contexto e
 * o RootNavigator troca o stack inteiro sozinho.
 *
 * VALIDACAO EM DOIS LUGARES, e os dois precisam existir:
 *
 *   aqui    -> avisa antes de gastar uma requisicao ("as senhas nao batem")
 *   na API  -> e quem realmente decide (e-mail repetido, formato, tamanho)
 *
 * Validar so na tela seria ingenuidade — qualquer um chama a API direto.
 * Validar so na API faria o usuario esperar a rede para descobrir que digitou
 * a senha diferente nos dois campos.
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

import { useAuth } from '../contexts/AuthContext';
import { ehAppError } from '../errors/AppError';
import { cores } from '../lib/tema';
import { AuthStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AuthStackParamList, 'Cadastro'>;

/** A API exige 6; o app avisa antes de mandar. */
const MIN_SENHA = 6;

export function CadastroScreen({ navigation }: Props) {
  const { cadastrar } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const preenchido =
    nome.trim().length > 0 && email.trim().length > 0 && senha.length > 0 && confirmacao.length > 0;
  const podeEnviar = preenchido && !enviando;

  /**
   * As checagens que dao para fazer sem rede.
   *
   * Devolve a mensagem do problema, ou null se estiver tudo certo. Fica numa
   * funcao separada para a leitura do `aoCadastrar` continuar sendo "valida,
   * envia, trata erro" — e nao um bloco de ifs.
   */
  function problemaLocal(): string | null {
    if (senha.length < MIN_SENHA) {
      return `A senha precisa ter pelo menos ${MIN_SENHA} caracteres.`;
    }
    if (senha !== confirmacao) {
      return 'As senhas nao sao iguais.';
    }
    return null;
  }

  async function aoCadastrar() {
    const problema = problemaLocal();
    if (problema) {
      setErro(problema);
      return;
    }

    try {
      setErro(null);
      setEnviando(true);
      await cadastrar({
        name: nome.trim(),
        // `trim` no e-mail porque o teclado do celular adora deixar um espaco
        // no fim depois do autocomplete.
        email: email.trim(),
        password: senha,
      });
      // Deu certo: nao navegamos. O RootNavigator faz isso sozinho.
    } catch (e) {
      /**
       * A mensagem vem pronta do interceptor, em portugues e escrita para o
       * usuario final — inclusive a do 409 ("Ja existe um cliente com este
       * e-mail"). A tela so decide ONDE mostrar.
       */
      setErro(ehAppError(e) ? e.mensagem : 'Nao foi possivel criar a conta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={e.safe}>
      <KeyboardAvoidingView
        style={e.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={e.container} keyboardShouldPersistTaps="handled">
          <Text style={e.titulo}>Criar conta</Text>
          <Text style={e.subtitulo}>E rapido: nome, e-mail e senha</Text>

          <TextInput
            style={e.campo}
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome"
            placeholderTextColor={cores.placeholder}
            // `words` porque nome proprio comeca com maiuscula — o contrario
            // do e-mail, logo abaixo.
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
          />

          <TextInput
            style={e.campo}
            value={email}
            onChangeText={setEmail}
            placeholder="E-mail"
            placeholderTextColor={cores.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="next"
          />

          <TextInput
            style={e.campo}
            value={senha}
            onChangeText={setSenha}
            placeholder={`Senha (minimo ${MIN_SENHA} caracteres)`}
            placeholderTextColor={cores.placeholder}
            secureTextEntry
            autoCapitalize="none"
            // `new-password` avisa o gerenciador de senhas que e cadastro, e
            // nao login: e assim que ele oferece gerar uma senha forte.
            autoComplete="new-password"
            returnKeyType="next"
          />

          <TextInput
            style={e.campo}
            value={confirmacao}
            onChangeText={setConfirmacao}
            placeholder="Repita a senha"
            placeholderTextColor={cores.placeholder}
            secureTextEntry
            autoCapitalize="none"
            onSubmitEditing={() => podeEnviar && aoCadastrar()}
            returnKeyType="go"
          />

          <Pressable
            style={[e.botao, !podeEnviar && e.botaoOff]}
            onPress={aoCadastrar}
            disabled={!podeEnviar}
          >
            <Text style={e.textoBotao}>{enviando ? 'Criando conta...' : 'Criar conta'}</Text>
          </Pressable>

          {erro && <Text style={e.erro}>{erro}</Text>}

          <View style={e.rodape}>
            <Text style={e.rodapeTexto}>Ja tem conta?</Text>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <Text style={e.link}>Entrar</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const e = StyleSheet.create({
  safe: { flex: 1, backgroundColor: cores.superficie },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 10 },
  titulo: { fontSize: 32, fontWeight: '800', color: cores.primaria, textAlign: 'center' },
  subtitulo: { fontSize: 15, color: cores.textoFraco, textAlign: 'center', marginBottom: 20 },
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
});
