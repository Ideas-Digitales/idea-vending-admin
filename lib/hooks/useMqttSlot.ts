'use client';

import { useCallback, useState } from 'react';
import { useUser } from '@/lib/stores/authStore';
import { notify } from '@/lib/adapters/notification.adapter';
import {
  sendSlotOperation,
  type SlotOperationAction,
  type SlotOperationData,
} from '@/lib/mqtt/slot.service';

interface PublishSlotOperationParams {
  action: SlotOperationAction;
  machineId: number | string;
  slotId: number | string;
  slotData?: SlotOperationData;
}

export function useMqttSlot() {
  const user = useUser();
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const publishSlotOperation = useCallback(
    async ({ action, machineId, slotId, slotData }: PublishSlotOperationParams) => {
      if (!user?.mqtt_user) {
        const message = 'El usuario autenticado no tiene credenciales MQTT.';
        setLastError(message);
        notify.error(message);
        throw new Error(message);
      }

      if (!machineId || !slotId) {
        const message = 'Los parámetros machineId y slotId son obligatorios para MQTT.';
        setLastError(message);
        notify.error(message);
        throw new Error(message);
      }

      setIsPublishing(true);
      setLastError(null);
      const toastId = notify.loading('Sincronizando slot vía MQTT...');

      try {
        await sendSlotOperation({
          action,
          machineId,
          slotId,
          slotData,
          credentials: user.mqtt_user,
        });

        notify.update(toastId, 'Operación MQTT de slot enviada correctamente.', 'success');
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo enviar la operación MQTT del slot.';
        setLastError(message);
        notify.update(toastId, message, 'error');
        throw error;
      } finally {
        setIsPublishing(false);
      }
    },
    [user?.mqtt_user]
  );

  return {
    publishSlotOperation,
    isPublishing,
    lastError,
    hasCredentials: Boolean(user?.mqtt_user?.username && user?.mqtt_user?.original_password),
  };
}
