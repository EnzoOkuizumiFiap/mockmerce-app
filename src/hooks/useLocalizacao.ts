/**
 * ---------------------------------------------------------------------------
 * HOOK: LOCALIZACAO DO APARELHO
 * ---------------------------------------------------------------------------
 * Pedir a posicao do usuario tem TRES desfechos, e nao dois:
 *
 *   1. permitido  -> temos a coordenada
 *   2. negado     -> nao temos, e nao adianta insistir
 *   3. erro       -> permitido, mas o GPS nao respondeu (dentro de predio,
 *                    emulador sem posicao configurada, aparelho antigo)
 *
 * O caso 3 e o que quase todo mundo esquece. O app pede a permissao, o
 * usuario aceita, e a tela fica travada para sempre em "Obtendo localizacao"
 * porque `getCurrentPositionAsync` nunca voltou.
 *
 * Por isso este hook expoe um `status` explicito em vez de so `posicao`: a
 * tela precisa conseguir distinguir "ainda estou tentando" de "nao vai rolar".
 *
 * E a regra que vale para qualquer permissao de sistema:
 *
 *   A TELA PRECISA FUNCIONAR SEM A PERMISSAO.
 *
 * Aqui isso significa listar os pontos sem ordenar por distancia. Um app que
 * mostra tela branca quando o usuario clica "Nao permitir" esta quebrado —
 * mesmo que a culpa seja "do usuario".
 * ---------------------------------------------------------------------------
 */
import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { Coordenada } from '../types/localizacao';

export type StatusLocalizacao = 'obtendo' | 'ok' | 'negada' | 'erro';

export function useLocalizacao() {
  const [posicao, setPosicao] = useState<Coordenada | null>(null);
  const [status, setStatus] = useState<StatusLocalizacao>('obtendo');

  const obter = useCallback(async () => {
    setStatus('obtendo');
    try {
      /**
       * "Foreground" = so enquanto o app esta aberto. E o que precisamos.
       *
       * Existe tambem a permissao de background (posicao com o app fechado),
       * que as lojas analisam com lupa e exige justificativa. Nao peca o que
       * voce nao vai usar.
       */
      const { status: permissao } = await Location.requestForegroundPermissionsAsync();

      if (permissao !== 'granted') {
        setStatus('negada');
        return;
      }

      const lida = await Location.getCurrentPositionAsync({
        /**
         * `Balanced` = ~100 m de precisao, resposta rapida, pouca bateria.
         * Para "qual loja e a mais perto" isso basta e sobra; `High` liga o
         * GPS de verdade e pode demorar segundos dentro de um predio.
         */
        accuracy: Location.Accuracy.Balanced,
      });

      setPosicao({
        latitude: lida.coords.latitude,
        longitude: lida.coords.longitude,
      });
      setStatus('ok');
    } catch {
      // Permissao concedida mas leitura falhou (caso 3 la de cima).
      setStatus('erro');
    }
  }, []);

  useEffect(() => {
    obter();
  }, [obter]);

  return {
    posicao,
    status,
    /** Para um botao "tentar de novo" quando deu erro. */
    tentarNovamente: obter,
  };
}
