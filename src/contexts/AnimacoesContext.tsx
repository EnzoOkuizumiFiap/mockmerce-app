/**
 * ---------------------------------------------------------------------------
 * CONTEXTO: CONTROLE DE ANIMAÇÕES E MOVIMENTO (RF-54 / RF-55)
 * ---------------------------------------------------------------------------
 * Três fontes decidem se o app anima:
 *
 *   1. CONSTANTE DO CÓDIGO (RF-55) -> `ANIMACOES_ATIVADAS` em `src/lib/animacoes.ts`
 *      Permite ao avaliador desligar tudo no código para testar a entrega.
 *
 *   2. PREFERÊNCIA DO SISTEMA (RF-54) -> "Reduzir movimento" (AccessibilityInfo)
 *      Respeita a opção de acessibilidade do Android/iOS.
 *
 *   3. PREFERÊNCIA DO USUÁRIO NO APP -> Botão / Switch no Perfil do app
 *      Permite desligar/ligar em tempo de execução para demonstração.
 *
 * O APP PRECISA CONTINUAR 100% USÁVEL COM ANIMAÇÕES DESLIGADAS (RF-55 / Linha 240).
 * ---------------------------------------------------------------------------
 */
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { ANIMACOES_ATIVADAS } from '../lib/animacoes';
import { apagarLocal, guardarLocal, lerLocal } from '../storage/armazenamentoLocal';

const CHAVE_ANIMACOES_DESATIVADAS = 'preferencias.animacoes_desativadas';

interface AnimacoesContextValor {
  /** Se as animações devem rodar agora (combina constante, preferência e acessibilidade) */
  animacoesAtivas: boolean;
  /** Se o usuário ativou/desativou nas preferências do app */
  animacoesLigadas: boolean;
  /** Se "Reduzir movimento" está ligado no sistema operacional */
  reduzirMovimento: boolean;
  /** Constante original de código (RF-55) */
  constanteAtivada: boolean;
  /** Motivo pelo qual estão desligadas, se aplicável */
  motivoDesativada: string | null;
  alternarAnimacoes: () => Promise<void>;
  desligarAnimacoes: () => Promise<void>;
  ligarAnimacoes: () => Promise<void>;
}

const AnimacoesContext = createContext<AnimacoesContextValor>({
  animacoesAtivas: ANIMACOES_ATIVADAS,
  animacoesLigadas: true,
  reduzirMovimento: false,
  constanteAtivada: ANIMACOES_ATIVADAS,
  motivoDesativada: null,
  alternarAnimacoes: async () => {},
  desligarAnimacoes: async () => {},
  ligarAnimacoes: async () => {},
});

export function AnimacoesProvider({ children }: { children: ReactNode }) {
  const [animacoesLigadas, setAnimacoesLigadas] = useState(true);
  const [reduzirMovimento, setReduzirMovimento] = useState(false);

  // 1. Carrega preferência persistida
  useEffect(() => {
    lerLocal<boolean>(CHAVE_ANIMACOES_DESATIVADAS).then((desativadas) => {
      if (desativadas) {
        setAnimacoesLigadas(false);
      }
    });
  }, []);

  // 2. Monitora acessibilidade "Reduzir movimento" do SO (RF-54)
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((ativo) => {
      setReduzirMovimento(ativo);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (ativo) => {
      setReduzirMovimento(ativo);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const desligarAnimacoes = useCallback(async () => {
    await guardarLocal(CHAVE_ANIMACOES_DESATIVADAS, true);
    setAnimacoesLigadas(false);
  }, []);

  const ligarAnimacoes = useCallback(async () => {
    await apagarLocal(CHAVE_ANIMACOES_DESATIVADAS);
    setAnimacoesLigadas(true);
  }, []);

  const alternarAnimacoes = useCallback(async () => {
    if (animacoesLigadas) {
      await desligarAnimacoes();
    } else {
      await ligarAnimacoes();
    }
  }, [animacoesLigadas, desligarAnimacoes, ligarAnimacoes]);

  const animacoesAtivas = ANIMACOES_ATIVADAS && animacoesLigadas && !reduzirMovimento;

  let motivoDesativada: string | null = null;
  if (!ANIMACOES_ATIVADAS) {
    motivoDesativada = 'Desligadas no código pela constante ANIMACOES_ATIVADAS.';
  } else if (reduzirMovimento) {
    motivoDesativada = 'Redução de movimento ativada nas configurações do sistema (Acessibilidade).';
  } else if (!animacoesLigadas) {
    motivoDesativada = 'Animações desligadas nas preferências do aplicativo.';
  }

  return (
    <AnimacoesContext.Provider
      value={{
        animacoesAtivas,
        animacoesLigadas,
        reduzirMovimento,
        constanteAtivada: ANIMACOES_ATIVADAS,
        motivoDesativada,
        alternarAnimacoes,
        desligarAnimacoes,
        ligarAnimacoes,
      }}
    >
      {children}
    </AnimacoesContext.Provider>
  );
}

export function useAnimacoes(): AnimacoesContextValor {
  return useContext(AnimacoesContext);
}
