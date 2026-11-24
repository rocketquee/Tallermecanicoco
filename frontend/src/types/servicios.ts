/** Servicio de mano de obra tal como lo devuelve GET /api/v1/servicios. */

export interface ServicioDisponible {
  id: number
  nombre: string
  descripcion: string | null
  /** Decimal serializado como texto por el backend. */
  duracion_estimada_horas: string | null
  activo: boolean
}
