import { Construction } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  titulo: string
  descripcion?: string
}

/**
 * Vista vacía de los módulos que todavía no se construyen.
 * Usa los mismos tokens del dashboard: superficie, línea, tipografía y radios.
 */
export function EnConstruccion({ titulo, descripcion }: Props) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="border-b border-line pb-5">
        <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
          Módulo
        </p>
        <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight text-foreground sm:text-[30px]">
          {titulo}
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted">
          {descripcion ?? 'Sección en construcción.'}
        </p>
      </header>

      <section className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-panel border border-line bg-panel px-6 py-12 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-panel border border-line bg-white/[0.03] text-muted">
          <Construction aria-hidden="true" className="h-5 w-5" strokeWidth={1.7} />
        </span>
        <h2 className="mt-4 text-[16px] font-semibold tracking-tight text-foreground">
          Sección en construcción
        </h2>
        <p className="mt-2 max-w-sm text-[12px] leading-5 text-muted">
          Estamos preparando este módulo con el mismo lenguaje visual del panel
          principal.
        </p>
        <Link
          to="/dashboard"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-panel border border-line px-4 text-[12px] font-medium text-muted transition hover:border-line-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
        >
          Volver a Principal
        </Link>
      </section>
    </div>
  )
}
