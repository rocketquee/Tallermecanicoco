-- =====================================================================
-- AutoPulse Elite - Bloque 9: avance del mecanico
-- Requisitos: ORD-04, ORD-06, ORD-08, ORD-10, INV-02, INV-05
-- =====================================================================
-- El diagnostico del mecanico es distinto de `falla_reportada` (que es lo
-- que reporta el cliente al ingresar la unidad). Se guarda en su propia
-- columna para no mezclar ambas versiones de la historia.
--
-- Script idempotente: si la columna ya existe no hace nada.

SET @existe_diagnostico := (
  SELECT COUNT(*)
    FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'ordenes_servicio'
     AND COLUMN_NAME = 'diagnostico'
);

SET @sql := IF(
  @existe_diagnostico = 0,
  'ALTER TABLE ordenes_servicio
     ADD COLUMN diagnostico TEXT NULL
     COMMENT ''Diagnostico y notas del mecanico; separado de la falla reportada por el cliente (ORD-04, ORD-10)''
     AFTER falla_reportada',
  'SELECT ''La columna ordenes_servicio.diagnostico ya existe'' AS resultado'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
