import type {
  CategoriaCliente,
  Cliente,
  ClienteConVehiculos,
  ClientePayload,
} from '../types/clientes'
import api from './api'

export interface FiltrosClientes {
  q?: string
  categoria?: CategoriaCliente
  incluir_inactivos?: boolean
  skip?: number
  limit?: number
}

export async function listarClientes(
  filtros: FiltrosClientes = {},
): Promise<Cliente[]> {
  const { data } = await api.get<Cliente[]>('/clientes', { params: filtros })
  return data
}

export async function obtenerCliente(
  clienteId: number,
): Promise<ClienteConVehiculos> {
  const { data } = await api.get<ClienteConVehiculos>(`/clientes/${clienteId}`)
  return data
}

export async function crearCliente(
  payload: ClientePayload,
): Promise<Cliente> {
  // `activo` no forma parte del schema de alta; se omite para no enviar ruido.
  const datos = { ...payload }
  delete datos.activo
  const { data } = await api.post<Cliente>('/clientes', datos)
  return data
}

export async function actualizarCliente(
  clienteId: number,
  payload: ClientePayload,
): Promise<Cliente> {
  const { data } = await api.put<Cliente>(`/clientes/${clienteId}`, payload)
  return data
}
