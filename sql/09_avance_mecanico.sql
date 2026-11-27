-- =====================================================================
-- Apex Elite Motorsport - Bloque 9: avance del mecánico (PostgreSQL)
-- Requisitos: ORD-04, ORD-06, ORD-08, ORD-10, INV-02, INV-05
-- =====================================================================
-- El diagnóstico del mecánico es distinto de `falla_reportada` (que es lo
-- que reporta el cliente al ingresar la unidad). Se guarda en su propia
-- columna para no mezclar ambas versiones de la historia.
--
-- Script idempotente: si la columna ya existe no hace nada.
-- Requiere haber ejecutado 04_ordenes.sql.
--
-- Nota: PostgreSQL no soporta `AFTER falla_reportada`; el orden físico de
-- las columnas es irrelevante para la aplicación. La columna ya se crea en
-- el bloque 4, así que aquí solo se garantiza su existencia.

BEGIN;

ALTER TABLE ordenes_servicio
  ADD COLUMN IF NOT EXISTS diagnostico TEXT NULL;

COMMENT ON COLUMN ordenes_servicio.diagnostico IS
  'Diagnóstico y notas del mecánico; separado de la falla reportada por el cliente (ORD-04, ORD-10)';

COMMIT;
