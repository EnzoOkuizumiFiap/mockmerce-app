/**
 * ---------------------------------------------------------------------------
 * PONTE ENTRE DETALHE E RESUMO
 * ---------------------------------------------------------------------------
 * PROBLEMA QUE ESTE ARQUIVO RESOLVE
 *
 * A listagem trabalha com `ProdutoResumo`; o detalhe recebe `ProdutoDetalhe`.
 * Sao formatos diferentes porque os endpoints devolvem coisas diferentes.
 *
 * Mas os favoritos guardam UM formato so — o resumo, que e o que o card
 * precisa desenhar. Entao, quando o usuario favorita a partir da tela de
 * detalhe, alguem precisa converter.
 *
 * Poderiamos ter feito os favoritos guardarem `ProdutoResumo | ProdutoDetalhe`
 * e o card lidar com os dois. O preco disso apareceria em toda leitura:
 * "esse item tem `priceFrom` ou `variants`?". Uma conversao num arquivo so e
 * mais barata que uma duvida em cada tela.
 * ---------------------------------------------------------------------------
 */

import { ProdutoDetalhe, ProdutoResumo } from '../types/produto';

export function resumoDeDetalhe(detalhe: ProdutoDetalhe): ProdutoResumo {
  const precos = detalhe.variants.map((v) => v.price);

  // A imagem principal e a marcada como `isPrimary`; se nenhuma estiver,
  // a primeira serve. Se o produto nao tem imagem nenhuma, null — e o card
  // ja sabe desenhar o espaco vazio.
  const principal = detalhe.images.find((i) => i.isPrimary) ?? detalhe.images[0];

  return {
    id: detalhe.id,
    name: detalhe.name,
    slug: detalhe.slug,
    type: detalhe.type,
    state: detalhe.state,
    brand: detalhe.brand?.name ?? null,
    categoryId: detalhe.category?.id ?? null,

    // O detalhe traz a distribuicao tambem; o resumo so precisa de media e
    // total — e o que o card desenha.
    rating: { average: detalhe.rating.average, count: detalhe.rating.count },

    // `Math.min()` sem argumentos devolve Infinity — por isso o guard.
    // Um produto sem variante nao deveria existir, mas dado real surpreende.
    priceFrom: precos.length ? Math.min(...precos) : 0,
    priceTo: precos.length ? Math.max(...precos) : 0,

    stock: detalhe.variants.reduce((soma, v) => soma + v.stock, 0),
    image: principal?.url ?? null,
    variantsCount: detalhe.variants.length,
  };
}
