-- =====================================================================
-- Apex Elite Motorsport - Bloque 4c: Seguridad, auditoría y órdenes (cierre)
-- Requisitos: SEG-01 a SEG-07, SEG-20, ORD-06, ORD-09, AUT-08, PAG-06
-- =====================================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del usuario del sistema (SEG-01)',
  nombre VARCHAR(150) NOT NULL COMMENT 'Nombre completo del usuario: administrador, recepción o mecánico (SEG-01)',
  correo VARCHAR(150) NOT NULL COMMENT 'Correo de acceso; identificador único de autenticación (SEG-01)',
  password_hash VARCHAR(255) NOT NULL COMMENT 'Contraseña cifrada con hash; nunca en texto plano (SEG-01, SEG-15)',
  rol ENUM('Administrador','Recepcion','Mecanico') NOT NULL COMMENT 'Rol que define permisos: acceso total, sin finanzas o solo placas y trabajo (SEG-01, SEG-02, SEG-03, SEG-04, SEG-18)',
  mecanico_id INT UNSIGNED NULL COMMENT 'Vínculo opcional al catálogo de mecánicos cuando el usuario lo es; FK a mecanicos.id (SEG-01, ORD-09, REP-03)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del usuario (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 dado de baja; el usuario no se elimina (SEG-07)',
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_correo (correo),
  KEY idx_usuarios_rol (rol),
  KEY idx_usuarios_mecanico (mecanico_id),
  CONSTRAINT fk_usuarios_mecanico FOREIGN KEY (mecanico_id) REFERENCES mecanicos (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuarios del sistema con roles Administrador, Recepcion y Mecanico (SEG-01 a SEG-04)';

-- Tabla inmutable: solo created_at, sin updated_at ni activo (SEG-06).
CREATE TABLE IF NOT EXISTS bitacora (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del asiento de bitácora (SEG-06)',
  usuario_id INT UNSIGNED NOT NULL COMMENT 'Usuario que ejecutó la acción; FK a usuarios.id (SEG-06, ORD-08)',
  tabla_afectada VARCHAR(100) NOT NULL COMMENT 'Tabla sobre la que se actuó, por ejemplo ordenes_servicio o facturas (SEG-06)',
  registro_id INT UNSIGNED NOT NULL COMMENT 'Identificador del registro afectado dentro de esa tabla (SEG-06)',
  accion ENUM('Creacion','Actualizacion','Cancelacion','Autorizacion','Consulta_Confidencial') NOT NULL COMMENT 'Tipo de evento auditado: alta, cambio, cancelación, autorización o consulta a expediente confidencial (SEG-06, SEG-20)',
  detalle TEXT NULL COMMENT 'Valores o contexto del cambio, en formato legible, para reconstruir qué pasó (SEG-06)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora exacta del evento; la bitácora es inmutable y no se edita (SEG-06, ORD-08)',
  PRIMARY KEY (id),
  KEY idx_bitacora_usuario (usuario_id),
  KEY idx_bitacora_registro (tabla_afectada, registro_id),
  KEY idx_bitacora_fecha (created_at),
  KEY idx_bitacora_accion (accion),
  CONSTRAINT fk_bitacora_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bitácora de auditoría inmutable de altas, cambios, cancelaciones y autorizaciones (SEG-06)';

CREATE TABLE IF NOT EXISTS orden_mecanicos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la asignación (ORD-09)',
  orden_id INT UNSIGNED NOT NULL COMMENT 'Orden de servicio; FK a ordenes_servicio.id (ORD-09)',
  mecanico_id INT UNSIGNED NOT NULL COMMENT 'Mecánico asignado a la orden; FK a mecanicos.id (ORD-09)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la asignación (ORD-09, SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 asignación vigente, 0 desasignada (SEG-07)',
  PRIMARY KEY (id),
  UNIQUE KEY uq_orden_mecanicos (orden_id, mecanico_id),
  KEY idx_orden_mecanicos_mecanico (mecanico_id),
  CONSTRAINT fk_orden_mecanicos_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orden_mecanicos_mecanico FOREIGN KEY (mecanico_id) REFERENCES mecanicos (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Asignación de uno o más mecánicos por orden (ORD-09)';

CREATE TABLE IF NOT EXISTS historial_etapas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del cambio de etapa (ORD-06)',
  orden_id INT UNSIGNED NOT NULL COMMENT 'Orden que cambió de etapa; FK a ordenes_servicio.id (ORD-06)',
  etapa_anterior ENUM('Recibido','Diagnostico','Reparacion','Listo','Entregado','Cancelado') NULL COMMENT 'Etapa previa; NULL cuando es la apertura de la orden (ORD-02, ORD-06)',
  etapa_nueva ENUM('Recibido','Diagnostico','Reparacion','Listo','Entregado','Cancelado') NOT NULL COMMENT 'Etapa a la que pasa la orden (ORD-02, ORD-04, ORD-05)',
  usuario_id INT UNSIGNED NOT NULL COMMENT 'Usuario que movió la etapa; permite validar que solo el admin retroceda (ORD-04, ORD-05, SEG-06)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del cambio de etapa; base de la alerta de más de 5 días sin movimiento (ORD-06)',
  PRIMARY KEY (id),
  KEY idx_historial_orden (orden_id),
  KEY idx_historial_fecha (created_at),
  KEY idx_historial_usuario (usuario_id),
  CONSTRAINT fk_historial_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial inmutable de cambios de etapa por orden (ORD-06)';

CREATE TABLE IF NOT EXISTS parametros (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del parámetro (AUT-08, PAG-06)',
  clave VARCHAR(50) NOT NULL COMMENT 'Clave única del parámetro, por ejemplo tolerancia_reautorizacion o umbral_piezas_caras (AUT-08, PAG-06)',
  valor VARCHAR(100) NOT NULL COMMENT 'Valor vigente del parámetro, guardado como texto y convertido por la aplicación (AUT-08, PAG-06)',
  descripcion TEXT NULL COMMENT 'Explicación del parámetro y su efecto en el negocio (AUT-08, PAG-06)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del parámetro (auditoría SEG-06)',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora del último cambio de valor (auditoría SEG-06)',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (id),
  UNIQUE KEY uq_parametros_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Parámetros configurables de tolerancia y umbrales (AUT-08, PAG-06)';

-- La bitácora debe ser inmutable (SEG-06). TRUNCATE sigue permitido para limpiezas de desarrollo.
DELIMITER $$
CREATE TRIGGER trg_bitacora_bu BEFORE UPDATE ON bitacora
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'bitacora: es inmutable, no se permite modificar asientos';
END$$

CREATE TRIGGER trg_bitacora_bd BEFORE DELETE ON bitacora
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'bitacora: es inmutable, no se permite borrar asientos';
END$$
DELIMITER ;

-- El historial de etapas también es inmutable (ORD-06, ADR-006).
-- Se agregó para que el script sea reproducible: estos dos triggers ya
-- existían en la BD pero faltaban aquí.
DELIMITER $$
CREATE TRIGGER trg_historial_etapas_bu BEFORE UPDATE ON historial_etapas
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'historial_etapas: es inmutable, no se permite modificar registros';
END$$

CREATE TRIGGER trg_historial_etapas_bd BEFORE DELETE ON historial_etapas
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'historial_etapas: es inmutable, no se permite borrar registros';
END$$
DELIMITER ;
