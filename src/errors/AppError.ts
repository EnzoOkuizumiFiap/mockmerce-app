/**
 * ---------------------------------------------------------------------------
 * ERRO NORMALIZADO DA APLICACAO
 * ---------------------------------------------------------------------------
 * Existe para que a tela nunca precise perguntar "isso e um erro do Axios,
 * do fetch ou do JSON.parse?". Chegou na tela, e um AppError, e ele sempre
 * tem `tipo` (para decidir o que fazer) e `mensagem` (para mostrar).
 * ---------------------------------------------------------------------------
 */

export type TipoErro =
  | 'REDE'
  | 'TIMEOUT'
  | 'NAO_AUTORIZADO'
  | 'NAO_ENCONTRADO'
  | 'CLIENTE'
  | 'SERVIDOR'
  | 'DESCONHECIDO';

export class AppError extends Error {
  public readonly tipo: TipoErro;
  public readonly mensagem: string;
  public readonly status?: number;

  /** O `code` que a API mandou (ex.: 'UNAUTHORIZED', 'NO_GROUP'). */
  public readonly codigo?: string;

  constructor(params: { tipo: TipoErro; mensagem: string; status?: number; codigo?: string }) {
    super(params.mensagem);
    this.name = 'AppError';
    this.tipo = params.tipo;
    this.mensagem = params.mensagem;
    this.status = params.status;
    this.codigo = params.codigo;
  }
}

/**
 * Type guard. Em `catch (e)` o TypeScript entrega `unknown`, e `e.mensagem`
 * nao compila. Esta funcao estreita o tipo com seguranca.
 */
export function ehAppError(valor: unknown): valor is AppError {
  return valor instanceof AppError;
}
