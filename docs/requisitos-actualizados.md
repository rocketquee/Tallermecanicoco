Clientes
ID	Tipo	Descripción	Actor	Prioridad	Cambio
CLI-03	F	(Modifica) Beneficios VIP: prioridad en la fila, descuento de 10% en mano de obra (automático) y servicios de auto de cortesía y recogida a domicilio (ver CLI-07 y CLI-08).	Sistema, Admin	Media	P7
CLI-07	F	(Nuevo) Módulo de préstamo de auto de cortesía: el auto se registra como activo del taller y cada préstamo guarda a quién se prestó, fecha y hora, kilometraje de salida y de regreso, y una revisión de rayones.	Admin, Recepción	Media	P7
CLI-08	F	(Nuevo) Campo de notas en la orden con la dirección y los datos de recogida a domicilio para el chofer.	Recepción	Media	P7
Vehículos
ID	Tipo	Descripción	Actor	Prioridad	Cambio
VEH-03	F	(Modifica) Guardar hasta 30 fotos por auto, de máximo 10 MB cada una, clasificadas en ingreso, proceso y entrega. Cada foto lleva fecha y hora automáticas. Las de entrega deben quedar firmadas.	Reepción, Mecánico	Alta	P6
VEH-08	NF	(Nuevo) Almacenar las fotos en un servidor de archivos aparte, no en la base de datos. Peor caso estimado: unos 300 MB por auto y hasta cerca de 2.4 GB por semana.	Sistema	Media	P6
Órdenes y Autorizaciones
ID	Tipo	Descripción	Actor	Prioridad	Cambio
AUT-01	F	(Modifica) Exigir autorización del administrador cuando el total de la orden con IVA supere $250,000 MXN. No aplica por pieza suelta.	Sistema	Alta	P2
AUT-07	F	(Nuevo) Si el total de una orden ya autorizada sube más allá de la tolerancia, congelar compras y trabajo hasta una nueva autorización del administrador.	Sistema, Admin	Alta	P2
AUT-08	F	(Nuevo) Parámetro configurable de tolerancia (5% o 10%) para exigir reautorización.	Admin	Media	P2
Pagos
ID	Tipo	Descripción	Actor	Prioridad	Cambio
PAG-03	F	(Modifica) El anticipo de 50% es obligatorio cuando el subtotal de piezas supere un umbral configurable (propuesta: $20,000 a $30,000 MXN).	Sistema	Alta	P3
PAG-06	F	(Nuevo) Parámetro configurable del umbral de “piezas caras”.	Admin	Alta	P3
PAG-07	F	(Nuevo) Cobrar siempre al cliente en pesos mexicanos.	Sistema	Alta	P5
Proveedores y compras
ID	Tipo	Descripción	Actor	Prioridad	Cambio
PRV-07	F	(Modifica) Bloquear el envío de la orden de compra sin aprobación del administrador y sin el anticipo del 50% registrado, cuando aplique.	Sistema, Admin	Alta	P3
PRV-09	F	(Nuevo) Registrar cada compra con moneda original (EUR o GBP), costo en esa moneda, tipo de cambio del día de la compra y equivalente en pesos.	Admin	Alta	P5
PRV-10	F	(Nuevo) Ocultar a mecánicos y recepción los costos de compra y los tipos de cambio.	Sistema	Alta	P5
Facturación
ID	Tipo	Descripción	Actor	Prioridad	Cambio
FAC-03	F	(Modifica) La factura incluye logotipo, datos fiscales, número de orden y desglose de piezas, mano de obra e IVA, en formato CFDI 4.0.	Sistema	Alta	P1
FAC-05	F	(Nuevo) Generar el paquete completo de datos para timbrar el CFDI 4.0: régimen fiscal, uso de CFDI, código postal y demás datos obligatorios. En esta fase, el contador o el taller lo manda a timbrar con un PAC.	Sistema	Alta	P1
FAC-06	F	(Nuevo) Integración directa con un PAC para timbrar desde el sistema.	Sistema	Baja	P1

FAC-06 queda como fase futura, a definir con el contador.

Reportes
ID	Tipo	Descripción	Actor	Prioridad	Cambio
REP-07	F	(Nuevo, inferido) Margen por orden: costo real en pesos (con tipo de cambio) contra precio cobrado.	Admin	Baja	P5
Seguridad
ID	Tipo	Descripción	Actor	Prioridad	Cambio
SEG-05	NF	(Modifica) Permisos por rol y por cliente, no solo por rol.	Sistema	Alta	P4
SEG-17	F	(Nuevo) Marcar clientes como confidenciales (ver duda 1 abajo).	Admin	Alta	P4
SEG-18	F	(Nuevo) En órdenes de clientes confidenciales, el mecánico ve solo placas y el trabajo asignado, sin nombre del dueño.	Sistema	Alta	P4
SEG-19	NF	(Nuevo) Aplicar esa restricción a nivel de base de datos (seguridad por fila), no solo en la interfaz.	Sistema	Alta	P4
SEG-20	NF	(Nuevo, inferido) Registrar quién consultó expedientes confidenciales y cuándo.	Sistema	Media	P4
Efectos sobre requisitos existentes
Primer día (P33): “facturar” ahora significa generar la factura con los datos CFDI listos para timbrar. El timbrado queda fuera, salvo que decidan integrar el PAC desde el inicio.
Búsqueda (CLI-05, VEH-06) y pantalla de órdenes (ORD-03): deben respetar SEG-18. Un mecánico no puede buscar por nombre de dueño en clientes confidenciales.
Contradicción que conviene aclarar

El cliente sugiere una tolerancia de 5% a 10%, pero su ejemplo ($300,000 a $320,000) es un aumento de 6.7%. Con 5% se congelaría, como él espera, pero con 10% no. Hay que fijar el valor con él, y con 5% o menos su ejemplo se cumple.