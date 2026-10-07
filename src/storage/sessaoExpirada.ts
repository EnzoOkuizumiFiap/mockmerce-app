/**
 * ---------------------------------------------------------------------------
 * PONTE ENTRE O INTERCEPTOR E O CONTEXTO DE AUTENTICACAO
 * ---------------------------------------------------------------------------
 * PROBLEMA QUE ESTE ARQUIVO RESOLVE
 *
 * Quando a API devolve 401, queremos derrubar a sessao e voltar para o login.
 * Mas quem sabe derrubar a sessao e o AuthContext — e o interceptor esta em
 * client.ts, que e um modulo comum, fora da arvore de componentes.
 *
 *   // NAO FUNCIONA — hooks so podem ser chamados dentro de componentes
 *   api.interceptors.response.use(null, (erro) => {
 *     const { sair } = useAuth();   // erro em tempo de execucao
 *   });
 *
 * A SOLUCAO: uma variavel de modulo que guarda a funcao.
 * O AuthProvider registra o "sair" aqui quando monta; o interceptor chama
 * essa funcao sem precisar saber de onde ela veio.
 *
 * A alternativa seria criar a instancia do Axios dentro de um contexto, o que
 * complica todo o resto do app para resolver um caso so.
 * ---------------------------------------------------------------------------
 */

type AoExpirar = () => Promise<void>;

/**
 * Comeca vazio. Se o interceptor rodar antes de o AuthProvider montar
 * (praticamente impossivel, mas o tipo obriga a tratar), simplesmente nao ha
 * o que fazer.
 */
let aoExpirar: AoExpirar | null = null;

/** Chamado pelo AuthProvider ao montar. */
export function registrarAoExpirar(fn: AoExpirar): void {
  aoExpirar = fn;
}

/** Chamado pelo interceptor quando recebe 401. */
export async function notificarSessaoExpirada(): Promise<void> {
  if (aoExpirar) {
    await aoExpirar();
  }
}
