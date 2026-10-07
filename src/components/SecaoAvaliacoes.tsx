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
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { useAvaliacoes, usePodeAvaliar } from '../hooks/useAvaliacoes';
import { cores } from '../lib/tema';
import { CardAvaliacao } from './CardAvaliacao';
import { ResumoAvaliacoes } from './ResumoAvaliacoes';

type Props = {
  produtoId: string;
  /** Navega para o formulario. Quem sabe navegar e a TELA, nao este componente. */
  aoAvaliar: () => void;
};

export function SecaoAvaliacoes({ produtoId, aoAvaliar }: Props) {
  const { usuario } = useAuth();
  const { data, isPending } = useAvaliacoes(produtoId);
  const { data: permissao } = usePodeAvaliar(produtoId);

  if (isPending) {
    return (
      <View style={e.carregando}>
        <ActivityIndicator color={cores.primaria} />
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={e.container}>
      <Text style={e.titulo}>Avaliacoes</Text>

      <ResumoAvaliacoes resumo={data.summary} />

      {/* ---- O botao, conforme o que o can-review respondeu ---- */}
      {usuario && permissao?.canReview ? (
        <Pressable style={e.botao} onPress={aoAvaliar}>
          <Text style={e.botaoTexto}>Avaliar produto</Text>
        </Pressable>
      ) : null}

      {usuario && permissao?.reason === 'ALREADY_REVIEWED' ? (
        <Text style={e.aviso}>Voce ja avaliou este produto.</Text>
      ) : null}

      {usuario && permissao?.reason === 'NOT_PURCHASED' ? (
        // A mensagem vem da API para nao existir em dois lugares.
        <Text style={e.aviso}>{permissao.message}</Text>
      ) : null}

      {/* ---- As avaliacoes ---- */}
      <View style={e.lista}>
        {data.data.map((avaliacao) => (
          <CardAvaliacao key={avaliacao.id} avaliacao={avaliacao} />
        ))}
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  container: { gap: 10, marginTop: 8 },
  carregando: { paddingVertical: 24, alignItems: 'center' },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.textoForte },
  botao: {
    backgroundColor: cores.primaria, borderRadius: 10, padding: 14, alignItems: 'center',
  },
  botaoTexto: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  aviso: { fontSize: 13, color: cores.textoFraco, fontStyle: 'italic' },
  lista: { gap: 10, marginTop: 4 },
});
