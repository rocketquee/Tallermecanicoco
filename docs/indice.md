# Índice de documentación — AutoPulse Elite

| Documento | Contenido |
|---|---|
| [requisitos.md](requisitos.md) | Requisitos originales (92 requisitos, con prioridad y origen). Fuente de verdad del alcance. |
| [requisitos-actualizados.md](requisitos-actualizados.md) | Cambios, requisitos nuevos y contradicciones detectadas después de la entrevista. |
| [contexto-tecnico.md](contexto-tecnico.md) | Stack definitivo, convenciones SQL, estructura de carpetas y decisiones de infraestructura. |
| [erd.md](erd.md) | Diagrama Entidad-Relación en Mermaid con las 21 tablas, sus columnas principales y sus relaciones PK/FK. |
| [decisiones-tecnicas.md](decisiones-tecnicas.md) | ADRs: registro de las decisiones de diseño y sus consecuencias. |

## Scripts SQL

Los scripts de `sql/` se ejecutan en orden y reproducen el esquema completo:

| Archivo | Contenido |
|---|---|
| `sql/01_catalogos.sql` | `clientes`, `proveedores`, `mecanicos`, `servicios` |
| `sql/02_vehiculos.sql` | `vehiculos`, `polizas_seguro` |
| `sql/03_inventario.sql` | `refacciones`, `compras`, `detalle_compra`, `movimientos_inventario` |
| `sql/04_ordenes.sql` | `ordenes_servicio`, `detalle_orden`, `fotos_vehiculo` + FK de `compras.orden_id` |
| `sql/05_finanzas.sql` | `pagos`, `facturas`, `autorizaciones` |
| `sql/06_seguridad.sql` | `usuarios`, `bitacora`, `orden_mecanicos`, `historial_etapas`, `parametros` |
| `sql/07_datos_prueba.sql` | Datos de ejemplo para desarrollo (solo local) |
