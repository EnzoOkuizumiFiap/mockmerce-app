# Loja da Turma — app do ALUNO (mockmerce-app)

App mobile em React Native + TypeScript + TanStack Query + Axios para a disciplina de Mobile Development.

---

## 📌 Semana 3 · Checkout e Pedidos (Respostas do Diário de Aula)

### Por que a query de pedidos (`useOrders`) precisa de `enabled` ligado ao login?
A rota `GET /orders` é restrita e exige o cabeçalho `Authorization: Bearer <token>`. O `enabled: isLoggedIn` impede que o TanStack Query dispare requisições automáticas enquanto o usuário estiver deslogado ou com a sessão em carregamento, evitando erros desnecessários de `401 Unauthorized`.
