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
        return;
      }

      if (!machineId || !slotId) {
        return;
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

        notify.update(toastId, 'Slot sincronizado con la máquina.', 'success');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error MQTT';
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
