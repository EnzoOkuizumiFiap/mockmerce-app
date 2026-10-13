/**
 * ---------------------------------------------------------------------------
 * HOOK: LOCALIZACAO DO APARELHO
 * ---------------------------------------------------------------------------
 * Pedir a posicao tem TRES desfechos, e nao dois:
 *
 *   ok      -> permitido e com coordenada
 *   negada  -> o usuario recusou
 *   erro    -> permitido, mas o GPS nao respondeu (predio, GPS desligado,
 *              emulador sem posicao). E o caso que deixa a tela presa em
 *              "Obtendo localizacao" quando ninguem trata.
 *
 * `parado` = nao pedimos ainda (hook desligado). `obtendo` = pedindo agora.
 * A tela distingue "ainda tentando" de "nao vai rolar" pelo `status`.
 *
 * A TELA PRECISA FUNCIONAR SEM A PERMISSAO.
 * ---------------------------------------------------------------------------
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';

import { Coordenada } from '../types/localizacao';

export type StatusLocalizacao = 'parado' | 'obtendo' | 'ok' | 'negada' | 'erro';

/** Sem resposta do GPS neste prazo, desistimos: vira `erro`, nunca trava. */
const PRAZO_GPS_MS = 10_000;

function comPrazo<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('PRAZO_GPS')), ms);
    promessa.then(
      (valor) => {
        clearTimeout(timer);
        resolve(valor);
      },
      (erro) => {
        clearTimeout(timer);
        reject(erro);
      },
    );
  });
}

export function useLocalizacao(habilitada = true) {
  const [posicao, setPosicao] = useState<Coordenada | null>(null);
  const [status, setStatus] = useState<StatusLocalizacao>('parado');
  /** false = o sistema nao mostra mais o dialogo; so nas Configuracoes. */
  const [podePerguntarDeNovo, setPodePerguntarDeNovo] = useState(true);

  const montado = useRef(true);
  const statusRef = useRef<StatusLocalizacao>('parado');
  statusRef.current = status;

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const obter = useCallback(async () => {
    setStatus('obtendo');
    try {
      // Foreground = so com o app aberto. Nao pedimos background.
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (!montado.current) return;
      setPodePerguntarDeNovo(permissao.canAskAgain);

      if (permissao.status !== 'granted') {
        setPosicao(null);
        setStatus('negada');
        return;
      }

      let coords: Coordenada;
      try {
        // Balanced (~100 m) basta para "qual ponto e o mais perto".
        const lida = await comPrazo(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          PRAZO_GPS_MS,
        );
        coords = lida.coords;
      } catch {
        // Plano B: ultima posicao conhecida do sistema.
        const ultima = await Location.getLastKnownPositionAsync();
        if (!ultima) throw new Error('SEM_POSICAO');
        coords = ultima.coords;
      }

      if (!montado.current) return;
      setPosicao({ latitude: coords.latitude, longitude: coords.longitude });
      setStatus('ok');
    } catch {
      if (!montado.current) return;
      setPosicao(null);
      setStatus('erro');
    }
  }, []);

  useEffect(() => {
    if (habilitada) obter();
  }, [habilitada, obter]);

  /**
   * Negou, foi as Configuracoes, liberou e voltou ao app: tentamos sozinhos.
   * So consultamos a permissao (sem dialogo) para nao reabrir o pedido a cada
   * volta ao primeiro plano.
   */
  useEffect(() => {
    if (!habilitada) return;
    const assinatura = AppState.addEventListener('change', async (proximo) => {
      if (proximo !== 'active' || statusRef.current !== 'negada') return;
      const atual = await Location.getForegroundPermissionsAsync();
      if (atual.status === 'granted') obter();
    });
    return () => assinatura.remove();
  }, [habilitada, obter]);

  return { posicao, status, podePerguntarDeNovo, tentarNovamente: obter };
}