'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MqttClient } from 'mqtt';
import mqtt from 'mqtt';
import { useUser } from '@/lib/stores/authStore';
import type { MqttUser } from '@/lib/interfaces/machine.interface';

type ConnectionStatus =
  | 'idle'
  | 'missing_credentials'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

type LogLevel = 'info' | 'error';

export interface ConnectionLog {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
}

interface UseMqttConnectionTestResult {
  status: ConnectionStatus;
  logs: ConnectionLog[];
  isConnecting: boolean;
  lastError: string | null;
  brokerUrl: string;
  credentials: MqttUser | null;
  testConnection: () => void;
  disconnect: () => void;
  sendPing: () => void;
  clearLogs: () => void;
}

const DEFAULT_TOPIC = 'diagnostics/connection-test';
const MAX_LOGS = 100;

export function useMqttConnectionTest(): UseMqttConnectionTestResult {
  const user = useUser();
  const credentials = user?.mqtt_user ?? null;
  const brokerUrl = useMemo(() => process.env.NEXT_PUBLIC_MQTT_URL ?? '', []);

  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const clientRef = useRef<MqttClient | null>(null);

  const appendLog = useCallback((message: string, level: LogLevel = 'info') => {
    setLogs((prev) => {
      const newEntry: ConnectionLog = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level,
        message,
      };
      return [newEntry, ...prev].slice(0, MAX_LOGS);
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const cleanupClient = useCallback(
    (logMessage?: string) => {
      if (clientRef.current) {
        clientRef.current.removeAllListeners();
        clientRef.current.end(true);
        clientRef.current = null;
        if (logMessage) {
          appendLog(logMessage);
        }
      }
    },
    [appendLog]
  );

  const disconnect = useCallback(() => {
    cleanupClient('Cliente MQTT desconectado manualmente.');
    setStatus('disconnected');
  }, [cleanupClient]);

  const validatePreconditions = useCallback(() => {
    if (!brokerUrl) {
      setStatus('error');
      const message = 'NEXT_PUBLIC_MQTT_URL no está configurada.';
      setLastError(message);
      appendLog(message, 'error');
      return false;
    }

    if (!credentials?.username || !credentials?.original_password) {
      setStatus('missing_credentials');
      const message = 'El usuario autenticado no tiene credenciales MQTT completas.';
      appendLog(message, 'error');
      return false;
    }

    return true;
  }, [appendLog, brokerUrl, credentials]);

  const bindClientEvents = useCallback(
    (client: MqttClient) => {
      client.on('connect', () => {
        setStatus('connected');
        appendLog('Conexión MQTT establecida correctamente.');
      });

      client.on('error', (error) => {
        setStatus('error');
        const message = `Error de MQTT: ${error.message}`;
        setLastError(message);
        appendLog(message, 'error');
      });

      client.on('close', () => {
        if (status !== 'error') {
          setStatus('disconnected');
        }
        appendLog('Conexión MQTT cerrada.');
      });

      client.on('end', () => {
        appendLog('Sesión MQTT finalizada.');
      });
    },
    [appendLog, status]
  );

  const testConnection = useCallback(() => {
    cleanupClient();

    if (!validatePreconditions()) {
      return;
    }

    if (!credentials) {
      return;
    }

    setStatus('connecting');
    setLastError(null);
    appendLog(`Iniciando conexión a ${brokerUrl} con ${credentials.username}...`);

    try {
      const client = mqtt.connect(brokerUrl, {
        username: credentials.username,
        password: credentials.original_password,
        clientId: credentials.client_id || `admin-test-${Date.now()}`,
        clean: true,
        reconnectPeriod: 0,
        connectTimeout: 10_000,
        keepalive: 30,
      });

      clientRef.current = client;
      bindClientEvents(client);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido al conectar.';
      setStatus('error');
      setLastError(message);
      appendLog(message, 'error');
      cleanupClient();
    }
  }, [appendLog, bindClientEvents, brokerUrl, cleanupClient, credentials, validatePreconditions]);

  const sendPing = useCallback(() => {
    const client = clientRef.current;

    if (!client || !client.connected) {
      appendLog('No hay una conexión activa para enviar el ping.', 'error');
      return;
    }

    const topicSuffix = credentials?.user_id ?? credentials?.client_id ?? 'admin';
    const topic = `${DEFAULT_TOPIC}/${topicSuffix}`;
    const payload = JSON.stringify({
      action: 'ping',
      source: 'idea-vending-admin',
      sentAt: new Date().toISOString(),
    });

    client.publish(topic, payload, { qos: 0 }, (error) => {
      if (error) {
        appendLog(`Error al publicar ping: ${error.message}`, 'error');
        return;
      }
      appendLog(`Ping enviado al topic ${topic}.`);
    });
  }, [appendLog, credentials]);

  useEffect(() => {
    return () => {
      cleanupClient();
    };
  }, [cleanupClient]);

  return {
    status,
    logs,
    isConnecting: status === 'connecting',
    lastError,
    brokerUrl,
    credentials,
    testConnection,
    disconnect,
    sendPing,
    clearLogs,
  };
}
