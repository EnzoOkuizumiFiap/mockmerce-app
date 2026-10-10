## Luna Guimarães, CP5: Pontos de Retirada

### Mapa de autoria

| Integrante | Responsabilidades Principais | Arquivos / Módulos Principais |
| :--- | :--- | :--- |
| **Luna Guimarães** | Pontos de retirada: lista ordenada por distância, mapa com os pontos e com a loja, aviso de "sem posição" com botão de tentar de novo, estados de carregando, erro e vazio (RF-44, RF-45 aviso, RF-46, RF-48). | `src/services/retiradaService.ts`, `src/hooks/usePontosRetirada.ts`, `src/screens/PontosRetiradaScreen.tsx`, `src/services/lojaService.ts`, `src/hooks/useLocalizacaoLoja.ts` |

### Decisões técnicas

1. **A consulta de pontos não espera o GPS.** O hook usa `useQuery` com `placeholderData: keepPreviousData`. Motivo: se esperasse a localização, um GPS lento ou negado deixaria a tela presa em "Obtendo localização". Assim a lista aparece na hora e, quando a posição chega, a chave do cache muda e a lista é buscada de novo, já ordenada.
2. **Coordenadas arredondadas a 3 casas na chave do cache.** O GPS varia na 5ª casa decimal, e sem o arredondamento cada micro-movimento dispararia uma requisição nova (3 casas são cerca de 100 m).
3. **Parâmetro `enabled` no hook.** Permite que o checkout só busque os pontos quando a pessoa escolher "Retirar na loja". O parâmetro está pronto, mas o checkout ainda não o usa (ver "O que não funciona").
4. **Localização da loja em um hook separado.** A loja é dado de apoio: se `GET /store/settings` falhar ou não tiver coordenada, a lista e o mapa dos pontos continuam funcionando, só sem o marcador da loja.
5. **Sem posição, a lista vem em ordem alfabética.** Sem latitude e longitude a API ordena por nome e devolve `distanceKm: null`. A tela explica isso e oferece "Tentar de novo".

### Declaração de uso de IA

**Luna de Carvalho Guimarães (CP5):**
> Usei o Claude (Anthropic) como apoio nos arquivos de pontos de retirada. [CONFIRMAR: a IA gerou a primeira versão do serviço, do hook e da tela.] Depois, a IA gerou o parâmetro `enabled` do hook, os arquivos `lojaService.ts` e `useLocalizacaoLoja.ts` e a atualização da tela com o marcador da loja. Eu conferi as respostas da API no Swagger, cadastrei os pontos de retirada e a localização da loja no painel e rodei o `tsc` para checar os erros. [PREENCHER: o que eu mudei ou decidi depois de gerar, com minhas palavras.]

### Diário de erro

**Luna Guimarães**

1. **Painel do aluno não abria**
   - O que apareceu: `aluno.mockmerce.com.br` dava `DNS_PROBE_FINISHED_NXDOMAIN`, e sem o painel eu não conseguia cadastrar os pontos.
   - Como investigou: testei o endereço no navegador e procurei como o aluno entra no painel (Swagger e documentação).
   - Causa: o endereço estava errado. O painel é `alun.mockmerce.com.br`.
   - O que mudou: usei o endereço certo e entrei com o RM.

2. **`distanceKm` e `origin` vinham `null`**
   - O que apareceu: `GET /pickup-points` devolvia todos os pontos com `distanceKm: null` e `origin: null`.
   - Como investigou: rodei a rota no Swagger sem parâmetros e li a descrição dela na especificação OpenAPI.
   - Causa: sem `latitude` e `longitude` a API não calcula distância e ordena por nome. Era o comportamento esperado, não um bug.
   - O que mudou: rodei de novo com a posição e vieram 0,77 km, 2,9 km e 3,7 km, em ordem. A tela trata o caso sem posição com aviso (RF-45).

3. **Tabulação no cadastro do ponto**
   - O que apareceu: o JSON da resposta trazia `"\tPinheiros (oeste)"`, `"\t2365"` e `"\tSão Paulo"`.
   - Como investigou: li a resposta crua no Swagger.
   - Causa: um caractere de tabulação entrou ao copiar e colar os dados no formulário do painel.
   - O que mudou: [PREENCHER depois de corrigir: editei o ponto no painel e redigitei os três campos.]

### O que não funciona (ainda)

- **RF-47** (escolher retirada no checkout e enviar `pickupPointId`) não está implementado. Depende da base do app.
- O app ainda não roda na `main`, que está em refatoração. As telas de retirada foram verificadas só pelo `tsc` e pela API no Swagger, e não foram testadas em aparelho ou emulador.
- O `tsc` ainda aponta 3 erros nos meus arquivos, todos de dependências de colegas: `useLocation`, `EstadoCarregando` e `lib/tema`.
- Negar a localização, o cenário principal do RF-45, ainda não foi testado em aparelho.
- A tela do pedido ainda não mostra o ponto de retirada escolhido.