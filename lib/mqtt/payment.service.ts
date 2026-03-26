'use client';

import mqtt, { type IClientOptions, type MqttClient } from 'mqtt';
import type { MqttUser } from '@/lib/interfaces/machine.interface';
import type { Payment } from '@/lib/interfaces/payment.interface';

export type PaymentStatusAction = 'payment_status';

export interface PaymentMachineSummaryPayload {
  id: number;
  name: string;
  status: string;
  location?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  type?: string | null;
  enterprise_id?: number | null;
}

export function mapSaleEventToPayment(event: SaleEvent): Payment {
  const { sale } = event;
  const effectiveDate = parseSaleDateToIso(sale);
  const responseCode = normalizeResponseCode(sale.response_code);
  const inferredSuccess = sale.successful ?? responseCode === '00';
  const sharesNumber = sale.shares_number ?? (sale.fees_quantity ? Number(sale.fees_quantity) : null);

  return {
    id: sale.id,
    successful: Boolean(inferredSuccess),
    amount: sale.amount ?? 0,
    date: effectiveDate,
    product: sale.product ?? 'Producto desconocido',
    response_code: responseCode,
    response_message: sale.response_message ?? 'Evento de venta',
    commerce_code: sale.commerce_code ?? 'N/D',
    terminal_id: sale.terminal_id ?? 'N/D',
    authorization_code: sale.authorization_code
      ? String(sale.authorization_code)
      : null,
    last_digits: sale.last_digits ?? '0000',
    operation_number: sale.operation_number ?? `SALE-${sale.id}`,
    card_type: mapCardType(sale.card_type),
    card_brand: sale.card_brand ?? 'Desconocida',
    share_type: sale.share_type ?? null,
    shares_number: sharesNumber ?? null,
    shares_amount: sale.shares_amount ?? null,
    machine_id: sale.machine_id ?? null,
    enterprise_id: sale.enterprise_id ?? null,
    sale_status: null,
    meta: null,
    created_at: effectiveDate,
    updated_at: effectiveDate,
    machine_name: null,
    machine: null,
  };
}

export interface PaymentStatusPayload {
  id?: number | null;
  operation_number?: string | null;
  successful?: boolean | null;
  amount?: number | null;
  date?: string | null;
  product?: string | null;
  response_code?: number | string | null;
  response_message?: string | null;
  commerce_code?: string | null;
  terminal_id?: string | null;
  authorization_code?: number | string | null;
  last_digits?: string | null;
  card_type?: string | null;
  card_brand?: string | null;
  share_type?: string | null;
  shares_number?: number | null;
  shares_amount?: number | null;
  machine_id?: number | null;
  machine_name?: string | null;
  enterprise_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  machine?: PaymentMachineSummaryPayload | null;
}

export interface PaymentStatusEvent {
  action: PaymentStatusAction;
  payment: PaymentStatusPayload;
}

type SaleAction = 'create';

export interface SalePayload {
  id: number;
  successful?: boolean | null;
  amount?: number | null;
  account_number?: string | null;
  accounting_date?: string | null;
  authorization_code?: string | null;
  card_brand?: string | null;
  card_type?: string | null;
  commerce_code?: string | null;
  fee_amount?: number | null;
  fee_gloss?: string | null;
  fee_type?: string | null;
  fees_quantity?: string | null;
  last_digits?: string | null;
  response_code?: string | null;
  response_message?: string | null;
  terminal_id?: string | null;
  ticket_number?: string | null;
  transaction_date?: string | null;
  transaction_time?: string | null;
  machine_id?: number | null;
  enterprise_id?: number | null;
  product_id?: number | null;
  product?: string | null;
  share_type?: string | null;
  shares_number?: number | null;
  shares_amount?: number | null;
  date?: string | null;
  operation_number?: string | null;
}

export interface SaleEvent {
  action: SaleAction;
  sale: SalePayload;
}

export type PaymentStreamEvent = PaymentStatusEvent | SaleEvent;

export type PaymentStreamStatus = 'connecting' | 'connected' | 'disconnected';

export interface PaymentStatusClient {
  disconnect: () => void;
}

interface ConnectPaymentStatusStreamOptions {
  credentials: MqttUser;
  brokerUrl?: string;
  topicFilter?: string | string[];
  timeoutMs?: number;
  keepalive?: number;
  onMessage: (event: PaymentStreamEvent, topic: string) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: PaymentStreamStatus) => void;
}

const DEFAULT_PAYMENT_TOPICS = ['machines/+/payments', 'enterprises/+/sales'];
const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_KEEPALIVE = 30;

const parseSaleDateToIso = (sale: SalePayload): string => {
  if (sale.date) {
    const parsed = new Date(sale.date);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (sale.transaction_date?.length === 6 && sale.transaction_time?.length === 6) {
    const day = Number(sale.transaction_date.slice(0, 2));
    const month = Number(sale.transaction_date.slice(2, 4)) - 1;
    const year = Number(sale.transaction_date.slice(4, 6)) + 2000;
    const hours = Number(sale.transaction_time.slice(0, 2));
    const minutes = Number(sale.transaction_time.slice(2, 4));
    const seconds = Number(sale.transaction_time.slice(4, 6));
    const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    if (!Number.isNaN(utcDate.getTime())) {
      return utcDate.toISOString();
    }
  }

  return new Date().toISOString();
};

const normalizeResponseCode = (code?: string | number | null): string | null => {
  if (code === null || code === undefined) return null;
  if (typeof code === 'number') return String(code).padStart(2, '0');
  return code.trim() || null;
};

export const isPaymentStatusEvent = (event: unknown): event is PaymentStatusEvent => {
  return Boolean(
    event &&
      typeof event === 'object' &&
      (event as PaymentStatusEvent).action === 'payment_status' &&
      typeof (event as PaymentStatusEvent).payment === 'object',
  );
};

export const isSaleEvent = (event: unknown): event is SaleEvent => {
  return Boolean(
    event &&
      typeof event === 'object' &&
      (event as SaleEvent).action === 'create' &&
      typeof (event as SaleEvent).sale === 'object' &&
      typeof (event as SaleEvent).sale.id === 'number',
  );
};

const mapCardType = (cardType?: string | null): string | null => {
  if (!cardType) return null;
  const normalized = cardType.toUpperCase();
  if (normalized === 'DB') return 'debit';
  if (normalized === 'CR') return 'credit';
  return cardType;
};

export function connectPaymentStatusStream({
  credentials,
  brokerUrl,
  topicFilter = DEFAULT_PAYMENT_TOPICS,
  timeoutMs = DEFAULT_TIMEOUT,
  keepalive = DEFAULT_KEEPALIVE,
  onMessage,
  onError,
  onStatusChange,
}: ConnectPaymentStatusStreamOptions): PaymentStatusClient {
  const url = brokerUrl ?? process.env.NEXT_PUBLIC_MQTT_URL;

  if (!url) {
    throw new Error('NEXT_PUBLIC_MQTT_URL no está configurada.');
  }

  if (!credentials?.username || !credentials?.original_password) {
    throw new Error('Las credenciales MQTT están incompletas.');
  }

  const logDebug = (message: string, extra?: Record<string, unknown>) => {
    console.info(`🛰️ [MQTT][Payments] ${message}`, extra ?? '');
  };

  const topics = Array.isArray(topicFilter) ? topicFilter : [topicFilter];
  const uniqueTopics = topics.length > 0 ? Array.from(new Set(topics)) : DEFAULT_PAYMENT_TOPICS;

  logDebug('🚀 Iniciando conexión', {
    url,
    topics: uniqueTopics,
    timeoutMs,
    keepalive,
    username: credentials.username,
    clientId: credentials.client_id,
  });

  onStatusChange?.('connecting');

  const clientOptions: IClientOptions = {
    username: credentials.username,
    password: credentials.original_password,
    clientId: credentials.client_id || `admin-payments-${Date.now()}`,
    clean: true,
    reconnectPeriod: 0,
    connectTimeout: timeoutMs,
    keepalive,
  };

  const client: MqttClient = mqtt.connect(url, clientOptions);

  const cleanup = () => {
    client.removeAllListeners();
    client.end(true);
  };

  client.on('connect', () => {
    logDebug('✅ Conexión establecida, suscribiendo a topics', { topics: uniqueTopics });
    onStatusChange?.('connected');
    client.subscribe(uniqueTopics, { qos: 1 }, (error) => {
      if (error) {
        logDebug('⚠️ Error al suscribirse a los topics', { error: error.message });
        onError?.(new Error(`No se pudo suscribir a los topics de pagos: ${error.message}`));
        cleanup();
        onStatusChange?.('disconnected');
      }
    });
  });

  client.on('message', (topic, payload) => {
    try {
      const rawPayload = payload.toString();
      console.log('💸 [MQTT] Evento de pago recibido', {
        topic,
        payload: rawPayload.slice(0, 200),
      });

      const data = JSON.parse(rawPayload);
      if (isPaymentStatusEvent(data) || isSaleEvent(data)) {
        onMessage(data as PaymentStreamEvent, topic);
      } else {
        logDebug('Evento MQTT desconocido recibido', { topic, rawPayload: rawPayload.slice(0, 200) });
      }
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error
          : new Error('Error desconocido al procesar evento de pago'),
      );
    }
  });

  client.on('error', (error) => {
    logDebug('❌ Evento error recibido desde MQTT', { error: error.message });
  });

  client.on('close', () => {
    logDebug('🔌 Sesión MQTT cerrada por el broker o cliente');
    onStatusChange?.('disconnected');
  });

  client.on('offline', () => {
    logDebug('📴 Cliente MQTT pasó a estado offline');
  });

  client.on('end', () => {
    logDebug('🏁 Cliente MQTT finalizado (end)');
  });

  client.on('reconnect', () => {
    logDebug('🔁 Intento de reconexión MQTT (no debería ocurrir con reconnectPeriod=0)');
  });

  client.on('packetreceive', (packet) => {
    if (packet.cmd === 'connack') {
      logDebug('📩 Paquete CONNACK recibido', { returnCode: packet.returnCode, sessionPresent: packet.sessionPresent });
    }
  });

  client.on('packetsend', (packet) => {
    if (packet.cmd === 'connect') {
      logDebug('📤 Paquete CONNECT enviado al broker');
    }
  });

  client.on('disconnect', (packet) => {
    logDebug('🛑 Broker solicitó desconexión', {
      reasonCode: packet?.reasonCode,
      properties: packet?.properties,
    });
    onStatusChange?.('disconnected');
  });

  return {
    disconnect: cleanup,
  };
}

export function mapPaymentStatusToPayment(event: PaymentStatusEvent): Payment {
  const { payment } = event;
  const fallbackDate = new Date().toISOString();
  const effectiveDate = payment.date ?? payment.created_at ?? fallbackDate;

  return {
    id: payment.id ?? Date.now(),
    successful: Boolean(payment.successful),
    amount: payment.amount ?? 0,
    date: effectiveDate,
    product: payment.product ?? 'Producto desconocido',
    response_code: payment.response_code != null ? String(payment.response_code) : null,
    response_message: payment.response_message ?? 'Sin mensaje',
    commerce_code: payment.commerce_code ?? 'N/D',
    terminal_id: payment.terminal_id ?? 'N/D',
    authorization_code: payment.authorization_code != null ? String(payment.authorization_code) : null,
    last_digits: payment.last_digits ?? '0000',
    operation_number: payment.operation_number ?? `OP-${payment.id ?? Date.now()}`,
    card_type: payment.card_type ?? null,
    card_brand: payment.card_brand ?? 'Desconocida',
    share_type: payment.share_type ?? null,
    shares_number: payment.shares_number ?? null,
    shares_amount: payment.shares_amount ?? null,
    machine_id: payment.machine_id ?? payment.machine?.id ?? null,
    created_at: payment.created_at ?? effectiveDate,
    updated_at: payment.updated_at ?? effectiveDate,
    enterprise_id: payment.enterprise_id ?? payment.machine?.enterprise_id ?? null,
    sale_status: null,
    meta: null,
    machine_name: payment.machine_name ?? payment.machine?.name ?? null,
    machine: payment.machine
      ? {
          id: payment.machine.id,
          name: payment.machine.name,
          status: payment.machine.status,
          location: payment.machine.location ?? 'Ubicación no especificada',
          created_at: payment.machine.created_at ?? effectiveDate,
          updated_at: payment.machine.updated_at ?? effectiveDate,
          type: payment.machine.type ?? 'desconocida',
          enterprise_id: payment.machine.enterprise_id ?? payment.enterprise_id ?? null,
        }
      : null,
  };
}
