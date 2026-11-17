/** Reglas del tablero de bahías que ve el rol Mecánico. */

import { ESTADOS_ORDEN } from '../types/ordenes'
import type { EstadoOrden, Orden } from '../types/ordenes'

/** Número de tarjetas fijas del tablero. */
export const TOTAL_BAHIAS = 4

/** Etapas que mantienen la unidad dentro del taller. */
export const ETAPAS_EN_TALLER: ReadonlyArray<EstadoOrden> = [
  'Recibido',
  'Diagnostico',
  'Reparacion',
]

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

const SIGUIENTE_ETAPA: Partial<Record<EstadoOrden, EstadoOrden>> = {
  Recibido: 'Diagnostico',
  Diagnostico: 'Reparacion',
  Reparacion: 'Listo',
}

export function siguienteEtapa(estado: EstadoOrden): EstadoOrden | null {
  return SIGUIENTE_ETAPA[estado] ?? null
}

export function etiquetaEtapa(estado: EstadoOrden): string {
  return (
    ESTADOS_ORDEN.find((opcion) => opcion.valor === estado)?.etiqueta ?? estado
  )
}

export function estaEnBahia(orden: Orden): boolean {
  return ETAPAS_EN_TALLER.includes(orden.estado)
}

/** Primero las unidades más avanzadas; a igual avance, la más antigua. */
export function ordenarParaBahia(a: Orden, b: Orden): number {
  const avance = PROGRESO_POR_ETAPA[b.estado] - PROGRESO_POR_ETAPA[a.estado]
  return avance !== 0 ? avance : a.id - b.id
}
