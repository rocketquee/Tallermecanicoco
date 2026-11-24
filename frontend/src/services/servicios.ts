import api from './api'
import type { ServicioDisponible } from '../types/servicios'

export interface FiltrosServicios {
  busqueda?: string
  limit?: number
}

/**
 * Catálogo de mano de obra vigente para elegir el servicio realizado.
 * No incluye precios: el backend los resuelve al registrar el avance.
 */
export async function listarServicios(
  filtros: FiltrosServicios = {},
): Promise<ServicioDisponible[]> {
  const { data } = await api.get<ServicioDisponible[]>('/servicios', {
    params: { limit: 200, ...filtros },
  })
  return data
}
