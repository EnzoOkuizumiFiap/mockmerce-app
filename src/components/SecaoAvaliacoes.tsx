/**
 * ---------------------------------------------------------------------------
 * SECAO DE AVALIACOES (dentro do detalhe do produto)
 * ---------------------------------------------------------------------------
 * Resumo + botao de avaliar + as avaliacoes.
 *
 * O BOTAO TEM TRES ESTADOS, e e o `can-review` que decide qual:
 *
 *   canReview: true            -> "Avaliar produto"
 *   reason: NOT_PURCHASED      -> texto explicando que precisa comprar antes
 *   reason: ALREADY_REVIEWED   -> "Editar minha avaliacao"
 *
 * Perguntar ANTES evita o pior fluxo: a pessoa escreve tudo, aperta enviar e
 * so entao leva um 403. O custo de uma requisicao a mais e baixo perto disso.
 *
 * Deslogado nao ha pergunta a fazer — `usePodeAvaliar` nem dispara (ver o
 * `enabled` la no hook) e a secao mostra so a leitura.
 * ---------------------------------------------------------------------------
 */
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { useAvaliacoes, usePodeAvaliar } from '../hooks/useAvaliacoes';
import { cores } from '../lib/tema';
import { Avaliacao } from '../types/avaliacao';
import { CardAvaliacao } from './CardAvaliacao';
import { EstadoErro } from './EstadoErro';
import { EstadoVazio } from './EstadoVazio';
import { ResumoAvaliacoes } from './ResumoAvaliacoes';

type Props = {
  produtoId: string;
  /** Navega para o formulario, opcionalmente com a avaliacao existente para edicao */
  aoAvaliar: (avaliacaoExistente?: Avaliacao | null) => void;
};

export function SecaoAvaliacoes({ produtoId, aoAvaliar }: Props) {
  const { usuario } = useAuth();
  const { data, isPending, isError, refetch } = useAvaliacoes(produtoId);
  const { data: permissao, isPending: carregandoPermissao } = usePodeAvaliar(produtoId);

  const minhaAvaliacao = useMemo(() => {
    if (!data?.data) return null;
    return (
      data.data.find(
        (a) =>
          (permissao?.reviewId && a.id === permissao.reviewId) ||
          (usuario?.id && a.author?.id === usuario.id) ||
          a.isMine,
      ) ?? null
    );
  }, [data, permissao, usuario]);

  if (isPending || carregandoPermissao) {
    return (
      <View style={e.carregando}>
        <ActivityIndicator color={cores.primaria} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={e.container}>
        <Text style={e.titulo}>📖 O que os leitores dizem</Text>
        <EstadoErro
          mensagem="Não foi possível carregar as avaliações deste livro."
          aoTentarNovamente={() => refetch()}
        />
      </View>
    );
  }

  if (!data) return null;

  const jaAvaliou = permissao?.reason === 'ALREADY_REVIEWED' || Boolean(minhaAvaliacao);

  return (
    <View style={e.container}>
      <Text style={e.titulo}>📖 O que os leitores dizem</Text>

      <ResumoAvaliacoes resumo={data.summary} />

      {/* Botão Direto de Avaliar ou Editar */}
      {jaAvaliou ? (
        <Pressable
          style={e.botaoEditar}
          onPress={() => aoAvaliar(minhaAvaliacao)}
          accessibilityRole="button"
          accessibilityLabel="Editar minha avaliação"
        >
          <Text style={e.botaoEditarTexto}>✍️ Editar minha avaliação</Text>
        </Pressable>
      ) : (
        <Pressable
          style={e.botao}
          onPress={() => aoAvaliar(null)}
          accessibilityRole="button"
          accessibilityLabel="Avaliar esta obra"
        >
          <Text style={e.botaoTexto}>✍️ Avaliar esta obra</Text>
        </Pressable>
      )}

      {/* ---- As avaliacoes ---- */}
      <View style={e.lista}>
        {data.data.length === 0 ? (
          <EstadoVazio
            icone="📖"
            mensagem="Nenhuma avaliação publicada ainda. Seja o primeiro a compartilhar sua experiência literária!"
          />
        ) : (
          data.data.map((avaliacao) => (
            <CardAvaliacao key={avaliacao.id} avaliacao={avaliacao} />
          ))
        )}
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  container: { gap: 12, marginTop: 4 },
  carregando: { paddingVertical: 24, alignItems: 'center' },
  titulo: { fontSize: 18, fontWeight: '800', color: cores.textoForte },
  carregandoPermissao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  textoVerificando: {
    fontSize: 13,
    color: cores.textoFraco,
  },
  blocoLiberado: {
    gap: 6,
  },
  botao: {
    backgroundColor: cores.primaria,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: cores.primaria,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  textoLiberado: {
    fontSize: 12,
    color: cores.sucesso,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardAviso: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  linhaAviso: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  iconeAviso: {
    fontSize: 18,
    marginTop: 2,
  },
  tituloAviso: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.textoForte,
  },
  textoAviso: {
    fontSize: 13,
    color: cores.textoFraco,
    lineHeight: 18,
    marginTop: 2,
  },
  botaoAviso: {
    backgroundColor: cores.primaria,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoAvisoTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dicaCompra: {
    fontSize: 11,
    color: cores.textoFraco,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cardAvisoSucesso: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 10,
  },
  tituloAvisoSucesso: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.sucesso,
  },
  botaoEditar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: cores.sucesso,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botaoEditarTexto: {
    color: cores.sucesso,
    fontSize: 14,
    fontWeight: '700',
  },
  lista: { gap: 10, marginTop: 4 },
});
