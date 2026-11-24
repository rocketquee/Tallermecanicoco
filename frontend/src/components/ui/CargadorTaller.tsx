import { Wrench } from 'lucide-react'

interface Props {
  etiqueta?: string
  className?: string
}

/**
 * Indicador de carga con una llave girando: el detalle de taller que pide la
 * vista de órdenes. La animación vive en index.css y respeta
 * `prefers-reduced-motion`.
 */
export function CargadorTaller({
  etiqueta = 'Cargando…',
  className = '',
}: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2.5 py-6 text-[12px] font-medium text-muted ${className}`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white/[0.03]">
        <Wrench
          className="cargador-taller h-4 w-4 text-faint"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </span>
      <span>{etiqueta}</span>
    </div>
  )
}
