# 📖 Livro Aberto — E-commerce Mobile (Checkpoint 4)

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
  > Usei o Gemini 3.7 flash para comentar/entender todo o código! Agora, eu entendi de fato todo o código? Sim e Nãokkkkkkkkk, ainda preciso melhorar minhas habilidades no REACT e no JS... E também fiquei com preguiça pra ler tudo (Se passou de 3 linhas eu não leioKKKKKKKKK). Bom, quando minhas habilidades estiverem melhores, eu vou ler tudo e entender de fato... Ou não também, provável que eu já tenha esquecido desse projeto. Hm, recomendo ler as obras que cadastramos aí! 

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
