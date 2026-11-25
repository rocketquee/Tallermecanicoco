-- =====================================================================
-- Apex Elite Motorsport - Bloque 7: Datos de prueba (solo desarrollo)
-- Requisitos: datos mínimos para probar la aplicación
--
-- Contraseña de AMBOS usuarios de prueba: AutoPulse2026!
-- Hash scrypt (N=16384, r=8, p=1, salt base64, hash base64), regenerado con
-- hashlib.scrypt de Python al implementar el login (ADR-004). El salt se usa
-- ya decodificado, que es el formato estándar; cada usuario tiene salt propio.
--
-- Este script asume tablas vacías e IDs explícitos para que sea reproducible.
-- Para reiniciar los datos en desarrollo:
--   SET FOREIGN_KEY_CHECKS = 0;
--   TRUNCATE bitacora; TRUNCATE historial_etapas; TRUNCATE orden_mecanicos;
--   TRUNCATE pagos; TRUNCATE facturas; TRUNCATE autorizaciones;
--   TRUNCATE fotos_vehiculo; TRUNCATE detalle_orden; TRUNCATE ordenes_servicio;
--   TRUNCATE movimientos_inventario; TRUNCATE detalle_compra; TRUNCATE compras;
--   TRUNCATE refacciones; TRUNCATE polizas_seguro; TRUNCATE vehiculos;
--   TRUNCATE clientes; TRUNCATE usuarios; TRUNCATE mecanicos;
--   TRUNCATE proveedores; TRUNCATE servicios; TRUNCATE parametros;
--   SET FOREIGN_KEY_CHECKS = 1;
-- (TRUNCATE no dispara los triggers de inmutabilidad de la bitácora.)
-- =====================================================================

-- Parámetros semilla (AUT-08, PAG-06)
INSERT INTO parametros (clave, valor, descripcion) VALUES
  ('tolerancia_reautorizacion', '5',
   'Porcentaje de aumento permitido antes de pedir reautorización (AUT-08). Se elige 5% porque el ejemplo del cliente (300k a 320k = +6.7%) lo requiere.'),
  ('umbral_piezas_caras', '25000',
   'Monto en MXN a partir del cual se exige 50% de anticipo (PAG-06). Promedio de la propuesta del cliente ($20k-$30k).');

-- Mecánico (ORD-09, REP-03)
INSERT INTO mecanicos (id, nombre, telefono, correo, especialidad, notas) VALUES
  (1, 'Luis Ramírez', '5551234567', 'luis.ramirez@pizarrogarage.mx', 'Motor y transmisión', 'Mecánico de prueba para desarrollo');

-- Usuarios (SEG-01): 1 Administrador, 1 Recepción y 1 Mecánico.
-- El tercero existe para probar en Swagger que un mecánico no ve precios ni
-- datos de clientes confidenciales (SEG-17, SEG-18).
INSERT INTO usuarios (id, nombre, correo, password_hash, rol, mecanico_id) VALUES
  (1, 'Gabriel Pizarro', 'gabriel@pizarrogarage.mx',
   'scrypt$16384$8$1$UrWsd84OHxeitBwvDbsHxQ==$+0OzMc0AVsHCxce4LgxAktswkNjKb+Y1NdqJ+Vcu+fOVUW1yJ9TN5MCfyPUEUkHYu+HqVNaEWfxv11azfQyWnw==',
   'Administrador', NULL),
  (2, 'Ana Torres', 'ana.torres@pizarrogarage.mx',
   'scrypt$16384$8$1$IxI3LmjSi/cHJD28CzdkbA==$x5UaAcfGDZrok6qiVDdKZOsksTm7/+rZNNSslHNxW3Z2yILAtc/sCTTTSEBiLyeVDeDtGc5HHNR0yfiAjIt96g==',
   'Recepcion', NULL),
  (3, 'Luis Ramírez', 'luis.ramirez@pizarrogarage.mx',
   'scrypt$16384$8$1$8ZCr8Ier201LUWh/4FPhpQ==$ub6BDMG96VMTIWIkGM/z1yqw/QWlhc/WchtYlzB7NrtDtJj9pxGLsP4bNzjn51J0iZ+hY3+B28SgaYxijYU5IA==',
   'Mecanico', 1);

-- Clientes (CLI-01, CLI-02, SEG-17): VIP, Confidencial y Regular
INSERT INTO clientes
  (id, nombre, telefono1, telefono2, correo, direccion, nombre_asistente, categoria, descuento_mano_obra,
   permite_pagos_parciales, confidencial, notas, rfc, razon_social, regimen_fiscal, codigo_postal) VALUES
  (1, 'Rodrigo Salgado', '5551000001', '5551000002', 'rodrigo.salgado@example.com',
   'Bosques de las Lomas 120, CDMX', 'Jorge (chofer)', 'VIP', 10.00, 1, 0,
   'Cliente VIP: prioridad en fila y 10% de descuento en mano de obra.', 'SALR800101ABC', 'Rodrigo Salgado', '605', '11700'),
  (2, 'Mariana Cortés', '5551000003', NULL, 'mcortes@example.com',
   'Polanco, CDMX', NULL, 'Regular', 0.00, 0, 1,
   'Cliente confidencial: el mecánico solo debe ver placas y trabajo asignado.', 'CORM850202XYZ', 'Mariana Cortés', '612', '11560'),
  (3, 'Emilio Duarte', '5551000004', NULL, NULL,
   'Santa Fe, CDMX', NULL, 'Regular', 0.00, 0, 0, NULL, NULL, NULL, NULL, NULL);

-- Vehículos (VEH-01, VEH-02, VEH-07)
INSERT INTO vehiculos
  (id, cliente_id, placas, vin, marca, modelo, anio, color, kilometraje_entrada, valor_aproximado) VALUES
  (1, 1, 'PPG-001-A', 'WP0AB2A99JS123456', 'Porsche', '911 Carrera S', 2021, 'Plata', 12500, 2450000.00),
  (2, 2, 'PPG-002-B', 'WDDZF4JB0HA123456', 'Mercedes-Benz', 'E 300', 2019, 'Negro', 48000, 950000.00),
  (3, 3, 'PPG-003-C', NULL, 'BMW', 'M4 Competition', 2023, 'Azul', 3200, 2150000.00);

-- Proveedor (PRV-01, PRV-02, PRV-09)
INSERT INTO proveedores (id, nombre, pais, contacto, telefono, correo, tiempo_entrega_dias, moneda) VALUES
  (1, 'Ricambi Milano S.r.l.', 'Italia', 'Marco Bellini', '+39 02 1234 5678', 'info@ricambimilano.it', 42, 'EUR');

-- Refacciones (INV-01, INV-04): una normal con stock y una especial sin stock
INSERT INTO refacciones
  (id, nombre, marca, es_especial, stock_actual, stock_minimo, precio_costo, precio_venta, proveedor_id) VALUES
  (1, 'Kit de tornillería M12 inoxidable', 'Bosch', 0, 40, 5, 850.00, 1350.00, 1),
  (2, 'Turbo original Porsche 911 (991.2)', 'Porsche', 1, 0, 0, 185000.00, 240000.00, 1);

-- Orden de servicio en etapa Recibido, con mecánico principal (ORD-01, ORD-02, ORD-09)
INSERT INTO ordenes_servicio
  (id, cliente_id, vehiculo_id, mecanico_id, estado, falla_reportada,
   total_piezas, total_mano_obra, subtotal, iva, total, requiere_autorizacion, motivo_cancelacion) VALUES
  (1, 1, 1, 1, 'Recibido', 'Ruido metálico en la parte trasera al pasar baches; revisar suspensión.',
   0.00, 0.00, 0.00, 0.00, 0.00, 0, NULL);

-- Asignación formal del mecánico participante (ORD-09)
INSERT INTO orden_mecanicos (id, orden_id, mecanico_id) VALUES (1, 1, 1);

-- Apertura del historial de etapas (ORD-06): sin etapa anterior
INSERT INTO historial_etapas (id, orden_id, etapa_anterior, etapa_nueva, usuario_id) VALUES
  (1, 1, NULL, 'Recibido', 1);
