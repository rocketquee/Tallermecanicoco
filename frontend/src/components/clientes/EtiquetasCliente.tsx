import type { CategoriaCliente } from '../../types/clientes'

/** Etiqueta VIP / Regular usada en listado y ficha. */
export function EtiquetaCategoria({
  categoria,
}: {
  categoria: CategoriaCliente
}) {
  const esVip = categoria === 'VIP'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
        esVip
          ? 'border-line-strong bg-white/[0.07] text-foreground'
          : 'border-line bg-white/[0.03] text-muted'
      }`}
    >
      {esVip && <span className="h-1.5 w-1.5 rounded-full bg-foreground" />}
      {esVip ? 'VIP' : 'Regular'}
    </span>
  )
}

/** Aviso discreto para clientes con datos restringidos (SEG-17). */
export function EtiquetaConfidencial() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-muted">
      <span aria-hidden="true">🔒</span>
      Confidencial
    </span>
  )
}

export function EtiquetaEstado({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
        activo
          ? 'border-positive/30 bg-positive/10 text-positive'
          : 'border-line bg-white/[0.03] text-faint'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          activo ? 'bg-positive' : 'bg-faint'
        }`}
      />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}
