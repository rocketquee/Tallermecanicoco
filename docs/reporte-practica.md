# AutoPulse Elite

<p align="center">
  <strong>Sistema de gestión integral para taller de autos de lujo</strong><br>
  Reporte final de práctica · Diseño, implementación y verificación de la base de datos
</p>

## Portada

| Dato | Valor |
|---|---|
| **Proyecto** | AutoPulse Elite — Sistema de gestión para taller de autos de lujo |
| **Cliente / taller** | Pizarro Performance Garage |
| **Autor** | Jonnatan Martinez Aquino |
| **Fecha** | 22 de noviembre de 2026 |
| **Versión del documento** | 1.2 — cierre de criterios de evaluación |
| **Repositorio** | `E:\Tallermecanico` · rama `master` · commit base `d27074f` |
| **Base de datos** | MySQL 8.x · `autopulse_elite` · InnoDB · `utf8mb4_unicode_ci` |
| **Entregables** | Este reporte, su versión en PDF, `docs/diagrama-er-interactivo.html`, `docs/guia-capturas-ingenieria.md` y los scripts `sql/01` a `sql/11` |

**Objetivo del documento.** Consolidar en un solo texto el diseño, la implementación y la
verificación del sistema AutoPulse Elite, con énfasis en la base de datos relacional, los roles,
la seguridad y las evidencias necesarias para demostrar el funcionamiento de punta a punta.

<!-- INDICE -->

<!-- salto-de-pagina -->

---

## 1. Objetivo del sistema

### 1.1 Contexto del negocio

Pizarro Performance Garage atiende autos de lujo y trabaja con clientes VIP y figuras públicas.
La operación diaria se lleva en libretas y hojas de Excel: las órdenes se anotan a mano, el
inventario se revisa de memoria y los pagos se concilian al final del día. Ese esquema produce
tres problemas concretos:

1. **Pérdida de trazabilidad.** No se puede reconstruir quién autorizó una compra, quién movió
   una pieza o cuándo cambió una orden de etapa.
2. **Riesgo de discreción.** El nombre de un cliente público queda visible para cualquier persona
   que abra la libreta o el archivo compartido.
3. **Decisiones sin datos.** El dueño no sabe cuánto vale el inventario detenido, cuántos autos
   están en el taller ni cuánto se ha cobrado.

AutoPulse Elite sustituye ese esquema por una aplicación web con permisos por rol, bitácora
inmutable y una base de datos que impone las reglas de negocio.

### 1.2 Objetivo general

Diseñar e implementar un sistema web de gestión para Pizarro Performance Garage que concentre
clientes, vehículos, órdenes de servicio, inventario y usuarios, con trazabilidad completa,
control de acceso por rol y protección de la información confidencial.

### 1.3 Objetivos específicos

- Modelar en MySQL 8.x un esquema relacional normalizado que soporte la operación completa del
  taller y que impida borrados accidentales.
- Implementar una API REST con FastAPI, autenticación JWT y autorización por rol y por fila.
- Construir una interfaz React + TypeScript usable en computadora, tableta y celular.
- Garantizar que toda operación sensible quede registrada en una bitácora inmutable.
- Documentar el modelo con un diagrama E-R interactivo y un diccionario de datos navegable.

### 1.4 Alcance

**Incluido en esta fase:** autenticación, clientes, vehículos, órdenes de servicio con cuatro
etapas, inventario, usuarios, panel principal y auditoría.

**Fuera de esta fase:** proveedores y compras internacionales, pagos y saldos, facturación CFDI
4.0 con timbrado, reportes exportables, fotos del vehículo y pólizas de seguro. Las tablas de
esos módulos ya existen en el modelo; lo que falta son los endpoints y las pantallas.

---

## 2. Requerimientos

### 2.1 Proceso de levantamiento

Los requisitos se obtuvieron con una entrevista estructurada de **33 preguntas** (P1 a P33) al
dueño del taller. Cada requisito conserva la pregunta que lo originó, de modo que cualquier
decisión de diseño puede rastrearse hasta la conversación que la motivó.

| Documento | Rol | Contenido |
|---|---|---|
| `docs/requisitos.md` | Línea base | 76 requisitos originales (64 funcionales y 12 no funcionales), agrupados en 10 módulos. |
| `docs/requisitos-actualizados.md` | Delta | 23 filas: 7 requisitos modificados y 16 nuevos, surgidos al validar el diseño. |

Prioridad: **Alta** = necesario desde el primer día o crítico para el negocio; **Media** =
durante el primer mes, no bloquea el arranque; **Baja** = deseable.

### 2.2 Resumen cuantitativo

Tras aplicar el delta, el universo consolidado es de **92 requisitos únicos**: **77 funcionales**
y **15 no funcionales**.

| Módulo | Prefijo | Funcionales | No funcionales | Total |
|---|---|:--:|:--:|:--:|
| Clientes | CLI | 8 | 0 | 8 |
| Vehículos | VEH | 7 | 1 | 8 |
| Órdenes de servicio | ORD | 13 | 0 | 13 |
| Inventario | INV | 5 | 0 | 5 |
| Proveedores y compras | PRV | 10 | 0 | 10 |
| Pagos | PAG | 7 | 0 | 7 |
| Facturación | FAC | 6 | 0 | 6 |
| Autorizaciones | AUT | 8 | 0 | 8 |
| Reportes | REP | 6 | 1 | 7 |
| Seguridad | SEG | 7 | 13 | 20 |
| **Total** | | **77** | **15** | **92** |

### 2.3 Requisitos funcionales

#### Clientes (CLI)

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| CLI-01 | Registrar cliente con nombre, dos teléfonos, correo, dirección y nombre de su asistente o chofer. | Recepción, Admin | Alta |
| CLI-02 | Marcar y desmarcar a un cliente como VIP (hoy unos 15). | Admin | Media |
| CLI-03 | Beneficios VIP: prioridad en la fila, 10 % de descuento automático solo en mano de obra, auto de cortesía y recogida a domicilio (CLI-07 y CLI-08). | Sistema, Admin | Media |
| CLI-04 | Asignar al administrador como responsable de atención de los clientes VIP. | Admin | Baja |
| CLI-05 | Buscar clientes por nombre del dueño en menos de 3 segundos, respetando SEG-18. | Todos | Alta |
| CLI-06 | Ver el historial de órdenes, pagos y saldo de cada cliente. | Admin | Media |
| CLI-07 | Módulo de préstamo de auto de cortesía: activo del taller, a quién se prestó, fecha y hora, kilometraje de salida y regreso, y revisión de rayones. | Admin, Recepción | Media |
| CLI-08 | Campo de notas en la orden con la dirección y los datos de recogida a domicilio para el chofer. | Recepción | Media |

#### Vehículos (VEH)

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| VEH-01 | Registrar vehículo con placas, número de serie, marca, modelo, año, color, kilometraje de entrada y valor aproximado. | Recepción | Alta |
| VEH-02 | Asociar cada vehículo a su dueño. | Recepción | Alta |
| VEH-03 | Guardar hasta 30 fotos por auto (máx. 10 MB cada una), clasificadas en ingreso, proceso y entrega; fecha y hora automáticas; las de entrega deben quedar firmadas. | Recepción, Mecánico | Alta |
| VEH-04 | Registrar la póliza de seguro: aseguradora, número, vigencia y cobertura. | Recepción, Admin | Media |
| VEH-05 | Avisar al administrador 30 días antes del vencimiento de una póliza. | Sistema | Media |
| VEH-06 | Buscar vehículo por placas en menos de 3 segundos. | Todos | Alta |
| VEH-07 | Calcular en cualquier momento el valor total de los autos que están dentro del taller (valor en custodia). | Admin | Media |

#### Órdenes de servicio (ORD)

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| ORD-01 | Abrir orden al llegar el auto con dueño, placas, número de serie y falla reportada. | Recepción | Alta |
| ORD-02 | Manejar cuatro etapas: Recibido, Diagnóstico, Reparación y Listo. | Sistema | Alta |
| ORD-03 | Mostrar en una sola pantalla todos los autos en el taller y su etapa. | Admin, Mecánico | Alta |
| ORD-04 | Permitir al mecánico avanzar de diagnóstico a reparación y a listo; recepción solo registra la llegada. | Mecánico, Recepción | Alta |
| ORD-05 | Permitir regresar una orden a una etapa anterior solo al administrador. | Admin | Alta |
| ORD-06 | Alertar al administrador y al mecánico si una orden lleva más de 5 días sin cambiar de etapa. | Sistema | Media |
| ORD-07 | Excluir de la alerta las órdenes en estado "esperando pieza en camino". | Sistema | Media |
| ORD-08 | Registrar en una bitácora quién hizo cada trabajo y a qué hora. | Sistema | Alta |
| ORD-09 | Asignar uno o más mecánicos a cada orden o trabajo. | Admin, Mecánico | Alta |
| ORD-10 | Registrar las piezas usadas y la mano de obra de cada orden. | Mecánico | Alta |
| ORD-11 | Cancelar una orden solo con motivo obligatorio y registro del usuario, sin borrarla. | Admin | Alta |
| ORD-12 | Mostrar las órdenes con retraso. | Admin | Media |
| ORD-13 | Ordenar la fila de trabajo dando prioridad a las órdenes de clientes VIP. | Sistema | Media |

#### Inventario (INV)

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| INV-01 | Llevar un catálogo con existencias de tornillería y consumibles. | Admin | Alta |
| INV-02 | Descontar automáticamente del inventario cada pieza que se asigna a una orden. | Sistema | Alta |
| INV-03 | Alertar cuando una pieza de tornillería o consumibles tenga 2 o menos unidades. | Sistema | Media |
| INV-04 | Tratar las piezas especiales por marca como compras ligadas a una orden, sin existencias en inventario. | Sistema | Alta |
| INV-05 | Ajustar el inventario manualmente solo por el administrador, con motivo y bitácora. | Admin | Baja |

#### Proveedores y compras (PRV)

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| PRV-01 | Registrar proveedores (Italia, Alemania, Inglaterra) con país y contacto. | Admin | Media |
| PRV-02 | Calcular y mostrar el tiempo de entrega de cada proveedor (hoy de 2 a 8 semanas). | Sistema | Media |
| PRV-03 | Registrar cada pedido con su estado y fecha estimada de llegada. | Admin | Alta |
| PRV-04 | Ver la lista de pedidos pendientes con su fecha estimada. | Admin | Alta |
| PRV-05 | Registrar quién solicitó cada pedido y para qué orden. | Sistema | Alta |
| PRV-06 | Generar automáticamente un borrador de orden de compra con las piezas faltantes. | Sistema | Media |
| PRV-07 | Bloquear el envío de la orden de compra sin aprobación del administrador y sin el anticipo del 50 % registrado, cuando aplique. | Sistema, Admin | Alta |
| PRV-08 | Mostrar las piezas que hay que pedir esta semana. | Admin | Media |
| PRV-09 | Registrar cada compra con moneda original (EUR o GBP), costo en esa moneda, tipo de cambio del día y equivalente en pesos. | Admin | Alta |
| PRV-10 | Ocultar a mecánicos y recepción los costos de compra y los tipos de cambio. | Sistema | Alta |

#### Pagos (PAG)

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| PAG-01 | Calcular el costo total como piezas + mano de obra + IVA 16 %, con desglose visible para el cliente. | Sistema | Alta |
| PAG-02 | Aplicar el descuento VIP de 10 % solo a la mano de obra. | Sistema | Media |
| PAG-03 | El anticipo del 50 % es obligatorio cuando el subtotal de piezas supera un umbral configurable (propuesta: $20,000 a $30,000 MXN); el resto se paga al entregar. | Sistema | Alta |
| PAG-04 | Permitir pagos en partes solo a clientes marcados como de confianza. | Admin | Media |
| PAG-05 | Mostrar cuánto ha pagado y cuánto debe cada cliente y cada orden. | Admin | Alta |
| PAG-06 | Parámetro configurable del umbral de "piezas caras". | Admin | Alta |
| PAG-07 | Cobrar siempre al cliente en pesos mexicanos. | Sistema | Alta |

#### Facturación (FAC)

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| FAC-01 | Cerrar la orden y generar la factura con un solo botón. | Admin | Alta |
| FAC-02 | Bloquear el cierre si hay saldo pendiente, salvo autorización expresa del administrador para entregar con saldo. | Sistema | Alta |
| FAC-03 | La factura incluye logotipo, datos fiscales, número de orden y desglose de piezas, mano de obra e IVA, en formato CFDI 4.0. | Sistema | Alta |
| FAC-04 | Impedir editar una factura emitida; su cancelación requiere motivo y usuario. | Admin | Media |
| FAC-05 | Generar el paquete completo de datos para timbrar el CFDI 4.0 (régimen fiscal, uso de CFDI, código postal y demás obligatorios). | Sistema | Alta |
| FAC-06 | Integración directa con un PAC para timbrar desde el sistema. Fase futura, a definir con el contador. | Sistema | Baja |

#### Autorizaciones (AUT)

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| AUT-01 | Exigir autorización del administrador cuando el total de la orden con IVA supere $250,000 MXN. No aplica por pieza suelta. | Sistema | Alta |
| AUT-02 | Bloquear la compra de piezas y el inicio del trabajo hasta que la orden esté autorizada. | Sistema | Alta |
| AUT-03 | Permitir que solo el administrador autorice, sin delegar. | Admin | Alta |
| AUT-04 | Permitir al administrador autorizar la entrega con saldo pendiente. | Admin | Alta |
| AUT-05 | Registrar cada autorización con usuario, fecha, hora y monto. | Sistema | Alta |
| AUT-06 | Mostrar al administrador, también desde celular, las órdenes que esperan su autorización. | Admin | Media |
| AUT-07 | Si el total de una orden ya autorizada sube más allá de la tolerancia, congelar compras y trabajo hasta una nueva autorización. | Sistema, Admin | Alta |
| AUT-08 | Parámetro configurable de tolerancia (5 % o 10 %) para exigir reautorización. | Admin | Media |

#### Reportes (REP)

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| REP-01 | Panel matutino con autos por etapa, piezas que llegan esta semana y órdenes que esperan autorización. | Admin | Media |
| REP-02 | Reporte semanal de lo facturado y lo pendiente de cobro. | Admin | Media |
| REP-03 | Reporte de ingresos generados y carga de trabajo por mecánico, para repartir bonos. | Admin | Baja |
| REP-04 | Reporte de valor en custodia para la aseguradora. | Admin | Media |
| REP-05 | Exportar reportes a Excel y PDF. | Admin | Media |
| REP-07 | Margen por orden: costo real en pesos (con tipo de cambio) contra precio cobrado. | Admin | Baja |

#### Seguridad (SEG, parte funcional)

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| SEG-01 | Autenticar a cada usuario de forma individual con tres roles: Administrador (1), Mecánico (3) y Recepción (1). | Todos | Alta |
| SEG-02 | Ocultar a los mecánicos los precios de cobro y las ganancias. | Sistema | Alta |
| SEG-03 | Ocultar a recepción las finanzas y lo que gana cada mecánico. | Sistema | Alta |
| SEG-04 | Dar al administrador acceso total. | Admin | Alta |
| SEG-16 | Migrar los datos actuales de la libreta y el Excel. | Admin | Baja |
| SEG-17 | Marcar clientes como confidenciales. | Admin | Alta |
| SEG-18 | En órdenes de clientes confidenciales, el mecánico ve solo placas y el trabajo asignado, sin nombre del dueño. | Sistema | Alta |

### 2.4 Requisitos no funcionales

| ID | Requisito | Categoría | Prioridad |
|---|---|---|---|
| SEG-05 | Permisos por rol y por cliente, no solo por rol. | Seguridad | Alta |
| SEG-06 | Bitácora de auditoría inmutable de altas, cambios, cancelaciones y autorizaciones. | Auditabilidad | Alta |
| SEG-07 | Borrado lógico: nada se elimina físicamente. | Integridad | Alta |
| SEG-08 | Respaldo automático diario, con pérdida máxima aceptable de 1 día de datos. | Disponibilidad | Alta |
| SEG-09 | Guardar una copia de los respaldos fuera del taller. | Disponibilidad | Alta |
| SEG-10 | Mostrar una orden o resultado de búsqueda en 2 a 3 segundos como máximo. | Rendimiento | Alta |
| SEG-11 | Interfaz de tableta con botones grandes, apta para manos sucias. | Usabilidad | Alta |
| SEG-12 | Soportar tableta (mecánicos), computadora (recepción) y celular (administrador, solo consulta). | Compatibilidad | Alta |
| SEG-13 | No pedir dos veces el mismo dato al capturar. | Usabilidad | Alta |
| SEG-14 | Dimensionar para 5 usuarios, unos 8 ingresos por semana y 10 autos simultáneos. | Capacidad | Media |
| SEG-15 | Cifrar los datos en tránsito y en reposo. | Seguridad | Media |
| VEH-08 | Almacenar las fotos en un servidor de archivos aparte, no en la base de datos (peor caso: ~300 MB por auto y hasta ~2.4 GB por semana). | Almacenamiento | Media |
| REP-06 | Los reportes pueden entregarse hasta un mes después del arranque. | Alcance | N/A |
| SEG-19 | Aplicar la restricción de datos confidenciales a nivel de base de datos (seguridad por fila), no solo en la interfaz. | Seguridad | Alta |
| SEG-20 | Registrar quién consultó expedientes confidenciales y cuándo. | Auditabilidad | Media |

### 2.5 Requisitos modificados y nuevos

Los siete cambios del delta no son cosméticos: cada uno altera el modelo o el flujo.

| ID | Cambio | Impacto en el diseño |
|---|---|---|
| CLI-03 | El descuento VIP se vuelve automático; cortesía y recogida se separan. | `clientes.categoria` y `descuento_mano_obra`; cálculo en el backend sobre mano de obra. |
| VEH-03 | De "fotos del estado" a expediente de hasta 30 fotos con tres etapas y firma. | `fotos_vehiculo` con `etapa ENUM('Ingreso','Proceso','Entrega')` y `firma_conformidad`. |
| AUT-01 | El umbral de $250,000 se evalúa sobre el total de la orden con IVA. | `ordenes_servicio.requiere_autorizacion` e índice propio. |
| PAG-03 | El anticipo del 50 % depende de un umbral configurable de piezas caras. | `parametros.umbral_piezas_caras` y tabla `autorizaciones`. |
| PRV-07 | El anticipo del 50 % se agrega como condición para enviar la orden de compra. | Validación en el flujo de compras contra `pagos`. |
| FAC-03 | La factura debe cumplir CFDI 4.0. | Columnas fiscales en `clientes` y `facturas` (RFC, razón social, régimen, uso de CFDI, CP, UUID). |
| SEG-05 | Los permisos son por rol **y por cliente**. | `confidencial`, `responsable_id` y enmascaramiento en `core/privacidad.py`. |

Los 16 requisitos nuevos (CLI-07, CLI-08, VEH-08, AUT-07, AUT-08, PAG-06, PAG-07, PRV-09,
PRV-10, FAC-05, FAC-06, REP-07, SEG-17, SEG-18, SEG-19 y SEG-20) ya aparecen en las tablas
anteriores. Responden a cuatro huecos detectados al validar el diseño: préstamo de cortesía,
fotos fuera de la base, reautorización por crecimiento del total y confidencialidad de figuras
públicas.

### 2.6 Trazabilidad requisito → tabla → endpoint

| Módulo | Tablas que lo soportan | Endpoints principales |
|---|---|---|
| Clientes | `clientes` | `GET/POST /api/v1/clientes`, `GET/PUT /api/v1/clientes/{id}` |
| Vehículos | `vehiculos`, `polizas_seguro` | `GET/POST /api/v1/vehiculos`, `GET/PUT /api/v1/vehiculos/{id}` |
| Órdenes | `ordenes_servicio`, `detalle_orden`, `historial_etapas`, `orden_mecanicos`, `fotos_vehiculo` | `GET/POST /api/v1/ordenes`, `GET /api/v1/ordenes/{id}`, `POST /api/v1/ordenes/{id}/avanzar-etapa`, `POST /api/v1/ordenes/{id}/registrar-avance` |
| Inventario | `refacciones`, `movimientos_inventario` | `GET /api/v1/refacciones`, `POST /api/v1/refacciones/{id}/entrada` |
| Proveedores y compras | `proveedores`, `compras`, `detalle_compra` | `GET/POST /api/v1/proveedores`, `GET/POST /api/v1/compras` |
| Pagos | `pagos` | Modelo listo; endpoints en la siguiente fase |
| Facturación | `facturas` | Modelo listo; endpoints en la siguiente fase |
| Autorizaciones | `autorizaciones`, `parametros` | Modelo listo; endpoints en la siguiente fase |
| Reportes | `vehiculos`, `ordenes_servicio` + `fn_valor_en_custodia()` | `GET /api/v1/dashboard/valor-custodia` (REP-01) |
| Seguridad | `usuarios`, `bitacora`, `parametros` | `POST /api/v1/login`, `GET /api/v1/login/me`, `GET /api/v1/usuarios`, `POST /api/v1/usuarios/{id}/restablecer-password` |

### 2.7 Criterio de aceptación del primer día

El cliente fijó un criterio concreto: registrar cliente y auto, abrir una orden, moverla por las
cuatro etapas, descontar piezas y facturar.

| Paso | Requisito | Estado | Cómo se comprueba |
|---|---|:--:|---|
| Registrar cliente | CLI-01 | Sí | `POST /clientes` con nombre, teléfonos, correo y dirección. |
| Registrar auto | VEH-01, VEH-02 | Sí | `POST /vehiculos` con `cliente_id` vigente. |
| Abrir orden | ORD-01 | Sí | `POST /ordenes`; nace en `Recibido`. |
| Mover por las cuatro etapas | ORD-02, ORD-04 | Sí | `avanzar-etapa` y `registrar-avance`. |
| Descontar piezas | INV-02 | Sí | `registrar-avance` inserta en `detalle_orden` y resta `stock_actual`. |
| Facturar | FAC-01 a FAC-03 | Parcial | Tablas y datos fiscales listos; la emisión del documento es de la siguiente fase. |

La única brecha declarada es la emisión del CFDI, que depende de la integración con un PAC
(FAC-06) y de la definición del contador.

---

## 3. Software, lenguajes y herramientas

### 3.1 Criterio de selección

El taller tiene cinco usuarios, unos ocho ingresos por semana y diez autos simultáneos
(SEG-14). Ese tamaño descarta un clúster, colas de mensajes o microservicios. La restricción real
es otra: **el sistema debe ser mantenible por una sola persona y auditable**, porque cada peso
cobrado y cada pieza que sale del almacén debe poder justificarse meses después.

Por eso se eligió una arquitectura de tres capas con tecnologías maduras, gratuitas y con
documentación abundante.

### 3.2 Tecnologías y justificación

| Capa | Tecnología | Versión | Función | Por qué se eligió |
|---|---|---|---|---|
| Datos | **MySQL** | 8.x (InnoDB) | Motor relacional de las 21 tablas, triggers, transacciones y llaves foráneas. | Es el motor relacional más difundido, gratuito en su edición Community, con ACID real en InnoDB, `ENUM` nativo y `utf8mb4`. El taller ya lo conocía. |
| Datos | **MySQL Workbench** | 8.x | Cliente visual para ejecutar scripts, inspeccionar tablas y revisar relaciones. | Permite ejecutar los bloques en orden, validar el diseño y exportar el diagrama E-R sin instalar nada adicional. |
| Backend | **Python** | 3.13.17 | Lenguaje del servidor. | Sintaxis legible, biblioteca estándar suficiente (`hashlib.scrypt`, `hmac`) y un ecosistema de validación que reduce código repetitivo. |
| Backend | **FastAPI** | 0.163.1 | Framework HTTP de la API REST. | Genera OpenAPI en `/docs`, valida con Pydantic y permite declarar permisos por endpoint con dependencias, justo el patrón que exige el control por rol. |
| Backend | **SQLAlchemy** | 2.1.8 | ORM y acceso a datos. | Modelos tipados con `Mapped[...]`, control explícito de transacciones (`flush`, `commit`, `rollback`) y `with_for_update()` para bloquear filas. |
| Backend | **PyMySQL** | 1.2.4 | Driver de conexión. | Implementación pura en Python, sin extensiones nativas; más simple de instalar en Windows. |
| Backend | **Pydantic / pydantic-settings** | 2.14.3 / 2.16.3 | Validación de payloads y configuración. | Rechaza datos inválidos antes de tocar la base y falla al arrancar si falta una variable de entorno. |
| Backend | **PyJWT** | 2.15.1 | Firma y verificación de JWT HS256. | Biblioteca pequeña, sin dependencias pesadas, suficiente para emitir y validar la sesión. |
| Backend | **Uvicorn** | 0.54.0 | Servidor ASGI. | Servidor de referencia para FastAPI, con recarga automática en desarrollo. |
| Backend | **Alembic** | 1.20.1 | Migraciones (disponible). | Se dejó instalado para la evolución futura; en esta fase la fuente de verdad son los scripts `sql/`. |
| Frontend | **React** | 19.3.1 | Biblioteca de interfaz. | Modelo de componentes para reutilizar formularios y tablas; condicionar el render por rol es directo. |
| Frontend | **TypeScript** | 6.0.3 | Tipado estático. | El dominio tiene enums y campos opcionales (precios que el mecánico no ve, `total` que puede ser `null`); el compilador detecta esos casos antes de producción. |
| Frontend | **Tailwind CSS** | 4.3.5 | Estilos utilitarios. | Permite construir la interfaz de tableta con botones grandes (SEG-11) sin hojas de estilo paralelas. |
| Frontend | **Vite** | 8.3.6 | Servidor de desarrollo y empaquetador. | Arranque casi instantáneo y proxy `/api` hacia FastAPI, lo que evita configurar CORS en desarrollo. |
| Frontend | **React Router** | 7.18.5 | Ruteo del lado del cliente. | Rutas protegidas por rol y redirección al login cuando la sesión expira. |
| Frontend | **Axios** | 1.21.1 | Cliente HTTP. | Interceptores para adjuntar el JWT y cerrar la sesión ante un `401`, en un solo lugar. |
| Frontend | **Recharts / Lucide React** | 3.10.1 / 1.73.0 | Gráficas e iconografía. | Recharts cubre los indicadores del tablero; Lucide aporta iconos consistentes y livianos. |
| Desarrollo | **Visual Studio Code** | Última estable | Editor de código. | Depuración integrada de Python y Node, terminal y extensiones de SQLAlchemy y Tailwind en un solo entorno. |
| Desarrollo | **MySQL Workbench** | 8.x | Administración visual de la base. | Ejecuta los scripts, muestra el esquema y permite comprobar las 21 tablas sin escribir consultas. |
| Desarrollo | **OpenCode** | Agente CLI | Asistente de desarrollo. | Se usó como apoyo para revisar el esquema, generar documentación y detectar inconsistencias entre DDL y modelos; las decisiones y la validación final quedaron del lado humano. |
| Desarrollo | **Git** | 2.55.0 | Control de versiones. | Permite reconstruir la evolución del esquema. El commit inicial `2853000` concentra la primera entrega funcional. |

### 3.3 Arquitectura general

```text
┌──────────────────────────────────────────────────────────────┐
│  Navegador (tableta / computadora / celular)                 │
│  React 19 + TypeScript + Tailwind  →  http://localhost:5173  │
└───────────────────────────┬──────────────────────────────────┘
                            │  /api/v1/...  (proxy de Vite)
                            │  Authorization: Bearer <JWT>
┌───────────────────────────▼──────────────────────────────────┐
│  API REST — FastAPI 0.163.1  →  http://127.0.0.1:8000        │
│  Routers: auth · clientes · vehiculos · ordenes ·            │
│           refacciones · usuarios                             │
│  Seguridad: JWT HS256 + requiere_roles()                     │
│  Privacidad: enmascaramiento por rol (SEG-17, SEG-18)        │
└───────────────────────────┬──────────────────────────────────┘
                            │  SQLAlchemy 2.1.8 + PyMySQL
┌───────────────────────────▼──────────────────────────────────┐
│  MySQL 8.x — autopulse_elite · InnoDB · utf8mb4              │
│  21 tablas · 24 relaciones · 6 triggers · bitácora inmutable  │
└──────────────────────────────────────────────────────────────┘
```

La separación es estricta: el frontend nunca ejecuta SQL, el backend nunca renderiza HTML y la
base es la última autoridad sobre la integridad. Cuando una regla puede expresarse en el esquema
(llave foránea, `ENUM`, `UNIQUE`), se expresa ahí; cuando no, se resuelve con un trigger o con
una transacción del backend, y en ambos casos queda documentada.

### 3.4 Herramientas descartadas

| Alternativa | Motivo del descarte |
|---|---|
| Django | El proyecto necesitaba control explícito de transacciones y bloqueos de fila; no requería el admin autogenerado. |
| PostgreSQL | Técnicamente superior en tipos y `CHECK`, pero el taller y el material del curso están orientados a MySQL. |
| MongoDB | El dominio es fuertemente relacional y la auditoría exige integridad referencial. |
| Next.js | No se necesita renderizado en servidor ni SEO; una SPA con Vite es más simple de desplegar. |
| `passlib` / `bcrypt` | `hashlib.scrypt` viene en la biblioteca estándar y evita una dependencia nativa que complica Windows. |
| Docker | Un solo servidor con MySQL local; añadir contenedores sumaba complejidad sin beneficio para cinco usuarios. |

### 3.5 Herramientas de documentación y entrega

La documentación se trata como parte del producto: se versiona junto al código y se puede
regenerar en cualquier momento.

| Herramienta | Versión | Uso en la entrega |
|---|---|---|
| **Markdown** | — | Fuente única del reporte (`docs/reporte-practica.md`); se lee en GitHub y se convierte a PDF sin reescribir contenido. |
| **Mermaid** | 11 | Diagrama E-R de `docs/erd.md` y diagrama de secuencia del inicio de sesión. |
| **HTML + CSS + JavaScript** | HTML5 / ES2020 | Diagrama E-R interactivo, autónomo y sin instalación. |
| **Python + `markdown`** | 3.13 / 3.x | Convierte el reporte a HTML con tablas, código y estilos de impresión (`scripts/generar-pdf.py`). |
| **Microsoft Edge (modo headless)** | Chromium actual | Imprime el HTML a PDF con tamaño A4, sin diálogos y sin dependencias externas. |
| **Git** | 2.55 | Historial del proyecto y trazabilidad de la documentación. |

El flujo completo es reproducible con dos comandos:

```powershell
python -m pip install markdown
python scripts/generar-pdf.py
```

---

## 4. Desarrollo de la base de datos

### 4.1 Organización de los scripts SQL

El esquema se construyó por bloques, en el orden en que las tablas pueden crearse sin violar
llaves foráneas. Cada archivo es ejecutable sobre una base vacía y usa `CREATE TABLE IF NOT
EXISTS`, de modo que volver a correrlo no destruye datos.

| Archivo | Bloque | Tablas que crea | Requisitos que cubre |
|---|---|---|---|
| `sql/01_catalogos.sql` | Catálogos base | `clientes`, `proveedores`, `mecanicos`, `servicios` | CLI-01 a CLI-06, PRV-01, PRV-02, ORD-09, ORD-10 |
| `sql/02_vehiculos.sql` | Vehículos | `vehiculos`, `polizas_seguro` | VEH-01 a VEH-07 |
| `sql/03_inventario.sql` | Inventario y compras | `refacciones`, `compras`, `detalle_compra`, `movimientos_inventario` | INV-01 a INV-05, PRV-03 a PRV-09 |
| `sql/04_ordenes.sql` | Órdenes de servicio | `ordenes_servicio`, `detalle_orden`, `fotos_vehiculo` + triggers XOR | ORD-01 a ORD-13, VEH-03, VEH-08 |
| `sql/05_finanzas.sql` | Finanzas | `pagos`, `facturas`, `autorizaciones` | PAG-01 a PAG-07, FAC-01 a FAC-06, AUT-01 a AUT-08 |
| `sql/06_seguridad.sql` | Seguridad y cierre | `usuarios`, `bitacora`, `orden_mecanicos`, `historial_etapas`, `parametros` + triggers de inmutabilidad | SEG-01 a SEG-07, SEG-17 a SEG-20, ORD-06, ORD-08 |
| `sql/07_datos_prueba.sql` | Datos de prueba | Semillas de catálogos, parámetros y usuarios | Apoyo a desarrollo |
| `sql/08_datos_prueba_extra.sql` | Datos ampliados | 5 clientes, 5 vehículos, 2 mecánicos, 3 servicios y 5 órdenes | Apoyo a desarrollo |
| `sql/09_avance_mecanico.sql` | Evolución | Agrega `ordenes_servicio.diagnostico` de forma idempotente | ORD-04, ORD-10 |
| `sql/10_proveedores_demo.sql` | Proveedores de ejemplo | Cuatro proveedores mexicanos en MXN | PRV-01, PRV-02, PRV-09 |
| `sql/11_procedimientos_funciones.sql` | Rutinas SQL | `sp_calcular_total_orden` y `fn_valor_en_custodia` | ORD-10, VEH-07, REP-01 |

El bloque 9 separa dos conceptos que suenan parecidos pero no lo son: la **falla reportada** es lo
que el cliente cuenta al dejar el auto; el **diagnóstico** es lo que el técnico encuentra al
revisarlo. Mezclarlos habría borrado parte de la historia. El script consulta
`information_schema.COLUMNS` y solo ejecuta el `ALTER TABLE` si la columna no existe.

El bloque 11 se ejecuta al final porque las rutinas dependen de todas las tablas. Es idempotente:
hace `DROP ... IF EXISTS` y vuelve a crear el procedimiento y la función, de modo que puede
aplicarse tantas veces como sea necesario sin duplicar objetos.

### 4.2 Ingeniería inversa: del DDL a los modelos

En este proyecto la ingeniería inversa no consistió en adivinar un esquema desconocido. El DDL
de `sql/` fue la fuente de verdad y los modelos SQLAlchemy se derivaron de él, verificando
después que coincidieran con la base real. El orden fue:

1. **Diseño del DDL por bloques**, con comentarios por columna y requisito asociado.
2. **Creación de los modelos** en `backend/app/models/`, una clase por tabla, con `Mapped[...]`,
   `mapped_column(...)` y `relationship(...)`.
3. **Verificación con el inspector de SQLAlchemy**: se compararon nombres de tablas, columnas,
   tipos, nulabilidad, llaves y valores de `ENUM`.
4. **Ajuste de discrepancias** en el DDL o en el modelo, siempre con el DDL como árbitro.

La verificación es reproducible:

```python
from sqlalchemy import create_engine, inspect

engine = create_engine(
    "mysql+pymysql://usuario:password@localhost:3306/autopulse_elite?charset=utf8mb4"
)
inspector = inspect(engine)

print(len(inspector.get_table_names()))          # 21
for tabla in inspector.get_table_names():
    columnas = inspector.get_columns(tabla)
    fks = inspector.get_foreign_keys(tabla)
    indices = inspector.get_indexes(tabla)
    print(f"{tabla}: {len(columnas)} columnas, {len(fks)} FK, {len(indices)} índices")
```

| Verificación | Resultado |
|---|---|
| Tablas encontradas | 21, iguales al DDL |
| Columnas totales | 218 |
| Relaciones foráneas | 24 |
| Triggers | 6 (2 de exclusividad, 4 de inmutabilidad) |
| Índices secundarios | 59 |
| Tablas sin relaciones | 1 (`parametros`, por diseño) |
| Diferencias DDL ↔ modelo | Ninguna abierta al cierre de esta etapa |

No se usó `alembic revision --autogenerate` porque el esquema inicial se escribió a mano y los
scripts `sql/` son la fuente de verdad. Alembic queda disponible para migraciones futuras.

#### 4.2.1 Técnicas de ingeniería inversa aplicadas

La **ingeniería inversa de bases de datos** consiste en reconstruir el modelo lógico —tablas,
columnas, llaves, índices y relaciones— a partir de una base física ya existente. En este
proyecto se usó como **verificación**, no como descubrimiento: el DDL se diseñó primero y luego se
comprobó que la base real y los modelos coincidieran. Se aplicaron cuatro técnicas
complementarias:

| Técnica | Comando o herramienta | Qué aporta |
|---|---|---|
| DDL exacto de una tabla | `SHOW CREATE TABLE ordenes_servicio;` | Columnas, tipos, `ENUM`, comentarios, índices, llaves foráneas y opciones del motor. |
| Respaldo del esquema | `mysqldump --no-data --routines --triggers autopulse_elite > esquema.sql` | Instantánea completa del esquema, sin datos, para comparar versiones. |
| Modelo visual | MySQL Workbench → *Database* → *Reverse Engineer* | Diagrama E-R generado desde la base real y exportable a PDF o PNG. |
| Inspección programática | `sqlalchemy.inspect(engine)` | Comparación automática entre la base y los modelos del backend. |

Además se consultó `information_schema` para validar los `ENUM` y los valores por defecto, que no
siempre aparecen en el diagrama visual:

```sql
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'autopulse_elite'
ORDER BY TABLE_NAME, ORDINAL_POSITION;
```

**Qué se comparó y con qué resultado:**

| Elemento | Cómo se obtuvo | Resultado |
|---|---|---|
| Nombres y número de tablas | `inspector.get_table_names()` | 21 tablas, iguales al DDL. |
| Columnas, tipos, nulabilidad y valores por defecto | `inspector.get_columns()` | 218 columnas sin diferencias. |
| Llaves primarias | `inspector.get_pk_constraint()` | Una PK por tabla. |
| Llaves foráneas y reglas `ON DELETE` / `ON UPDATE` | `inspector.get_foreign_keys()` | 24 relaciones con `RESTRICT` / `CASCADE`. |
| Índices secundarios | `inspector.get_indexes()` | 59 índices. |
| Triggers | `SHOW TRIGGERS FROM autopulse_elite;` | 6 triggers. |
| Valores de los `ENUM` | `information_schema.COLUMNS` | Iguales a los declarados en los modelos. |

#### 4.2.2 Del DDL de MySQL al modelo SQLAlchemy

La ingeniería inversa se concretó en un archivo por tabla dentro de
`backend/app/models/`. Cada clase hereda de `Base` (declarativa de SQLAlchemy 2.x) y declara
`__tablename__`, columnas con `Mapped[...]` y `mapped_column(...)`, y relaciones con
`relationship(...)`. La regla fue **una columna del DDL, una columna del modelo**, sin inventar
campos ni ocultar restricciones.

**Ejemplo 1: tabla `clientes`.** El DDL físico define el `id`, el nombre, la categoría `ENUM`, el
descuento y el borrado lógico:

```sql
CREATE TABLE clientes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  categoria ENUM('Regular','VIP') NOT NULL DEFAULT 'Regular',
  descuento_mano_obra DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

El modelo equivalente en `backend/app/models/clientes.py` conserva tipo, nulabilidad, valor por
defecto e índice:

```python
class Cliente(Base):
    __tablename__ = "clientes"
    __table_args__ = (
        Index("idx_clientes_nombre", "nombre"),
        Index("idx_clientes_categoria", "categoria"),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4",
         "mysql_collate": "utf8mb4_unicode_ci"},
    )

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), primary_key=True, autoincrement=True
    )
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    categoria: Mapped[str] = mapped_column(
        Enum("Regular", "VIP", name="categoria_cliente"),
        nullable=False,
        server_default="Regular",
    )
    descuento_mano_obra: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, server_default=text("0.00")
    )
    activo: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("1")
    )

    vehiculos: Mapped[list["Vehiculo"]] = relationship(back_populates="cliente")
```

**Ejemplo 2: llave foránea y relación.** En `refacciones`, el proveedor es opcional y la regla de
borrado es `RESTRICT`. El modelo traduce la FK y la relación bidireccional:

```python
proveedor_id: Mapped[int | None] = mapped_column(
    INTEGER(unsigned=True),
    ForeignKey(
        "proveedores.id",
        name="fk_refacciones_proveedor",
        ondelete="RESTRICT",
        onupdate="CASCADE",
    ),
)
proveedor: Mapped[Optional["Proveedor"]] = relationship(
    back_populates="refacciones"
)
```

**Tabla de correspondencia entre el tipo físico y el tipo Python:**

| MySQL | SQLAlchemy | Ejemplo en el proyecto |
|---|---|---|
| `INT UNSIGNED AUTO_INCREMENT` | `INTEGER(unsigned=True)`, `primary_key=True` | `clientes.id`, `ordenes_servicio.id` |
| `VARCHAR(n)` | `String(n)` | `clientes.nombre`, `vehiculos.placas` |
| `TEXT` | `Text` | `ordenes_servicio.falla_reportada` |
| `DECIMAL(p,s)` | `Numeric(p,s)` + `Mapped[Decimal]` | `detalle_orden.precio_unitario` |
| `ENUM('A','B')` | `Enum('A', 'B', name=...)` | `ordenes_servicio.estado` |
| `TINYINT(1)` | `Boolean` + `Mapped[bool]` | `clientes.activo`, `clientes.confidencial` |
| `DATETIME` | `DateTime` + `Mapped[datetime]` | `created_at`, `updated_at` |
| `FOREIGN KEY ... RESTRICT` | `ForeignKey(..., ondelete="RESTRICT")` | `vehiculos.cliente_id` |
| `INDEX idx_...` | `Index("idx_...", "columna")` | `idx_ordenes_estado` |
| `ENGINE=InnoDB` / `utf8mb4` | `__table_args__` con `mysql_engine` y `mysql_charset` | Todas las tablas |

**Decisiones de traducción que evitaban errores silenciosos:**

1. **Nulabilidad explícita.** `Mapped[str]` describe una columna `NOT NULL`; `Mapped[str | None]`
   describe una columna que acepta `NULL`. Además se escribe `nullable=False` en las columnas
   obligatorias para que el DDL generado coincida sin ambigüedad.
2. **Valores por defecto del servidor.** Se usó `server_default=text("0")` o
   `server_default="Regular"` para que el valor lo ponga MySQL, igual que en el DDL, y no solo
   Python al insertar.
3. **`updated_at` con `onupdate=func.now()`.** Refleja el `ON UPDATE CURRENT_TIMESTAMP` del DDL.
4. **Comentarios y motor.** `__table_args__` conserva `mysql_engine`, `mysql_charset`,
   `mysql_collate` y el comentario de la tabla, de modo que `SHOW CREATE TABLE` y el modelo
   cuenten la misma historia.
5. **Relaciones sin duplicar columnas.** `relationship()` no crea columnas nuevas: solo navega la
   FK que ya existe en el DDL. Por eso `Cliente.vehiculos` no añade `cliente_id` a `vehiculos`.

La comprobación final se hizo con `sqlalchemy.inspect(engine)` (sección 4.2.1): 21 tablas, 218
columnas, 24 llaves foráneas y 59 índices coincidentes. Cuando el inspector y el modelo
discrepaban, se corrigió el modelo; el DDL siempre fue el árbitro.

### 4.3 Llaves primarias y llaves foráneas

**Llave primaria.** Todas las tablas usan `id INT UNSIGNED NOT NULL AUTO_INCREMENT` como PK.
Es un identificador sustituto, estable y compacto, que no cambia aunque el negocio cambie (un
RFC o una placa pueden corregirse; el `id` no). Las tablas de detalle conservan además su
unicidad real:

- `detalle_orden`: una línea es un servicio **o** una refacción, nunca ambos.
- `detalle_compra`: una compra no repite la misma refacción.
- `orden_mecanicos`: `UNIQUE (orden_id, mecanico_id)` impide asignar dos veces al mismo técnico.

**Llave foránea.** Las 24 relaciones se declaran con `FOREIGN KEY`, nombre
`fk_<tabla>_<referencia>`, `ON DELETE RESTRICT` y `ON UPDATE CASCADE`:

```sql
CONSTRAINT fk_vehiculos_cliente
  FOREIGN KEY (cliente_id) REFERENCES clientes (id)
  ON DELETE RESTRICT ON UPDATE CASCADE
```

Ejemplos representativos:

| Tabla hija | Columna | Tabla padre | Regla de negocio |
|---|---|---|---|
| `vehiculos` | `cliente_id` | `clientes` | Un auto siempre tiene dueño. |
| `ordenes_servicio` | `cliente_id` | `clientes` | La orden conserva al cliente aunque se abra desde el vehículo. |
| `ordenes_servicio` | `vehiculo_id` | `vehiculos` | No se puede abrir una orden para un auto inexistente. |
| `ordenes_servicio` | `mecanico_id` | `mecanicos` | Responsable principal; los participantes viven en `orden_mecanicos`. |
| `detalle_orden` | `orden_id` | `ordenes_servicio` | El detalle no existe sin orden. |
| `pagos`, `facturas`, `autorizaciones` | `orden_id` | `ordenes_servicio` | Todo movimiento financiero cuelga de una orden. |
| `bitacora`, `historial_etapas` | `usuario_id` | `usuarios` | Toda acción tiene responsable. |
| `compras` | `orden_id` | `ordenes_servicio` | Una compra puede originarse en una orden (PRV-05). |

**Por qué `ON DELETE RESTRICT`.** Si se borrara un cliente, sus órdenes quedarían sin dueño y la
facturación histórica perdería sentido. Con `RESTRICT`, la base impide el borrado incluso si
alguien ejecuta SQL a mano. La baja se hace apagando `activo` (borrado lógico, SEG-07).

### 4.4 Normalización

El esquema está en **tercera forma normal (3FN)**, con tres desnormalizaciones deliberadas.

#### Primera forma normal (1FN)

Todos los atributos son atómicos: no hay listas separadas por comas ni campos multivalor. La
única excepción aparente son `clientes.telefono1` y `clientes.telefono2`, que **no violan 1FN**
porque CLI-01 fija exactamente dos teléfonos. Una tabla `telefonos` habría permitido un número
arbitrario, pero también habría obligado a un `JOIN` en cada consulta para un dato que siempre
son dos columnas. Se documenta como decisión consciente.

#### Segunda forma normal (2FN)

No hay dependencias parciales: todos los atributos dependen de la llave completa. Las tablas de
detalle usan `id` sustituto como PK, pero su unicidad real es la combinación de la cabecera con
el concepto, y ningún atributo depende solo de una parte.

| Tabla | Llave real | Atributos que dependen de ella |
|---|---|---|
| `detalle_orden` | `(orden_id, servicio_id)` o `(orden_id, refaccion_id)` | `cantidad`, `precio_unitario`, `activo` |
| `detalle_compra` | `(compra_id, refaccion_id)` | `cantidad`, `precio_unitario_moneda`, `activo` |
| `orden_mecanicos` | `(orden_id, mecanico_id)` | `created_at`, `activo` |

#### Tercera forma normal (3FN)

No hay dependencias transitivas: el nombre del cliente no se repite en la orden, el nombre del
proveedor no se repite en la refacción y el precio del servicio no se copia en cada línea. Se
accede por `JOIN`.

| Dato | Dónde vive | Dónde **no** se duplica |
|---|---|---|
| Nombre y contacto del cliente | `clientes` | `ordenes_servicio` solo guarda `cliente_id`. |
| Marca y modelo del auto | `vehiculos` | `ordenes_servicio` solo guarda `vehiculo_id`. |
| Nombre del proveedor | `proveedores` | `refacciones` solo guarda `proveedor_id`. |
| Nombre y precio del servicio | `servicios` | `detalle_orden` guarda una copia histórica del precio, no del nombre. |

#### Casos concretos de 3FN en el esquema

La tercera forma normal exige que **ningún atributo que no sea llave dependa de otro atributo que
tampoco sea llave**. Dicho de forma simple: si `A → B` y `B → C`, entonces `C` no debe vivir en la
misma tabla que `A`. Estos son los casos que se corrigieron al diseñar AutoPulse Elite.

**Caso 1: por qué `proveedores` se separó de `refacciones`.**

Si `refacciones` guardara el nombre, el país, el contacto y el teléfono del proveedor, existiría
esta dependencia transitiva:

```text
refaccion.id → refaccion.proveedor_id → proveedor.nombre, proveedor.contacto, proveedor.telefono
```

El nombre del proveedor no depende de la refacción, sino del proveedor. Con la tabla separada, un
cambio de teléfono se hace **una sola vez** en `proveedores` y todas las refacciones lo ven por
`JOIN`. Además se evita el error clásico de que la misma refacción tenga dos teléfonos distintos
según la fila que se consulte.

| Si estuviera desnormalizado | Cómo está en el esquema | Qué se gana |
|---|---|---|
| `refacciones(id, nombre, proveedor_nombre, proveedor_pais, proveedor_contacto, ...)` | `proveedores(id, nombre, pais, contacto, telefono, correo, ...)` + `refacciones.proveedor_id` | Un proveedor se edita una vez; no hay datos contradictorios. |
| El país se repite en cada pieza importada. | El país vive en `proveedores.pais`. | Reportes por país sin `DISTINCT` ni cadenas duplicadas. |
| Borrar un proveedor dejaría texto huérfano. | `FOREIGN KEY ... ON DELETE RESTRICT`. | La base impide dejar refacciones sin proveedor. |

**Caso 2: por qué `clientes` no se repite en `ordenes_servicio`.**

`ordenes_servicio` guarda `cliente_id`, no el nombre ni el teléfono. Si los copiara, el nombre
dependería del cliente y no de la orden:

```text
orden.id → orden.cliente_id → cliente.nombre, cliente.telefono, cliente.confidencial
```

Esa copia sería especialmente peligrosa con clientes confidenciales: una orden vieja podría
conservar el nombre real aunque el cliente ya se haya marcado como confidencial. Al normalizar, el
enmascaramiento se decide en un solo lugar (`clientes.confidencial`) y aplica a todo el historial.

**Caso 3: por qué `servicios` no se copia en `detalle_orden`.**

El detalle guarda `servicio_id`, `cantidad` y `precio_unitario`. El nombre y la duración del
servicio viven en `servicios`. La única copia deliberada es el **precio**, porque una orden debe
conservar lo que se cobró aunque el catálogo suba de precio; esa excepción se documenta en la
sección de desnormalizaciones.

**Caso 4: por qué `vehiculos` y `mecanicos` tienen su propia tabla.**

La placa, la marca y el modelo dependen del vehículo, no de la orden. El nombre y la especialidad
dependen del mecánico, no de la asignación. Por eso `ordenes_servicio` solo guarda `vehiculo_id` y
`mecanico_id`, y los participantes adicionales viven en la tabla puente `orden_mecanicos`
(`orden_id`, `mecanico_id`, `created_at`). Así un mecánico puede participar en muchas órdenes sin
duplicar su ficha.

**Cómo se verificó la 3FN.** Para cada tabla se comprobó que:

1. Todos los atributos son atómicos (1FN).
2. Todos los atributos no llave dependen de la llave completa, no de una parte (2FN).
3. Ningún atributo no llave depende de otro atributo no llave (3FN).

El resultado son 21 tablas donde los datos de contacto, catálogo y precios viven en su tabla de
origen y las tablas transaccionales solo guardan llaves y los valores históricos que la auditoría
exige conservar.

#### Ejemplo aplicado: de la libreta a la tercera forma normal

El siguiente ejercicio resume, con una sola orden de servicio, cómo se depura una tabla hasta
llegar al esquema implementado. Es una versión simplificada: en el modelo real una línea de
detalle es un servicio **o** una refacción, nunca ambos.

| Forma | Diseño | Qué se corrigió |
|---|---|---|
| **Sin normalizar** | `orden(id, cliente, telefono, auto, servicios, refacciones, total)` con `servicios = "Aceite, Alineación"` | Grupos repetidos en una celda y datos del cliente repetidos en cada orden. |
| **1FN** | `orden(id, cliente, telefono, auto, servicio, refaccion, total)`, una fila por concepto | Cada celda es atómica: desaparecen las listas separadas por comas. |
| **2FN** | `orden(id, cliente, telefono, auto, total)` + `detalle_orden(orden_id, servicio, cantidad, precio)` | `cantidad` y `precio` dependen de la línea completa, no solo de la orden. |
| **3FN** | `clientes(id, nombre, telefono)` · `vehiculos(id, cliente_id, placas)` · `ordenes_servicio(id, cliente_id, vehiculo_id, total)` · `servicios(id, nombre, precio)` · `detalle_orden(orden_id, servicio_id, cantidad, precio_unitario)` | `telefono` depende ahora de `clientes.id`, no del nombre; `precio` vive en `servicios`. |

El esquema definitivo lleva el ejercicio más lejos porque el negocio lo exige: separa
`refacciones`, `proveedores`, `mecanicos`, `pagos`, `facturas` y dos bitácoras inmutables. El
resultado son **21 tablas** en las que ningún dato de contacto, catálogo o precio se repite por
comodidad.

#### Desnormalizaciones deliberadas

| Campo | Tabla | Qué se duplica | Por qué | Control |
|---|---|---|---|---|
| `precio_unitario` | `detalle_orden` | Precio vigente de `servicios` o `refacciones` | Una orden debe conservar el precio cobrado aunque el catálogo cambie. | Se escribe una vez, al agregar la línea; no se recalcula. |
| `subtotal`, `iva`, `total` | `ordenes_servicio` | Suma de `detalle_orden` | Evita sumar el detalle en cada listado y permite indexar por total. | Se recalculan en la misma transacción con `_recalcular_totales`; `sp_calcular_total_orden` hace el mismo cálculo desde SQL. |
| `total_moneda_original`, `tipo_cambio`, `total_mxn` | `compras` | Costo convertido a pesos | El tipo de cambio del día es un dato histórico irreconstruible. | Los tres se escriben juntos y no se editan. |

En los tres casos se trata de **valores congelados en el tiempo**, que es justo lo que la
auditoría exige conservar.

#### Lo que se dejó fuera del modelo

- **Cortesía y recogida (CLI-07, CLI-08):** CLI-08 se resolvió con `ordenes_servicio.notas`. El
  préstamo de auto de cortesía requeriría `autos_cortesia` y `prestamos`; no se creó porque
  quedó en prioridad Media y fuera del criterio del primer día.
- **Fotos firmadas:** `firma_conformidad` es un booleano; no se guarda la firma como imagen.
- **Historial de precios de catálogo:** no existe; el precio histórico vive en las líneas de
  detalle.

### 4.5 Inventario de tablas

| Dominio | Tablas | Propósito |
|---|---|---|
| Catálogos | `clientes`, `proveedores`, `mecanicos`, `servicios` | Personas, proveedores y mano de obra. |
| Vehículos | `vehiculos`, `polizas_seguro` | Autos y sus pólizas. |
| Inventario y compras | `refacciones`, `compras`, `detalle_compra`, `movimientos_inventario` | Existencias, pedidos y trazabilidad de piezas. |
| Órdenes | `ordenes_servicio`, `detalle_orden`, `fotos_vehiculo` | Núcleo transaccional y evidencia fotográfica. |
| Finanzas | `pagos`, `facturas`, `autorizaciones` | Cobros, CFDI y aprobaciones. |
| Seguridad y auditoría | `usuarios`, `bitacora`, `orden_mecanicos`, `historial_etapas`, `parametros` | Cuentas, logs inmutables y configuración. |

**21 tablas · 218 columnas.** Todas incluyen `created_at`, `updated_at` y `activo`, salvo los
logs inmutables `bitacora` e `historial_etapas`, que solo llevan `created_at` por diseño.

Convenciones aplicadas:

| Convención | Regla | Ejemplo |
|---|---|---|
| Idioma | Tablas, columnas y comentarios en español, `snake_case`. | `ordenes_servicio`, `fecha_estimada_llegada` |
| Identificadores | `id INT UNSIGNED AUTO_INCREMENT`. | `id` |
| Dinero | `DECIMAL(12,2)`, nunca `FLOAT`. | `precio_unitario`, `total_mxn` |
| Estados | `ENUM` con valores del negocio. | `ENUM('Recibido','Diagnostico','Reparacion','Listo')` |
| Fechas | `DATETIME`; `DATE` solo para días sin hora. | `created_at`, `vigencia_fin` |
| Booleanos | `TINYINT(1)`. | `es_vip`, `confidencial`, `firma_conformidad` |
| Borrado | Lógico: `activo = 0`. | `UPDATE clientes SET activo = 0` |
| Llaves foráneas | `ON DELETE RESTRICT`, `ON UPDATE CASCADE`. | `fk_vehiculos_cliente` |
| Índices | `idx_<tabla>_<columna>`; únicos `uq_...`. | `idx_vehiculos_placas`, `uq_usuarios_correo` |
| Codificación | `utf8mb4` / `utf8mb4_unicode_ci`. | Acentos y búsquedas sin distinguir mayúsculas |
| Comentarios | Cada tabla y columna documenta su propósito y requisito. | `COMMENT '...'` |

### 4.6 Relaciones principales

| Relación | Cardinalidad | Implementación |
|---|---|---|
| `clientes` → `vehiculos` | 1 a N | `vehiculos.cliente_id` |
| `clientes` → `ordenes_servicio` | 1 a N | `ordenes_servicio.cliente_id` |
| `vehiculos` → `polizas_seguro` | 1 a N | `polizas_seguro.vehiculo_id` |
| `vehiculos` → `ordenes_servicio` | 1 a N | `ordenes_servicio.vehiculo_id` |
| `mecanicos` → `ordenes_servicio` | 1 a 0..N | `ordenes_servicio.mecanico_id` (responsable principal) |
| `mecanicos` ↔ `ordenes_servicio` | N a M | `orden_mecanicos` |
| `mecanicos` → `usuarios` | 1 a 0..1 | `usuarios.mecanico_id` |
| `proveedores` → `refacciones` | 1 a 0..N | `refacciones.proveedor_id` |
| `proveedores` → `compras` | 1 a N | `compras.proveedor_id` |
| `compras` → `detalle_compra` | 1 a N | `detalle_compra.compra_id` |
| `refacciones` → `detalle_compra` | 1 a N | `detalle_compra.refaccion_id` |
| `refacciones` → `movimientos_inventario` | 1 a N | `movimientos_inventario.refaccion_id` |
| `refacciones` → `detalle_orden` | 1 a 0..N | `detalle_orden.refaccion_id` (XOR con servicio) |
| `servicios` → `detalle_orden` | 1 a 0..N | `detalle_orden.servicio_id` (XOR con refacción) |
| `ordenes_servicio` → `detalle_orden` | 1 a N | `detalle_orden.orden_id` |
| `ordenes_servicio` → `fotos_vehiculo` | 1 a N | `fotos_vehiculo.orden_id` |
| `ordenes_servicio` → `pagos` / `facturas` / `autorizaciones` | 1 a N | `orden_id` en cada tabla |
| `ordenes_servicio` → `orden_mecanicos` | 1 a N | `orden_mecanicos.orden_id` |
| `ordenes_servicio` → `historial_etapas` | 1 a N | `historial_etapas.orden_id` |
| `ordenes_servicio` → `compras` | 1 a 0..N | `compras.orden_id` (agregada con `ALTER`) |
| `usuarios` → `bitacora` / `historial_etapas` | 1 a N | `usuario_id` en cada log |

`parametros` es la única tabla sin relaciones: guarda configuración global
(`tolerancia_reautorizacion`, `umbral_piezas_caras`).

### 4.7 Triggers

Solo existen **seis triggers**, todos con una función de integridad que no se puede expresar
con una restricción simple:

| Trigger | Momento | Tabla | Regla | Requisito |
|---|---|---|---|---|
| `trg_detalle_orden_bi` | `BEFORE INSERT` | `detalle_orden` | Exactamente uno de `servicio_id` / `refaccion_id`. | ORD-10 |
| `trg_detalle_orden_bu` | `BEFORE UPDATE` | `detalle_orden` | La misma regla al modificar. | ORD-10 |
| `trg_bitacora_bu` | `BEFORE UPDATE` | `bitacora` | Prohibido modificar asientos. | SEG-06 |
| `trg_bitacora_bd` | `BEFORE DELETE` | `bitacora` | Prohibido borrar asientos. | SEG-06 |
| `trg_historial_etapas_bu` | `BEFORE UPDATE` | `historial_etapas` | Prohibido modificar registros. | ORD-06 |
| `trg_historial_etapas_bd` | `BEFORE DELETE` | `historial_etapas` | Prohibido borrar registros. | ORD-06 |

El XOR del detalle no se resolvió con `CHECK` porque `detalle_orden` tiene dos llaves foráneas
con `ON UPDATE CASCADE`; combinar esa cláusula con un `CHECK` sobre las mismas columnas produce
fallos al actualizar en cascada. Los triggers devuelven un mensaje legible y la API lo traduce a
`422` en lugar de un `500` genérico.

#### 4.7.1 Anatomía y código de los triggers

Un trigger es un bloque SQL que el motor ejecuta **automáticamente** ante un evento de una tabla.
Sus partes son:

| Parte | Significado |
|---|---|
| `BEFORE` / `AFTER` | Si se ejecuta antes o después de la operación. En `BEFORE` se puede validar y cancelar con `SIGNAL`; en `AFTER` ya no se puede impedir el cambio. |
| `INSERT` / `UPDATE` / `DELETE` | Evento que lo dispara. |
| `FOR EACH ROW` | Se ejecuta una vez por cada fila afectada (obligatorio en MySQL). |
| `NEW` | Fila con los valores nuevos (`INSERT` y `UPDATE`). |
| `OLD` | Fila con los valores anteriores (`UPDATE` y `DELETE`). |
| `SIGNAL SQLSTATE '45000'` | Aborta la operación con un mensaje propio; MySQL lo reporta como error de usuario. |

**Trigger de exclusividad (XOR) del detalle de orden:**

```sql
DELIMITER $$
CREATE TRIGGER trg_detalle_orden_bi BEFORE INSERT ON detalle_orden
FOR EACH ROW
BEGIN
  IF (NEW.servicio_id IS NULL AND NEW.refaccion_id IS NULL)
     OR (NEW.servicio_id IS NOT NULL AND NEW.refaccion_id IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'detalle_orden: debe indicar servicio_id o refaccion_id, pero no ambos';
  END IF;
END$$
DELIMITER ;
```

**Trigger de inmutabilidad de la bitácora:**

```sql
DELIMITER $$
CREATE TRIGGER trg_bitacora_bu BEFORE UPDATE ON bitacora
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'bitacora: es inmutable, no se permite modificar asientos';
END$$
DELIMITER ;
```

El trigger `trg_bitacora_bd` es idéntico, pero con `BEFORE DELETE`. `historial_etapas` repite el
mismo par. Así, ni un `UPDATE` accidental desde Workbench ni un `DELETE` desde la API pueden
alterar el rastro de auditoría.

**Verificación de los triggers instalados:**

```sql
SHOW TRIGGERS FROM autopulse_elite;

SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'autopulse_elite'
ORDER BY EVENT_OBJECT_TABLE, ACTION_TIMING;
```

### 4.8 Procedimientos almacenados, funciones y transacciones

#### 4.8.1 Qué son y por qué se agregaron

Un **procedimiento almacenado** (*stored procedure*) es un bloque SQL con nombre que se guarda en
el servidor y se ejecuta cuando alguien lo invoca con `CALL`. Se diferencia de un trigger en que
**no se dispara solo**: lo llama la aplicación, un script o un usuario con permisos. Admite
parámetros de entrada (`IN`), de salida (`OUT`) y de entrada-salida (`INOUT`), variables locales,
control de flujo (`IF`, `CASE`, `LOOP`) y manejo de errores.

Una **función almacenada** (*stored function*) también vive en el servidor, pero se usa como una
expresión: recibe parámetros, devuelve **un solo valor** con `RETURN` y puede aparecer dentro de
un `SELECT`, un `WHERE` o una asignación. Un procedimiento ejecuta acciones y puede devolver uno
o varios result sets; una función siempre devuelve un valor.

La diferencia con un trigger es clara: el trigger se dispara automáticamente ante un `INSERT`,
`UPDATE` o `DELETE`; el procedimiento y la función se invocan a propósito.

En la versión 1.1 de este reporte se había decidido no desplegar rutinas. Para el cierre de los
criterios de evaluación se agregó **`sql/11_procedimientos_funciones.sql`**, ejecutado contra la
base real `autopulse_elite` en MySQL 26.7.0. La API sigue siendo la dueña de las transacciones;
las rutinas cubren dos operaciones concretas y se verificaron con `CALL` y `SELECT`.

#### 4.8.2 Procedimiento `sp_calcular_total_orden`

**Firma:** `sp_calcular_total_orden(IN p_orden_id INT UNSIGNED)`.

**Qué hace:** lee el detalle vigente de la orden, separa piezas y mano de obra, aplica el
descuento VIP del cliente, calcula el IVA del 16 %, **guarda los cinco importes** en
`ordenes_servicio` y devuelve un renglón con el desglose.

**Reglas aplicadas:**

1. `total_piezas` = suma de líneas con `refaccion_id`.
2. `mano_obra_bruta` = suma de líneas con `servicio_id`.
3. `descuento_vip_pct` = `clientes.descuento_mano_obra`, acotado entre 0 y 100.
4. `total_mano_obra` = `mano_obra_bruta × (100 − descuento) / 100`.
5. `subtotal` = `total_piezas + total_mano_obra`.
6. `iva` = `subtotal × 0.16`.
7. `total` = `subtotal + iva`.

```sql
DELIMITER $$
CREATE PROCEDURE sp_calcular_total_orden(IN p_orden_id INT UNSIGNED)
    MODIFIES SQL DATA
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE v_descuento DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_piezas DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_mano_obra_bruta DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_mano_obra DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_subtotal DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_iva DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_total DECIMAL(12,2) DEFAULT 0.00;

    SELECT COUNT(*) INTO v_existe
      FROM ordenes_servicio
     WHERE id = p_orden_id AND activo = 1;

    IF v_existe = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La orden indicada no existe o esta dada de baja';
    END IF;

    SELECT COALESCE(SUM(CASE WHEN d.refaccion_id IS NOT NULL
                             THEN d.precio_unitario * d.cantidad ELSE 0 END), 0.00),
           COALESCE(SUM(CASE WHEN d.servicio_id IS NOT NULL
                             THEN d.precio_unitario * d.cantidad ELSE 0 END), 0.00)
      INTO v_piezas, v_mano_obra_bruta
      FROM detalle_orden d
     WHERE d.orden_id = p_orden_id AND d.activo = 1;

    -- El descuento VIP vive en clientes, no se repite en la orden (3FN).
    SELECT c.descuento_mano_obra INTO v_descuento
      FROM ordenes_servicio o
      JOIN clientes c ON c.id = o.cliente_id
     WHERE o.id = p_orden_id;

    IF v_descuento < 0 THEN SET v_descuento = 0.00;
    ELSEIF v_descuento > 100 THEN SET v_descuento = 100.00;
    END IF;

    SET v_piezas = ROUND(v_piezas, 2);
    SET v_mano_obra = ROUND(v_mano_obra_bruta * (100 - v_descuento) / 100, 2);
    SET v_subtotal = ROUND(v_piezas + v_mano_obra, 2);
    SET v_iva = ROUND(v_subtotal * 0.16, 2);
    SET v_total = ROUND(v_subtotal + v_iva, 2);

    UPDATE ordenes_servicio
       SET total_piezas = v_piezas,
           total_mano_obra = v_mano_obra,
           subtotal = v_subtotal,
           iva = v_iva,
           total = v_total
     WHERE id = p_orden_id;

    SELECT p_orden_id AS orden_id,
           v_piezas AS total_piezas,
           v_mano_obra_bruta AS mano_obra_bruta,
           v_descuento AS descuento_vip_pct,
           v_mano_obra AS total_mano_obra,
           v_subtotal AS subtotal,
           v_iva AS iva,
           v_total AS total;
END$$
DELIMITER ;
```

**Ejecución real sobre la orden 4** (Sofía Vargas, clienta VIP con 10 % de descuento):

```sql
CALL sp_calcular_total_orden(4);
```

| orden_id | total_piezas | mano_obra_bruta | descuento_vip_pct | total_mano_obra | subtotal | iva | total |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 4 | 0.00 | 2430.00 | 10.00 | 2187.00 | 2187.00 | 349.92 | **2536.92** |

Antes de la llamada, los datos de ejemplo mostraban `2818.80` porque la semilla no había aplicado
el descuento VIP. El procedimiento dejó la orden consistente con la regla de negocio y demostró
que el cálculo también funciona fuera de la API.

#### 4.8.3 Función `fn_valor_en_custodia`

**Firma:** `fn_valor_en_custodia()`.

**Qué hace:** suma `vehiculos.valor_aproximado` de los autos que siguen bajo custodia del taller,
es decir, los que tienen al menos una orden vigente cuyo estado **no** es `Entregado`. Devuelve un
`DECIMAL(14,2)` en pesos.

```sql
DELIMITER $$
CREATE FUNCTION fn_valor_en_custodia()
    RETURNS DECIMAL(14,2)
    READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(14,2) DEFAULT 0.00;

    SELECT COALESCE(SUM(v.valor_aproximado), 0.00)
      INTO v_total
      FROM vehiculos v
     WHERE v.activo = 1
       AND v.valor_aproximado IS NOT NULL
       AND EXISTS (
           SELECT 1
             FROM ordenes_servicio o
            WHERE o.vehiculo_id = v.id
              AND o.activo = 1
              AND o.estado <> 'Entregado'
       );

    RETURN v_total;
END$$
DELIMITER ;
```

**Por qué `EXISTS` y no un `JOIN`:** un vehículo puede tener varias órdenes abiertas (por ejemplo,
una reparación y una revisión posterior). Con `EXISTS` el vehículo se cuenta **una sola vez**; con
un `JOIN` directo se sumaría una vez por cada orden. Los vehículos sin orden —un auto recién
registrado— no están en custodia y no suman.

La condición se aplica literalmente: `Listo` sigue contando porque el auto espera la entrega, y
`Cancelado` también cuenta mientras el vehículo no se haya retirado físicamente. Si el taller
define que una orden cancelada libera el auto de inmediato, el predicado se cambia por
`o.estado NOT IN ('Entregado', 'Cancelado')` sin tocar el resto de la función.

**Ejecución real:**

```sql
SELECT fn_valor_en_custodia() AS valor_en_custodia_mxn;
```

| valor_en_custodia_mxn |
|---:|
| **5 860 000.00** |

El resultado se compone de los vehículos con orden abierta: 2 450 000 + 980 000 + 520 000 +
1 150 000 + 760 000. El vehículo entregado (420 000) y el vehículo sin orden (11 500 000) quedan
fuera, que es exactamente lo que debe mostrar el tablero.

**Integración con la aplicación.** El backend expone `GET /api/v1/dashboard/valor-custodia`
(`backend/app/routers/dashboard.py`), que ejecuta `SELECT fn_valor_en_custodia()` y responde:

```json
{"valor": "5860000.00", "moneda": "MXN", "fuente": "fn_valor_en_custodia"}
```

El endpoint está restringido al rol **Administrador** porque es un dato económico (SEG-18). El
frontend lo consume desde `frontend/src/services/dashboard.ts` y el indicador **“Valor en
custodia”** de `Dashboard.tsx` muestra ese valor; ya no se suman vehículos en el navegador. La
tarjeta indica “Calculado con `fn_valor_en_custodia()`” para que la evidencia sea explícita.

#### 4.8.4 Despliegue y verificación

El script es idempotente: empieza con `DROP PROCEDURE IF EXISTS` y `DROP FUNCTION IF EXISTS`, de
modo que puede aplicarse varias veces sin duplicar objetos.

```powershell
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite `
  -e "source sql/11_procedimientos_funciones.sql"
```

Verificación en MySQL Workbench o en el cliente `mysql`:

```sql
SHOW PROCEDURE STATUS WHERE Db = 'autopulse_elite';
SHOW FUNCTION STATUS WHERE Db = 'autopulse_elite';

CALL sp_calcular_total_orden(4);
SELECT fn_valor_en_custodia() AS valor_en_custodia_mxn;
```

| Verificación | Resultado obtenido |
|---|---|
| `SHOW PROCEDURE STATUS` | `sp_calcular_total_orden` creado en `autopulse_elite`. |
| `SHOW FUNCTION STATUS` | `fn_valor_en_custodia` creada en `autopulse_elite`. |
| `CALL sp_calcular_total_orden(4)` | Total recalculado: **2 536.92**. |
| `SELECT fn_valor_en_custodia()` | **5 860 000.00**. |
| `GET /api/v1/dashboard/valor-custodia` (Administrador) | `200` con `"valor": "5860000.00"`. |
| Mismo endpoint con Recepción o Mecánico | `403` por rol. |

> **Nota de despliegue.** Si el servidor tiene el *binary log* activo y el usuario no cuenta con
> `SUPER`, MySQL puede rechazar `CREATE FUNCTION` con el error 1418. La solución es ejecutar una
> vez, como administrador: `SET GLOBAL log_bin_trust_function_creators = 1;`.

#### 4.8.5 Vistas y eventos: lo que no se implementó

| Elemento | Estado | Razón |
|---|---|---|
| Vistas | No implementadas | Qué columnas ve cada rol depende del rol y de si el cliente es confidencial. Una vista por rol no resolvería el enmascaramiento, que se hace en la capa de serialización. |
| Eventos | No implementados | No hay tareas programadas. Los respaldos (SEG-08) son responsabilidad del sistema operativo o del proveedor. |
| Procedimientos | **1 desplegado** | `sp_calcular_total_orden`, para recalcular una orden desde SQL y dejar los totales persistidos. |
| Funciones | **1 desplegada** | `fn_valor_en_custodia`, consumida por el Dashboard a través de la API. |

#### 4.8.6 Transacciones y atomicidad

Toda operación que toca más de una tabla se ejecuta en una sola transacción.
El caso más complejo es `POST /api/v1/ordenes/{id}/registrar-avance`, que puede escribir hasta
en seis tablas: `ordenes_servicio`, `detalle_orden`, `refacciones`,
`movimientos_inventario`, `historial_etapas` y `bitacora`. El orden importa:

1. **Bloquear refacciones antes de tocar la orden**, con `SELECT ... FOR UPDATE`, ordenadas por
   `refaccion_id`. Si dos mecánicos usan las mismas piezas, el orden fijo de adquisición de
   locks evita el interbloqueo.
2. **Validar stock dentro del lock.** Si no alcanza, se responde `400` con la cantidad disponible
   y no se escribe nada.
3. **Insertar el detalle y descontar existencias**, dejando un movimiento de inventario por pieza.
4. **`db.flush()`** para que los `INSERT` lleguen a la transacción y los totales puedan
   recalcularse leyendo el detalle recién insertado.
5. **Recalcular totales** (piezas, mano de obra con descuento VIP, IVA y total).
6. **Escribir `historial_etapas` y `bitacora`** con el usuario autenticado.
7. **`db.commit()` una sola vez.** Ante cualquier excepción, `db.rollback()` deja la base como
   estaba.

```python
# Se bloquean las refacciones antes de tocar la orden para que dos mecanicos
# no puedan dejar el stock en negativo. Se ordenan por id para que las
# transacciones tomen los locks siempre en el mismo orden.
refacciones: list[tuple[int, Refaccion]] = []
for item in sorted(payload.refacciones, key=lambda linea: linea.refaccion_id):
    refaccion = db.scalars(
        select(Refaccion)
        .where(Refaccion.id == item.refaccion_id)
        .with_for_update()
    ).first()
    if refaccion is None or not refaccion.activo:
        raise HTTPException(status_code=400, detail="...")
    if refaccion.stock_actual < item.cantidad:
        raise HTTPException(status_code=400, detail="Stock insuficiente ...")
    refacciones.append((item.cantidad, refaccion))

try:
    ...
    db.flush()
    _recalcular_totales(db, orden)
    ...
    db.commit()
except OperationalError as exc:
    db.rollback()
    ...
```

`flush()` y no `commit()` intermedio: enviar los `INSERT` sin confirmar permite obtener los
`AUTO_INCREMENT` para las tablas hijas sin abrir la puerta a un estado a medias. Un `commit()`
intermedio dejaría una orden creada sin historial si el siguiente `INSERT` fallara.

**Traducción de errores de la base a errores HTTP:**

| Situación | Error MySQL | Respuesta de la API |
|---|---|---|
| Viola el XOR de `detalle_orden` | 1644 (`SQLSTATE 45000`) | `422` con el mensaje del trigger |
| Falla una llave foránea | 1452 / 1451 | `409` o `400` según el router |
| Correo de usuario duplicado | 1062 | `409 Conflict` |
| Stock insuficiente (validado antes) | — | `400` con disponible y solicitado |
| Falla inesperada | Cualquiera | `500` genérico y `rollback` |

**Concurrencia.** InnoDB trabaja con `REPEATABLE READ` (predeterminado de MySQL 8). Los dos
puntos donde la concurrencia podría causar daño se resolvieron con bloqueo pesimista (`FOR
UPDATE`) para el stock y con `UNIQUE (orden_id, mecanico_id)` para la doble asignación.

### 4.9 Índices y rendimiento

El esquema declara **59 índices secundarios** (sin contar las PK), nombrados con `idx_` o `uq_`.
No se indexó "por si acaso": cada índice responde a una consulta concreta.

| Consulta | Índice | Uso |
|---|---|---|
| Buscar cliente por nombre (CLI-05) | `idx_clientes_nombre` | Prefijo de `LIKE 'texto%'`. |
| Filtrar por categoría o confidencialidad | `idx_clientes_categoria`, `idx_clientes_confidencial` | Tablero y enmascaramiento. |
| Buscar vehículo por placas (VEH-06) | `idx_vehiculos_placas` | Búsqueda más frecuente en recepción. |
| Alertar pólizas por vencer (VEH-05) | `idx_polizas_vigencia_fin` | Rango de fechas. |
| Piezas bajo el mínimo (INV-03) | `idx_refacciones_stock (stock_actual, stock_minimo)` | Índice compuesto. |
| Órdenes por etapa (ORD-03) | `idx_ordenes_estado` | Agrupación del tablero. |
| Órdenes por mecánico | `idx_ordenes_mecanico` | Filtro obligatorio del rol Mecánico. |
| Órdenes por autorizar (AUT-01) | `idx_ordenes_requiere_autorizacion` | Bandeja de pendientes. |
| Historial de una orden | `idx_historial_orden`, `idx_detalle_orden_orden` | Consultas por `orden_id`. |
| Auditoría | `idx_bitacora_usuario`, `idx_bitacora_registro`, `idx_bitacora_fecha` | Tres ejes de investigación. |
| Saldo por orden | `idx_pagos_orden` | Suma de pagos. |
| Factura | `uq_facturas_numero`, `uq_facturas_uuid` | Únicos e indexados. |

No se indexaron columnas de baja selectividad como `activo` por sí sola: un índice sobre un campo
con dos valores no reduce el conjunto de forma útil y solo encarece las escrituras.

### 4.10 Diagrama E-R interactivo

El modelo completo está en **`docs/diagrama-er-interactivo.html`**: un archivo HTML autónomo que
funciona con doble clic, sin servidor y sin instalar nada. Mermaid se carga desde
`docs/vendor/mermaid.min.js` (con respaldo en CDN), de modo que el diagrama también se dibuja sin
conexión a internet.

La interfaz incluye:

- **Índice lateral** con las 21 tablas agrupadas por dominio y búsqueda por nombre de tabla o de
  columna.
- **Panel lateral grande** (hasta 1060 px) que muestra el nombre de la tabla, su descripción y una
  **tabla HTML real** con las 218 columnas: número, columna, tipo de dato, PK/FK, nulabilidad,
  valor por defecto y descripción. Las llaves foráneas son enlaces que abren la tabla referenciada.
- **Relaciones visuales** en el formato `clientes → 1 a N → vehiculos`, con la cardinalidad, el
  sentido (sale de / llega a la tabla) y la columna que implementa la llave foránea.
- **Enlaces directos** por tabla: `diagrama-er-interactivo.html#tabla=ordenes_servicio`.
- **Controles de zoom**, ajuste a la ventana y **descarga del diagrama en PNG a 2x**.

Abrirlo:

```powershell
Start-Process E:\Tallermecanico\docs\diagrama-er-interactivo.html
```

También existe la versión Mermaid dentro de `docs/erd.md` para GitHub.

---

## 5. Usuarios y roles

### 5.1 Modelo de roles

El sistema define tres roles en un `ENUM` de MySQL y en un tipo de TypeScript. No hay roles
personalizados ni permisos granulares por usuario: el rol es una propiedad de la cuenta y cambia
solo por intervención del administrador.

| Rol | `ENUM` | Perfil de uso | Alcance | Restricciones clave |
|---|---|---|---|---|
| **Administrador** | `Administrador` | Dueño del taller. Computadora y celular. | Acceso total: clientes, vehículos, órdenes, inventario, finanzas, facturación, autorizaciones y usuarios. | Es el único que autoriza y administra cuentas. |
| **Recepción** | `Recepcion` | Mostrador. Computadora de escritorio. | Registra clientes y vehículos, abre órdenes, surte inventario y consulta el estado del taller. | No ve finanzas, costos de compra ni lo que gana cada mecánico. No avanza etapas ni autoriza. |
| **Mecánico** | `Mecanico` | Tableta dentro del taller, con botones grandes (SEG-11). | Ve sus órdenes asignadas, registra diagnóstico, refacciones usadas y avance de etapa. | No ve precios, totales, descuentos ni datos personales de clientes confidenciales (SEG-02, SEG-18). No crea clientes, vehículos ni usuarios. |

La elección de tres roles y no de permisos por usuario fue deliberada: con cinco personas, un
sistema configurable habría agregado una pantalla que nadie mantiene y un riesgo de configurar
mal un permiso. Los permisos están en el código, se prueban con el código y se documentan aquí.

### 5.2 Usuarios de prueba

`sql/07_datos_prueba.sql` crea tres cuentas. Todas comparten la contraseña **`AutoPulse2026!`**
(hash scrypt con salt propio por usuario).

| Usuario | Correo | Rol | Qué demuestra |
|---|---|---|---|
| **Gabriel Pizarro** | `gabriel@pizarrogarage.mx` | Administrador | Ve todo, incluidos importes, valor en custodia y configuración. |
| **Ana Torres** | `ana.torres@pizarrogarage.mx` | Recepción | Opera clientes, vehículos, órdenes e inventario; no ve finanzas ni configuración. |
| **Luis Ramírez** | `luis.ramirez@pizarrogarage.mx` | Mecánico | Solo sus órdenes, placas y trabajo; sin precios ni nombres confidenciales. |

En producción, estas contraseñas deben cambiarse desde **Configuración → Usuarios → Restablecer
contraseña**.

### 5.3 Matriz de permisos por endpoint

La columna "Mecánico" indica además si el filtro es por fila: no solo tiene permiso sobre el
recurso, sino únicamente sobre **sus** órdenes.

| Recurso | Endpoint | Admin | Recepción | Mecánico |
|---|---|:--:|:--:|:--:|
| Sesión | `POST /api/v1/login` | ✔ | ✔ | ✔ |
| Sesión | `POST /api/v1/login/token` | ✔ | ✔ | ✔ |
| Sesión | `GET /api/v1/login/me` | ✔ | ✔ | ✔ |
| Dashboard | `GET /api/v1/dashboard/valor-custodia` | ✔ | ✘ 403 | ✘ 403 |
| Clientes | `GET /api/v1/clientes` | ✔ | ✔ | ✔ (enmascarado) |
| Clientes | `GET /api/v1/clientes/{id}` | ✔ | ✔ | ✔ (enmascarado) |
| Clientes | `POST /api/v1/clientes` | ✔ | ✔ | ✘ 403 |
| Clientes | `PUT /api/v1/clientes/{id}` | ✔ | ✔ | ✘ 403 |
| Vehículos | `GET /api/v1/vehiculos` | ✔ | ✔ | ✔ (sin valor) |
| Vehículos | `GET /api/v1/vehiculos/{id}` | ✔ | ✔ | ✔ (sin valor) |
| Vehículos | `POST /api/v1/vehiculos` | ✔ | ✔ | ✘ 403 |
| Vehículos | `PUT /api/v1/vehiculos/{id}` | ✔ | ✔ | ✘ 403 |
| Órdenes | `GET /api/v1/ordenes` | ✔ | ✔ | Solo las suyas |
| Órdenes | `GET /api/v1/ordenes/{id}` | ✔ | ✔ | Solo las suyas |
| Órdenes | `POST /api/v1/ordenes` | ✔ | ✔ | ✘ 403 |
| Órdenes | `POST /api/v1/ordenes/{id}/avanzar-etapa` | ✔ | ✘ 403 | ✔ (solo hacia adelante) |
| Órdenes | `POST /api/v1/ordenes/{id}/registrar-avance` | ✔ (puede corregir hacia atrás) | ✘ 403 | ✔ (solo sus órdenes) |
| Refacciones | `GET /api/v1/refacciones` | ✔ | ✔ | ✔ (sin precios) |
| Refacciones | `POST /api/v1/refacciones/{id}/entrada` | ✔ | ✔ | ✘ 403 |
| Usuarios | `GET /api/v1/usuarios` | ✔ | ✘ 403 | ✘ 403 |
| Usuarios | `POST /api/v1/usuarios/{id}/restablecer-password` | ✔ | ✘ 403 | ✘ 403 |

La matriz se implementa con una dependencia declarativa por endpoint:

```python
@router.post(
    "",
    response_model=OrdenOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requiere_roles("Administrador", "Recepcion"))],
)
def crear_orden(...):
    ...
```

`requiere_roles` devuelve `403 Forbidden` cuando el rol no está en la lista. Se distingue de
`401 Unauthorized`, reservado para token ausente, inválido o expirado: un `401` hace que el
frontend cierre la sesión; un `403` debe mostrar "no tienes permiso" sin expulsar al usuario.

### 5.4 Autenticación con JWT

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (React)
    participant A as API (FastAPI)
    participant D as MySQL

    U->>F: correo + contraseña
    F->>A: POST /api/v1/login
    A->>D: SELECT * FROM usuarios WHERE correo = ?
    D-->>A: usuario (o NULL)
    A->>A: verify_password() con scrypt
    alt credenciales válidas y usuario activo
        A->>A: crear_token_acceso(sub, correo, rol, tipo, iat, exp)
        A-->>F: 200 { access_token, expires_in, usuario }
        F->>F: guarda token en memoria (y en localStorage si "mantener sesión")
        F-->>U: redirige al tablero según rol
    else credenciales inválidas
        A-->>F: 401 "Credenciales incorrectas"
        F->>F: registra intento fallido (bloqueo 15 min)
        F-->>U: mensaje de error
    end
```

**Contenido y vigencia del token.** JWT firmado con **HS256** y la clave `JWT_SECRET_KEY` del
`.env`. Su contenido es mínimo a propósito:

| Claim | Valor | Uso |
|---|---|---|
| `sub` | `id` del usuario | Identificar la cuenta. |
| `correo` | Correo del usuario | Mostrar en la interfaz y trazabilidad. |
| `rol` | `Administrador`, `Recepcion` o `Mecanico` | Informativo; **no** es la autoridad final. |
| `tipo` | `access` | Distinguir el tipo de token. |
| `iat` | Momento de emisión | Auditoría. |
| `exp` | Emisión + **480 minutos (8 h)** | Expiración. |

No se incluyen datos personales, precios ni permisos: un JWT se puede decodificar sin la clave,
así que todo lo que va dentro debe considerarse público. El rol es informativo porque el backend
**recarga el usuario desde la base en cada petición**:

```python
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decodificar_token(token)
    except TokenInvalido:
        raise _CREDENCIALES_INVALIDAS
    usuario = db.get(Usuario, int(payload["sub"]))
    if usuario is None or not usuario.activo:
        raise _CREDENCIALES_INVALIDAS
    return usuario
```

Ese detalle resuelve un problema real: si el administrador degrada a un mecánico o da de baja una
cuenta, el cambio surte efecto **de inmediato**, sin esperar a que expire el token.

**No hay refresh token.** Al expirar, el usuario vuelve a iniciar sesión. Para una jornada de 8
horas es suficiente y elimina la superficie de ataque de un token de renovación de larga vida.

**Contraseñas.** Se almacenan con `hashlib.scrypt` y salt propio. El login compara contra un
`HASH_FICTICIO` cuando el correo no existe, para que el tiempo de respuesta no revele si la
cuenta existe (evita enumeración). Además, el frontend bloquea 15 minutos tras varios intentos
fallidos.

**Almacenamiento en el navegador.** El token vive en memoria y, solo si el usuario marca
"Mantener sesión iniciada", también en `localStorage`. Si no lo marca, cerrar la pestaña cierra
la sesión. El usuario se guarda solo en memoria; el token es la única credencial persistida. El
costo conocido es que `localStorage` es accesible desde JavaScript; las mitigaciones son React
(escapa por defecto), la ausencia de `dangerouslySetInnerHTML` y una CSP pendiente.

### 5.5 Privacidad y enmascaramiento

La confidencialidad se aplica en el backend, no solo en la interfaz:

| Regla | Implementación |
|---|---|
| Marcar un cliente como confidencial | `clientes.confidencial = 1`, editable solo por Administrador (SEG-17). |
| El mecánico no ve el nombre del dueño | `core/privacidad.py` reemplaza el nombre por **"Cliente confidencial"** y oculta teléfonos, correo, dirección y asistente (SEG-18). |
| El mecánico no ve precios | `OrdenOut.total` se serializa como `null`; los importes de refacciones también se ocultan (SEG-02). |
| El mecánico solo ve sus órdenes | Filtro por `mecanico_id` o por participación activa en `orden_mecanicos`. |
| Recepción no ve finanzas | Los endpoints financieros exigen rol Administrador (SEG-03). |

El `ENUM` de `bitacora.accion` ya contempla `Consulta_Confidencial`, pero ningún endpoint escribe
ese asiento todavía. El modelo está preparado; registrar cada lectura convertiría cada consulta
en una escritura y puede inflar la tabla. La decisión pendiente es si se auditan todas las
lecturas o solo las del rol Mecánico (SEG-20).

### 5.6 Trazabilidad de acciones

Independientemente del rol, las operaciones que modifican estado dejan rastro. La bitácora
registra usuario, tabla, registro, acción, detalle y fecha; el historial de etapas registra
además la etapa anterior y la nueva.

| Acción | Asiento en `bitacora` | Asiento en `historial_etapas` |
|---|---|---|
| Crear orden | `Creacion` | Etapa inicial `Recibido` |
| Avanzar etapa | `Actualizacion` | `etapa_anterior → etapa_nueva` |
| Registrar avance con refacciones | `Actualizacion` con el detalle | `etapa_anterior → etapa_nueva` |
| Surtir inventario | `Actualizacion` | — |
| Restablecer contraseña | `Actualizacion` | — |

Los logs son inmutables: no tienen `updated_at` ni `activo`, y los triggers bloquean `UPDATE` y
`DELETE`. Un asiento no se corrige: se agrega otro.

---

## 6. Capturas de pantalla paso a paso

Esta sección es el guion para producir las **47 evidencias** del sistema. Las capturas deben
hacerse con el navegador al 100 % de zoom, en una ventana de **1440 × 900 px**, y guardarse en
`documentacion-tecnica/capturas/`. Las evidencias adicionales de ingeniería inversa, 3FN y
rutinas SQL se detallan en **`docs/guia-capturas-ingenieria.md`**.

### 6.1 Preparación

1. Levantar MySQL, el backend y el frontend siguiendo el `README.md`.
2. Confirmar que `http://127.0.0.1:8000/api/v1/salud` responde con `"estado": "ok"` y
   `"tablas": 21`.
3. Cargar los datos de ejemplo si aún no están:

   ```powershell
   Get-Content sql\07_datos_prueba.sql | mysql -u root -p --default-character-set=utf8mb4 autopulse_elite
   Get-Content sql\08_datos_prueba_extra.sql | mysql -u root -p --default-character-set=utf8mb4 autopulse_elite
   ```

4. Abrir `http://localhost:5173` en una ventana de incógnito.
5. Usar la contraseña `AutoPulse2026!` para los tres usuarios.

**Datos de ejemplo esperados:**

| Orden | Cliente | Vehículo | Etapa |
|---|---|---|---|
| ORD-0001 | Rodrigo Salgado (VIP) | Porsche 911 Carrera S · PPG-001-A | Recibido |
| ORD-0002 | Alejandra Ríos (VIP) | Audi Q5 · PPG-004-D | Recibido |
| ORD-0003 | Héctor Mendoza | Volkswagen Golf GTI · PPG-005-E | Diagnóstico |
| ORD-0004 | Sofía Vargas (VIP) | Lexus RX 350 · PPG-006-F | Reparación |
| ORD-0005 | Javier Ortega | Ford Mustang GT · PPG-007-G | Listo |
| ORD-0006 | Valeria Núñez | Toyota Corolla · PPG-008-H | Entregado |

Mariana Cortés (`PPG-002-B`, Mercedes-Benz E 300) es confidencial y no tiene orden: aparece
enmascarada para el mecánico en la lista de clientes.

### 6.2 Lista de capturas

| # | Módulo | Usuario | Ruta / acción | Archivo sugerido | Qué demuestra |
|:--:|---|---|---|---|---|
| 1 | Login | — | `/login` vacío | `01-login.png` | Pantalla de acceso y diseño general. |
| 2 | Login | — | Campos llenos sin enviar | `02-login-credenciales.png` | Correo, contraseña y botón de visibilidad. |
| 3 | Login | — | Contraseña incorrecta | `03-login-error.png` | Error sin revelar si el correo existe. |
| 4 | Panel | Gabriel | `/dashboard` | `04-dashboard-admin.png` | Indicadores reales, valor en custodia y stock bajo. |
| 5 | Panel | Gabriel | Menú de cuenta | `05-dashboard-menu-cuenta.png` | Acceso a Configuración solo para Admin. |
| 6 | Clientes | Gabriel | `/clientes` | `06-clientes-lista.png` | Directorio con etiquetas VIP/Regular. |
| 7 | Clientes | Gabriel | Buscar "Alejandra" | `07-clientes-busqueda.png` | Búsqueda por nombre en tiempo real. |
| 8 | Clientes | Gabriel | Filtro VIP | `08-clientes-filtro-vip.png` | Filtro por categoría. |
| 9 | Clientes | Gabriel | Expediente de Alejandra | `09-cliente-detalle.png` | Contacto, VIP, descuento y Audi Q5. |
| 10 | Clientes | Gabriel | `/clientes/nuevo` | `10-nuevo-cliente.png` | Formulario con validaciones y descuento VIP. |
| 11 | Clientes | Gabriel | Guardar cliente | `11-cliente-creado.png` | Alta exitosa y navegación al expediente. |
| 12 | Vehículos | Gabriel | `/vehiculos` | `12-vehiculos-lista.png` | Placas, marca, modelo, dueño y año. |
| 13 | Vehículos | Gabriel | Buscar `PPG-004` | `13-vehiculos-busqueda.png` | Búsqueda por placas. |
| 14 | Vehículos | Gabriel | `/vehiculos/nuevo` | `14-nuevo-vehiculo.png` | Alta asociada a un cliente. |
| 15 | Órdenes | Gabriel | `/ordenes` | `15-ordenes-lista.png` | Seis órdenes con etapas y totales. |
| 16 | Órdenes | Gabriel | Filtro `Listo` | `16-ordenes-filtro-etapa.png` | Filtro por etapa (ORD-0005). |
| 17 | Órdenes | Gabriel | `/ordenes/nuevo` | `17-nueva-orden.png` | Cliente y vehículo dependientes. |
| 18 | Órdenes | Gabriel | Registrar orden | `18-orden-creada.png` | Orden nueva en `Recibido`. |
| 19 | Orden | Gabriel | ORD-0004, parte superior | `19-orden-detalle.png` | Etapa, fechas, cliente, vehículo y conceptos. |
| 20 | Orden | Gabriel | Totales de ORD-0004 | `20-orden-totales.png` | Subtotal, IVA 16 % y total. |
| 21 | Orden | Gabriel | **Imprimir Orden** | `21-orden-impresion.png` | Vista previa imprimible. |
| 22 | Inventario | Gabriel | `/inventario` | `22-inventario.png` | Existencias, mínimo y alerta visual. |
| 23 | Inventario | Gabriel | **Surtir** | `23-inventario-surtir.png` | Modal de entrada de inventario. |
| 24 | Inventario | Gabriel | Registrar 5 piezas | `24-inventario-actualizado.png` | Existencia actualizada y movimiento. |
| 25 | Configuración | Gabriel | `/configuracion` | `25-configuracion-usuarios.png` | Usuarios con rol y estado. |
| 26 | Configuración | Gabriel | Restablecer contraseña | `26-restablecer-password.png` | Modal exclusivo del Admin. |
| 27 | Panel | Ana | `/dashboard` | `27-dashboard-recepcion.png` | Mismos indicadores sin valor en custodia. |
| 28 | Menú | Ana | Menú lateral | `28-menu-recepcion.png` | Sin Configuración; con Inventario. |
| 29 | Órdenes | Ana | `/ordenes/nuevo` | `29-recepcion-nueva-orden.png` | Recepción sí puede crear órdenes. |
| 30 | Ruta protegida | Ana | URL `/configuracion` | `30-ruta-protegida.png` | Redirección al panel; la URL se ve en la barra. |
| 31 | Mecánico | Luis | `/ordenes` | `31-tablero-mecanico.png` | Tablero de bahías con **Registrar Avance**. |
| 32 | Mecánico | Luis | Modal de avance | `32-registrar-avance.png` | Diagnóstico, etapa y refacciones. |
| 33 | Mecánico | Luis | Detalle ORD-0001 | `33-orden-mecanico-sin-precios.png` | Sin importes ni totales. |
| 34 | Mecánico | Luis | `/clientes` | `34-clientes-confidenciales.png` | Mariana Cortés enmascarada. |
| 35 | 404 | Cualquiera | `/no-existe` | `35-404.png` | Pantalla 404 con **Volver a Principal**. |
| 36 | Logout | Cualquiera | **Cerrar sesión** | `36-logout.png` | Regreso al Login. |
| 37 | API | — | `/api/v1/salud` | `37-api-salud.png` | `"estado": "ok"` y `"tablas": 21`. |
| 38 | Swagger | — | `/docs` | `38-swagger-modulos.png` | Módulos de la API. |
| 39 | Swagger | Gabriel | **Authorize** | `39-swagger-autorizado.png` | Candado activo con JWT. |
| 40 | Swagger | Gabriel | `GET /clientes` | `40-swagger-clientes.png` | Respuesta 200 con datos. |
| 41 | Swagger | Luis | `GET /usuarios` | `41-swagger-403.png` | `403` del backend por rol. |
| 42 | Base de datos | — | `SHOW TABLES;` | `42-bd-tablas.png` | Las 21 tablas. |
| 43 | Base de datos | — | `SELECT ... FROM ordenes_servicio;` | `43-bd-ordenes.png` | Órdenes y totales. |
| 44 | Base de datos | — | `SELECT * FROM bitacora ... LIMIT 10;` | `44-bd-bitacora.png` | Movimientos recientes. |
| 45 | Móvil | Gabriel | 390 × 844 px | `45-movil-dashboard.png` | Panel adaptable. |
| 46 | Móvil | Gabriel | Menú desplegado | `46-movil-menu.png` | Menú funcional en móvil. |
| 47 | Móvil | Gabriel | Tabla de órdenes | `47-movil-ordenes.png` | Tabla usable con scroll horizontal. |

### 6.3 Checklist final de evidencias

- [ ] Login correcto y error de credenciales.
- [ ] Panel de Administrador con datos reales y valor en custodia.
- [ ] Clientes: lista, búsqueda, filtro VIP, detalle y alta.
- [ ] Vehículos: lista, búsqueda y alta.
- [ ] Órdenes: lista, filtro por etapa, alta y detalle con totales.
- [ ] Impresión de una orden.
- [ ] Inventario: lista, surtido y existencia actualizada.
- [ ] Configuración y restablecimiento de contraseña.
- [ ] Panel y menú de Recepción sin finanzas.
- [ ] Ruta `/configuracion` bloqueada para Recepción.
- [ ] Tablero de bahías del Mecánico.
- [ ] Modal de registrar avance.
- [ ] Orden del mecánico sin precios.
- [ ] Cliente confidencial enmascarado.
- [ ] Pantalla 404 y cierre de sesión.
- [ ] API de salud, Swagger autorizado y 403 del backend.
- [ ] Tablas, órdenes y bitácora en MySQL.
- [ ] Modelos SQLAlchemy y diagrama E-R en 3FN (guía de ingeniería).
- [ ] `CALL sp_calcular_total_orden(4)` y `SELECT fn_valor_en_custodia()`.
- [ ] Dashboard con “Valor en custodia” calculado por la función SQL.

Con estas evidencias queda demostrado el ciclo completo: **autenticación → clientes → vehículos →
orden → avance → inventario → auditoría**, además de las restricciones por rol en frontend y
backend.

### 6.4 Evidencias de ingeniería inversa, 3FN y rutinas SQL

Además de las 47 capturas del sistema, el cierre de los criterios de evaluación requiere cinco
evisiones técnicas. El guion detallado —con nombres de archivo, consultas exactas y qué debe
verse en pantalla— está en **`docs/guia-capturas-ingenieria.md`**:

| # | Evidencia | Dónde se captura | Qué demuestra |
|:--:|---|---|---|
| 48 | Modelo SQLAlchemy derivado del DDL | VS Code, `backend/app/models/clientes.py` u `ordenes_servicio.py` | Ingeniería inversa: `Mapped`, `mapped_column`, `ForeignKey` y `relationship`. |
| 49 | Diagrama E-R en 3FN | `docs/diagrama-er-interactivo.html` o `docs/erd.md` | Las 21 tablas normalizadas y sus relaciones. |
| 50 | Procedimiento almacenado | MySQL Workbench, `CALL sp_calcular_total_orden(4);` | Cálculo de piezas + mano de obra + IVA y persistencia de los totales. |
| 51 | Función almacenada | MySQL Workbench, `SELECT fn_valor_en_custodia();` | Suma del valor de los vehículos que siguen en custodia. |
| 52 | Dashboard con el valor real | Panel del Administrador | La tarjeta “Valor en custodia” muestra la cifra de la función SQL, no una suma del navegador. |

---

## 7. Limitaciones y trabajo futuro

### 7.1 Limitaciones declaradas

1. **La verificación final sí se hizo contra MySQL en ejecución.** La instancia local
   (`MySQL 26.7.0`, base `autopulse_elite`) respondió con las 21 tablas y se usó para crear y
   probar `sp_calcular_total_orden` y `fn_valor_en_custodia`. Las capturas de la sección 6 siguen
   siendo el guion de evidencia visual pendiente de tomar en pantalla; los resultados numéricos
   ya quedaron registrados en las secciones 4.8 y 6.4.
2. **Facturación CFDI 4.0 incompleta.** El modelo guarda los datos fiscales y la tabla
   `facturas`, pero la generación del documento y el timbrado con PAC son de la siguiente fase.
3. **Pagos y autorizaciones sin endpoints.** Las tablas existen y están relacionadas; la lógica
   de cobro y aprobación todavía no se expone en la API.
4. **Fotos y pólizas sin interfaz.** `fotos_vehiculo` y `polizas_seguro` están modeladas, pero
   no hay pantalla para subirlas o consultarlas.
5. **Auditoría de lecturas confidenciales pendiente.** El `ENUM` de `bitacora.accion` contempla
   `Consulta_Confidencial`, pero ningún endpoint lo escribe todavía (SEG-20).
6. **Seguridad por fila en la base pendiente.** El enmascaramiento se hace en el backend; SEG-19
   pide aplicar la restricción también a nivel de base de datos.

### 7.2 Trabajo futuro priorizado

| Prioridad | Trabajo | Requisitos |
|:--:|---|---|
| 1 | Endpoints y pantallas de pagos, saldos y autorizaciones. | PAG-01 a PAG-07, AUT-01 a AUT-08 |
| 2 | Generación de CFDI 4.0 y timbrado con PAC. | FAC-01 a FAC-06 |
| 3 | Proveedores, compras internacionales y tipos de cambio. | PRV-01 a PRV-10 |
| 4 | Fotos del vehículo y pólizas de seguro. | VEH-03 a VEH-05 |
| 5 | Reportes exportables y margen por orden. | REP-01 a REP-07 |
| 6 | Auditoría de lecturas confidenciales y seguridad por fila. | SEG-19, SEG-20 |
| 7 | Respaldos automáticos y copia fuera del taller. | SEG-08, SEG-09 |

---

## 8. Conclusiones

### 8.1 Contraste entre objetivos y resultados

| Objetivo | Resultado |
|---|---|
| Modelo relacional completo | 21 tablas, 218 columnas, 24 relaciones y 59 índices; DDL comentado por requisito. |
| Integridad impuesta por la base | Llaves foráneas `RESTRICT`, `ENUM`, `UNIQUE` y seis triggers. |
| Trazabilidad | `bitacora` e `historial_etapas` inmutables, protegidos con triggers. |
| Control de acceso | Tres roles, matriz por endpoint y filtro por fila para el mecánico. |
| Privacidad | Enmascaramiento de clientes confidenciales y ocultamiento de precios. |
| Interfaz usable | React + TypeScript + Tailwind, rutas protegidas y diseño adaptable. |
| Rutinas en la base | `sp_calcular_total_orden` y `fn_valor_en_custodia`, verificadas con `CALL` y `SELECT`; el Dashboard consume la función. |
| Documentación | Requisitos, ERD, ADR, diccionario de datos, diagrama interactivo y guía de capturas de ingeniería. |

### 8.2 Lo que la práctica enseñó

- **La base de datos es la última línea de defensa.** Validar solo en el frontend o solo en el
  backend deja huecos; el `RESTRICT`, el `UNIQUE` y los triggers cubren lo que el código podría
  olvidar.
- **La normalización no es un dogma.** Tres desnormalizaciones deliberadas —precio histórico,
  totales y tipo de cambio— resuelven problemas reales de auditoría que la 3FN pura no resuelve.
- **La seguridad por rol no basta.** El caso de las figuras públicas obligó a combinar rol,
  confidencialidad del cliente y enmascaramiento de campos.
- **Documentar el requisito junto a la columna** convierte el esquema en la fuente de verdad y
  facilita la trazabilidad meses después.

### 8.3 Reflexión final

AutoPulse Elite no es solo un CRUD: es un modelo que obliga a que cada pieza, cada peso y cada
cambio de etapa tengan un responsable y una fecha. Esa es la diferencia entre digitalizar una
libreta y construir un sistema en el que el dueño del taller pueda confiar.

---

## Anexo A. Entregables y cómo abrirlos

| Archivo | Contenido | Cómo abrirlo |
|---|---|---|
| `docs/reporte-practica.md` | Este documento en Markdown. | Visor Markdown o GitHub. |
| `docs/reporte-practica.pdf` | Versión imprimible para entrega, generada desde el Markdown. | Doble clic (Acrobat, Edge o cualquier lector de PDF). |
| `docs/diagrama-er-interactivo.html` | Diagrama E-R navegable; cada tabla abre su ficha completa. | Doble clic; no requiere servidor. |
| `docs/vendor/mermaid.min.js` | Copia local de Mermaid para que el diagrama funcione sin internet. | Se carga sola desde el HTML. |
| `scripts/generar-pdf.py` | Generador del PDF a partir del Markdown. | `python scripts/generar-pdf.py`. |
| `docs/erd.md` | Diagrama Mermaid para GitHub. | Vista previa de GitHub. |
| `docs/requisitos.md` | Línea base de requisitos. | Visor Markdown. |
| `docs/requisitos-actualizados.md` | Delta de requisitos. | Visor Markdown. |
| `docs/contexto-tecnico.md` | Contexto y decisiones de arquitectura. | Visor Markdown. |
| `docs/decisiones-tecnicas.md` | ADR del proyecto. | Visor Markdown. |
| `sql/01` a `sql/11` | DDL, triggers, semillas, evolución y rutinas almacenadas. | MySQL Workbench o cliente `mysql`. |
| `docs/guia-capturas-ingenieria.md` | Guion de capturas de ingeniería inversa, 3FN, rutinas y Dashboard. | Visor Markdown. |
| `README.md` | Instalación y arranque paso a paso. | Visor Markdown. |

## Anexo B. Glosario de términos

| Término | Definición en el contexto del proyecto |
|---|---|
| **1FN, 2FN, 3FN** | Primera, segunda y tercera forma normal: reglas que eliminan valores repetidos, dependencias parciales y dependencias transitivas. |
| **ACID** | Atomicidad, consistencia, aislamiento y durabilidad: garantías de una transacción en InnoDB. |
| **API REST** | Interfaz HTTP que expone los recursos del sistema (clientes, vehículos, órdenes) en formato JSON. |
| **CFDI 4.0** | Comprobante Fiscal Digital por Internet, estándar del SAT para facturación en México. |
| **DDL / DML** | Lenguaje de definición de datos (`CREATE`, `ALTER`) y de manipulación (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). |
| **Desnormalización** | Duplicar un dato de forma deliberada para conservar historia o mejorar el rendimiento. |
| **FK (llave foránea)** | Columna que referencia la llave primaria de otra tabla e impide relaciones huérfanas. |
| **Ingeniería inversa** | Reconstruir el modelo lógico a partir de una base física existente. |
| **InnoDB** | Motor transaccional de MySQL; soporta llaves foráneas, transacciones y bloqueos de fila. |
| **JWT** | Token firmado que identifica al usuario en cada petición; en el proyecto usa HS256 y expira en 8 horas. |
| **ORM** | Capa que traduce objetos de Python a tablas de MySQL; aquí se usa SQLAlchemy 2.x. |
| **PK (llave primaria)** | Columna que identifica de forma única cada fila de una tabla. |
| **Trigger** | Bloque SQL que se ejecuta automáticamente ante un `INSERT`, `UPDATE` o `DELETE`. |
| **XOR (regla)** | Restricción lógica que exige exactamente una de dos columnas; se aplica en `detalle_orden`. |
