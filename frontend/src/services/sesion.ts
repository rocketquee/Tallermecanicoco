/**
 * Token persistente opcional y estado de usuario solo en memoria.
 *
 * Se separa de api.ts y auth.ts para evitar imports circulares.
 * El token es un JWT firmado por el backend; aqui solo se almacena.
 */

import type { UsuarioSesion } from '../types/auth'

const TOKEN_KEY = 'autopulse_token'
const USUARIO_LEGACY_KEY = 'autopulse_usuario'
let tokenMemoria: string | null = null
let usuarioMemoria: UsuarioSesion | null = null

export function guardarSesion(
  token: string,
  usuario: UsuarioSesion,
  mantenerSesion: boolean,
): void {
  localStorage.removeItem(USUARIO_LEGACY_KEY)
  tokenMemoria = token
  usuarioMemoria = usuario
  if (mantenerSesion) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function obtenerToken(): string | null {
  localStorage.removeItem(USUARIO_LEGACY_KEY)
  return tokenMemoria ?? localStorage.getItem(TOKEN_KEY)
}

export function obtenerUsuario(): UsuarioSesion | null {
  return usuarioMemoria
}

export function cerrarSesion(): void {
  tokenMemoria = null
  usuarioMemoria = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USUARIO_LEGACY_KEY)
}

export function estaAutenticado(): boolean {
  return Boolean(obtenerToken())
}
