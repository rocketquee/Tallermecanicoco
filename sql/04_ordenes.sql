-- =====================================================================
-- Apex Elite Motorsport - Bloque 4a: Órdenes de servicio
-- Requisitos: ORD-01 a ORD-13, VEH-03, VEH-08, PRV-05
-- =====================================================================

CREATE TABLE IF NOT EXISTS ordenes_servicio (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la orden de servicio (ORD-01)',
  cliente_id INT UNSIGNED NOT NULL COMMENT 'Dueño del vehículo; FK a clientes.id (ORD-01, CLI-06)',
  vehiculo_id INT UNSIGNED NOT NULL COMMENT 'Vehículo que ingresa al taller; FK a vehiculos.id (ORD-01, VEH-02)',
  mecanico_id INT UNSIGNED NULL COMMENT 'Mecánico principal o responsable de la orden; FK a mecanicos.id. Los demás participantes viven en orden_mecanicos (ORD-09)',
  estado ENUM('Recibido','Diagnostico','Reparacion','Listo','Entregado','Cancelado') NOT NULL DEFAULT 'Recibido' COMMENT 'Etapa de la orden: recibido, diagnóstico, reparación, listo, entregado o cancelado (ORD-02, ORD-04, ORD-05, ORD-11)',
  falla_reportada TEXT NULL COMMENT 'Falla o motivo de ingreso reportado por el cliente (ORD-01)',
  total_piezas DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Suma de refacciones usadas en la orden (PAG-01)',
  total_mano_obra DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Suma de mano de obra ya con descuento VIP aplicado (PAG-01, PAG-02)',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Piezas más mano de obra, antes de IVA (PAG-01)',
  iva DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'IVA del 16% sobre el subtotal (PAG-01)',
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Total a cobrar; base para el umbral de autorización de $250,000 MXN (PAG-01, AUT-01)',
  requiere_autorizacion TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica que la orden supera el umbral y requiere autorización vigente del admin (AUT-01, AUT-02, AUT-07)',
  motivo_cancelacion TEXT NULL COMMENT 'Motivo obligatorio al cancelar la orden, con registro del usuario (ORD-11)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de apertura de la orden (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora del último cambio; las etapas no cambian solas (ORD-06, SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado; nada se borra físicamente (ORD-11, SEG-07)',
  PRIMARY KEY (id),
  KEY idx_ordenes_cliente (cliente_id),
  KEY idx_ordenes_vehiculo (vehiculo_id),
  KEY idx_ordenes_mecanico (mecanico_id),
  KEY idx_ordenes_estado (estado),
  KEY idx_ordenes_fecha (created_at),
  KEY idx_ordenes_requiere_autorizacion (requiere_autorizacion),
  CONSTRAINT fk_ordenes_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ordenes_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ordenes_mecanico FOREIGN KEY (mecanico_id) REFERENCES mecanicos (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Órdenes de servicio con sus cuatro etapas y totales (ORD-01 a ORD-13)';

-- Nota: no se puede usar CHECK (servicio_id XOR refaccion_id) porque MySQL
-- prohíbe CHECK sobre columnas con FK que tienen ON UPDATE CASCADE.
-- La regla se aplica con los triggers trg_detalle_orden_bi / trg_detalle_orden_bu.
CREATE TABLE IF NOT EXISTS detalle_orden (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la línea de la orden (ORD-10)',
  orden_id INT UNSIGNED NOT NULL COMMENT 'Orden de servicio a la que pertenece la línea; FK a ordenes_servicio.id (ORD-10)',
  servicio_id INT UNSIGNED NULL COMMENT 'Servicio o mano de obra aplicada; FK a servicios.id; excluyente con refaccion_id (ORD-10)',
  refaccion_id INT UNSIGNED NULL COMMENT 'Refacción o consumible usado; FK a refacciones.id; excluyente con servicio_id (ORD-10, INV-02)',
  cantidad INT NOT NULL COMMENT 'Cantidad de servicios o piezas de la línea (ORD-10)',
  precio_unitario DECIMAL(12,2) NOT NULL COMMENT 'Precio unitario al momento de la venta, para conservar historial (ORD-10, PAG-01)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_detalle_orden_orden (orden_id),
  KEY idx_detalle_orden_servicio (servicio_id),
  KEY idx_detalle_orden_refaccion (refaccion_id),
  CONSTRAINT fk_detalle_orden_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_detalle_orden_servicio FOREIGN KEY (servicio_id) REFERENCES servicios (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_detalle_orden_refaccion FOREIGN KEY (refaccion_id) REFERENCES refacciones (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalle de piezas y mano de obra por orden (ORD-10, INV-02)';

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

CREATE TABLE IF NOT EXISTS fotos_vehiculo (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la foto (VEH-03)',
  orden_id INT UNSIGNED NOT NULL COMMENT 'Orden a la que pertenece la foto; FK a ordenes_servicio.id (VEH-03)',
  url_foto VARCHAR(500) NOT NULL COMMENT 'Ruta o URL del archivo; la imagen no se guarda en la BD (VEH-03, VEH-08)',
  etapa ENUM('Ingreso','Proceso','Entrega') NOT NULL COMMENT 'Clasificación de la foto: ingreso, proceso o entrega (VEH-03)',
  firma_conformidad TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si la foto de entrega quedó firmada por el cliente (VEH-03)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora automáticas de la toma o carga de la foto (VEH-03, SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_fotos_orden (orden_id),
  KEY idx_fotos_etapa (etapa),
  CONSTRAINT fk_fotos_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Fotos del estado del vehículo por orden, almacenadas fuera de la BD (VEH-03, VEH-08)';

-- Cierra el hueco PRV-05: la compra queda ligada a la orden que la originó.
ALTER TABLE compras
  ADD CONSTRAINT fk_compras_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT ON UPDATE CASCADE;
