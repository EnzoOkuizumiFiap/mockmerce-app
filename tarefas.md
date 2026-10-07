# NÃO LEVE 100% A SÉRIO ESSE TAREFAS.MD, pois tem várias partes INCOERENTES!!
# ENTÃO VEJA E MODIFIQUE DE ACORDO COM O REPO DO PROF!! 

# 📋 Relatório Técnico e Plano de Migração: Mockmerce Professor ➔ Livro Aberto

> **Documento Estratégico de Engenharia de Software Mobile**  
> **Origem:** `mockmerce-app-prof` (App Vitrine de Referência — Semanas 1 a 7)  
> **Destino:** `mockmerce-app` (Livro Aberto — Checkpoint 4)  
> **Autores:** Grupo Livro Aberto (Enzo, Gustavo Okada, Luna, Lucas Barros, Milton)  

---

## 🎯 1. Diagnóstico Geral & Comparativo dos Projetos

O app do professor (`mockmerce-app-prof`) foi atualizado até a **Semana 07 (Animações & Microinterações)**, consolidando todas as funcionalidades do semestre. Já o repositório do grupo (`mockmerce-app`) encontra-se no estágio do **Checkpoint 4 (Semanas 1 a 4)**, contemplando Autenticação, Catálogo com Busca, Carrinho com mutações otimistas, Checkout, Pagamentos e Reembolso com máquina de estados, e Favoritos.

### 📊 Matriz Comparativa de Recursos

| Recurso / Domínio | `mockmerce-app` (Atual) | `mockmerce-app-prof` (Referência) | Situação & Necessidade de Ação |
| :--- | :---: | :---: | :--- |
| **Autenticação & Sessão** | ✅ Implementado | ✅ Implementado | **Pronto.** Mantém `SessionProvider`, SecureStore e Interceptors. |
| **Catálogo & Busca** | ✅ Implementado | ✅ Implementado | **Ajustar:** Incluir campos de nota média (`rating`) nos tipos de produto. |
| **Carrinho & Pedidos** | ✅ Implementado | ✅ Implementado | **Ajustar:** Permitir escolher ponto de retirada no Checkout (`pickupPointId`). |
| **Reviews / Avaliações** | ❌ Não existe | ✅ Completo (Semana 5) | **Criar do zero:** Services, hooks, telas, notas e estrelas. |
| **Upload de Mídia (Fotos)** | ❌ Não existe | ✅ Completo (Semana 5) | **Criar do zero:** `FormData`, `POST /uploads` e integração com `ImagePicker`. |
| **Localização GPS** | ❌ Não existe | ✅ Completo (Semana 6) | **Criar do zero:** `expo-location` e gestão de 4 estados de permissão. |
| **Pontos de Retirada & Mapa**| ❌ Não existe | ✅ Completo (Semana 6) | **Criar do zero:** `react-native-maps`, busca ordenada e integração no checkout. |
| **Animações (Reanimated)** | ❌ Não existe | ✅ Completo (Semana 7) | **Criar do zero:** Feedback tátil com mola, preço animado e `FadeIn`. |
| **Push Notifications (FCM)** | ❌ Não existe | ⚠️ Presente no prof | *Opcional/Avançado:* Exige build nativa (`eas build`) e Firebase. |

---

## 📦 2. Dependências & Configurações de Ambiente

O projeto do grupo utiliza **Expo SDK 57**, enquanto o do professor está no SDK 54. **Não faça downgrade do projeto do grupo!** Em vez disso, instale as versões compatíveis com o SDK 57 executando no terminal da pasta `mockmerce-app`:

```bash
npx expo install expo-location react-native-maps expo-image-picker react-native-reanimated
```

### Ajustes de Configuração Necessários:
1. **`babel.config.js`:** Adicionar `'react-native-reanimated/plugin'` ao final da lista de plugins:
   ```javascript
   module.exports = function (api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: [
         'babel-plugin-module-resolver',
         'react-native-reanimated/plugin', // Deve ser sempre o último!
       ],
     };
   };
   ```
2. **`app.json`:** Adicionar os plugins nativos e descrições de permissão para iOS e Android:
   - Permissão de GPS: `"NSLocationWhenInUseUsageDescription": "Precisamos da sua localização para ordenar as lojas e pontos de retirada mais próximos."`
   - Permissão de Galeria: `"NSPhotoLibraryUsageDescription": "Permita o acesso à galeria para anexar fotos às suas avaliações de livros."`

---

## 👥 3. Divisão de Responsabilidades & Plano por Integrante

---

### 🌟 Enzo — Módulo de Reviews & Avaliações de Produtos

O foco do Enzo é toda a esteira de avaliações, desde a checagem se o leitor pode avaliar até a renderização visual das notas e do formulário de review.

#### 📌 Endpoints da API Mockmerce
* `GET /products/:id/reviews`: Lista avaliações paginadas + resumo estatístico (`summary`: média e distribuição de 1 a 5 estrelas).
* `GET /products/:id/reviews/can-review`: Checagem prévia obrigatória (`canReview`, `reason: 'ALREADY_REVIEWED' | 'NOT_PURCHASED'`, `reviewId`).
* `POST /products/:id/reviews`: Envio da avaliação (`rating`, `title`, `comment`, `mediaIds`).
* `PATCH /reviews/:id`: Edição de avaliação existente.
* `DELETE /reviews/:id`: Exclusão da avaliação.

#### 📂 Arquivos a Criar:
1. **`src/types/review.ts`**:
   - `Review`: id, rating, title, comment, images (`{ id, url, mediaId }`), author (`{ name, id }`), verifiedPurchase, isMine, createdAt.
   - `ReviewSummary`: average, count, distribution (`Record<'1'|'2'|'3'|'4'|'5', number>`).
   - `CanReviewResponse`: canReview, reason, message, reviewId.
   - `NewReviewInput`: rating, title, comment, mediaIds.
2. **`src/services/reviews.ts`**:
   - `listReviews(productId, options)`
   - `canReviewProduct(productId)`
   - `createReview(productId, data)`
   - `editReview(reviewId, data)`
   - `deleteReview(reviewId)`
3. **`src/hooks/useReviews.ts`**:
   - Integrar chaves no `queryKeys.ts` (`queryKeys.reviews.byProduct(id)` e `queryKeys.reviews.canReview(id)`).
   - Hook `useReviews(productId)`: Busca avaliações e resumo.
   - Hook `useCanReview(productId)`: `enabled: isLoggedIn` (impede 401 se deslogado).
   - Mutation `useCreateReview(productId)`: Ao concluir com sucesso, dispara a invalidação cirúrgica de:
     - `queryKeys.reviews.byProduct(productId)`
     - `queryKeys.reviews.canReview(productId)`
     - `queryKeys.products.detail(productId)` *(fundamental para a nota média do livro atualizar instantaneamente!)*
4. **`src/components/RatingStars.tsx`**:
   - Componente `Estrelas` (exibição de estrelas cheias `★` e vazias `☆` com acessibilidade).
   - Componente `SeletorEstrelas` (interativo com `hitSlop: 10` para toque fácil).
5. **`src/components/ReviewCard.tsx`**:
   - Card individual: nome do autor mascarado ("Enzo O."), badge verde "Compra verificada", data em pt-BR, estrelas, texto e carrossel de fotos anexadas.
6. **`src/components/ReviewSummary.tsx`**:
   - Nota média grande em destaque (ex: 4.8), estrelas e as 5 barras de distribuição percentual coloridas.
7. **`src/components/ProductReviewsSection.tsx`**:
   - Seção colocada no rodapé da tela de detalhes da obra contendo o resumo, o botão dinâmico ("Avaliar produto", "Você já avaliou" ou "Compre para avaliar") e a lista de comentários.
8. **`src/screens/ReviewScreen.tsx`**:
   - Tela de formulário com nota por estrelas, campo de título opcional, campo de comentário e área para fotos (integrada com a função de upload do Lucas).

#### 🛠️ Arquivos a Modificar:
* **`src/navigation.ts`**: Adicionar rota `Review: { productId: string; productName: string }` em `RootStackParamList`.
* **`App.tsx`**: Registrar `<AppStack.Screen name="Review" component={ReviewScreen} options={{ title: 'Avaliar Livro' }} />`.
* **`src/screens/ProductDetailScreen.tsx`**: Renderizar `<ProductReviewsSection />` e habilitar navegação para `Review`.

---

### 📍 Gustavo Okada — Módulo de Localização & GPS

O foco do Gustavo é garantir o acesso seguro à localização física do aparelho, evitando que a falta de GPS ou a recusa de permissão quebre a aplicação.

#### 📌 Princípio de Engenharia da Aula
> **"A permissão melhora a experiência, mas não decide se o app funciona."**  
> Se o leitor recusar o GPS ou estiver dentro de um prédio sem sinal, o app continua funcionando normalmente, exibindo a lista de pontos por ordem alfabética em vez de distância.

#### 📂 Arquivos a Criar:
1. **`src/types/location.ts`**:
   - `Coordinate`: `{ latitude: number; longitude: number }`.
   - `LocationStatus`: `'obtendo' | 'ok' | 'negada' | 'erro'`.
2. **`src/services/location.ts`**:
   - `listPickupPoints(coord: Coordinate | null, maxKm?: number)`: Chama `GET /pickup-points` passando latitude e longitude como query params opcionais. Se `coord === null`, a API devolve por nome com `distanceKm: null`.
3. **`src/hooks/useLocation.ts`**:
   - Gerencia a permissão com `Location.requestForegroundPermissionsAsync()`.
   - Lê a posição via `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })` (resposta ágil e econômica em bateria).
   - Trata explicitamente os 4 cenários:
     - `obtendo`: enquanto a permissão ou GPS está sendo consultado.
     - `ok`: coordenada capturada com sucesso.
     - `negada`: usuário recusou a permissão.
     - `erro`: permissão concedida, mas o GPS falhou/não respondeu (ex: emulador sem mock ou ambiente fechado).
   - Retorna `{ position, status, retry }`.

#### 🛠️ Integração com os Colegas:
* Entrega a tipagem de coordenadas e o hook `useLocation` para a **Luna**, permitindo que ela construa o mapa e a ordenação de lojas.

---

### 🗺️ Luna — Módulo de Pontos de Retirada, Mapa & Fluxo de Compra

A Luna é responsável pela experiência completa de retirada física dos livros: a visualização das lojas no mapa interativo e a seleção de "Receber em casa" vs "Retirar na loja" durante o checkout.

#### 📌 Integração com a API Mockmerce
* `GET /pickup-points`: Retorna a lista de pontos de retirada com coordenadas, horário de funcionamento e endereço completo.
* `POST /orders/checkout`: Aceita o campo opcional `{ pickupPointId: string }`. Quando enviado, o pedido nasce como retirada e retorna o nó `pickup` preenchido.

#### 📂 Arquivos a Criar:
1. **`src/hooks/usePickupPoints.ts`**:
   - Conecta a localização do Gustavo com o TanStack Query.
   - Chave de cache hierárquica: `['pickup-points', position?.latitude ?? null, position?.longitude ?? null, maxKm ?? null]`.
   - `enabled: statusLocation !== 'obtendo'` (garante que a busca sai imediatamente se o GPS estiver negado/com erro, sem gerar tela de carregamento travada).
2. **`src/screens/PickupPointsScreen.tsx`**:
   - Topo: `<MapView />` (`react-native-maps`) com `initialRegion` focada no leitor ou na loja matriz, exibindo `<Marker />` para cada ponto.
   - `showsUserLocation={statusLocation === 'ok'}`: Mostra a bolinha azul do usuário apenas com permissão concedida.
   - Avisos discretos no topo quando a localização estiver desligada/negada com botão "Tentar novamente".
   - Base: `<FlatList />` com os cartões dos pontos de retirada exibindo nome da livraria, endereço formatado, horário de atendimento e badge `X km de você`.

#### 🛠️ Arquivos a Modificar:
1. **`src/types/api.ts`**:
   - Adicionar o nó `pickup` no tipo `Order`:
     ```typescript
     pickup: {
       id: string;
       name: string;
       hours: string | null;
       coordinate: { latitude: number; longitude: number };
       address: {
         cep: string | null; street: string | null; number: string | null;
         district: string | null; city: string | null; state: string | null;
       };
     } | null;
     ```
2. **`src/services/orders.ts`**:
   - Ajustar `checkout(pickupPointId?: string)` para postar `{ pickupPointId }`.
3. **`src/hooks/useOrderActions.ts`**:
   - Ajustar `useCheckout` para repassar o argumento `pickupPointId`.
4. **`src/screens/CheckoutScreen.tsx`**:
   - Criar botões de alternância: **"Receber em casa"** e **"Retirar na livraria"**.
   - Se escolher retirada, listar as lojas do `usePickupPoints()` permitindo selecionar uma antes de confirmar.
5. **`src/screens/OrderScreen.tsx`**:
   - Se `order.pickup` não for nulo, renderizar o card de retirada com as instruções e endereço da loja onde o livro deve ser retirado.
6. **`src/navigation.ts` & `App.tsx`**:
   - Adicionar rota `PickupPoints: undefined` e registrar tela.

---

### 📷 Lucas Barros — Módulo de Produtos, Imagens & Upload de Mídia

O Lucas cuida do tratamento das imagens do catálogo, enriquecimento dos tipos de produtos e do serviço de envio de arquivos para a API.

#### 📌 Princípio de Engenharia da Aula
> **A regra do Multipart no React Native:**  
> Ao enviar arquivos via `FormData`, **NUNCA** defina o header `'Content-Type': 'multipart/form-data'` manualmente no Axios. Fixar esse header impede a criação do delimitador `boundary`, quebrando o upload no backend com erro silencioso. Utilize `{ 'Content-Type': undefined }`.

#### 📂 Arquivos a Criar:
1. **`src/services/upload.ts`**:
   - Interface `LocalFile`: `{ uri: string; name: string; type: string }`.
   - Interface `UploadedMedia`: `{ id: string; url: string; mimeType: string; sizeBytes: number }`.
   - Função `uploadImage(file: LocalFile, folder?: string)`: Monta `FormData`, remove o Content-Type padrão do cliente e define `timeout: 60000` (60s) para redes lentas.
   - Função utilitária `fileFromUri(uri: string)`: Extrai nome e tipo mime a partir do URI local do aparelho.

#### 🛠️ Arquivos a Modificar:
1. **`src/types/api.ts`**:
   - Atualizar `ProductSummary` adicionando:
     ```typescript
     rating: { average: number; count: number };
     ```
   - Atualizar `Product` (detalhe) adicionando:
     ```typescript
     rating: {
       average: number;
       count: number;
       distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
     };
     ```
2. **`src/screens/ProductsScreen.tsx`**:
   - No card de cada livro da vitrine, renderizar a média de estrelas (`<Estrelas nota={item.rating.average} tamanho={12} />`) ao lado do preço, consumindo a média que já vem da listagem (sem requisições extras).
3. **`src/screens/ProductDetailScreen.tsx`**:
   - No cabeçalho da obra, exibir a média e total de avaliações.
   - Suporte a múltiplas fotos da galeria em carrossel horizontal quando houver.
4. **Integração com o Enzo**:
   - Conectar o seletor `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 })` na tela `ReviewScreen.tsx` com envio instantâneo via `uploadImage`.

---

### 🎨 Milton — Módulo Visual, Design System & Animações Reanimated

O Milton eleva o app para o nível premium da **Semana 07**, implementando animações físicas nativas na thread de UI (Worklets) sem travar a interface e respeitando rigorosamente a identidade visual da **Folha de Marca da Livro Aberto**.

#### 📌 Princípio de Engenharia da Aula
> **Tempo vs Física (Mola):**  
> Se o movimento é causado pelo dedo do usuário (toque, clique), use **mola** (`withSpring`). Se o movimento apenas informa que algo chegou ou sumiu da tela (entrada, fade), use **tempo** (`withTiming`).  
> Animações via `useSharedValue` e `useAnimatedStyle` rodam a 60fps na thread de UI nativa, mesmo que a thread de JavaScript esteja ocupada baixando dados.

#### 📂 Arquivos a Criar:
1. **`src/lib/animations.ts`**:
   - Vocabulário padronizado:
     - `DURATIONS = { fast: 140, normal: 250, slow: 400 }`
     - `TOUCH_SPRING = { damping: 12, stiffness: 220, mass: 0.5 }`
     - `SMOOTH_SPRING = { damping: 18, stiffness: 140, mass: 0.8 }`
     - `PRESSED_SCALE = 0.96`
2. **`src/components/PressableScale.tsx` (ou `Pressionavel.tsx`)**:
   - Componente de toque com microinteração de escala elástica instantânea usando Worklet Reanimated, evitando re-renderizações e garantindo sensação tátil imediata.
3. **`src/components/AnimatedPrice.tsx` (ou `PrecoAnimado.tsx`)**:
   - Componente para a tela de detalhes que reage a alterações no preço unitário, comemorando quedas de preço com pulso de escala e transição de cor para o tom `theme.colors.mintDark` via `interpolateColor`.
4. **`src/components/Avatar.tsx`**:
   - Componente para exibir foto do leitor ou gerar iniciais tipográficas elegantes sobre círculo estilizado nas cores da marca (`theme.colors.primaryLight`).
5. **`src/screens/ProfileScreen.tsx`**:
   - Tela de perfil do leitor contendo Avatar, nome, e-mail, contagem de favoritos salvos, atalhos para "Carrinho" e "Onde Retirar" e botão de Logout.

#### 🛠️ Arquivos a Modificar:
1. **`src/components/ui.tsx`**:
   - Substituir o feedback do botão base `<Button />` para utilizar o novo comportamento `PressableScale`.
2. **`src/screens/ProductDetailScreen.tsx`**:
   - Adicionar transições de entrada escalonadas (`FadeIn` na capa, `FadeInDown.delay(80)` no título e `FadeInDown.delay(140)` no preço) para criar harmonia na hierarquia de leitura da obra.
3. **Refinamento do Tema (`src/lib/theme.ts`)**:
   - Garantir que todos os novos componentes criados pelos colegas consumam rigorosamente os tokens de design da Livro Aberto (Azul Real `#0c74e4`, Menta `#0d9488`, Âmbar `#FF9B1B`, fundos `#f4f7fb`, cantos `radius: 20px`).

---

## 🗺️ 4. Mapa Arquitetural de Arquivos Novos vs Alterados

```
mockmerce-app/
├── package.json                    [ALTERAR] -> Instalar expo-location, react-native-maps, expo-image-picker, react-native-reanimated
├── babel.config.js                 [ALTERAR] -> Adicionar plugin 'react-native-reanimated/plugin'
├── app.json                        [ALTERAR] -> Adicionar permissões de GPS e Galeria de Fotos
├── App.tsx                         [ALTERAR] -> Registrar novas rotas (Review, PickupPoints, Profile)
├── src/
│   ├── navigation.ts               [ALTERAR] -> Adicionar tipagem das novas rotas no RootStackParamList
│   ├── types/
│   │   ├── api.ts                  [ALTERAR] -> Adicionar rating em produtos e pickup em pedidos
│   │   ├── review.ts               [CRIAR]   -> Tipos de avaliações e can-review (Enzo)
│   │   └── location.ts             [CRIAR]   -> Tipos de coordenadas e pontos (Gustavo/Luna)
│   ├── services/
│   │   ├── reviews.ts              [CRIAR]   -> Service de reviews e can-review (Enzo)
│   │   ├── location.ts             [CRIAR]   -> Service de busca de pontos de retirada (Gustavo)
│   │   ├── upload.ts               [CRIAR]   -> Service de upload multipart/boundary (Lucas)
│   │   └── orders.ts               [ALTERAR] -> Suporte a pickupPointId no checkout (Luna)
│   ├── hooks/
│   │   ├── useReviews.ts           [CRIAR]   -> Query e mutações de avaliação (Enzo)
│   │   ├── useLocation.ts          [CRIAR]   -> Hook de leitura e permissão do GPS (Gustavo)
│   │   ├── usePickupPoints.ts      [CRIAR]   -> Hook de listagem de lojas com cache (Luna)
│   │   └── useOrderActions.ts      [ALTERAR] -> Atualização da mutation de checkout (Luna)
│   ├── lib/
│   │   ├── animations.ts           [CRIAR]   -> Vocabulário de molas e durações Reanimated (Milton)
│   │   └── queryKeys.ts            [ALTERAR] -> Adicionar fábricas de keys para reviews e pickupPoints
│   ├── components/
│   │   ├── RatingStars.tsx         [CRIAR]   -> Estrelas de exibição e seletor tátil (Enzo)
│   │   ├── ReviewCard.tsx          [CRIAR]   -> Card de avaliação com fotos e selo de compra (Enzo)
│   │   ├── ReviewSummary.tsx       [CRIAR]   -> Resumo com barras de distribuição 1 a 5 (Enzo)
│   │   ├── ProductReviewsSection.tsx [CRIAR] -> Seção completa embutida no detalhe do livro (Enzo)
│   │   ├── PressableScale.tsx      [CRIAR]   -> Microinteração física de clique com mola (Milton)
│   │   ├── AnimatedPrice.tsx       [CRIAR]   -> Efeito de pulso e cor na troca de preço (Milton)
│   │   ├── Avatar.tsx              [CRIAR]   -> Avatar com foto ou iniciais tipográficas (Milton)
│   │   └── ui.tsx                  [ALTERAR] -> Enriquecimento visual e botões (Milton)
│   └── screens/
│       ├── ReviewScreen.tsx        [CRIAR]   -> Formulário de avaliação de produto (Enzo)
│       ├── PickupPointsScreen.tsx  [CRIAR]   -> Mapa interativo e lista de lojas (Luna)
│       ├── ProfileScreen.tsx       [CRIAR]   -> Tela de perfil com avatar e dados do leitor (Milton)
│       ├── ProductDetailScreen.tsx [ALTERAR] -> Integrar seções de avaliação, preço animado e notas (Enzo/Milton)
│       ├── ProductsScreen.tsx      [ALTERAR] -> Exibir estrelinhas nos cards da vitrine (Lucas)
│       ├── CheckoutScreen.tsx      [ALTERAR] -> Opção de receber em casa vs retirar na loja (Luna)
│       └── OrderScreen.tsx         [ALTERAR] -> Exibir endereço de retirada quando aplicável (Luna)
```

---

## 📅 5. Ordem de Execução Recomendada (Etapas de Trabalho)

1. **Etapa 1 — Preparação do Ambiente:**
   - Instalação dos pacotes via `npx expo install`.
   - Inclusão do plugin do Reanimated em `babel.config.js`.
   - Limpeza do cache do Expo: `npx expo start --clear`.
2. **Etapa 2 — Camada de Dados & Infraestrutura:**
   - **Gustavo:** Criação do `src/hooks/useLocation.ts`.
   - **Lucas:** Criação do `src/services/upload.ts` e atualização das interfaces em `src/types/api.ts`.
   - **Milton:** Criação do vocabulário `src/lib/animations.ts` e do componente `PressableScale.tsx`.
3. **Etapa 3 — Camada de Domínio & Features:**
   - **Enzo:** Implementação do service, hooks e componentes de Avaliações.
   - **Luna:** Criação da tela de mapa `PickupPointsScreen.tsx` e adaptação do Checkout para retirada.
4. **Etapa 4 — Integração Cruzada & Telas:**
   - Enzo acopla o upload do Lucas na tela `ReviewScreen.tsx`.
   - Lucas e Enzo atualizam a exibição de notas na vitrine e detalhes do produto.
   - Luna adiciona o bloco de retirada na tela de pedido (`OrderScreen.tsx`).
   - Milton aplica o `PressableScale`, `AnimatedPrice` e transições `FadeInDown` no app.
5. **Etapa 5 — Verificação & Testes Finais:**
   - Teste de fluxo offline (modo avião com dados em cache).
   - Teste de permissão de GPS negada (verificar se a lista de lojas abre normalmente).
   - Teste de avaliação (confirmar que compras aprovadas liberam a avaliação e invalidam o cache da nota média).
