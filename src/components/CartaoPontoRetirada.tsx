/**
 * ---------------------------------------------------------------------------
 * CARTAO DE PONTO DE RETIRADA
 * ---------------------------------------------------------------------------
 * Serve a duas telas: na lista do mapa ele "foca" o ponto; no checkout ele
 * "escolhe" o ponto. Quem decide o que o toque faz e quem usa o cartao.
 *
 * `distanceKm` vem null quando a pessoa nao liberou o GPS. Nesse caso o selo
 * de distancia simplesmente nao aparece — o cartao continua completo.
 * ---------------------------------------------------------------------------
 */
import { StyleSheet, Text, View } from 'react-native';

import { Pressionavel } from './Pressionavel';
import { cores } from '../lib/tema';
import { enderecoResumido, formatarKm } from '../lib/localizacao';
import { PontoRetirada } from '../types/localizacao';

type Props = {
  ponto: PontoRetirada;
  selecionado?: boolean;
  aoPressionar: () => void;
};

export function CartaoPontoRetirada({ ponto, selecionado = false, aoPressionar }: Props) {
  const endereco = enderecoResumido(ponto);

  return (
    <Pressionavel
      style={[e.cartao, selecionado && e.cartaoSelecionado]}
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={`${ponto.name}${endereco ? `, ${endereco}` : ''}`}
    >
      <View style={e.topo}>
        <Text style={e.nome} numberOfLines={1}>
          {ponto.name}
        </Text>
        {ponto.distanceKm !== null ? (
          <Text style={e.distancia}>{formatarKm(ponto.distanceKm)}</Text>
        ) : null}
      </View>

      {endereco ? <Text style={e.linha}>{endereco}</Text> : null}
      {ponto.hours ? <Text style={e.horario}>{ponto.hours}</Text> : null}
    </Pressionavel>
  );
}

const e = StyleSheet.create({
  cartao: {
    borderWidth: 1.5,
    borderColor: cores.borda,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  cartaoSelecionado: { borderColor: cores.primaria },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  nome: { flex: 1, fontSize: 15, fontWeight: '700', color: cores.textoForte },
  distancia: { fontSize: 13, fontWeight: '700', color: cores.primaria },
  linha: { fontSize: 13, color: cores.texto },
  horario: { fontSize: 12, color: cores.textoFraco },
});