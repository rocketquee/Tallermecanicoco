/** Tipos de orden de servicio segun la respuesta real de /api/v1/ordenes. */

export type EstadoOrden =
  | 'Recibido'
  | 'Diagnostico'
  | 'Reparacion'
  | 'Listo'
  | 'Entregado'
  | 'Cancelado'

export interface Orden {
  id: number
  estado: EstadoOrden
  falla_reportada: string | null
  /** Diagnóstico y notas capturados por el mecánico. */
  diagnostico: string | null
  cliente_id: number
  cliente_nombre: string
  vehiculo_id: number
  vehiculo_placas: string
  vehiculo_marca: string
  vehiculo_modelo: string
  mecanico_id: number | null
  mecanico_nombre: string | null
  /** El backend lo devuelve como texto decimal; es null para el rol Mecanico. */
  total: string | null
  created_at: string
  updated_at: string
  activo: boolean
}

export const ESTADOS_ORDEN: ReadonlyArray<{
  valor: EstadoOrden
  etiqueta: string
}> = [
  { valor: 'Recibido', etiqueta: 'Recibido' },
  { valor: 'Diagnostico', etiqueta: 'Diagnóstico' },
  { valor: 'Reparacion', etiqueta: 'Reparación' },
  { valor: 'Listo', etiqueta: 'Listo' },
  { valor: 'Entregado', etiqueta: 'Entregado' },
  { valor: 'Cancelado', etiqueta: 'Cancelado' },
]

/** Cliente tal como llega dentro de GET /api/v1/ordenes/{id}. */
export interface ClienteOrden {
  id: number
  nombre: string
  telefono1: string | null
  correo: string | null
  rfc: string | null
  categoria: 'Regular' | 'VIP'
  /** Si es confidencial, el backend oculta nombre y contacto al Mecánico. */
  confidencial: boolean
}

/** Vehículo tal como llega dentro de GET /api/v1/ordenes/{id}. */
export interface VehiculoOrden {
  id: number
  placas: string
  vin: string | null
  marca: string
  modelo: string
  anio: number
  color: string | null
  kilometraje_entrada: number | null
}

/** Línea de la orden: mano de obra o refacción. */
export interface DetalleOrdenLinea {
  id: number
  tipo: 'Servicio' | 'Refaccion'
  descripcion: string
  cantidad: number
  /** Texto decimal; null para el rol Mecánico (SEG-18). */
  precio_unitario: string | null
  importe: string | null
}

/** Respuesta completa de GET /api/v1/ordenes/{id}. */
export interface OrdenDetalle {
  id: number
  estado: EstadoOrden
  falla_reportada: string | null
  diagnostico: string | null
  cliente: ClienteOrden
  vehiculo: VehiculoOrden
  mecanico_id: number | null
  mecanico_nombre: string | null
  total_piezas: string | null
  total_mano_obra: string | null
  subtotal: string | null
  iva: string | null
  total: string | null
  detalles: DetalleOrdenLinea[]
  created_at: string
  updated_at: string
  activo: boolean
}

/** Refacción que el mecánico consume al registrar su avance. */
export interface RefaccionUsadaPayload {
  refaccion_id: number
  cantidad: number
}

/**
 * Cuerpo de POST /api/v1/ordenes/{id}/registrar-avance.
 * Los precios NO se envían: el backend los toma del catálogo (SEG-18).
 */
export interface AvanceMecanicoPayload {
  diagnostico?: string | null
  etapa_nueva?: EstadoOrden | null
  refacciones: RefaccionUsadaPayload[]
}
