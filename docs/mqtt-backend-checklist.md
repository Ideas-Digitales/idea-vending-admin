# Checklist backend MQTT (recepción de topics)

1. **ACL / permisos MQTT**
   - Verificar que el `username` asignado al usuario admin tenga permisos de `SUBSCRIBE`/`READ` para `machines/+/payments` y `enterprises/+/sales` (no sólo `PUBLISH`).
   - Confirmar que las ACL permiten comodines (`+`) cuando se usan en los filtros de topic.

2. **Credenciales y `client_id`**
   - Asegurarse de que el `client_id` entregado al frontend sea único y esté habilitado para conexiones WebSocket.
   - Validar que los parámetros TLS/puerto/certificados coincidan con `wss://mqtt-api-qa.ideasdigitales.dev:8084/mqtt`.

3. **Logs del broker**
   - Revisar los logs inmediatamente después del intento de conexión para detectar `AUTH FAIL`, `SUBSCRIBE FAILED` o cierres forzados.
   - Identificar si el broker cierra el socket por duplicación de `client_id`, límites de conexiones o keepalive expirado.

4. **Retained / QoS**
   - Confirmar que los mensajes de prueba se publiquen con QoS≥1 o con `retain` si se espera verlos tras reconectar.
   - Verificar que el broker no esté rechazando el nuevo campo `id` u otros cambios de esquema.

5. **Proxy / balanceador**
   - Validar que cualquier reverse proxy frente al broker permite WebSockets y no cierre sesiones al terminar el CONNACK.
   - Chequear timeouts de inactividad y headers (`Sec-WebSocket-Protocol`) para asegurar compatibilidad con `mqtt.js`.
