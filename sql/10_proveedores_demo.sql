-- =====================================================================
-- Apex Elite Motorsport - Bloque 10: proveedores de refacciones (PostgreSQL)
-- Requisitos: PRV-01, PRV-02, PRV-09
--
-- Inserta 4 proveedores mexicanos que cotizan en MXN. Continúan al
-- proveedor italiano sembrado en 07_datos_prueba.sql (id = 1), que queda
-- intacto.
--
-- El script es idempotente: usa IDs explícitos y ON CONFLICT DO NOTHING,
-- igual que 08_datos_prueba_extra.sql. Si un proveedor ya existe no se
-- sobrescribe, para no pisar los datos que se hayan editado desde la API.
--
-- Nota: no se inventaron personas de contacto, teléfonos ni correos. Esos
-- campos quedan NULL y se completan después con
-- PUT /api/v1/proveedores/{id}. La descripción comercial de cada proveedor
-- va como comentario porque la tabla no tiene columna de notas.
--
-- Requiere haber ejecutado 01_catalogos.sql y 07_datos_prueba.sql.
--
-- Ejecución:
--   psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/10_proveedores_demo.sql
-- =====================================================================

BEGIN;

INSERT INTO proveedores
  (id, nombre, pais, contacto, telefono, correo,
   tiempo_entrega_dias, moneda)
VALUES
  -- Tienda en línea de refacciones originales europeas: BMW, Audi,
  -- Mercedes-Benz, Porsche, etc.
  (2, 'SAFE Refacciones', 'México', NULL, NULL, NULL, 3, 'MXN'),

  -- Distribuidor de piezas OEM y performance: Brembo, Bilstein, etc.,
  -- para marcas de alta gama.
  (3, 'Refacciones Originales OEM', 'México', NULL, NULL, NULL, 5, 'MXN'),

  -- Especialista en refacciones europeas premium: suspensión, frenos
  -- y motor.
  (4, 'Embler Autopartes', 'México', NULL, NULL, NULL, 4, 'MXN'),

  -- Cuautitlán Izcalli. Venta en línea y Mercado Libre; acepta pagos
  -- por app (BBVA/Banorte).
  (5, 'Premium Parts S.A. de C.V.', 'México', NULL, NULL, NULL, 2, 'MXN')
ON CONFLICT (id) DO NOTHING;

-- Al insertar IDs explícitos la secuencia no avanza sola; sin este
-- reajuste el siguiente INSERT de la aplicación chocaría con la PK.
SELECT setval(pg_get_serial_sequence('proveedores', 'id'),
              COALESCE((SELECT MAX(id) FROM proveedores), 1));

COMMIT;
