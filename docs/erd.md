# Diagrama Entidad-Relación — AutoPulse Elite

Base de datos: `autopulse_elite` · MySQL 8.x · InnoDB · `utf8mb4_unicode_ci`

21 tablas. Cada tabla incluye `created_at`, `updated_at` y `activo` (borrado lógico), salvo los
logs inmutables `bitacora` e `historial_etapas`, que solo llevan `created_at` por diseño.

```mermaid
erDiagram
    clientes ||--o{ vehiculos : "posee"
    clientes ||--o{ ordenes_servicio : "solicita"
    vehiculos ||--o{ polizas_seguro : "tiene"
    vehiculos ||--o{ ordenes_servicio : "ingresa_en"
    mecanicos |o--o{ ordenes_servicio : "responsable_principal"
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
        varchar telefono1
        varchar telefono2
        varchar correo
        varchar direccion
        varchar nombre_asistente
        enum categoria
        decimal descuento_mano_obra
        tinyint permite_pagos_parciales
        tinyint confidencial
        text notas
        varchar rfc
        varchar razon_social
        varchar regimen_fiscal
        varchar codigo_postal
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    proveedores {
        int id PK
        varchar nombre
        varchar pais
        varchar contacto
        varchar telefono
        varchar correo
        int tiempo_entrega_dias
        enum moneda
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    mecanicos {
        int id PK
        varchar nombre
        varchar telefono
        varchar correo
        varchar especialidad
        text notas
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    servicios {
        int id PK
        varchar nombre
        text descripcion
        decimal precio_mano_obra
        decimal duracion_estimada_horas
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    vehiculos {
        int id PK
        int cliente_id FK
        varchar placas
        varchar vin
        varchar marca
        varchar modelo
        int anio
        varchar color
        int kilometraje_entrada
        decimal valor_aproximado
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    polizas_seguro {
        int id PK
        int vehiculo_id FK
        varchar aseguradora
        varchar numero_poliza
        date vigencia_inicio
        date vigencia_fin
        text cobertura
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    refacciones {
        int id PK
        varchar nombre
        varchar marca
        tinyint es_especial
        int stock_actual
        int stock_minimo
        decimal precio_costo
        decimal precio_venta
        int proveedor_id FK
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    compras {
        int id PK
        int proveedor_id FK
        int orden_id FK
        datetime fecha_pedido
        date fecha_estimada_llegada
        enum estado
        enum moneda_original
        decimal tipo_cambio
        decimal total_moneda_original
        decimal total_mxn
        varchar solicitado_por
        varchar aprobado_por
        datetime fecha_aprobacion
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    detalle_compra {
        int id PK
        int compra_id FK
        int refaccion_id FK
        int cantidad
        decimal precio_unitario_moneda
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    movimientos_inventario {
        int id PK
        int refaccion_id FK
        enum tipo
        int cantidad
        varchar motivo
        varchar usuario
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    ordenes_servicio {
        int id PK
        int cliente_id FK
        int vehiculo_id FK
        int mecanico_id FK
        enum estado
        text falla_reportada
        text diagnostico
        decimal total_piezas
        decimal total_mano_obra
        decimal subtotal
        decimal iva
        decimal total
        tinyint requiere_autorizacion
        text motivo_cancelacion
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    detalle_orden {
        int id PK
        int orden_id FK
        int servicio_id FK
        int refaccion_id FK
        int cantidad
        decimal precio_unitario
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    fotos_vehiculo {
        int id PK
        int orden_id FK
        varchar url_foto
        enum etapa
        tinyint firma_conformidad
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    pagos {
        int id PK
        int orden_id FK
        enum tipo
        decimal monto
        enum metodo_pago
        varchar referencia
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    facturas {
        int id PK
        int orden_id FK
        varchar numero_factura
        decimal subtotal
        decimal iva
        decimal total
        enum estado
        varchar uuid_cfdi
        varchar uso_cfdi
        varchar forma_pago
        varchar metodo_pago
        text motivo_cancelacion
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    autorizaciones {
        int id PK
        int orden_id FK
        enum tipo
        decimal monto_orden
        tinyint aprobado
        varchar aprobado_por
        datetime fecha_aprobacion
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    usuarios {
        int id PK
        varchar nombre
        varchar correo
        varchar password_hash
        enum rol
        int mecanico_id FK
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    bitacora {
        int id PK
        int usuario_id FK
        varchar tabla_afectada
        int registro_id
        enum accion
        text detalle
        datetime created_at
    }

    orden_mecanicos {
        int id PK
        int orden_id FK
        int mecanico_id FK
        datetime created_at
        datetime updated_at
        tinyint activo
    }

    historial_etapas {
        int id PK
        int orden_id FK
        enum etapa_anterior
        enum etapa_nueva
        int usuario_id FK
        datetime created_at
    }

    parametros {
        int id PK
        varchar clave
        varchar valor
        text descripcion
        datetime created_at
        datetime updated_at
        tinyint activo
    }
```

## Notas de diseño

### Cardinalidades

- `|o--o{` indica FK **opcional**: `mecanicos → ordenes_servicio.mecanico_id`,
  `mecanicos → usuarios.mecanico_id`, `proveedores → refacciones.proveedor_id`,
  `ordenes_servicio → compras.orden_id`, `servicios → detalle_orden.servicio_id` y
  `refacciones → detalle_orden.refaccion_id`.
- `||--o{` indica FK **obligatoria**.
- Todas las FK usan `ON DELETE RESTRICT` y `ON UPDATE CASCADE`. Nada se borra
  físicamente: el borrado es lógico con `activo = 0` (SEG-07).

### Reglas garantizadas en la base de datos

| Regla | Implementación |
|---|---|
| Detalle de orden: servicio **o** refacción, nunca ambos ni ninguno | Triggers `trg_detalle_orden_bi` / `trg_detalle_orden_bu` (MySQL no permite `CHECK` sobre columnas con FK y `ON UPDATE CASCADE`) |
| Bitácora inmutable (SEG-06) | Triggers `trg_bitacora_bu` / `trg_bitacora_bd` bloquean `UPDATE` y `DELETE` |
| Historial de etapas inmutable (ORD-06) | Triggers `trg_historial_etapas_bu` / `trg_historial_etapas_bd` |
| Un mecánico no se asigna dos veces a la misma orden | `UNIQUE (orden_id, mecanico_id)` en `orden_mecanicos` |
| Un usuario por correo | `UNIQUE (correo)` en `usuarios` |
| Factura sin folio duplicado ni UUID repetido | `UNIQUE (numero_factura)` y `UNIQUE (uuid_cfdi)`; ambos admiten múltiples `NULL` |

### Decisión sobre `ordenes_servicio.mecanico_id`

`ordenes_servicio.mecanico_id` identifica al **mecánico principal o responsable** de la orden.
La tabla `orden_mecanicos` guarda a **todos** los mecánicos que participan (ORD-09). El campo
es una referencia directa para consultas rápidas y para la pantalla de órdenes (ORD-03); la
tabla puente es la fuente completa de asignaciones.

### Trazabilidad

- `bitacora` registra altas, cambios, cancelaciones, autorizaciones y consultas a expedientes
  confidenciales (SEG-06, SEG-20), siempre con `usuario_id`, tabla y registro afectado.
- `movimientos_inventario` es el libro de entradas, salidas y ajustes de refacciones (INV-02, INV-05).
- `historial_etapas` permite calcular los días transcurridos en la etapa actual (ORD-06) y
  auditar retrocesos, que solo el administrador puede hacer (ORD-05).

### Parámetros configurables

`parametros` guarda valores de negocio sin recompilar:

| clave | valor | requisito |
|---|---|---|
| `tolerancia_reautorizacion` | `5` | AUT-08 (porcentaje antes de pedir reautorización) |
| `umbral_piezas_caras` | `25000` | PAG-06 (MXN para exigir 50% de anticipo) |
