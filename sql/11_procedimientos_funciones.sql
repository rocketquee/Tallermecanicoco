-- =====================================================================
-- Apex Elite Motorsport - Bloque 11: Procedimientos y funciones (PostgreSQL)
-- Requisitos: ORD-10, VEH-07, REP-01
-- =====================================================================
--
-- Este bloque agrega dos rutinas que viven dentro de PostgreSQL:
--
--   * sp_calcular_total_orden(orden_id): recalcula y persiste los totales
--     de una orden (piezas + mano de obra con descuento VIP + IVA 16 %).
--   * fn_valor_en_custodia(): suma el valor aproximado de los vehículos
--     que siguen bajo custodia del taller (orden no entregada).
--
-- Se ejecuta después de los bloques 01 a 10. Es idempotente: elimina las
-- rutinas si ya existen y después las vuelve a crear.
--
-- Diferencias con MySQL:
--   * No hay DELIMITER: el cuerpo va en un bloque $$ ... $$.
--   * No hay PROCEDURE devolviendo result set; sp_calcular_total_orden se
--     implementa como FUNCTION que devuelve TABLE. Se invoca con SELECT:
--         SELECT * FROM sp_calcular_total_orden(4);
--   * SIGNAL SQLSTATE '45000' se reemplaza por RAISE EXCEPTION con
--     ERRCODE = 'P0001', igual que los triggers de los bloques 4 y 6.
--   * El aviso de binlog/log_bin_trust_function_creators ya no aplica.
-- =====================================================================

BEGIN;

DROP FUNCTION IF EXISTS sp_calcular_total_orden(INTEGER);
DROP FUNCTION IF EXISTS fn_valor_en_custodia();

-- ---------------------------------------------------------------------
-- sp_calcular_total_orden
--
-- Entrada : p_orden_id INTEGER
-- Salida  : una fila con el desglose y los totales ya guardados.
--
-- Reglas (las mismas que aplica el backend en _recalcular_totales):
--   1. total_piezas    = suma de líneas de refacción vigentes.
--   2. mano de obra    = suma de líneas de servicio vigentes.
--   3. descuento VIP   = clientes.descuento_mano_obra (0 a 100).
--   4. total_mano_obra = mano de obra * (100 - descuento) / 100.
--   5. subtotal        = total_piezas + total_mano_obra.
--   6. iva             = subtotal * 0.16.
--   7. total           = subtotal + iva.
--
-- La rutina escribe los cinco importes en ordenes_servicio para que la
-- orden quede consistente aunque se invoque desde psql, un script de
-- mantenimiento o una futura integración.
-- ---------------------------------------------------------------------
CREATE FUNCTION sp_calcular_total_orden(p_orden_id INTEGER)
RETURNS TABLE (
    orden_id INTEGER,
    total_piezas NUMERIC(12, 2),
    mano_obra_bruta NUMERIC(12, 2),
    descuento_vip_pct NUMERIC(5, 2),
    total_mano_obra NUMERIC(12, 2),
    subtotal NUMERIC(12, 2),
    iva NUMERIC(12, 2),
    total NUMERIC(12, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_descuento NUMERIC(5, 2) DEFAULT 0.00;
    v_piezas NUMERIC(12, 2) DEFAULT 0.00;
    v_mano_obra_bruta NUMERIC(12, 2) DEFAULT 0.00;
    v_mano_obra NUMERIC(12, 2) DEFAULT 0.00;
    v_subtotal NUMERIC(12, 2) DEFAULT 0.00;
    v_iva NUMERIC(12, 2) DEFAULT 0.00;
    v_total NUMERIC(12, 2) DEFAULT 0.00;
BEGIN
    -- La orden debe existir y estar vigente; si no, se aborta con un
    -- mensaje entendible en lugar de devolver ceros silenciosos.
    IF NOT EXISTS (
        SELECT 1
          FROM ordenes_servicio
         WHERE id = p_orden_id
           AND activo = TRUE
    ) THEN
        RAISE EXCEPTION
            'La orden indicada no existe o está dada de baja'
            USING ERRCODE = 'P0001';
    END IF;

    -- Piezas y mano de obra se separan en una sola pasada sobre el detalle.
    SELECT COALESCE(SUM(CASE WHEN d.refaccion_id IS NOT NULL
                             THEN d.precio_unitario * d.cantidad
                             ELSE 0 END), 0.00),
           COALESCE(SUM(CASE WHEN d.servicio_id IS NOT NULL
                             THEN d.precio_unitario * d.cantidad
                             ELSE 0 END), 0.00)
      INTO v_piezas, v_mano_obra_bruta
      FROM detalle_orden d
     WHERE d.orden_id = p_orden_id
       AND d.activo = TRUE;

    -- El descuento VIP vive en el cliente, no en la orden (3FN).
    SELECT c.descuento_mano_obra
      INTO v_descuento
      FROM ordenes_servicio o
      JOIN clientes c ON c.id = o.cliente_id
     WHERE o.id = p_orden_id;

    -- Se acota el descuento al rango válido aunque la columna ya lo valide.
    IF v_descuento < 0 THEN
        v_descuento := 0.00;
    ELSIF v_descuento > 100 THEN
        v_descuento := 100.00;
    END IF;

    v_piezas := ROUND(v_piezas, 2);
    v_mano_obra := ROUND(v_mano_obra_bruta * (100 - v_descuento) / 100, 2);
    v_subtotal := ROUND(v_piezas + v_mano_obra, 2);
    v_iva := ROUND(v_subtotal * 0.16, 2);
    v_total := ROUND(v_subtotal + v_iva, 2);

    UPDATE ordenes_servicio
       SET total_piezas = v_piezas,
           total_mano_obra = v_mano_obra,
           subtotal = v_subtotal,
           iva = v_iva,
           total = v_total
     WHERE id = p_orden_id;

    -- Resultado listo para revisar en psql o consumir por API.
    RETURN QUERY
    SELECT p_orden_id,
           v_piezas,
           v_mano_obra_bruta,
           v_descuento,
           v_mano_obra,
           v_subtotal,
           v_iva,
           v_total;
END;
$$;

COMMENT ON FUNCTION sp_calcular_total_orden(INTEGER) IS
    'Recalcula y persiste los totales de una orden: piezas + mano de obra con descuento VIP + IVA 16 % (ORD-10)';

-- ---------------------------------------------------------------------
-- fn_valor_en_custodia
--
-- Devuelve la suma de vehiculos.valor_aproximado de los autos que siguen
-- bajo custodia del taller, es decir, los que tienen al menos una orden
-- vigente cuyo estado no es 'Entregado'.
--
-- Se usa EXISTS en lugar de JOIN para que un vehículo con varias órdenes
-- abiertas se cuente una sola vez. Los vehículos sin orden (por ejemplo,
-- un auto recién registrado) no están en custodia y no suman.
--
-- Nota: la regla solicitada excluye solo 'Entregado', así que 'Listo' y
-- 'Cancelado' siguen sumando mientras el auto no se entregue físicamente.
-- Si el taller decide que una orden cancelada libera el auto de inmediato,
-- cambiar el predicado por: o.estado NOT IN ('Entregado', 'Cancelado').
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_valor_en_custodia()
RETURNS NUMERIC(14, 2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_total NUMERIC(14, 2) DEFAULT 0.00;
BEGIN
    SELECT COALESCE(SUM(v.valor_aproximado), 0.00)
      INTO v_total
      FROM vehiculos v
     WHERE v.activo = TRUE
       AND v.valor_aproximado IS NOT NULL
       AND EXISTS (
           SELECT 1
             FROM ordenes_servicio o
            WHERE o.vehiculo_id = v.id
              AND o.activo = TRUE
              AND o.estado <> 'Entregado'
       );

    RETURN v_total;
END;
$$;

COMMENT ON FUNCTION fn_valor_en_custodia() IS
    'Suma el valor aproximado de los vehículos con al menos una orden vigente no entregada (VEH-07, REP-01)';

COMMIT;

-- =====================================================================
-- Verificación manual (descomenta y ejecuta por separado)
-- =====================================================================
-- SELECT * FROM sp_calcular_total_orden(4);
-- SELECT fn_valor_en_custodia() AS valor_en_custodia_mxn;
