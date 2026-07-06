'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/auth';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useSocket(userId?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const token = getToken();
    const socket = io(`${SOCKET_URL}/ws/chat`, {
      query: { userId, token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const joinConversa = useCallback((conversaId: string) => {
    socketRef.current?.emit('join-conversa', conversaId);
  }, []);

  const sendMessage = useCallback((conversaId: string, conteudo: string) => {
    socketRef.current?.emit('send-message', { conversaId, conteudo });
  }, []);

  const onNewMessage = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('new-message', callback);
    return () => { socketRef.current?.off('new-message', callback); };
  }, []);

  const onConversaUpdated = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('conversa-updated', callback);
    return () => { socketRef.current?.off('conversa-updated', callback); };
  }, []);

  const onPedidoCriado = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('pedido-criado', callback);
    return () => { socketRef.current?.off('pedido-criado', callback); };
  }, []);

  const onAgendamentoCriado = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('agendamento-criado', callback);
    return () => { socketRef.current?.off('agendamento-criado', callback); };
  }, []);

  return { joinConversa, sendMessage, onNewMessage, onConversaUpdated, onPedidoCriado, onAgendamentoCriado, socket: socketRef };
}
