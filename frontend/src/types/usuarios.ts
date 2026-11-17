/** Tipos de la administracion de usuarios (solo Administrador). */

import type { RolUsuario } from './auth'

export interface UsuarioSistema {
  id: number
  nombre: string
  correo: string
  rol: RolUsuario
  mecanico_id: number | null
  activo: boolean
}
