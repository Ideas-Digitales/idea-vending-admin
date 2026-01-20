'use client';

import { useCallback, useState } from 'react';
import { useUser } from '@/lib/stores/authStore';
import { notify } from '@/lib/adapters/notification.adapter';
import { sendMachineReboot } from '@/lib/mqtt/reboot.service';

interface UseMqttRebootOptions {
  force?: boolean;
  brokerUrl?: string;
}

export function useMqttReboot() {
  const user = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const rebootMachine = useCallback(
    async (machineId: number | string, options?: UseMqttRebootOptions) => {
      if (!user?.mqtt_user) {
        const message = 'El usuario autenticado no tiene credenciales MQTT.';
        setLastError(message);
        notify.error(message);
        throw new Error(message);
      }

      setIsLoading(true);
      setLastError(null);
      const toastId = notify.loading('Enviando comando de reinicio...');

      try {
        await sendMachineReboot({
          machineId,
          force: options?.force ?? true,
          brokerUrl: options?.brokerUrl,
          credentials: user.mqtt_user,
        });

        notify.update(toastId, 'Comando de reinicio enviado correctamente.', 'success');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo enviar el reinicio.';
        setLastError(message);
        notify.update(toastId, message, 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.mqtt_user]
  );

  return {
    rebootMachine,
    isLoading,
    lastError,
    hasCredentials: Boolean(user?.mqtt_user?.username && user?.mqtt_user?.original_password),
  };
}
