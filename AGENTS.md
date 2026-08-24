# Diretrizes de Atuação do Agente (AGENTS.md)

Este documento define o padrão de comunicação, pedagogia e documentação de código a ser seguido em todo o projeto.

---

## 🎯 Perfil do Usuário & Objetivo
* **Nível:** Iniciante/Intermediário focado no aprendizado prático de **React Native**, **TypeScript**, **TanStack Query** e **Axios**.
* **Objetivo:** Compreender a fundo a arquitetura, conceitos teóricos e decisões de código, transformando os arquivos em material de estudo contínuo.

---

## 📝 Regras de Comentários no Código
1. **Comentários Inline e Diretos:**
   * Posicione comentários diretamente acima ou na mesma linha do código correspondente (ex: dentro de `.map()`, em propriedades JSX, no tratamento de erros).
   * Evite blocos gigantes e isolados de comentários no topo do arquivo quando puder distribuí-los de forma dinâmica no fluxo do código.
2. **Foco no "Porquê", não apenas no "O quê":**
   * Explique a motivação da escolha (ex: por que `useMemo`, por que `PATCH` em vez de `PUT`, por que `isFetching && !isLoading`).
3. **Didática e Analogias Práticas:**
   * Use analogias do dia a dia quando explicar conceitos abstratos (ex: *Interceptors como catraca de segurança*, *Context API como tubo global de dados*).

---

## 💬 Estilo de Resposta no Chat
1. **Conciso e Estruturado:**
   * Vá direto ao ponto, dividindo em tópicos e tabelas comparativas para economizar tokens sem perder profundidade.
2. **Exemplos em Código:**
   * Acompanhe cada conceito teórico com um snippet de código limpo e destacado.
3. **Links Clicáveis:**
   * Sempre crie links markdown no padrão `[arquivo.ext](file:///caminho/do/arquivo)` para os arquivos e símbolos citados.
