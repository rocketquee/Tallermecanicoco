-- =====================================================================
-- Apex Elite Motorsport - Bloque 10: proveedores de refacciones (datos demo)
-- Requisitos: PRV-01, PRV-02, PRV-09
--
-- Inserta 4 proveedores mexicanos que cotizan en MXN. Continuan al
-- proveedor italiano sembrado en 07_datos_prueba.sql (id = 1), que queda
-- intacto.
--
-- El script es idempotente: usa IDs explicitos y "ON DUPLICATE KEY UPDATE
-- id = id", igual que 08_datos_prueba_extra.sql. Si un proveedor ya existe
-- no se sobrescribe, para no pisar los datos que se hayan editado desde la
-- API.
--
-- Nota: no se inventaron personas de contacto, telefonos ni correos. Esos
-- campos quedan NULL y se completan despues con
-- PUT /api/v1/proveedores/{id}. La descripcion comercial de cada proveedor
-- va como comentario porque la tabla no tiene columna de notas.
--
-- Ejecucion:
--   mysql -u root -p --default-character-set=utf8mb4 autopulse_elite \
--     -e "source sql/10_proveedores_demo.sql"
-- =====================================================================

INSERT INTO proveedores
  (id, nombre, pais, contacto, telefono, correo,
   tiempo_entrega_dias, moneda)
VALUES
  -- Tienda en linea de refacciones originales europeas: BMW, Audi,
  -- Mercedes-Benz, Porsche, etc.
  (2, 'SAFE Refacciones', 'México', NULL, NULL, NULL, 3, 'MXN'),

  -- Distribuidor de piezas OEM y performance: Brembo, Bilstein, etc.,
  -- para marcas de alta gama.
  (3, 'Refacciones Originales OEM', 'México', NULL, NULL, NULL, 5, 'MXN'),

  -- Especialista en refacciones europeas premium: suspension, frenos
  -- y motor.
  (4, 'Embler Autopartes', 'México', NULL, NULL, NULL, 4, 'MXN'),

  -- Cuautitlan Izcalli. Venta en linea y Mercado Libre; acepta pagos
  -- por app (BBVA/Banorte).
  (5, 'Premium Parts S.A. de C.V.', 'México', NULL, NULL, NULL, 2, 'MXN')
ON DUPLICATE KEY UPDATE id = id;
