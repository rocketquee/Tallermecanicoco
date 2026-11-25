# Índice de documentación — Apex Elite Motorsport

| Documento | Contenido |
|---|---|
| [requisitos.md](requisitos.md) | Requisitos originales (92 requisitos, con prioridad y origen). Fuente de verdad del alcance. |
| [requisitos-actualizados.md](requisitos-actualizados.md) | Cambios, requisitos nuevos y contradicciones detectadas después de la entrevista. |
| [contexto-tecnico.md](contexto-tecnico.md) | Stack definitivo, convenciones SQL, estructura de carpetas y decisiones de infraestructura. |
| [erd.md](erd.md) | Diagrama Entidad-Relación en Mermaid con las 21 tablas, sus columnas principales y sus relaciones PK/FK. |
| [decisiones-tecnicas.md](decisiones-tecnicas.md) | ADRs: registro de las decisiones de diseño y sus consecuencias. |
| [reporte-practica.md](reporte-practica.md) | Reporte consolidado de la práctica: portada, objetivos, 92 requerimientos, stack, 3FN, ingeniería inversa, procedimientos y funciones, roles, triggers, transacciones y guion de capturas. |
| [reporte-practica.pdf](reporte-practica.pdf) | Versión imprimible del reporte, con portada, índice y numeración de páginas. Lista para entregar. |
| [guia-capturas-ingenieria.md](guia-capturas-ingenieria.md) | Guion de las capturas de ingeniería inversa, diagrama E-R en 3FN, ejecución de rutinas en MySQL Workbench y valor en custodia en el Dashboard. |
| [pendientes.md](pendientes.md) | Auditoría del sistema: módulos incompletos, deuda técnica y criterio para declararlo 100 % funcional (PEN-01 a PEN-39). |
| [diagrama-er-interactivo.html](diagrama-er-interactivo.html) | Diagrama E-R navegable: 21 tablas, 218 columnas, panel de atributos y relaciones, y descarga en PNG. |
| [guia-capturas.md](../documentacion-tecnica/guia-capturas.md) | Guion detallado de las 47 capturas que demuestran el sistema en funcionamiento. |

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
| `sql/08_datos_prueba_extra.sql` | Clientes, vehículos, servicios y órdenes adicionales de ejemplo |
| `sql/09_avance_mecanico.sql` | Columna `ordenes_servicio.diagnostico` para el reporte de avance del mecánico |
| `sql/10_proveedores_demo.sql` | Cuatro proveedores mexicanos de ejemplo en MXN (PRV-01, PRV-02, PRV-09) |
| `sql/11_procedimientos_funciones.sql` | `sp_calcular_total_orden` y `fn_valor_en_custodia` (ORD-10, VEH-07, REP-01) |

## Regenerar el PDF

El PDF se construye desde `reporte-practica.md`; no se edita a mano.

```powershell
python -m pip install markdown pypdf reportlab
python scripts/generar-pdf.py
```

- `--html` conserva el HTML intermedio en `docs/.reporte-practica.html`.
- `--sin-numeros` omite el pie de página con la numeración.
- El script usa Microsoft Edge o Google Chrome en modo headless; si ninguno está instalado,
  define `EDGE_PATH` con la ruta del ejecutable.

## Reporte final con diseño

`docs/reporte-final.html` es el mismo reporte con diseño de impresión: portada, índice
paginado, tipografía serif, texto justificado y tablas contenidas. Contiene exactamente el
mismo texto que `reporte-practica.md`.

Para obtener el PDF:

1. Abre `docs/reporte-final.html` con doble clic.
2. Pulsa `Ctrl + P`.
3. Elige **Guardar como PDF**, tamaño **A4**, márgenes **Predeterminados** y activa
   **Gráficos de fondo**.
4. Guarda como `docs/reporte-final.pdf`.
