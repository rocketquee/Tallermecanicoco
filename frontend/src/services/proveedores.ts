import api from './api'
import type {
  Proveedor,
  ProveedorPayload,
  ProveedorUpdatePayload,
} from '../types/proveedores'

export interface FiltrosProveedores {
  busqueda?: string
  incluirInactivos?: boolean
  limit?: number
}

/**
 * Catálogo de proveedores vigentes, ordenado por nombre.
 * La lectura está disponible para cualquier usuario autenticado.
 */
export async function listarProveedores(
  filtros: FiltrosProveedores = {},
): Promise<Proveedor[]> {
  const { data } = await api.get<Proveedor[]>('/proveedores', {
    params: {
      q: filtros.busqueda || undefined,
      incluir_inactivos: filtros.incluirInactivos || undefined,
      limit: filtros.limit ?? 200,
    },
  })
  return data
}

/** Alta de un proveedor. Solo Administrador. */
export async function crearProveedor(
  payload: ProveedorPayload,
): Promise<Proveedor> {
  const { data } = await api.post<Proveedor>('/proveedores', payload)
  return data
}

/**
 * Actualiza parcialmente un proveedor. `activo: false` es la baja lógica.
 * Solo Administrador.
 */
export async function actualizarProveedor(
  proveedorId: number,
  payload: ProveedorUpdatePayload,
): Promise<Proveedor> {
  const { data } = await api.put<Proveedor>(
    `/proveedores/${proveedorId}`,
    payload,
  )
  return data
}
