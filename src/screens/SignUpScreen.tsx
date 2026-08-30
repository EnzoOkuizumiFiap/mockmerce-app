import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSession } from '@/session/session';
import { Button, Card, TextField } from '@/components/ui';
import type { AuthStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';
import { theme } from '@/lib/theme';

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
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>📖</Text>
          </View>
          <Text style={styles.brandTitle}>{theme.storeName}</Text>
          <Text style={styles.brandSubtitle}>Crie sua conta para começar</Text>
        </View>

        {/* Card de Cadastro */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Criar Conta</Text>
          <Text style={styles.cardSubtitle}>Preencha seus dados para acessar o acervo</Text>

          <View style={styles.form}>
            {/* Campo de Nome: autoCapitalize="words" deixa a 1ª letra de cada nome maiúscula */}
            <TextField
              label="NOME COMPLETO"
              placeholder="Seu nome"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />

            {/* Campo de E-mail */}
            <TextField
              label="E-MAIL"
              placeholder="seuemail@exemplo.com"
              autoCapitalize="none"        // Impede primeira letra maiúscula no e-mail
              keyboardType="email-address" // Teclado mobile específico para e-mail
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />

            {/* Campo de Senha */}
            <TextField
              label="SENHA"
              placeholder="Mínimo 6 caracteres"
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
              style={{ marginTop: 4 }}
            />
          </View>

          {/* Link para voltar à tela de Login */}
          <View style={styles.footerLinks}>
            <Text style={styles.footerText}>
              Já tem conta?{' '}
              <Text style={styles.linkBold} onPress={() => navigation.navigate('SignIn')}>
                Entrar
              </Text>
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
  card: { padding: 22, borderRadius: 24, backgroundColor: '#ffffff' },
  cardTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.dark },
  cardSubtitle: { fontSize: 13, color: theme.colors.greyDark, marginTop: 2, marginBottom: 16 },
  form: { gap: 14 },
  erro: { color: theme.colors.error, fontSize: 13, textAlign: 'center' },
  footerLinks: { alignItems: 'center', marginTop: 18 },
  footerText: { fontSize: 13, color: theme.colors.greyDark },
  linkBold: { color: theme.colors.primary, fontWeight: '700' },
});
