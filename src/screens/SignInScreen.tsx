import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSession } from '@/session/session';
import { Button, TextField } from '@/components/ui';
import type { AuthStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';
import { theme } from '@/lib/theme';

// Tipagem das props de navegação da pilha de autenticação
type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

/**
 * ============================================================================
 * TELA: SignInScreen (Tela de Login / Autenticação)
 * ============================================================================
 * 
 * Responsabilidades:
 * 1. Coletar e-mail e senha do usuário.
 * 2. Autenticar na API através do método `signIn` do `useSession()`.
 * 3. Salvar o token no dispositivo e mudar o estado da aplicação para "logado".
 * 4. Permitir navegação para telas de Cadastro (`SignUp`) e Recuperação de Senha (`ForgotPassword`).
 */
export function SignInScreen({ navigation }: Props) {
  // Hook global de sessão que contém a função de login
  const { signIn } = useSession();

  // Estados locais do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);               // Controla se a requisição está em andamento
  const [erro, setErro] = useState<string | null>(null); // Mensagem de erro caso o login falhe

  /**
   * Função que executa o fluxo de autenticação
   */
  async function handle() {
    setBusy(true);
    setErro(null);
    try {
      // .trim() remove espaços em branco antes ou depois do e-mail
      await signIn(email.trim(), password);
    } catch (e) {
      // Extrai a mensagem de erro da API (ex: "E-mail ou senha incorretos")
      setErro((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    /**
     * KeyboardAvoidingView:
     * Impede que o teclado virtual do celular fique em cima dos inputs.
     * - No iOS usa 'padding' para empurrar a tela para cima.
     * - No Android usa undefined (o sistema já faz nativamente).
     */
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.container}>
        {/* Cabeçalho */}
        <Text style={styles.title}>Loja da Turma</Text>
        <Text style={styles.subtitle}>Entre para continuar</Text>

        {/* Campo de E-mail com configurações ideais para mobile */}
        <TextField
          placeholder="email"
          autoCapitalize="none"        // Impede a primeira letra de ficar maiúscula
          keyboardType="email-address" // Teclado otimizado com @ e .
          autoComplete="email"         // Sugestão de preenchimento automático do sistema
          value={email}
          onChangeText={setEmail}
        />

        {/* Campo de Senha protegido */}
        <TextField
          placeholder="senha"
          secureTextEntry              // Oculta os caracteres digitados com bolinhas
          value={password}
          onChangeText={setPassword}
        />

        {/* Mensagem de Erro em caso de falha de login */}
        {erro && <Text style={styles.erro}>{erro}</Text>}

        {/* Botão Principal de Login */}
        <Button
          label={busy ? 'Entrando…' : 'Entrar'}
          onPress={handle}
          disabled={busy || !email || !password} // Desativa se estiver carregando ou se faltar campos
        />

        {/* Links secundários de navegação */}
        <Button label="Esqueci minha senha" variant="ghost" onPress={() => navigation.navigate('ForgotPassword')} />
        <Button label="Criar uma conta" variant="ghost" onPress={() => navigation.navigate('SignUp')} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: theme.colors.primaryDark, textAlign: 'center' },
  subtitle: { fontSize: 14, color: theme.colors.greyDark, textAlign: 'center', marginBottom: 8 },
  erro: { color: theme.colors.error, fontSize: 13, textAlign: 'center' },
});
