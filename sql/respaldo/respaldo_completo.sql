-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: autopulse_elite
-- ------------------------------------------------------
-- Server version	26.7.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '2de95566-e12a-11f1-9bf5-08bfb88b2000:1-100';

--
-- Table structure for table `autorizaciones`
--

DROP TABLE IF EXISTS `autorizaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `autorizaciones` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la autorización (AUT-05)',
  `orden_id` int unsigned NOT NULL COMMENT 'Orden sujeta a autorización; FK a ordenes_servicio.id (AUT-01, AUT-04)',
  `tipo` enum('Monto_Alto','Saldo_Pendiente','Reautorizacion') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Motivo de la autorización: monto mayor a $250,000, entrega con saldo o reautorización por aumento (AUT-01, AUT-04, AUT-07)',
  `monto_orden` decimal(12,2) NOT NULL COMMENT 'Total de la orden al momento de solicitar la autorización, para dejar constancia del monto (AUT-05)',
  `aprobado` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Resultado: 0 pendiente o rechazada, 1 autorizada; solo el administrador puede autorizar (AUT-03, AUT-06)',
  `aprobado_por` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Usuario administrador que resolvió la autorización (AUT-03, AUT-05)',
  `fecha_aprobacion` datetime DEFAULT NULL COMMENT 'Fecha y hora de la resolución, con usuario y monto (AUT-05)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la solicitud de autorización (AUT-05, SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado; las autorizaciones no se borran (SEG-06, SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_autorizaciones_orden` (`orden_id`),
  KEY `idx_autorizaciones_tipo` (`tipo`),
  KEY `idx_autorizaciones_estado` (`aprobado`),
  CONSTRAINT `fk_autorizaciones_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_servicio` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Autorizaciones del administrador por monto y por saldo pendiente (AUT-01 a AUT-08)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `autorizaciones`
--

LOCK TABLES `autorizaciones` WRITE;
/*!40000 ALTER TABLE `autorizaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `autorizaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bitacora`
--

DROP TABLE IF EXISTS `bitacora`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitacora` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del asiento de bitácora (SEG-06)',
  `usuario_id` int unsigned NOT NULL COMMENT 'Usuario que ejecutó la acción; FK a usuarios.id (SEG-06, ORD-08)',
  `tabla_afectada` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tabla sobre la que se actuó, por ejemplo ordenes_servicio o facturas (SEG-06)',
  `registro_id` int unsigned NOT NULL COMMENT 'Identificador del registro afectado dentro de esa tabla (SEG-06)',
  `accion` enum('Creacion','Actualizacion','Cancelacion','Autorizacion','Consulta_Confidencial') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de evento auditado: alta, cambio, cancelación, autorización o consulta a expediente confidencial (SEG-06, SEG-20)',
  `detalle` text COLLATE utf8mb4_unicode_ci COMMENT 'Valores o contexto del cambio, en formato legible, para reconstruir qué pasó (SEG-06)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora exacta del evento; la bitácora es inmutable y no se edita (SEG-06, ORD-08)',
  PRIMARY KEY (`id`),
  KEY `idx_bitacora_usuario` (`usuario_id`),
  KEY `idx_bitacora_registro` (`tabla_afectada`,`registro_id`),
  KEY `idx_bitacora_fecha` (`created_at`),
  KEY `idx_bitacora_accion` (`accion`),
  CONSTRAINT `fk_bitacora_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bitácora de auditoría inmutable de altas, cambios, cancelaciones y autorizaciones (SEG-06)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora`
--

LOCK TABLES `bitacora` WRITE;
/*!40000 ALTER TABLE `bitacora` DISABLE KEYS */;
INSERT INTO `bitacora` VALUES (1,1,'usuarios',2,'Actualizacion','Contraseña restablecida para ana.torres@pizarrogarage.mx por el administrador gabriel@pizarrogarage.mx','2026-11-16 21:20:04'),(2,1,'usuarios',2,'Actualizacion','Contraseña restablecida para ana.torres@pizarrogarage.mx por el administrador gabriel@pizarrogarage.mx','2026-11-16 21:20:05'),(6,3,'ordenes_servicio',1,'Actualizacion','Orden 1 avanzada de Recibido a Diagnostico','2026-11-16 21:36:32'),(7,3,'ordenes_servicio',1,'Actualizacion','Orden 1 avanzada de Diagnostico a Reparacion','2026-11-16 21:36:43'),(8,3,'ordenes_servicio',1,'Actualizacion','Orden 1 avanzada de Reparacion a Listo','2026-11-16 21:36:45'),(13,3,'ordenes_servicio',1,'Actualizacion','Orden 1: diagnostico actualizado; nuevo diagnostico: IORPOEIORITWEOJTHOER; 1 servicio(s) de mano de obra, 12 aplicacion(es)','2026-11-22 23:22:56'),(14,3,'ordenes_servicio',1,'Actualizacion','Orden 1: diagnostico actualizado; nuevo diagnostico: paso algo con el motor y los pistones ya no pistean; 2 servicio(s) de mano de obra, 2 aplicacion(es); 1 refaccion(es), 2 pieza(s)','2026-11-23 13:44:03');
/*!40000 ALTER TABLE `bitacora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del cliente (CLI-01)',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del dueño del vehículo; búsqueda indexada <3s (CLI-01, CLI-05)',
  `telefono1` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Teléfono principal de contacto (CLI-01)',
  `telefono2` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Teléfono secundario de contacto (CLI-01)',
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico de contacto (CLI-01)',
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Dirección del cliente (CLI-01)',
  `nombre_asistente` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre del asistente o chofer del cliente (CLI-01)',
  `categoria` enum('Regular','VIP') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Regular' COMMENT 'Categoría del cliente; VIP recibe prioridad en la fila de órdenes (CLI-02, CLI-03, ORD-13)',
  `descuento_mano_obra` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT 'Porcentaje de descuento aplicable solo a mano de obra; VIP = 10.00 (CLI-03, PAG-02)',
  `permite_pagos_parciales` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Autoriza pagos en partes solo a clientes de confianza (PAG-04)',
  `confidencial` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Cliente confidencial: el mecánico solo ve placas y trabajo asignado (SEG-17, SEG-18, SEG-19)',
  `notas` text COLLATE utf8mb4_unicode_ci COMMENT 'Notas internas de atención al cliente',
  `rfc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'RFC del cliente para CFDI 4.0 (FAC-05)',
  `razon_social` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Razón social o nombre fiscal para CFDI 4.0 (FAC-05)',
  `regimen_fiscal` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Régimen fiscal del cliente requerido por CFDI 4.0 (FAC-05)',
  `codigo_postal` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Código postal del domicilio fiscal requerido por CFDI 4.0 (FAC-05)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_clientes_nombre` (`nombre`),
  KEY `idx_clientes_categoria` (`categoria`),
  KEY `idx_clientes_confidencial` (`confidencial`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Clientes del taller, incluidos VIP y confidenciales (CLI-01 a CLI-06)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'Rodrigo Salgado','5551000001','5551000002','rodrigo.salgado@example.com','Bosques de las Lomas 120, CDMX','Jorge (chofer)','VIP',10.00,1,0,'Cliente VIP: prioridad en fila y 10% de descuento en mano de obra.','SALR800101ABC','Rodrigo Salgado','605','11700','2026-11-15 14:28:33','2026-11-15 14:28:33',1),(2,'Mariana Cortés','5551000003',NULL,'mcortes@example.com','Polanco, CDMX',NULL,'Regular',0.00,0,1,'Cliente confidencial: el mecánico solo debe ver placas y trabajo asignado.','CORM850202XYZ','Mariana Cortés','612','11560','2026-11-15 14:28:33','2026-11-15 14:28:33',1),(3,'Emilio Duarte','5551000004',NULL,NULL,'Santa Fe, CDMX',NULL,'Regular',0.00,0,0,NULL,NULL,NULL,NULL,NULL,'2026-11-15 14:28:33','2026-11-15 14:28:33',1),(4,'Alejandra Ríos','5552000001','5552000011','alejandra.rios@example.com','Lomas de Chapultepec 210, CDMX','Paola (asistente)','VIP',10.00,1,0,'Cliente VIP: 10% de descuento en mano de obra y pagos parciales.','RIRA900312ABC','Alejandra Ríos','605','11000','2026-11-16 20:35:24','2026-11-16 20:35:24',1),(5,'Héctor Mendoza','5552000002',NULL,'hector.mendoza@example.com','Del Valle Centro, CDMX',NULL,'Regular',0.00,0,0,NULL,NULL,NULL,NULL,NULL,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(6,'Sofía Vargas','5552000003','5552000013','sofia.vargas@example.com','Interlomas, Estado de México',NULL,'VIP',10.00,1,0,'Cliente VIP recurrente. Prefiere comunicación por correo.','VASS880725XYZ','Sofía Vargas','612','52760','2026-11-16 20:35:24','2026-11-16 20:35:24',1),(7,'Javier Ortega','5552000004',NULL,'javier.ortega@example.com','Coyoacán, CDMX',NULL,'Regular',0.00,0,0,NULL,NULL,NULL,NULL,NULL,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(8,'Valeria Núñez','5552000005',NULL,'valeria.nunez@example.com','Satélite, Estado de México',NULL,'Regular',0.00,0,0,NULL,NULL,NULL,NULL,NULL,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(9,'Jonnatan Martinez Aquino','8721311680',NULL,'jonnatanm20@gmail.com','AV.deportiva sin numero',NULL,'VIP',60.00,1,0,NULL,'CORM850202XYZ','empresario',NULL,'27950','2026-11-16 21:03:04','2026-11-16 21:03:04',1);
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras`
--

DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compras` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la orden de compra (PRV-03)',
  `proveedor_id` int unsigned NOT NULL COMMENT 'Proveedor al que se le compra; FK a proveedores.id (PRV-01, PRV-03)',
  `orden_id` int unsigned DEFAULT NULL COMMENT 'Orden de servicio que motivó la compra; FK pendiente a ordenes_servicio.id (PRV-05)',
  `fecha_pedido` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora en que se registra el pedido (PRV-03)',
  `fecha_estimada_llegada` date DEFAULT NULL COMMENT 'Fecha estimada de llegada para la lista de pedidos pendientes (PRV-03, PRV-04)',
  `estado` enum('Borrador','Aprobada','Enviada','Recibida','Cancelada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Borrador' COMMENT 'Estado del pedido; no se envía sin aprobación del admin (PRV-03, PRV-07)',
  `moneda_original` enum('EUR','GBP','MXN','USD') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Moneda original de la compra (PRV-09)',
  `tipo_cambio` decimal(10,4) DEFAULT NULL COMMENT 'Tipo de cambio del día de la compra para calcular el equivalente en MXN (PRV-09)',
  `total_moneda_original` decimal(12,2) DEFAULT NULL COMMENT 'Total de la compra en su moneda original (PRV-09)',
  `total_mxn` decimal(12,2) DEFAULT NULL COMMENT 'Equivalente en pesos mexicanos al tipo de cambio aplicado (PRV-09, PAG-07)',
  `solicitado_por` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Quién solicitó el pedido; evita piezas sin responsable (PRV-05)',
  `aprobado_por` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Usuario administrador que aprobó la orden de compra (PRV-07, AUT-03)',
  `fecha_aprobacion` datetime DEFAULT NULL COMMENT 'Fecha y hora de la aprobación del administrador (PRV-07, SEG-06)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_compras_proveedor` (`proveedor_id`),
  KEY `idx_compras_estado` (`estado`),
  KEY `idx_compras_fecha_estimada` (`fecha_estimada_llegada`),
  KEY `idx_compras_orden` (`orden_id`),
  CONSTRAINT `fk_compras_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_servicio` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_compras_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Órdenes de compra a proveedores internacionales (PRV-03 a PRV-09)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
/*!40000 ALTER TABLE `compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_compra`
--

DROP TABLE IF EXISTS `detalle_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_compra` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la línea de compra',
  `compra_id` int unsigned NOT NULL COMMENT 'Orden de compra a la que pertenece la línea; FK a compras.id (PRV-03)',
  `refaccion_id` int unsigned NOT NULL COMMENT 'Refacción o pieza solicitada; FK a refacciones.id (INV-01, INV-04)',
  `cantidad` int NOT NULL COMMENT 'Cantidad de piezas pedidas en esta línea (PRV-03)',
  `precio_unitario_moneda` decimal(12,2) NOT NULL COMMENT 'Precio unitario en la moneda original de la compra (PRV-09)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_detalle_compra_compra` (`compra_id`),
  KEY `idx_detalle_compra_refaccion` (`refaccion_id`),
  CONSTRAINT `fk_detalle_compra_compra` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_compra_refaccion` FOREIGN KEY (`refaccion_id`) REFERENCES `refacciones` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalle de piezas por orden de compra (tabla puente compras-refacciones)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_compra`
--

LOCK TABLES `detalle_compra` WRITE;
/*!40000 ALTER TABLE `detalle_compra` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_orden`
--

DROP TABLE IF EXISTS `detalle_orden`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_orden` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la línea de la orden (ORD-10)',
  `orden_id` int unsigned NOT NULL COMMENT 'Orden de servicio a la que pertenece la línea; FK a ordenes_servicio.id (ORD-10)',
  `servicio_id` int unsigned DEFAULT NULL COMMENT 'Servicio o mano de obra aplicada; FK a servicios.id; excluyente con refaccion_id (ORD-10)',
  `refaccion_id` int unsigned DEFAULT NULL COMMENT 'Refacción o consumible usado; FK a refacciones.id; excluyente con servicio_id (ORD-10, INV-02)',
  `cantidad` int NOT NULL COMMENT 'Cantidad de servicios o piezas de la línea (ORD-10)',
  `precio_unitario` decimal(12,2) NOT NULL COMMENT 'Precio unitario al momento de la venta, para conservar historial (ORD-10, PAG-01)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_detalle_orden_orden` (`orden_id`),
  KEY `idx_detalle_orden_servicio` (`servicio_id`),
  KEY `idx_detalle_orden_refaccion` (`refaccion_id`),
  CONSTRAINT `fk_detalle_orden_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_servicio` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_orden_refaccion` FOREIGN KEY (`refaccion_id`) REFERENCES `refacciones` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_orden_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalle de piezas y mano de obra por orden (ORD-10, INV-02)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_orden`
--

LOCK TABLES `detalle_orden` WRITE;
/*!40000 ALTER TABLE `detalle_orden` DISABLE KEYS */;
INSERT INTO `detalle_orden` VALUES (1,3,3,NULL,1,650.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(2,4,1,NULL,1,1080.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(3,4,2,NULL,1,765.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(4,4,3,NULL,1,585.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(5,5,1,NULL,1,1200.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(6,5,2,NULL,1,850.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(7,6,1,NULL,1,1200.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(8,6,3,NULL,1,650.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(52,1,2,NULL,12,850.00,'2026-11-22 23:22:56','2026-11-22 23:22:56',1),(53,1,2,NULL,1,850.00,'2026-11-23 13:44:03','2026-11-23 13:44:03',1),(54,1,3,NULL,1,650.00,'2026-11-23 13:44:03','2026-11-23 13:44:03',1),(55,1,NULL,1,2,1350.00,'2026-11-23 13:44:03','2026-11-23 13:44:03',1);
/*!40000 ALTER TABLE `detalle_orden` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la factura (FAC-01)',
  `orden_id` int unsigned NOT NULL COMMENT 'Orden que se factura; FK a ordenes_servicio.id (FAC-01, FAC-03)',
  `numero_factura` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Folio fiscal de la factura; se llena al timbrar con el PAC (FAC-03, FAC-05)',
  `subtotal` decimal(12,2) NOT NULL COMMENT 'Subtotal de la factura: piezas más mano de obra (FAC-03, PAG-01)',
  `iva` decimal(12,2) NOT NULL COMMENT 'IVA del 16% trasladado en la factura (FAC-03, PAG-01)',
  `total` decimal(12,2) NOT NULL COMMENT 'Total facturado al cliente (FAC-03, PAG-01)',
  `estado` enum('Borrador','Timbrada','Cancelada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Borrador' COMMENT 'Estado de la factura; una emitida no se edita y su cancelación requiere motivo (FAC-02, FAC-04)',
  `uuid_cfdi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'UUID del CFDI 4.0 devuelto por el PAC al timbrar (FAC-05, FAC-06)',
  `uso_cfdi` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Uso del CFDI declarado por el cliente, catálogo SAT (FAC-05)',
  `forma_pago` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Forma de pago SAT, por ejemplo 01 efectivo o 03 transferencia (FAC-05)',
  `metodo_pago` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Método de pago SAT: PUE o PPD (FAC-05)',
  `motivo_cancelacion` text COLLATE utf8mb4_unicode_ci COMMENT 'Motivo obligatorio al cancelar una factura emitida (FAC-04)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de emisión de la factura (FAC-03, SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado; una factura no se borra (FAC-04, SEG-07)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_facturas_numero` (`numero_factura`),
  UNIQUE KEY `uq_facturas_uuid` (`uuid_cfdi`),
  KEY `idx_facturas_orden` (`orden_id`),
  KEY `idx_facturas_estado` (`estado`),
  CONSTRAINT `fk_facturas_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_servicio` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Facturas CFDI 4.0 listas para timbrar por orden (FAC-01 a FAC-05)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fotos_vehiculo`
--

DROP TABLE IF EXISTS `fotos_vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fotos_vehiculo` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la foto (VEH-03)',
  `orden_id` int unsigned NOT NULL COMMENT 'Orden a la que pertenece la foto; FK a ordenes_servicio.id (VEH-03)',
  `url_foto` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ruta o URL del archivo; la imagen no se guarda en la BD (VEH-03, VEH-08)',
  `etapa` enum('Ingreso','Proceso','Entrega') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Clasificación de la foto: ingreso, proceso o entrega (VEH-03)',
  `firma_conformidad` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si la foto de entrega quedó firmada por el cliente (VEH-03)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora automáticas de la toma o carga de la foto (VEH-03, SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_fotos_orden` (`orden_id`),
  KEY `idx_fotos_etapa` (`etapa`),
  CONSTRAINT `fk_fotos_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_servicio` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Fotos del estado del vehículo por orden, almacenadas fuera de la BD (VEH-03, VEH-08)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fotos_vehiculo`
--

LOCK TABLES `fotos_vehiculo` WRITE;
/*!40000 ALTER TABLE `fotos_vehiculo` DISABLE KEYS */;
/*!40000 ALTER TABLE `fotos_vehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_etapas`
--

DROP TABLE IF EXISTS `historial_etapas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_etapas` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del cambio de etapa (ORD-06)',
  `orden_id` int unsigned NOT NULL COMMENT 'Orden que cambió de etapa; FK a ordenes_servicio.id (ORD-06)',
  `etapa_anterior` enum('Recibido','Diagnostico','Reparacion','Listo','Entregado','Cancelado') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Etapa previa; NULL cuando es la apertura de la orden (ORD-02, ORD-06)',
  `etapa_nueva` enum('Recibido','Diagnostico','Reparacion','Listo','Entregado','Cancelado') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Etapa a la que pasa la orden (ORD-02, ORD-04, ORD-05)',
  `usuario_id` int unsigned NOT NULL COMMENT 'Usuario que movió la etapa; permite validar que solo el admin retroceda (ORD-04, ORD-05, SEG-06)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del cambio de etapa; base de la alerta de más de 5 días sin movimiento (ORD-06)',
  PRIMARY KEY (`id`),
  KEY `idx_historial_orden` (`orden_id`),
  KEY `idx_historial_fecha` (`created_at`),
  KEY `idx_historial_usuario` (`usuario_id`),
  CONSTRAINT `fk_historial_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_servicio` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_historial_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial inmutable de cambios de etapa por orden (ORD-06)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_etapas`
--

LOCK TABLES `historial_etapas` WRITE;
/*!40000 ALTER TABLE `historial_etapas` DISABLE KEYS */;
INSERT INTO `historial_etapas` VALUES (1,1,NULL,'Recibido',1,'2026-11-16 20:35:24'),(2,2,NULL,'Recibido',1,'2026-11-16 20:35:24'),(3,3,NULL,'Recibido',1,'2026-11-16 20:35:24'),(4,3,'Recibido','Diagnostico',1,'2026-11-16 20:35:24'),(5,4,NULL,'Recibido',1,'2026-11-16 20:35:24'),(6,4,'Recibido','Diagnostico',1,'2026-11-16 20:35:24'),(7,4,'Diagnostico','Reparacion',1,'2026-11-16 20:35:24'),(8,5,NULL,'Recibido',1,'2026-11-16 20:35:24'),(9,5,'Recibido','Diagnostico',1,'2026-11-16 20:35:24'),(10,5,'Diagnostico','Reparacion',1,'2026-11-16 20:35:24'),(11,5,'Reparacion','Listo',1,'2026-11-16 20:35:24'),(12,6,NULL,'Recibido',1,'2026-11-16 20:35:24'),(13,6,'Recibido','Diagnostico',1,'2026-11-16 20:35:24'),(14,6,'Diagnostico','Reparacion',1,'2026-11-16 20:35:24'),(15,6,'Reparacion','Listo',1,'2026-11-16 20:35:24'),(16,6,'Listo','Entregado',1,'2026-11-16 20:35:24'),(20,1,'Recibido','Diagnostico',3,'2026-11-16 21:36:32'),(21,1,'Diagnostico','Reparacion',3,'2026-11-16 21:36:43'),(22,1,'Reparacion','Listo',3,'2026-11-16 21:36:45');
/*!40000 ALTER TABLE `historial_etapas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mecanicos`
--

DROP TABLE IF EXISTS `mecanicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mecanicos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del mecánico (ORD-09)',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del mecánico; se usa para asignarlo a órdenes y calcular bonos (ORD-09, REP-03)',
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Teléfono de contacto del mecánico (SEG-01)',
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico del mecánico (SEG-01)',
  `especialidad` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Especialidad o área técnica del mecánico (REP-03)',
  `notas` text COLLATE utf8mb4_unicode_ci COMMENT 'Notas internas sobre el mecánico',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_mecanicos_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de mecánicos del taller (ORD-09, REP-03, SEG-01)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mecanicos`
--

LOCK TABLES `mecanicos` WRITE;
/*!40000 ALTER TABLE `mecanicos` DISABLE KEYS */;
INSERT INTO `mecanicos` VALUES (1,'Luis Ramírez','5551234567','luis.ramirez@pizarrogarage.mx','Motor y transmisión','Mecánico de prueba para desarrollo','2026-11-15 14:28:33','2026-11-15 14:28:33',1),(2,'Carlos Medina','5553000002','carlos.medina@pizarrogarage.mx','Suspensión y frenos','Especialista en tren delantero y frenos de alto desempeño.','2026-11-16 20:35:24','2026-11-16 20:35:24',1),(3,'Fernanda López','5553000003','fernanda.lopez@pizarrogarage.mx','Diagnóstico electrónico','Manejo de escáner y calibración de sistemas electrónicos.','2026-11-16 20:35:24','2026-11-16 20:35:24',1);
/*!40000 ALTER TABLE `mecanicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_inventario`
--

DROP TABLE IF EXISTS `movimientos_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_inventario` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del movimiento de inventario (INV-02, INV-05)',
  `refaccion_id` int unsigned NOT NULL COMMENT 'Refacción afectada; FK a refacciones.id (INV-02)',
  `tipo` enum('Entrada','Salida','Ajuste') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de movimiento: entrada por compra, salida por uso en orden o ajuste manual (INV-02, INV-05)',
  `cantidad` int NOT NULL COMMENT 'Unidades del movimiento (siempre positiva; el tipo define el sentido) (INV-02, INV-05)',
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Motivo obligatorio en ajustes manuales (INV-05)',
  `usuario` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Usuario que registró el movimiento, para la bitácora (INV-05, SEG-06)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del movimiento (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_movimientos_refaccion` (`refaccion_id`),
  KEY `idx_movimientos_tipo` (`tipo`),
  KEY `idx_movimientos_fecha` (`created_at`),
  CONSTRAINT `fk_movimientos_refaccion` FOREIGN KEY (`refaccion_id`) REFERENCES `refacciones` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Trazabilidad de entradas, salidas y ajustes de inventario (INV-02, INV-05)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
INSERT INTO `movimientos_inventario` VALUES (52,1,'Salida',2,'Refaccion usada en la orden 1','Luis Ram?rez','2026-11-23 13:44:03','2026-11-23 13:44:03',1);
/*!40000 ALTER TABLE `movimientos_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_mecanicos`
--

DROP TABLE IF EXISTS `orden_mecanicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_mecanicos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la asignación (ORD-09)',
  `orden_id` int unsigned NOT NULL COMMENT 'Orden de servicio; FK a ordenes_servicio.id (ORD-09)',
  `mecanico_id` int unsigned NOT NULL COMMENT 'Mecánico asignado a la orden; FK a mecanicos.id (ORD-09)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la asignación (ORD-09, SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 asignación vigente, 0 desasignada (SEG-07)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orden_mecanicos` (`orden_id`,`mecanico_id`),
  KEY `idx_orden_mecanicos_mecanico` (`mecanico_id`),
  CONSTRAINT `fk_orden_mecanicos_mecanico` FOREIGN KEY (`mecanico_id`) REFERENCES `mecanicos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orden_mecanicos_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_servicio` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Asignación de uno o más mecánicos por orden (ORD-09)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_mecanicos`
--

LOCK TABLES `orden_mecanicos` WRITE;
/*!40000 ALTER TABLE `orden_mecanicos` DISABLE KEYS */;
INSERT INTO `orden_mecanicos` VALUES (1,1,1,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(2,2,2,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(3,3,3,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(4,4,2,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(5,5,3,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(6,6,1,'2026-11-16 20:35:24','2026-11-16 20:35:24',1);
/*!40000 ALTER TABLE `orden_mecanicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordenes_servicio`
--

DROP TABLE IF EXISTS `ordenes_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordenes_servicio` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la orden de servicio (ORD-01)',
  `cliente_id` int unsigned NOT NULL COMMENT 'Dueño del vehículo; FK a clientes.id (ORD-01, CLI-06)',
  `vehiculo_id` int unsigned NOT NULL COMMENT 'Vehículo que ingresa al taller; FK a vehiculos.id (ORD-01, VEH-02)',
  `mecanico_id` int unsigned DEFAULT NULL COMMENT 'Mecánico responsable de la orden; FK a mecanicos.id (ORD-09)',
  `estado` enum('Recibido','Diagnostico','Reparacion','Listo','Entregado','Cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Recibido' COMMENT 'Etapa de la orden: recibido, diagnóstico, reparación, listo, entregado o cancelado (ORD-02, ORD-04, ORD-05, ORD-11)',
  `falla_reportada` text COLLATE utf8mb4_unicode_ci COMMENT 'Falla o motivo de ingreso reportado por el cliente (ORD-01)',
  `diagnostico` text COLLATE utf8mb4_unicode_ci,
  `total_piezas` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Suma de refacciones usadas en la orden (PAG-01)',
  `total_mano_obra` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Suma de mano de obra ya con descuento VIP aplicado (PAG-01, PAG-02)',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Piezas más mano de obra, antes de IVA (PAG-01)',
  `iva` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'IVA del 16% sobre el subtotal (PAG-01)',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Total a cobrar; base para el umbral de autorización de $250,000 MXN (PAG-01, AUT-01)',
  `requiere_autorizacion` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica que la orden supera el umbral y requiere autorización vigente del admin (AUT-01, AUT-02, AUT-07)',
  `motivo_cancelacion` text COLLATE utf8mb4_unicode_ci COMMENT 'Motivo obligatorio al cancelar la orden, con registro del usuario (ORD-11)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de apertura de la orden (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora del último cambio; las etapas no cambian solas (ORD-06, SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado; nada se borra físicamente (ORD-11, SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_ordenes_cliente` (`cliente_id`),
  KEY `idx_ordenes_vehiculo` (`vehiculo_id`),
  KEY `idx_ordenes_mecanico` (`mecanico_id`),
  KEY `idx_ordenes_estado` (`estado`),
  KEY `idx_ordenes_fecha` (`created_at`),
  KEY `idx_ordenes_requiere_autorizacion` (`requiere_autorizacion`),
  CONSTRAINT `fk_ordenes_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ordenes_mecanico` FOREIGN KEY (`mecanico_id`) REFERENCES `mecanicos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ordenes_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Órdenes de servicio con sus cuatro etapas y totales (ORD-01 a ORD-13)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes_servicio`
--

LOCK TABLES `ordenes_servicio` WRITE;
/*!40000 ALTER TABLE `ordenes_servicio` DISABLE KEYS */;
INSERT INTO `ordenes_servicio` VALUES (1,1,1,1,'Listo','Ruido metálico en la parte trasera al pasar baches; revisar suspensión.','paso algo con el motor y los pistones ya no pistean',2700.00,10530.00,13230.00,2116.80,15346.80,0,NULL,'2026-11-15 14:28:33','2026-11-23 13:44:03',1),(2,4,4,2,'Recibido','Ruido metálico en la suspensión delantera al pasar topes.',NULL,0.00,0.00,0.00,0.00,0.00,0,NULL,'2026-11-15 20:35:24','2026-11-15 20:35:24',1),(3,5,5,3,'Diagnostico','Testigo de motor encendido y consumo elevado de combustible.',NULL,0.00,650.00,650.00,104.00,754.00,0,NULL,'2026-11-13 20:35:24','2026-11-14 20:35:24',1),(4,6,6,2,'Reparacion','Vibración en el volante y desgaste irregular de las llantas.',NULL,0.00,2187.00,2187.00,349.92,2536.92,0,NULL,'2026-11-11 20:35:24','2026-11-22 12:06:24',1),(5,7,7,3,'Listo','Mantenimiento programado de 40,000 km y revisión general.',NULL,0.00,2050.00,2050.00,328.00,2378.00,0,NULL,'2026-11-09 20:35:24','2026-11-16 20:35:24',1),(6,8,8,1,'Entregado','Mantenimiento preventivo y diagnóstico general.',NULL,0.00,1850.00,1850.00,296.00,2146.00,0,NULL,'2026-11-06 20:35:24','2026-11-14 20:35:24',1);
/*!40000 ALTER TABLE `ordenes_servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del pago (PAG-03)',
  `orden_id` int unsigned NOT NULL COMMENT 'Orden de servicio que se está pagando; FK a ordenes_servicio.id (PAG-03, PAG-05)',
  `tipo` enum('Anticipo','Parcialidad','Liquidacion') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Naturaleza del pago: anticipo del 50%, parcialidad o liquidación final (PAG-03, PAG-04)',
  `monto` decimal(12,2) NOT NULL COMMENT 'Monto entregado en pesos mexicanos; siempre se cobra en MXN (PAG-03, PAG-07)',
  `metodo_pago` enum('Efectivo','Transferencia','Tarjeta') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Transferencia' COMMENT 'Forma de pago utilizada por el cliente (PAG-03)',
  `referencia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Referencia o folio de la operación, típicamente número de transferencia (PAG-03)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora en que se registró el pago; base del historial del cliente (PAG-05, CLI-06, SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_pagos_orden` (`orden_id`),
  KEY `idx_pagos_tipo` (`tipo`),
  KEY `idx_pagos_fecha` (`created_at`),
  CONSTRAINT `fk_pagos_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_servicio` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Anticipos, parcialidades y liquidaciones por orden (PAG-03 a PAG-05, PAG-07)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parametros`
--

DROP TABLE IF EXISTS `parametros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parametros` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del parámetro (AUT-08, PAG-06)',
  `clave` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Clave única del parámetro, por ejemplo tolerancia_reautorizacion o umbral_piezas_caras (AUT-08, PAG-06)',
  `valor` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Valor vigente del parámetro, guardado como texto y convertido por la aplicación (AUT-08, PAG-06)',
  `descripcion` text COLLATE utf8mb4_unicode_ci COMMENT 'Explicación del parámetro y su efecto en el negocio (AUT-08, PAG-06)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del parámetro (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora del último cambio de valor (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_parametros_clave` (`clave`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Parámetros configurables de tolerancia y umbrales (AUT-08, PAG-06)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parametros`
--

LOCK TABLES `parametros` WRITE;
/*!40000 ALTER TABLE `parametros` DISABLE KEYS */;
INSERT INTO `parametros` VALUES (1,'tolerancia_reautorizacion','5','Porcentaje de aumento permitido antes de pedir reautorización (AUT-08). Se elige 5% porque el ejemplo del cliente (300k a 320k = +6.7%) lo requiere.','2026-11-15 14:28:22','2026-11-15 14:28:22',1),(2,'umbral_piezas_caras','25000','Monto en MXN a partir del cual se exige 50% de anticipo (PAG-06). Promedio de la propuesta del cliente ($20k-$30k).','2026-11-15 14:28:22','2026-11-15 14:28:22',1);
/*!40000 ALTER TABLE `parametros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `polizas_seguro`
--

DROP TABLE IF EXISTS `polizas_seguro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `polizas_seguro` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la póliza (VEH-04)',
  `vehiculo_id` int unsigned NOT NULL COMMENT 'Vehículo asegurado; FK a vehiculos.id (VEH-04)',
  `aseguradora` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre de la aseguradora (VEH-04)',
  `numero_poliza` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Número de póliza de seguro (VEH-04)',
  `vigencia_inicio` date NOT NULL COMMENT 'Fecha de inicio de vigencia de la póliza (VEH-04)',
  `vigencia_fin` date NOT NULL COMMENT 'Fecha de fin de vigencia; alerta 30 días antes (VEH-04, VEH-05)',
  `cobertura` text COLLATE utf8mb4_unicode_ci COMMENT 'Detalle de la cobertura contratada (VEH-04)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_polizas_vehiculo` (`vehiculo_id`),
  KEY `idx_polizas_vigencia_fin` (`vigencia_fin`),
  CONSTRAINT `fk_polizas_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pólizas de seguro de los vehículos (VEH-04, VEH-05)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `polizas_seguro`
--

LOCK TABLES `polizas_seguro` WRITE;
/*!40000 ALTER TABLE `polizas_seguro` DISABLE KEYS */;
/*!40000 ALTER TABLE `polizas_seguro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del proveedor (PRV-01)',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Razón social o nombre del proveedor internacional (PRV-01)',
  `pais` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'País del proveedor: Italia, Alemania, Inglaterra, etc. (PRV-01)',
  `contacto` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre de la persona de contacto (PRV-01)',
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Teléfono de contacto del proveedor (PRV-01)',
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico de contacto del proveedor (PRV-01)',
  `tiempo_entrega_dias` int unsigned DEFAULT NULL COMMENT 'Tiempo de entrega típico en días (de 14 a 56, equivalente a 2-8 semanas) (PRV-02)',
  `moneda` enum('EUR','GBP','MXN','USD') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MXN' COMMENT 'Moneda en la que cotiza el proveedor (PRV-09)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_proveedores_nombre` (`nombre`),
  KEY `idx_proveedores_pais` (`pais`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Proveedores internacionales de refacciones (PRV-01, PRV-02, PRV-09)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
INSERT INTO `proveedores` VALUES (1,'Ricambi Milano S.r.l.','Italia','Marco Bellini','+39 02 1234 5678','info@ricambimilano.it',42,'EUR','2026-11-15 14:28:33','2026-11-15 14:28:33',1),(2,'SAFE Refacciones','México',NULL,NULL,NULL,3,'MXN','2026-11-21 15:23:20','2026-11-21 15:23:20',1),(3,'Refacciones Originales OEM','México',NULL,NULL,NULL,5,'MXN','2026-11-21 15:23:20','2026-11-21 15:23:20',1),(4,'Embler Autopartes','México',NULL,NULL,NULL,4,'MXN','2026-11-21 15:23:20','2026-11-21 15:23:20',1),(5,'Premium Parts S.A. de C.V.','México',NULL,NULL,NULL,2,'MXN','2026-11-21 15:23:20','2026-11-21 15:23:20',1);
/*!40000 ALTER TABLE `proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refacciones`
--

DROP TABLE IF EXISTS `refacciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refacciones` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno de la refacción o consumible (INV-01)',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre o descripción de la pieza de tornillería o consumible (INV-01)',
  `marca` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Marca de la pieza, usada para distinguir piezas especiales (INV-04)',
  `es_especial` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Pieza especial por marca: se compra ligada a una orden, sin existencias en inventario (INV-04)',
  `stock_actual` int NOT NULL DEFAULT '0' COMMENT 'Existencias actuales en inventario; índice de alerta (INV-01, INV-03)',
  `stock_minimo` int NOT NULL DEFAULT '2' COMMENT 'Umbral mínimo: alertar con 2 o menos unidades (INV-03)',
  `precio_costo` decimal(12,2) NOT NULL COMMENT 'Costo de adquisición de la refacción (INV-01, SEG-02)',
  `precio_venta` decimal(12,2) NOT NULL COMMENT 'Precio de venta al cliente (INV-01, SEG-02)',
  `proveedor_id` int unsigned DEFAULT NULL COMMENT 'Proveedor habitual de la pieza; FK a proveedores.id (PRV-01)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación; también refleja ajustes de inventario (INV-05, SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_refacciones_proveedor` (`proveedor_id`),
  KEY `idx_refacciones_nombre` (`nombre`),
  KEY `idx_refacciones_stock` (`stock_actual`,`stock_minimo`),
  KEY `idx_refacciones_especial` (`es_especial`),
  CONSTRAINT `fk_refacciones_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de refacciones y consumibles con existencias (INV-01 a INV-05)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refacciones`
--

LOCK TABLES `refacciones` WRITE;
/*!40000 ALTER TABLE `refacciones` DISABLE KEYS */;
INSERT INTO `refacciones` VALUES (1,'Kit de tornillería M12 inoxidable','Bosch',0,38,5,850.00,1350.00,1,'2026-11-15 14:28:33','2026-11-23 13:44:03',1),(2,'Turbo original Porsche 911 (991.2)','Porsche',1,0,0,185000.00,240000.00,1,'2026-11-15 14:28:33','2026-11-15 14:28:33',1);
/*!40000 ALTER TABLE `refacciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicios`
--

DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del servicio de mano de obra (ORD-10)',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del servicio de mano de obra (ORD-10)',
  `descripcion` text COLLATE utf8mb4_unicode_ci COMMENT 'Descripción del servicio realizado (ORD-10)',
  `precio_mano_obra` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Precio base de mano de obra antes de descuento VIP e IVA (ORD-10, PAG-01, PAG-02)',
  `duracion_estimada_horas` decimal(4,1) DEFAULT NULL COMMENT 'Duración estimada del servicio en horas, para planear la carga de trabajo (REP-03)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_servicios_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de servicios y mano de obra (ORD-10)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicios`
--

LOCK TABLES `servicios` WRITE;
/*!40000 ALTER TABLE `servicios` DISABLE KEYS */;
INSERT INTO `servicios` VALUES (1,'Cambio de aceite','Cambio de aceite y filtro con revisión de niveles.',1200.00,1.0,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(2,'Alineación','Alineación y balanceo de las cuatro ruedas.',850.00,1.5,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(3,'Diagnóstico computarizado','Lectura de códigos y diagnóstico con escáner.',650.00,1.0,'2026-11-16 20:35:24','2026-11-16 20:35:24',1);
/*!40000 ALTER TABLE `servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del usuario del sistema (SEG-01)',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre completo del usuario: administrador, recepción o mecánico (SEG-01)',
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Correo de acceso; identificador único de autenticación (SEG-01)',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contraseña cifrada con hash; nunca en texto plano (SEG-01, SEG-15)',
  `rol` enum('Administrador','Recepcion','Mecanico') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Rol que define permisos: acceso total, sin finanzas o solo placas y trabajo (SEG-01, SEG-02, SEG-03, SEG-04, SEG-18)',
  `mecanico_id` int unsigned DEFAULT NULL COMMENT 'Vínculo opcional al catálogo de mecánicos cuando el usuario lo es; FK a mecanicos.id (SEG-01, ORD-09, REP-03)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del usuario (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 dado de baja; el usuario no se elimina (SEG-07)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_correo` (`correo`),
  KEY `idx_usuarios_rol` (`rol`),
  KEY `idx_usuarios_mecanico` (`mecanico_id`),
  CONSTRAINT `fk_usuarios_mecanico` FOREIGN KEY (`mecanico_id`) REFERENCES `mecanicos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuarios del sistema con roles Administrador, Recepcion y Mecanico (SEG-01 a SEG-04)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Gabriel Pizarro','gabriel@pizarrogarage.mx','scrypt$16384$8$1$UrWsd84OHxeitBwvDbsHxQ==$+0OzMc0AVsHCxce4LgxAktswkNjKb+Y1NdqJ+Vcu+fOVUW1yJ9TN5MCfyPUEUkHYu+HqVNaEWfxv11azfQyWnw==','Administrador',NULL,'2026-11-15 14:28:33','2026-11-15 18:35:21',1),(2,'Ana Torres','ana.torres@pizarrogarage.mx','scrypt$16384$8$1$oHvH4zboNqcDil31hHY2yQ==$XtvE/GUF3hR/vfdm/IftEUBnPGfmlnYQzwYaqtie6HW5U/U+nluMwQy0QqX2PobWlHe1Qu7T1ba0IuXnQpzt1A==','Recepcion',NULL,'2026-11-15 14:28:33','2026-11-16 21:20:05',1),(3,'Luis Ram?rez','luis.ramirez@pizarrogarage.mx','scrypt$16384$8$1$8ZCr8Ier201LUWh/4FPhpQ==$ub6BDMG96VMTIWIkGM/z1yqw/QWlhc/WchtYlzB7NrtDtJj9pxGLsP4bNzjn51J0iZ+hY3+B28SgaYxijYU5IA==','Mecanico',1,'2026-11-15 18:36:01','2026-11-15 18:36:01',1);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculos`
--

DROP TABLE IF EXISTS `vehiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del vehículo (VEH-01)',
  `cliente_id` int unsigned NOT NULL COMMENT 'Dueño del vehículo; FK a clientes.id (VEH-02)',
  `placas` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Placas del vehículo; índice para búsqueda en menos de 3 segundos (VEH-01, VEH-06)',
  `vin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Número de serie / VIN del vehículo (VEH-01)',
  `marca` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Marca del vehículo (VEH-01)',
  `modelo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Modelo del vehículo (VEH-01)',
  `anio` int NOT NULL COMMENT 'Año modelo del vehículo (VEH-01)',
  `color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Color del vehículo (VEH-01)',
  `kilometraje_entrada` int unsigned DEFAULT NULL COMMENT 'Kilometraje registrado al ingreso al taller (VEH-01)',
  `valor_aproximado` decimal(12,2) DEFAULT NULL COMMENT 'Valor aproximado del auto para calcular el valor en custodia (VEH-07)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de alta del registro (auditoría SEG-06)',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la última modificación (auditoría SEG-06)',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Borrado lógico: 1 vigente, 0 eliminado (SEG-07)',
  PRIMARY KEY (`id`),
  KEY `idx_vehiculos_cliente` (`cliente_id`),
  KEY `idx_vehiculos_placas` (`placas`),
  KEY `idx_vehiculos_vin` (`vin`),
  CONSTRAINT `fk_vehiculos_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Vehículos registrados de clientes (VEH-01 a VEH-08)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculos`
--

LOCK TABLES `vehiculos` WRITE;
/*!40000 ALTER TABLE `vehiculos` DISABLE KEYS */;
INSERT INTO `vehiculos` VALUES (1,1,'PPG-001-A','WP0AB2A99JS123456','Porsche','911 Carrera S',2021,'Plata',12500,2450000.00,'2026-11-15 14:28:33','2026-11-15 14:28:33',1),(2,2,'PPG-002-B','WDDZF4JB0HA123456','Mercedes-Benz','E 300',2019,'Negro',48000,950000.00,'2026-11-15 14:28:33','2026-11-15 14:28:33',1),(3,3,'PPG-003-C',NULL,'BMW','M4 Competition',2023,'Azul',3200,2150000.00,'2026-11-15 14:28:33','2026-11-15 14:28:33',1),(4,4,'PPG-004-D','WA1BNAFY1J2123456','Audi','Q5',2022,'Blanco',18500,980000.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(5,5,'PPG-005-E','WVWZZZAUZLW123456','Volkswagen','Golf GTI',2020,'Rojo',41200,520000.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(6,6,'PPG-006-F','2T2BZMCA7JC123456','Lexus','RX 350',2021,'Gris',26700,1150000.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(7,7,'PPG-007-G','1FA6P8CFXJ5123456','Ford','Mustang GT',2018,'Negro',58300,760000.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(8,8,'PPG-008-H','JTDB4MEE5PJ123456','Toyota','Corolla',2023,'Azul',9400,420000.00,'2026-11-16 20:35:24','2026-11-16 20:35:24',1),(10,9,'21342342','878787837847389748370','FERRARI','Purosangue V12',2026,'Rosso Corsa',4250,11500000.00,'2026-11-16 21:25:01','2026-11-16 21:25:01',1);
/*!40000 ALTER TABLE `vehiculos` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-23 21:16:38
