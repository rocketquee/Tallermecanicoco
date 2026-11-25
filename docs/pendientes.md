# Pendientes del sistema — Apex Elite Motorsport

**Auditoría:** 21 de noviembre de 2026
**Actualización:** 21 de noviembre de 2026 — se cerraron PEN-01, PEN-02, PEN-10 y PEN-12
(mano de obra en la orden, botón de avanzar etapa, edición de vehículos y alta/baja de
refacciones). El detalle está en la sección 1.1.
**Alcance:** frontend (`frontend/src`), backend (`backend/app`), esquema SQL (`sql/`) y documentación.
**Método:** lectura del código, cruce de rutas del frontend contra endpoints del backend,
detección de exportaciones sin uso y compilación real (`npm run build`).

> Esta lista complementa el reporte de práctica. El reporte describe **lo construido**;
> este documento describe **lo que falta** para que el sistema sea 100 % funcional.

---

## 1. Resumen ejecutivo

| Área | Estado | Detalle |
|---|---|---|
| Base de datos | **Completa** | 21 tablas, 6 triggers, 24 llaves foráneas, datos de prueba. |
| Backend | **Parcial** | 32 operaciones sobre 9 módulos (incluye `/` y `/salud`). Faltan los routers de pagos, facturación y autorizaciones. |
| Frontend | **Parcial** | 13 pantallas funcionales y 4 rutas que muestran “Próximamente”. |
| Pruebas automatizadas | **Ausente** | `backend/tests/` existe, pero no contiene pruebas. |
| Documentación | **Completa** | Reporte en Markdown y PDF, diagrama E-R interactivo, ADR, requisitos. |

**Conclusión.** El núcleo operativo —clientes, vehículos, órdenes, inventario y usuarios—
funciona de punta a punta. Lo que falta se concentra en tres frentes:

1. **Dinero:** pagos, facturación y autorizaciones por monto.
2. **Abasto:** proveedores y compras internacionales.
3. **Cierre operativo:** asignación de mecánico, cancelación de órdenes,
   administración de usuarios y consulta de bitácora.

Ninguno de esos faltantes está roto: simplemente no existe todavía.

### 1.1 Cerrados en esta iteración

| ID | Qué se hizo | Dónde |
|---|---|---|
| PEN-01 | Botón **Avanzar Etapa** en el detalle de la orden, visible para Administrador y Mecánico. Al avanzar se recargan los totales recalculados por el backend. | `frontend/src/pages/ordenes/DetalleOrden.tsx`, `services/ordenes.ts` |
| PEN-02 | **Mano de obra en la orden.** `registrar-avance` acepta `servicios[]`, inserta líneas en `detalle_orden` con `servicio_id` y recalcula piezas + mano de obra (con descuento VIP) + IVA. `avanzar-etapa` también recalcula. | `backend/app/routers/ordenes.py`, `schemas/ordenes.py` |
| PEN-10 | **Editar vehículo** con modal que usa `PUT /vehiculos/{id}`. | `frontend/src/pages/vehiculos/EditarVehiculoModal.tsx`, `Vehiculos.tsx`, `services/vehiculos.ts` |
| PEN-12 | **Alta y baja lógica de refacciones.** `POST /refacciones` y `PUT /refacciones/{id}` (`activo = false`). La UI agrega “Nueva refacción” y “Dar de baja”. | `backend/app/routers/refacciones.py`, `schemas/refacciones.py`, `pages/inventario/*` |
| PEN-26 | **Proveedores y compras.** CRUD de proveedores (altas y ediciones solo Administrador), directorio con días de entrega y moneda, órdenes de compra en estado Borrador con totales en moneda original y MXN, fecha estimada de llegada y bitácora. La vista `/proveedores` ya no usa “Próximamente”. | `backend/app/routers/proveedores.py`, `routers/compras.py`, `frontend/src/pages/proveedores/*`, `sql/10_proveedores_demo.sql` |
| — | **Catálogo `GET /servicios`** de solo lectura, sin precios (SEG-18), para que el mecánico elija la mano de obra. Habilita PEN-02 y adelanta parte de PEN-24. | `backend/app/routers/servicios.py`, `frontend/src/services/servicios.ts` |

---

## 2. Módulos que hoy dicen “Próximamente”

Estas cuatro rutas están declaradas en `frontend/src/App.tsx` y usan la pantalla genérica
`pages/sistema/ModuloProximamente.tsx`. **No tienen backend, ni servicio de API, ni pantalla real.**

| ID | Ruta | Módulo | Tablas que ya existen | Qué falta |
|---|---|---|---|---|
| PEN-27 | `/pagos` | Pagos y cobranza | `pagos` | Registrar anticipos, parcialidades y liquidaciones; calcular saldo; validar que la suma no exceda el total; recibo imprimible. |
| PEN-28 | `/facturacion` | Facturación CFDI 4.0 | `facturas` | Captura de datos fiscales, generación de XML/PDF, timbrado con PAC, cancelación y registro de UUID. |
| PEN-29 | `/autorizaciones` | Autorizaciones por monto | `autorizaciones` | Umbral configurable, flujo de solicitud y aprobación, bloqueo de la orden hasta autorizar, historial. |
| PEN-30 | `/reportes` | Reportes e indicadores | — (consultas) | Reportes de ingresos, carga por mecánico, tiempos por etapa, inventario y clientes; exportación a Excel y PDF. |

**Criterio de aceptación de cada uno:** la ruta deja de usar `ModuloProximamente`, tiene
endpoint propio, servicio en `frontend/src/services/`, pantalla con estados de carga/error/vacío
y queda cubierta por la matriz de permisos de `docs/reporte-practica.md`.

---

## 3. Funciones faltantes en módulos que ya existen

### 3.1 Órdenes de servicio (prioridad alta)

| ID | Falta | Evidencia | Impacto |
|---|---|---|---|
| PEN-01 | ~~**Botón para avanzar etapa** desde la interfaz de Administrador y Recepción.~~ **Resuelto:** botón en `DetalleOrden` para Administrador y Mecánico. | `DetalleOrden.tsx` usa `avanzarEtapa()` y recarga los totales. | — |
| PEN-02 | ~~**Alta de mano de obra (servicios) en la orden.**~~ **Resuelto:** `registrar-avance` acepta `servicios[]` y escribe `detalle_orden.servicio_id`. | `routers/ordenes.py` inserta la mano de obra y `_recalcular_totales()` suma piezas + mano de obra + IVA. | — |
| PEN-03 | **Asignar o cambiar mecánico** después de crear la orden. | `OrdenCreate` acepta `mecanico_id`, pero no hay endpoint de actualización ni selector en `DetalleOrden`. | El responsable queda fijo desde el alta; si falta, la orden no se asigna nunca. |
| PEN-04 | **Cancelar una orden con motivo.** | El estado `Cancelado` existe en el `ENUM`; no hay endpoint ni botón. | Las órdenes abandonadas se quedan ocupando bahía. |
| PEN-05 | **Editar una orden** (falla reportada, prioridad). | No hay `PUT /ordenes/{id}`. | Corregir un dato obliga a crear otra orden. |
| PEN-06 | **Fotos del vehículo** en las tres etapas (ingreso, proceso, entrega). | Existe el modelo `fotos_vehiculo`, la carpeta `backend/storage/fotos` y `UPLOAD_DIR` en `.env`, pero **no hay endpoint de carga ni UI**. | Sin evidencia visual del estado del auto al recibirlo y entregarlo. |
| PEN-07 | **Pólizas de seguro** del vehículo. | Modelo `polizas_seguro` creado; sin CRUD ni pantalla. | Se capturan a mano fuera del sistema. |
| PEN-08 | **Historial de etapas visible** en el detalle. | `historial_etapas` se escribe en cada cambio; no hay `GET` ni sección que lo muestre. | La trazabilidad existe en la base, pero el usuario no puede consultarla. |
| PEN-09 | **Exportar la orden a PDF real.** | `DetalleOrden.tsx` usa `window.print()`; no hay plantilla ni generación en servidor. | El PDF depende de la impresora y del navegador del usuario. |

### 3.2 Vehículos

| ID | Falta | Evidencia |
|---|---|---|
| PEN-10 | ~~**Editar vehículo** desde la interfaz.~~ **Resuelto:** `EditarVehiculoModal` usa `PUT /vehiculos/{id}` desde la tabla de vehículos. | `services/vehiculos.ts` expone `actualizarVehiculo()`. |
| PEN-11 | **Ficha del vehículo** con historial de órdenes y fotos. | Solo hay listado y alta (`Vehiculos.tsx`, `NuevoVehiculo.tsx`). |

### 3.3 Inventario

| ID | Falta | Evidencia |
|---|---|---|
| PEN-12 | ~~**Alta y edición de refacciones.**~~ **Resuelto:** `POST /refacciones` y `PUT /refacciones/{id}` (la baja es `activo = false`), con modales de alta y baja en Inventario. | `routers/refacciones.py`, `pages/inventario/NuevaRefaccionModal.tsx` y `BajaRefaccionModal.tsx`. |
| PEN-13 | **Historial de movimientos** por refacción. | `movimientos_inventario` se escribe al surtir; no hay consulta ni pantalla. |
| PEN-14 | **Generar orden de compra** desde la alerta de stock bajo. | El tablero detecta refacciones por reponer y el módulo de compras ya existe, pero falta el atajo desde la alerta. |

### 3.4 Clientes

| ID | Falta | Evidencia |
|---|---|---|
| PEN-15 | **Baja lógica con motivo** como acción explícita. | Hoy se desactiva marcando el checkbox “Cliente activo” dentro de la edición (`ClienteDetalle.tsx`). |

### 3.5 Usuarios, roles y seguridad

| ID | Falta | Evidencia |
|---|---|---|
| PEN-16 | **Alta de usuarios y cambio de rol.** | `Configuracion.tsx` solo lista y restablece contraseña; no hay `POST /usuarios` ni `PUT /usuarios/{id}`. |
| PEN-17 | **Desactivar usuarios** sin borrarlos. | La columna `activo` existe en el modelo; no hay endpoint. |
| PEN-18 | **Bloqueo por intentos fallidos en el servidor.** | Hoy el bloqueo vive en `sessionStorage` (`lib/intentos-login.ts`): se evita borrando el almacenamiento del navegador. `auth.py` lo reconoce como pendiente. |
| PEN-19 | **Rate limiting** en login y endpoints costosos. | No hay middleware ni límite por IP/usuario. |
| PEN-20 | **Refresh token o revocación de JWT.** | El token dura 8 horas y no puede invalidarse antes; al despedir a un empleado su sesión sigue viva. |
| PEN-21 | **Consultar la bitácora** desde la interfaz. | Se escribe en cada operación; no hay endpoint de lectura ni pantalla. |
| PEN-22 | **Auditoría de lecturas de clientes confidenciales** (SEG-20). | Se enmascara la salida, pero no se registra quién consultó qué. |

### 3.6 Catálogos de apoyo

| ID | Falta | Evidencia |
|---|---|---|
| PEN-23 | **CRUD de mecánicos.** | Los mecánicos se cargan con `sql/07` y `sql/08`; no hay endpoint ni pantalla. |
| PEN-24 | **CRUD de servicios y precios.** El catálogo ya se consulta con `GET /servicios` (sin precios, SEG-18), pero no hay alta/edición ni pantalla de administración; sigue llenándose por script. |
| PEN-25 | **Parámetros del sistema editables.** | La tabla `parametros` (tolerancia de reautorización, umbral de piezas caras) no tiene endpoint ni pantalla. |

---

## 4. Deuda técnica

| ID | Tema | Detalle | Prioridad |
|---|---|---|---|
| PEN-31 | **Pruebas automatizadas** | `backend/tests/` solo tiene `__init__.py`. No hay `pytest` en `requirements.txt` ni pruebas de API con `TestClient`. | Alta |
| PEN-32 | **Capa de servicios** | La lógica vive en `routers/ordenes.py` (23 KB, 5 endpoints y 9 funciones auxiliares). `app/services/` está reservada y documentada, pero vacía. | Media |
| PEN-33 | **Migraciones** | `alembic` está en `requirements.txt`, pero no existe carpeta `alembic/` ni versiones. El esquema se aplica con `sql/`. | Media |
| PEN-34 | **CORS** | No hay `CORSMiddleware`. En desarrollo funciona por el proxy de Vite; un despliegue con frontend y API en dominios distintos fallaría. | Media |
| PEN-35 | **Manejo global de errores** | Cada router repite `try/except SQLAlchemyError`. Conviene un *exception handler* único y respuestas homogéneas. | Media |
| PEN-36 | **Logging** | Solo hay `print` en el *lifespan*. No hay logs estructurados ni correlación de peticiones. | Baja |
| PEN-37 | **Documentación duplicada** | `documentacion-tecnica/reporte-practica.md` (119 KB) convive con `docs/reporte-practica.md`. Hay que decidir cuál es la fuente de verdad y archivar la otra. | Baja |
| PEN-38 | **Integración continua** | No hay flujo que ejecute `tsc`, `eslint` y `pytest` en cada push. | Baja |
| PEN-39 | **Código muerto** | `python-multipart` y `UPLOAD_DIR` están instalados/configurados pero sin uso hasta implementar PEN-06. | Baja |

---

## 5. Orden sugerido de trabajo

| Fase | Objetivo | Incluye |
|---|---|---|
| **1. Cierre operativo** | Que una orden pueda cobrarse completa y cerrarse. | PEN-03 → PEN-04 (PEN-02 y PEN-01 resueltos; PEN-24 solo lectura) |
| **2. Dinero** | Cobrar y facturar. | PEN-27 (pagos) → PEN-29 (autorizaciones) → PEN-28 (facturación) |
| **3. Abasto** | Reponer inventario con proveedores reales. | PEN-14 (compra desde la alerta) → recepción de compra que sume stock → PEN-12 |
| **4. Visibilidad** | Reportes, bitácora y evidencia fotográfica. | PEN-30 (reportes) → PEN-21 → PEN-06 → PEN-08 → PEN-13 |
| **5. Calidad** | Sostenibilidad del sistema. | PEN-31 (pruebas) → PEN-38 (CI) → PEN-33 (migraciones) → PEN-36/PEN-37/PEN-39 |

> El orden no es casual: la mano de obra y el avance de etapa ya están resueltos; falta
> reasignar y cancelar órdenes para que el flujo operativo quede completo.

---

## 6. Criterio para declarar el sistema “100 % funcional”

- [ ] Las 5 rutas de “Próximamente” tienen pantalla y endpoint propios.
- [x] Una orden suma mano de obra y refacciones, y su total coincide con la suma de sus líneas.
- [ ] Administrador y Recepción pueden avanzar, cancelar y reasignar una orden. (Avanzar ya existe; faltan cancelar y reasignar.)
- [ ] Un pago parcial actualiza el saldo y no permite cobrar de más.
- [ ] Una factura se timbra, se guarda el UUID y se puede cancelar.
- [ ] Los usuarios se crean, cambian de rol y se desactivan desde Configuración.
- [ ] El login se bloquea en el servidor tras N intentos fallidos.
- [ ] Existen pruebas automatizadas de los flujos críticos y corren en CI.
- [ ] `README.md` y `docs/pendientes.md` reflejan el estado real.

---

## 7. Cómo se hizo esta auditoría

| Verificación | Resultado |
|---|---|
| Compilación del frontend (`npm run build`) | Correcta después de reorganizar carpetas. |
| Cruce rutas del frontend ↔ endpoints del backend | 13 pantallas contra 32 operaciones; sin llamadas a endpoints inexistentes. |
| Exportaciones sin uso | Ninguna: `avanzarEtapa()`, `actualizarVehiculo()`, `crearRefaccion()` y `actualizarRefaccion()` ya tienen consumidor. |
| Modelos sin router | `pagos`, `facturas`, `autorizaciones`, `fotos_vehiculo`, `polizas_seguro`, `parametros`, `mecanicos`, `bitacora`, `historial_etapas`, `movimientos_inventario`. (`servicios` tiene consulta de solo lectura; `proveedores` y `compras` ya tienen router.) |
| Archivos duplicados en `models/`, `schemas/`, `routers/` | Ninguno: un archivo por tabla o por módulo. |
| Archivos sueltos en `pages/` y `components/` | Ninguno: 17 páginas en 8 subcarpetas y 21 componentes en 6 subcarpetas. |
| Importaciones de `App.tsx` | Todas apuntan a las rutas nuevas; `tsc -b` y `eslint` sin errores. |
| Carpetas temporales (`__pycache__`, `dist`, HTML intermedio) | Eliminadas. |

**No verificado:** no hubo acceso a la base viva (credenciales del MCP rechazadas), así que los
faltantes se determinaron por análisis estático del código, no ejecutando cada flujo.
