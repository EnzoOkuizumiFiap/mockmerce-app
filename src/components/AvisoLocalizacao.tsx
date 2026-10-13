/**
 * ---------------------------------------------------------------------------
 * AVISO DE LOCALIZACAO
 * ---------------------------------------------------------------------------
 * Aparece SO quando a localizacao nao deu certo, e explica duas coisas:
 *
 *   1. o que aconteceu, sem culpar a pessoa;
 *   2. que a lista continua ali (em ordem alfabetica, sem distancia).
 *
 * O botao muda conforme o motivo:
 *
 *   negada + o sistema ainda pergunta   -> "Permitir localizacao" (refaz o pedido)
 *   negada + o sistema NAO pergunta mais -> "Abrir configuracoes"
 *   erro (GPS nao respondeu)             -> "Tentar de novo"
 * ---------------------------------------------------------------------------
 */
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Pressionavel } from './Pressionavel';
import { StatusLocalizacao } from '../hooks/useLocalizacao';
import { cores } from '../lib/tema';

type Props = {
  status: StatusLocalizacao;
  podePerguntarDeNovo: boolean;
  aoTentarNovamente: () => void;
};

export function AvisoLocalizacao({ status, podePerguntarDeNovo, aoTentarNovamente }: Props) {
  // Funcionando, ainda tentando ou nem pedimos: nada a avisar.
  if (status !== 'negada' && status !== 'erro') return null;

  const negada = status === 'negada';

  const mensagem = negada
    ? 'Sem a sua localizacao, mostramos os pontos em ordem alfabetica, sem a distancia ate voce.'
    : 'Nao conseguimos descobrir onde voce esta. Mostramos os pontos em ordem alfabetica, sem a distancia.';

  const rotulo = negada
    ? podePerguntarDeNovo
      ? 'Permitir localizacao'
      : 'Abrir configuracoes'
    : 'Tentar de novo';

  function aoPressionar() {
    // Negou "para sempre": o sistema nao abre mais o dialogo. So nas Configuracoes.
    if (negada && !podePerguntarDeNovo) {
      Linking.openSettings();
      return;
    }
    aoTentarNovamente();
  }

  return (
    <View style={e.caixa} accessibilityRole="alert">
      <Text style={e.texto}>{mensagem}</Text>
      <Pressionavel
        style={e.botao}
        onPress={aoPressionar}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
      >
        <Text style={e.botaoTexto}>{rotulo}</Text>
      </Pressionavel>
    </View>
  );
}

const e = StyleSheet.create({
  caixa: {
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.neutroClaro,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  texto: { fontSize: 13, lineHeight: 19, color: cores.texto },
  botao: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: cores.primaria,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  botaoTexto: { color: cores.primaria, fontWeight: '700', fontSize: 13 },
});