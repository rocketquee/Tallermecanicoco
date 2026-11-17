/**
 * Estado de recepción del vehículo para la vista de Detalle de Orden.
 *
 * PROVISIONAL: la base de datos todavía no guarda el nivel de combustible, el
 * estado general ni el inventario del vehículo (gata, llave de rueda, etc.).
 * Mientras exista la tabla de inspección, estos valores se derivan del id de
 * la orden para que la vista sea estable entre recargas. Cuando el backend los
 * exponga, basta con reemplazar `inspeccionProvisional` por los datos de
 * `GET /api/v1/ordenes/{id}`.
 */

export type EstadoGeneral = 'Muy bueno' | 'Bueno' | 'Regular' | 'Con detalles'

export interface ItemInventario {
  nombre: string
  presente: boolean
}

export interface InspeccionVehiculo {
  kilometraje: number | null
  /** Porcentaje de 0 a 100. */
  nivelCombustible: number
  estadoGeneral: EstadoGeneral
  inventario: ItemInventario[]
  observaciones: string
}

const NIVELES_COMBUSTIBLE = [75, 50, 90, 25]

const ESTADOS_GENERALES: EstadoGeneral[] = [
  'Bueno',
  'Muy bueno',
  'Regular',
  'Con detalles',
]

const OBSERVACIONES = [
  'Sin golpes visibles. Se recibe con los accesorios declarados por el cliente.',
  'Ligero desgaste en la pintura del cofre y la defensa delantera.',
  'Se detectan detalles estéticos menores; el cliente los autoriza al ingreso.',
  'Unidad limpia y completa. Se recomienda revisión de niveles al entregar.',
]

const INVENTARIO_BASE = [
  'Gata',
  'Llave de rueda',
  'Triángulos de seguridad',
  'Extintor',
  'Tapetes',
  'Herramienta básica',
]

export function etiquetaCombustible(nivel: number): string {
  if (nivel >= 90) return 'Casi lleno'
  if (nivel >= 65) return '3/4'
  if (nivel >= 40) return '1/2'
  if (nivel >= 20) return '1/4'
  return 'Reserva'
}

export function inspeccionProvisional(
  ordenId: number,
  kilometraje: number | null,
): InspeccionVehiculo {
  const variante = Math.abs(ordenId) % ESTADOS_GENERALES.length

  return {
    kilometraje,
    nivelCombustible: NIVELES_COMBUSTIBLE[variante],
    estadoGeneral: ESTADOS_GENERALES[variante],
    // Se alterna la presencia de accesorios para que la ficha no se vea
    // idéntica en todas las órdenes mientras el módulo no exista.
    inventario: INVENTARIO_BASE.map((nombre, indice) => ({
      nombre,
      presente: (Math.abs(ordenId) + indice) % 5 !== 0,
    })),
    observaciones: OBSERVACIONES[variante],
  }
}
