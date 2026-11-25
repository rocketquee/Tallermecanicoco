/** Tipos que devuelve la API de Apex Elite Motorsport al iniciar sesion. */

export type RolUsuario = 'Administrador' | 'Recepcion' | 'Mecanico'

export interface UsuarioSesion {
  id: number
  nombre: string
  correo: string
  rol: RolUsuario
  mecanico_id: number | null
  activo: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  usuario: UsuarioSesion
}

/** Forma del error que devuelve FastAPI (HTTPException). */
export interface ErrorApi {
  detail?: string
}
