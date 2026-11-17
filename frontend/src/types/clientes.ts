/** Tipos de cliente segun la respuesta real de /api/v1/clientes. */

export type CategoriaCliente = 'Regular' | 'VIP'

export interface VehiculoResumen {
  id: number
  cliente_id: number
  placas: string
  vin: string | null
  marca: string
  modelo: string
  anio: number
  color: string | null
  kilometraje_entrada: number | null
  valor_aproximado: string | null
  created_at: string
  updated_at: string
  activo: boolean
}

export interface Cliente {
  id: number
  nombre: string
  telefono1: string | null
  telefono2: string | null
  correo: string | null
  direccion: string | null
  nombre_asistente: string | null
  categoria: CategoriaCliente
  descuento_mano_obra: string
  permite_pagos_parciales: boolean
  confidencial: boolean
  notas: string | null
  rfc: string | null
  razon_social: string | null
  regimen_fiscal: string | null
  codigo_postal: string | null
  created_at: string
  updated_at: string
  activo: boolean
}

export interface ClienteConVehiculos extends Cliente {
  vehiculos: VehiculoResumen[]
}

/** Cuerpo que aceptan POST y PUT /api/v1/clientes. */
export interface ClientePayload {
  nombre: string
  telefono1: string | null
  telefono2: string | null
  correo: string | null
  direccion: string | null
  nombre_asistente: string | null
  categoria: CategoriaCliente
  descuento_mano_obra: number
  permite_pagos_parciales: boolean
  confidencial: boolean
  notas: string | null
  rfc: string | null
  razon_social: string | null
  regimen_fiscal: string | null
  codigo_postal: string | null
  activo?: boolean
}
