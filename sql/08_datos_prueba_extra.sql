-- =====================================================================
-- Apex Elite Motorsport - Bloque 8: datos de prueba adicionales
-- Requisitos: CLI-01, VEH-01, ORD-01, ORD-06, ORD-09, ORD-10
--
-- Inserta 5 clientes, 5 vehículos, 2 mecánicos, 3 servicios de mano de
-- obra y 5 órdenes (Recibido, Diagnóstico, Reparación, Listo y Entregado)
-- para que las pantallas de Clientes, Vehículos y Órdenes tengan datos.
--
-- El script es idempotente: usa IDs explícitos y "ON DUPLICATE KEY UPDATE"
-- para poder ejecutarlo más de una vez sin duplicar registros.
--
-- Ejecución:
--   mysql -u root -p autopulse_elite < sql/08_datos_prueba_extra.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 5 clientes nuevos (IDs 4 a 8). Continúan a los 3 clientes semilla.
-- ---------------------------------------------------------------------
INSERT INTO clientes
  (id, nombre, telefono1, telefono2, correo, direccion, nombre_asistente,
   categoria, descuento_mano_obra, permite_pagos_parciales, confidencial,
   notas, rfc, razon_social, regimen_fiscal, codigo_postal)
VALUES
  (4, 'Alejandra Ríos', '5552000001', '5552000011',
   'alejandra.rios@example.com', 'Lomas de Chapultepec 210, CDMX',
   'Paola (asistente)', 'VIP', 10.00, 1, 0,
   'Cliente VIP: 10% de descuento en mano de obra y pagos parciales.',
   'RIRA900312ABC', 'Alejandra Ríos', '605', '11000'),
  (5, 'Héctor Mendoza', '5552000002', NULL,
   'hector.mendoza@example.com', 'Del Valle Centro, CDMX', NULL,
   'Regular', 0.00, 0, 0, NULL, NULL, NULL, NULL, NULL),
  (6, 'Sofía Vargas', '5552000003', '5552000013',
   'sofia.vargas@example.com', 'Interlomas, Estado de México', NULL,
   'VIP', 10.00, 1, 0,
   'Cliente VIP recurrente. Prefiere comunicación por correo.',
   'VASS880725XYZ', 'Sofía Vargas', '612', '52760'),
  (7, 'Javier Ortega', '5552000004', NULL,
   'javier.ortega@example.com', 'Coyoacán, CDMX', NULL,
   'Regular', 0.00, 0, 0, NULL, NULL, NULL, NULL, NULL),
  (8, 'Valeria Núñez', '5552000005', NULL,
   'valeria.nunez@example.com', 'Satélite, Estado de México', NULL,
   'Regular', 0.00, 0, 0, NULL, NULL, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE id = id;

-- ---------------------------------------------------------------------
-- 5 vehículos nuevos (IDs 4 a 8), uno por cada cliente nuevo.
-- ---------------------------------------------------------------------
INSERT INTO vehiculos
  (id, cliente_id, placas, vin, marca, modelo, anio, color,
   kilometraje_entrada, valor_aproximado)
VALUES
  (4, 4, 'PPG-004-D', 'WA1BNAFY1J2123456', 'Audi', 'Q5', 2022,
   'Blanco', 18500, 980000.00),
  (5, 5, 'PPG-005-E', 'WVWZZZAUZLW123456', 'Volkswagen', 'Golf GTI', 2020,
   'Rojo', 41200, 520000.00),
  (6, 6, 'PPG-006-F', '2T2BZMCA7JC123456', 'Lexus', 'RX 350', 2021,
   'Gris', 26700, 1150000.00),
  (7, 7, 'PPG-007-G', '1FA6P8CFXJ5123456', 'Ford', 'Mustang GT', 2018,
   'Negro', 58300, 760000.00),
  (8, 8, 'PPG-008-H', 'JTDB4MEE5PJ123456', 'Toyota', 'Corolla', 2023,
   'Azul', 9400, 420000.00)
ON DUPLICATE KEY UPDATE id = id;

-- ---------------------------------------------------------------------
-- 2 mecánicos nuevos (IDs 2 y 3).
-- ---------------------------------------------------------------------
INSERT INTO mecanicos
  (id, nombre, telefono, correo, especialidad, notas)
VALUES
  (2, 'Carlos Medina', '5553000002', 'carlos.medina@pizarrogarage.mx',
   'Suspensión y frenos', 'Especialista en tren delantero y frenos de alto desempeño.'),
  (3, 'Fernanda López', '5553000003', 'fernanda.lopez@pizarrogarage.mx',
   'Diagnóstico electrónico', 'Manejo de escáner y calibración de sistemas electrónicos.')
ON DUPLICATE KEY UPDATE id = id;

-- ---------------------------------------------------------------------
-- 3 servicios de mano de obra (IDs 1 a 3).
-- Precios base antes de descuento VIP e IVA.
-- ---------------------------------------------------------------------
INSERT INTO servicios
  (id, nombre, descripcion, precio_mano_obra, duracion_estimada_horas)
VALUES
  (1, 'Cambio de aceite', 'Cambio de aceite y filtro con revisión de niveles.',
   1200.00, 1.0),
  (2, 'Alineación', 'Alineación y balanceo de las cuatro ruedas.',
   850.00, 1.5),
  (3, 'Diagnóstico computarizado', 'Lectura de códigos y diagnóstico con escáner.',
   650.00, 1.0)
ON DUPLICATE KEY UPDATE id = id;

-- ---------------------------------------------------------------------
-- 5 órdenes nuevas (IDs 2 a 6) en etapas distintas.
-- Los totales ya incluyen el IVA. La orden 4 aplica 10% de descuento VIP
-- a la mano de obra porque pertenece a la clienta 6.
-- ---------------------------------------------------------------------
INSERT INTO ordenes_servicio
  (id, cliente_id, vehiculo_id, mecanico_id, estado, falla_reportada,
   total_piezas, total_mano_obra, subtotal, iva, total,
   requiere_autorizacion, motivo_cancelacion, created_at, updated_at)
VALUES
  (2, 4, 4, 2, 'Recibido',
   'Ruido metálico en la suspensión delantera al pasar topes.',
   0.00, 0.00, 0.00, 0.00, 0.00, 0, NULL,
   DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (3, 5, 5, 3, 'Diagnostico',
   'Testigo de motor encendido y consumo elevado de combustible.',
   0.00, 650.00, 650.00, 104.00, 754.00, 0, NULL,
   DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (4, 6, 6, 2, 'Reparacion',
   'Vibración en el volante y desgaste irregular de las llantas.',
   0.00, 2430.00, 2430.00, 388.80, 2818.80, 0, NULL,
   DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (5, 7, 7, 3, 'Listo',
   'Mantenimiento programado de 40,000 km y revisión general.',
   0.00, 2050.00, 2050.00, 328.00, 2378.00, 0, NULL,
   DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
  (6, 8, 8, 1, 'Entregado',
   'Mantenimiento preventivo y diagnóstico general.',
   0.00, 1850.00, 1850.00, 296.00, 2146.00, 0, NULL,
   DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE id = id;

-- ---------------------------------------------------------------------
-- Asignación formal del responsable en la tabla puente (ORD-09).
-- ---------------------------------------------------------------------
INSERT INTO orden_mecanicos (id, orden_id, mecanico_id)
VALUES
  (1, 1, 1),
  (2, 2, 2),
  (3, 3, 3),
  (4, 4, 2),
  (5, 5, 3),
  (6, 6, 1)
ON DUPLICATE KEY UPDATE id = id;

-- ---------------------------------------------------------------------
-- Detalle de mano de obra por orden (ORD-10).
--
-- La orden 4 es de una clienta VIP: sus precios unitarios ya llevan el
-- 10% de descuento (1,200 -> 1,080, 850 -> 765, 650 -> 585).
-- ---------------------------------------------------------------------
INSERT INTO detalle_orden
  (id, orden_id, servicio_id, refaccion_id, cantidad, precio_unitario)
VALUES
  (1, 3, 3, NULL, 1, 650.00),
  (2, 4, 1, NULL, 1, 1080.00),
  (3, 4, 2, NULL, 1, 765.00),
  (4, 4, 3, NULL, 1, 585.00),
  (5, 5, 1, NULL, 1, 1200.00),
  (6, 5, 2, NULL, 1, 850.00),
  (7, 6, 1, NULL, 1, 1200.00),
  (8, 6, 3, NULL, 1, 650.00)
ON DUPLICATE KEY UPDATE id = id;

-- ---------------------------------------------------------------------
-- Historial de etapas (ORD-06). Se registra la apertura y cada avance
-- hasta la etapa actual de cada orden.
-- ---------------------------------------------------------------------
-- Se usa INSERT IGNORE porque historial_etapas tiene un trigger que bloquea
-- cualquier UPDATE (incluso un ON DUPLICATE KEY UPDATE sin cambios reales).
INSERT IGNORE INTO historial_etapas
  (id, orden_id, etapa_anterior, etapa_nueva, usuario_id)
VALUES
  (1, 1, NULL, 'Recibido', 1),

  (2, 2, NULL, 'Recibido', 1),

  (3, 3, NULL, 'Recibido', 1),
  (4, 3, 'Recibido', 'Diagnostico', 1),

  (5, 4, NULL, 'Recibido', 1),
  (6, 4, 'Recibido', 'Diagnostico', 1),
  (7, 4, 'Diagnostico', 'Reparacion', 1),

  (8, 5, NULL, 'Recibido', 1),
  (9, 5, 'Recibido', 'Diagnostico', 1),
  (10, 5, 'Diagnostico', 'Reparacion', 1),
  (11, 5, 'Reparacion', 'Listo', 1),

  (12, 6, NULL, 'Recibido', 1),
  (13, 6, 'Recibido', 'Diagnostico', 1),
  (14, 6, 'Diagnostico', 'Reparacion', 1),
  (15, 6, 'Reparacion', 'Listo', 1),
  (16, 6, 'Listo', 'Entregado', 1);

-- ---------------------------------------------------------------------
-- Verificación rápida (opcional).
-- ---------------------------------------------------------------------
SELECT 'clientes' AS tabla, COUNT(*) AS total FROM clientes
UNION ALL SELECT 'vehiculos', COUNT(*) FROM vehiculos
UNION ALL SELECT 'mecanicos', COUNT(*) FROM mecanicos
UNION ALL SELECT 'servicios', COUNT(*) FROM servicios
UNION ALL SELECT 'ordenes_servicio', COUNT(*) FROM ordenes_servicio;
