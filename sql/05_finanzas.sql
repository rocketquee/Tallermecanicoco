-- =====================================================================
-- AutoPulse Elite - Bloque 4b: Finanzas
-- Requisitos: PAG-01 a PAG-07, FAC-01 a FAC-05, AUT-01 a AUT-08
-- =====================================================================

CREATE TABLE IF NOT EXISTS pagos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del pago (PAG-03)',
  orden_id INT UNSIGNED NOT NULL COMMENT 'Orden de servicio que se está pagando; FK a ordenes_servicio.id (PAG-03, PAG-05)',
  tipo ENUM('Anticipo','Parcialidad','Liquidacion') NOT NULL COMMENT 'Naturaleza del pago: anticipo del 50%, parcialidad o liquidación final (PAG-03, PAG-04)',
  monto DECIMAL(12,2) NOT NULL COMMENT 'Monto entregado en pesos mexicanos; siempre se cobra en MXN (PAG-03, PAG-07)',
  metodo_pago ENUM('Efectivo','Transferencia','Tarjeta') NOT NULL DEFAULT 'Transferencia' COMMENT 'Forma de pago utilizada por el cliente (PAG-03)',
  referencia VARCHAR(100) NULL COMMENT 'Referencia o folio de la operación, típicamente número de transferencia (PAG-03)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora en que se registró el pago; base del historial del cliente (PAG-05, CLI-06, SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_pagos_orden (orden_id),
  KEY idx_pagos_tipo (tipo),
  KEY idx_pagos_fecha (created_at),
  CONSTRAINT fk_pagos_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Anticipos, parcialidades y liquidaciones por orden (PAG-03 a PAG-05, PAG-07)';

CREATE TABLE IF NOT EXISTS facturas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la factura (FAC-01)',
  orden_id INT UNSIGNED NOT NULL COMMENT 'Orden que se factura; FK a ordenes_servicio.id (FAC-01, FAC-03)',
  numero_factura VARCHAR(50) NULL COMMENT 'Folio fiscal de la factura; se llena al timbrar con el PAC (FAC-03, FAC-05)',
  subtotal DECIMAL(12,2) NOT NULL COMMENT 'Subtotal de la factura: piezas más mano de obra (FAC-03, PAG-01)',
  iva DECIMAL(12,2) NOT NULL COMMENT 'IVA del 16% trasladado en la factura (FAC-03, PAG-01)',
  total DECIMAL(12,2) NOT NULL COMMENT 'Total facturado al cliente (FAC-03, PAG-01)',
  estado ENUM('Borrador','Timbrada','Cancelada') NOT NULL DEFAULT 'Borrador' COMMENT 'Estado de la factura; una emitida no se edita y su cancelación requiere motivo (FAC-02, FAC-04)',
  uuid_cfdi VARCHAR(100) NULL COMMENT 'UUID del CFDI 4.0 devuelto por el PAC al timbrar (FAC-05, FAC-06)',
  uso_cfdi VARCHAR(10) NULL COMMENT 'Uso del CFDI declarado por el cliente, catálogo SAT (FAC-05)',
  forma_pago VARCHAR(10) NULL COMMENT 'Forma de pago SAT, por ejemplo 01 efectivo o 03 transferencia (FAC-05)',
  metodo_pago VARCHAR(10) NULL COMMENT 'Método de pago SAT: PUE o PPD (FAC-05)',
  motivo_cancelacion TEXT NULL COMMENT 'Motivo obligatorio al cancelar una factura emitida (FAC-04)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de emisión de la factura (FAC-03, SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado; una factura no se borra (FAC-04, SEG-07)',
  PRIMARY KEY (id),
  UNIQUE KEY uq_facturas_numero (numero_factura),
  UNIQUE KEY uq_facturas_uuid (uuid_cfdi),
  KEY idx_facturas_orden (orden_id),
  KEY idx_facturas_estado (estado),
  CONSTRAINT fk_facturas_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Facturas CFDI 4.0 listas para timbrar por orden (FAC-01 a FAC-05)';

CREATE TABLE IF NOT EXISTS autorizaciones (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la autorización (AUT-05)',
  orden_id INT UNSIGNED NOT NULL COMMENT 'Orden sujeta a autorización; FK a ordenes_servicio.id (AUT-01, AUT-04)',
  tipo ENUM('Monto_Alto','Saldo_Pendiente','Reautorizacion') NOT NULL COMMENT 'Motivo de la autorización: monto mayor a $250,000, entrega con saldo o reautorización por aumento (AUT-01, AUT-04, AUT-07)',
  monto_orden DECIMAL(12,2) NOT NULL COMMENT 'Total de la orden al momento de solicitar la autorización, para dejar constancia del monto (AUT-05)',
  aprobado TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Resultado: 0 pendiente o rechazada, 1 autorizada; solo el administrador puede autorizar (AUT-03, AUT-06)',
  aprobado_por VARCHAR(150) NULL COMMENT 'Usuario administrador que resolvió la autorización (AUT-03, AUT-05)',
  fecha_aprobacion DATETIME NULL COMMENT 'Fecha y hora de la resolución, con usuario y monto (AUT-05)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la solicitud de autorización (AUT-05, SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado; las autorizaciones no se borran (SEG-06, SEG-07)',
  PRIMARY KEY (id),
  KEY idx_autorizaciones_orden (orden_id),
  KEY idx_autorizaciones_tipo (tipo),
  KEY idx_autorizaciones_estado (aprobado),
  CONSTRAINT fk_autorizaciones_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Autorizaciones del administrador por monto y por saldo pendiente (AUT-01 a AUT-08)';
