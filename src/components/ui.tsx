import { ReactNode } from 'react';
import { theme } from '@/lib/theme';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

/**
 * ============================================================================
 * COMPONENTES BÁSICOS DO REACT NATIVE USADOS AQUI:
 * ============================================================================
 * 
 * 1. <View>:
 *    - O que é: A "caixa" ou "bloco" base do React Native (o <div> do mobile).
 *    - Para que serve: Agrupar elementos, definir layout, cores de fundo e espaçamentos.
 *    - No celular: No iOS vira um `UIView` e no Android um `android.view.ViewGroup`.
 * 
 * 2. <Text>:
 *    - O que é: O único componente capaz de renderizar letras, palavras e textos.
 *    - Para que serve: Exibir títulos, parágrafos, labels.
 *    - REGRA CRÍTICA: Diferente da Web (onde você pode colocar texto dentro de uma <div>),
 *      no React Native é PROIBIDO colocar texto direto na <View>. Todo texto tem que estar
 *      dentro de <Text>, senão o app fecha com erro de tela vermelha (crash).
 * 
 * 3. <ActivityIndicator>:
 *    - O que é: O "ícone de carregamento" (aquela rodinha giratória/spinner).
 *    - Para que serve: Dar feedback visual ao usuário de que algo está carregando (ex: buscando
 *      dados da internet, salvando algo no banco).
 *    - No celular: No iPhone ele renderiza a rodinha clássica cinza/branca da Apple (`UIActivityIndicatorView`),
 *      e no Android renderiza o círculo giratório do Material Design (`ProgressBar`).
 * 
 * 4. <TextInput>:
 *    - O que é: Campo de digitação (o <input> da Web).
 *    - Para que serve: Permitir que o usuário digite texto, email, senhas, números, etc.
 *    - No celular: Ao clicar nele, o sistema operacional abre o teclado virtual do celular automaticamente.
 * 
 * 5. <Pressable>:
 *    - O que é: Componente moderno para detectar toques e gestos do dedo na tela.
 *    - Para que serve: Criar botões, cards clicáveis ou qualquer área interativa.
 *    - Por que usamos ele: Ele nos dá acesso instantâneo ao estado `pressed` (se o dedo está
 *      encostado na tela naquele milissegundo), facilitando criar animações e efeitos de clique.
 * 
 * 6. StyleSheet:
 *    - O que é: O motor de estilos do React Native.
 *    - Para que serve: Criar regras de design (cores, margens, tamanhos) de forma organizada
 *      e de alta performance.
 */

/**
 * ============================================================================
 * 1. COMPONENTE: Card (Contêiner em Cartão Branco Arredondado)
 * ============================================================================
 * 
 * Componente base de agrupamento visual com fundo branco, cantos arredondados
 * e sombra sutil para destacar blocos de informação sobre o fundo cinza-claro.
 */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/**
 * ============================================================================
 * 2. COMPONENTE: BookIcon (Ícone Visual de Capa de Livro)
 * ============================================================================
 * 
 * Componente reutilizável para exibir a miniatura de livro com lombada azul e
 * ícone central, garantindo consistência visual em todas as telas da livraria.
 */
export function BookIcon({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const boxSize = isSm ? 52 : isLg ? 160 : 74;
  const emojiSize = isSm ? 22 : isLg ? 64 : 32;

  return (
    <View style={[styles.bookBox, { width: boxSize, height: boxSize }]}>
      <View style={styles.bookSpine} />
      <Text style={{ fontSize: emojiSize }}>📖</Text>
    </View>
  );
}

/**
 * ============================================================================
 * 3. COMPONENTE: TextField (Campo de Entrada de Texto Customizado)
 * ============================================================================
 * 
 * Este componente encapsula o <TextInput> padrão do React Native, já aplicando
 * a nossa borda arredondada, cor de texto e cor do placeholder padrão.
 * 
 * @param props - Todas as propriedades normais que um TextInput aceita:
 *   - `value`: O texto que está escrito no campo.
 *   - `onChangeText`: Função chamada a cada letra que o usuário digita.
 *   - `placeholder`: O texto de dica (ex: "Digite seu email...").
 *   - `secureTextEntry`: Se for true, esconde os caracteres como bolinhas (para senhas).
 *   - `keyboardType`: Tipo de teclado (ex: 'numeric', 'email-address').
 * 
 * O `{...props}` (Spread Operator) repassa automaticamente qualquer uma dessas
 * propriedades que quem chamar o `<TextField />` decidir usar.
 */
export function TextField({ label, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={styles.fieldGroup}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput
        placeholderTextColor="#94a3b8" // Cor cinza suave para a dica/placeholder
        style={styles.input}           // Aplica nossa formatação visual pré-definida
        {...props}                     // Repassa value, onChangeText, etc.
      />
    </View>
  );
}

/**
 * ============================================================================
 * 4. COMPONENTE: Badge (Etiqueta de Status Colorida em Formato Pílula)
 * ============================================================================
 * 
 * Componente visual compacto utilizado para destacar o status atual de entidades,
 * como os estados do pedido (ex: "Aguardando pagamento", "Pago", "Cancelado").
 * 
 * @param label - Texto descritivo exibido dentro da etiqueta (ex: "Pago").
 * @param color - Cor hexadecimal usada na borda e no texto (ex: "#15803d").
 * 
 * 💡 Destaques de Estilo:
 * - `alignSelf: 'flex-start'`: Impede que a <View> estique ocupando a largura
 *   inteira do container pai (comportamento padrão do flex no mobile).
 * - `borderRadius: 999`: Truque clássico no React Native para arredondar 100%
 *   as pontas laterais, criando o visual de "pílula" (pill badge).
 * - `[styles.badge, { borderColor: color }]`: Combinação de estilo fixo com
 *   estilo dinâmico via array de estilos.
 */
export function Badge({ label, color, variant = 'subtle' }: { label: string; color: string; variant?: 'subtle' | 'outline' }) {
  const isOutline = variant === 'outline';
  return (
    <View
      style={[
        styles.badge,
        isOutline
          ? { borderColor: color, borderWidth: 1 }
          : { backgroundColor: `${color}15`, borderColor: 'transparent' },
      ]}
    >
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

/**
 * ============================================================================
 * 5. COMPONENTE: Center (Centralizador de Conteúdo)
 * ============================================================================
 * 
 * É um componente "embrulho" (Wrapper). Qualquer coisa colocada dentro dele
 * ficará perfeitamente centralizada no meio da tela (tanto vertical quanto horizontal).
 * 
 * - `children: ReactNode`: No React, `children` representa tudo o que você coloca
 *   entre a tag de abertura e fechamento. Exemplo: `<Center><Text>Oi</Text></Center>`.
 *   O tipo `ReactNode` significa: "qualquer elemento React válido (texto, botão, imagem, etc)".
 */
export function Center({ children }: { children: ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

/**
 * ============================================================================
 * 6. COMPONENTE: Loading (Tela de Carregamento)
 * ============================================================================
 * 
 * Usado quando estamos esperando uma requisição (ex: buscando produtos da API).
 * Ele mostra a rodinha girando (`ActivityIndicator`) e uma mensagem embaixo.
 * 
 * - `label = 'Carregando…'`: Parâmetro com valor padrão. Se quem chamou não passar
 *   nenhum texto (`<Loading />`), ele assume 'Carregando…'. Se passar `<Loading label="Buscando produtos..." />`,
 *   ele usa o texto passado.
 */
export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <Center>
      {/* size="large" deixa a rodinha em tamanho grande */}
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </Center>
  );
}

/**
 * ============================================================================
 * 7. COMPONENTE: ErrorState (Tela de Erro com Botão de Recarregar)
 * ============================================================================
 * 
 * Usado quando uma requisição falha (ex: sem internet, servidor caiu).
 * 
 * - `message`: Texto explicando o que deu errado.
 * - `onRetry?`: Uma função opcional (indicada pelo `?`). Se quem usou o componente
 *   passar uma função para tentar de novo, o botão "Tentar de novo" aparece na tela.
 * 
 * - `{onRetry && ( ... )}`: Padrão "Curto-Circuito" do JavaScript:
 *   Se `onRetry` existir (for verdadeiro), o React renderiza o que está entre parênteses.
 *   Se for `undefined`, o React não renderiza nada no lugar do botão.
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Center>
      <Text style={styles.errorTitle}>Algo deu errado</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry && (
        <View style={{ marginTop: 12 }}>
          <Button label="Tentar de novo" onPress={onRetry} />
        </View>
      )}
    </Center>
  );
}

/**
 * ============================================================================
 * 8. COMPONENTE: Button (Botão Clicável Customizado)
 * ============================================================================
 * 
 * - `label`: O texto que aparece escrito dentro do botão.
 * - `onPress`: A função que será disparada quando o usuário der um toque no botão.
 * - `disabled?`: Se for true, o botão fica desativado e não responde a toques.
 * - `variant`: Define a aparência do botão:
 *      * 'primary' (padrão): Fundo azul sólido com texto branco.
 *      * 'secondary': Fundo verde/menta suave com texto escuro.
 *      * 'ghost': Fundo transparente com borda cinza e texto escuro.
 *      * 'danger': Fundo ou texto em tom de erro.
 * 
 * - `style={({ pressed }) => [ ... ]}`:
 *   O Pressable recebe uma função de estilo. O React Native nos entrega o booleano `pressed`.
 *   Quando o dedo do usuário encosta no botão, `pressed` se torna `true`.
 *   Usamos isso para aplicar `styles.btnDim` (que diminui a opacidade para 0.55),
 *   dando um retorno visual instantâneo ("efeito de clique") para o usuário!
 */
export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        (disabled || pressed) && styles.btnDim,
        style,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          variant === 'primary' && styles.btnTextPrimary,
          variant === 'secondary' && styles.btnTextSecondary,
          variant === 'ghost' && styles.btnTextGhost,
          variant === 'danger' && styles.btnTextDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * ============================================================================
 * FOLHA DE ESTILOS (StyleSheet)
 * ============================================================================
 * 
 * Regras cruciais de CSS no React Native:
 * 1. NÃO USAMOS UNIDADES (px, %, rem): Números soltos como `24` ou `12` são
 *    convertidos automaticamente para a densidade de tela do celular (DP).
 * 2. O Flexbox é a base de tudo: No mobile, os elementos são empilhados verticalmente
 *    por padrão (`flexDirection: 'column'`).
 */
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.greyLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bookBox: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: theme.colors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: theme.colors.light,
  },
  muted: {
    color: theme.colors.greyDark,
    textAlign: 'center',
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.error,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.greyDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.greyLight,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.dark,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  btnSecondary: {
    backgroundColor: theme.colors.mintLight,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.greyLight,
  },
  btnDanger: {
    backgroundColor: theme.colors.errorLight,
  },
  btnDim: {
    opacity: 0.65,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  btnTextPrimary: {
    color: '#ffffff',
  },
  btnTextSecondary: {
    color: theme.colors.mintDark,
  },
  btnTextGhost: {
    color: theme.colors.dark,
  },
  btnTextDanger: {
    color: theme.colors.error,
  },
});
