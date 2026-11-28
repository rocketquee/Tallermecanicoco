import axios from 'axios'

interface DetalleValidacion {
  msg?: string
  loc?: (string | number)[]
}

/**
 * Extrae un mensaje legible de un error de FastAPI.
 *
 * FastAPI devuelve `detail` como texto en HTTPException y como arreglo en los
 * errores de validacion (422). Aqui se cubren ambos casos.
 */
export function mensajeDeError(error: unknown, respaldo: string): string {
  if (!axios.isAxiosError(error)) {
    return respaldo
  }

  if (!error.response) {
    return 'No se pudo conectar con el backend. Verifica tu conexión o que el servidor esté disponible.'
  }

  const detalle = error.response.data?.detail

  if (typeof detalle === 'string' && detalle.trim()) {
    return detalle
  }

  if (Array.isArray(detalle)) {
    const mensajes = detalle
      .map((item) => (item as DetalleValidacion).msg)
      .filter((msg): msg is string => Boolean(msg))
    if (mensajes.length > 0) {
      return mensajes.join('. ')
    }
  }

  return respaldo
}
