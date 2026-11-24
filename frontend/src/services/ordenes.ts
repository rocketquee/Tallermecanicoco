import type {
  AvanceMecanicoPayload,
  EstadoOrden,
  Orden,
  OrdenDetalle,
} from '../types/ordenes'
import api from './api'

export interface FiltrosOrdenes {
  estado?: EstadoOrden
  cliente_id?: number
  mecanico_id?: number
  incluir_inactivos?: boolean
  skip?: number
  limit?: number
}

/** Cuerpo de POST /api/v1/ordenes. El alta siempre nace en estado Recibido. */
export interface OrdenCreadaPayload {
  cliente_id: number
  vehiculo_id: number
  falla_reportada?: string | null
}

/** Lista las ordenes visibles para el usuario autenticado. */
export async function listarOrdenes(
  filtros: FiltrosOrdenes = {},
): Promise<Orden[]> {
  const { data } = await api.get<Orden[]>('/ordenes', { params: filtros })
  return data
}

/** Registra una orden nueva. Solo Administrador y Recepción. */
export async function crearOrden(
  payload: OrdenCreadaPayload,
): Promise<Orden> {
  const { data } = await api.post<Orden>('/ordenes', payload)
  return data
}

/** Mueve la orden a la siguiente etapa. Solo Administrador y Mecanico. */
export async function avanzarEtapa(ordenId: number): Promise<Orden> {
  const { data } = await api.post<Orden>(`/ordenes/${ordenId}/avanzar-etapa`)
  return data
}

/** Detalle completo de una orden (cliente, vehiculo, conceptos y totales). */
export async function obtenerOrden(ordenId: number): Promise<OrdenDetalle> {
  const { data } = await api.get<OrdenDetalle>(`/ordenes/${ordenId}`)
  return data
}

/**
 * Guarda en una sola operación el diagnóstico, las refacciones usadas y la
 * nueva etapa. El backend descuenta inventario, recalcula totales y audita.
 */
export async function registrarAvance(
  ordenId: number,
  payload: AvanceMecanicoPayload,
): Promise<OrdenDetalle> {
  const { data } = await api.post<OrdenDetalle>(
    `/ordenes/${ordenId}/registrar-avance`,
    payload,
  )
  return data
}
