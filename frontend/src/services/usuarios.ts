import type { UsuarioSistema } from '../types/usuarios'
import api from './api'

/** Lista los usuarios del sistema. Solo disponible para Administrador. */
export async function listarUsuarios(): Promise<UsuarioSistema[]> {
  const { data } = await api.get<UsuarioSistema[]>('/usuarios')
  return data
}

/** Define una contraseña nueva para el usuario indicado. */
export async function restablecerPassword(
  usuarioId: number,
  password: string,
): Promise<UsuarioSistema> {
  const { data } = await api.post<UsuarioSistema>(
    `/usuarios/${usuarioId}/restablecer-password`,
    { password },
  )
  return data
}
