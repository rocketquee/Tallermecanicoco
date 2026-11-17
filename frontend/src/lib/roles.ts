import type { RolUsuario } from '../types/auth'

export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  Administrador: 'Administrador',
  Recepcion: 'Recepción',
  Mecanico: 'Mecánico',
}

export function etiquetaRol(rol?: RolUsuario): string {
  return rol ? ETIQUETA_ROL[rol] : 'Sin rol'
}
