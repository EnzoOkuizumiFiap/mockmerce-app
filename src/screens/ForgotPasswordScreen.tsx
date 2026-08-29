import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSession } from '@/session/session';
import { forgotPassword, resetPassword } from '@/services/auth';
import { Button, TextField } from '@/components/ui';
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
        <Text style={styles.title}>Esqueci minha senha</Text>

        {/* Renderização Condicional: FASE 1 vs FASE 2 */}
        {fase === 'email' ? (
          /* ================= FASE 1: PEDIR CÓDIGO ================= */
          <>
            <Text style={styles.subtitle}>Informe seu e-mail para receber um código.</Text>
            <TextField
              placeholder="email"
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
            />
          </>
        ) : (
          /* ================= FASE 2: DIGITAR CÓDIGO E NOVA SENHA ================= */
          <>
            {aviso && <Text style={styles.aviso}>{aviso}</Text>}
            <TextField
              placeholder="código (6 dígitos)"
              keyboardType="number-pad"    // Abre teclado apenas com números
              value={code}
              onChangeText={setCode}
            />
            <TextField
              placeholder="nova senha (mín. 6 caracteres)"
              secureTextEntry              // Esconde o texto com bolinhas de senha
              value={novaSenha}
              onChangeText={setNovaSenha}
            />
            {erro && <Text style={styles.erro}>{erro}</Text>}
            <Button
              label={busy ? 'Redefinindo…' : 'Redefinir senha'}
              onPress={redefinir}
              disabled={busy || !code || novaSenha.length < 6}
            />

            <Button label="Reenviar código" variant="ghost" onPress={pedirCodigo} disabled={busy} />
          </>
        )}

        {/* Botão de navegação para voltar à tela de Login */}
        <Button label="Voltar ao login" variant="ghost" onPress={() => navigation.navigate('SignIn')} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.dark, textAlign: 'center' },
  subtitle: { fontSize: 14, color: theme.colors.greyDark, textAlign: 'center', marginBottom: 4 },
  aviso: { fontSize: 13, color: theme.colors.success, textAlign: 'center' }, // Verde para mensagem de sucesso
  erro: { color: theme.colors.error, fontSize: 13, textAlign: 'center' },   // Vermelho para mensagem de erro
});
