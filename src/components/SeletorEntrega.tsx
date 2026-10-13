/**
 * ---------------------------------------------------------------------------
 * SELETOR DE ENTREGA (usado no checkout)
 * ---------------------------------------------------------------------------
 * "Receber em casa" ou "Retirar na loja". Ao escolher retirar, a lista de
 * pontos aparece aqui dentro.
 *
 * Todo o assunto de localizacao mora neste componente, de modo que a tela de
 * checkout so precisa guardar duas coisas: o MODO e o PONTO escolhido.
 *
 * A permissao de localizacao so e pedida quando `modo === 'RETIRADA'`
 * (`habilitado`): a pessoa acabou de dizer que quer retirar, entao entende
 * por que o app pede a posicao.
 * ---------------------------------------------------------------------------
 */
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AvisoLocalizacao } from './AvisoLocalizacao';
import { CartaoPontoRetirada } from './CartaoPontoRetirada';
import { Pressionavel } from './Pressionavel';
import { ehAppError } from '../errors/AppError';
import { usePontosRetirada } from '../hooks/usePontosRetirada';
import { cores } from '../lib/tema';

export type ModoEntrega = 'ENTREGA' | 'RETIRADA';

type Props = {
  modo: ModoEntrega;
  aoMudarModo: (modo: ModoEntrega) => void;
  pontoId: string | null;
  aoEscolherPonto: (id: string) => void;
};

export function SeletorEntrega({ modo, aoMudarModo, pontoId, aoEscolherPonto }: Props) {
  const retirada = modo === 'RETIRADA';

  const pontos = usePontosRetirada({ habilitado: retirada });
  const lista = (pontos.data?.data ?? []).filter((p) => p.active);

  return (
    <View style={e.container}>
      <Text style={e.titulo}>Como voce quer receber?</Text>

      <View style={e.opcoes}>
        <Pressionavel
          style={[e.opcao, !retirada && e.opcaoAtiva]}
          onPress={() => aoMudarModo('ENTREGA')}
          accessibilityRole="button"
          accessibilityState={{ selected: !retirada }}
        >
          <Text style={[e.opcaoTexto, !retirada && e.opcaoTextoAtivo]}>Receber em casa</Text>
        </Pressionavel>

        <Pressionavel
          style={[e.opcao, retirada && e.opcaoAtiva]}
          onPress={() => aoMudarModo('RETIRADA')}
          accessibilityRole="button"
          accessibilityState={{ selected: retirada }}
        >
          <Text style={[e.opcaoTexto, retirada && e.opcaoTextoAtivo]}>Retirar na loja</Text>
        </Pressionavel>
      </View>

      {retirada ? (
        <View style={e.pontos}>
          {pontos.aguardandoLocalizacao || (pontos.isPending && !pontos.isError) ? (
            <View style={e.linhaCarregando}>
              <ActivityIndicator color={cores.primaria} />
              <Text style={e.dica}>
                {pontos.aguardandoLocalizacao
                  ? 'Obtendo sua localizacao...'
                  : 'Buscando pontos de retirada...'}
              </Text>
            </View>
          ) : pontos.isError ? (
            <View style={e.bloco}>
              <Text style={e.erro}>
                {ehAppError(pontos.error)
                  ? pontos.error.mensagem
                  : 'Nao foi possivel carregar os pontos de retirada.'}
              </Text>
              <Pressionavel
                style={e.botaoSecundario}
                onPress={() => pontos.refetch()}
                accessibilityRole="button"
              >
                <Text style={e.botaoSecundarioTexto}>Tentar de novo</Text>
              </Pressionavel>
            </View>
          ) : (
            <>
              <AvisoLocalizacao
                status={pontos.statusLocalizacao}
                podePerguntarDeNovo={pontos.podePerguntarDeNovo}
                aoTentarNovamente={pontos.tentarLocalizacaoNovamente}
              />

              {lista.length === 0 ? (
                <Text style={e.dica}>A loja ainda nao tem pontos de retirada.</Text>
              ) : (
                lista.map((ponto) => (
                  <CartaoPontoRetirada
                    key={ponto.id}
                    ponto={ponto}
                    selecionado={ponto.id === pontoId}
                    aoPressionar={() => aoEscolherPonto(ponto.id)}
                  />
                ))
              )}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const e = StyleSheet.create({
  container: { gap: 10 },
  titulo: { fontSize: 16, fontWeight: '700', color: cores.textoForte },
  opcoes: { flexDirection: 'row', gap: 8 },
  opcao: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: cores.borda,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  opcaoAtiva: { borderColor: cores.primaria, backgroundColor: cores.primaria },
  opcaoTexto: { fontSize: 14, fontWeight: '600', color: cores.texto },
  opcaoTextoAtivo: { color: '#FFFFFF', fontWeight: '700' },
  pontos: { gap: 8 },
  bloco: { gap: 8 },
  linhaCarregando: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dica: { fontSize: 13, color: cores.textoFraco },
  erro: { fontSize: 13, color: cores.perigo },
  botaoSecundario: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: cores.primaria,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  botaoSecundarioTexto: { color: cores.primaria, fontWeight: '700', fontSize: 13 },
});