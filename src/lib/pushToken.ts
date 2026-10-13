/**
 * ---------------------------------------------------------------------------
 * ARMAZENAMENTO EM MEMORIA DO TOKEN DE PUSH
 * ---------------------------------------------------------------------------
 * Isola o token fora dos contextos React para evitar dependencia circular
 * entre AuthContext (que precisa do token no logout) e NotificacoesContext
 * (que precisa do AuthContext para saber quem esta logado).
 * ---------------------------------------------------------------------------
 */
let tokenAtual: string | null = null;

export const obterTokenAtual = (): string | null => tokenAtual;

export const definirTokenAtual = (token: string | null): void => {
  tokenAtual = token;
};
