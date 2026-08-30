import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSession } from '@/session/session';
import { forgotPassword, resetPassword } from '@/services/auth';
import { Button, Card, TextField } from '@/components/ui';
import type { AuthStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';
import { theme } from '@/lib/theme';

// Tipagem das propriedades de navegação recebidas pela tela
type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

/**
 * ============================================================================
 * TELA: ForgotPasswordScreen (Recuperação de Senha em 2 Fases)
 * ============================================================================
 * 
 * Como funciona este fluxo?
 * - Fase 1 ('email'): O usuário digita o e-mail e pede o código de recuperação.
 * - Fase 2 ('code'): O usuário digita o código recebido por e-mail + a nova senha.
 *   Ao confirmar com sucesso, ele é autenticado automaticamente (`signIn`).
 */
export function ForgotPasswordScreen({ navigation }: Props) {
  const { signIn } = useSession();

  // Estados de controle do formulário
  const [fase, setFase] = useState<'email' | 'code'>('email'); // Controla qual formulário exibir
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [busy, setBusy] = useState(false);                     // Indica se há requisição em andamento
  const [erro, setErro] = useState<string | null>(null);       // Mensagem de erro da API
  const [aviso, setAviso] = useState<string | null>(null);     // Mensagem de sucesso/instrução

  /**
   * 1. FASE 1: Dispara o envio do código para o e-mail informado
   */
  async function pedirCodigo() {
    setBusy(true);
    setErro(null);
    try {
      // .trim() remove espaços acidentais no início ou fim do texto
      await forgotPassword(email.trim());
      setAviso('Se o e-mail existir, enviamos um código. Confira o e-mail e digite abaixo.');
      setFase('code'); // Avança para a segunda fase do formulário
    } catch (e) {
      setErro((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  /**
   * 2. FASE 2: Valida o código e define a nova senha
   */
  async function redefinir() {
    setBusy(true);
    setErro(null);
    try {
      // 1º: Redefine a senha no backend
      await resetPassword(email.trim(), code.trim(), novaSenha);
      // 2º: Já faz o login imediato com as novas credenciais
      await signIn(email.trim(), novaSenha);
    } catch (e) {
      setErro((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    /**
     * KeyboardAvoidingView:
     * No mobile, quando o teclado abre, ele pode cobrir os inputs.
     * - No iOS: `behavior="padding"` empurra a tela para cima.
     * - No Android: `undefined` (o Android já gerencia o teclado nativamente).
     */
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.container}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🔑</Text>
          </View>
          <Text style={styles.brandTitle}>{theme.storeName}</Text>
          <Text style={styles.brandSubtitle}>Recuperação de Acesso</Text>
        </View>

        {/* Card de Recuperação */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Esqueci minha senha</Text>

          {/* Renderização Condicional: FASE 1 vs FASE 2 */}
          {fase === 'email' ? (
            /* ================= FASE 1: PEDIR CÓDIGO ================= */
            <View style={styles.form}>
              <Text style={styles.cardSubtitle}>Informe seu e-mail cadastrado para receber o código de validação.</Text>
              
              <TextField
                label="E-MAIL"
                placeholder="seuemail@exemplo.com"
                autoCapitalize="none"        // Impede que a primeira letra fique maiúscula
                keyboardType="email-address" // Teclado otimizado para e-mail (com @ e .)
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />

              {erro && <Text style={styles.erro}>{erro}</Text>}

              <Button
                label={busy ? 'Enviando…' : 'Enviar código'}
                onPress={pedirCodigo}
                disabled={busy || !email}
                style={{ marginTop: 4 }}
              />
            </View>
          ) : (
            /* ================= FASE 2: DIGITAR CÓDIGO E NOVA SENHA ================= */
            <View style={styles.form}>
              {aviso && (
                <View style={styles.avisoBox}>
                  <Text style={styles.aviso}>{aviso}</Text>
                </View>
              )}

              <TextField
                label="CÓDIGO RECEBIDO"
                placeholder="Código de 6 dígitos"
                keyboardType="number-pad"    // Abre teclado apenas com números
                value={code}
                onChangeText={setCode}
              />

              <TextField
                label="NOVA SENHA"
                placeholder="Mínimo 6 caracteres"
                secureTextEntry              // Esconde o texto com bolinhas de senha
                value={novaSenha}
                onChangeText={setNovaSenha}
              />

              {erro && <Text style={styles.erro}>{erro}</Text>}

              <Button
                label={busy ? 'Redefinindo…' : 'Redefinir senha'}
                onPress={redefinir}
                disabled={busy || !code || novaSenha.length < 6}
                style={{ marginTop: 4 }}
              />

              <Button label="Reenviar código" variant="ghost" onPress={pedirCodigo} disabled={busy} />
            </View>
          )}

          {/* Link de Retorno */}
          <View style={styles.footerLinks}>
            <Text style={styles.footerText}>
              Lembrou a senha?{' '}
              <Text style={styles.linkBold} onPress={() => navigation.navigate('SignIn')}>
                Voltar ao login
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
  cardSubtitle: { fontSize: 13, color: theme.colors.greyDark, marginTop: 2, marginBottom: 8 },
  form: { gap: 14 },
  avisoBox: {
    backgroundColor: theme.colors.mintLight,
    padding: 10,
    borderRadius: theme.radius.md,
  },
  aviso: { fontSize: 13, color: theme.colors.mintDark, textAlign: 'center', fontWeight: '600' },
  erro: { color: theme.colors.error, fontSize: 13, textAlign: 'center' },
  footerLinks: { alignItems: 'center', marginTop: 18 },
  footerText: { fontSize: 13, color: theme.colors.greyDark },
  linkBold: { color: theme.colors.primary, fontWeight: '700' },
});
