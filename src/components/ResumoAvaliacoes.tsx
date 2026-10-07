/**
 * ---------------------------------------------------------------------------
 * RESUMO DAS AVALIACOES
 * ---------------------------------------------------------------------------
 * A "nota grande + barrinhas por estrela" que toda loja tem.
 *
 * Tudo aqui vem PRONTO da API, em `summary`. Nenhuma media e calculada no
 * celular — e nem poderia: a tela tem 20 avaliacoes em cache, a loja pode ter
 * 300. Media calculada sobre a pagina atual e media errada.
 * ---------------------------------------------------------------------------
 */
import { StyleSheet, Text, View } from 'react-native';

import { cores } from '../lib/tema';
import { ResumoNotas } from '../types/avaliacao';
import { Estrelas } from './Estrelas';

export function ResumoAvaliacoes({ resumo }: { resumo: ResumoNotas }) {
  if (resumo.count === 0) {
    return (
      <View style={e.vazio}>
        <Text style={e.textoVazio}>Este produto ainda nao tem avaliacoes.</Text>
      </View>
    );
  }

  return (
    <View style={e.container}>
      <View style={e.bloco}>
        <Text style={e.media}>{resumo.average.toFixed(1)}</Text>
        <Estrelas nota={resumo.average} tamanho={14} />
        <Text style={e.total}>
          {resumo.count} {resumo.count === 1 ? 'avaliacao' : 'avaliacoes'}
        </Text>
      </View>

      <View style={e.barras}>
        {/* De 5 para 1: e a ordem que todo mundo espera ver. */}
        {([5, 4, 3, 2, 1] as const).map((nota) => {
          const quantas = resumo.distribution[String(nota) as '1'] ?? 0;
          // Divisao por zero nao acontece: o count === 0 saiu la em cima.
          const proporcao = quantas / resumo.count;

          return (
            <View key={nota} style={e.linhaBarra}>
              <Text style={e.rotulo}>{nota}</Text>
              <View style={e.trilho}>
                <View style={[e.preenchimento, { width: `${proporcao * 100}%` }]} />
              </View>
              <Text style={e.quantidade}>{quantas}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  container: { flexDirection: 'row', gap: 20, alignItems: 'center', paddingVertical: 12 },
  bloco: { alignItems: 'center', gap: 4, minWidth: 90 },
  media: { fontSize: 36, fontWeight: '700', color: cores.textoForte },
  total: { fontSize: 12, color: cores.textoFraco },
  barras: { flex: 1, gap: 4 },
  linhaBarra: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rotulo: { fontSize: 12, color: cores.textoFraco, width: 10 },
  trilho: { flex: 1, height: 6, borderRadius: 3, backgroundColor: cores.neutroClaro },
  preenchimento: { height: 6, borderRadius: 3, backgroundColor: cores.destaque },
  quantidade: { fontSize: 12, color: cores.textoFraco, width: 22, textAlign: 'right' },
  vazio: { paddingVertical: 16 },
  textoVazio: { fontSize: 14, color: cores.textoFraco },
});
