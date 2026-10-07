/**
 * ---------------------------------------------------------------------------
 * CONTEXTO DE AUTENTICACAO
 * ---------------------------------------------------------------------------
 * Concentra tudo o que diz respeito a sessao: entrar, sair, restaurar ao
 * abrir o app, e reagir a uma sessao expirada.
 *
 * O QUE FICA ONDE:
 *
 *   token         -> SecureStore   (criptografado pelo sistema operacional)
 *   dados do user -> AsyncStorage  (texto puro, leitura instantanea, offline)
 *
 * E por causa dessa segunda linha que a tela de perfil abre em modo aviao.
 * ---------------------------------------------------------------------------
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { queryClient } from '../lib/queryClient';
import { cadastrar as cadastrarNaApi, login as loginNaApi } from '../services/authService';
import { apagarLocal, guardarLocal, lerLocal } from '../storage/armazenamentoLocal';
import { apagarSeguro, guardarSeguro, lerSeguro } from '../storage/armazenamentoSeguro';
import { CHAVES, CHAVES_SEGURAS } from '../storage/chavesArmazenamento';
import { registrarAoExpirar } from '../storage/sessaoExpirada';
import { Credenciais, NovoCliente, RespostaLogin, Usuario } from '../types/usuario';
import { obterTokenAtual } from './NotificacoesContext';
import { removerAparelho } from '../services/notificacoesService';

type AuthContextValor = {
  usuario: Usuario | null;
  carregandoSessao: boolean;
  entrar: (credenciais: Credenciais) => Promise<void>;
  cadastrar: (dados: NovoCliente) => Promise<void>;
  sair: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  /**
   * Comeca em `true` de proposito.
   *
   * Enquanto nao sabemos se ha sessao guardada, nao podemos mostrar nem a
   * tela de login nem as telas internas. Se comecasse em `false`, o app
   * piscaria a tela de login por um instante antes de entrar — e o usuario
   * concluiria que a sessao caiu.
   */
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  /**
   * Limpeza completa da sessao. Usada tanto pelo logout manual quanto pela
   * expiracao automatica disparada pelo interceptor.
   *
   * ORDEM IMPORTA: a credencial primeiro. Se o app fechar no meio do
   * processo, ter apagado o token e sobrado o dado e inofensivo. O inverso
   * — sobrar o token — manteria a sessao viva.
   */
  async function limparSessao() {
    await apagarSeguro(CHAVES_SEGURAS.token);
    await apagarSeguro(CHAVES_SEGURAS.refreshToken);
    await apagarLocal(CHAVES.usuario);

    /**
     * O cache do TanStack Query tambem precisa ir embora.
     *
     * Sem isto, quem logar em seguida no mesmo aparelho ve por um instante o
     * catalogo carregado pela sessao anterior. Nao e vazamento grave aqui
     * (catalogo e publico dentro da loja), mas o habito importa: estado de
     * servidor pertence a uma sessao.
     */
    queryClient.clear();

    setUsuario(null);

    /**
     * Os favoritos NAO sao apagados.
     *
     * Justificativa: como a chave inclui o id do usuario, nao ha risco de um
     * usuario ver a lista do outro. Manter significa que quem sai e volta
     * encontra a colecao intacta.
     *
     * A escolha oposta — apagar — seria mais adequada num app de aparelho
     * compartilhado. Nao ha resposta universal; ha trade-off.
     */
  }

  /**
   * Restauracao da sessao na abertura do app.
   * E isto que faz o usuario continuar logado depois de fechar o aplicativo.
   */
  useEffect(() => {
    async function restaurarSessao() {
      try {
        const token = await lerSeguro(CHAVES_SEGURAS.token);
        if (!token) return;

        /**
         * O token existe, mas quem e o usuario? Os dados estao no
         * AsyncStorage — ler do disco e instantaneo e funciona sem internet.
         *
         * A alternativa seria chamar GET /auth/me aqui. Funciona, mas o app
         * passaria a exigir rede para abrir: em modo aviao voce cairia no
         * login mesmo tendo sessao valida. Lemos do disco e deixamos o
         * interceptor derrubar a sessao se o token estiver mesmo morto.
         */
        const dadosGuardados = await lerLocal<Usuario>(CHAVES.usuario);
        if (dadosGuardados) {
          setUsuario(dadosGuardados);
        }
      } finally {
        // `finally` garante que a tela destrava mesmo se a leitura falhar.
        setCarregandoSessao(false);
      }
    }

    restaurarSessao();
  }, []);

  /**
   * Registra o callback que o interceptor vai chamar ao receber 401.
   * Ver src/storage/sessaoExpirada.ts para o porque desta ponte.
   */
  useEffect(() => {
    registrarAoExpirar(limparSessao);
  }, []);

  /**
   * Grava a sessao que a API devolveu.
   *
   * Entrar e cadastrar terminam EXATAMENTE igual — os dois endpoints
   * respondem { token, customer } —, entao a gravacao mora aqui em vez de
   * aparecer duas vezes. Se um dia o app passar a guardar mais alguma coisa
   * no login, ele guarda no cadastro junto, sem ninguem precisar lembrar.
   */
  async function guardarSessao(resposta: RespostaLogin) {
    // A credencial vai para o cofre...
    await guardarSeguro(CHAVES_SEGURAS.token, resposta.token);

    // Esta API ainda nao emite refreshToken. Quando emitir, o app ja guarda.
    if (resposta.refreshToken) {
      await guardarSeguro(CHAVES_SEGURAS.refreshToken, resposta.refreshToken);
    }

    // ...e os dados vao para o armazenamento comum.
    const dadosUsuario: Usuario = {
      id: resposta.customer.id,
      name: resposta.customer.name,
      email: resposta.customer.email,
      image: resposta.customer.image ?? null,
    };
    await guardarLocal(CHAVES.usuario, dadosUsuario);

    setUsuario(dadosUsuario);
  }

  async function entrar(credenciais: Credenciais) {
    await guardarSessao(await loginNaApi(credenciais));
  }

  /**
   * Cadastro que JA ENTRA.
   *
   * A API devolve token junto com o cliente criado, entao nao ha motivo para
   * mandar quem acabou de se cadastrar digitar e-mail e senha de novo numa
   * tela de login. Como `setUsuario` acontece aqui, o RootNavigator troca o
   * stack sozinho — a tela de cadastro nao navega para lugar nenhum.
   */
  async function cadastrar(dados: NovoCliente) {
    await guardarSessao(await cadastrarNaApi(dados));
  }

  /** Logout manual. */
  async function sair() {
    /**
     * ANTES de apagar o token da sessao: a rota que remove o aparelho exige
     * o cliente autenticado. Invertendo a ordem, a chamada leva 401 e o
     * aparelho fica registrado no nome de quem saiu — e a proxima queda de
     * preco de um produto que ELE salvou toca no celular de quem entrou
     * depois.
     *
     * Falhar aqui nao pode impedir o logout: sair da conta e mais
     * importante do que limpar o registro, e o backend desativa o token
     * sozinho quando o Firebase disser que ele morreu.
     */
    const token = obterTokenAtual();
    if (token) {
      try {
        await removerAparelho(token);
      } catch {
        // silencio proposital: ver comentario acima
      }
    }

    await limparSessao();
  }

  return (
    <AuthContext.Provider value={{ usuario, carregandoSessao, entrar, cadastrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * O erro explicito ajuda quem esqueceu o Provider — sem ele, a mensagem seria
 * "cannot read property of null", bem menos util.
 */
export function useAuth(): AuthContextValor {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth precisa estar dentro de um AuthProvider');
  }
  return contexto;
}
