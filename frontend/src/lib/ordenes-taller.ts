/** Reglas de etapas del taller que usa el rol Mecánico. */

import { ESTADOS_ORDEN } from '../types/ordenes'
import type { EstadoOrden } from '../types/ordenes'

/** Flujo completo que se dibuja en el detalle de la orden. */
export const ETAPAS_FLUJO: ReadonlyArray<EstadoOrden> = [
  'Recibido',
  'Diagnostico',
  'Reparacion',
  'Listo',
]

/**
 * Avance estimado por etapa. Son valores de ejemplo mientras el detalle de
 * trabajos de cada orden no esté implementado: sirven para que la barra
 * comunique de un vistazo qué tan cerca está la unidad de salir.
 */
export const PROGRESO_POR_ETAPA: Record<EstadoOrden, number> = {
  Recibido: 15,
  Diagnostico: 40,
  Reparacion: 75,
  Listo: 100,
  Entregado: 100,
  Cancelado: 0,
}

/** Color de la barra, alineado con las etiquetas de etapa del panel. */
export const BARRA_POR_ETAPA: Record<EstadoOrden, string> = {
  Recibido: 'bg-sky-400',
  Diagnostico: 'bg-violet-400',
  Reparacion: 'bg-amber-400',
  Listo: 'bg-positive',
  Entregado: 'bg-line-strong',
  Cancelado: 'bg-negative',
}

/** Etapas a las que se puede mover la orden desde la actual (hacia adelante). */
export function etapasSiguientes(estado: EstadoOrden): EstadoOrden[] {
  const indice = ETAPAS_FLUJO.indexOf(estado)
  if (indice < 0) {
    return []
  }
  return ETAPAS_FLUJO.slice(indice + 1)
}

export function etiquetaEtapa(estado: EstadoOrden): string {
  return (
    ESTADOS_ORDEN.find((opcion) => opcion.valor === estado)?.etiqueta ?? estado
  )
}
