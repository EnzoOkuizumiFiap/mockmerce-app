/**
 * ---------------------------------------------------------------------------
 * CARD DE UMA AVALIACAO
 * ---------------------------------------------------------------------------
 * Componente de APRESENTACAO: recebe dados, devolve pixels. Nao busca nada,
 * nao guarda estado, nao sabe que existe uma API.
 *
 * Isso importa numa FlatList: um componente que faz requisicao por conta
 * propria vira N requisicoes quando a lista rola.
 * ---------------------------------------------------------------------------
 */
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { cores } from '../lib/tema';
import { Avaliacao } from '../types/avaliacao';
import { Estrelas } from './Estrelas';

/** "14/09/2026" a partir do ISO que a API devolve. */
function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function CardAvaliacao({ avaliacao }: { avaliacao: Avaliacao }) {
  // RF-42: Avaliação ocultada pela loja no painel não aparece no app (a menos que seja o próprio autor)
  if (avaliacao.hidden && !avaliacao.isMine) return null;

  return (
    <View style={e.card}>
      <View style={e.cabecalho}>
        <Estrelas nota={avaliacao.rating} tamanho={14} />
        {avaliacao.title ? <Text style={e.titulo}>{avaliacao.title}</Text> : null}
      </View>

      <View style={e.selos}>
        <Text style={e.autor}>{avaliacao.author.name}</Text>
        <Text style={e.data}>{formatarData(avaliacao.createdAt)}</Text>

        {/* O selo so faz sentido porque a API garante a compra — nao e enfeite. */}
        {avaliacao.verifiedPurchase ? (
          <Text style={e.verificada}>📖 Leitor verificado</Text>
        ) : null}

        {avaliacao.isMine ? <Text style={e.minha}>Sua resenha</Text> : null}
      </View>

      {avaliacao.comment ? <Text style={e.comentario}>{avaliacao.comment}</Text> : null}

      {avaliacao.images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={e.fotos}>
          {avaliacao.images.map((foto) => (
            <Image key={foto.id} source={{ uri: foto.url }} style={e.foto} />
          ))}
        </ScrollView>
      ) : null}

      {/* So aparece para o dono: a loja ocultou a avaliacao dele. */}
      {avaliacao.hidden ? (
        <Text style={e.oculta}>Esta resenha foi moderada pela livraria.</Text>
      ) : null}
    </View>
  );
}

const e = StyleSheet.create({
  card: {
    backgroundColor: cores.superficie,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  titulo: { fontSize: 15, fontWeight: '600', color: cores.textoForte, flexShrink: 1 },
  selos: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  autor: { fontSize: 12, color: cores.texto, fontWeight: '500' },
  data: { fontSize: 12, color: cores.textoFraco },
  verificada: { fontSize: 11, color: '#047857', backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  minha: { fontSize: 11, color: cores.primariaEscura, backgroundColor: cores.primariaClara, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  comentario: { fontSize: 14, color: cores.texto, lineHeight: 20 },
  fotos: { marginTop: 2 },
  foto: { width: 72, height: 72, borderRadius: 8, marginRight: 8, backgroundColor: cores.neutroClaro },
  oculta: { fontSize: 12, color: cores.perigo },
});
