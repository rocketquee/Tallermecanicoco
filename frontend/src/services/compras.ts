import api from './api'
import type { Compra, CompraPayload, EstadoCompra } from '../types/proveedores'

export interface FiltrosCompras {
  estado?: EstadoCompra
  proveedorId?: number
  limit?: number
}

/**
 * Órdenes de compra registradas, de la más reciente a la más antigua.
 * Solo Administrador: incluye importes (SEG-02).
 */
export async function listarCompras(
  filtros: FiltrosCompras = {},
): Promise<Compra[]> {
  const { data } = await api.get<Compra[]>('/compras', {
    params: {
      estado: filtros.estado || undefined,
      proveedor_id: filtros.proveedorId || undefined,
      limit: filtros.limit ?? 200,
    },
  })
  return data
}

/**
 * Registra una compra en estado Borrador. El backend calcula los totales y la
 * fecha estimada de llegada con el tiempo de entrega del proveedor.
 * Solo Administrador.
 */
export async function crearCompra(payload: CompraPayload): Promise<Compra> {
  const { data } = await api.post<Compra>('/compras', payload)
  return data
}
