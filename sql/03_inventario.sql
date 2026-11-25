-- =====================================================================
-- Apex Elite Motorsport - Bloque 3: Inventario y compras
-- Requisitos: INV-01 a INV-05, PRV-03 a PRV-09
-- =====================================================================

CREATE TABLE IF NOT EXISTS refacciones (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la refacción o consumible (INV-01)',
  nombre VARCHAR(150) NOT NULL COMMENT 'Nombre o descripción de la pieza de tornillería o consumible (INV-01)',
  marca VARCHAR(50) NULL COMMENT 'Marca de la pieza, usada para distinguir piezas especiales (INV-04)',
  es_especial TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Pieza especial por marca: se compra ligada a una orden, sin existencias en inventario (INV-04)',
  stock_actual INT NOT NULL DEFAULT 0 COMMENT 'Existencias actuales en inventario; índice de alerta (INV-01, INV-03)',
  stock_minimo INT NOT NULL DEFAULT 2 COMMENT 'Umbral mínimo: alertar con 2 o menos unidades (INV-03)',
  precio_costo DECIMAL(12,2) NOT NULL COMMENT 'Costo de adquisición de la refacción (INV-01, SEG-02)',
  precio_venta DECIMAL(12,2) NOT NULL COMMENT 'Precio de venta al cliente (INV-01, SEG-02)',
  proveedor_id INT UNSIGNED NULL COMMENT 'Proveedor habitual de la pieza; FK a proveedores.id (PRV-01)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación; también refleja ajustes de inventario (INV-05, SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_refacciones_proveedor (proveedor_id),
  KEY idx_refacciones_nombre (nombre),
  KEY idx_refacciones_stock (stock_actual, stock_minimo),
  KEY idx_refacciones_especial (es_especial),
  CONSTRAINT fk_refacciones_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de refacciones y consumibles con existencias (INV-01 a INV-05)';

CREATE TABLE IF NOT EXISTS compras (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la orden de compra (PRV-03)',
  proveedor_id INT UNSIGNED NOT NULL COMMENT 'Proveedor al que se le compra; FK a proveedores.id (PRV-01, PRV-03)',
  orden_id INT UNSIGNED NULL COMMENT 'Orden de servicio que motivó la compra; FK pendiente a ordenes_servicio.id (PRV-05)',
  fecha_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora en que se registra el pedido (PRV-03)',
  fecha_estimada_llegada DATE NULL COMMENT 'Fecha estimada de llegada para la lista de pedidos pendientes (PRV-03, PRV-04)',
  estado ENUM('Borrador','Aprobada','Enviada','Recibida','Cancelada') NOT NULL DEFAULT 'Borrador' COMMENT 'Estado del pedido; no se envía sin aprobación del admin (PRV-03, PRV-07)',
  moneda_original ENUM('EUR','GBP','MXN','USD') NOT NULL COMMENT 'Moneda original de la compra (PRV-09)',
  tipo_cambio DECIMAL(10,4) NULL COMMENT 'Tipo de cambio del día de la compra para calcular el equivalente en MXN (PRV-09)',
  total_moneda_original DECIMAL(12,2) NULL COMMENT 'Total de la compra en su moneda original (PRV-09)',
  total_mxn DECIMAL(12,2) NULL COMMENT 'Equivalente en pesos mexicanos al tipo de cambio aplicado (PRV-09, PAG-07)',
  solicitado_por VARCHAR(150) NULL COMMENT 'Quién solicitó el pedido; evita piezas sin responsable (PRV-05)',
  aprobado_por VARCHAR(150) NULL COMMENT 'Usuario administrador que aprobó la orden de compra (PRV-07, AUT-03)',
  fecha_aprobacion DATETIME NULL COMMENT 'Fecha y hora de la aprobación del administrador (PRV-07, SEG-06)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_compras_proveedor (proveedor_id),
  KEY idx_compras_orden (orden_id),
  KEY idx_compras_estado (estado),
  KEY idx_compras_fecha_estimada (fecha_estimada_llegada),
  CONSTRAINT fk_compras_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Órdenes de compra a proveedores internacionales (PRV-03 a PRV-09)';

CREATE TABLE IF NOT EXISTS detalle_compra (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la línea de compra',
  compra_id INT UNSIGNED NOT NULL COMMENT 'Orden de compra a la que pertenece la línea; FK a compras.id (PRV-03)',
  refaccion_id INT UNSIGNED NOT NULL COMMENT 'Refacción o pieza solicitada; FK a refacciones.id (INV-01, INV-04)',
  cantidad INT NOT NULL COMMENT 'Cantidad de piezas pedidas en esta línea (PRV-03)',
  precio_unitario_moneda DECIMAL(12,2) NOT NULL COMMENT 'Precio unitario en la moneda original de la compra (PRV-09)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_detalle_compra_compra (compra_id),
  KEY idx_detalle_compra_refaccion (refaccion_id),
  CONSTRAINT fk_detalle_compra_compra FOREIGN KEY (compra_id) REFERENCES compras (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_detalle_compra_refaccion FOREIGN KEY (refaccion_id) REFERENCES refacciones (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalle de piezas por orden de compra (tabla puente compras-refacciones)';

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del movimiento de inventario (INV-02, INV-05)',
  refaccion_id INT UNSIGNED NOT NULL COMMENT 'Refacción afectada; FK a refacciones.id (INV-02)',
  tipo ENUM('Entrada','Salida','Ajuste') NOT NULL COMMENT 'Tipo de movimiento: entrada por compra, salida por uso en orden o ajuste manual (INV-02, INV-05)',
  cantidad INT NOT NULL COMMENT 'Unidades del movimiento (siempre positiva; el tipo define el sentido) (INV-02, INV-05)',
  motivo VARCHAR(255) NULL COMMENT 'Motivo obligatorio en ajustes manuales (INV-05)',
  usuario VARCHAR(150) NULL COMMENT 'Usuario que registró el movimiento, para la bitácora (INV-05, SEG-06)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del movimiento (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_movimientos_refaccion (refaccion_id),
  KEY idx_movimientos_tipo (tipo),
  KEY idx_movimientos_fecha (created_at),
  CONSTRAINT fk_movimientos_refaccion FOREIGN KEY (refaccion_id) REFERENCES refacciones (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Trazabilidad de entradas, salidas y ajustes de inventario (INV-02, INV-05)';
