-- =====================================================================
-- AutoPulse Elite - Bloque 1: Catálogos base
-- Requisitos: CLI-01 a CLI-06, PRV-01, PRV-02, PRV-09, ORD-09, ORD-10, SEG-17
-- =====================================================================

CREATE TABLE IF NOT EXISTS clientes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del cliente (CLI-01)',
  nombre VARCHAR(150) NOT NULL COMMENT 'Nombre del dueño del vehículo; búsqueda indexada <3s (CLI-01, CLI-05)',
  telefono1 VARCHAR(20) NULL COMMENT 'Teléfono principal de contacto (CLI-01)',
  telefono2 VARCHAR(20) NULL COMMENT 'Teléfono secundario de contacto (CLI-01)',
  correo VARCHAR(150) NULL COMMENT 'Correo electrónico de contacto (CLI-01)',
  direccion VARCHAR(255) NULL COMMENT 'Dirección del cliente (CLI-01)',
  nombre_asistente VARCHAR(150) NULL COMMENT 'Nombre del asistente o chofer del cliente (CLI-01)',
  categoria ENUM('Regular','VIP') NOT NULL DEFAULT 'Regular' COMMENT 'Categoría del cliente; VIP recibe prioridad en la fila de órdenes (CLI-02, CLI-03, ORD-13)',
  descuento_mano_obra DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Porcentaje de descuento aplicable solo a mano de obra; VIP = 10.00 (CLI-03, PAG-02)',
  permite_pagos_parciales TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Autoriza pagos en partes solo a clientes de confianza (PAG-04)',
  confidencial TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Cliente confidencial: el mecánico solo ve placas y trabajo asignado (SEG-17, SEG-18, SEG-19)',
  notas TEXT NULL COMMENT 'Notas internas de atención al cliente',
  rfc VARCHAR(20) NULL COMMENT 'RFC del cliente para CFDI 4.0 (FAC-05)',
  razon_social VARCHAR(200) NULL COMMENT 'Razón social o nombre fiscal para CFDI 4.0 (FAC-05)',
  regimen_fiscal VARCHAR(100) NULL COMMENT 'Régimen fiscal del cliente requerido por CFDI 4.0 (FAC-05)',
  codigo_postal VARCHAR(10) NULL COMMENT 'Código postal del domicilio fiscal requerido por CFDI 4.0 (FAC-05)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_clientes_nombre (nombre),
  KEY idx_clientes_categoria (categoria),
  KEY idx_clientes_confidencial (confidencial)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Clientes del taller, incluidos VIP y confidenciales (CLI-01 a CLI-06)';

CREATE TABLE IF NOT EXISTS proveedores (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del proveedor (PRV-01)',
  nombre VARCHAR(150) NOT NULL COMMENT 'Razón social o nombre del proveedor internacional (PRV-01)',
  pais VARCHAR(60) NOT NULL COMMENT 'País del proveedor: Italia, Alemania, Inglaterra, etc. (PRV-01)',
  contacto VARCHAR(150) NULL COMMENT 'Nombre de la persona de contacto (PRV-01)',
  telefono VARCHAR(30) NULL COMMENT 'Teléfono de contacto del proveedor (PRV-01)',
  correo VARCHAR(150) NULL COMMENT 'Correo electrónico de contacto del proveedor (PRV-01)',
  tiempo_entrega_dias INT UNSIGNED NULL COMMENT 'Tiempo de entrega típico en días (de 14 a 56, equivalente a 2-8 semanas) (PRV-02)',
  moneda ENUM('EUR','GBP','MXN','USD') NOT NULL DEFAULT 'MXN' COMMENT 'Moneda en la que cotiza el proveedor (PRV-09)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_proveedores_nombre (nombre),
  KEY idx_proveedores_pais (pais)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Proveedores internacionales de refacciones (PRV-01, PRV-02, PRV-09)';

CREATE TABLE IF NOT EXISTS mecanicos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del mecánico (ORD-09)',
  nombre VARCHAR(150) NOT NULL COMMENT 'Nombre del mecánico; se usa para asignarlo a órdenes y calcular bonos (ORD-09, REP-03)',
  telefono VARCHAR(20) NULL COMMENT 'Teléfono de contacto del mecánico (SEG-01)',
  correo VARCHAR(150) NULL COMMENT 'Correo electrónico del mecánico (SEG-01)',
  especialidad VARCHAR(100) NULL COMMENT 'Especialidad o área técnica del mecánico (REP-03)',
  notas TEXT NULL COMMENT 'Notas internas sobre el mecánico',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_mecanicos_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de mecánicos del taller (ORD-09, REP-03, SEG-01)';

CREATE TABLE IF NOT EXISTS servicios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del servicio de mano de obra (ORD-10)',
  nombre VARCHAR(150) NOT NULL COMMENT 'Nombre del servicio de mano de obra (ORD-10)',
  descripcion TEXT NULL COMMENT 'Descripción del servicio realizado (ORD-10)',
  precio_mano_obra DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Precio base de mano de obra antes de descuento VIP e IVA (ORD-10, PAG-01, PAG-02)',
  duracion_estimada_horas DECIMAL(4,1) NULL COMMENT 'Duración estimada del servicio en horas, para planear la carga de trabajo (REP-03)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_servicios_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de servicios y mano de obra (ORD-10)';
