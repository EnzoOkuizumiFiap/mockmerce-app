## Luna Guimarães, CP5: Pontos de Retirada

### Mapa de autoria

| Integrante | Responsabilidades Principais | Arquivos / Módulos Principais |
| :--- | :--- | :--- |
| **Luna Guimarães** | Tela de pontos de retirada (lista ordenada por distância, aviso de "sem posição" com botão de tentar de novo, estados de carregando, erro e vazio: RF-44, RF-45, RF-48) e a loja no mapa (RF-46). | `src/screens/PontosRetiradaScreen.tsx`, `src/services/lojaService.ts`, `src/hooks/useLocalizacaoLoja.ts`, `src/components/MapaPontos.tsx` (só o marcador da loja) |

**Vieram da base do grupo (não são meus):** `src/hooks/usePontosRetirada.ts`, `src/hooks/useLocalizacao.ts`, `src/services/localizacaoService.ts`, `src/components/AvisoLocalizacao.tsx`, `src/components/CartaoPontoRetirada.tsx` e `src/components/SeletorEntrega.tsx` (permissão de localização, RF-43, e escolha da retirada no checkout, RF-47). A minha tela usa esses arquivos.

### Decisões técnicas

1. **Fiquei com o hook de pontos da base do grupo e descartei o meu.** O meu `usePontosRetirada` e o `retiradaService` saíram na junção. O hook do grupo já é usado pelo checkout (RF-47) e tem o parâmetro `habilitado`, que faz o mesmo que o meu `enabled`: o checkout só busca os pontos quando a pessoa escolhe "Retirar na loja". Ele também só busca depois que a localização resolve (concedida, negada ou com erro), então a primeira lista já vem ordenada, sem duas buscas seguidas. Em troca, a lista espera a localização; isso não trava a tela porque o hook de localização desiste do GPS em 10 segundos e vira "erro".
2. **Coordenadas arredondadas a 3 casas na chave do cache.** O GPS varia na 5ª casa decimal e, sem arredondar, cada micro-movimento dispararia uma requisição nova (3 casas são cerca de 100 m). O hook do grupo faz o mesmo.
3. **Localização da loja em um hook separado.** A loja é dado de apoio: se `GET /store/settings` falhar ou a loja não tiver coordenada, a lista e o mapa dos pontos continuam funcionando, só sem o marcador da loja.
4. **Loja com marcador próprio no mapa.** O marcador da loja é verde (`cores.sucesso`, do tema) para não se confundir com os pontos de retirada. O mapa enquadra pontos, loja e a pessoa (se houver posição). O `MapaPontos` ganhou só uma prop opcional, `loja`.
5. **Sem posição, a lista vem em ordem alfabética.** Sem latitude e longitude a API ordena por nome e devolve `distanceKm: null`. A tela mostra o aviso explicando isso e o selo de distância some dos cartões, mas a lista e o mapa continuam.

### Declaração de uso de IA

**Luna de Carvalho Guimarães (CP5):**
> Usei o Claude (Anthropic) para gerar os arquivos de pontos de retirada: o serviço, o hook e a tela, e depois o parâmetro `enabled` do hook, o `lojaService.ts`, o `useLocalizacaoLoja.ts` e o marcador da loja no mapa. O que eu fiz por conta própria: cadastrei os pontos de retirada e a localização da loja no painel, conferi as respostas da API (distâncias de 0,77 / 2,9 / 3,7 km) e rodei o `tsc` para checar os erros. Até agora não fiz alterações manuais no código gerado. Estou estudando os arquivos para conseguir explicar cada um na arguição.
>
> Na junção com a main, usei o Claude de novo. A main já tinha uma versão do hook e da tela de pontos de retirada. Ele comparou as duas, resolveu o conflito ficando com o hook da main, reescreveu a `PontosRetiradaScreen.tsx` sobre os componentes da main e levou o marcador da loja para o `MapaPontos.tsx`. Rodei o `tsc` e o `eslint` nesses arquivos e passaram. O que eu mudei depois de gerar: [PREENCHER: o que você mudou ou testou à mão nesses arquivos; se não mudou nada, escreva isso].

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
   - O que mudou: o dado foi corrigido no painel e o `GET /pickup-points` passou a devolver os campos limpos. A tela não trata isso, a correção foi na fonte.

### O que não funciona (ainda)

- Não testei em aparelho nem em emulador. Conferi só com `tsc`, `eslint` e a API no Swagger.
- Negar a localização, o cenário principal do RF-45, ainda não foi testado em aparelho.
- A escolha da retirada no checkout (RF-47) é do código do grupo; eu não testei de ponta a ponta um pedido de retirada chegando ao painel com o ponto escolhido.