-- =====================================================================
-- Apex Elite Motorsport - Bloque 2: Vehículos
-- Requisitos: VEH-01 a VEH-08
-- =====================================================================

CREATE TABLE IF NOT EXISTS vehiculos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del vehículo (VEH-01)',
  cliente_id INT UNSIGNED NOT NULL COMMENT 'Dueño del vehículo; FK a clientes.id (VEH-02)',
  placas VARCHAR(20) NOT NULL COMMENT 'Placas del vehículo; índice para búsqueda en menos de 3 segundos (VEH-01, VEH-06)',
  vin VARCHAR(50) NULL COMMENT 'Número de serie / VIN del vehículo (VEH-01)',
  marca VARCHAR(50) NOT NULL COMMENT 'Marca del vehículo (VEH-01)',
  modelo VARCHAR(50) NOT NULL COMMENT 'Modelo del vehículo (VEH-01)',
  anio INT NOT NULL COMMENT 'Año modelo del vehículo (VEH-01)',
  color VARCHAR(30) NULL COMMENT 'Color del vehículo (VEH-01)',
  kilometraje_entrada INT UNSIGNED NULL COMMENT 'Kilometraje registrado al ingreso al taller (VEH-01)',
  valor_aproximado DECIMAL(12,2) NULL COMMENT 'Valor aproximado del auto para calcular el valor en custodia (VEH-07)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_vehiculos_cliente (cliente_id),
  KEY idx_vehiculos_placas (placas),
  KEY idx_vehiculos_vin (vin),
  CONSTRAINT fk_vehiculos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Vehículos registrados de clientes (VEH-01 a VEH-08)';

CREATE TABLE IF NOT EXISTS polizas_seguro (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la póliza (VEH-04)',
  vehiculo_id INT UNSIGNED NOT NULL COMMENT 'Vehículo asegurado; FK a vehiculos.id (VEH-04)',
  aseguradora VARCHAR(100) NOT NULL COMMENT 'Nombre de la aseguradora (VEH-04)',
  numero_poliza VARCHAR(50) NOT NULL COMMENT 'Número de póliza de seguro (VEH-04)',
  vigencia_inicio DATE NOT NULL COMMENT 'Fecha de inicio de vigencia de la póliza (VEH-04)',
  vigencia_fin DATE NOT NULL COMMENT 'Fecha de fin de vigencia; alerta 30 días antes (VEH-04, VEH-05)',
  cobertura TEXT NULL COMMENT 'Detalle de la cobertura contratada (VEH-04)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  KEY idx_polizas_vehiculo (vehiculo_id),
  KEY idx_polizas_vigencia_fin (vigencia_fin),
  CONSTRAINT fk_polizas_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pólizas de seguro de los vehículos (VEH-04, VEH-05)';
