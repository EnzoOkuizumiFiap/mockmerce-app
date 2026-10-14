/**
 * ---------------------------------------------------------------------------
 * INDICADOR DE ETAPAS DA COMPRA
 * ---------------------------------------------------------------------------
 * Mostra visualmente o progresso do leitor durante as etapas de compra:
 *   Etapa 1: Sacola de Livros
 *   Etapa 2: Forma de Recebimento (Entrega ou Retirada)
 *   Etapa 3: Pagamento e Confirmação
 * ---------------------------------------------------------------------------
 */
import { StyleSheet, Text, View } from 'react-native';
import { cores } from '../lib/tema';

type Props = {
  etapaAtual: 1 | 2 | 3;
};

const ETAPAS = [
  { numero: 1, rotulo: 'Sacola', icone: '🛍️' },
  { numero: 2, rotulo: 'Retirada', icone: '📍' },
  { numero: 3, rotulo: 'Pagamento', icone: '💳' },
] as const;

export function EtapasCompra({ etapaAtual }: Props) {
  return (
    <View style={e.container}>
      <View style={e.linhaConexao} />

      <View style={e.etapasContainer}>
        {ETAPAS.map((etapa) => {
          const concluida = etapa.numero < etapaAtual;
          const ativa = etapa.numero === etapaAtual;

          return (
            <View key={etapa.numero} style={e.itemEtapa}>
              <View
                style={[
                  e.circulo,
                  concluida && e.circuloConcluido,
                  ativa && e.circuloAtivo,
                ]}
              >
                {concluida ? (
                  <Text style={e.textoConcluido}>✓</Text>
                ) : (
                  <Text style={[e.numeroTexto, ativa && e.numeroTextoAtivo]}>
                    {etapa.numero}
                  </Text>
                )}
              </View>

              <Text
                style={[
                  e.rotulo,
                  ativa && e.rotuloAtivo,
                  concluida && e.rotuloConcluido,
                ]}
              >
                {etapa.rotulo}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    position: 'relative',
    marginBottom: 4,
  },
  linhaConexao: {
    position: 'absolute',
    top: 26,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 0,
  },
  etapasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  itemEtapa: {
    alignItems: 'center',
    gap: 6,
    minWidth: 70,
  },
  circulo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloAtivo: {
    backgroundColor: cores.primaria,
    borderColor: cores.primaria,
    elevation: 3,
    shadowColor: cores.primaria,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  circuloConcluido: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  numeroTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  numeroTextoAtivo: {
    color: '#FFFFFF',
  },
  textoConcluido: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rotulo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  rotuloAtivo: {
    color: cores.primaria,
    fontWeight: '800',
  },
  rotuloConcluido: {
    color: '#059669',
    fontWeight: '700',
  },
});
