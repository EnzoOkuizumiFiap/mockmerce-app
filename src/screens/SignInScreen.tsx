import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSession } from '@/session/session';
import { Button, Card, TextField } from '@/components/ui';
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
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>📖</Text>
          </View>
          <Text style={styles.brandTitle}>{theme.storeName}</Text>
          <Text style={styles.brandSubtitle}>{theme.tagline}</Text>
        </View>

        {/* Card de Login */}
        <Card style={styles.loginCard}>
          <Text style={styles.cardTitle}>Entrar</Text>
          <Text style={styles.cardSubtitle}>Acesse sua conta para continuar</Text>

          <View style={styles.form}>
            {/* Campo de E-mail */}
            <TextField
              label="E-MAIL"
              placeholder="seuemail@exemplo.com"
              autoCapitalize="none"        // Impede a primeira letra de ficar maiúscula
              keyboardType="email-address" // Teclado otimizado com @ e .
              autoComplete="email"         // Sugestão de preenchimento automático do sistema
              value={email}
              onChangeText={setEmail}
            />

            {/* Campo de Senha protegido */}
            <TextField
              label="SENHA"
              placeholder="••••••••"
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
              style={{ marginTop: 4 }}
            />
          </View>

          {/* Links de Rodapé */}
          <View style={styles.footerLinks}>
            <Text style={styles.footerText}>
              Não tem conta?{' '}
              <Text style={styles.linkBold} onPress={() => navigation.navigate('SignUp')}>
                Cadastre-se
              </Text>
            </Text>

            <Text
              style={styles.forgotLink}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              Esqueci minha senha
            </Text>
          </View>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.light },
  container: { flex: 1, justifyContent: 'center', padding: 20, gap: 20 },
  brandHeader: { alignItems: 'center', gap: 6 },
  logoBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 4,
  },
  logoEmoji: { fontSize: 32 },
  brandTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.dark },
  brandSubtitle: { fontSize: 13, color: theme.colors.greyDark },
  loginCard: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#ffffff',
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.dark },
  cardSubtitle: { fontSize: 13, color: theme.colors.greyDark, marginTop: 2, marginBottom: 16 },
  form: { gap: 14 },
  erro: { color: theme.colors.error, fontSize: 13, textAlign: 'center' },
  footerLinks: { alignItems: 'center', marginTop: 18, gap: 8 },
  footerText: { fontSize: 13, color: theme.colors.greyDark },
  linkBold: { color: theme.colors.primary, fontWeight: '700' },
  forgotLink: { fontSize: 12, color: theme.colors.greyDark, textDecorationLine: 'underline' },
});
