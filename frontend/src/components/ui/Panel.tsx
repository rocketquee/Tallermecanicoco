import type { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  className?: string
}

/** Contenedor base de las tablas y filtros: fondo panel y borde sutil. */
export function Panel({ children, className = '' }: PanelProps) {
  return (
    <section
      className={`overflow-hidden rounded-panel border border-line bg-panel ${className}`}
    >
      {children}
    </section>
  )
}

interface CabeceraProps {
  titulo: string
  descripcion?: string
  extra?: ReactNode
}

export function PanelCabecera({ titulo, descripcion, extra }: CabeceraProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold tracking-tight text-foreground">
          {titulo}
        </h2>
        {descripcion && (
          <p className="mt-0.5 text-[11px] leading-5 text-faint">{descripcion}</p>
        )}
      </div>
      {extra}
    </div>
  )
}
