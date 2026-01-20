'use client';

import mqtt, { type IClientOptions, type MqttClient } from 'mqtt';
import type { MqttUser } from '@/lib/interfaces/machine.interface';

export type SlotOperationAction = 'create' | 'update' | 'delete';

export interface SlotOperationData {
  id: number | string;
  mdb_code?: number;
  label?: string | null;
  product_id?: number | null;
  machine_id?: number | null;
  capacity?: number | null;
  current_stock?: number | null;
}

export interface SendSlotOperationParams {
  action: SlotOperationAction;
  machineId: number | string;
  slotId: number | string;
  slotData?: SlotOperationData;
  credentials: MqttUser;
  brokerUrl?: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_KEEPALIVE = 30;

export async function sendSlotOperation({
  action,
  machineId,
  slotId,
  slotData,
  credentials,
  brokerUrl,
  timeoutMs = DEFAULT_TIMEOUT,
}: SendSlotOperationParams): Promise<void> {
  const url = brokerUrl ?? process.env.NEXT_PUBLIC_MQTT_URL;

  if (!url) {
    throw new Error('NEXT_PUBLIC_MQTT_URL no está configurada.');
  }

  if (!credentials?.username || !credentials?.original_password) {
    throw new Error('El usuario actual no tiene credenciales MQTT completas.');
  }

  if (!slotId) {
    throw new Error('slotId es requerido para operaciones MQTT de slots.');
  }

  if (action !== 'delete') {
    if (!slotData?.mdb_code) {
      throw new Error('Las operaciones create/update requieren mdb_code del slot.');
    }
  }

  const topic = `machines/${machineId}/slots/${slotId}`;
  const payload = JSON.stringify(
    action === 'delete'
      ? {
          action,
          slot: { id: slotId },
        }
      : {
          action,
          slot: {
            id: slotId,
            mdb_code: slotData?.mdb_code,
            label: slotData?.label ?? null,
            product_id: slotData?.product_id ?? null,
            machine_id: slotData?.machine_id ?? null,
            capacity: slotData?.capacity ?? null,
            current_stock: slotData?.current_stock ?? null,
          },
        },
  );

  return new Promise((resolve, reject) => {
    let settled = false;
    const clientOptions: IClientOptions = {
      username: credentials.username,
      password: credentials.original_password,
      clientId: credentials.client_id || `admin-slot-${slotId}-${Date.now()}`,
      clean: true,
      reconnectPeriod: 0,
      connectTimeout: timeoutMs,
      keepalive: DEFAULT_KEEPALIVE,
    };

    const client: MqttClient = mqtt.connect(url, clientOptions);

    const cleanup = (error?: Error) => {
      if (settled) return;
      settled = true;
      client.removeAllListeners();
      client.end(true, () => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    };

    const connectionTimer = setTimeout(() => {
      cleanup(new Error('Timeout al conectar con el broker MQTT.'));
    }, timeoutMs + 1000);

    client.on('connect', () => {
      clearTimeout(connectionTimer);
      client.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) {
          cleanup(new Error(`Error al publicar operación de slot: ${error.message}`));
        } else {
          cleanup();
        }
      });
    });

    client.on('error', (error) => {
      clearTimeout(connectionTimer);
      cleanup(new Error(`Error en cliente MQTT: ${error.message}`));
    });

    client.on('close', () => {
      if (!settled) {
        cleanup(new Error('Conexión MQTT cerrada antes de completar la publicación.'));
      }
    });
  });
}
