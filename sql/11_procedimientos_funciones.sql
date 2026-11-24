-- =====================================================================
-- AutoPulse Elite - Bloque 11: Procedimientos almacenados y funciones
-- Requisitos: ORD-10, VEH-07, REP-01
-- =====================================================================
--
-- Este bloque agrega dos rutinas que viven dentro de MySQL:
--
--   * sp_calcular_total_orden(orden_id): recalcula y persiste los totales
--     de una orden (piezas + mano de obra con descuento VIP + IVA 16 %).
--   * fn_valor_en_custodia(): suma el valor aproximado de los vehiculos
--     que siguen bajo custodia del taller (orden no entregada).
--
-- Se ejecuta despues de los bloques 01 a 10. Es idempotente: primero
-- elimina las rutinas si ya existen y despues las vuelve a crear.
--
-- Nota sobre binlog: si el servidor tiene el binary log activo y el
-- usuario no cuenta con SUPER, MySQL puede rechazar CREATE FUNCTION con
-- el error 1418. En ese caso, como administrador:
--   SET GLOBAL log_bin_trust_function_creators = 1;
-- =====================================================================

DROP PROCEDURE IF EXISTS sp_calcular_total_orden;
DROP FUNCTION IF EXISTS fn_valor_en_custodia;

DELIMITER $$

-- ---------------------------------------------------------------------
-- sp_calcular_total_orden
--
-- Entrada : p_orden_id (INT UNSIGNED)
-- Salida  : un renglon con el desglose y los totales ya guardados.
--
-- Reglas (las mismas que aplica el backend en _recalcular_totales):
--   1. total_piezas    = suma de lineas de refaccion vigentes.
--   2. mano de obra    = suma de lineas de servicio vigentes.
--   3. descuento VIP   = clientes.descuento_mano_obra (0 a 100).
--   4. total_mano_obra = mano de obra * (100 - descuento) / 100.
--   5. subtotal        = total_piezas + total_mano_obra.
--   6. iva             = subtotal * 0.16.
--   7. total           = subtotal + iva.
--
-- El procedimiento escribe los cinco importes en ordenes_servicio para
-- que la orden quede consistente aunque se invoque desde Workbench, un
-- script de mantenimiento o una futura integracion.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_calcular_total_orden(IN p_orden_id INT UNSIGNED)
    MODIFIES SQL DATA
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE v_descuento DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_piezas DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_mano_obra_bruta DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_mano_obra DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_subtotal DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_iva DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_total DECIMAL(12,2) DEFAULT 0.00;

    -- La orden debe existir y estar vigente; si no, se aborta con un
    -- mensaje entendible en lugar de devolver ceros silenciosos.
    SELECT COUNT(*)
      INTO v_existe
      FROM ordenes_servicio
     WHERE id = p_orden_id
       AND activo = 1;

    IF v_existe = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La orden indicada no existe o esta dada de baja';
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
       AND d.activo = 1;

    -- El descuento VIP vive en el cliente, no en la orden (3FN).
    SELECT c.descuento_mano_obra
      INTO v_descuento
      FROM ordenes_servicio o
      JOIN clientes c ON c.id = o.cliente_id
     WHERE o.id = p_orden_id;

    -- Se acota el descuento al rango valido aunque la columna ya lo valide.
    IF v_descuento < 0 THEN
        SET v_descuento = 0.00;
    ELSEIF v_descuento > 100 THEN
        SET v_descuento = 100.00;
    END IF;

    SET v_piezas = ROUND(v_piezas, 2);
    SET v_mano_obra = ROUND(v_mano_obra_bruta * (100 - v_descuento) / 100, 2);
    SET v_subtotal = ROUND(v_piezas + v_mano_obra, 2);
    SET v_iva = ROUND(v_subtotal * 0.16, 2);
    SET v_total = ROUND(v_subtotal + v_iva, 2);

    UPDATE ordenes_servicio
       SET total_piezas = v_piezas,
           total_mano_obra = v_mano_obra,
           subtotal = v_subtotal,
           iva = v_iva,
           total = v_total
     WHERE id = p_orden_id;

    -- Resultado listo para revisar en MySQL Workbench o consumir por API.
    SELECT p_orden_id AS orden_id,
           v_piezas AS total_piezas,
           v_mano_obra_bruta AS mano_obra_bruta,
           v_descuento AS descuento_vip_pct,
           v_mano_obra AS total_mano_obra,
           v_subtotal AS subtotal,
           v_iva AS iva,
           v_total AS total;
END$$

-- ---------------------------------------------------------------------
-- fn_valor_en_custodia
--
-- Devuelve la suma de vehiculos.valor_aproximado de los autos que siguen
-- bajo custodia del taller, es decir, los que tienen al menos una orden
-- vigente cuyo estado no es 'Entregado'.
--
-- Se usa EXISTS en lugar de JOIN para que un vehiculo con varias ordenes
-- abiertas se cuente una sola vez. Los vehiculos sin orden (por ejemplo,
-- un auto recien registrado) no estan en custodia y no suman.
--
-- Nota: la regla solicitada excluye solo 'Entregado', asi que 'Listo' y
-- 'Cancelado' siguen sumando mientras el auto no se entregue fisicamente.
-- Si el taller decide que una orden cancelada libera el auto de inmediato,
-- cambiar el predicado por: o.estado NOT IN ('Entregado', 'Cancelado').
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_valor_en_custodia()
    RETURNS DECIMAL(14,2)
    READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(14,2) DEFAULT 0.00;

    SELECT COALESCE(SUM(v.valor_aproximado), 0.00)
      INTO v_total
      FROM vehiculos v
     WHERE v.activo = 1
       AND v.valor_aproximado IS NOT NULL
       AND EXISTS (
           SELECT 1
             FROM ordenes_servicio o
            WHERE o.vehiculo_id = v.id
              AND o.activo = 1
              AND o.estado <> 'Entregado'
       );

    RETURN v_total;
END$$

DELIMITER ;

-- =====================================================================
-- Verificacion manual (descomenta en Workbench o ejecuta por separado)
-- =====================================================================
-- CALL sp_calcular_total_orden(4);
-- SELECT fn_valor_en_custodia() AS valor_en_custodia_mxn;
