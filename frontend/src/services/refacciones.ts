import api from './api'
import type {
  EntradaInventarioPayload,
  RefaccionDisponible,
  RefaccionInventario,
} from '../types/inventario'

export interface FiltrosRefacciones {
  busqueda?: string
  disponibles?: boolean
  limit?: number
}

export interface FiltrosInventario {
  busqueda?: string
  limit?: number
}

/**
 * Catálogo de refacciones vigentes para elegir piezas usadas.
 * El backend no devuelve precios al rol Mecánico (SEG-18).
 */
export async function listarRefacciones(
  filtros: FiltrosRefacciones = {},
): Promise<RefaccionDisponible[]> {
  const { data } = await api.get<RefaccionDisponible[]>('/refacciones', {
    params: { disponibles: true, limit: 200, ...filtros },
  })
  return data
}

/**
 * Inventario completo para Administrador y Recepción: incluye las refacciones
 * agotadas para poder surtirlas desde la misma tabla.
 */
export async function listarInventario(
  filtros: FiltrosInventario = {},
): Promise<RefaccionInventario[]> {
  const { data } = await api.get<RefaccionInventario[]>('/refacciones', {
    params: { disponibles: false, limit: 200, ...filtros },
  })
  return data
}

/**
 * "Surtir inventario": suma piezas al stock. El backend registra el
 * movimiento de entrada y la bitácora. Solo Admin y Recepción.
 */
export async function surtirInventario(
  refaccionId: number,
  payload: EntradaInventarioPayload,
): Promise<RefaccionInventario> {
  const { data } = await api.post<RefaccionInventario>(
    `/refacciones/${refaccionId}/entrada`,
    payload,
  )
  return data
}
