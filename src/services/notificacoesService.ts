import { api } from '../api/client';
import { DadosNotificacao, MensagemNotificacao } from '../types/notificacao';

type Registro = Record<string, unknown>;

function ehRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown): string | null {
  if (typeof valor === 'string' && valor.trim()) return valor.trim();
  if (typeof valor === 'number') return String(valor);
  return null;
}

function extrairLista(resposta: unknown): unknown[] {
  if (Array.isArray(resposta)) return resposta;
  if (!ehRegistro(resposta)) return [];

  if (Array.isArray(resposta.messages)) return resposta.messages;
  if (Array.isArray(resposta.items)) return resposta.items;
  if (Array.isArray(resposta.results)) return resposta.results;
  if (Array.isArray(resposta.data)) return resposta.data;
  if (ehRegistro(resposta.data) && Array.isArray(resposta.data.messages)) {
    return resposta.data.messages;
  }

  return [];
}

function normalizarMensagem(valor: unknown, indice: number): MensagemNotificacao | null {
  if (!ehRegistro(valor)) return null;

  const titulo = texto(valor.title) ?? texto(valor.titulo);
  const corpo = texto(valor.body) ?? texto(valor.corpo) ?? texto(valor.message);
  if (!titulo || !corpo) return null;

  const dataBruta = ehRegistro(valor.data) ? valor.data : {};
  const produtoId = texto(dataBruta.produtoId) ?? texto(dataBruta.productId);
  const createdAt = texto(valor.createdAt) ?? texto(valor.date) ?? texto(dataBruta.createdAt);
  const idRecebido = texto(valor.id) ?? texto(valor.messageId);

  // O ID do servidor é preferível. A composição abaixo é um fallback estável
  // para respostas que não tragam ID, evitando repetir a mesma mensagem.
  const id = idRecebido ?? `${createdAt ?? 'sem-data'}:${titulo}:${corpo}:${indice}`;
  const data: DadosNotificacao = {};

  for (const [chave, item] of Object.entries(dataBruta)) {
    const valorTexto = texto(item);
    if (valorTexto !== null) data[chave] = valorTexto;
  }

  if (produtoId) {
    data.produtoId = produtoId;
    data.rota = 'produto';
  }
  if (createdAt) data.createdAt = createdAt;

  return { id, titulo, corpo, data, createdAt };
}

/** Busca e normaliza o histórico de mensagens da loja. */
export async function buscarMensagens(): Promise<MensagemNotificacao[]> {
  const resposta = await api.get<unknown>('/push/messages');
  return extrairLista(resposta.data)
    .map(normalizarMensagem)
    .filter((mensagem): mensagem is MensagemNotificacao => mensagem !== null);
}
