/**
 * ---------------------------------------------------------------------------
 * CLIENTE HTTP
 * ---------------------------------------------------------------------------
 * REGRA DE OURO: nenhuma tela importa axios. Nunca.
 *
 *   Tela  ->  Service  ->  client.ts  ->  API
 *
 * Este arquivo concentra quatro responsabilidades que, sem ele, ficariam
 * espalhadas por todas as telas do app:
 *
 *   1. Configuracao          (baseURL, timeout)
 *   2. Identidade da LOJA    (header X-API-Key, do .env)
 *   3. Identidade do USUARIO (header Authorization, do SecureStore)
 *   4. Traducao de erro tecnico em mensagem que cabe na tela
 *
 * DUAS IDENTIDADES, DOIS HEADERS — e a parte que mais confunde no comeco:
 *
 *   X-API-Key      diz QUAL LOJA e. Vem do .env, e igual para todo mundo do
 *                  grupo, e vai em TODA requisicao (inclusive no login).
 *   Authorization  diz QUEM ESTA LOGADO. Vem do SecureStore, e individual, e
 *                  so existe depois do login.
 *
 * Sem a primeira, a API nem sabe de que loja voce esta falando: 401.
 * ---------------------------------------------------------------------------
 */

import axios, { AxiosError, AxiosInstance } from 'axios';

import { config } from '../config/env';
import { AppError, TipoErro } from '../errors/AppError';
import { lerSeguro } from '../storage/armazenamentoSeguro';
import { CHAVES_SEGURAS } from '../storage/chavesArmazenamento';
import { notificarSessaoExpirada } from '../storage/sessaoExpirada';

export const api: AxiosInstance = axios.create({
  baseURL: config.urlBase,

  /**
   * Sem timeout, o Axios espera indefinidamente. Na pratica isso significa
   * uma tela travada em "Carregando..." para sempre quando o servidor cai.
   */
  timeout: 10000,

  headers: { 'Content-Type': 'application/json' },
});

/**
 * =========================================================================
 * INTERCEPTOR DE REQUEST
 * =========================================================================
 * Roda antes de cada requisicao sair do celular.
 *
 * O ganho: o app inteiro passa a se identificar corretamente sem que nenhum
 * service precise saber que headers existem.
 */
api.interceptors.request.use(
  async (config_) => {
    // ---- Identidade da loja (sempre) ------------------------------------
    if (config.apiKey) {
      config_.headers.set('X-API-Key', config.apiKey);
    }

    // E por este header que o professor enxerga quem do grupo trabalhou.
    if (config.rm) {
      config_.headers.set('X-Student-RM', config.rm);
    }

    // ---- Identidade do usuario (so depois do login) ---------------------
    const token = await lerSeguro(CHAVES_SEGURAS.token);
    if (token) {
      config_.headers.set('Authorization', `Bearer ${token}`);
    }

    if (__DEV__) {
      console.log(`[API] -> ${config_.method?.toUpperCase()} ${config_.url}`);
    }

    // Sem este return, nenhuma requisicao sai e o app fica mudo.
    return config_;
  },
  (erro) => Promise.reject(erro),
);

/**
 * =========================================================================
 * INTERCEPTOR DE RESPONSE
 * =========================================================================
 */
api.interceptors.response.use(
  (resposta) => {
    if (__DEV__) {
      console.log(`[API] <- ${resposta.status} ${resposta.config.url}`);
    }
    return resposta;
  },

  async (erro: AxiosError) => {
    /**
     * Um 401 em QUALQUER requisicao derruba a sessao e volta para o login.
     *
     * Repare que isto esta aqui, e nao em cada tela. Se estivesse nas telas,
     * cada uma precisaria lembrar de tratar — e a que esquecesse deixaria o
     * usuario preso numa tela que nunca carrega.
     *
     * A EXCECAO e o proprio login: ali o 401 significa "e-mail ou senha
     * invalidos", nao "sua sessao caiu". Derrubar a sessao nesse caso nao
     * quebraria nada (nao ha sessao para derrubar), mas confundiria a leitura
     * do codigo — e a tela de login ja mostra o erro sozinha.
     */
    const ehTentativaDeLogin = erro.config?.url?.includes('/auth/login') ?? false;

    if (erro.response?.status === 401 && !ehTentativaDeLogin) {
      await notificarSessaoExpirada();
    }

    return Promise.reject(traduzirErro(erro));
  },
);

/**
 * Formato de erro desta API:  { error: { code, message } }
 * As mensagens ja vem em portugues, escritas para o usuario final.
 */
type CorpoErro = { error?: { code?: string; message?: string } };

/**
 * Traduz o erro do Axios para o nosso AppError.
 *
 * A ESTRATEGIA: a mensagem do servidor ganha da nossa.
 * O servidor sabe coisas que o app nao sabe — "Ja existe um cliente com este
 * e-mail", "Grupo desativado. Fale com o professor." Nossa tabela abaixo e a
 * rede de seguranca para quando nao ha resposta, ou quando ela vem sem
 * mensagem (um 500, por exemplo, nao deve vazar detalhe de servidor).
 *
 * ORDEM DAS VERIFICACOES IMPORTA: do caso mais especifico para o mais geral.
 * O 404, por exemplo, tambem esta na faixa 400-499. Se a faixa fosse testada
 * primeiro, a mensagem especifica nunca apareceria.
 */
function traduzirErro(erro: AxiosError): AppError {
  if (erro.code === 'ECONNABORTED') {
    return new AppError({
      tipo: 'TIMEOUT',
      mensagem: 'O servidor demorou para responder. Tente novamente.',
    });
  }

  // Sem `response`, a requisicao nem chegou ao servidor:
  // modo aviao, wi-fi caido, DNS errado, servidor fora do ar.
  if (!erro.response) {
    return new AppError({
      tipo: 'REDE',
      mensagem: 'Sem conexao com a internet. Verifique sua rede.',
    });
  }

  const status = erro.response.status;
  const corpo = erro.response.data as CorpoErro | undefined;
  const codigo = corpo?.error?.code;
  const mensagemDaApi = corpo?.error?.message;

  let tipo: TipoErro;
  let mensagemPadrao: string;

  if (status === 401) {
    tipo = 'NAO_AUTORIZADO';
    mensagemPadrao = 'Sua sessao expirou. Entre novamente.';
  } else if (status === 404) {
    tipo = 'NAO_ENCONTRADO';
    mensagemPadrao = 'Nao encontramos o que voce procura.';
  } else if (status >= 400 && status < 500) {
    tipo = 'CLIENTE';
    mensagemPadrao = 'Houve um problema com a solicitacao.';
  } else if (status >= 500) {
    tipo = 'SERVIDOR';
    mensagemPadrao = 'O servidor esta com problemas. Tente mais tarde.';
  } else {
    tipo = 'DESCONHECIDO';
    mensagemPadrao = 'Algo deu errado. Tente novamente.';
  }

  // Um 500 nunca mostra o texto do servidor: a mensagem pode conter detalhe
  // interno, e para o usuario nao muda nada saber qual query falhou.
  const mensagem = status < 500 && mensagemDaApi ? mensagemDaApi : mensagemPadrao;

  return new AppError({ tipo, mensagem, status, codigo });
}
