'use client';

import { useCallback, useState } from 'react';
import { useUser } from '@/lib/stores/authStore';
import { notify } from '@/lib/adapters/notification.adapter';
import {
  sendProductOperation,
  type ProductOperationAction,
  type ProductOperationPayload,
} from '@/lib/mqtt/product.service';
import type { Producto } from '@/lib/interfaces/product.interface';

export type ProductMqttPayload =
  | ProductOperationPayload
  | Pick<Producto, 'id' | 'enterprise_id' | 'name'>;

export function useMqttProduct() {
  const user = useUser();
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const publishProductOperation = useCallback(
    async (action: ProductOperationAction, product: ProductMqttPayload) => {
      if (!user?.mqtt_user) {
        const message = 'El usuario autenticado no tiene credenciales MQTT.';
        setLastError(message);
        notify.error(message);
        throw new Error(message);
      }

      const normalizedProduct: ProductOperationPayload = {
        id: product.id,
        enterprise_id: product.enterprise_id,
        name: product.name,
      };

      if (!normalizedProduct.id || !normalizedProduct.enterprise_id) {
        const message = 'El producto no tiene campos mínimos para MQTT (id y enterprise_id).';
        setLastError(message);
        notify.error(message);
        throw new Error(message);
      }

      if (action !== 'delete' && !normalizedProduct.name) {
        const message = 'Las operaciones create/update requieren nombre del producto.';
        setLastError(message);
        notify.error(message);
        throw new Error(message);
      }

      setIsPublishing(true);
      setLastError(null);
      const toastId = notify.loading('Sincronizando cambios de producto vía MQTT...');

      try {
        await sendProductOperation({
          action,
          product: normalizedProduct,
          credentials: user.mqtt_user,
        });

        notify.update(toastId, 'Mensaje MQTT enviado correctamente.', 'success');
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo enviar la operación MQTT del producto.';
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
    publishProductOperation,
    isPublishing,
    lastError,
    hasCredentials: Boolean(user?.mqtt_user?.username && user?.mqtt_user?.original_password),
  };
}
