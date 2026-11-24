/** Tipos del módulo Proveedores y compras (PRV-01 a PRV-09). */

export type Moneda = 'EUR' | 'GBP' | 'MXN' | 'USD'

export interface Proveedor {
  id: number
  nombre: string
  pais: string
  contacto: string | null
  telefono: string | null
  correo: string | null
  tiempo_entrega_dias: number | null
  moneda: Moneda
  activo: boolean
  created_at: string
  updated_at: string
}

/** Cuerpo de POST /api/v1/proveedores. Solo Administrador. */
export interface ProveedorPayload {
  nombre: string
  pais: string
  contacto?: string | null
  telefono?: string | null
  correo?: string | null
  tiempo_entrega_dias?: number | null
  moneda?: Moneda
}

/**
 * Cuerpo de PUT /api/v1/proveedores/{id}. Enviar `activo: false` es la baja
 * lógica: el proveedor conserva su historial de compras.
 */
export type ProveedorUpdatePayload = Partial<ProveedorPayload> & {
  activo?: boolean
}

export type EstadoCompra =
  | 'Borrador'
  | 'Aprobada'
  | 'Enviada'
  | 'Recibida'
  | 'Cancelada'

export interface DetalleCompra {
  id: number
  refaccion_id: number
  refaccion_nombre: string
  cantidad: number
  /** Texto decimal: Pydantic serializa Decimal como cadena. */
  precio_unitario_moneda: string
  importe: string
}

export interface Compra {
  id: number
  proveedor_id: number
  proveedor_nombre: string
  fecha_pedido: string
  fecha_estimada_llegada: string | null
  estado: EstadoCompra
  moneda_original: Moneda
  tipo_cambio: string | null
  total_moneda_original: string | null
  total_mxn: string | null
  orden_id: number | null
  solicitado_por: string | null
  aprobado_por: string | null
  activo: boolean
  detalles: DetalleCompra[]
}

/** Cuerpo de POST /api/v1/compras. Solo Administrador. */
export interface CompraPayload {
  proveedor_id: number
  refaccion_id: number
  cantidad: number
  /** Si se omite, el backend usa refacciones.precio_costo. */
  precio_unitario_moneda?: number
  /** Obligatorio cuando el proveedor no cotiza en MXN. */
  tipo_cambio?: number
  orden_id?: number
  fecha_estimada_llegada?: string
}

/** Catálogo de monedas que acepta la API, con su etiqueta legible. */
export const MONEDAS: ReadonlyArray<{ valor: Moneda; etiqueta: string }> = [
  { valor: 'MXN', etiqueta: 'MXN · Peso mexicano' },
  { valor: 'USD', etiqueta: 'USD · Dólar estadounidense' },
  { valor: 'EUR', etiqueta: 'EUR · Euro' },
  { valor: 'GBP', etiqueta: 'GBP · Libra esterlina' },
]
