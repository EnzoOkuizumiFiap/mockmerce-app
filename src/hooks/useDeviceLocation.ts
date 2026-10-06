import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import type { Coordinate } from '@/types/location';

/**
 * ============================================================================
 * HOOK: POSIÇÃO DO APARELHO
 * ============================================================================
 * Pedir a posição tem TRÊS desfechos:
 *
 *   ok      -> permitido e com coordenada
 *   denied  -> negado
 *   error   -> permitido, mas o GPS não respondeu (prédio, GPS desligado,
 *              emulador sem posição). É o caso que deixa a tela presa em
 *              "Obtendo localização" quando ninguém trata.
 *
 * `idle` = ainda não pedimos (hook desabilitado). `loading` = pedindo agora.
 * A tela distingue "ainda tentando" de "não vai rolar" pelo `status`.
 */
export type LocationStatus = 'idle' | 'loading' | 'ok' | 'denied' | 'error';

/** Sem resposta do GPS neste prazo, desistimos e caímos no desfecho `error`. */
const POSITION_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export function useDeviceLocation(enabled = true) {
  const [position, setPosition] = useState<Coordinate | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  /** false = o sistema não mostra mais o diálogo; só nas Configurações. */
  const [canAskAgain, setCanAskAgain] = useState(true);

  const mounted = useRef(true);
  const statusRef = useRef<LocationStatus>('idle');
  statusRef.current = status;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const request = useCallback(async () => {
    setStatus('loading');
    try {
      // Foreground = só com o app aberto. Não pedimos background.
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!mounted.current) return;
      setCanAskAgain(permission.canAskAgain);

      if (permission.status !== 'granted') {
        setPosition(null);
        setStatus('denied');
        return;
      }

      let coords: Coordinate;
      try {
        // Balanced (~100 m) basta para "qual ponto é o mais perto".
        const current = await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          POSITION_TIMEOUT_MS,
        );
        coords = current.coords;
      } catch {
        // Plano B: última posição conhecida do sistema.
        const last = await Location.getLastKnownPositionAsync();
        if (!last) throw new Error('NO_POSITION');
        coords = last.coords;
      }

      if (!mounted.current) return;
      setPosition({ latitude: coords.latitude, longitude: coords.longitude });
      setStatus('ok');
    } catch {
      if (!mounted.current) return;
      setPosition(null);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (enabled) request();
  }, [enabled, request]);

  /**
   * Se a pessoa negou, foi às Configurações, liberou e voltou ao app, tentamos
   * de novo sozinhos. Só checamos a permissão (sem diálogo) para não reabrir
   * o pedido toda vez que o app voltar ao primeiro plano.
   */
  useEffect(() => {
    if (!enabled) return;
    const subscription = AppState.addEventListener('change', async (next) => {
      if (next !== 'active' || statusRef.current !== 'denied') return;
      const current = await Location.getForegroundPermissionsAsync();
      if (current.status === 'granted') request();
    });
    return () => subscription.remove();
  }, [enabled, request]);

  return { position, status, canAskAgain, retry: request };
}