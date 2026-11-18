# AutoPulse Elite — Reporte Técnico de Práctica

**Sistema de gestión integral para taller de autos de lujo — Pizarro Performance Garage**

---

## 1. Portada

| Campo | Dato |
|---|---|
| **Nombre del proyecto** | AutoPulse Elite |
| **Organización** | Pizarro Performance Garage — taller especializado en autos de lujo |
| **Tipo de entregable** | Reporte técnico de práctica profesional |
| **Autor** | Jonnatan Martinez Aquino |
| **Repositorio** | `E:\Tallermecanico` (Git, rama `master`, commit `2853000`) |
| **Fecha de elaboración** | 18 de noviembre de 2026 |
| **Versión del documento** | 1.0 |
| **Estado del sistema** | Base de datos (21 tablas), API REST (FastAPI) y aplicación web (React) implementadas |
| **Documento fuente de verdad** | `docs/requisitos.md` + `docs/requisitos-actualizados.md` |

### 1.1 Control del documento

| Versión | Fecha | Autor | Descripción del cambio |
|---|---|---|---|
| 0.1 | 15/11/2026 | Jonnatan Martinez Aquino | Levantamiento de requisitos, modelo entidad-relación y scripts SQL por bloques. |
| 0.2 | 16/11/2026 | Jonnatan Martinez Aquino | Modelos SQLAlchemy, API REST con JWT, triggers de integridad y bitácora. |
| 1.0 | 18/11/2026 | Jonnatan Martinez Aquino | Reporte técnico de práctica: integración de base de datos, seguridad y manual de usuario. |

### 1.2 Resumen ejecutivo

AutoPulse Elite es una aplicación web para administrar la operación completa de un taller
mecánico de autos de lujo. Antes del proyecto, el taller trabajaba con una libreta y hojas de
cálculo: los datos de clientes, el historial de los vehículos, las refacciones y los pagos
parciales vivían en archivos separados y sin relación entre sí. El sistema concentra esa
información en una base de datos relacional normalizada, la expone mediante una API REST
protegida con JWT y la presenta en una interfaz web que se adapta al rol de cada usuario.

El resultado de la práctica es un sistema funcional de extremo a extremo: **21 tablas** en
MySQL 8.x con **24 relaciones** declaradas, **6 triggers** que protegen reglas de negocio que
no pueden expresarse con una restricción `CHECK`, **92 requisitos** trazados a tablas y
endpoints, y **tres roles** (Administrador, Recepción y Mecánico) con permisos distintos y
enmascaramiento de datos sensibles en la capa de serialización.

La complejidad del dominio no está en el volumen de datos, sino en las reglas: un cliente VIP
tiene 10 % de descuento automático en mano de obra, pero no en refacciones; un cliente
confidencial solo debe mostrar sus placas al mecánico; ninguna fila se borra físicamente; y
toda operación que mueva dinero, inventario o etapas debe quedar registrada en una bitácora
inmutable. Esas reglas son las que guiaron el diseño y las que este documento explica.

---

## Índice

1. [Portada](#1-portada)
2. [Objetivo del sistema](#2-objetivo-del-sistema)
3. [Requerimientos](#3-requerimientos)
4. [Software, lenguajes y herramientas](#4-software-lenguajes-y-herramientas)
5. [Desarrollo de la base de datos](#5-desarrollo-de-la-base-de-datos)
   - 5.1 [Organización de los scripts SQL](#51-organización-de-los-scripts-sql)
   - 5.2 [Convenciones de diseño aplicadas](#52-convenciones-de-diseño-aplicadas)
   - 5.3 [Ingeniería inversa: del DDL a los modelos SQLAlchemy](#53-ingeniería-inversa-del-ddl-a-los-modelos-sqlalchemy)
   - 5.4 [Inventario de tablas](#54-inventario-de-tablas)
   - 5.5 [Relaciones e integridad referencial](#55-relaciones-e-integridad-referencial)
   - 5.6 [Diagrama entidad-relación](#56-diagrama-entidad-relación)
   - 5.7 [Triggers](#57-triggers)
   - 5.8 [Procedimientos almacenados, vistas y transacciones](#58-procedimientos-almacenados-vistas-y-transacciones)
   - 5.9 [Índices y rendimiento](#59-índices-y-rendimiento)
   - 5.10 [Normalización](#510-normalización)
   - 5.11 [Datos semilla y evolución del esquema](#511-datos-semilla-y-evolución-del-esquema)
6. [Usuarios y roles](#6-usuarios-y-roles)
7. [Manual de usuario básico](#7-manual-de-usuario-básico)
8. [Conclusiones y trabajo futuro](#8-conclusiones-y-trabajo-futuro)
9. [Anexos](#9-anexos)

---

## 2. Objetivo del sistema

### 2.1 Contexto del negocio

Pizarro Performance Garage atiende vehículos de alto valor para una clientela reducida y, en
varios casos, pública. La operación diaria involucra cuatro etapas fijas por cada orden de
servicio, refacciones que en su mayoría se importan, pagos que se realizan en parcialidades y
un requisito de facturación fiscal (CFDI 4.0) que obliga a conservar datos fiscales exactos.

La practica se enfocó en responder una pregunta concreta: **¿cómo se modela un taller de lujo
sin perder trazabilidad ni discreción?** La respuesta tiene tres componentes: un esquema
relacional que impide estados imposibles, una capa de seguridad que recorta la información
según el rol y una bitácora que reconstruye quién hizo qué y cuándo.

### 2.2 Objetivo general

Diseñar e implementar la base de datos relacional y la primera capa de aplicación de AutoPulse
Elite, de modo que la operación del taller (clientes, vehículos, órdenes, inventario, compras,
pagos, facturación y autorizaciones) quede registrada de forma íntegra, auditable y restringida
por rol, sustituyendo la libreta y las hojas de cálculo.

### 2.3 Objetivos específicos

| # | Objetivo específico | Evidencia en el entregable |
|---|---|---|
| OE-1 | Modelar el dominio completo en un esquema normalizado de 21 tablas con integridad referencial estricta. | `sql/01`–`sql/09`, 24 `FOREIGN KEY` con `ON DELETE RESTRICT` |
| OE-2 | Garantizar trazabilidad total: ninguna fila se elimina y toda operación crítica deja asiento. | `activo TINYINT(1)`, tablas `bitacora` e `historial_etapas` inmutables por trigger |
| OE-3 | Hacer cumplir las reglas de negocio que el modelo relacional no puede expresar por sí solo. | 6 triggers (`detalle_orden` XOR, inmutabilidad de logs) |
| OE-4 | Implementar autenticación y autorización por rol con expiración y revocación efectiva. | JWT HS256 + recarga del usuario en cada petición (`core/deps.py`) |
| OE-5 | Proteger la discreción de los clientes confidenciales y ocultar precios al mecánico. | `core/privacidad.py` (SEG-17, SEG-18) |
| OE-6 | Exponer el dominio mediante una API REST documentada y consumible desde el frontend. | 6 routers bajo `/api/v1`, Swagger en `/docs` |
| OE-7 | Entregar una interfaz web usable en escritorio y tablet, con menú dependiente del rol. | React 19 + TypeScript + Tailwind, `navegacion-dashboard.ts` |
| OE-8 | Documentar el diseño y las decisiones no obvias para que el sistema sea mantenible. | `docs/erd.md`, `docs/decisiones-tecnicas.md` (ADR-001 a ADR-010) |

### 2.4 Alcance y límites

**Incluido en esta etapa**

- Esquema completo en MySQL 8.x con datos semilla de catálogos y parámetros del negocio.
- API REST con autenticación, clientes, vehículos, órdenes de servicio, refacciones y usuarios.
- Registro transaccional del avance del mecánico (diagnóstico, refacciones y etapa).
- Interfaz web con login, tablero por rol, alta de clientes, alta de vehículos, listado y detalle
  de órdenes, y modal de registro de avance.
- Documentación técnica: requisitos, ERD, ADR e índice.

**Fuera del alcance de esta etapa (declarado, no implícito)**

- Facturación CFDI 4.0 ante el SAT (timbrado): el esquema guarda los datos, pero no hay
  integración con un PAC.
- Módulos de pagos, autorizaciones y reportes en la interfaz: existen en la base de datos y
  aparecen en el menú como "próximamente".
- Carga y firma de fotografías: la tabla `fotos_vehiculo` está lista y guarda rutas, pero el
  almacenamiento de archivos (VEH-08) queda para la siguiente fase.
- Notificaciones, aplicación móvil nativa y respaldo automatizado.

## 3. Requerimientos

### 3.1 Proceso de levantamiento

Los requisitos se obtuvieron mediante una entrevista estructurada de **33 preguntas** (P1 a P33)
con el dueño del taller. Cada requisito conserva el número de pregunta que lo originó, de modo
que cualquier decisión de diseño puede rastrearse hasta la conversación que la motivó. El
levantamiento se documentó en dos archivos que se complementan:

| Documento | Rol | Contenido |
|---|---|---|
| `docs/requisitos.md` | Línea base | 76 requisitos originales (64 funcionales y 12 no funcionales), agrupados en 10 módulos, con actor, prioridad y origen. |
| `docs/requisitos-actualizados.md` | Delta | 23 filas: 7 requisitos modificados y 16 nuevos, surgidos al validar el diseño con el cliente. |

La prioridad se interpretó así: **Alta** = necesario desde el primer día o crítico para el
negocio; **Media** = durante el primer mes, no bloquea el arranque; **Baja** = deseable. Los
requisitos marcados con `(inf.)` en el origen son deducciones del analista y no respuestas
literales de la entrevista; se listaron de forma explícita para que el cliente pudiera
refutarlos. Ese detalle importa: un requisito inferido que se presenta como confirmado es un
defecto de levantamiento, no una omisión menor.

El cliente fijó además un **criterio de aceptación para el primer día**: el sistema debe
permitir registrar cliente y auto, abrir una orden, moverla por las cuatro etapas, descontar
piezas y facturar. Ese criterio agrupa CLI-01, VEH-01, ORD-01 a ORD-05, INV-02, PAG-01 y
FAC-01 a FAC-03, y fue el que definió el orden de implementación.

### 3.2 Resumen cuantitativo

Tras aplicar el delta, el universo consolidado es de **92 requisitos únicos** (77 funcionales y
15 no funcionales): 76 originales más 16 nuevos, con 7 originales reemplazados por su versión
modificada.

| Módulo | Prefijo | Funcionales | No funcionales | Total | Tipo de tabla asociada |
|---|---|:--:|:--:|:--:|---|
| Clientes | CLI | 8 | 0 | 8 | Catálogo con datos de contacto y clasificación |
| Vehículos | VEH | 7 | 1 | 8 | Catálogo dependiente de cliente + pólizas |
| Órdenes de servicio | ORD | 13 | 0 | 13 | Transaccional con detalle e historial |
| Inventario | INV | 5 | 0 | 5 | Catálogo con existencias y movimientos |
| Proveedores y compras | PRV | 10 | 0 | 10 | Catálogo + transaccional de compras |
| Pagos | PAG | 7 | 0 | 7 | Transaccional financiero |
| Facturación | FAC | 6 | 0 | 6 | Transaccional fiscal |
| Autorizaciones | AUT | 8 | 0 | 8 | Transaccional de aprobación |
| Reportes | REP | 6 | 1 | 7 | Consultas sobre el resto del modelo |
| Seguridad | SEG | 7 | 13 | 20 | Usuarios, bitácora y parámetros |
| **Total** | | **77** | **15** | **92** | |

Leyenda de la columna **Est.**: `O` = original, `N` = nuevo, `M` = modificado respecto del
levantamiento inicial.

### 3.3 Requisitos funcionales

#### 3.3.1 Clientes (CLI)

| ID | Requisito | Actor | Prioridad | Est. |
|---|---|---|---|:--:|
| CLI-01 | Registrar cliente con nombre, dos teléfonos, correo, dirección y nombre de su asistente o chofer. | Recepción, Admin | Alta | O |
| CLI-02 | Marcar y desmarcar a un cliente como VIP (hoy unos 15). | Admin | Media | O |
| CLI-03 | Beneficios VIP: prioridad en la fila, **10 % de descuento automático solo en mano de obra**, auto de cortesía y recogida a domicilio (ver CLI-07 y CLI-08). | Sistema, Admin | Media | M |
| CLI-04 | Asignar al administrador como responsable de atención de los clientes VIP. | Admin | Baja | O |
| CLI-05 | Buscar clientes por nombre del dueño en menos de 3 segundos, respetando SEG-18. | Todos | Alta | O |
| CLI-06 | Ver el historial de órdenes, pagos y saldo de cada cliente. | Admin | Media | O |
| CLI-07 | Módulo de préstamo de auto de cortesía: el auto se registra como activo del taller y cada préstamo guarda a quién se prestó, fecha y hora, kilometraje de salida y regreso, y revisión de rayones. | Admin, Recepción | Media | N |
| CLI-08 | Campo de notas en la orden con la dirección y los datos de recogida a domicilio para el chofer. | Recepción | Media | N |

#### 3.3.2 Vehículos (VEH)

| ID | Requisito | Actor | Prioridad | Est. |
|---|---|---|---|:--:|
| VEH-01 | Registrar vehículo con placas, número de serie, marca, modelo, año, color, kilometraje de entrada y valor aproximado. | Recepción | Alta | O |
| VEH-02 | Asociar cada vehículo a su dueño. | Recepción | Alta | O |
| VEH-03 | Guardar hasta 30 fotos por auto (máx. 10 MB cada una), clasificadas en ingreso, proceso y entrega; cada foto lleva fecha y hora automáticas y las de entrega deben quedar firmadas. | Recepción, Mecánico | Alta | M |
| VEH-04 | Registrar la póliza de seguro: aseguradora, número, vigencia y cobertura. | Recepción, Admin | Media | O |
| VEH-05 | Avisar al administrador 30 días antes del vencimiento de una póliza. | Sistema | Media | O |
| VEH-06 | Buscar vehículo por placas en menos de 3 segundos. | Todos | Alta | O |
| VEH-07 | Calcular en cualquier momento el valor total de los autos que están dentro del taller (valor en custodia). | Admin | Media | O |

#### 3.3.3 Órdenes de servicio (ORD)

| ID | Requisito | Actor | Prioridad | Est. |
|---|---|---|---|:--:|
| ORD-01 | Abrir orden al llegar el auto con dueño, placas, número de serie y falla reportada. | Recepción | Alta | O |
| ORD-02 | Manejar cuatro etapas: Recibido, Diagnóstico, Reparación y Listo. | Sistema | Alta | O |
| ORD-03 | Mostrar en una sola pantalla todos los autos en el taller y su etapa. | Admin, Mecánico | Alta | O |
| ORD-04 | Permitir al mecánico avanzar la orden de diagnóstico a reparación y a listo; recepción solo registra la llegada. | Mecánico, Recepción | Alta | O |
| ORD-05 | Permitir regresar una orden a una etapa anterior solo al administrador. | Admin | Alta | O |
| ORD-06 | Alertar al administrador y al mecánico si una orden lleva más de 5 días sin cambiar de etapa. | Sistema | Media | O |
| ORD-07 | Excluir de la alerta las órdenes en estado "esperando pieza en camino". | Sistema | Media | O |
| ORD-08 | Registrar en una bitácora quién hizo cada trabajo y a qué hora. | Sistema | Alta | O |
| ORD-09 | Asignar uno o más mecánicos a cada orden o trabajo. | Admin, Mecánico | Alta | O |
| ORD-10 | Registrar las piezas usadas y la mano de obra de cada orden. | Mecánico | Alta | O |
| ORD-11 | Cancelar una orden solo con motivo obligatorio y registro del usuario, sin borrarla. | Admin | Alta | O |
| ORD-12 | Mostrar las órdenes con retraso. | Admin | Media | O |
| ORD-13 | Ordenar la fila de trabajo dando prioridad a las órdenes de clientes VIP. | Sistema | Media | O |

#### 3.3.4 Inventario (INV)

| ID | Requisito | Actor | Prioridad | Est. |
|---|---|---|---|:--:|
| INV-01 | Llevar un catálogo con existencias de tornillería y consumibles. | Admin | Alta | O |
| INV-02 | Descontar automáticamente del inventario cada pieza que se asigna a una orden. | Sistema | Alta | O |
| INV-03 | Alertar cuando una pieza de tornillería o consumibles tenga 2 o menos unidades. | Sistema | Media | O |
| INV-04 | Tratar las piezas especiales por marca como compras ligadas a una orden, sin existencias en inventario. | Sistema | Alta | O |
| INV-05 | Ajustar el inventario manualmente solo por el administrador, con motivo y bitácora. | Admin | Baja | O |

#### 3.3.5 Proveedores y compras (PRV)

| ID | Requisito | Actor | Prioridad | Est. |
|---|---|---|---|:--:|
| PRV-01 | Registrar proveedores (Italia, Alemania, Inglaterra) con país y contacto. | Admin | Media | O |
| PRV-02 | Calcular y mostrar el tiempo de entrega de cada proveedor (hoy de 2 a 8 semanas). | Sistema | Media | O |
| PRV-03 | Registrar cada pedido con su estado y fecha estimada de llegada. | Admin | Alta | O |
| PRV-04 | Ver la lista de pedidos pendientes con su fecha estimada. | Admin | Alta | O |
| PRV-05 | Registrar quién solicitó cada pedido y para qué orden (evita casos como la pieza de $90,000 sin responsable). | Sistema | Alta | O |
| PRV-06 | Generar automáticamente un borrador de orden de compra con las piezas faltantes. | Sistema | Media | O |
| PRV-07 | Bloquear el envío de la orden de compra sin aprobación del administrador **y sin el anticipo del 50 % registrado, cuando aplique**. | Sistema, Admin | Alta | M |
| PRV-08 | Mostrar las piezas que hay que pedir esta semana. | Admin | Media | O |
| PRV-09 | Registrar cada compra con moneda original (EUR o GBP), costo en esa moneda, tipo de cambio del día de la compra y equivalente en pesos. | Admin | Alta | N |
| PRV-10 | Ocultar a mecánicos y recepción los costos de compra y los tipos de cambio. | Sistema | Alta | N |

#### 3.3.6 Pagos (PAG)

| ID | Requisito | Actor | Prioridad | Est. |
|---|---|---|---|:--:|
| PAG-01 | Calcular el costo total como piezas + mano de obra + IVA 16 %, con desglose visible para el cliente. | Sistema | Alta | O |
| PAG-02 | Aplicar el descuento VIP de 10 % solo a la mano de obra. | Sistema | Media | O |
| PAG-03 | El anticipo del 50 % es **obligatorio cuando el subtotal de piezas supera un umbral configurable** (propuesta: $20,000 a $30,000 MXN); el resto se paga al entregar. | Sistema | Alta | M |
| PAG-04 | Permitir pagos en partes solo a clientes marcados como de confianza. | Admin | Media | O |
| PAG-05 | Mostrar cuánto ha pagado y cuánto debe cada cliente y cada orden. | Admin | Alta | O |
| PAG-06 | Parámetro configurable del umbral de "piezas caras". | Admin | Alta | N |
| PAG-07 | Cobrar siempre al cliente en pesos mexicanos. | Sistema | Alta | N |

#### 3.3.7 Facturación (FAC)

| ID | Requisito | Actor | Prioridad | Est. |
|---|---|---|---|:--:|
| FAC-01 | Cerrar la orden y generar la factura con un solo botón. | Admin | Alta | O |
| FAC-02 | Bloquear el cierre si hay saldo pendiente, salvo autorización expresa del administrador para entregar con saldo. | Sistema | Alta | O |
| FAC-03 | La factura incluye logotipo, datos fiscales, número de orden y desglose de piezas, mano de obra e IVA, **en formato CFDI 4.0**. | Sistema | Alta | M |
| FAC-04 | Impedir editar una factura emitida; su cancelación requiere motivo y usuario. | Admin | Media | O |
| FAC-05 | Generar el paquete completo de datos para timbrar el CFDI 4.0 (régimen fiscal, uso de CFDI, código postal y demás obligatorios). En esta fase el contador o el taller lo manda a timbrar con un PAC. | Sistema | Alta | N |
| FAC-06 | Integración directa con un PAC para timbrar desde el sistema. **Fase futura, a definir con el contador.** | Sistema | Baja | N |

#### 3.3.8 Autorizaciones (AUT)

| ID | Requisito | Actor | Prioridad | Est. |
|---|---|---|---|:--:|
| AUT-01 | Exigir autorización del administrador cuando el **total de la orden con IVA** supere $250,000 MXN. No aplica por pieza suelta. | Sistema | Alta | M |
| AUT-02 | Bloquear la compra de piezas y el inicio del trabajo hasta que la orden esté autorizada. | Sistema | Alta | O |
| AUT-03 | Permitir que solo el administrador autorice, sin delegar. | Admin | Alta | O |
| AUT-04 | Permitir al administrador autorizar la entrega con saldo pendiente. | Admin | Alta | O |
| AUT-05 | Registrar cada autorización con usuario, fecha, hora y monto. | Sistema | Alta | O |
| AUT-06 | Mostrar al administrador, también desde celular, las órdenes que esperan su autorización. | Admin | Media | O |
| AUT-07 | Si el total de una orden ya autorizada sube más allá de la tolerancia, congelar compras y trabajo hasta una nueva autorización del administrador. | Sistema, Admin | Alta | N |
| AUT-08 | Parámetro configurable de tolerancia (5 % o 10 %) para exigir reautorización. | Admin | Media | N |

#### 3.3.9 Reportes (REP)

| ID | Requisito | Actor | Prioridad | Est. |
|---|---|---|---|:--:|
| REP-01 | Panel matutino con autos por etapa, piezas que llegan esta semana y órdenes que esperan autorización. | Admin | Media | O |
| REP-02 | Reporte semanal de lo facturado y lo pendiente de cobro. | Admin | Media | O |
| REP-03 | Reporte de ingresos generados y carga de trabajo por mecánico, para repartir bonos. | Admin | Baja | O |
| REP-04 | Reporte de valor en custodia para la aseguradora. | Admin | Media | O |
| REP-05 | Exportar reportes a Excel y PDF. | Admin | Media | O |
| REP-07 | Margen por orden: costo real en pesos (con tipo de cambio) contra precio cobrado. | Admin | Baja | N |

#### 3.3.10 Seguridad (SEG, parte funcional)

| ID | Requisito | Actor | Prioridad | Est. |
|---|---|---|---|:--:|
| SEG-01 | Autenticar a cada usuario de forma individual con tres roles: Administrador (1), Mecánico (3) y Recepción (1). | Todos | Alta | O |
| SEG-02 | Ocultar a los mecánicos los precios de cobro y las ganancias. | Sistema | Alta | O |
| SEG-03 | Ocultar a recepción las finanzas y lo que gana cada mecánico. | Sistema | Alta | O |
| SEG-04 | Dar al administrador acceso total. | Admin | Alta | O |
| SEG-16 | Migrar los datos actuales de la libreta y el Excel. | Admin | Baja | O |
| SEG-17 | Marcar clientes como confidenciales. | Admin | Alta | N |
| SEG-18 | En órdenes de clientes confidenciales, el mecánico ve solo placas y el trabajo asignado, sin nombre del dueño. | Sistema | Alta | N |

### 3.4 Requisitos no funcionales

| ID | Requisito | Categoría | Prioridad | Est. |
|---|---|---|---|:--:|
| SEG-05 | Permisos por rol **y por cliente**, no solo por rol. | Seguridad | Alta | M |
| SEG-06 | Bitácora de auditoría inmutable de altas, cambios, cancelaciones y autorizaciones. | Auditabilidad | Alta | O |
| SEG-07 | Borrado lógico: nada se elimina físicamente. | Integridad | Alta | O |
| SEG-08 | Respaldo automático diario, con pérdida máxima aceptable de 1 día de datos. | Disponibilidad | Alta | O |
| SEG-09 | Guardar una copia de los respaldos fuera del taller. | Disponibilidad | Alta | O |
| SEG-10 | Mostrar una orden o resultado de búsqueda en 2 a 3 segundos como máximo. | Rendimiento | Alta | O |
| SEG-11 | Interfaz de tableta con botones grandes, apta para manos sucias. | Usabilidad | Alta | O |
| SEG-12 | Soportar tableta (mecánicos), computadora (recepción) y celular (administrador, solo consulta). | Compatibilidad | Alta | O |
| SEG-13 | No pedir dos veces el mismo dato al capturar. | Usabilidad | Alta | O |
| SEG-14 | Dimensionar para 5 usuarios, unos 8 ingresos por semana y 10 autos simultáneos. | Capacidad | Media | O |
| SEG-15 | Cifrar los datos en tránsito y en reposo. | Seguridad | Media | O |
| VEH-08 | Almacenar las fotos en un servidor de archivos aparte, no en la base de datos (peor caso: ~300 MB por auto y hasta ~2.4 GB por semana). | Almacenamiento | Media | N |
| REP-06 | Los reportes pueden entregarse hasta un mes después del arranque. | Alcance | N/A | O |
| SEG-19 | Aplicar la restricción de datos confidenciales a nivel de base de datos (seguridad por fila), no solo en la interfaz. | Seguridad | Alta | N |
| SEG-20 | Registrar quién consultó expedientes confidenciales y cuándo. | Auditabilidad | Media | N |

### 3.5 Requisitos modificados respecto del levantamiento inicial

Los siete cambios no son correcciones cosméticas: cada uno altera el modelo de datos o el flujo
de una operación, y por eso se documentaron por separado.

| ID | Cambio | Motivo | Impacto en el diseño |
|---|---|---|---|
| CLI-03 | El descuento VIP se vuelve automático y se separan cortesía y recogida en requisitos propios. | El cliente quería que el descuento no dependiera de que el cajero lo recordara. | Columnas `es_vip` y `descuento` en `clientes`; el cálculo se hace en el backend sobre la mano de obra. |
| VEH-03 | De "fotos del estado" a un expediente de hasta 30 fotos por auto, con tres etapas y firma en la entrega. | Litigios por daños previos no documentados. | Tabla `fotos_vehiculo` con `etapa ENUM('Ingreso','Proceso','Entrega')` y `firma_conformidad`. |
| AUT-01 | El umbral de $250,000 se evalúa sobre el **total de la orden con IVA**, no por pieza. | Evitar que una orden cara pasara sin revisión por estar fragmentada en piezas. | Columna `requiere_autorizacion` en `ordenes_servicio` e índice propio. |
| PAG-03 | El anticipo del 50 % deja de ser una regla fija y pasa a depender de un umbral configurable de piezas caras. | Rigidez: había órdenes grandes de pura mano de obra. | `parametros.umbral_piezas_caras` y tabla `autorizaciones`. |
| PRV-07 | Se agrega el anticipo del 50 % como condición para enviar la orden de compra. | El taller adelantaba dinero a proveedores sin respaldo del cliente. | Validación en el flujo de compras contra `pagos`. |
| FAC-03 | La factura debe cumplir CFDI 4.0, no solo "llevar logotipo y desglose". | Requisito fiscal real. | Columnas fiscales en `clientes` y `facturas` (RFC, razón social, régimen, uso de CFDI, CP, UUID). |
| SEG-05 | Los permisos son por rol **y por cliente**. | Un mecánico no debe ver el expediente de una figura pública aunque tenga el rol adecuado. | Columnas `confidencial`, `responsable_id` y enmascaramiento en `core/privacidad.py`. |

### 3.6 Requisitos nuevos y su justificación

| Grupo | Requisitos nuevos | Justificación |
|---|---|---|
| Cortesía y recogida | CLI-07, CLI-08 | El beneficio VIP prometía auto de cortesía y recogida a domicilio, pero no existía dónde registrar el préstamo ni las instrucciones del chofer. |
| Fotos | VEH-08 | Guardar imágenes en la base de datos habría inflado el respaldo diario muy por encima de lo razonable. |
| Reautorización | AUT-07, AUT-08 | Una orden autorizada podía crecer sin control durante la reparación. |
| Umbral de piezas caras | PAG-06 | El monto de $20,000–$30,000 debía ajustarse sin tocar código. |
| Moneda | PAG-07, PRV-09, PRV-10 | Las compras son en EUR y GBP; cobrar en otra moneda complicaba el cumplimiento fiscal y ocultaba el margen real. |
| CFDI | FAC-05, FAC-06 | Se separó "generar los datos para timbrar" (esta fase) de "timbrar con un PAC" (fase futura). |
| Margen | REP-07 | Sin costo real en pesos no se puede saber si una orden fue rentable. |
| Confidencialidad | SEG-17 a SEG-20 | La discreción con figuras públicas exige marcar al cliente, ocultar su nombre, aplicar la regla en la base de datos y registrar quién consultó el expediente. |

### 3.7 Trazabilidad requisito → tabla → endpoint

| Módulo | Tablas que lo soportan | Endpoints principales |
|---|---|---|
| Clientes | `clientes` | `GET/POST /api/v1/clientes`, `GET/PUT /api/v1/clientes/{id}` |
| Vehículos | `vehiculos`, `polizas_seguro` | `GET/POST /api/v1/vehiculos`, `GET/PUT /api/v1/vehiculos/{id}` |
| Órdenes | `ordenes_servicio`, `detalle_orden`, `historial_etapas`, `orden_mecanicos`, `fotos_vehiculo` | `GET/POST /api/v1/ordenes`, `GET /api/v1/ordenes/{id}`, `POST /api/v1/ordenes/{id}/avanzar-etapa`, `POST /api/v1/ordenes/{id}/registrar-avance` |
| Inventario | `refacciones`, `movimientos_inventario` | `GET /api/v1/refacciones`, `POST /api/v1/refacciones/{id}/entrada` |
| Proveedores y compras | `proveedores`, `compras`, `detalle_compra` | Modelo y tablas listos; endpoints en la siguiente fase |
| Pagos | `pagos` | Modelo y tablas listos; endpoints en la siguiente fase |
| Facturación | `facturas` | Modelo y tablas listos; endpoints en la siguiente fase |
| Autorizaciones | `autorizaciones`, `parametros` | Modelo y tablas listos; endpoints en la siguiente fase |
| Reportes | Consultas sobre todas las anteriores | Pendiente (REP-06 permite entregarlos un mes después) |
| Seguridad | `usuarios`, `bitacora`, `parametros` | `POST /api/v1/login`, `POST /api/v1/login/token`, `GET /api/v1/usuarios`, `POST /api/v1/usuarios/{id}/restablecer-password` |

### 3.8 Verificación del criterio de aceptación

| Paso del criterio del primer día | Requisito | Implementado | Cómo se comprueba |
|---|---|:--:|---|
| Registrar cliente | CLI-01 | Sí | `POST /clientes` con nombre, teléfonos, correo y dirección. |
| Registrar auto | VEH-01, VEH-02 | Sí | `POST /vehiculos` con `cliente_id` vigente. |
| Abrir orden | ORD-01 | Sí | `POST /ordenes`; nace en estado `Recibido`. |
| Mover por las cuatro etapas | ORD-02, ORD-04 | Sí | `POST /ordenes/{id}/avanzar-etapa` y `registrar-avance`. |
| Descontar piezas | INV-02 | Sí | `registrar-avance` inserta en `detalle_orden` y resta `stock_actual`. |
| Facturar | FAC-01 a FAC-03 | Parcial | Tablas y datos fiscales listos; la generación del documento es de la siguiente fase. |

La única brecha declarada del criterio es la emisión del documento fiscal, que depende de la
integración con un PAC (FAC-06) y de la definición del contador. Todo lo demás está cubierto
por código y por restricciones de la base de datos.

## 4. Software, lenguajes y herramientas

### 4.1 Criterio de selección

El taller tiene cinco usuarios, ocho ingresos por semana y diez autos simultáneos (SEG-14). Ese
tamaño descarta cualquier solución empresarial pesada: no hace falta un clúster, ni colas de
mensajes, ni microservicios. La restricción real es otra: **el sistema debe ser mantenible por
una sola persona y auditable**, porque cada peso que se cobra y cada pieza que sale del almacén
tiene que poder justificarse meses después.

Con ese criterio se eligió una arquitectura de tres capas con tecnologías maduras, gratuitas y
con documentación abundante. Todas las versiones que aparecen abajo son las que realmente
declara el repositorio, no versiones genéricas.

### 4.2 Tecnologías del sistema

| Capa | Tecnología | Versión | Función en AutoPulse Elite | Por qué se eligió |
|---|---|---|---|---|
| Datos | **MySQL** | 8.x (InnoDB) | Motor relacional de las 21 tablas, triggers, transacciones y claves foráneas. | Es el motor relacional más difundido, gratuito en su edición Community, con transacciones ACID reales en InnoDB, `ENUM` nativo y soporte de `utf8mb4`. El taller ya tenía experiencia con él y MySQL Workbench permite revisar el esquema sin escribir consultas. |
| Datos | **MySQL Workbench** | 8.x | Cliente visual para ejecutar los scripts, inspeccionar tablas y ver relaciones. | Permite ejecutar los bloques SQL en orden, revisar el diseño y exportar el diagrama E-R sin instalar nada adicional. Es la herramienta con la que se validó cada script. |
| Backend | **Python** | 3.13.17 | Lenguaje del servidor. | Sintaxis legible, biblioteca estándar suficiente (`hashlib.scrypt`, `hmac`) y un ecosistema de validación de datos que reduce el código repetitivo. Para un equipo de una persona, la velocidad de lectura del código importa más que el rendimiento bruto. |
| Backend | **FastAPI** | 0.163.1 | Framework HTTP de la API REST. | Genera documentación OpenAPI automática en `/docs` (útil para probar sin frontend), valida con Pydantic y permite declarar permisos por endpoint con dependencias, que es exactamente el patrón que exige el control por rol. |
| Backend | **SQLAlchemy** | 2.1.8 | ORM y capa de acceso a datos. | Modelos tipados con `Mapped[...]`, control explícito de transacciones (`flush`, `commit`, `rollback`) y `with_for_update()` para bloquear filas. Se necesitaba control fino del SQL, no un ORM que lo escondiera. |
| Backend | **PyMySQL** | 1.2.4 (declarado) | Driver de conexión a MySQL. | Implementación pura en Python, sin compilar extensiones; suficiente para la concurrencia del taller y más simple de instalar en Windows. |
| Backend | **Pydantic / pydantic-settings** | 2.14.3 / 2.16.3 | Validación de payloads y configuración por entorno. | Los esquemas de entrada rechazan datos inválidos antes de tocar la base de datos y la configuración falla al arrancar si falta una variable, en lugar de fallar a mitad de una operación. |
| Backend | **PyJWT** | 2.15.1 | Firma y verificación de tokens JWT (HS256). | Biblioteca pequeña y sin dependencias pesadas; cubre exactamente lo necesario para emitir y validar el token de sesión. |
| Backend | **Uvicorn** | 0.54.0 | Servidor ASGI. | Servidor de referencia para FastAPI, con recarga automática en desarrollo. |
| Backend | **Alembic** | 1.20.1 | Herramienta de migraciones (instalada). | Se dejó disponible para la evolución futura del esquema. En esta fase la fuente de verdad son los scripts `sql/`, por lo que no se generaron revisiones automáticas. |
| Frontend | **React** | 19.3.1 | Biblioteca de interfaz. | Modelo de componentes que permite reutilizar formularios y tablas, y un ecosistema amplio. La interfaz debe cambiar según el rol, y condicionar el render por permisos es directo con componentes. |
| Frontend | **TypeScript** | 6.0.3 | Tipado estático del frontend. | El dominio tiene enums y campos opcionales (precios que el mecánico no ve, `total` que puede ser `null`). El compilador detecta esos casos antes de que lleguen a producción. |
| Frontend | **Vite** | 8.3.6 | Servidor de desarrollo y empaquetador. | Arranque casi instantáneo y proxy `/api` hacia FastAPI, lo que evita configurar CORS en desarrollo. |
| Frontend | **Tailwind CSS** | 4.3.5 | Estilos utilitarios. | Permite construir la interfaz de tableta con botones grandes (SEG-11) sin mantener hojas de estilo paralelas, y mantiene el diseño consistente entre pantallas. |
| Frontend | **React Router** | 7.18.5 | Ruteo del lado del cliente. | Rutas protegidas por rol y redirección al login cuando la sesión expira. |
| Frontend | **Axios** | 1.21.1 | Cliente HTTP. | Interceptores para adjuntar el JWT y para cerrar la sesión ante un `401`, en un solo lugar. |
| Frontend | **Recharts / Lucide React** | 3.10.1 / 1.73.0 | Gráficas e iconografía. | Recharts cubre los indicadores del tablero; Lucide aporta iconos consistentes y livianos. |
| Desarrollo | **Visual Studio Code** | Última estable | Editor de código. | Depuración integrada de Python y Node, terminal y extensiones de SQLAlchemy y Tailwind en un solo entorno. |
| Desarrollo | **OpenCode** | Agente CLI | Asistente de desarrollo. | Se usó como apoyo para revisar el esquema, generar documentación y detectar inconsistencias entre el DDL y los modelos. Las decisiones de diseño y la validación final quedaron del lado humano. |
| Desarrollo | **Git** | 2.55.0 | Control de versiones. | Permite reconstruir la evolución del esquema y de los scripts. El repositorio tiene un commit inicial (`2853000`) que concentra la primera entrega funcional. |

> **Nota de honestidad técnica:** el proyecto declara MySQL 8.x, pero el servicio local
> (`MySQL267`) apunta a un archivo de configuración en una unidad externa que no siempre está
> conectada. Durante la elaboración de este reporte la base no estaba levantada, por lo que las
> validaciones descritas se hicieron contra los scripts y el diccionario de datos del
> repositorio, no contra una instancia en ejecución. Esa limitación se retoma en la sección 8.

### 4.3 Arquitectura general

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
│  Seguridad: JWT HS256 + dependencia requiere_roles()          │
│  Privacidad: enmascaramiento por rol (SEG-17, SEG-18)         │
└───────────────────────────┬──────────────────────────────────┘
                            │  SQLAlchemy 2.1.8 + PyMySQL
┌───────────────────────────▼──────────────────────────────────┐
│  MySQL 8.x — base autopulse_elite · InnoDB · utf8mb4          │
│  21 tablas · 24 relaciones · 6 triggers · bitácora inmutable  │
└──────────────────────────────────────────────────────────────┘
```

La separación es estricta: el frontend nunca ejecuta SQL, el backend nunca renderiza HTML y la
base de datos es la última autoridad sobre la integridad. Cuando una regla puede expresarse en
el esquema (una llave foránea, un `ENUM`, un `UNIQUE`), se expresa ahí; cuando no puede, se
resuelve con un trigger o con una transacción del backend, y en ambos casos queda documentada.

### 4.4 Herramientas descartadas

| Alternativa | Motivo del descarte |
|---|---|
| Django | Trae administrador y ORM con más capa de abstracción; el proyecto necesitaba control explícito de transacciones y bloqueos de fila, y no requería el admin autogenerado. |
| PostgreSQL | Técnicamente superior en tipos y `CHECK`, pero el taller y el material del curso están orientados a MySQL; migrar no aportaba valor al alcance. |
| MongoDB | El dominio es fuertemente relacional (orden → detalle → refacción → movimiento) y la auditoría exige integridad referencial que un documento no garantiza igual. |
| Next.js | El sistema no necesita renderizado en servidor ni SEO; una SPA con Vite es más simple de desplegar en el taller. |
| `passlib` / `bcrypt` | `hashlib.scrypt` viene en la biblioteca estándar y evita una dependencia nativa que complica la instalación en Windows (ADR-004). |
| Docker | El despliegue es un solo servidor con MySQL local; añadir contenedores habría sumado complejidad operativa sin beneficio medible para cinco usuarios. |

---

## 5. Desarrollo de la base de datos

### 5.1 Organización de los scripts SQL

El esquema se construyó por bloques, en el orden en que las tablas pueden crearse sin violar
llaves foráneas. Cada archivo es ejecutable de forma independiente sobre una base vacía y usa
`CREATE TABLE IF NOT EXISTS`, de modo que volver a correrlo no destruye datos.

| Archivo | Bloque | Tablas que crea | Requisitos que cubre |
|---|---|---|---|
| `sql/01_catalogos.sql` | Catálogos base | `clientes`, `proveedores`, `mecanicos`, `servicios` | CLI-01 a CLI-06, PRV-01, PRV-02, ORD-09, ORD-10 |
| `sql/02_vehiculos.sql` | Vehículos | `vehiculos`, `polizas_seguro` | VEH-01 a VEH-07 |
| `sql/03_inventario.sql` | Inventario y compras | `refacciones`, `compras`, `detalle_compra`, `movimientos_inventario` | INV-01 a INV-05, PRV-03 a PRV-09 |
| `sql/04_ordenes.sql` | Órdenes de servicio | `ordenes_servicio`, `detalle_orden`, `fotos_vehiculo` + triggers XOR | ORD-01 a ORD-13, VEH-03, VEH-08 |
| `sql/05_finanzas.sql` | Finanzas | `pagos`, `facturas`, `autorizaciones` | PAG-01 a PAG-07, FAC-01 a FAC-06, AUT-01 a AUT-08 |
| `sql/06_seguridad.sql` | Seguridad y cierre | `usuarios`, `bitacora`, `orden_mecanicos`, `historial_etapas`, `parametros` + triggers de inmutabilidad | SEG-01 a SEG-07, SEG-17 a SEG-20, ORD-06, ORD-08 |
| `sql/07_datos_prueba.sql` | Datos de prueba | Semillas de catálogos, parámetros y usuarios | Apoyo a desarrollo |
| `sql/08_datos_prueba_extra.sql` | Datos de prueba ampliados | 5 clientes, 5 vehículos, 2 mecánicos, 3 servicios y 5 órdenes | Apoyo a desarrollo |
| `sql/09_avance_mecanico.sql` | Evolución | Agrega `ordenes_servicio.diagnostico` de forma idempotente | ORD-04, ORD-10 |

El bloque 9 merece una aclaración: el diagnóstico del mecánico **no** es la falla reportada por
el cliente. La primera es lo que el cliente cuenta al dejar el auto; el segundo es lo que el
técnico encuentra al revisarlo. Mezclarlos habría borrado una parte de la historia, así que se
guardan en columnas distintas y el script verifica en `information_schema` si la columna ya
existe antes de crearla.

### 5.2 Convenciones de diseño aplicadas

| Convención | Regla | Ejemplo |
|---|---|---|
| Idioma | Tablas, columnas y comentarios en español, `snake_case`. | `ordenes_servicio`, `fecha_estimada_llegada` |
| Identificadores | `id INT UNSIGNED AUTO_INCREMENT` como llave primaria en todas las tablas. | `id` |
| Dinero | `DECIMAL(12,2)`; nunca `FLOAT`, para no arrastrar errores de redondeo en pagos e IVA. | `precio_unitario`, `total_mxn` |
| Estados | `ENUM` con los valores del negocio, en español y con mayúscula inicial. | `estado ENUM('Recibido','Diagnostico','Reparacion','Listo')` |
| Fechas | `DATETIME` para marcas de tiempo; `DATE` solo cuando el dato es un día sin hora (vigencias). | `created_at`, `vigencia_fin` |
| Booleanos | `TINYINT(1)` con `DEFAULT 1` para `activo` y `DEFAULT 0` para banderas. | `es_vip`, `confidencial`, `firma_conformidad` |
| Borrado | Lógico: `activo = 0`. Ninguna tabla de negocio admite `DELETE`. | `UPDATE clientes SET activo = 0` |
| Llaves foráneas | `ON DELETE RESTRICT` y `ON UPDATE CASCADE`; nombradas `fk_<tabla>_<referencia>`. | `fk_vehiculos_cliente` |
| Índices | `idx_<tabla>_<columna>`; los únicos, `uq_<tabla>_<columna>`. | `idx_vehiculos_placas`, `uq_usuarios_correo` |
| Auditoría | `created_at` y `updated_at` con `CURRENT_TIMESTAMP` en toda tabla; `activo` para vigencia. | `updated_at ... ON UPDATE CURRENT_TIMESTAMP` |
| Codificación | `utf8mb4` / `utf8mb4_unicode_ci` en todas las tablas. | Acentos y búsquedas sin distinguir mayúsculas |
| Comentarios | Cada tabla y cada columna llevan `COMMENT` con su propósito y el requisito que la origina. | `COMMENT 'Clientes del taller, incluidos VIP y confidenciales (CLI-01 a CLI-06)'` |
| Integridad condicional | Donde un `CHECK` no es viable, se usa un trigger. | Exclusividad `servicio_id` / `refaccion_id` |

Dos decisiones de esta tabla necesitan justificación porque van contra la intuición:

1. **`ON DELETE RESTRICT` en todo.** Si un cliente se eliminara, sus órdenes quedarían sin
   dueño y la facturación histórica perdería sentido. Con `RESTRICT`, la base impide el borrado
   incluso si alguien ejecuta SQL a mano. La baja se hace apagando `activo`.
2. **`CHECK` no se usa para la exclusividad del detalle.** MySQL 8 acepta `CHECK`, pero la tabla
   `detalle_orden` tiene dos llaves foráneas con `ON UPDATE CASCADE`; combinar esa cláusula con
   una restricción `CHECK` sobre las mismas columnas produce fallos al actualizar en cascada.
   Se resolvió con triggers `BEFORE INSERT` y `BEFORE UPDATE`, que además devuelven un mensaje
   de error legible en lugar de un código genérico.

### 5.3 Ingeniería inversa: del DDL a los modelos SQLAlchemy

#### 5.3.1 Qué se hizo y en qué orden

En este proyecto la ingeniería inversa no consistió en "adivinar el esquema desde una base
desconocida". El DDL escrito en `sql/` fue la fuente de verdad y los modelos de SQLAlchemy se
derivaron de él, verificando después que coincidieran con la base real. El orden fue:

1. **Diseño del DDL por bloques**, con comentarios por columna y requisito asociado.
2. **Creación de los modelos** en `backend/app/models/`, una clase por tabla, con
   `Mapped[...]`, `mapped_column(...)` y `relationship(...)`.
3. **Verificación contra MySQL** con el inspector de SQLAlchemy: se compararon nombres de
   tablas, columnas, tipos, nulabilidad, llaves y valores de `ENUM`.
4. **Ajuste de discrepancias** en el DDL o en el modelo, siempre dejando el DDL como árbitro.

La verificación se apoya en el inspector, que es la API de introspección de SQLAlchemy:

```python
from sqlalchemy import create_engine, inspect

engine = create_engine(
    "mysql+pymysql://usuario:password@localhost:3306/autopulse_elite?charset=utf8mb4"
)
inspector = inspect(engine)

tablas = inspector.get_table_names()
print(len(tablas))                      # 21

for tabla in tablas:
    columnas = inspector.get_columns(tabla)
    fks = inspector.get_foreign_keys(tabla)
    indices = inspector.get_indexes(tabla)
    print(f"{tabla}: {len(columnas)} columnas, {len(fks)} FK, {len(indices)} índices")
```

Ese recorrido es reproducible en cualquier momento y no depende de tener el proyecto abierto en
un editor: si alguien agrega una columna al DDL y olvida el modelo, la comparación lo delata.

#### 5.3.2 Resultado de la verificación

| Verificación | Resultado |
|---|---|
| Tablas encontradas | 21, iguales a las declaradas en el DDL |
| Columnas totales | 218 |
| Relaciones foráneas | 24 |
| Triggers | 6 (2 de exclusividad, 4 de inmutabilidad) |
| Tablas sin relaciones | 1 (`parametros`, por diseño: es configuración global) |
| Diferencias DDL ↔ modelo | Ninguna abierta al cierre de esta etapa |

#### 5.3.3 Por qué no se usó `alembic revision --autogenerate`

Alembic está instalado y declarado en `requirements.txt`, pero **no se generaron revisiones
automáticas**. Las razones:

- El esquema se entrega como scripts SQL legibles, comentados y ejecutables en orden; esa es la
  documentación que el taller puede leer sin conocer Python.
- El autogenerado de Alembic compara modelos contra una base viva. Como el DDL es la fuente de
  verdad, cualquier diferencia se corrige en el DDL y luego se propaga al modelo, no al revés.
- Un `autogenerate` sobre 21 tablas produce una revisión inicial enorme y difícil de revisar,
  que además no captura triggers ni la lógica de `ENUM`.

Alembic queda como herramienta para el día en que el esquema deba evolucionar en producción sin
detener el sistema; en ese momento sí tendrá sentido escribir migraciones incrementales.

#### 5.3.4 Correspondencia entre el DDL y el modelo

Cada modelo declara explícitamente lo que el DDL implica. Un ejemplo real, el de
`ordenes_servicio`:

```python
class OrdenServicio(Base):
    __tablename__ = "ordenes_servicio"

    id: Mapped[int] = mapped_column(INTEGER(unsigned=True), primary_key=True)
    cliente_id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), ForeignKey("clientes.id"), nullable=False
    )
    vehiculo_id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), ForeignKey("vehiculos.id"), nullable=False
    )
    mecanico_id: Mapped[int | None] = mapped_column(
        INTEGER(unsigned=True), ForeignKey("mecanicos.id"), nullable=True
    )
    estado: Mapped[str] = mapped_column(
        Enum("Recibido", "Diagnostico", "Reparacion", "Listo", name="estado_orden"),
        nullable=False,
        default="Recibido",
    )
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
```

Los detalles que se cuidaron en la traducción:

- **`unsigned=True`** en los identificadores, porque el DDL usa `INT UNSIGNED`.
- **`Numeric(12, 2)`** en lugar de `Float`, para conservar la precisión del dinero.
- **`ON UPDATE CASCADE`** declarado en la llave foránea, no solo en la base, para que el
  `metadata` refleje el comportamiento real.
- **`relationship()` con `back_populates`** en ambos lados, para navegar el grafo sin consultas
  N+1 accidentales.
- **`TYPE_CHECKING`** para las importaciones de relaciones, evitando ciclos entre módulos.

### 5.4 Inventario de tablas

Las 21 tablas se agruparon en seis dominios. Esta agrupación no es solo didáctica: define el
orden de creación de los scripts y el orden en que se cargan los datos de prueba.

#### 5.4.1 Catálogos

| Tabla | Propósito | Llave primaria | Llaves foráneas | Notas de diseño |
|---|---|---|---|---|
| `clientes` | Personas y empresas que traen autos al taller. | `id` | — | `categoria ENUM('Regular','VIP')`, `descuento_mano_obra`, `permite_pagos_parciales`, `confidencial` y los datos fiscales CFDI (`rfc`, `razon_social`, `regimen_fiscal`, `codigo_postal`). |
| `proveedores` | Proveedores internacionales de refacciones. | `id` | — | `pais`, `tiempo_entrega_dias` y `moneda` permiten calcular el tiempo de entrega (PRV-02) y la moneda de compra (PRV-09). |
| `mecanicos` | Personal técnico del taller. | `id` | — | `especialidad` y `notas`; se relaciona con `usuarios` cuando el mecánico también inicia sesión. |
| `servicios` | Catálogo de mano de obra. | `id` | — | `precio_mano_obra` es la base del descuento VIP del 10 %, que se aplica solo a este concepto. |

#### 5.4.2 Vehículos

| Tabla | Propósito | Llave primaria | Llaves foráneas | Notas de diseño |
|---|---|---|---|---|
| `vehiculos` | Autos registrados, siempre con dueño. | `id` | `cliente_id → clientes.id` | `placas` y `vin` con índice para búsquedas de 3 segundos (VEH-06); `valor_aproximado` alimenta el valor en custodia (VEH-07). |
| `polizas_seguro` | Pólizas asociadas a un vehículo. | `id` | `vehiculo_id → vehiculos.id` | `vigencia_fin` indexada para la alerta de 30 días (VEH-05). Un vehículo puede tener varias pólizas a lo largo del tiempo. |

#### 5.4.3 Inventario y compras

| Tabla | Propósito | Llave primaria | Llaves foráneas | Notas de diseño |
|---|---|---|---|---|
| `refacciones` | Catálogo de piezas y consumibles con existencias. | `id` | `proveedor_id → proveedores.id` | `es_especial` distingue las piezas por marca que no se almacenan (INV-04); `stock_actual` y `stock_minimo` sostienen la alerta de INV-03. |
| `compras` | Órdenes de compra a proveedores. | `id` | `proveedor_id`, `orden_id → ordenes_servicio.id` | Guarda `moneda_original`, `tipo_cambio`, `total_moneda_original` y `total_mxn` (PRV-09), además de `solicitado_por`, `aprobado_por` y `fecha_aprobacion` (PRV-05, PRV-07). La FK a `ordenes_servicio` se agregó en el bloque 4 para cerrar el hueco de PRV-05. |
| `detalle_compra` | Piezas de cada orden de compra. | `id` | `compra_id → compras.id`, `refaccion_id → refacciones.id` | Tabla puente entre compras y refacciones, con `precio_unitario_moneda` para conservar el costo histórico. |
| `movimientos_inventario` | Entradas, salidas y ajustes. | `id` | `refaccion_id → refacciones.id` | `tipo ENUM('Entrada','Salida','Ajuste')`, `cantidad`, `motivo` y `usuario`. Es la trazabilidad de INV-02 e INV-05. |

#### 5.4.4 Órdenes de servicio

| Tabla | Propósito | Llave primaria | Llaves foráneas | Notas de diseño |
|---|---|---|---|---|
| `ordenes_servicio` | Núcleo transaccional del taller. | `id` | `cliente_id`, `vehiculo_id`, `mecanico_id` | `estado` con las cuatro etapas, totales desglosados (subtotal, IVA, total), `requiere_autorizacion` (AUT-01), `diagnostico` (bloque 9) y `notas` para la recogida a domicilio (CLI-08). |
| `detalle_orden` | Piezas y mano de obra de cada orden. | `id` | `orden_id`, `servicio_id`, `refaccion_id` | Exactamente uno de `servicio_id` o `refaccion_id` debe estar presente; `precio_unitario` congela el precio del momento (ORD-10, PAG-01). |
| `fotos_vehiculo` | Evidencia fotográfica del estado del auto. | `id` | `orden_id → ordenes_servicio.id` | `url_foto` apunta al archivo fuera de la base (VEH-08), `etapa ENUM('Ingreso','Proceso','Entrega')` y `firma_conformidad`. |

#### 5.4.5 Finanzas

| Tabla | Propósito | Llave primaria | Llaves foráneas | Notas de diseño |
|---|---|---|---|---|
| `pagos` | Anticipos y pagos parciales. | `id` | `orden_id → ordenes_servicio.id` | `tipo ENUM('Anticipo','Parcialidad','Liquidacion')`, monto y moneda MXN (PAG-07). |
| `facturas` | Documentos fiscales de una orden. | `id` | `orden_id → ordenes_servicio.id` | `numero_factura` y `uuid_cfdi` son `UNIQUE`; guarda estado, fechas y los datos necesarios para CFDI 4.0 (FAC-03, FAC-05). |
| `autorizaciones` | Aprobaciones del administrador. | `id` | `orden_id → ordenes_servicio.id` | `tipo ENUM('Orden','EntregaConSaldo','Compra')`, monto, `aprobado`, usuario y fecha (AUT-03, AUT-05). |

#### 5.4.6 Seguridad y cierre

| Tabla | Propósito | Llave primaria | Llaves foráneas | Notas de diseño |
|---|---|---|---|---|
| `usuarios` | Cuentas de acceso. | `id` | `mecanico_id → mecanicos.id` (opcional) | `rol ENUM('Administrador','Recepcion','Mecanico')`, `correo UNIQUE`, `password_hash` con formato `scrypt$N$r$p$salt$hash` (ADR-004). |
| `bitacora` | Registro inmutable de operaciones. | `id` | `usuario_id → usuarios.id` | `tabla_afectada`, `registro_id`, `accion` y `detalle`. Sin `updated_at` ni `activo`: un asiento no se corrige, se agrega otro. |
| `orden_mecanicos` | Participación de mecánicos en una orden (N:M). | `id` | `orden_id`, `mecanico_id` | `UNIQUE (orden_id, mecanico_id)` evita duplicados; complementa a `ordenes_servicio.mecanico_id`, que es solo el responsable principal (ADR-003). |
| `historial_etapas` | Cambios de etapa de cada orden. | `id` | `orden_id`, `usuario_id` | `etapa_anterior`, `etapa_nueva` y `created_at`; inmutable por trigger (ORD-06, ADR-006). |
| `parametros` | Configuración del negocio. | `id` | — | `clave UNIQUE` y `valor` como texto; semillas `tolerancia_reautorizacion = 5` y `umbral_piezas_caras = 25000`. Es la única tabla sin relaciones, y es correcto que lo sea. |

### 5.5 Relaciones e integridad referencial

Las 24 relaciones se declaran con llave foránea explícita. Ninguna se apoya en "convención de
nombre": si la relación existe, la base la hace cumplir.

| # | Relación | Cardinalidad | Regla que protege |
|:--:|---|---|---|
| 1 | `clientes` → `vehiculos` | 1 : N | Un auto siempre tiene dueño; un cliente puede tener varios autos. |
| 2 | `clientes` → `ordenes_servicio` | 1 : N | Toda orden pertenece a un cliente registrado. |
| 3 | `vehiculos` → `polizas_seguro` | 1 : N | Un vehículo acumula pólizas a lo largo del tiempo. |
| 4 | `vehiculos` → `ordenes_servicio` | 1 : N | La orden identifica el auto que ingresó. |
| 5 | `mecanicos` → `ordenes_servicio` | 1 : N (opcional) | `mecanico_id` es el responsable principal y puede ser `NULL` al recibir el auto. |
| 6 | `mecanicos` → `orden_mecanicos` | 1 : N | Participación de cada mecánico en una orden. |
| 7 | `mecanicos` → `usuarios` | 1 : 0..1 | Un mecánico puede tener cuenta de acceso; no todos la tienen. |
| 8 | `proveedores` → `refacciones` | 1 : N (opcional) | Una pieza puede no tener proveedor habitual. |
| 9 | `proveedores` → `compras` | 1 : N | Toda compra tiene proveedor. |
| 10 | `compras` → `detalle_compra` | 1 : N | El detalle no existe sin su compra. |
| 11 | `refacciones` → `detalle_compra` | 1 : N | Cada línea de compra apunta a una pieza del catálogo. |
| 12 | `refacciones` → `movimientos_inventario` | 1 : N | Todo movimiento afecta exactamente una pieza. |
| 13 | `refacciones` → `detalle_orden` | 1 : N (opcional) | Una línea es pieza **o** servicio, nunca ambos. |
| 14 | `servicios` → `detalle_orden` | 1 : N (opcional) | La mano de obra se cobra desde el catálogo. |
| 15 | `ordenes_servicio` → `detalle_orden` | 1 : N | Sin orden no hay línea de detalle. |
| 16 | `ordenes_servicio` → `fotos_vehiculo` | 1 : N | La evidencia fotográfica pertenece a una orden concreta. |
| 17 | `ordenes_servicio` → `pagos` | 1 : N | Los pagos parciales se acumulan contra la orden. |
| 18 | `ordenes_servicio` → `facturas` | 1 : N | Una orden puede reemitirse; el `UNIQUE` de número y UUID evita duplicados fiscales. |
| 19 | `ordenes_servicio` → `autorizaciones` | 1 : N | Cada solicitud de aprobación queda ligada a su orden. |
| 20 | `ordenes_servicio` → `orden_mecanicos` | 1 : N | Asignación N:M de mecánicos a la orden. |
| 21 | `ordenes_servicio` → `historial_etapas` | 1 : N | Cada cambio de etapa es un asiento nuevo. |
| 22 | `ordenes_servicio` → `compras` | 1 : N (opcional) | Una compra puede originarse en una orden o ser de reposición general. |
| 23 | `usuarios` → `bitacora` | 1 : N | Todo asiento identifica quién lo provocó. |
| 24 | `usuarios` → `historial_etapas` | 1 : N | Todo cambio de etapa identifica al usuario que lo hizo. |

**Reglas de integridad que la base garantiza por sí sola:**

| Regla | Mecanismo | Requisito |
|---|---|---|
| No existen vehículos sin dueño | `vehiculos.cliente_id NOT NULL` + FK | VEH-02 |
| No existen órdenes sin cliente ni vehículo | FK `NOT NULL` en ambas columnas | ORD-01 |
| No se puede borrar un cliente con órdenes | `ON DELETE RESTRICT` | SEG-07 |
| Un correo de usuario no se repite | `UNIQUE uq_usuarios_correo` | SEG-01 |
| Un número de factura y un UUID CFDI no se repiten | `UNIQUE uq_facturas_numero`, `uq_facturas_uuid` | FAC-03 |
| Un mecánico no se asigna dos veces a la misma orden | `UNIQUE uq_orden_mecanicos (orden_id, mecanico_id)` | ORD-09 |
| Una clave de parámetro es única | `UNIQUE uq_parametros_clave` | AUT-08, PAG-06 |
| Una línea de detalle es pieza o servicio, no ambos | Trigger `trg_detalle_orden_bi/bu` | ORD-10 |
| La bitácora y el historial no se alteran | Triggers `trg_*_bu/bd` | SEG-06, ORD-06 |

### 5.6 Diagrama entidad-relación

El diagrama completo, con las 218 columnas, vive en `docs/erd.md`. Aquí se reproduce la parte
estructural: entidades y relaciones, sin atributos, para que se lea de un vistazo.

```mermaid
erDiagram
    clientes ||--o{ vehiculos : "posee"
    clientes ||--o{ ordenes_servicio : "solicita"
    vehiculos ||--o{ polizas_seguro : "tiene"
    vehiculos ||--o{ ordenes_servicio : "ingresa_en"
    mecanicos |o--o{ ordenes_servicio : "responsable"
    mecanicos ||--o{ orden_mecanicos : "participa"
    mecanicos |o--o{ usuarios : "usuario_de"
    proveedores |o--o{ refacciones : "surte"
    proveedores ||--o{ compras : "recibe_pedido"
    compras ||--o{ detalle_compra : "contiene"
    refacciones ||--o{ detalle_compra : "se_pide"
    refacciones ||--o{ movimientos_inventario : "mueve"
    refacciones |o--o{ detalle_orden : "se_usa"
    servicios |o--o{ detalle_orden : "se_cobra"
    ordenes_servicio ||--o{ detalle_orden : "detalla"
    ordenes_servicio ||--o{ fotos_vehiculo : "documenta"
    ordenes_servicio ||--o{ pagos : "cobra"
    ordenes_servicio ||--o{ facturas : "factura"
    ordenes_servicio ||--o{ autorizaciones : "requiere"
    ordenes_servicio ||--o{ orden_mecanicos : "asigna"
    ordenes_servicio ||--o{ historial_etapas : "cambia_etapa"
    ordenes_servicio |o--o{ compras : "origina"
    usuarios ||--o{ bitacora : "audita"
    usuarios ||--o{ historial_etapas : "provoca"

    clientes {
        int id PK
        varchar nombre
        enum categoria
        tinyint confidencial
        varchar rfc
    }
    vehiculos {
        int id PK
        int cliente_id FK
        varchar placas
        varchar vin
        decimal valor_aproximado
    }
    ordenes_servicio {
        int id PK
        int cliente_id FK
        int vehiculo_id FK
        int mecanico_id FK
        enum estado
        decimal total
        tinyint requiere_autorizacion
    }
    detalle_orden {
        int id PK
        int orden_id FK
        int servicio_id FK
        int refaccion_id FK
        decimal precio_unitario
    }
    usuarios {
        int id PK
        varchar correo
        enum rol
        varchar password_hash
    }
```

**Lectura del diagrama.** El centro es `ordenes_servicio`: casi todo cuelga de ella porque una
orden es el hecho del negocio. `detalle_orden` es la única tabla con dos llaves foráneas
excluyentes, y por eso necesita trigger. `parametros` no aparece porque no se relaciona con
nada: es configuración global. `bitacora` e `historial_etapas` son hojas del grafo y son
inmutables, lo que en términos prácticos significa que solo se insertan.

### 5.7 Triggers

MySQL 8 no permite expresar con `CHECK` la exclusividad de `detalle_orden` cuando las columnas
participan en llaves foráneas con `ON UPDATE CASCADE`, y ninguna restricción declarativa impide
un `UPDATE` sobre la bitácora. Los seis triggers cubren exactamente esos dos huecos: **dos de
integridad condicional y cuatro de inmutabilidad**.

#### 5.7.1 Exclusividad en `detalle_orden`

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

CREATE TRIGGER trg_detalle_orden_bu BEFORE UPDATE ON detalle_orden
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

**Qué impide.** Una línea sin concepto (ni pieza ni mano de obra) sería una fila que suma cero
pero ocupa lugar y confunde los reportes; una línea con ambos conceptos cobraría dos veces la
misma intervención. El trigger obliga a que exista **exactamente uno**.

**Por qué `SIGNAL SQLSTATE '45000'`.** Es el código reservado para errores de negocio definidos
por el usuario. Al llegar al driver, MySQL lo entrega como error 1644 con el texto del mensaje.
El backend lo intercepta y responde `422 Unprocessable Entity` con ese texto, en lugar de un
`500` genérico (ver 5.8.3).

**Por qué dos triggers y no uno.** `BEFORE UPDATE` es obligatorio: sin él, una línea válida
podría "corregirse" a un estado inválido. Un `CHECK` habría cubierto ambos casos, pero la
combinación con `ON UPDATE CASCADE` lo vuelve inviable en este esquema.

#### 5.7.2 Inmutabilidad de los logs

```sql
DELIMITER $$
CREATE TRIGGER trg_bitacora_bu BEFORE UPDATE ON bitacora
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'bitacora: es inmutable, no se permite modificar asientos';
END$$

CREATE TRIGGER trg_bitacora_bd BEFORE DELETE ON bitacora
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'bitacora: es inmutable, no se permite borrar asientos';
END$$
DELIMITER ;
```

Los equivalentes para `historial_etapas` (`trg_historial_etapas_bu` y `_bd`) siguen el mismo
patrón. **Qué impide.** Que alguien "arregle" un asiento de auditoría o borre la evidencia de un
cambio de etapa. Si un dato se capturó mal, la respuesta correcta es insertar un asiento nuevo
que lo corrija, no editar el anterior; así la historia sigue siendo reconstruible.

**Límite conocido y deliberado.** `TRUNCATE` no dispara triggers `BEFORE DELETE` en MySQL. Los
scripts de datos de prueba lo aprovechan para reiniciar el ambiente de desarrollo, y está
documentado en el comentario del `sql/06_seguridad.sql`. En producción, el usuario de la
aplicación no tiene privilegio de `TRUNCATE` ni de `DROP`, con lo que el hueco queda cerrado por
permisos y no por el trigger. Es una decisión consciente: se prefirió un entorno de desarrollo
que se pueda reiniciar a una protección que en la práctica se acabaría desactivando a mano.

#### 5.7.3 Resumen de los seis triggers

| Trigger | Momento | Tabla | Regla | Requisito |
|---|---|---|---|---|
| `trg_detalle_orden_bi` | `BEFORE INSERT` | `detalle_orden` | Exactamente uno de `servicio_id` / `refaccion_id` | ORD-10 |
| `trg_detalle_orden_bu` | `BEFORE UPDATE` | `detalle_orden` | La misma regla al modificar | ORD-10 |
| `trg_bitacora_bu` | `BEFORE UPDATE` | `bitacora` | Prohibido modificar asientos | SEG-06 |
| `trg_bitacora_bd` | `BEFORE DELETE` | `bitacora` | Prohibido borrar asientos | SEG-06 |
| `trg_historial_etapas_bu` | `BEFORE UPDATE` | `historial_etapas` | Prohibido modificar registros | ORD-06 |
| `trg_historial_etapas_bd` | `BEFORE DELETE` | `historial_etapas` | Prohibido borrar registros | ORD-06 |

### 5.8 Procedimientos almacenados, vistas y transacciones

#### 5.8.1 Lo que no existe, y por qué

Una revisión del repositorio confirma que **no hay `CREATE VIEW`, `CREATE PROCEDURE`,
`CREATE FUNCTION` ni `CREATE EVENT`**. Solo existen los seis triggers de la sección anterior.
Esa ausencia es una decisión, no un olvido:

| Elemento ausente | Razón |
|---|---|
| Vistas | La lógica de qué columnas ve cada rol no es fija: depende del rol y de si el cliente es confidencial. Una vista tendría que duplicarse por rol y aun así no resolvería el enmascaramiento de campos, que se hace en serialización. |
| Procedimientos | La lógica transaccional (bloquear refacciones, recalcular totales, escribir bitácora) necesita validaciones y mensajes en español que son más fáciles de probar y versionar en Python. Un procedimiento habría movido esa lógica a un lugar donde el depurador no llega. |
| Funciones | No hay cálculos que se repitan en varias consultas y que justifiquen una función; el IVA y el descuento VIP se calculan en un solo lugar del backend. |
| Eventos | No hay tareas programadas. Los respaldos (SEG-08) son responsabilidad del sistema operativo o del proveedor de infraestructura, no del motor. |

#### 5.8.2 Cómo se manejan las transacciones desde el backend

Toda operación que toca más de una tabla se ejecuta en **una sola transacción**. El caso más
complejo es `POST /api/v1/ordenes/{id}/registrar-avance`, que puede escribir hasta en cinco
tablas: `ordenes_servicio`, `detalle_orden`, `refacciones`, `movimientos_inventario`,
`historial_etapas` y `bitacora`. El orden de las operaciones no es casual:

1. **Bloquear las refacciones antes de tocar la orden**, con `SELECT ... FOR UPDATE`, y hacerlo
   **ordenado por `refaccion_id`**. Si dos mecánicos usan las mismas piezas al mismo tiempo, el
   orden fijo de adquisición de locks evita el interbloqueo (deadlock).
2. **Validar stock** dentro del lock. Si no alcanza, se responde `400` con la cantidad
   disponible y no se escribe nada.
3. **Insertar el detalle y descontar existencias**, dejando un movimiento de inventario por
   pieza.
4. **`db.flush()`** para que los `INSERT` lleguen a la transacción y los totales puedan
   recalcularse leyendo el detalle recién insertado.
5. **Recalcular totales** (subtotal de piezas, mano de obra con descuento VIP, IVA y total).
6. **Escribir `historial_etapas` y `bitacora`** con el usuario autenticado.
7. **`db.commit()`** una sola vez. Ante cualquier excepción, `db.rollback()` deja la base como
   estaba.

```python
# Se recorren y bloquean las refacciones antes de tocar la orden para que
# dos mecanicos no puedan dejar el stock en negativo. Se ordenan por id
# para que las transacciones tomen los locks siempre en el mismo orden.
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

**Por qué `flush()` y no `commit()` intermedio.** `flush()` envía los `INSERT`/`UPDATE` a la
transacción y asigna los `AUTO_INCREMENT`, pero no confirma. Eso permite obtener el `id` de la
orden para las tablas hijas sin abrir la puerta a un estado a medias. Un `commit()` intermedio
dejaría una orden creada sin historial si el siguiente `INSERT` fallara.

#### 5.8.3 Traducción de errores de la base a errores HTTP

| Situación | Error MySQL | Respuesta de la API |
|---|---|---|
| Viola el XOR de `detalle_orden` | 1644 (`SQLSTATE 45000`) | `422` con el mensaje del trigger |
| Falla una llave foránea | 1452 / 1451 | `409` o `400` según el router |
| Correo de usuario duplicado | 1062 | `409 Conflict` |
| Stock insuficiente (validado antes) | — | `400` con disponible y solicitado |
| Falla inesperada | Cualquiera | `500` con mensaje genérico y `rollback` |

La traducción del 1644 es explícita en el router de órdenes:

```python
original = getattr(exc, "orig", None)
if original is not None and getattr(original, "args", None):
    if original.args[0] == 1644 and len(original.args) > 1:
        # Regla de negocio lanzada por un trigger (p. ej. XOR del detalle_orden)
        raise HTTPException(status_code=422, detail=str(original.args[1]))
```

Esto importa para la experiencia de uso: el mecánico ve "debe indicar servicio o refacción,
pero no ambos", no un error 500 sin explicación. Y para la seguridad: un `500` genérico nunca
filtra el SQL ni el nombre de la tabla.

#### 5.8.4 Concurrencia y aislamiento

El motor trabaja con InnoDB y nivel de aislamiento `REPEATABLE READ` (el predeterminado de
MySQL 8). Para el volumen del taller (10 autos simultáneos, 5 usuarios) no hace falta ajustarlo.
Los dos puntos donde la concurrencia podría causar daño se resolvieron así:

- **Stock negativo:** bloqueo pesimista con `FOR UPDATE` y validación dentro del lock.
- **Doble asignación de mecánico:** `UNIQUE (orden_id, mecanico_id)`; el segundo `INSERT` falla
  en la base, no en la aplicación.

El resto de las operaciones son inserciones append-only (bitácora, historial, movimientos) o
actualizaciones de una sola fila, que no compiten entre sí.

### 5.9 Índices y rendimiento

El esquema declara **59 índices secundarios** (sin contar las llaves primarias), nombrados con
el prefijo `idx_` o `uq_`. No se indexó "por si acaso": cada índice responde a una consulta que
el sistema realmente hace.

| Consulta o regla | Índice | Por qué |
|---|---|---|
| Buscar cliente por nombre (CLI-05) | `idx_clientes_nombre` | La búsqueda con `LIKE 'texto%'` usa el prefijo del índice. |
| Filtrar clientes por categoría o confidencialidad | `idx_clientes_categoria`, `idx_clientes_confidencial` | El tablero y el enmascaramiento filtran por estas banderas. |
| Buscar vehículo por placas (VEH-06) | `idx_vehiculos_placas` | Es la búsqueda más frecuente en recepción. |
| Alertar pólizas por vencer (VEH-05) | `idx_polizas_vigencia_fin` | Rango de fechas sobre el vencimiento. |
| Piezas bajo el mínimo (INV-03) | `idx_refacciones_stock (stock_actual, stock_minimo)` | Índice compuesto para comparar ambas columnas. |
| Órdenes por etapa (ORD-03) | `idx_ordenes_estado` | El tablero agrupa por estado. |
| Órdenes por mecánico | `idx_ordenes_mecanico` | Filtro obligatorio para el rol Mecánico. |
| Órdenes que requieren autorización (AUT-01) | `idx_ordenes_requiere_autorizacion` | Bandeja de autorizaciones pendientes. |
| Historial de una orden | `idx_historial_orden`, `idx_detalle_orden_orden` | Se consultan siempre por `orden_id`. |
| Auditoría por usuario, tabla o fecha | `idx_bitacora_usuario`, `idx_bitacora_registro`, `idx_bitacora_fecha` | Tres ejes distintos de investigación. |
| Saldo por orden | `idx_pagos_orden` | Suma de pagos de una orden. |
| Búsqueda de factura | `uq_facturas_numero`, `uq_facturas_uuid` | Únicos y, por tanto, indexados. |

**Lo que se evitó.** No se indexaron columnas de baja selectividad como `activo` por sí sola: un
índice sobre un campo con dos valores no reduce el conjunto de forma útil y solo encarece las
escrituras. Cuando `activo` participa en un filtro, va acompañado de una columna selectiva
(estado, cliente, mecánico) o se resuelve con el índice compuesto correspondiente.

**Medición pendiente.** SEG-10 exige respuestas en 2–3 segundos. Con 5 usuarios y decenas de
órdenes al mes, los índices actuales son más que suficientes; la verificación formal con datos
reales queda para cuando el taller migre su histórico (SEG-16).

### 5.10 Normalización

El esquema está en **tercera forma normal (3FN)** con tres desnormalizaciones deliberadas, cada
una con una razón de negocio y un riesgo controlado.

#### 5.10.1 Primera forma normal (1FN)

Todos los atributos son atómicos: no hay listas separadas por comas ni campos multivalor. La
única excepción aparente son `clientes.telefono1` y `clientes.telefono2`, que no violan 1FN
porque **el requisito CLI-01 fija exactamente dos teléfonos**. Modelar una tabla `telefonos`
habría permitido un número arbitrario, pero también habría obligado a un `JOIN` en cada
consulta de cliente para un dato que siempre son dos columnas. Se documenta como decisión
consciente.

#### 5.10.2 Segunda forma normal (2FN)

No hay dependencias parciales: todos los atributos dependen de la llave completa. Las tablas de
detalle (`detalle_orden`, `detalle_compra`) usan `id` sustituto como PK, pero su unicidad real
es la combinación de la cabecera con el concepto, y ningún atributo depende solo de una parte.

#### 5.10.3 Tercera forma normal (3FN)

No hay dependencias transitivas: el nombre del cliente no se repite en la orden, el nombre del
proveedor no se repite en la refacción y el precio del servicio no se copia en cada línea. Se
accede por `JOIN`.

#### 5.10.4 Desnormalizaciones deliberadas

| Campo | Tabla | Qué se duplica | Por qué | Riesgo y control |
|---|---|---|---|---|
| `precio_unitario` | `detalle_orden` | El precio vigente de `servicios` o `refacciones` | Una orden debe conservar el precio cobrado aunque el catálogo cambie después. Sin esta copia, reimprimir una factura de hace un año daría otro total. | Se escribe una sola vez, al agregar la línea; no se recalcula. |
| `total`, `subtotal`, `iva` | `ordenes_servicio` | La suma de `detalle_orden` | Evita sumar el detalle en cada listado y permite indexar y ordenar por total. | Se recalculan dentro de la misma transacción (`_recalcular_totales`) cada vez que cambia el detalle. |
| `total_moneda_original`, `tipo_cambio`, `total_mxn` | `compras` | El costo convertido a pesos | El tipo de cambio del día de la compra es un dato histórico que no se puede reconstruir después. Guardarlo es la única forma de calcular el margen real (REP-07). | Los tres campos se escriben juntos al registrar la compra; no se editan. |

Ninguna de las tres duplica datos que puedan cambiar sin control: en los tres casos se trata de
**valores congelados en el tiempo**, que es justo lo que la auditoría exige conservar.

#### 5.10.5 Lo que se dejó fuera del modelo

- **Cortesía y recogida (CLI-07, CLI-08):** CLI-08 se resolvió con `ordenes_servicio.notas`. El
  préstamo de auto de cortesía (CLI-07) requeriría una tabla propia (`autos_cortesia` y
  `prestamos`); no se creó porque el requisito quedó en prioridad Media y fuera del criterio del
  primer día. Se registra como deuda de diseño explícita.
- **Fotos firmadas:** `firma_conformidad` es un booleano; no se guarda la firma como imagen. Es
  suficiente para el requisito actual y evita almacenar binarios en la base (VEH-08).
- **Historial de precios de catálogo:** no existe; el precio histórico vive en las líneas de
  detalle, que es donde se necesita.

### 5.11 Datos semilla y evolución del esquema

#### 5.11.1 Semillas

| Script | Contenido | Credenciales o valores |
|---|---|---|
| `sql/07_datos_prueba.sql` | Parámetros, usuarios, catálogos y primeras órdenes | Contraseña de los usuarios de prueba: `AutoPulse2026!` (hash scrypt con salt propio por usuario) |
| `sql/08_datos_prueba_extra.sql` | 5 clientes, 5 vehículos, 2 mecánicos, 3 servicios y 5 órdenes en distintas etapas | Idempotente: usa IDs explícitos y `ON DUPLICATE KEY UPDATE` |

Los parámetros semilla son dos y son los que el negocio pidió poder ajustar sin tocar código:

| Clave | Valor | Efecto |
|---|---|---|
| `tolerancia_reautorizacion` | `5` | Porcentaje de aumento sobre una orden ya autorizada que dispara una nueva autorización (AUT-07, AUT-08). |
| `umbral_piezas_caras` | `25000` | Subtotal de piezas a partir del cual el anticipo del 50 % es obligatorio (PAG-03, PAG-06). |

#### 5.11.2 Evolución del esquema

| Cambio | Script | Técnica |
|---|---|---|
| Agregar `ordenes_servicio.diagnostico` | `09_avance_mecanico.sql` | Verifica `information_schema.COLUMNS` y solo ejecuta el `ALTER TABLE` si la columna no existe. |
| Ligar `compras.orden_id` a órdenes | `04_ordenes.sql` | `ALTER TABLE ... ADD CONSTRAINT` para cerrar el requisito PRV-05 sin recrear la tabla. |
| Reproducir triggers faltantes | `06_seguridad.sql` | Los triggers de `historial_etapas` ya existían en la base; se agregaron al script para que una instalación desde cero quede idéntica. |

La regla que se siguió es que **todo cambio aplicado a mano a la base debe quedar en un script
idempotente**. Si no está en `sql/`, no existe: esa es la única forma de que el esquema se pueda
reconstruir en otra máquina sin depender de la memoria de quien lo instaló.

## 6. Usuarios y roles

### 6.1 Modelo de roles

El sistema define tres roles en un `ENUM` de MySQL y en un tipo de TypeScript. No hay roles
personalizados ni permisos granulares por usuario: el rol es una propiedad de la cuenta y cambia
solo por intervención del administrador.

| Rol | `ENUM` | Perfil de uso | Alcance | Restricciones clave |
|---|---|---|---|---|
| **Administrador** | `Administrador` | Dueño del taller. Computadora y celular. | Acceso total: clientes, vehículos, órdenes, inventario, finanzas, facturación, autorizaciones y usuarios. | Ninguna funcional; es el único que autoriza y el único que administra cuentas. |
| **Recepción** | `Recepcion` | Mostrador. Computadora de escritorio. | Registra clientes y vehículos, abre órdenes, surte inventario y consulta el estado del taller. | No ve finanzas, ni costos de compra, ni lo que gana cada mecánico (SEG-03, PRV-10). No avanza etapas ni autoriza. |
| **Mecánico** | `Mecanico` | Tableta dentro del taller, con botones grandes (SEG-11). | Ve sus órdenes asignadas, registra diagnóstico, refacciones usadas y avance de etapa. | No ve precios, totales, descuentos ni datos personales de clientes confidenciales (SEG-02, SEG-18). No crea clientes, vehículos ni usuarios. |

La elección de tres roles y no de permisos por usuario fue deliberada: con cinco personas, un
sistema de permisos configurables habría agregado una pantalla de administración que nadie
mantiene y un riesgo de configurar mal un permiso. Los permisos están en el código, se prueban
con el código y se documentan en esta tabla.

### 6.2 Matriz de permisos por endpoint

La columna "Mecánico" indica además si el filtro es por fila: un mecánico no solo tiene permiso
sobre el recurso, sino únicamente sobre **sus** órdenes.

| Recurso | Endpoint | Administrador | Recepción | Mecánico |
|---|---|:--:|:--:|:--:|
| Sesión | `POST /api/v1/login` | ✔ | ✔ | ✔ |
| Sesión | `POST /api/v1/login/token` | ✔ | ✔ | ✔ |
| Sesión | `GET /api/v1/login/me` | ✔ | ✔ | ✔ |
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

`requiere_roles` devuelve `403 Forbidden` cuando el rol autenticado no está en la lista. Se
distingue de `401 Unauthorized`, que se reserva para token ausente, inválido o expirado. Esa
distinción no es cosmética: un `401` hace que el frontend cierre la sesión y vuelva al login; un
`403` debe mostrar "no tienes permiso" sin expulsar al usuario.

### 6.3 Autenticación con JWT

#### 6.3.1 Flujo de inicio de sesión

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
        A-->>F: 200 { access_token, token_type, expires_in, usuario }
        F->>F: guarda token en memoria (y en localStorage si "mantener sesión")
        F-->>U: redirige al tablero según rol
    else credenciales inválidas
        A-->>F: 401 "Credenciales incorrectas"
        F->>F: registra intento fallido (bloqueo 15 min)
        F-->>U: mensaje de error
    end
```

#### 6.3.2 Contenido y vigencia del token

El token es un JWT firmado con **HS256** y la clave `JWT_SECRET_KEY` del archivo `.env`. Su
contenido es mínimo a propósito:

| Claim | Valor | Uso |
|---|---|---|
| `sub` | `id` del usuario | Identificar la cuenta. |
| `correo` | Correo del usuario | Mostrar en la interfaz y para trazabilidad. |
| `rol` | `Administrador`, `Recepcion` o `Mecanico` | Informativo; **no** es la autoridad final. |
| `tipo` | `access` | Distinguir el tipo de token. |
| `iat` | Momento de emisión | Auditoría. |
| `exp` | Emisión + **480 minutos** (8 h) | Expiración. |

No se incluyen datos personales del cliente, ni precios, ni permisos: un JWT se puede decodificar
sin la clave, así que cualquier dato dentro del token debe considerarse público. El rol va como
dato informativo porque el backend **recarga el usuario desde la base en cada petición**:

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

Ese detalle resuelve un problema real: si el administrador degrada a un mecánico o da de baja
una cuenta, el cambio surte efecto **de inmediato**, sin esperar a que expire el token. Un JWT
autocontenido con el rol embebido habría dejado a esa persona con sus permisos antiguos hasta
8 horas.

**No hay refresh token.** Al expirar, el usuario vuelve a iniciar sesión. Para una jornada de
trabajo de 8 horas es suficiente y elimina la superficie de ataque de un token de renovación de
larga vida.

#### 6.3.3 Almacenamiento en el navegador

El frontend guarda el token en memoria y, solo si el usuario marca **"Mantener sesión iniciada"**,
también en `localStorage`. Si no lo marca, cerrar la pestaña cierra la sesión. El usuario se
guarda **solo en memoria**; el token es la única credencial persistida.

Esta decisión tiene un costo conocido: `localStorage` es accesible desde JavaScript, así que un
XSS podría leer el token. Las mitigaciones actuales son React (que escapa el contenido por
defecto), la ausencia de `dangerouslySetInnerHTML` y una política de contenido pendiente. La
alternativa robusta —cookie `HttpOnly` + `SameSite`— requiere que frontend y API compartan
dominio y un manejo de CSRF; se documenta como mejora para producción.

### 6.4 Contraseñas

| Aspecto | Implementación |
|---|---|
| Algoritmo | `scrypt` de `hashlib`, nativo de Python/OpenSSL (ADR-004) |
| Parámetros | `N = 16384`, `r = 8`, `p = 1`, `dklen = 64`, salt aleatorio de 16 bytes |
| Formato almacenado | `scrypt$16384$8$1$<salt_b64>$<hash_b64>` |
| Comparación | `hmac.compare_digest` (tiempo constante) |
| Salt | Uno por usuario, generado con `secrets.token_bytes` |
| Rehash | No hay; el formato es autocontenido y permitiría migrar a bcrypt/argon2 agregando un verificador por prefijo |

**Por qué scrypt y no bcrypt.** `hashlib.scrypt` viene en la biblioteca estándar; bcrypt requiere
una extensión compilada que en Windows complica la instalación. scrypt es además resistente a
ataques con hardware especializado por su costo de memoria. Con 8 horas de sesión y cinco
usuarios, el costo de calcular un hash (decenas de milisegundos) es irrelevante.

**Defensa contra enumeración de cuentas.** Si el correo no existe, el backend verifica la
contraseña contra un hash ficticio (`HASH_FICTICIO`) y responde el mismo `401` que ante una
contraseña incorrecta. Sin eso, un atacante podría medir el tiempo de respuesta para descubrir
qué correos están registrados.

**Bloqueo por intentos fallidos.** El frontend registra los intentos en
`lib/intentos-login.ts` y bloquea el formulario 15 minutos tras varios fallos. Es una defensa de
experiencia de uso, **no de seguridad**: se ejecuta en el cliente y puede saltarse. El rate
limiting real corresponde al proxy o al servidor y queda pendiente (ver 6.7).

### 6.5 Autorización y privacidad en la capa de datos

#### 6.5.1 Filtrado de filas

El rol Mecánico no recibe todas las órdenes: la consulta SQL incorpora la restricción antes de
llegar a la base.

```python
def _solo_sus_ordenes(consulta, usuario):
    if usuario.rol != "Mecanico":
        return consulta
    return consulta.where(
        or_(
            OrdenServicio.mecanico_id == usuario.mecanico_id,
            OrdenServicio.id.in_(
                select(OrdenMecanico.orden_id).where(
                    OrdenMecanico.mecanico_id == usuario.mecanico_id,
                    OrdenMecanico.activo.is_(True),
                )
            ),
        )
    )
```

Se consideran tanto el responsable principal (`mecanico_id`) como los participantes
(`orden_mecanicos`), que es la razón de existir de la tabla puente (ADR-003). El filtro se aplica
en SQL porque afecta **qué filas** se devuelven, no solo qué columnas.

#### 6.5.2 Enmascaramiento de campos

El enmascaramiento se hace en la capa de serialización, no en SQL, para no duplicar consultas:
se arma el esquema completo y se reemplazan los valores según el rol.

| Dato | Administrador | Recepción | Mecánico |
|---|:--:|:--:|:--:|
| Nombre del cliente | Completo | Completo | "Cliente confidencial" si `confidencial = 1` |
| Teléfonos, correo, dirección, asistente | Sí | Sí | Ocultos si es confidencial |
| RFC, razón social, régimen fiscal, CP | Sí | Sí | Ocultos si es confidencial |
| Notas del cliente | Sí | Sí | Ocultas si es confidencial |
| `descuento_mano_obra`, `permite_pagos_parciales` | Sí | Sí | Siempre en cero / falso |
| `valor_aproximado` del vehículo | Sí | Sí | Siempre `null` |
| Placas, VIN, marca, modelo, año, km | Sí | Sí | Sí (los necesita para trabajar) |
| `total` de la orden | Sí | Sí | `null` |
| Precios de refacciones | Sí | Sí | No se incluyen en la respuesta |
| Costos de compra y tipo de cambio | Sí | No | No |

La implementación es explícita: una tupla `CAMPOS_PRIVADOS` enumera los campos que se anulan y
`model_copy(update=...)` produce una copia del esquema, de modo que el objeto ORM nunca se
devuelve modificado ni se muta el estado de la sesión.

#### 6.5.3 La brecha de SEG-19

SEG-19 pide aplicar la restricción **a nivel de base de datos**, no solo en la interfaz. MySQL 8
no tiene *row-level security* nativa (a diferencia de PostgreSQL). Lo que existe hoy es:

- Restricción en la capa de aplicación, que es la que atiende el 100 % del tráfico normal.
- Credenciales de base de datos distintas por entorno, con un usuario de aplicación que no es
  `root` en producción.
- Ausencia de endpoints que permitan consultar clientes confidenciales sin pasar por el
  serializador.

Eso **no equivale** a seguridad por fila en el motor. Un usuario con acceso directo a MySQL
podría leer todo. Cerrar la brecha requiere una de tres opciones: vistas por rol con `DEFINER`,
una capa de proxy que reescriba consultas, o migrar a un motor con RLS. Se documenta como deuda
técnica con impacto Alto, porque el requisito es explícito y la solución actual es parcial.

#### 6.5.4 SEG-20: auditoría de consultas a expedientes

El `ENUM` de `bitacora.accion` ya contempla el valor `Consulta_Confidencial`, pero **ningún
endpoint escribe ese asiento todavía**. Es decir: el modelo está preparado, la implementación
está pendiente. Registrarlo es sencillo (un `INSERT` en `bitacora` en cada lectura de un cliente
confidencial), pero tiene un costo: convierte cada consulta en una escritura y puede inflar la
tabla. La decisión de diseño pendiente es si se auditan todas las lecturas o solo las del rol
Mecánico; se deja planteada en la sección 8.

### 6.6 Trazabilidad de acciones

Independientemente del rol, las operaciones que modifican estado dejan rastro. La bitácora
registra usuario, tabla, registro, acción, detalle y fecha; el historial de etapas registra
además la etapa anterior y la nueva.

| Acción | Asiento en `bitacora` | Asiento en `historial_etapas` |
|---|:--:|:--:|
| Crear orden | `Creacion` | Etapa inicial `Recibido` |
| Avanzar etapa | `Actualizacion` | `etapa_anterior → etapa_nueva` |
| Registrar avance con refacciones | `Actualizacion` con el detalle de piezas | Solo si cambió la etapa |
| Restablecer contraseña | `Actualizacion` sobre `usuarios` | — |
| Surtir inventario | `Actualizacion` sobre `refacciones` | — |

Como los triggers bloquean `UPDATE` y `DELETE` sobre ambas tablas, la única forma de "corregir"
un asiento es agregar otro. Eso es intencional: la auditoría no debe poder reescribirse.

### 6.7 Limitaciones de seguridad declaradas

| Limitación | Impacto | Mitigación actual | Trabajo pendiente |
|---|---|---|---|
| Sin rate limiting en el login | Medio | Bloqueo de 15 min en el cliente | Límite por IP y por cuenta en el proxy |
| Token en `localStorage` | Medio | React escapa por defecto; sin HTML crudo | Cookie `HttpOnly` + `SameSite` + CSRF |
| Sin RLS en MySQL (SEG-19) | Alto | Filtrado y enmascaramiento en la app | Vistas por rol o proxy de consultas |
| SEG-20 sin implementar | Medio | El `ENUM` está listo | Auditar lecturas de expedientes confidenciales |
| Sin revocación de token distinta de la baja del usuario | Bajo | Recarga del usuario en cada petición | Lista de tokens revocados si se requiere |
| Sin 2FA | Bajo | Contraseña scrypt | Evaluar TOTP para el Administrador |

## 7. Manual de usuario básico

Este manual cubre las tres operaciones que el taller hará todos los días: **entrar al sistema,
registrar un cliente con su auto y dejar constancia del avance de una orden**. Está escrito para
recepción y para los mecánicos, no para programadores.

### 7.1 Antes de empezar

| Requisito | Detalle |
|---|---|
| Navegador | Chrome, Edge, Firefox o Safari en versión reciente. No se usa Internet Explorer. |
| Dirección | En desarrollo, `http://localhost:5173`. En el taller, la dirección que indique el administrador. |
| Dispositivo | Computadora para recepción; tableta para el mecánico; celular solo para consulta del administrador. |
| Credenciales | Correo y contraseña entregados por el administrador. En el ambiente de pruebas, la contraseña semilla es `AutoPulse2026!`. |
| Conexión | La tableta debe estar en la misma red que el servidor del taller. |

### 7.2 Iniciar sesión

1. Abra el navegador y entre a la dirección del sistema. Verá la pantalla de acceso con el
   logotipo de Pizarro Performance Garage.
2. Escriba su **correo electrónico** en el primer campo (ejemplo:
   `nombre@pizarroperformance.mx`).
3. Escriba su **contraseña**. El botón con forma de ojo permite mostrarla para verificar que no
   haya errores de captura.
4. Marque **"Mantener sesión iniciada en este equipo"** solo si el equipo es de uso personal y
   no es compartido. En la tableta del taller, déjelo desmarcado.
5. Pulse **Entrar**. Mientras el sistema valida, el botón muestra "Validando acceso…".
6. El sistema lo llevará al tablero correspondiente a su rol.

**Si algo falla:**

| Mensaje o situación | Causa probable | Qué hacer |
|---|---|---|
| "Credenciales incorrectas" | Correo mal escrito o contraseña equivocada | Verifique mayúsculas y el dominio del correo. |
| El formulario se bloquea y muestra un conteo regresivo | Varios intentos fallidos seguidos | Espere a que termine el conteo (15 minutos) o pida al administrador que restablezca la contraseña. |
| "¿Olvidaste tu contraseña?" | No hay recuperación automática | El sistema le indicará que pida al administrador el restablecimiento. |
| La sesión se cierra sola | El token expiró (8 horas) | Vuelva a entrar. |

> **Nota de seguridad:** el sistema no dice si un correo existe o no; siempre responde lo mismo.
> Eso es intencional y protege las cuentas del taller.

### 7.3 Conocer la pantalla principal

El menú lateral cambia según el rol. No es una limitación de la interfaz: los módulos que no
aparecen tampoco están permitidos en el servidor.

| Opción del menú | Administrador | Recepción | Mecánico |
|---|:--:|:--:|:--:|
| Principal | ✔ | ✔ | ✔ |
| Órdenes de servicio | ✔ | ✔ | ✔ (solo las suyas) |
| Clientes | ✔ | ✔ | ✔ (enmascarado) |
| Vehículos | ✔ | ✔ | ✔ (sin valor) |
| Inventario | ✔ | ✔ | ✔ (sin precios) |
| Proveedores | ✔ | ✘ | ✘ |
| Pagos | ✔ | ✘ | ✘ |
| Facturación | ✔ | ✘ | ✘ |
| Reportes | ✔ | ✘ | ✘ |
| Configuración | ✔ | ✘ | ✘ |

En la esquina superior derecha se muestra el nombre del usuario y su rol. El ícono de salida
cierra la sesión de inmediato y borra el token del equipo.

### 7.4 Registrar un cliente

**Quién puede hacerlo:** Administrador y Recepción. Si un mecánico intenta entrar a la ruta
`/clientes/nuevo`, el sistema lo regresa al listado y el servidor respondería `403`.

1. En el menú lateral, elija **Clientes**.
2. Pulse el botón **Nuevo cliente** (arriba a la derecha).
3. Llene el formulario. Los campos con asterisco son obligatorios.

| Sección | Campo | Obligatorio | Observaciones |
|---|---|:--:|---|
| Contacto | Nombre completo | Sí | Es el nombre del dueño; se usa en la búsqueda. |
| Contacto | Teléfono principal | No | Se recomienda capturarlo; es el medio de contacto habitual. |
| Contacto | Teléfono alterno | No | El requisito CLI-01 pide dos teléfonos. |
| Contacto | Correo | No | Se valida el formato si se escribe. |
| Contacto | Asistente o chofer | No | Persona que recoge o entrega el auto. |
| Contacto | Dirección | No | Se usa para la recogida a domicilio. |
| Clasificación | Categoría | Sí | `Regular` o `VIP`. VIP aplica 10 % de descuento en mano de obra. |
| Clasificación | Descuento mano de obra (%) | No | Se sugiere 10 al marcar VIP; no afecta refacciones. |
| Clasificación | Permite pagos parciales | No | Solo para clientes de confianza (PAG-04). |
| Clasificación | Cliente confidencial | No | Actívelo para figuras públicas: el mecánico solo verá placas. |
| Clasificación | Cliente activo | Sí | Se desmarca para dar de baja sin borrar el historial. |
| Datos fiscales | RFC | No | Necesario para facturar (FAC-03). |
| Datos fiscales | Razón social | No | Debe coincidir con la constancia fiscal. |
| Datos fiscales | Régimen fiscal | No | Clave del catálogo del SAT. |
| Datos fiscales | Código postal | No | Domicilio fiscal. |
| Notas | Notas de atención | No | Preferencias, horarios, indicaciones especiales. |

4. Revise los datos y pulse **Guardar**. Si todo es correcto, el sistema abre la ficha del
   cliente con su lista de vehículos (vacía al principio).
5. Si falta un dato obligatorio, el formulario lo marca en rojo y no envía nada. El servidor
   valida de nuevo: la interfaz no es la única defensa.

**Ejemplo de datos de prueba:**

```json
{
  "nombre": "Alejandro Pizarro",
  "telefono1": "55 1234 5678",
  "telefono2": "55 8765 4321",
  "correo": "alejandro@ejemplo.mx",
  "direccion": "Bosques de las Lomas, CDMX",
  "nombre_asistente": "Marta Ruiz",
  "categoria": "VIP",
  "descuento_mano_obra": 10,
  "permite_pagos_parciales": true,
  "confidencial": false
}
```

> **Si el cliente es confidencial,** avise al administrador antes de capturar notas sensibles: el
> mecánico no verá el nombre ni los datos de contacto, pero el administrador y recepción sí.

### 7.5 Registrar el vehículo del cliente

1. Abra la ficha del cliente (búsqueda por nombre en **Clientes**).
2. Pulse **Agregar vehículo**.
3. Capture placas, VIN (número de serie), marca, modelo, año, color, kilometraje de entrada y
   valor aproximado.
4. Guarde. El vehículo queda ligado al cliente y aparecerá disponible al abrir una orden.

**Reglas que conviene conocer:**

- Las **placas** y el **VIN** se pueden buscar desde la barra superior; son la vía rápida para
  localizar un auto.
- El **valor aproximado** solo lo ven administrador y recepción. El mecánico nunca lo ve.
- Un vehículo no se puede eliminar: se desactiva. Las órdenes históricas lo siguen mostrando.

### 7.6 Consultar las órdenes de servicio

1. En el menú, elija **Órdenes de servicio**.
2. Use la barra de búsqueda para filtrar por **ID, cliente, placas o responsable**.
3. Use el filtro de estado para ver solo `Recibido`, `Diagnostico`, `Reparacion` o `Listo`.
4. Cada fila muestra el vehículo, la etapa actual, el responsable y el total. El mecánico ve
   únicamente sus órdenes y el total aparece vacío.
5. Pulse **Ver detalle** para abrir la orden completa: cliente, vehículo, conceptos, totales e
   historial de etapas.

**El mecánico** no usa esta pantalla: al entrar a Órdenes ve el **Tablero de bahías**, con las
unidades que tiene asignadas y un botón grande **Registrar Avance** por cada una.

### 7.7 Registrar el avance del trabajo (mecánico)

Este es el flujo más importante del día. Todo lo que se capture aquí queda en el historial y
descuenta inventario en la misma operación.

1. Entre a **Órdenes de servicio**. Verá el tablero "Mis órdenes asignadas".
2. Localice la unidad por sus placas y pulse **Registrar Avance**.
3. En el cuadro **Diagnóstico y notas del trabajo**, describa el hallazgo, lo que se hizo y lo
   que queda pendiente. Este texto es distinto de la falla que reportó el cliente: no la
   sobrescribe.
4. En **Cambiar etapa**, elija la siguiente etapa del flujo. Las opciones disponibles se
   calculan automáticamente; si la orden ya está en la última etapa, el selector se deshabilita y
   muestra "La orden ya está en la última etapa del flujo de taller".
5. En **Refacciones usadas**:
   - Elija la pieza en el desplegable. Solo aparecen piezas con existencia y **sin precios**.
   - Escriba la **cantidad**. El máximo permitido es el stock disponible.
   - Pulse **Agregar**. La pieza se suma a una lista temporal.
   - Para quitar una pieza de la lista, use el ícono de basura.
6. Pulse **Guardar avance**. El sistema:
   - guarda el diagnóstico;
   - cambia la etapa si se indicó;
   - inserta las piezas en el detalle de la orden con el precio vigente;
   - descuenta el inventario y registra un movimiento de salida por cada pieza;
   - recalcula subtotal, IVA y total;
   - escribe el asiento en el historial de etapas y en la bitácora.
7. Si algo falla, **no se guarda nada**: la operación es una sola transacción. Verá un mensaje
   con la causa y podrá corregir.

**Errores frecuentes al registrar avance:**

| Mensaje | Significado | Solución |
|---|---|---|
| "El avance no tiene cambios que registrar" | No se escribió diagnóstico, no se cambió etapa y no se agregaron piezas | Capture al menos uno de los tres. |
| "Stock insuficiente de 'X': disponible N, solicitado M" | Otro mecánico usó la pieza o el stock cambió | Ajuste la cantidad o pida a recepción que surta inventario. |
| "La refacción X no existe o está dada de baja" | La pieza se desactivó del catálogo | Elija otra o consulte con recepción. |
| "El Mecánico solo puede avanzar la orden a una etapa posterior" | Se intentó retroceder | Solo el administrador puede regresar una orden. |
| "La etapa Listo se registra desde su propio flujo" | Se intentó cerrar la orden desde el avance | El cierre lo hace administrador o recepción. |
| "No tienes permiso para esta operación" | La orden no está asignada al usuario | Pida al administrador que lo asigne. |

> **Importante:** el mecánico no ve importes. Si al guardar aparece un total, algo está mal y
> debe reportarse; el sistema está diseñado para devolver `null` en ese campo.

### 7.8 Surtir inventario (recepción y administrador)

1. Entre a **Inventario**.
2. Localice la pieza por nombre o marca. Las que están en o bajo el mínimo aparecen marcadas.
3. Pulse **Surtir** y capture la cantidad que llegó.
4. Confirme. El sistema suma existencias, registra un movimiento de tipo `Entrada` con el motivo
   y deja el asiento en la bitácora.

El mecánico puede consultar el catálogo, pero el botón de surtir le responde `403` si intenta
usarlo por fuera de la interfaz.

### 7.9 Cerrar sesión

Pulse el ícono de salida en la esquina superior derecha. El sistema borra el token del navegador
y regresa al login. **En equipos compartidos, cierre siempre la sesión**, incluso si marcó
"mantener sesión": de lo contrario, la siguiente persona entra con sus permisos.

### 7.10 Preguntas frecuentes

| Pregunta | Respuesta |
|---|---|
| ¿Puedo borrar un cliente que se capturó por error? | No. Se desactiva con el interruptor **Cliente activo**. El historial se conserva. |
| ¿Por qué no veo el precio de las refacciones? | Su rol no lo permite (SEG-02). Es una regla del sistema, no una falla. |
| ¿Por qué un cliente aparece como "Cliente confidencial"? | El administrador lo marcó así. Sus datos personales solo los ven administrador y recepción. |
| ¿Puedo regresar una orden a una etapa anterior? | Solo el administrador. Un mecánico únicamente avanza. |
| ¿Qué pasa si se cae la conexión a mitad del avance? | La transacción no se confirma: la orden queda como estaba. Vuelva a capturar. |
| ¿Cuánto dura la sesión? | 8 horas desde el inicio de sesión. |
| ¿Puedo usar el celular? | Sí, para consulta. La captura está pensada para computadora y tableta. |
| ¿Dónde veo cuánto debe un cliente? | En la ficha del cliente y en el detalle de la orden, solo con rol Administrador. |

## 8. Conclusiones y trabajo futuro

### 8.1 Contraste entre objetivos y resultados

| Objetivo | Resultado | Evidencia |
|---|---|---|
| Modelar el dominio en 21 tablas | Cumplido | `sql/01`–`sql/06`, 21 tablas, 218 columnas, 24 relaciones |
| Trazabilidad total | Cumplido | `bitacora` e `historial_etapas` inmutables por trigger; `activo` en todas las tablas de negocio |
| Reglas que el modelo no expresa | Cumplido | 6 triggers, uno de ellos con traducción a `422` |
| Autenticación y autorización | Cumplido | JWT HS256, `requiere_roles`, recarga del usuario en cada petición |
| Discreción del cliente | Parcial | Enmascaramiento completo en la aplicación; SEG-19 (nivel BD) y SEG-20 (auditoría de lecturas) pendientes |
| API documentada | Cumplido | 18 operaciones bajo `/api/v1`, Swagger en `/docs` |
| Interfaz usable por rol | Cumplido | React 19 + TS, menú por rol, tablero de bahías, modal de avance |
| Documentación mantenible | Cumplido | `docs/requisitos.md`, `erd.md`, `decisiones-tecnicas.md`, este reporte |

### 8.2 Lo que la práctica enseñó

**1. El requisito que más cambió el diseño fue el de las fotos.** "Guardar fotos del estado del
auto" parecía un campo más. Al calcular el volumen (hasta 2.4 GB por semana), quedó claro que la
decisión correcta era guardar solo la ruta en la base y delegar el archivo a un servidor aparte.
Ese cálculo evitó un esquema que habría hecho inviable el respaldo diario.

**2. Un `CHECK` no siempre es la respuesta.** La regla "una línea es pieza o mano de obra, no
ambas" parece texto de manual para un `CHECK`. En MySQL, combinada con `ON UPDATE CASCADE` en
las llaves foráneas, la restricción falla. El trigger no fue un atajo: fue la única opción viable
sin romper la integridad referencial.

**3. La seguridad por rol no basta cuando el dato es sensible.** SEG-05 obligó a pasar de "el
mecánico no ve precios" a "el mecánico no ve el nombre del dueño si el cliente es confidencial".
Eso no se resuelve con un `if` en el frontend: exige enmascarar en el servidor y filtrar filas en
SQL. La brecha que queda (SEG-19) es justamente la que separa una protección de aplicación de
una protección de motor.

**4. La auditoría se diseña, no se agrega después.** Las tablas de log sin `updated_at` ni
`activo`, protegidas por triggers, obligaron a pensar cada operación como un hecho que se
registra y no se corrige. Es más trabajo al principio y mucho menos trabajo cuando alguien
pregunta quién autorizó una pieza de $90,000.

**5. Documentar el delta de requisitos evita discusiones.** Tener `requisitos.md` y
`requisitos-actualizados.md` por separado permitió ver que 7 requisitos cambiaron y 16 se
agregaron, en lugar de reescribir la historia y fingir que el alcance siempre fue el final.

### 8.3 Limitaciones

| Limitación | Alcance | Impacto |
|---|---|---|
| La base no estaba en ejecución durante este reporte | El servicio `MySQL267` apunta a un `my.ini` en una unidad externa desconectada | Las validaciones se hicieron contra el DDL y el diccionario de datos, no contra una instancia viva. Es la limitación más importante de este documento. |
| Scripts SQL en cp1252 | `sql/*.sql` están guardados en codificación ANSI | Al importarlos como UTF-8, los acentos se ven como caracteres extraños. La estructura y los datos se cargan bien; solo se afecta la legibilidad de los comentarios y de algunos textos. |
| SEG-19 incompleto | MySQL no tiene RLS nativa | Un acceso directo al motor podría leer expedientes confidenciales. |
| SEG-20 incompleto | El `ENUM` existe, pero ningún endpoint escribe `Consulta_Confidencial` | No hay evidencia de quién consultó un expediente confidencial. |
| Facturación parcial | Tablas y datos fiscales listos; sin generación de PDF ni timbrado | FAC-01 a FAC-03 no se pueden demostrar de punta a punta todavía. |
| Módulos sin interfaz | Pagos, autorizaciones, reportes, proveedores y configuración | Existen en la base y en el menú como "próximamente". |
| Sin rate limiting ni 2FA | Login | Un atacante con acceso a la red podría intentar fuerza bruta sin límite del servidor. |
| Sin respaldo automatizado | SEG-08, SEG-09 | Depende de la configuración del servidor, fuera del repositorio. |

### 8.4 Trabajo futuro priorizado

| Prioridad | Tarea | Requisito | Esfuerzo estimado |
|:--:|---|---|---|
| 1 | Levantar MySQL en una ruta estable y ejecutar los 9 scripts desde cero como prueba de reproducibilidad | SEG-08 | 1 día |
| 2 | Implementar la auditoría de consultas a expedientes confidenciales | SEG-20 | 2 días |
| 3 | Cerrar la brecha de seguridad por fila con vistas `DEFINER` por rol o un proxy de consultas | SEG-19 | 1 semana |
| 4 | Generar el documento de factura (PDF) con los datos CFDI ya modelados | FAC-01 a FAC-05 | 1 semana |
| 5 | Módulo de pagos y autorizaciones en la interfaz | PAG-01 a PAG-07, AUT-01 a AUT-08 | 2 semanas |
| 6 | Reportes con exportación a Excel y PDF | REP-01 a REP-07 | 2 semanas |
| 7 | Carga de fotos al servidor de archivos con firma de entrega | VEH-03, VEH-08 | 1 semana |
| 8 | Tabla de autos de cortesía y préstamos | CLI-07 | 1 semana |
| 9 | Rate limiting, cookie `HttpOnly` y 2FA para el administrador | SEG-15 | 1 semana |
| 10 | Respaldo diario automatizado con copia fuera del taller | SEG-08, SEG-09 | 2 días |

### 8.5 Reflexión final

El valor de esta práctica no está en la cantidad de tablas, sino en que cada tabla tiene una
razón que se puede explicar. Un esquema de 21 tablas es fácil de dibujar y difícil de sostener:
lo que lo sostiene son las decisiones pequeñas —`ON DELETE RESTRICT` en todo, precios congelados
en el detalle, logs que no se editan, un trigger para una regla que el motor no puede
expresar— y la disciplina de escribirlas antes de necesitarlas.

Queda trabajo pendiente, y está identificado con nombre y apellido en la sección 8.3. Eso también
es parte del resultado: un sistema que declara sus brechas es más confiable que uno que afirma
estar completo.

---

## 9. Anexos

### Anexo A. Catálogo de endpoints

Prefijo común: `/api/v1`. Todas las rutas, salvo el login, exigen
`Authorization: Bearer <token>`.

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `POST` | `/login` | Público | Login JSON con `correo` y `password`. |
| `POST` | `/login/token` | Público | Login por formulario OAuth2 (`username` = correo); lo usa Swagger. |
| `GET` | `/login/me` | Autenticado | Devuelve el usuario del token. |
| `GET` | `/clientes` | Todos | Lista clientes; enmascara según rol. |
| `GET` | `/clientes/{id}` | Todos | Ficha con vehículos; enmascara según rol. |
| `POST` | `/clientes` | Admin, Recepción | Alta de cliente. |
| `PUT` | `/clientes/{id}` | Admin, Recepción | Actualización; también se usa para el borrado lógico con `activo: false`. |
| `GET` | `/vehiculos` | Todos | Lista vehículos; oculta el valor al mecánico. |
| `GET` | `/vehiculos/{id}` | Todos | Detalle del vehículo. |
| `POST` | `/vehiculos` | Admin, Recepción | Alta de vehículo ligado a un cliente vigente. |
| `PUT` | `/vehiculos/{id}` | Admin, Recepción | Actualización y baja lógica. |
| `GET` | `/ordenes` | Todos | Lista órdenes; el mecánico solo ve las suyas. |
| `GET` | `/ordenes/{id}` | Todos | Detalle con cliente, vehículo, conceptos y totales. |
| `POST` | `/ordenes` | Admin, Recepción | Abre una orden en estado `Recibido`. |
| `POST` | `/ordenes/{id}/avanzar-etapa` | Admin, Mecánico | Avanza a la siguiente etapa del flujo. |
| `POST` | `/ordenes/{id}/registrar-avance` | Admin, Mecánico | Diagnóstico, refacciones y cambio de etapa en una transacción. |
| `GET` | `/refacciones` | Todos | Catálogo con existencias; sin precios para el mecánico. |
| `POST` | `/refacciones/{id}/entrada` | Admin, Recepción | Surtir inventario: suma stock, movimiento y bitácora. |
| `GET` | `/usuarios` | Admin | Lista cuentas. |
| `POST` | `/usuarios/{id}/restablecer-password` | Admin | Define contraseña nueva y registra el evento. |
| `GET` | `/salud` | Público | Verificación de vida de la API (fuera de `/api/v1`). |

### Anexo B. Glosario

| Término | Definición |
|---|---|
| **ADR** | *Architecture Decision Record*: documento breve que registra una decisión de diseño, su contexto y sus consecuencias. |
| **CFDI 4.0** | Comprobante Fiscal Digital por Internet, versión 4.0, obligatorio para facturar en México. |
| **DDL** | *Data Definition Language*: las sentencias que crean y modifican la estructura (`CREATE TABLE`, `ALTER TABLE`). |
| **Deadlock** | Interbloqueo: dos transacciones se esperan mutuamente y el motor debe cancelar una. |
| **FK / PK** | Llave foránea / llave primaria. |
| **Flush** | Enviar los cambios pendientes de SQLAlchemy a la transacción sin confirmarla. |
| **IVA** | Impuesto al Valor Agregado; 16 % en México. |
| **JWT** | *JSON Web Token*: credencial firmada que el cliente envía en cada petición. |
| **N:M** | Relación de muchos a muchos, resuelta con una tabla puente (`orden_mecanicos`). |
| **ORM** | *Object-Relational Mapping*: traduce objetos de Python a filas de la base. |
| **PAC** | Proveedor Autorizado de Certificación: quien timbra los CFDI ante el SAT. |
| **RLS** | *Row-Level Security*: seguridad por fila a nivel de motor. MySQL no la incluye de forma nativa. |
| **scrypt** | Función de derivación de claves resistente a hardware especializado; se usa para las contraseñas. |
| **Trigger** | Programa que el motor ejecuta automáticamente ante `INSERT`, `UPDATE` o `DELETE`. |
| **VIP** | Cliente distinguido: 10 % de descuento en mano de obra y prioridad en la fila (CLI-02, CLI-03). |
| **XOR lógico** | "Uno u otro, pero no ambos"; es la regla que impone el trigger de `detalle_orden`. |

### Anexo C. Mapa del repositorio

```text
E:\Tallermecanico\
├── AGENTS.md                      Reglas del proyecto
├── README.md                      Descripción, instalación y estado
├── docs\
│   ├── requisitos.md              76 requisitos originales
│   ├── requisitos-actualizados.md 7 modificados + 16 nuevos
│   ├── contexto-tecnico.md        Stack y convenciones
│   ├── decisiones-tecnicas.md     ADR-001 a ADR-010
│   ├── erd.md                     Diagrama E-R completo en Mermaid
│   └── indice.md                  Índice de la documentación
├── sql\
│   ├── 01_catalogos.sql           clientes, proveedores, mecanicos, servicios
│   ├── 02_vehiculos.sql           vehiculos, polizas_seguro
│   ├── 03_inventario.sql          refacciones, compras, detalle_compra, movimientos
│   ├── 04_ordenes.sql             ordenes_servicio, detalle_orden, fotos_vehiculo + triggers
│   ├── 05_finanzas.sql            pagos, facturas, autorizaciones
│   ├── 06_seguridad.sql           usuarios, bitacora, orden_mecanicos, historial, parametros
│   ├── 07_datos_prueba.sql        semillas y usuarios de prueba
│   ├── 08_datos_prueba_extra.sql  datos adicionales idempotentes
│   └── 09_avance_mecanico.sql     columna diagnostico (idempotente)
├── backend\
│   ├── app\
│   │   ├── main.py                FastAPI, routers y /salud
│   │   ├── core\                  config, database, security, deps, privacidad
│   │   ├── models\                21 modelos SQLAlchemy
│   │   ├── schemas\               contratos de entrada y salida
│   │   └── routers\               auth, clientes, vehiculos, ordenes, refacciones, usuarios
│   ├── scripts\                   demos transaccionales
│   ├── tests\                     pruebas
│   └── requirements.txt           dependencias con versión fija
├── frontend\
│   └── src\
│       ├── pages\                 Dashboard, Login, clientes, vehiculos, ordenes, inventario
│       ├── components\            formularios, tablas, modales, layout
│       ├── services\              api (axios), sesion, ordenes, clientes
│       ├── types\                 tipos del dominio
│       └── lib\                   navegación por rol, etapas, intentos de login
└── documentacion-tecnica\
    ├── index.html                 Documento interactivo del E-R
    └── reporte-practica.md        Este reporte
```

### Anexo D. Verificación reproducible

```powershell
# 1. Crear la base (MySQL 8 en ejecución)
mysql -u root -p -e "CREATE DATABASE autopulse_elite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Ejecutar los bloques en orden
Get-ChildItem sql\*.sql | Sort-Object Name | ForEach-Object {
    mysql -u root -p --default-character-set=cp1252 autopulse_elite < $_.FullName
}

# 3. Comprobar el esquema
mysql -u root -p autopulse_elite -e "SHOW TABLES; SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='autopulse_elite';"

# 4. Backend
cd backend
python -m venv .venv
.\.venv\Scripts\pip.exe install -r requirements.txt
Copy-Item .env.example .env    # ajustar credenciales
.\.venv\Scripts\uvicorn.exe app.main:app --reload

# 5. Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

**Comprobaciones esperadas:** 21 tablas, 218 columnas, 6 triggers
(`SHOW TRIGGERS;`), y la documentación interactiva de la API en `http://127.0.0.1:8000/docs`.

### Anexo E. Referencias

| Fuente | Uso en el proyecto |
|---|---|
| MySQL 8.0 Reference Manual — InnoDB, triggers, `SIGNAL`, `ENUM` | Diseño del esquema y de los triggers |
| FastAPI Documentation | Routers, dependencias y seguridad OAuth2 |
| SQLAlchemy 2.0 Documentation — ORM, `with_for_update`, Inspector | Modelos, bloqueos y verificación del esquema |
| RFC 7519 (JWT) y RFC 7914 (scrypt) | Autenticación y almacenamiento de contraseñas |
| OWASP Top 10 (2021) | Revisión de XSS, control de acceso y autenticación |
| SAT — Especificación CFDI 4.0 | Campos fiscales de `clientes` y `facturas` |
| `docs/decisiones-tecnicas.md` (ADR-001 a ADR-010) | Justificación de las decisiones de diseño |

---

*Fin del documento.*

