import api from './api'
import type {
  AutorizacionOrden,
  EstadoAutorizacion,
  ListaAutorizaciones,
  ResolverAutorizacionPayload,
} from '../types/autorizaciones'

export interface FiltrosAutorizaciones {
  estado?: EstadoAutorizacion
  limit?: number
}

/**
 * Órdenes que superan el monto autorizado (o tienen la bandera encendida),
 * con el estado de su solicitud. Administrador y Recepción.
 */
export async function listarAutorizaciones(
  filtros: FiltrosAutorizaciones = {},
): Promise<ListaAutorizaciones> {
  const { data } = await api.get<ListaAutorizaciones>('/autorizaciones', {
    params: {
      estado: filtros.estado || undefined,
      limit: filtros.limit ?? 200,
    },
  })
  return data
}

/**
 * Aprueba o rechaza la autorización de una orden. Solo Administrador.
 * La decisión queda asentada en la bitácora con el usuario y el motivo.
 */
export async function resolverAutorizacion(
  ordenId: number,
  payload: ResolverAutorizacionPayload,
): Promise<AutorizacionOrden> {
  const { data } = await api.post<AutorizacionOrden>(
    `/autorizaciones/orden/${ordenId}/resolver`,
    payload,
  )
  return data
}
