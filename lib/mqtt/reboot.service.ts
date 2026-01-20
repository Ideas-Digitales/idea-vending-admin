'use client';

import mqtt, { type IClientOptions, type MqttClient } from 'mqtt';
import type { MqttUser } from '@/lib/interfaces/machine.interface';

export interface SendMachineRebootParams {
  machineId: number | string;
  force?: boolean;
  credentials: MqttUser;
  brokerUrl?: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_KEEPALIVE = 30;

export async function sendMachineReboot({
  machineId,
  force = true,
  credentials,
  brokerUrl,
  timeoutMs = DEFAULT_TIMEOUT,
}: SendMachineRebootParams): Promise<void> {
  const url = brokerUrl ?? process.env.NEXT_PUBLIC_MQTT_URL;

  if (!url) {
    throw new Error('NEXT_PUBLIC_MQTT_URL no está configurada.');
  }

  if (!credentials || !credentials.username || !credentials.original_password) {
    throw new Error('El usuario actual no tiene credenciales MQTT completas.');
  }

  const topic = `machines/${machineId}/reboot`;
  const payload = JSON.stringify({
    action: 'command',
    command: 'reboot',
    force,
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    const clientOptions: IClientOptions = {
      username: credentials.username,
      password: credentials.original_password,
      clientId:
        credentials.client_id || `admin-reboot-${machineId}-${Date.now()}`,
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
          cleanup(new Error(`Error al publicar reboot: ${error.message}`));
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
        cleanup(new Error('Conexión MQTT cerrada antes de completar la operación.'));
      }
    });
  });
}
