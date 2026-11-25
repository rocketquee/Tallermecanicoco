# Decisiones técnicas (ADRs) — Apex Elite Motorsport

Registro de las decisiones de diseño que no son obvias a partir del código.
Formato: contexto → decisión → consecuencias → alternativas descartadas.

---

## ADR-001 — Borrado lógico en todas las tablas de negocio

- **Estado:** aceptada
- **Fecha:** 2026-11-15
- **Requisitos:** SEG-07, SEG-06, ORD-11

### Contexto
El taller necesita trazabilidad completa: saber qué se canceló, cuándo y por quién.
Un borrado físico rompe el historial de órdenes, facturas y pagos, y además dejaría
huérfanas las referencias de una auditoría que debe ser confiable.

### Decisión
Ninguna fila se elimina físicamente. Cada tabla lleva `activo TINYINT(1) DEFAULT 1`
y todas las llaves foráneas usan `ON DELETE RESTRICT`. La baja se hace con
`UPDATE ... SET activo = 0`.

### Consecuencias
- Ventajas: historial íntegro, auditoría reconstruible, sin registros huérfanos.
- Costos: **toda consulta debe filtrar `activo = 1`**, incluidos reportes y búsquedas
  por placas o nombre. Si se olvida, aparecen clientes y órdenes "fantasma".
- Los índices únicos deben convivir con registros inactivos: por eso `vehiculos.placas`
  tiene índice **no único**, para permitir reactivar un auto sin violar la restricción.
- Excepción: `bitacora` e `historial_etapas` no tienen `activo` (ver ADR-006).

### Alternativas descartadas
- **Borrado físico con `ON DELETE CASCADE`:** simple, pero destruye la trazabilidad que
  exige SEG-06 y haría imposible auditar cancelaciones.
- **Tabla de archivo histórico separada:** duplica el esquema y complica cada consulta.

---

## ADR-002 — Las fotos se almacenan fuera de la base de datos

- **Estado:** aceptada
- **Fecha:** 2026-11-15
- **Requisitos:** VEH-03, VEH-08

### Contexto
Se guardan hasta 30 fotos por auto, de 10 MB máximo cada una, en tres etapas
(ingreso, proceso y entrega). Con unos 8 autos por semana, esto ronda 2.4 GB
semanales. Meterlas en MySQL haría la base lenta y los respaldos inmanejables.

### Decisión
La base de datos solo guarda metadatos en `fotos_vehiculo`: `url_foto` (ruta o URL),
`etapa`, `firma_conformidad` y `created_at`. Los archivos viven en almacenamiento de
objetos: sistema de archivos local en desarrollo, S3-compatible (MinIO o Cloudflare R2)
en producción.

### Consecuencias
- Ventajas: base ligera, respaldos rápidos, archivos servidos con caché y CDN.
- Costos: hay que respaldar **dos sistemas** y mantener consistencia; si se borra el
  archivo, la fila queda apuntando a una URL rota.
- El límite de 30 fotos y 10 MB **no se puede imponer desde el esquema**; es validación
  de aplicación.
- `url_foto` es `VARCHAR(500)`: suficiente para rutas y URLs firmadas.

### Alternativas descartadas
- **`LONGBLOB` en MySQL:** respaldos gigantes y consultas degradadas.
- **Guardar solo el nombre del archivo:** impide mover el almacenamiento sin migrar datos.

---

## ADR-003 — `mecanico_id` es el responsable; `orden_mecanicos` son los participantes

- **Estado:** aceptada
- **Fecha:** 2026-11-15
- **Requisitos:** ORD-09, ORD-03, REP-03

### Contexto
ORD-09 pide asignar **uno o más** mecánicos a cada orden, y REP-03 necesita repartir
bonos por carga de trabajo. A la vez, la pantalla de órdenes (ORD-03) debe mostrar
"el mecánico" de cada auto de un vistazo, sin joins costosos.

### Decisión
- `ordenes_servicio.mecanico_id` = **mecánico principal o responsable**. FK opcional
  (`NULL` mientras no se asigne).
- `orden_mecanicos` = **todos** los que participan, con `UNIQUE (orden_id, mecanico_id)`
  para impedir asignar dos veces al mismo mecánico.

### Consecuencias
- Ventajas: consulta rápida del responsable sin pasar por la tabla puente; historial
  completo de participación para los bonos.
- Costos: **hay redundancia** y puede desincronizarse. Regla de aplicación: al asignar
  al responsable, insertarlo también en `orden_mecanicos`. No se puede garantizar con
  FK ni trigger sin volver rígido el modelo.
- Si en el futuro el "principal" deja de tener sentido, se elimina la columna y todo
  sigue funcionando con la tabla puente.

### Alternativas descartadas
- **Solo `orden_mecanicos`:** modelo más limpio, pero cada listado de órdenes requiere
  un join extra para saber quién responde.
- **Solo `mecanico_id`:** incumple ORD-09 (varios mecánicos por orden).

---

## ADR-004 — Contraseñas con scrypt (salt decodificado)

- **Estado:** aceptada (provisional)
- **Fecha:** 2026-11-15
- **Requisitos:** SEG-01, SEG-15

### Contexto
Para probar la aplicación hacían falta usuarios reales en la base, pero el backend aún
no existe. En el entorno no había `bcrypt` disponible (Python sin módulos y sin
`bcryptjs` en Node), así que se optó por `crypto.scryptSync`, que es nativo.

### Decisión
Los dos usuarios de `sql/07_datos_prueba.sql` tienen la contraseña `AutoPulse2026!`,
guardada con el formato autocontenido:

```
scrypt$16384$8$1$<salt_base64>$<hash_base64>
```

**Al implementar el backend se conservó scrypt**, porque `hashlib.scrypt` es nativo de
Python/OpenSSL y no requiere dependencias extra; `app/core/security.py` verifica ese
mismo formato. Si más adelante se migra a bcrypt/argon2, el login debe rehashear de
forma transparente. Los hashes de prueba no se reutilizan en producción.

> **Corrección al implementar el login (2026-11-15):** el hash original se había
> generado pasando el salt en base64 **como texto**, no como bytes decodificados, así
> que no validaba con `hashlib.scrypt`. Se regeneraron los hashes de los usuarios de
> prueba con `app.core.security.hash_password` (salt decodificado y distinto por
> usuario) y se actualizó `sql/07_datos_prueba.sql`. La contraseña de prueba sigue
> siendo `AutoPulse2026!`.

### Consecuencias
- Ventajas: datos de prueba funcionales desde hoy, sin dependencias externas.
- Costos: hay **dos esquemas de hash** conviviendo hasta que se implemente el login.
  La capa de autenticación debe validar el prefijo (`scrypt$` vs `$2b$`) o simplemente
  regenerar los hashes.
- Riesgo asumido: `scrypt` es criptográficamente sólido; el problema es de
  estandarización, no de seguridad.
- Nunca se versionan contraseñas reales: únicamente las de desarrollo, y el README lo advierte.

### Alternativas descartadas
- **Texto plano:** inaceptable incluso en desarrollo, porque fija un mal patrón.
- **Hash bcrypt inventado a mano:** habría sido inválido y el login fallaría sin aviso.

---

## ADR-005 — Triggers en lugar de `CHECK` para la regla de `detalle_orden`

- **Estado:** aceptada
- **Fecha:** 2026-11-15
- **Requisitos:** ORD-10, INV-02

### Contexto
Cada línea de `detalle_orden` debe ser **o** mano de obra **o** refacción, nunca ambas
ni ninguna. Lo natural era un `CHECK`. MySQL lo rechazó:

```
Column 'servicio_id' cannot be used in a check constraint ... needed in a foreign key
constraint ... referential action.
```

MySQL prohíbe `CHECK` sobre columnas que participan en una FK con `ON UPDATE CASCADE`.

### Decisión
Dos triggers `BEFORE INSERT` y `BEFORE UPDATE` (`trg_detalle_orden_bi`,
`trg_detalle_orden_bu`) que lanzan `SQLSTATE 45000` si se viola la regla.

### Consecuencias
- Ventajas: la regla se cumple **aunque alguien escriba directo en la base**, no solo
  desde la API.
- Costos: los errores llegan como excepción de trigger y hay que traducirlos a mensajes
  claros en el backend; los triggers se pierden si se recrea la tabla.
- Se probó con un `INSERT` inválido: fue rechazado y no dejó filas.

### Alternativas descartadas
- **Solo validación en la aplicación:** frágil ante scripts y cargas masivas.
- **Quitar `ON UPDATE CASCADE` para permitir el `CHECK`:** rompe la convención del proyecto.

---

## ADR-006 — `bitacora` e `historial_etapas` son logs inmutables

- **Estado:** aceptada
- **Fecha:** 2026-11-15
- **Requisitos:** SEG-06, ORD-06, SEG-20

### Contexto
La auditoría solo sirve si nadie puede alterarla. Estas dos tablas registran hechos
(qué pasó y cuándo), no entidades que evolucionan.

### Decisión
- Solo llevan `created_at`: **no tienen `updated_at` ni `activo`**, a propósito.
- Triggers bloquean `UPDATE` y `DELETE` (`trg_bitacora_bu/bd`,
  `trg_historial_etapas_bu/bd`).
- `TRUNCATE` **no** está bloqueado, para poder limpiar datos de desarrollo.

### Consecuencias
- Ventajas: cumplen SEG-06 de forma verificable, no solo por convención.
- Costos: no se puede corregir un asiento mal capturado; si hay un error, se registra
  uno nuevo que lo explique (así funciona una bitácora real).
- Un `TRUNCATE` accidental borra la auditoría sin dejar rastro: en producción el permiso
  de `DROP`/`TRUNCATE` debe quedar restringido al DBA.

### Alternativas descartadas
- **`updated_at` y `activo` como en el resto:** permitiría "editar la historia".
- **Tabla de auditoría en base separada:** más seguro, pero desproporcionado para el tamaño del proyecto.

---

## ADR-007 — Parámetros de negocio en tabla, no en código

- **Estado:** aceptada
- **Fecha:** 2026-11-15
- **Requisitos:** AUT-08, PAG-06

### Contexto
La tolerancia de reautorización y el umbral de "piezas caras" son decisiones del
negocio que cambiarán con el tiempo. Fijarlos en el código obliga a un despliegue
cada vez que el administrador quiera ajustarlos.

### Decisión
Tabla `parametros` con `clave` única y `valor` como texto. Valores iniciales:
`tolerancia_reautorizacion = 5` (AUT-08) y `umbral_piezas_caras = 25000` (PAG-06).

### Consecuencias
- Ventajas: el administrador ajusta reglas sin tocar código ni redesplegar.
- Costos: `valor` es `VARCHAR`, así que la aplicación debe validar y convertir; un
  valor mal escrito (`"cinco"`) no lo detecta la base.
- Las reglas que dependen de estos parámetros deben leerlos en cada operación, no cachearlos
  indefinidamente.

### Alternativas descartadas
- **Constantes en el código:** requiere despliegue por cada cambio de negocio.
- **Archivo de configuración:** se desincroniza entre servidores y no queda auditado.

---

## ADR-008 — Autenticación con JWT HS256 y privacidad por rol al serializar

- **Estado:** aceptada
- **Fecha:** 2026-11-15
- **Requisitos:** SEG-01 a SEG-05, SEG-15, SEG-17, SEG-18, SEG-19

### Contexto
Los módulos de Vehículos y Órdenes deben nacer protegidos. Además, el rol Mecánico no
puede ver precios ni datos de clientes confidenciales, y el frontend necesita una sesión
sin estado que no dependa de memoria del servidor.

### Decisión
- **Contraseñas:** scrypt con `hashlib` (nativo), formato `scrypt$N$r$p$salt$hash` y
  comparación en tiempo constante. No se agrega `passlib` ni `bcrypt`.
- **Token:** JWT HS256 firmado con `JWT_SECRET_KEY`; claims `sub`, `correo`, `rol`,
  `tipo`, `iat` y `exp`, con vigencia de 480 minutos.
- **Login:** `POST /api/v1/login` (JSON) para el frontend y
  `POST /api/v1/login/token` (formulario OAuth2) para el botón Authorize de Swagger.
- **Autorización:** `get_current_user` recarga el usuario desde la BD en cada petición,
  así una baja o un cambio de rol aplican de inmediato. `requiere_roles` responde 403.
- **Privacidad:** se aplica al serializar (`app/core/privacidad.py`), no en SQL. El
  Mecánico recibe "Cliente confidencial", sin contacto, notas, RFC ni precios; las placas
  y el trabajo asignado se conservan.

### Consecuencias
- Ventajas: sin estado en el servidor, tokens verificables, roles centralizados y
  enmascaramiento reutilizable para los siguientes módulos.
- Costos: un token no se puede revocar antes de expirar salvo dando de baja al usuario
  (lo que sí se valida en cada petición). Si se necesita revocación inmediata, agregar
  una lista negra o tokens cortos con refresh.
- **Órdenes:** el Mecánico solo lista las que tiene como responsable
  (`ordenes_servicio.mecanico_id`) o asignadas en `orden_mecanicos` con
  `activo = 1`; el filtro se aplica en SQL, antes de serializar.
- Pendiente: rate limiting en el login y ocultar a los mecánicos, en el listado de
  clientes, los que no tengan órdenes asignadas (el filtro de órdenes ya existe).
- Nunca se registra la contraseña ni el `password_hash` en logs o respuestas.

### Alternativas descartadas
- **Sesiones en memoria:** no escalan y se pierden al reiniciar.
- **Guardar el rol solo en el token:** un cambio de rol tardaría hasta 8 horas en aplicar.
- **Filtrar la privacidad en SQL con columnas distintas:** duplica consultas y schemas.

---

## ADR-009 — Reporte de avance del mecánico en una sola transacción

- **Estado:** aceptada
- **Fecha:** 2026-11-17
- **Requisitos:** ORD-04, ORD-06, ORD-08, ORD-10, INV-02, INV-05, SEG-18

### Contexto
El mecánico necesita dejar su diagnóstico, registrar las refacciones que consumió y
mover la orden de etapa desde una sola pantalla. Si esas tres operaciones se guardaran
por separado, una falla a mitad de camino dejaría el inventario, el detalle y la etapa
desincronizados.

### Decisión
- Se agrega `ordenes_servicio.diagnostico` (`TEXT`) para el diagnóstico y las notas del
  mecánico. Es un campo distinto de `falla_reportada`, que conserva lo que reportó el
  cliente al ingresar la unidad.
- `POST /api/v1/ordenes/{id}/registrar-avance` recibe diagnóstico, etapa destino y
  refacciones usadas. Todo se ejecuta en una sola transacción:
  1. valida la visibilidad de la orden y el sentido del avance;
  2. bloquea las refacciones con `SELECT ... FOR UPDATE` y valida existencias;
  3. inserta las líneas en `detalle_orden` con el `precio_venta` del catálogo;
  4. descuenta `refacciones.stock_actual` y crea el movimiento de salida;
  5. recalcula los totales de la orden (piezas, mano de obra con descuento VIP, IVA);
  6. registra `historial_etapas` y `bitacora`.
- El frontend nunca envía precios: el backend los resuelve desde el catálogo (SEG-18).
- `GET /api/v1/refacciones` expone solo id, nombre, marca, existencia actual, mínimo y
  bandera de refacción especial, sin importes.
- El Mecánico solo puede avanzar sus propias órdenes y nunca retroceder; el
  Administrador puede corregir hacia atrás. `Entregado` y `Cancelado` se manejan en sus
  flujos propios.

### Consecuencias
- Ventajas: inventario, detalle, etapa y auditoría quedan consistentes o no se guarda
  nada; el reporte del mecánico es atómico y trazable.
- Costos: la operación mantiene locks sobre las refacciones mientras dura la
  transacción; el catálogo debe tener existencias correctas antes de usarlo.
- La migración `sql/09_avance_mecanico.sql` es obligatoria antes de desplegar el
  endpoint, porque el modelo ORM ya mapea la nueva columna.

### Alternativas descartadas
- **Tres endpoints separados (notas, piezas, etapa):** permite estados intermedios
  inconsistentes y complica la auditoría.
- **Guardar las notas en `falla_reportada`:** mezcla la voz del cliente con la del
  mecánico y pierde la distinción entre ambos.
- **Aceptar precios desde el frontend:** rompe SEG-18 y permite manipular importes.

---

## ADR-010 — Surtido de inventario con movimiento y bitácora

- **Estado:** aceptada
- **Fecha:** 2026-11-17
- **Requisitos:** INV-01, INV-02, INV-05, SEG-02, SEG-06

### Contexto
Administrador y Recepción necesitan reponer existencias desde la misma vista de
Inventario. Cambiar `refacciones.stock_actual` con un `UPDATE` directo perdería el
rastro de quién surtió, cuándo y cuánto, y rompería la trazabilidad de INV-05.

### Decisión
- `POST /api/v1/refacciones/{id}/entrada` recibe `cantidad` (1 a 9999) y un `motivo`
  opcional. Solo Administrador y Recepción; el Mecánico recibe 403.
- La fila se bloquea con `SELECT ... FOR UPDATE`, se suma la cantidad y, en la misma
  transacción, se inserta un `movimientos_inventario` de tipo `Entrada` y un asiento en
  `bitacora` con el stock anterior y el nuevo.
- `GET /api/v1/refacciones?disponibles=false` alimenta la tabla de Inventario con
  `stock_actual` y `stock_minimo`; el Mecánico sigue usando `disponibles=true` en su
  modal de avance.
- La vista `/inventario` solo se muestra a Administrador y Recepción. Cada fila tiene
  el botón **Surtir**, que abre un modal con la cantidad sugerida para llegar al mínimo.

### Consecuencias
- Ventajas: toda entrada queda auditada y el stock nunca se modifica sin movimiento.
- Costos: no existe todavía un ajuste negativo ni una corrección de conteo; si se
  necesita, debe agregarse como un movimiento `Ajuste` con motivo obligatorio.
- Las piezas especiales (`es_especial = 1`) siguen el flujo de compra ligada a una
  orden; la vista las marca como «Especial», pero su existencia normalmente es 0.

### Alternativas descartadas
- **Actualizar el stock sin movimiento:** rápido, pero sin trazabilidad (INV-05).
- **Permitir el surtido al Mecánico:** viola la separación de roles (SEG-02).
- **Crear una orden de compra completa desde este módulo:** corresponde al módulo de
  Proveedores y compras; aquí solo se registra la entrada física.
