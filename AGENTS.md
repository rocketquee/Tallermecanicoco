# Reglas del Proyecto Apex Elite Motorsport

## Contexto
Sistema de gestión para taller de autos de lujo (Apex Elite Motorsport). 
Maneja clientes VIP, vehículos de alto valor, órdenes de servicio con 4 etapas, 
inventario, proveedores internacionales, pagos parciales, facturación CFDI 4.0 y 
autorizaciones por monto. La discreción es crítica (clientes figuras públicas).

## Stack Tecnológico (Fase Actual: Diseño de BD)
- **Base de Datos:** MySQL 8.x
- **Documentación:** Markdown para GitHub
- **Futuro Backend:** Python + FastAPI
- **Futuro Frontend:** React + TypeScript

## Reglas de Trabajo Obligatorias
1. **Nunca generes todo el código SQL de golpe.** Siempre genera por bloques 
   (Bloque 1: Catálogos, Bloque 2: Vehículos/Pólizas, etc.) y espera confirmación.
2. **Usa el documento de requisitos como fuente de verdad.** Si algo no está en 
   los requisitos, pregúntalo antes de asumir.
3. **MySQL:** Usa `DECIMAL(12,2)` para dinero, `ENUM` para estados, `DATETIME` 
   para fechas. `FOREIGN KEY` con `ON DELETE RESTRICT` (nada se borra físicamente).
4. **Auditoría:** Toda tabla transaccional debe permitir trazabilidad. La bitácora 
   es obligatoria.
5. **Seguridad:** Respeta los roles: Admin (todo), Recepción (sin finanzas), 
   Mecánico (solo placas y trabajo, sin precios ni nombres de clientes confidenciales).

## Estructura de Documentación Requerida
- `README.md`: Descripción del proyecto, stack, cómo instalar y ejecutar.
- `docs/requisitos.md`: Los dos archivos de requisitos que te proporcioné.
- `docs/erd.md`: Diagrama E-R en Mermaid (lo generaremos después del SQL).
- `sql/`: Carpeta con los scripts SQL divididos por bloques.

## Idioma
- Documentación y comentarios en español.
- Nombres de tablas y columnas en español (ej: `clientes`, `ordenes_servicio`).

## Decisiones de diseño registradas
- `ordenes_servicio.mecanico_id` es el mecánico principal/responsable. La tabla
  `orden_mecanicos` guarda a todos los que participan.
- Los logs inmutables (`bitacora`, `historial_etapas`) solo llevan `created_at`; no
  tienen `updated_at` ni `activo` a propósito, y están protegidos con triggers que
  bloquean `UPDATE` y `DELETE`. 
