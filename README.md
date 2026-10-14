# 📖 Livro Aberto — E-commerce Mobile (Checkpoint 5: A loja que responde)

> **Aplicativo mobile de e-commerce desenvolvido em React Native, Expo, TypeScript e TanStack Query, conectado ao backend Mockmerce da FIAP.**

---

## 👥 1. Grupo

| Nome Completo | RM |
| :--- | :--- |
| **Enzo Okuizumi Miranda de Souza** | RM561432 |
| **Gustavo Keiji Okada** | RM563428 |
| **Lucas Barros Gouveia** | RM566422 |
| **Luna de Carvalho Guimarães** | RM562290 |
| **Milton Jakson de Sousa Marcelino** | RM564836 |

---

## 🗺️ 2. Mapa de Autoria

| Integrante | Responsabilidades Principais | Arquivos / Módulos Principais |
| :--- | :--- | :--- |
| **Enzo Okuizumi** | Resolução final do bug de valor Null/Undefined no reembolso (invalidação cirúrgica de query keys), Cadastrar cliente final (`POST /auth/register`), Cadastrar produto (`POST /products`), Usar o carrinho e construção do `AGENTS.md` para aprendizado contínuo com IA (Gemini 3.7 Flash). | `src/hooks/useOrderActions.ts`, `src/hooks/useCartMutations.ts`, `src/screens/CartScreen.tsx`, `src/services/auth.ts`, `src/services/products.ts`, `AGENTS.md` |
| **Gustavo Okada** | Resolução parcial do bug do valor Null/Undefined, Tratar pagamento recusado (`simulate: 'decline'`) e Reembolsar um pedido (`POST /store/orders/:id/refund`). | `src/hooks/useOrderActions.ts`, `src/screens/OrderScreen.tsx`, `src/services/orders.ts` |
| **Lucas Barros** | Estilização do app utilizando temas (`theme.ts`), Gerenciar estoque e Criar produto variável no catálogo. | `src/lib/theme.ts` |
| **Luna Guimarães** | Compra ponta a ponta (Checkout seguido de pagamento aprovado), Emitir NF-e e estilização de telas e componentes. | `src/screens/CheckoutScreen.tsx`, `src/screens/OrderScreen.tsx`, `src/hooks/useOrders.ts`, `src/components/ui.tsx` |
| **Milton Marcelino** | Cotar frete, Configurar um webhook e Receber um webhook. | |

---

## 🚀 3. Como Rodar o Projeto

### Pré-requisitos
* Node.js (v18+)
* Gerenciador de pacotes npm
* Expo Go instalado no smartphone (Android/iOS) ou Emulador configurado

### Passo a Passo
```bash
# 1. Clone o repositório
git clone https://github.com/EnzoOkuizumiFiap/mockmerce-app.git

# 2. Acesse a pasta do projeto
cd mockmerce-app

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env

# 5. Inicie o servidor do Expo
npx expo start
```

---

## 🔑 4. Acesso à Loja (Configuração do `.env`)

Preencha o arquivo `.env` com as credenciais oficiais da loja do grupo:

```env
EXPO_PUBLIC_API_URL=https://api.mockmerce.com.br
EXPO_PUBLIC_API_KEY=sk_live_8c436cb3d565595b1d7c4d3f67d1a84742c63a05513b6ff2
EXPO_PUBLIC_STUDENT_RM=RM561432
```

---

## 👤 5. Credenciais de Teste

Para avaliação do corretor, utilize o usuário de teste já registrado na nossa loja:

* **E-mail:** `testesupremo@gmail.com`
* **Senha:** `123@mudar`

---

## ⚙️ 6. Decisões Técnicas de Engenharia

1. **Arquitetura de Sessão Global e Interceptors Bidirecionais do Axios (`aa5347c` / `edb6450`):**
   * *Decisão:* Gerenciamento de sessão via React Context API (`SessionProvider`) com `useMemo` para evitar re-renderizações, integrado a Interceptors de Request e Response no Axios (`src/services/http.ts`).
   * *Motivo:* O **Request Interceptor** atua como uma "catraca de saída", injetando `Authorization: Bearer <token>` em todas as requisições autenticadas. O **Response Interceptor** atua na entrada, interceptando falhas (400, 401, 404, 409, 422, timeout `ECONNABORTED` e queda de rede) e normalizando-os na classe padronizada `ApiError`, evitando que componentes da UI precisem lidar com erros crus do Axios.

2. **Fábrica Centralizada de Query Keys com Tuplas `as const` (`16deb6e` / `b4cacfb`):**
   * *Decisão:* Implementação do padrão *Query Key Factory* no arquivo `src/lib/queryKeys.ts`, organizando chaves hierárquicas (`queryKeys.orders.list()`, `queryKeys.orders.detail(id)`, `queryKeys.cart.all`).
   * *Motivo:* O TanStack Query depende da correspondência exata de arrays para sincronizar o cache. O uso de funções tipadas com `as const` elimina erros de digitação silenciosos (como `['orders', id]` vs `['orders', 'detail', id]`) e viabiliza a invalidação cirúrgica de cache.

3. **Estratégia Híbrida de Mutações: Otimista no Carrinho vs. Pessimista em Pedidos (`b06cc24` / `973ae4b`):**
   * *Decisão:* No carrinho (`src/hooks/useCartMutations.ts`), utilizamos *Optimistic Updates* com ciclo de 4 etapas (`cancelQueries`, snapshot de rollback `context.previousCart`, recálculo local com `.reduce()` e sincronização em `onSettled`). Em contrapartida, em Checkout, Pagamento e Reembolso (`src/hooks/useOrderActions.ts`), não usamos atualização otimista.
   * *Motivo:* No carrinho, o feedback tátil instantâneo (+ / -) melhora a experiência móvel com risco mínimo de inconsistência. Em compras e pagamentos, lidamos com reserva de estoque físico e transações financeiras, onde é indispensável aguardar a resposta definitiva do servidor.

4. **Invalidação Cirúrgica vs. `setQueryData` no Reembolso de Pedidos (`7bb81fa` / `25d642b`):**
   * *Decisão:* Ao processar o reembolso (`useRefundOrder`), optamos por invalidar o cache da query (`invalidateQueries({ queryKey: queryKeys.orders.detail(id) })`) em vez de substituir o cache diretamente pelo retorno do `POST` (`setQueryData`).
   * *Motivo:* Endpoints de mutação `POST /store/orders/:id/refund` frequentemente devolvem payloads resumidos contendo apenas a transição de status, sem a árvore recalculada de subtotais de itens. A invalidação força o TanStack Query a disparar um `GET /orders/:id` limpo, garantindo dados 100% íntegros do banco de dados.

5. **Design Tokens e Sistema de Temas Centralizado (`a8a2b57` / `aa07946`):**
   * *Decisão:* Criação de um módulo centralizador de tokens de design (`src/lib/theme.ts`) que exporta a paleta de cores (`primary`, `primaryDark`, `secondary`, `accent`, `error`, `success`) e identidade visual consumida por todas as telas e componentes da aplicação.
   * *Motivo:* Elimina o uso de valores hexadecimais *hardcoded* espalhados pelos arquivos `StyleSheet.create`, garantindo harmonia visual rigorosa, facilidade de manutenção e cumprimento dos requisitos de identidade visual própria (RF-30 e RF-32).

6. **Navegação Condicional Declarativa e Proteção de Rotas (`d47ea3d`):**
   * *Decisão:* Configuração do `RootNavigator` em `App.tsx` alternando condicionalmente entre as pilhas `isLoggedIn ? <AppFlow /> : <AuthFlow />` com `NavigationContainer`.
   * *Motivo:* Elimina a necessidade de código imperativo de redirecionamento em cada tela. Destrói o histórico de telas de autenticação após o login (impedindo que o usuário retorne ao login pelo botão físico "Voltar" do Android) e protege nativamente todas as telas comerciais contra acesso não autenticado.

---

## 🎯 7. Decisões de Produto

* **Conceito da Loja:** A **Livro Aberto** é uma livraria e sebo digital voltada para o público jovem leitor e entusiasta de cultura pop, mangás, light novels e literatura épica.
* **Público-Alvo:** Jovens e estudantes que buscam títulos selecionados, clássicos e obras importadas com experiência de compra rápida e descomplicada.
* **Escolha das Telas e Fluxos:**
  * Vitrine com busca em tempo real no servidor por `?search=`.
  * Detalhes do produto com seleção intuitiva de variantes (edições, formatos).
  * Carrinho ágil com controle visual de quantidade.
  * Linha do tempo interativa no detalhe do pedido para acompanhamento de cada transição de status (Pending ➔ Paid ➔ Refunded).

---

## 🤖 8. Declaração do Uso de Inteligência Artificial

### Relatos Individuais sobre o Uso de IA

**Enzo Okuizumi:**
  > Bom, usei a IA mais pra refatorar algumas partes do código e me ajudar a conectar com o Firebase (Por incrível que pareça foi a parte fácil), com o Maps (ESSA MERDA NÃO FUNCIONAVA!! Tive que ATIVAR O MAPS NAS CONFIGS DO GOOGLE CLOUD PRA LIBERAR ESSA PUTARIA) e também alguns ajustes no código (Só alguns poucos erros de lint e tals)... No mais é isso, espero que goste das capas dos livros que adicionei aí kk (São ótimas obraskk)

**Gustavo Keiji Okada:**
  > No máximo verifiquei uma ou outra dúvida por meio da IA. Porém o código em si, foi mais baseado em materiais passados e aulas passadas. O bug inclusive que foi resolvido foi algo que foi um erro bem besta na realidade. Ainda preciso melhorar bastante meu conhecimento de REACT em si.

**Lucas Barros Gouveia:**
  > Não utilizei IA, mas usei de tecnicas de projetos anteriores e códigos meus e de meus colegas.

**Luna de Carvalho Guimarães:**
> Usei a IA para esclarecer dúvidas técnicas, organizar melhor o código para deixá-lo mais limpo e me auxiliar no refinamento da estilização das telas do app.

**Milton Jakson de Sousa Marcelino:**
  > Usei a IA para auxiliar a construir algumas partes referente ao webhook e cotar frete e explicar o código, modifiquei algumas telas referente ao cotar frete.

---

## 🐞 9. Diário de Erro

### Enzo Okuizumi
1. **O que apareceu:** A tela de pedidos realizava um refetch global desnecessário de todas as queries ao invalidar o cache após o reembolso.
2. **Como investigou:** Inspecionou o hook `useOrderActions.ts` e comparou a query key manual `['orders']` com as chaves geradas em `queryKeys.ts`.
3. **Qual era a causa:** A invalidação estava genérica (`['orders']`) e a chave específica do detalhe (`['orders', id]`) não continha o segmento `'detail'`.
4. **O que mudou para resolver:** Substituiu as strings manuais pelas funções da fábrica `queryKeys.orders.detail(id)`, `orders.list()` e `orders.timeline(id)` no commit `25d642b`.

### Gustavo Keiji Okada
1. **O que apareceu:** Ao clicar em reembolsar, o status do pedido atualizava instantaneamente na tela para "Reembolsado", mas o valor do item ficava com erro visual (`R$ NaN,undefined`).
2. **Como investigou:** Analisou o hook `useRefundOrder` e percebeu que o app tentava atualizar a tela diretamente com o payload retornado pelo `POST /refund`.
3. **Qual era a causa:** A resposta do `POST` confirmava a mudança de status, mas não retornava a árvore completa de itens com seus subtotais calculados, deixando o campo como `undefined`.
4. **O que mudou para resolver:** Trocou a atualização direta (`setQueryData`) pela invalidação de cache (`invalidateQueries`), forçando o app a buscar a consulta completa do pedido (`GET /orders/:id`) no commit `7bb81fa`.

### Lucas Barros Gouveia
1. **O que apareceu:** Cores e tamanhos de fonte destoavam entre as telas de listagem, carrinho e detalhes ao navegar pelo app.
2. **Como investigou:** Mapeou os arquivos `StyleSheet.create` de cada tela e identificou múltiplos valores hexadecimais *hardcoded*.
3. **Qual era a causa:** Telas antigas herdadas da fase inicial não utilizavam os tokens definidos em `theme.ts`.
4. **O que mudou para resolver:** Refatorou os componentes e telas para consumir exclusivamente o objeto de design tokens `theme.colors` nos commits `a8a2b57` e `aa07946`.

---

## ⚠️ 10. Limitações Conhecidas

1. **Simulação de Gateway de Pagamento:**
   * Em conformidade com o edital do projeto acadêmico, o fluxo de pagamento opera em modo simulado através do parâmetro `simulate: 'approve' | 'decline'`, não realizando cobrança real em operadoras de cartão.
2. **Dependência de Conexão Ativa no Primeiro Boot:**
   * Embora o cache do TanStack Query mantenha dados em memória durante o uso, a autenticação inicial e a primeira carga de produtos requerem conexão à internet para sincronização com a API central da FIAP.
3. **Push Remoto no Emulador/Ambiente:**
   * Por exigência da arquitetura nativa do Firebase FCM e do SDK 54/57 da Expo, o push remoto não funciona no Expo Go genérico. Exige o build de desenvolvimento gerado (`npx expo run:android`) em aparelho físico ou emulador com imagem Google Play Store.

---

## 🔔 11. Notificações: Escolha do Caminho A (Push Real via Firebase FCM)

Para o Checkpoint 5, o grupo optou pelo **Caminho A: Push Real via FCM (+5 pontos de bônus)**:

* **Por que o Caminho A:** Optamos pelo transporte real de notificações para reproduzir a arquitetura completa de produção. O backend da FIAP se comunica diretamente com a API do Google Firebase (FCM v1) e despacha a mensagem de queda de preço para os aparelhos que salvaram aquele produto nos favoritos.
* **Credenciais no Painel:** A chave privada da Conta de Serviço do Firebase (`firebase-adminsdk-fbsvc@mockmerce.iam.gserviceaccount.com`) foi autenticada no painel web da turma (`aluno-admin-web`) em **Push → Credencial**, permitindo que o servidor da FIAP autentique com o Google sem expor nenhuma chave secreta no repositório.
* **Ciclo de Registro do Aparelho (RF-57):**
  * O app obtém o token nativo do FCM via `Notifications.getDevicePushTokenAsync()`.
  * Ao fazer login ou abrir o app, o token é registrado em `POST /customers/me/devices`.
  * No logout, o aparelho é imediatamente removido via `DELETE /customers/me/devices/:token` **antes** de apagar o token de autenticação local da sessão, garantindo que usuários que saíram da conta não recebam notificações da conta anterior.
* **Deep Linking (RF-59):** O toque na notificação é capturado tanto em primeiro/segundo plano quanto em cold start (`Notifications.getLastNotificationResponseAsync()`), navegando instantaneamente para a tela do produto através do payload `data.produtoId`.
* **Degradação Elegante (RF-60):** Caso a permissão seja negada ou o dispositivo não possua Google Play Services, o app continua 100% funcional, e a tela de Perfil explica o estado com clareza.

---

## 🎬 12. Defesa do Movimento e Acessibilidade (RF-49 a RF-55 e RF-62)

O design de movimento do app segue uma disciplina estrita de física e intencionalidade: **o movimento nunca é mero enfeite, ele serve como confirmação e feedback de ações**.

### 1. Vocabulário Centralizado (`src/lib/animacoes.ts` - RF-62)
Todas as durações, curvas e molas estão centralizadas no arquivo único `src/lib/animacoes.ts`:
* `DURACAO.rapida` (140ms): Microinterações táteis de toque.
* `DURACAO.media` (250ms): Transições de estado e entrada de conteúdo.
* `MOLA_TOQUE`: Mola rápida (`damping: 12, stiffness: 220, mass: 0.5`) para sensação de toque responsivo.
* `MOLA_SUAVE`: Mola amortecida para acomodação de layouts.

### 2. Animações Mantidas e Critérios
* **Resposta ao Toque com Mola (`<Pressionavel />` - RF-49):** Botões e cards utilizam `useSharedValue` e `useAnimatedStyle` na UI thread, encolhendo suavemente para `0.96` ao tocar com mola física (`MOLA_TOQUE`). Isso confere resposta tátil instantânea e evita toques múltiplos acidentais.
* **Confirmação sem Navegação (`<BotaoFavorito />` - RF-50):** Salvar um livro na estante não navega nem abre alertas intrusivos. O botão executa um pulo elástico (`withSequence` com escala `1.35` e retorno com mola) apenas no momento da adição, confirmando a persistência com clareza.
* **Entrada Escalonada com Teto (`<CardProduto />` - RF-51):** Os itens entram com `FadeInDown` escalonados a cada 40ms, com teto estrito de 300ms (`ATRASO_MAXIMO`). Isso cria uma sensação harmoniosa de cascata sem fazer o usuário esperar cards distantes da lista.
* **Saída e Acomodação em Listas (`<CardProduto />` - RF-52):** Ao remover um livro da estante, o card sai deslizando para a direita com `FadeOutRight` (200ms), enquanto os cards restantes se reorganizam suavemente com `LinearTransition.springify()`.
* **Sinal de Vida no Carregamento (`<EstadoCarregando />` - RF-53):** Além do `ActivityIndicator` nativo acessível, o texto informativo pulsa sua opacidade suavemente entre `0.35` e `1.0` a cada 700ms (`withRepeat` infinito), assegurando ao usuário que o processo está vivo.

### 3. Animações Cortadas (Evitadas) e o Critério
Em respeito à boa engenharia e à usabilidade do leitor, diversas animações foram deliberadamente cortadas:
* **Transições de Telas com Giros/Zoom 3D:** Cortadas. Transições espalhafatosas adicionam latência artificial entre telas e causam enjoo visual. Mantivemos as transições nativas do React Navigation.
* **Deslocamento na Imagem de Capa do Detalhe:** Cortado. A capa é o elemento focal principal da tela; aplicar `SlideIn` ou deslocamento vertical em elementos grandes atrai atenção excessiva desnecessária. Optou-se por um `FadeIn` simples e discreto de 300ms.
* **Escalonamento Infinito em FlatLists:** Cortado. Sem o teto de 300ms (`ATRASO_MAXIMO`), um card na 30ª posição demoraria mais de 1,2 segundo para surgir na tela durante a rolagem rápida.
* **Animação ao Desfavoritar:** Cortada. A remoção de um item não é um evento comemorativo; o pulo de escala só ocorre ao favoritar.
* **Spinners e Animações Pesadas de JS Thread:** Cortados em favor de worklets na UI thread (Reanimated 4) e componentes nativos, garantindo 60/120 FPS constantes mesmo sob carga de rede.

### 4. Acessibilidade e Constante de Desligamento (RF-54 e RF-55)
* **Constante Global de Código (RF-55):** Definimos a constante `export const ANIMACOES_ATIVADAS = true` em `src/lib/animacoes.ts` para conformidade estrita com o critério de avaliação de código.
* **Controle em Tempo de Execução no Perfil (Linha 240 do Checklist):** Adicionamos um controle elegante no perfil (`<CartaoAnimacoes />`) com um Switch para ligar/desligar todas as animações dinamicamente no app, facilitando a demonstração sem exigir alteração de código ou rebuild.
* **Reduzir Movimento do Sistema (RF-54):** O aplicativo escuta `AccessibilityInfo.isReduceMotionEnabled()` e o evento `reduceMotionChanged`. Quando o usuário ativa a opção no sistema operacional, o movimento é desativado automaticamente.
* **Comportamento sem Animações (Feedback Preservado):** Quando as animações estão desligadas (seja pela constante, pelo switch ou pela acessibilidade do SO):
  * `<Pressionavel />` substitui a mola de encolhimento por uma sutil redução de opacidade (`0.75`) enquanto pressionado, garantindo que nada fique sem feedback tátil.
  * `<BotaoFavorito />` alterna o preenchimento da estrela imediatamente, sem o salto elástico.
  * `<CardProduto />` renderiza sem atraso escalonado e sem transição de mola.
  * `<EstadoCarregando />` mantém o `ActivityIndicator` nativo com texto estático sem pulso de opacidade.
  * O app continua 100% fluido e usável em todas as telas.

---

## 🎨 13. Identidade Própria: Livro Aberto (RF-61)

O aplicativo foi completamente estilizado para homenagear a proposta definida no Checkpoint 1: **uma livraria e sebo digital acolhedor e moderno**.

* **Eliminação de Termos Genéricos:** Todas as ocorrências de nomes de modelo de referência (como "Vitrine", "Produtos genéricos", "comprar produto") foram eliminadas e adaptadas para a semântica literária:
  * Vitrine ➔ **📖 Livro Aberto** (acervo literário).
  * Carrinho ➔ **Sacola de Livros**.
  * Favoritos ➔ **Minha Estante de Leitura**.
  * Avaliação ➔ **Resenhas de Leitores** (com notas, opinião e fotos do exemplar).
* **Design de Capas e Livros:** Os cartões utilizam proporção real de capas de livros (`2:3`), sombra elegante de lombada, fallback de `📖 Sem capa` e identificação destacada de editoras e autores.
* **Design Tokens Literários (`tema.ts`):** Paleta centrada em Azul Royal (`#2563EB`), Azul Noite Profundo (`#1E3A8A`), Papel Suave (`#EFF6FF` e `#F8FAFC`) e Dourado Âmbar (`#F59E0B`).

---

## 📍 14. Localização e Pontos de Retirada (RF-43 a RF-48)

* **Três Desfechos Tratados (RF-43):** Concedida (calcula distâncias), Negada (lista alfabética sem distância) e Concedida sem Posição/Erro (alerta discreto com botão de tentar novamente).
* **Ordenação e Distância (RF-44 e RF-45):** Com o GPS ativo, a rota `GET /pickup-points?latitude=...&longitude=...` retorna os pontos ordenados por proximidade com o badge de quilometragem (`1.58 km de você`).
* **Google Maps Integrado (RF-46):** Integração com `react-native-maps` exibindo os pins dos pontos de retirada e a localização do usuário com marcador azul. As chaves de API da Google Maps Platform são mantidas com segurança fora do repositório através de injeção dinâmica no `app.config.js` via `.env`.
* **Retirada no Checkout (RF-47 e RF-48):** Seleção ágil entre entrega domiciliar e retirada na loja no checkout, salvando o `pickupPointId` no pedido final.

---

## ⭐ 15. Avaliações com Foto e Validação Prévia (RF-35 a RF-42)

* **Média do Produto sem Requisição Extra (RF-35):** Exibida diretamente a partir do objeto `rating` do produto (`GET /products/:id`), sem baixar a lista inteira de avaliações.
* **Consulta Prévia com `can-review` (RF-37):** Antes de abrir o formulário, o app consulta `GET /products/:id/reviews/can-review`. Clientes que não compraram o produto ou que já avaliaram recebem a explicação contextual e amigável da regra de negócio.
* **Upload Multipart com Boundary Dinâmico (RF-39):** O upload da imagem para `POST /uploads` nunca fixa o cabeçalho `Content-Type: multipart/form-data` na mão, permitindo que a camada de rede do React Native gere o boundary correto.
* **Degradação de Permissão de Fotos (RF-40):** Caso a permissão da galeria seja recusada, a avaliação pode ser enviada normalmente apenas com nota e texto.
* **Invalidação Cirúrgica de Cache (RF-41):** Após enviar a avaliação, a mutation invalida tanto a lista de avaliações quanto o cache do produto, atualizando a média de estrelas imediatamente na tela.

---

## 📸 16. Demonstração Visual das Telas e Fluxos

Abaixo estão as capturas de tela registrando a jornada completa do leitor e a conformidade com todos os requisitos do Checkpoint 5:

### 📖 1. Acervo & Detalhe Literário
| 1. Acervo Principal & Busca | 2. Detalhe da Obra & Edição | 3. Resenhas dos Leitores |
| :---: | :---: | :---: |
| <img src="doc/1.%20tela%20principal.png" width="240" alt="1. Tela Principal" /> | <img src="doc/2.%20tela%20do%20livro.png" width="240" alt="2. Detalhe da Obra" /> | <img src="doc/3.%20tela%20do%20livro%20e%20avalia%C3%A7%C3%B5es.png" width="240" alt="3. Avaliações dos Leitores" /> |

### 🛍️ 2. Sacola, Checkout & Pontos de Retirada
| 4. Sacola de Livros | 5. Opções de Entrega / Retirada | 6. Escolha do Ponto no Checkout |
| :---: | :---: | :---: |
| <img src="doc/4.%20tela%20da%20sacola.png" width="240" alt="4. Sacola de Livros" /> | <img src="doc/5.%20tela%20da%20retirada.png" width="240" alt="5. Opções de Retirada" /> | <img src="doc/6.%20tela%20de%20finalizar%20pedido%20e%20retirar.png" width="240" alt="6. Ponto de Retirada no Checkout" /> |

### 💳 3. Pagamento, Confirmação & Avaliação Literária
| 7. Pagamento do Pedido | 8. Confirmação & Rastreio | 9. Publicar Avaliação com Fotos | 10. Resenha Publicada na Obra |
| :---: | :---: | :---: | :---: |
| <img src="doc/7.%20tela%20pagamento.png" width="220" alt="7. Pagamento" /> | <img src="doc/8.%20tela%20pagamento%20sucesso.png" width="220" alt="8. Confirmação" /> | <img src="doc/9.%20tela%20avalia%C3%A7%C3%A3o%20livro.png" width="220" alt="9. Formulário de Avaliação" /> | <img src="doc/10.%20tela%20livro%20mostrando%20avalia%C3%A7%C3%A3o%20inclu%C3%ADda.png" width="220" alt="10. Avaliação Incluída" /> |

### 🗺️ 4. Geolocalização, Estante & Preferências do Sistema
| 11. Mapa de Retirada (Google Maps) | 12. Meu Perfil do Leitor | 13. Minha Estante (Favoritos Offline) | 14. Diagnóstico de Notificações |
| :---: | :---: | :---: | :---: |
| <img src="doc/11.%20tela%20Pontos%20de%20Retirada.png" width="220" alt="11. Pontos de Retirada no Mapa" /> | <img src="doc/12.%20tela%20Perfil.png" width="220" alt="12. Tela de Perfil" /> | <img src="doc/13.%20tela%20Minha%20estante%20Favoritos.png" width="220" alt="13. Estante de Livros Salvos" /> | <img src="doc/14.%20Desativando%20notifica%C3%A7%C3%A3o%20Perfil.png" width="220" alt="14. Ajustes e Notificações" /> |


