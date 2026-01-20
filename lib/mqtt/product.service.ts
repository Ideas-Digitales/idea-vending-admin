'use client';

import mqtt, { type IClientOptions, type MqttClient } from 'mqtt';
import type { MqttUser } from '@/lib/interfaces/machine.interface';

export type ProductOperationAction = 'create' | 'update' | 'delete';

export interface ProductOperationPayload {
  id: number | string;
  enterprise_id: number;
  name?: string;
}

export interface SendProductOperationParams {
  action: ProductOperationAction;
  product: ProductOperationPayload;
  credentials: MqttUser;
  brokerUrl?: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_KEEPALIVE = 30;

export async function sendProductOperation({
  action,
  product,
  credentials,
  brokerUrl,
  timeoutMs = DEFAULT_TIMEOUT,
}: SendProductOperationParams): Promise<void> {
  const url = brokerUrl ?? process.env.NEXT_PUBLIC_MQTT_URL;

  if (!url) {
    throw new Error('NEXT_PUBLIC_MQTT_URL no está configurada.');
  }

  if (!credentials?.username || !credentials?.original_password) {
    throw new Error('El usuario actual no tiene credenciales MQTT completas.');
  }

  if (!product?.id || !product?.enterprise_id) {
    throw new Error('El producto no tiene datos suficientes para MQTT.');
  }

  if (action !== 'delete' && !product?.name) {
    throw new Error('Las operaciones create/update requieren nombre del producto.');
  }

  const topic = `enterprises/${product.enterprise_id}/products/${product.id}`;
  const payload = JSON.stringify({
    action,
    product:
      action === 'delete'
        ? { id: product.id }
        : {
            id: product.id,
            enterprise_id: product.enterprise_id,
            name: product.name,
          },
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    const clientOptions: IClientOptions = {
      username: credentials.username,
      password: credentials.original_password,
      clientId: credentials.client_id || `admin-product-${product.id}-${Date.now()}`,
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
          cleanup(new Error(`Error al publicar operación de producto: ${error.message}`));
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
