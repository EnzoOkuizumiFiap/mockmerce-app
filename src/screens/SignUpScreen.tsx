import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSession } from '@/session/session';
import { Button, TextField } from '@/components/ui';
import type { AuthStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';

// Tipagem das propriedades de navegação da tela de Cadastro
type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

/**
 * ============================================================================
 * TELA: SignUpScreen (Tela de Cadastro / Criação de Conta)
 * ============================================================================
 * 
 * Responsabilidades:
 * 1. Coletar nome, e-mail e senha para novo cadastro.
 * 2. Chamar o método `signUp` do `useSession()`, que cria o usuário no backend e já realiza o login automático em seguida.
 * 3. Aplicar validações de entrada no cliente (ex: senha com no mínimo 6 caracteres).
 * 4. Permitir retorno para a tela de login (`SignIn`).
 */
export function SignUpScreen({ navigation }: Props) {
  // Hook de sessão com a função de registro
  const { signUp } = useSession();

  // Estados locais do formulário de cadastro
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);               // Indica se a requisição está em andamento
  const [erro, setErro] = useState<string | null>(null); // Armazena mensagens de erro da API

  /**
   * Dispara o fluxo de criação de conta
   */
  async function handle() {
    setBusy(true);
    setErro(null);
    try {
      // .trim() higieniza nome e e-mail removendo espaços acidentais nas pontas
      await signUp(name.trim(), email.trim(), password);
    } catch (e) {
      // Captura erros do backend (ex: "E-mail já cadastrado")
      setErro((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    /**
     * KeyboardAvoidingView:
     * Garante que o teclado virtual do celular não cubra os campos de digitação.
     */
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.container}>
        <Text style={styles.title}>Criar conta</Text>

        {/* Campo de Nome: autoCapitalize="words" deixa a 1ª letra de cada nome maiúscula */}
        <TextField
          placeholder="nome"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />

        {/* Campo de E-mail */}
        <TextField
          placeholder="email"
          autoCapitalize="none"        // Impede primeira letra maiúscula no e-mail
          keyboardType="email-address" // Teclado mobile específico para e-mail
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />

        {/* Campo de Senha */}
        <TextField
          placeholder="senha (mín. 6 caracteres)"
          secureTextEntry              // Esconde a senha com caracteres protegidos
          value={password}
          onChangeText={setPassword}
        />

        {/* Exibe mensagem de erro se a API recusar o cadastro */}
        {erro && <Text style={styles.erro}>{erro}</Text>}

        {/* Botão de Cadastro: Desativado se faltar algum campo ou se a senha tiver menos de 6 dígitos */}
        <Button
          label={busy ? 'Criando…' : 'Cadastrar'}
          onPress={handle}
          disabled={busy || !name || !email || password.length < 6}
        />

        {/* Botão para voltar à tela de Login */}
        <Button label="Já tenho conta" variant="ghost" onPress={() => navigation.navigate('SignIn')} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
  erro: { color: '#b91c1c', fontSize: 13, textAlign: 'center' },
});
