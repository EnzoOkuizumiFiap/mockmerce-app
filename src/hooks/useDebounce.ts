/**
 * ---------------------------------------------------------------------------
 * HOOK: DEBOUNCE
 * ---------------------------------------------------------------------------
 * Atrasa a atualizacao de um valor ate ele parar de mudar por X milissegundos.
 *
 * POR QUE ISSO EXISTE NA BUSCA:
 *
 *   // ANTES — cada tecla vira uma requisicao
 *   digitar "teclado" -> 7 chamadas a API
 *   as 6 primeiras sao descartadas assim que a 7a chega
 *
 *   // DEPOIS — so a ultima vale
 *   digitar "teclado" -> 1 chamada, 400ms depois da ultima tecla
 *
 * Gasta menos bateria, menos dados do usuario e menos servidor.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react';

export function useDebounce<T>(valor: T, atrasoMs = 400): T {
  const [valorAtrasado, setValorAtrasado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setValorAtrasado(valor), atrasoMs);

    /**
     * A funcao de limpeza cancela o temporizador anterior.
     *
     * E ELA que faz o debounce funcionar: a cada tecla o efeito roda de novo,
     * cancela o timer que estava correndo e comeca outro. So quando o usuario
     * para de digitar por 400ms um timer chega ao fim.
     *
     * Sem essa limpeza, voce teria 7 timers correndo e 7 atualizacoes.
     */
    return () => clearTimeout(temporizador);
  }, [valor, atrasoMs]);

  return valorAtrasado;
}
