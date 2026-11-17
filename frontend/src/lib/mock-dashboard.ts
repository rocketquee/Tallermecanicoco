/**
 * Datos de ejemplo del dashboard de AutoPulse Elite.
 *
 * Todo está tipado y separado de la UI para sustituirlo después por las
 * respuestas reales de la API (clientes, vehículos, órdenes, pagos y pólizas).
 * Fecha de referencia del tablero: 15 de noviembre de 2026.
 */

export type Tendencia = 'sube' | 'baja'
export type TonoBarra = 'claro' | 'medio' | 'oscuro'
export type IconoAtencion =
  | 'autorizacion'
  | 'detenidos'
  | 'piezas'
  | 'consumibles'
  | 'polizas'
  | 'saldo'

export interface KpiDashboard {
  id: string
  etiqueta: string
  valor: string
  variacion: number
  tendencia: Tendencia
}

export interface PuntoFacturacion {
  fecha: string
  etiqueta: string
  monto: number
}

export interface PuntoOrdenes {
  fecha: string
  etiqueta: string
  ordenes: number
}

export interface SegmentoCobranza {
  etiqueta: string
  porcentaje: number
  monto: number
  tono: TonoBarra
  subrayado?: boolean
}

export interface Cobranza {
  etiqueta: string
  total: number
  segmentos: SegmentoCobranza[]
}

export interface Custodia {
  total: number
  porcentaje: number
  leyendas: Array<{ etiqueta: string; tono: TonoBarra }>
}

export interface ClientesActivos {
  total: number
  vip: number
  regulares: number
  porcentajeActivo: number
  alturas: number[]
}

export interface Poliza {
  fechaVencimiento: string
  aseguradora: string
  numero: string
}

export interface PerspectivaIa {
  titulo: string
  antes: string
  destacado: string
  despues: string
  accion: string
}

export interface ItemAtencion {
  id: IconoAtencion
  etiqueta: string
  contador: number
  ruta: string
}

export const FECHA_REFERENCIA = '2026-11-15'
export const PERIODO = 'Últimos 30 días'
export const RANGO_FECHAS = '17 oct - 15 nov 2026'
export const NOMBRE_TALLER = 'Pizarro Performance Garage'

function etiquetaFecha(fecha: Date): string {
  // `day: 'numeric'` evita el guion que algunos ICU insertan con '2-digit'
  // (por ejemplo, "17-oct" en lugar de "17 oct").
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
    .format(fecha)
    .replace(/\./g, '')
}

const fechasPeriodo = Array.from({ length: 30 }, (_, indice) => {
  const fecha = new Date(Date.UTC(2026, 9, 17 + indice))
  return {
    iso: fecha.toISOString().slice(0, 10),
    etiqueta: etiquetaFecha(fecha),
  }
})

const valoresFacturacion = [
  880, 910, 960, 1010, 980, 1040, 1100, 1080, 1140, 1200, 1180, 1160, 1080,
  1020, 1090, 1150, 1210, 1260, 1230, 1320, 1380, 1350, 1430, 1510, 1480, 1560,
  1640, 1700, 1780, 1840,
]

const valoresOrdenes = [
  1, 0, 1, 2, 1, 1, 0, 2, 1, 1, 2, 1, 1, 2, 0, 1, 2, 3, 1, 2, 2, 2, 1, 2, 4,
  2, 1, 2, 1, 0,
]

export const FACTURACION = {
  etiqueta: 'Facturación mensual',
  total: 1_842_600,
  totalCompacto: '$1.8M',
  cambio: 27.4,
} as const

export const PUNTOS_FACTURACION: PuntoFacturacion[] = valoresFacturacion.map(
  (monto, indice) => ({
    ...fechasPeriodo[indice],
    fecha: fechasPeriodo[indice].iso,
    monto: monto * 1000,
  }),
)

export const PUNTOS_ORDENES: PuntoOrdenes[] = valoresOrdenes.map(
  (ordenes, indice) => ({
    ...fechasPeriodo[indice],
    fecha: fechasPeriodo[indice].iso,
    ordenes,
  }),
)

export const ETIQUETAS_EJE_X = [0, 7, 14, 21, 29].map(
  (indice) => fechasPeriodo[indice].etiqueta,
)

/** Índices con etiqueta visible en la gráfica de barras (cada 5 días). */
export const ETIQUETAS_EJE_X_ORDENES = [0, 5, 10, 15, 20, 25].map(
  (indice) => fechasPeriodo[indice].etiqueta,
)

export const KPIS: KpiDashboard[] = [
  {
    id: 'autos',
    etiqueta: 'Autos en el taller',
    valor: '7 / 10',
    variacion: 12.5,
    tendencia: 'sube',
  },
  {
    id: 'ordenes',
    etiqueta: 'Órdenes del periodo',
    valor: '42',
    variacion: 9.8,
    tendencia: 'sube',
  },
  {
    id: 'promedio',
    etiqueta: 'Valor promedio por orden',
    valor: '$185,400.00',
    variacion: -4.2,
    tendencia: 'baja',
  },
]

export const COBRANZA: Cobranza = {
  etiqueta: 'Cobranza',
  total: 742_300,
  segmentos: [
    {
      etiqueta: 'Cobrado',
      porcentaje: 50,
      monto: 371_150,
      tono: 'claro',
    },
    {
      etiqueta: 'Anticipos',
      porcentaje: 25,
      monto: 185_575,
      tono: 'medio',
    },
    {
      etiqueta: 'Por cobrar',
      porcentaje: 25,
      monto: 185_575,
      tono: 'oscuro',
      subrayado: true,
    },
  ],
}

export const CUSTODIA: Custodia = {
  total: 48_500_000,
  porcentaje: 78,
  leyendas: [
    { etiqueta: 'Piezas', tono: 'claro' },
    { etiqueta: 'Mano de obra', tono: 'medio' },
  ],
}

export const CLIENTES_ACTIVOS: ClientesActivos = {
  total: 126,
  vip: 15,
  regulares: 111,
  porcentajeActivo: 78,
  alturas: [
    14, 19, 11, 22, 16, 12, 24, 15, 20, 13, 25, 17, 10, 21, 14, 23, 18, 12, 26,
    16, 22, 13, 19, 15, 28, 17, 11, 24, 20, 14, 21, 16, 12, 25, 18, 22, 15, 27,
    19, 13, 23, 17, 21, 14, 26, 18, 12, 24, 20, 16, 22, 13, 25, 19, 15, 28, 21,
    17, 23, 14,
  ],
}

export const POLIZA: Poliza = {
  fechaVencimiento: '2026-12-12',
  aseguradora: 'GNP Seguros',
  numero: '**** 4432',
}

export const PERSPECTIVA_IA: PerspectivaIa = {
  titulo: 'Perspectivas de IA',
  antes: 'Los autos detenidos más de ',
  destacado: '5 días bajaron 3.5% este mes',
  despues: ' frente al mes anterior.',
  accion: 'Preguntar a la IA',
}

export const ATENCION: ItemAtencion[] = [
  {
    id: 'autorizacion',
    etiqueta: 'Órdenes esperando mi autorización',
    contador: 3,
    ruta: '/autorizaciones',
  },
  {
    id: 'detenidos',
    etiqueta: 'Autos detenidos más de 5 días',
    contador: 2,
    ruta: '/ordenes',
  },
  {
    id: 'piezas',
    etiqueta: 'Piezas que llegan esta semana',
    contador: 4,
    ruta: '/proveedores',
  },
  {
    id: 'consumibles',
    etiqueta: 'Tornillería y consumibles con 2 o menos unidades',
    contador: 2,
    ruta: '/inventario',
  },
  {
    id: 'polizas',
    etiqueta: 'Pólizas por vencer en 30 días',
    contador: 1,
    ruta: '/vehiculos',
  },
  {
    id: 'saldo',
    etiqueta: 'Órdenes con saldo pendiente',
    contador: 5,
    ruta: '/pagos',
  },
]

const picoIndice = valoresOrdenes.indexOf(Math.max(...valoresOrdenes))

export const ORDENES_RESUMEN = {
  total: valoresOrdenes.reduce((total, valor) => total + valor, 0),
  cambio: 9.8,
  pico: valoresOrdenes[picoIndice],
  picoIndice,
  picoFecha: fechasPeriodo[picoIndice].etiqueta,
} as const
