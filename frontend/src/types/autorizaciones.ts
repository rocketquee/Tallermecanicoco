/** Tipos del módulo de autorizaciones por monto (AUT-01 a AUT-08). */

import type { EstadoOrden } from './ordenes'

/**
 * Estado de la solicitud. La tabla solo guarda `aprobado` (0/1), así que el
 * backend deriva el estado: sin fecha de resolución es Pendiente.
 */
export type EstadoAutorizacion = 'Pendiente' | 'Aprobada' | 'Rechazada'

export type TipoAutorizacion =
  | 'Monto_Alto'
  | 'Saldo_Pendiente'
  | 'Reautorizacion'

/** Orden que requiere autorización, con el estado de su solicitud. */
export interface AutorizacionOrden {
  orden_id: number
  estado_orden: EstadoOrden
  cliente_nombre: string
  vehiculo_placas: string
  vehiculo_descripcion: string
  /** Texto decimal: Pydantic serializa Decimal como cadena. */
  total: string
  saldo: string
  estado: EstadoAutorizacion
  autorizacion_id: number | null
  tipo: TipoAutorizacion | null
  solicitada_en: string | null
  aprobado_por: string | null
  fecha_resolucion: string | null
  requiere_autorizacion: boolean
}

/** Listado con el umbral vigente para mostrarlo en pantalla. */
export interface ListaAutorizaciones {
  monto_umbral: string
  total: number
  items: AutorizacionOrden[]
}

/** Cuerpo de POST /api/v1/autorizaciones/orden/{orden_id}/resolver. */
export interface ResolverAutorizacionPayload {
  aprobado: boolean
  motivo?: string | null
}
