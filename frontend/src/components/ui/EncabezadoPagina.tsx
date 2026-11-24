import type { ReactNode } from 'react'

interface Props {
  etiqueta: string
  titulo: string
  descripcion?: string
  acciones?: ReactNode
}

/** Encabezado comun de las vistas de datos, alineado al dashboard. */
export function EncabezadoPagina({
  etiqueta,
  titulo,
  descripcion,
  acciones,
}: Props) {
  return (
    <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
          {etiqueta}
        </p>
        <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight text-foreground sm:text-[30px]">
          {titulo}
        </h1>
        {descripcion && (
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted">
            {descripcion}
          </p>
        )}
      </div>

      {acciones && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {acciones}
        </div>
      )}
    </header>
  )
}
