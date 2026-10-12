import {createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { useAuth } from './AuthContext';
import { navegarPara } from '../navigation/navegacao';
import { buscarMensagens } from '../services/notificacoesService';
import { DadosNotificacao } from '../types/notificacao';
import { exibirNotificacaoLocal, prepararCanalAndroid } from '../lib/notificacoes';

export type StatusNotificacoes =
  | 'verificando'
  | 'nao-solicitada'
  | 'concedida'
  | 'negada';

interface NotificacoesContextValor {
  status: StatusNotificacoes;
  motivo: string | null;
  podeSolicitar: boolean;
  ativar: () => Promise<void>;
  tentarNovamente: () => Promise<void>;
  abrirConfiguracoes: () => Promise<void>;
}

const NotificacoesContext = createContext<NotificacoesContextValor | null>(null);
const CHAVE_PROCESSADAS = '@mockmerce:notificacoes-processadas';

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [status, setStatus] = useState<StatusNotificacoes>('verificando');
  const [motivo, setMotivo] = useState<string | null>(null);
  const [podeSolicitar, setPodeSolicitar] = useState(true);
  const sincronizando = useRef(false);
  const ultimaTratada = useRef<string | null>(null);

  const sincronizar = useCallback(async (forcar = false) => {
    if (!usuario || (!forcar && status !== 'concedida') || sincronizando.current) return;

    sincronizando.current = true;
    setMotivo(null);

    try {
      const chaveUsuario = `${CHAVE_PROCESSADAS}:${usuario.id}`;
      const salvo = await AsyncStorage.getItem(chaveUsuario);
      const processadas = new Set<string>(salvo ? JSON.parse(salvo) as string[] : []);
      const mensagens = await buscarMensagens();

      for (const mensagem of mensagens) {
        if (processadas.has(mensagem.id)) continue;

        // Só marca como processada depois que o agendamento local deu certo.
        await exibirNotificacaoLocal(mensagem);
        processadas.add(mensagem.id);
        await AsyncStorage.setItem(chaveUsuario, JSON.stringify([...processadas]));
      }
    } catch (erro) {
      setMotivo(
        erro instanceof Error
          ? `Não foi possível atualizar as notificações. ${erro.message}`
          : 'Não foi possível atualizar as notificações. Verifique sua conexão e tente novamente.',
      );
    } finally {
      sincronizando.current = false;
    }
  }, [status, usuario]);

  const atualizarPermissao = useCallback(async () => {
    try {
      await prepararCanalAndroid();
      const permissao = await Notifications.getPermissionsAsync();
      setPodeSolicitar(permissao.canAskAgain);

      if (permissao.granted) {
        setStatus('concedida');
        setMotivo(null);
      } else if (permissao.status === 'undetermined') {
        setStatus('nao-solicitada');
        setMotivo('Ative para receber avisos da loja neste aparelho.');
      } else {
        setStatus('negada');
        setMotivo('As notificações estão desativadas. Você pode continuar usando a loja normalmente.');
      }
    } catch {
      setStatus('negada');
      setPodeSolicitar(false);
      setMotivo('Não foi possível verificar a permissão de notificações. Confira as configurações do aparelho.');
    }
  }, []);

  const ativar = useCallback(async () => {
    setMotivo(null);
    try {
      await prepararCanalAndroid();
      const atual = await Notifications.getPermissionsAsync();

      if (atual.granted) {
        setStatus('concedida');
        setPodeSolicitar(atual.canAskAgain);
        return;
      }

      if (!atual.canAskAgain) {
        setStatus('negada');
        setPodeSolicitar(false);
        setMotivo('A permissão não pode ser solicitada novamente pelo app. Use as configurações do aparelho para reativá-la.');
        return;
      }

      const resposta = await Notifications.requestPermissionsAsync();
      setPodeSolicitar(resposta.canAskAgain);

      if (resposta.granted) {
        setStatus('concedida');
        setMotivo(null);
      } else {
        setStatus('negada');
        setMotivo('Permissão negada. O Mockmerce continua funcionando; você pode reativar as notificações nas configurações.');
      }
    } catch {
      setMotivo('Não foi possível solicitar a permissão. Tente novamente nas configurações do perfil.');
    }
  }, []);

  const tentarNovamente = useCallback(async () => {
    await atualizarPermissao();
    const atual = await Notifications.getPermissionsAsync().catch(() => null);
    if (atual?.granted) {
      setStatus('concedida');
      setMotivo(null);
      await sincronizar(true);
      return;
    }
    if (atual?.canAskAgain) {
      await ativar();
      return;
    }
    setStatus('negada');
    setPodeSolicitar(false);
    setMotivo('Abra as configurações do aparelho para reativar as notificações.');
  }, [ativar, atualizarPermissao, sincronizar]);

  const abrirConfiguracoes = useCallback(async () => {
    await Linking.openSettings();
  }, []);

  // Na abertura, apenas consulta a permissão. Não exibe o diálogo sem ação do usuário.
  useEffect(() => {
    void atualizarPermissao();
  }, [atualizarPermissao]);

  // Sincroniza o histórico ao autenticar e quando a permissão fica disponível.
  useEffect(() => {
    if (usuario && status === 'concedida') void sincronizar();
  }, [usuario, status, sincronizar]);

  // Se a pessoa voltar das configurações do sistema, atualiza a permissão.
  useEffect(() => {
    let estadoAnterior: AppStateStatus = AppState.currentState;
    const inscricao = AppState.addEventListener('change', (proximo) => {
      if (estadoAnterior.match(/inactive|background/) && proximo === 'active') {
        void atualizarPermissao();
      }
      estadoAnterior = proximo;
    });
    return () => inscricao.remove();
  }, [atualizarPermissao]);

  // O toque, não o recebimento, é que navega. Inclui o caso de app fechado.
  useEffect(() => {
    function tratarToque(resposta: Notifications.NotificationResponse) {
      const id = resposta.notification.request.identifier;
      if (ultimaTratada.current === id) return;
      ultimaTratada.current = id;
      abrirDaNotificacao(resposta.notification.request.content.data as DadosNotificacao);
    }

    const inscricao = Notifications.addNotificationResponseReceivedListener(tratarToque);
    void Notifications.getLastNotificationResponseAsync().then((resposta) => {
      if (resposta) tratarToque(resposta);
    });

    return () => inscricao.remove();
  }, []);

  return (
    <NotificacoesContext.Provider
      value={{ status, motivo, podeSolicitar, ativar, tentarNovamente, abrirConfiguracoes }}
    >
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes(): NotificacoesContextValor {
  const contexto = useContext(NotificacoesContext);
  if (!contexto) {
    throw new Error('useNotificacoes precisa estar dentro de um NotificacoesProvider');
  }
  return contexto;
}

function abrirDaNotificacao(dados: DadosNotificacao | undefined): void {
  if (!dados) return;

  if (dados.produtoId) {
    navegarPara({
      tela: 'DetalheProduto',
      params: { id: dados.produtoId, nome: 'Produto' },
    });
    return;
  }

  if (dados.rota === 'favoritos') {
    navegarPara({ tela: 'Favoritos' });
    return;
  }

  navegarPara({ tela: 'ListaProdutos' });
}
