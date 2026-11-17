const CLAVE_INTENTOS = 'autopulse-login-intentos'
const MAX_INTENTOS = 5
const DURACION_BLOQUEO = 15 * 60 * 1000

interface EstadoIntentos {
  cantidad: number
  bloqueadoHasta: number
}

function leerEstado(): EstadoIntentos {
  try {
    const valor = sessionStorage.getItem(CLAVE_INTENTOS)
    if (!valor) {
      return { cantidad: 0, bloqueadoHasta: 0 }
    }

    const estado = JSON.parse(valor) as Partial<EstadoIntentos>
    if (
      typeof estado.cantidad === 'number' &&
      typeof estado.bloqueadoHasta === 'number'
    ) {
      return {
        cantidad: estado.cantidad,
        bloqueadoHasta: estado.bloqueadoHasta,
      }
    }
  } catch {
    sessionStorage.removeItem(CLAVE_INTENTOS)
  }
  return { cantidad: 0, bloqueadoHasta: 0 }
}

export function obtenerFechaBloqueo(): number {
  return leerEstado().bloqueadoHasta
}

export function guardarIntentoFallido(): EstadoIntentos {
  const estado = leerEstado()
  const cantidad = estado.cantidad + 1
  const bloqueadoHasta =
    cantidad >= MAX_INTENTOS ? Date.now() + DURACION_BLOQUEO : 0
  const nuevoEstado = { cantidad, bloqueadoHasta }
  sessionStorage.setItem(CLAVE_INTENTOS, JSON.stringify(nuevoEstado))
  return nuevoEstado
}

export function limpiarIntentos(): void {
  sessionStorage.removeItem(CLAVE_INTENTOS)
}
