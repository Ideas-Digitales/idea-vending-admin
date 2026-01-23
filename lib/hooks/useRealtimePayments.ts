'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notify } from '@/lib/adapters/notification.adapter';
import { useUser } from '@/lib/stores/authStore';
import { usePaymentStore } from '@/lib/stores/paymentStore';
import type { Payment } from '@/lib/interfaces/payment.interface';
import {
  connectPaymentStatusStream,
  mapPaymentStatusToPayment,
  mapSaleEventToPayment,
  isPaymentStatusEvent,
  isSaleEvent,
  type PaymentStatusClient,
  type PaymentStreamStatus,
} from '@/lib/mqtt/payment.service';

export type RealtimePaymentStatus = PaymentStreamStatus | 'idle' | 'disabled';

interface UseRealtimePaymentsOptions {
  autoConnect?: boolean;
  machineId?: number | string | null;
  enterpriseId?: number | string | null;
  brokerUrl?: string;
  showToast?: boolean;
}

interface UseRealtimePaymentsResult {
  status: RealtimePaymentStatus;
  isConnected: boolean;
  lastError: string | null;
  lastEvent: Payment | null;
  lastEventReceivedAt: string | null;
  hasCredentials: boolean;
  connect: () => void;
  disconnect: () => void;
}

export function useRealtimePayments(options?: UseRealtimePaymentsOptions): UseRealtimePaymentsResult {
  const { autoConnect = true, machineId, enterpriseId, brokerUrl, showToast = true } = options ?? {};
  const user = useUser();
  const addRealtimePayment = usePaymentStore((state) => state.addRealtimePayment);

  const [status, setStatus] = useState<RealtimePaymentStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<Payment | null>(null);
  const [lastEventReceivedAt, setLastEventReceivedAt] = useState<string | null>(null);

  const credentials = user?.mqtt_user ?? null;
  const hasCredentials = Boolean(credentials?.username && credentials?.original_password);
  const clientRef = useRef<PaymentStatusClient | null>(null);

  const topicFilter = useMemo(() => {
    const topics: string[] = [];

    if (machineId) {
      topics.push(`machines/${machineId}/payments`);
    }

    if (enterpriseId) {
      topics.push(`enterprises/${enterpriseId}/sales`);
    }

    return topics.length > 0 ? topics : undefined;
  }, [enterpriseId, machineId]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const connect = useCallback(() => {
    disconnect();

    if (!hasCredentials || !credentials) {
      setStatus('disabled');
      const message = 'El usuario autenticado no tiene credenciales MQTT.';
      setLastError(message);
      return;
    }

    try {
      clientRef.current = connectPaymentStatusStream({
        credentials,
        brokerUrl,
        topicFilter,
        onStatusChange: (next) => setStatus(next),
        onError: (error) => {
          setLastError(error.message);
          notify.error(`MQTT Pagos: ${error.message}`);
        },
        onMessage: (event) => {
          let payment: Payment | null = null;

          if (isPaymentStatusEvent(event)) {
            payment = mapPaymentStatusToPayment(event);
          } else if (isSaleEvent(event)) {
            payment = mapSaleEventToPayment(event);
          }

          if (!payment) {
            return;
          }

          const receivedAt = new Date().toISOString();
          setLastEvent(payment);
          setLastEventReceivedAt(receivedAt);
          addRealtimePayment(payment);

          if (showToast) {
            notify.success(
              `${payment.product ?? 'Producto'} · ${payment.successful ? 'aprobado' : 'rechazado'}`,
            );
          }
        },
      });
      setLastError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al conectar a MQTT de pagos.';
      setLastError(message);
      setStatus('disabled');
      notify.error(message);
    }
  }, [addRealtimePayment, brokerUrl, credentials, disconnect, hasCredentials, showToast, topicFilter]);

  useEffect(() => {
    if (!autoConnect) {
      return;
    }

    connect();

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    status,
    isConnected: status === 'connected',
    lastError,
    lastEvent,
    lastEventReceivedAt,
    hasCredentials,
    connect,
    disconnect,
  };
}
