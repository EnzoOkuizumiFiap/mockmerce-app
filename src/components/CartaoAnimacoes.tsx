/**
 * ---------------------------------------------------------------------------
 * CARTÃO: ESTADO DAS ANIMAÇÕES E MOVIMENTO (RF-54 / RF-55)
 * ---------------------------------------------------------------------------
 * Permite ao usuário alternar as animações do aplicativo em tempo de execução
 * através de um Switch ("deslizar"), testando e demonstrando a degradação graciosa:
 *   - "Desliguei as animações e o app continua usável" (Checklist Linha 240)
 *   - "Liguei Reduzir movimento e nada ficou sem feedback" (RF-54)
 * ---------------------------------------------------------------------------
 */
import { StyleSheet, Switch, Text, View } from 'react-native';

import { useAnimacoes } from '../contexts/AnimacoesContext';
import { cores } from '../lib/tema';

export function CartaoAnimacoes() {
  const {
    animacoesAtivas,
    animacoesLigadas,
    reduzirMovimento,
    motivoDesativada,
    alternarAnimacoes,
  } = useAnimacoes();

  const ok = animacoesAtivas;

  return (
    <View style={[e.cartao, ok ? e.cartaoOk : e.cartaoAviso]}>
      <View style={e.cabecalho}>
        <View style={e.textoCabecalho}>
          <Text style={e.titulo}>
            {ok ? 'Animações ativadas' : 'Animações desligadas'}
          </Text>
          <Text style={e.subtitulo}>
            {ok
              ? 'Molas ao tocar, transições de lista e pulso de carregamento.'
              : motivoDesativada ?? 'O app responde sem movimento, mantendo o feedback visual.'}
          </Text>
        </View>

        <Switch
          value={animacoesLigadas && !reduzirMovimento}
          onValueChange={alternarAnimacoes}
          disabled={reduzirMovimento}
          trackColor={{ false: cores.borda, true: cores.primaria }}
          thumbColor="#ffffff"
          accessibilityLabel="Alternar animações"
        />
      </View>

      {reduzirMovimento && (
        <Text style={e.avisoAcessibilidade}>
          {'\"Reduzir movimento\" está ativado nas configurações do sistema (Acessibilidade).'}
        </Text>
      )}
    </View>
  );
}

const e = StyleSheet.create({
  cartao: {
    width: '100%',
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  cartaoOk: { borderColor: cores.primaria, backgroundColor: `${cores.primaria}12` },
  cartaoAviso: { borderColor: cores.borda, backgroundColor: cores.fundo },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textoCabecalho: {
    flex: 1,
    gap: 4,
  },
  titulo: { fontSize: 15, fontWeight: '700', color: cores.textoForte },
  subtitulo: { fontSize: 13, color: cores.textoFraco, lineHeight: 18 },
  avisoAcessibilidade: {
    fontSize: 12,
    color: '#d97706',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
