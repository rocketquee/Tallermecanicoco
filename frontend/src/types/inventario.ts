/** Tipos del catálogo de inventario que consume el modal de avance. */

export interface RefaccionDisponible {
  id: number
  nombre: string
  marca: string | null
  stock_actual: number
  stock_minimo: number
  es_especial: boolean
  activo: boolean
}

/** Refacción tal como la ve la vista de Inventario (Admin y Recepción). */
export type RefaccionInventario = RefaccionDisponible

export interface EntradaInventarioPayload {
  cantidad: number
  motivo?: string | null
}

/** Cuerpo de POST /api/v1/refacciones. */
export interface RefaccionPayload {
  nombre: string
  marca: string | null
  es_especial: boolean
  stock_actual: number
  stock_minimo: number
  precio_costo: number
  precio_venta: number
  proveedor_id: number | null
}

/**
 * Cuerpo de PUT /api/v1/refacciones/{id}. Enviar `activo: false` es la baja
 * lógica: la pieza conserva su historial pero deja de aparecer en el catálogo.
 */
export type RefaccionUpdatePayload = Partial<RefaccionPayload> & {
  activo?: boolean
}
