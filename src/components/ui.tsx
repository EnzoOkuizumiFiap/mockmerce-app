import { ReactNode } from 'react';
import { theme } from '@/lib/theme';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps
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
 * 1. COMPONENTE: TextField (Campo de Entrada de Texto Customizado)
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
export function TextField(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#9ca3af" // Cor cinza suave para a dica/placeholder
      style={styles.input}           // Aplica nossa formatação visual pré-definida
      {...props}                     // Repassa value, onChangeText, etc.
    />
  );
}


/**
 * ============================================================================
 * 2. COMPONENTE: Badge (Etiqueta de Status Colorida em Formato Pílula)
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
export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

/**
 * ============================================================================
 * 3. COMPONENTE: Center (Centralizador de Conteúdo)
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
 * 4. COMPONENTE: Loading (Tela de Carregamento)
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
      <ActivityIndicator size="large" color={theme.colors.dark} />
      <Text style={styles.muted}>{label}</Text>
    </Center>
  );
}

/**
 * ============================================================================
 * 5. COMPONENTE: ErrorState (Tela de Erro com Botão de Recarregar)
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
        <Button label="Tentar de novo" onPress={onRetry} />
      )}
    </Center>
  );
}

/**
 * ============================================================================
 * 6. COMPONENTE: Button (Botão Clicável Customizado)
 * ============================================================================
 * 
 * - `label`: O texto que aparece escrito dentro do botão.
 * - `onPress`: A função que será disparada quando o usuário der um toque no botão.
 * - `disabled?`: Se for true, o botão fica desativado e não responde a toques.
 * - `variant`: Define a aparência do botão:
 *      * 'primary' (padrão): Fundo preto sólido com texto branco.
 *      * 'ghost': Fundo transparente com borda cinza e texto preto.
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
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,                                 // 1. Estilo base (tamanho, formato)
        variant === 'ghost' && styles.btnGhost,     // 2. Se for ghost, aplica fundo transparente e borda
        (disabled || pressed) && styles.btnDim,     // 3. Se estiver desabilitado ou pressionado, fica meio transparente
      ]}
    >
      <Text style={[styles.btnText, variant === 'ghost' && styles.btnTextGhost]}>
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
  center: {
    flex: 1,                  // Ocupa 100% da altura e largura da tela
    alignItems: 'center',     // Centraliza no sentido horizontal (esquerda <-> direita)
    justifyContent: 'center', // Centraliza no sentido vertical (topo <-> base)
    padding: 24,              // Espaço interno nas bordas para o conteúdo não colar na tela
    gap: 8,                   // Espaço de 8 unidades entre cada elemento filho
  },
  muted: {
    color: '#6b7280',         // Cor cinza neutra
    textAlign: 'center'       // Alinhamento centralizado do texto
  },
  errorTitle: {
    fontSize: 16,             // Tamanho da fonte
    fontWeight: '700',        // Negrito (bold)
    color: theme.colors.error          // Vermelho de alerta de erro
  },
  btn: {
    backgroundColor: theme.colors.primary, // Azul
    borderWidth: 1,                 // Linha de borda com espessura 1
    borderBottomWidth: 4,             // Borda inferior mais grossa para efeito 3D
    borderColor: theme.colors.primaryDark,          // Borda azul escuro
    paddingVertical: 12,        // Espaçamento interno em cima e embaixo
    paddingHorizontal: 16,      // Espaçamento interno nas laterais (esquerda e direita)
    marginHorizontal: 2,        // Margem horizontal para separar de outros elementos
    borderRadius: 10,           // Cantos arredondados
    alignItems: 'center',       // Centraliza o texto no meio do botão
  },
  btnGhost: {
    backgroundColor: 'transparent', // Fundo transparente
    borderWidth: 1,                 // Linha de borda com espessura 1
    borderBottomWidth: 4,             // Borda inferior mais grossa para efeito 3D
    marginHorizontal: 2,        // Margem horizontal para separar de outros elementos
    borderColor: theme.colors.primaryDark          // Borda azul escuro
  },
  btnDim: {
    opacity: 0.55 // Deixa o botão semitransparente (usado quando clicado ou desativado)
  },
  btnText: {
    color: '#fff',       // Texto branco
    fontWeight: '700'    // Negrito
  },
  btnTextGhost: {
    color: theme.colors.dark     // Texto escuro para combinar com o botão transparente
  },
  input: {
    borderWidth: 1,
    borderBottomWidth: 4, // Borda inferior mais grossa para efeito 3D
    borderColor: theme.colors.greyLight,
    borderRadius: 10,
    marginHorizontal: 2,        // Margem horizontal para separar de outros elementos
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.dark,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderBottomWidth: 4,   // Borda inferior mais grossa para efeito 3D
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
