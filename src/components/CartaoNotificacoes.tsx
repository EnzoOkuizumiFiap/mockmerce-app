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
  const { status, motivo, podeSolicitar, ativar, tentarNovamente, abrirConfiguracoes } = useNotificacoes();

  const ok = status === 'concedida';
  const carregando = status === 'verificando';

  return (
    <View style={[e.cartao, ok ? e.cartaoOk : e.cartaoAviso]}>
      <Text style={e.titulo}>{TITULO[status]}</Text>
      <Text style={e.descricao}>
        Receba avisos sobre novidades e mensagens da loja. Você pode continuar usando o Mockmerce se não quiser ativar.
      </Text>
      {motivo && <Text accessibilityLiveRegion="polite" style={e.motivo}>{motivo}</Text>}

      {!carregando && !ok && status === 'nao-solicitada' && (
        <Pressable style={e.botao} onPress={() => void ativar()} accessibilityRole="button">
          <Text style={e.textoBotao}>Ativar notificações</Text>
        </Pressable>
      )}

      {!carregando && !ok && status === 'negada' && (
        <Pressable
          style={e.botao}
          onPress={() => void (podeSolicitar ? tentarNovamente() : abrirConfiguracoes())}
          accessibilityRole="button"
        >
          <Text style={e.textoBotao}>
            {podeSolicitar ? 'Tentar novamente' : 'Abrir configurações'}
          </Text>
        </Pressable>
      )}

      {ok && (
        <Pressable style={e.botao} onPress={() => void tentarNovamente()} accessibilityRole="button">
          <Text style={e.textoBotao}>Sincronizar agora</Text>
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
    gap: 6,
  },
  cartaoOk: { borderColor: cores.primaria, backgroundColor: `${cores.primaria}12` },
  cartaoAviso: { borderColor: cores.borda, backgroundColor: cores.fundo },
  titulo: { fontSize: 15, fontWeight: '700', color: cores.textoForte },
  descricao: { fontSize: 13, color: cores.textoFraco, lineHeight: 18 },
  motivo: { fontSize: 13, color: cores.textoFraco, marginTop: 4, lineHeight: 18 },
  botao: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: cores.primaria,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  textoBotao: { color: cores.primaria, fontWeight: '700', fontSize: 14 },
});
