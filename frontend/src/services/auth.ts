import type { LoginResponse } from '../types/auth'
import api from './api'

/**
 * POST /api/v1/login con JSON { correo, password }.
 * El proveedor de autenticacion decide si el token se conserva en el equipo.
 */
export async function iniciarSesion(
  correo: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/login', {
    correo,
    password,
  })
  return data
}

export async function obtenerUsuarioActual(): Promise<LoginResponse['usuario']> {
  const { data } =
    await api.get<LoginResponse['usuario']>('/login/me')
  return data
}
