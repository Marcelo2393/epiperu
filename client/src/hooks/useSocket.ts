/**
 * Hook para la conexión WebSocket via Socket.IO.
 */
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/useAppStore';

export function useSocket(onDataUpdated?: () => void) {
  const socketRef = useRef<Socket | null>(null);
  const { setHasNewData, setToast } = useAppStore();

  useEffect(() => {
    // Conectar al servidor Socket.IO (mismo origen, redirigido por proxy Vite)
    const socket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket.IO] Conectado');
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Desconectado');
    });

    // Notificación de datos nuevos
    socket.on('data:updated', (payload: { timestamp: string; datasets: string[] }) => {
      console.log('[Socket.IO] Datos actualizados:', payload);
      setHasNewData(true);
      if (onDataUpdated) onDataUpdated();
    });

    // Nueva alerta
    socket.on('alert:new', (payload: {
      departamento: string;
      enfermedad: string;
      nivel: string;
    }) => {
      setToast({
        message: `⚠️ Nueva alerta en ${payload.departamento}: ${payload.enfermedad}`,
        type: 'warning',
      });
    });

    // Estado de sincronización
    socket.on('sync:status', (payload: { status: string; ultima_actualizacion: string | null }) => {
      console.log('[Socket.IO] Estado sync:', payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [setHasNewData, setToast, onDataUpdated]);

  return { socket: socketRef.current };
}
