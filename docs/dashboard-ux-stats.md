# Estadísticas para potenciar la experiencia del usuario

Este documento resume propuestas de métricas y visualizaciones que pueden incorporarse en el dashboard de Idea Vending para entregar información accionable. Toma como referencia la documentación de la API (`docs/Idea Vending.md`) y agrega ideas que podrían requerir nuevos agregados en el backend.

## Resumen de Métricas para el Dashboard

Esta tabla puede integrarse directamente en el dashboard como guía de roadmap o anexarse como sección auxiliar para que backend y frontend prioricen esfuerzos.

| KPI | Descripción | Fuente / Endpoint | Trabajo pendiente |
| --- | --- | --- | --- |
| Máquinas activas vs. inactivas | Porcentaje y conteo absoluto | `/api/machines` (`status`) | — |
| Tendencia de actividad | Serie temporal diaria/semanal de máquinas online/offline | — | Endpoint histórico o job diario |
| Alertas recientes (offline) | Listado de máquinas offline en las últimas 24 h | `/api/machines` filtrado | — |
| Disponibilidad por empresa | KPI que cruce máquinas activas por empresa | `/api/machines?enterprise_id=` | Agregado backend opcional |
| Ingresos por día / semana | Monto total vendido y número de transacciones | `/sales/summary` (si existe) | Exponer endpoint consolidado |
| Éxito vs. fallos de pago | Porcentaje de operaciones exitosas frente a intentos fallidos | — | Registrar/servir métricas de pagos (`/payments/failures`) |
| Ticket promedio | Valor medio de cada compra | Misma data de ventas | Endpoint agregado si no existe |
| Mapa de calor de horarios | Distribución de ventas por franja horaria | Data de ventas con timestamp | Exponer timestamps si faltan |
| Usuarios activos / inactivos | Basado en `/api/users` (atributo `status`) | `/api/users` | — |
| Roles predominantes | Gráfico de barras o donut usando `role.name` | `/api/users` (`role.name`) | — |
| Adopción por empresa | Conteo de usuarios por `enterprise_id` | `/api/users` + `include=enterprises` | Agregado directo recomendado |
| Alertas de seguridad (last login) | Usuarios sin login en los últimos N días (`last_login`) | `/api/users` (`last_login`) | — |
| Disponibilidad de inventario | Porcentaje de máquinas con stock crítico | — | Endpoint/MQTT de stock en tiempo real |
| Top productos vendidos | Ranking general y por empresa | — | Endpoint de ventas por producto |
| Feedback (NPS / encuestas) | Si se recolectan encuestas, mostrar NPS o promedio de satisfacción | — | Capturar feedback y exponer API |

## 1. Estado operativo de máquinas
- **Máquinas activas vs. inactivas**: porcentaje y conteo absoluto. _Fuente actual: `/api/machines` (campo `status`)._
- **Tendencia de actividad**: serie temporal diaria/semanal con el total de máquinas online/offline. _Requiere endpoint histórico o job que guarde snapshots._
- **Alertas recientes**: listado de máquinas que pasaron a estado `offline` en las últimas 24 h. _Fuente actual: `/api/machines` filtrando por `status !== 'online'` y `updated_at`._
- **Disponibilidad promedio por empresa**: KPI que cruce máquinas activas por empresa. _Se puede derivar hoy consultando `/api/machines?enterprise_id=…`, aunque sería más eficiente un agregado backend._

## 2. Salud de transacciones y pagos
- **Ingresos por día / semana**: monto total vendido y número de transacciones. _Si existe `/sales/summary`, usarlo; de lo contrario, se debe exponer un endpoint consolidado._
- **Tasa de éxito vs. fallos de pago**: porcentaje de operaciones exitosas frente a intentos fallidos. _Requiere que el backend registre y publique métricas de fallos (`/payments/failures`)._
- **Ticket promedio**: valor medio de cada compra para detectar cambios en comportamiento del cliente. _Necesita el mismo agregado de ventas (nuevo endpoint si no existe)._ 
- **Mapa de calor de horarios**: distribución de ventas por franja horaria. _Puede derivarse del endpoint de ventas si expone timestamps; si no, se necesita incorporar esa data._

## 3. Gestión de usuarios y permisos
- **Total de usuarios activos / inactivos**: basado en `/api/users` (atributo `status`).
- **Roles predominantes**: gráfico de barras o donut usando `role.name`. _Fuente actual: `/api/users` con el nuevo formato anidado._
- **Adopción por empresa**: conteo de usuarios por `enterprise_id`. _Posible hoy con `/api/users` + `include=enterprises` (cuando la whitelist lo permita); ideal exponer un agregado directo._
- **Alertas de seguridad**: usuarios sin login en los últimos N días (`last_login`). _Fuente actual: `/api/users`._

## 4. Experiencia del cliente final
- **Disponibilidad de inventario**: porcentaje de máquinas con stock crítico. _Requiere datos de inventario en tiempo real (endpoint nuevo o MQTT)._ 
- **Top productos vendidos**: ranking general y por empresa. _Necesita endpoint de ventas por producto._
- **Feedback del usuario**: si se recolectan encuestas, mostrar NPS o promedio de satisfacción. _Requiere capturar y exponer feedback vía nuevo endpoint._

## 5. Recomendaciones para el backend
1. **Endpoints agregados**: exponer `/dashboard/metrics` que devuelva totales por entidad (máquinas, usuarios, ventas) en un solo payload para reducir round-trips.
2. **Históricos preprocesados**: generar jobs diarios que almacenen totales por fecha, reduciendo el costo de calcular series temporales en línea.
3. **Filtros avanzados**: permitir `include=roles,enterprises` solo a endpoints que lo soporten, documentando la whitelist para evitar errores (caso "roles field is not whitelisted").
4. **Webhooks o MQTT**: emitir eventos cuando una máquina cambie de estado para refrescar dashboards en tiempo real sin pooling agresivo.

## 6. Presentación sugerida en el dashboard
- **Hero metrics**: cuatro tarjetas (máquinas totales, uptime promedio, usuarios activos, ingresos del día).
- **Sección de tendencias**: dos gráficos de línea (ventas y disponibilidad).
- **Alertas & tareas**: tarjetas con los pendientes más urgentes (máquinas offline, pagos fallidos, usuarios sin actividad).
- **Comparativos por empresa**: tabla o gráfico stacked que permita detectar outliers rápidamente.

## 7. Matriz de viabilidad de métricas
| KPI | ¿Disponible hoy? | Fuente / Endpoint | Trabajo pendiente |
| --- | --- | --- | --- |
| Máquinas activas vs. inactivas | Sí | `/api/machines` (`status`) | — |
| Tendencia de actividad | No | — | Endpoint histórico o job diario |
| Alertas recientes (offline) | Sí | `/api/machines` filtrado | — |
| Disponibilidad por empresa | Parcial | `/api/machines?enterprise_id=` | Agregado backend opcional |
| Ingresos por día / semana | Parcial | `/sales/summary` (si existe) | Exponer endpoint consolidado |
| Éxito vs. fallos de pago | No | — | Registrar/servir métricas de pagos (`/payments/failures`) |
| Ticket promedio | Parcial | Misma data de ventas | Endpoint agregado si no existe |
| Mapa de calor de horarios | Parcial | Data de ventas con timestamp | Exponer timestamps si faltan |
| Usuarios activos / inactivos | Sí | `/api/users` (`status`) | — |
| Roles predominantes | Sí | `/api/users` (`role.name`) | — |
| Adopción por empresa | Parcial | `/api/users` + `include=enterprises` | Agregado directo recomendado |
| Alertas de seguridad (last login) | Sí | `/api/users` (`last_login`) | — |
| Disponibilidad de inventario | No | — | Endpoint/MQTT de stock en tiempo real |
| Top productos vendidos | No | — | Endpoint de ventas por producto |
| Feedback (NPS / encuestas) | No | — | Capturar feedback y exponer API |

## 8. Métricas destacadas de productividad

### Máquinas más productivas
- **Descripción**: ranking de máquinas según ingresos o cantidad de ventas en un período (día/semana/mes).
- **Uso para el cliente**: permite identificar ubicaciones exitosas, justificar reposiciones prioritarias y replicar estrategias comerciales.
- **Fuente**: requiere endpoint agregado (p. ej. `/sales/machines/top?range=7d`).
- **Visualización sugerida**: gráfico de barras horizontal mostrando las 5 máquinas con mayor ingreso y un chip de tendencia (↑/↓) vs. período anterior.

### Máquinas menos productivas
- **Descripción**: lista de máquinas con ventas mínimas o inactividad prolongada.
- **Uso**: detectar equipos que necesitan mantenimiento, cambio de ubicación o campañas de activación.
- **Fuente**: mismo endpoint de ventas con filtro inverso.
- **Visualización**: tarjetas compactas con el nombre de la máquina, ubicación y CTA “ver detalles”.

### Tarjeta “Insights rápidos”
- **Campos sugeridos**:
  - `Máquina con mayor ingreso`: nombre + monto.
  - `Máquina con mayor tasa de conversión`: ventas / visitas (si se dispone de visitas).
  - `Máquina con menor stock promedio`: requiere integración de inventario.
- **Notas**: hasta que existan datos reales, se puede mantener como tarjeta estática indicando “próximamente”.

### Métricas para gráficas
1. **Heatmap de productividad diaria**: filas por máquina clave, columnas por día de la semana (valores de ingreso). Ideal para dashboards donde se busca comparar patrones.
2. **Gráfico de dispersión “Ingresos vs. tiempo activo”**: cada punto representa una máquina; ayuda a ver cuáles generan ingresos aun con poco tiempo de actividad o detectar anomalías.
3. **Gráfico de cascada “Contribución por empresa”**: muestra cómo diferentes empresas aportan al total de ingresos.

> **Tip de implementación**: incluso sin datos reales, se pueden crear placeholders en el dashboard (tarjetas con íconos y textos “Conéctate para ver esta métrica”) para comunicar valor y priorizar el desarrollo backend necesario.

Al implementar estas estadísticas se mejora la visibilidad operativa, se detectan problemas antes y se habilita a los equipos comerciales a tomar decisiones basadas en datos. Muchas métricas pueden derivarse de los endpoints existentes, pero para ofrecer una experiencia fluida se recomienda consolidar y preprocesar la información en el backend (batch jobs, materialized views o colas de eventos).
