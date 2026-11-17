import type { EstadoOrden, Orden, OrdenDetalle } from '../types/ordenes'
import api from './api'

export interface FiltrosOrdenes {
  estado?: EstadoOrden
  cliente_id?: number
  mecanico_id?: number
  incluir_inactivos?: boolean
  skip?: number
  limit?: number
}

/** Lista las ordenes visibles para el usuario autenticado. */
export async function listarOrdenes(
  filtros: FiltrosOrdenes = {},
): Promise<Orden[]> {
  const { data } = await api.get<Orden[]>('/ordenes', { params: filtros })
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
