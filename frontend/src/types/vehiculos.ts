/** Tipos de vehiculo segun la respuesta real de /api/v1/vehiculos. */

export interface Vehiculo {
  id: number
  cliente_id: number
  placas: string
  vin: string | null
  marca: string
  modelo: string
  anio: number
  color: string | null
  kilometraje_entrada: number | null
  /** Decimal serializado como texto; null para el rol Mecanico. */
  valor_aproximado: string | null
  created_at: string
  updated_at: string
  activo: boolean
}

/** Cuerpo que acepta POST /api/v1/vehiculos. */
export interface VehiculoPayload {
  cliente_id: number
  placas: string
  vin: string | null
  marca: string
  modelo: string
  anio: number
  color: string | null
  kilometraje_entrada: number | null
  valor_aproximado: number | null
}

/** Cuerpo de PUT /api/v1/vehiculos/{id}: actualización parcial. */
export type VehiculoUpdatePayload = Partial<VehiculoPayload> & {
  activo?: boolean
}
