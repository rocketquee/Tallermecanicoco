import type {
  Vehiculo,
  VehiculoPayload,
  VehiculoUpdatePayload,
} from '../types/vehiculos'
import api from './api'

export interface FiltrosVehiculos {
  cliente_id?: number
  q?: string
  incluir_inactivos?: boolean
  skip?: number
  limit?: number
}

/** Lista los vehiculos del taller; el backend busca por placas, marca o modelo. */
export async function listarVehiculos(
  filtros: FiltrosVehiculos = {},
): Promise<Vehiculo[]> {
  const { data } = await api.get<Vehiculo[]>('/vehiculos', { params: filtros })
  return data
}

/** Registra un vehiculo. Solo Administrador y Recepcion. */
export async function crearVehiculo(
  payload: VehiculoPayload,
): Promise<Vehiculo> {
  const { data } = await api.post<Vehiculo>('/vehiculos', payload)
  return data
}

/** Actualiza parcialmente un vehiculo. Solo Administrador y Recepcion. */
export async function actualizarVehiculo(
  vehiculoId: number,
  payload: VehiculoUpdatePayload,
): Promise<Vehiculo> {
  const { data } = await api.put<Vehiculo>(
    `/vehiculos/${vehiculoId}`,
    payload,
  )
  return data
}
