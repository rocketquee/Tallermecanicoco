/** Formateadores es-MX compartidos por el dashboard. */

const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatoFechaCorta = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const formatoDiaMes = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

export function formatearMoneda(valor: number): string {
  return formatoMoneda.format(valor)
}

export function formatearCompacto(valor: number): string {
  if (Math.abs(valor) >= 1_000_000) {
    const millones = valor / 1_000_000
    const decimales = Number.isInteger(millones) ? 0 : 1
    return `$${millones.toFixed(decimales)}M`
  }
  if (Math.abs(valor) >= 1_000) {
    return `$${Math.round(valor / 1_000)}k`
  }
  return `$${Math.round(valor)}`
}

/** `12 dic 2026` (sin punto final y sin guion entre día y mes). */
export function formatearFechaCorta(iso: string): string {
  const fecha = new Date(`${iso}T12:00:00Z`)
  return formatoFechaCorta.format(fecha).replace(/\./g, '')
}

/** `17 oct` (sin punto final y sin guion entre día y mes). */
export function formatearDiaMes(iso: string): string {
  const fecha = new Date(`${iso}T12:00:00Z`)
  return formatoDiaMes.format(fecha).replace(/\./g, '')
}

/** Alias usado por el encabezado para el rango de fechas. */
export function formatearFechaSinAnio(iso: string): string {
  return formatearDiaMes(iso)
}

export function diasEntre(desdeIso: string, hastaIso: string): number {
  const desde = new Date(`${desdeIso}T00:00:00Z`).getTime()
  const hasta = new Date(`${hastaIso}T00:00:00Z`).getTime()
  return Math.ceil((hasta - desde) / 86_400_000)
}

export type EstadoPoliza = 'Vigente' | 'Por vencer' | 'Vencida'

export function estadoPoliza(
  fechaVencimiento: string,
  fechaReferencia: string,
): EstadoPoliza {
  const dias = diasEntre(fechaReferencia, fechaVencimiento)
  if (dias < 0) {
    return 'Vencida'
  }
  return dias <= 30 ? 'Por vencer' : 'Vigente'
}
