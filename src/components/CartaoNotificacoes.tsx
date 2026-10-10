/**
 * ---------------------------------------------------------------------------
 * CARTAO: ESTADO DAS NOTIFICACOES
 * ---------------------------------------------------------------------------
 * Serve para o usuario e serve para a aula.
 *
 * Para o usuario: quem recusou a permissao precisa saber que recusou, e o que
 * fazer para voltar atras. Um app que simplesmente nunca notifica, sem
 * explicar, parece quebrado.
 *
 * Para a aula: e aqui que o token deixa de ser abstrato. O inicio do token
 * que aparece nesta tela e o mesmo que aparece no painel da loja, em
 * Push -> Aparelhos registrados. Ver os dois lados batendo e o que faz a
 * ficha cair.
 * ---------------------------------------------------------------------------
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useNotificacoes } from '../contexts/NotificacoesContext';
import { cores } from '../lib/tema';

const TITULO: Record<string, string> = {
  verificando: 'Verificando notificacoes...',
  concedida: 'Notificacoes ligadas',
  negada: 'Notificacoes recusadas',
  indisponivel: 'Push indisponivel aqui',
};

export function CartaoNotificacoes() {
  const { status, token, motivo, tentarNovamente } = useNotificacoes();

  const ok = status === 'concedida';

  return (
    <View style={[e.cartao, ok ? e.cartaoOk : e.cartaoAviso]}>
      <Text style={e.titulo}>{TITULO[status]}</Text>

      {ok && token && (
        <>
          <Text style={e.legenda}>Token deste aparelho no Firebase</Text>
          {/*
            So o comeco e o fim. O token inteiro tem ~160 caracteres e nao
            cabe na tela — e o que interessa aqui e poder comparar com o que
            o painel da loja mostra.
          */}
          <Text style={e.token}>
            {token.slice(0, 12)}...{token.slice(-6)}
          </Text>
        </>
      )}

      {motivo && <Text style={e.motivo}>{motivo}</Text>}

      {!ok && status !== 'verificando' && (
        <Pressable style={e.botao} onPress={tentarNovamente} accessibilityRole="button">
          <Text style={e.textoBotao}>Tentar de novo</Text>
        </Pressable>
      )}
    </View>
  );
}

const e = StyleSheet.create({
  cartao: {
    width: '100%',
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  cartaoOk: { borderColor: cores.primaria, backgroundColor: `${cores.primaria}12` },
  cartaoAviso: { borderColor: cores.borda, backgroundColor: cores.fundo },
  titulo: { fontSize: 15, fontWeight: '700', color: cores.textoForte },
  legenda: { fontSize: 12, color: cores.textoFraco, marginTop: 8 },
  token: { fontSize: 13, color: cores.textoForte, fontVariant: ['tabular-nums'] },
  motivo: { fontSize: 13, color: cores.textoFraco, marginTop: 4, lineHeight: 18 },
  botao: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: cores.primaria,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  textoBotao: { color: cores.primaria, fontWeight: '700', fontSize: 14 },
});
