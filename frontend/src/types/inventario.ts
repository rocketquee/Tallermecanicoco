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
