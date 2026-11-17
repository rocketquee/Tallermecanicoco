Requisitos de AutoPulse Elite

Prioridad: Alta = necesario desde el primer día o crítico para el negocio (P33). Media = primer mes, o necesario pero no bloquea el arranque. Baja = deseable.
Tipo: F = funcional, NF = no funcional.
Origen: número de pregunta de la entrevista. “inf.” marca requisitos que deduje y conviene confirmar.

1. Clientes
ID	Tipo	Descripción	Actor	Prioridad	Origen
CLI-01	F	Registrar cliente con nombre, dos teléfonos, correo, dirección y nombre de su asistente o chofer.	Recepción, Admin	Alta	P8
CLI-02	F	Marcar y desmarcar a un cliente como VIP (hoy unos 15).	Admin	Media	P9
CLI-03	F	Aplicar beneficios VIP: prioridad en la fila de órdenes, registro de auto de cortesía y de recogida a domicilio, y 10% de descuento en mano de obra.	Sistema, Admin	Media	P9
CLI-04	F	Asignar al administrador como responsable de atención de los clientes VIP.	Admin	Baja	P9
CLI-05	F	Buscar clientes por nombre del dueño en menos de 3 segundos.	Todos	Alta	P29, P30
CLI-06	F	Ver el historial de órdenes, pagos y saldo de cada cliente.	Admin	Media	P18 (inf.)
2. Vehículos
ID	Tipo	Descripción	Actor	Prioridad	Origen
VEH-01	F	Registrar vehículo con placas, número de serie, marca, modelo, año, color, kilometraje de entrada y valor aproximado.	Recepción	Alta	P2, P10
VEH-02	F	Asociar cada vehículo a su dueño.	Recepción	Alta	P2 (inf.)
VEH-03	F	Guardar fotos del estado en que llegó el auto, ligadas a la orden.	Recepción	Media	P10
VEH-04	F	Registrar la póliza de seguro: aseguradora, número, vigencia y cobertura.	Recepción, Admin	Media	P11
VEH-05	F	Avisar al administrador 30 días antes del vencimiento de una póliza.	Sistema	Media	P11
VEH-06	F	Buscar vehículo por placas en menos de 3 segundos.	Todos	Alta	P29, P30
VEH-07	F	Calcular en cualquier momento el valor total de los autos que están dentro del taller (valor en custodia).	Admin	Media	P12
3. Órdenes de servicio
ID	Tipo	Descripción	Actor	Prioridad	Origen
ORD-01	F	Abrir orden al llegar el auto con dueño, placas, número de serie y falla reportada.	Recepción	Alta	P2, P5
ORD-02	F	Manejar cuatro etapas: recibido, diagnóstico, reparación y listo.	Sistema	Alta	P4
ORD-03	F	Mostrar en una sola pantalla todos los autos en el taller y su etapa.	Admin, Mecánico	Alta	P4
ORD-04	F	Permitir al mecánico avanzar la orden de diagnóstico a reparación y a listo. Recepción solo registra la llegada.	Mecánico, Recepción	Alta	P5
ORD-05	F	Permitir regresar una orden a una etapa anterior solo al administrador.	Admin	Alta	P5
ORD-06	F	Alertar al administrador y al mecánico si una orden lleva más de 5 días sin cambiar de etapa.	Sistema	Media	P6
ORD-07	F	Excluir de la alerta las órdenes en estado “esperando pieza en camino”.	Sistema	Media	P6
ORD-08	F	Registrar en una bitácora quién hizo cada trabajo y a qué hora.	Sistema	Alta	P7
ORD-09	F	Asignar uno o más mecánicos a cada orden o trabajo.	Admin, Mecánico	Alta	P7, P26 (inf.)
ORD-10	F	Registrar las piezas usadas y la mano de obra de cada orden.	Mecánico	Alta	P13, P17
ORD-11	F	Cancelar una orden solo con motivo obligatorio y registro del usuario, sin borrarla.	Admin	Alta	P32
ORD-12	F	Mostrar las órdenes con retraso.	Admin	Media	P27
ORD-13	F	Ordenar la fila de trabajo dando prioridad a las órdenes de clientes VIP.	Sistema	Media	P9
4. Inventario
ID	Tipo	Descripción	Actor	Prioridad	Origen
INV-01	F	Llevar un catálogo con existencias de tornillería y consumibles.	Admin	Alta	P13, P14
INV-02	F	Descontar automáticamente del inventario cada pieza que se asigna a una orden.	Sistema	Alta	P13
INV-03	F	Alertar cuando una pieza de tornillería o consumibles tenga 2 o menos unidades.	Sistema	Media	P14
INV-04	F	Tratar las piezas especiales por marca como compras ligadas a una orden, sin existencias en inventario.	Sistema	Alta	P14
INV-05	F	Ajustar el inventario manualmente solo por el administrador, con motivo y bitácora.	Admin	Baja	P13 (inf.)
5. Proveedores y compras
ID	Tipo	Descripción	Actor	Prioridad	Origen
PRV-01	F	Registrar proveedores (Italia, Alemania, Inglaterra) con país y contacto.	Admin	Media	P15
PRV-02	F	Calcular y mostrar el tiempo de entrega de cada proveedor (hoy de 2 a 8 semanas).	Sistema	Media	P15
PRV-03	F	Registrar cada pedido con su estado y fecha estimada de llegada.	Admin	Alta	P15
PRV-04	F	Ver la lista de pedidos pendientes con su fecha estimada.	Admin	Alta	P15
PRV-05	F	Registrar quién solicitó cada pedido y para qué orden (evita casos como la pieza de $90,000 sin responsable).	Sistema	Alta	P3
PRV-06	F	Generar automáticamente un borrador de orden de compra con las piezas faltantes.	Sistema	Media	P16
PRV-07	F	Impedir el envío de una orden de compra sin la aprobación del administrador.	Admin	Alta	P16
PRV-08	F	Mostrar las piezas que hay que pedir esta semana.	Admin	Media	P27
6. Pagos
ID	Tipo	Descripción	Actor	Prioridad	Origen
PAG-01	F	Calcular el costo total como piezas + mano de obra + IVA 16%, con desglose visible para el cliente.	Sistema	Alta	P17
PAG-02	F	Aplicar el descuento VIP de 10% solo a la mano de obra.	Sistema	Media	P9
PAG-03	F	Registrar anticipos y pagos en partes (50% de anticipo cuando hay piezas caras, resto al entregar).	Admin	Alta	P18
PAG-04	F	Permitir pagos en partes solo a clientes marcados como de confianza.	Admin	Media	P18
PAG-05	F	Mostrar cuánto ha pagado y cuánto debe cada cliente y cada orden.	Admin	Alta	P18
7. Facturación
ID	Tipo	Descripción	Actor	Prioridad	Origen
FAC-01	F	Cerrar la orden y generar la factura con un solo botón.	Admin	Alta	P20
FAC-02	F	Bloquear el cierre si hay saldo pendiente, salvo que el administrador haya autorizado entregar con saldo.	Sistema	Alta	P20
FAC-03	F	Generar la factura con logotipo del taller, datos fiscales, número de orden y desglose de piezas, mano de obra e IVA.	Sistema	Alta	P21
FAC-04	F	Impedir editar una factura emitida. Su cancelación requiere motivo y usuario.	Admin	Media	P32 (inf.)
8. Autorizaciones
ID	Tipo	Descripción	Actor	Prioridad	Origen
AUT-01	F	Exigir autorización del administrador en órdenes de más de $250,000 MXN.	Sistema	Alta	P19
AUT-02	F	Bloquear la compra de piezas y el inicio del trabajo hasta que la orden esté autorizada.	Sistema	Alta	P19
AUT-03	F	Permitir que solo el administrador autorice, sin delegar.	Admin	Alta	P19
AUT-04	F	Permitir al administrador autorizar la entrega con saldo pendiente.	Admin	Alta	P20
AUT-05	F	Registrar cada autorización con usuario, fecha, hora y monto.	Sistema	Alta	P7, P19 (inf.)
AUT-06	F	Mostrar al administrador, también desde celular, las órdenes que esperan su autorización.	Admin	Media	P24, P25
9. Reportes
ID	Tipo	Descripción	Actor	Prioridad	Origen
REP-01	F	Panel matutino con autos por etapa, piezas que llegan esta semana y órdenes que esperan autorización.	Admin	Media	P25
REP-02	F	Reporte semanal de lo facturado y lo pendiente de cobro.	Admin	Media	P25
REP-03	F	Reporte de ingresos generados y carga de trabajo por mecánico, para repartir bonos.	Admin	Baja	P26
REP-04	F	Reporte de valor en custodia para la aseguradora.	Admin	Media	P12, P28
REP-05	F	Exportar reportes a Excel y PDF.	Admin	Media	P28
REP-06	NF	Los reportes pueden entregarse hasta un mes después del arranque.	N/A	N/A	P33
10. Seguridad y requisitos no funcionales transversales
ID	Tipo	Descripción	Actor	Prioridad	Origen
SEG-01	F	Autenticar a cada usuario de forma individual con tres roles: Administrador (1), Mecánico (3) y Recepción (1).	Todos	Alta	P22
SEG-02	F	Ocultar a los mecánicos los precios de cobro y las ganancias.	Sistema	Alta	P23
SEG-03	F	Ocultar a recepción las finanzas y lo que gana cada mecánico.	Sistema	Alta	P23
SEG-04	F	Dar al administrador acceso total.	Admin	Alta	P23
SEG-05	NF	Restringir los datos de cada cliente y de sus autos al personal autorizado (discreción con figuras públicas).	Sistema	Alta	Cierre
SEG-06	NF	Mantener una bitácora de auditoría inmutable de altas, cambios, cancelaciones y autorizaciones.	Sistema	Alta	P7, P32
SEG-07	NF	Usar borrado lógico: nada se elimina físicamente.	Sistema	Alta	P32
SEG-08	NF	Hacer respaldo automático diario, con pérdida máxima aceptable de 1 día de datos.	Sistema	Alta	P31
SEG-09	NF	Guardar una copia de los respaldos fuera del taller.	Sistema	Alta	P31
SEG-10	NF	Mostrar una orden o resultado de búsqueda en 2 a 3 segundos como máximo.	Sistema	Alta	P30
SEG-11	NF	Dar a los mecánicos una interfaz de tableta con botones grandes, apta para manos sucias.	Mecánico	Alta	P24, P29
SEG-12	NF	Soportar tableta (mecánicos), computadora (recepción) y celular (administrador, solo consulta).	Todos	Alta	P24
SEG-13	NF	No pedir dos veces el mismo dato al capturar.	Todos	Alta	P29
SEG-14	NF	Dimensionar para 5 usuarios, unos 8 ingresos por semana y 10 autos simultáneos.	Sistema	Media	P1, P22
SEG-15	NF	Cifrar los datos en tránsito y en reposo.	Sistema	Media	Cierre (inf.)
SEG-16	F	Migrar los datos actuales de la libreta y el Excel.	Admin	Baja	P2 (inf.)
Criterio de aceptación del primer día (P33)

El sistema debe permitir registrar cliente y auto, abrir una orden, moverla por las etapas, descontar piezas y facturar. Esto cubre CLI-01, VEH-01, ORD-01 a ORD-05, INV-02, PAG-01 y FAC-01 a FAC-03.

