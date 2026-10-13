/**
 * ---------------------------------------------------------------------------
 * SERVICE DE UPLOAD
 * ---------------------------------------------------------------------------
 * O arquivo sobe para a API em `multipart/form-data`; a API guarda no S3 e
 * devolve a URL publica. O celular nunca fala com a AWS direto.
 *
 * ESTE ARQUIVO EXISTE POR CAUSA DE UMA UNICA LINHA — a que NAO esta aqui:
 *
 *     headers: { 'Content-Type': 'multipart/form-data' }   // <- NAO FACA
 *
 * Um envio multipart precisa de um `boundary`, um separador aleatorio que
 * marca onde cada parte comeca e termina. Quem gera esse separador e a
 * camada de rede, no momento do envio. Se voce fixar o header na mao, ele vai
 * sem boundary, o servidor nao consegue separar as partes e o upload falha
 * com um erro que nao ajuda em nada.
 * ---------------------------------------------------------------------------
 */

import { api } from '../api/client';
import { MidiaEnviada } from '../types/avaliacao';

/**
 * O que o FormData do React Native aceita como arquivo.
 *
 * Repare que NAO e um Blob nem um File (esses existem no navegador). No RN
 * voce entrega o caminho local do arquivo — a `uri` que o ImagePicker devolve
 * — e a plataforma le o arquivo na hora de enviar.
 */
export type ArquivoLocal = {
  uri: string;
  name: string;
  type: string;
};

/**
 * Envia UMA imagem e devolve a midia criada.
 *
 * O `mediaId` da resposta e o que vai depois na avaliacao. A URL tambem vem,
 * caso a tela queira mostrar a foto antes de salvar.
 */
export async function enviarImagem(
  arquivo: ArquivoLocal,
  pasta = 'avaliacoes',
): Promise<MidiaEnviada> {
  const form = new FormData();

  // O `as any` e por conta da tipagem do FormData, que foi escrita pensando
  // no navegador. Em React Native este objeto e o formato correto.
  form.append('file', arquivo as any);
  form.append('folder', pasta);

  const resposta = await api.post<MidiaEnviada>('/uploads', form, {
    /**
     * `undefined` REMOVE o Content-Type que o cliente define por padrao
     * (application/json), deixando a camada de rede montar o dela — com
     * boundary. E a forma de nao ter o header errado nem o header na mao.
     */
    headers: { 'Content-Type': undefined as unknown as string },

    // Foto de celular e pesada e a rede da faculdade nem sempre ajuda: o
    // timeout padrao de 10s do cliente derrubaria envios legitimos.
    timeout: 60000,
  });

  return resposta.data;
}

/** Nome e tipo a partir da uri do ImagePicker (".../IMG_0042.jpg"). */
export function arquivoDaUri(uri: string): ArquivoLocal {
  const nome = uri.split('/').pop() || `foto-${Date.now()}.jpg`;
  const extensao = nome.split('.').pop()?.toLowerCase() ?? 'jpg';
  const tipo = extensao === 'png' ? 'image/png' : 'image/jpeg';
  return { uri, name: nome, type: tipo };
}
