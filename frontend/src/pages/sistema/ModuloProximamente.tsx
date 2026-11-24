import { ArrowLeft, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { clasesBoton } from '../../components/ui/estilosBoton'
import { EncabezadoPagina } from '../../components/ui/EncabezadoPagina'
import { Panel } from '../../components/ui/Panel'

interface Props {
  titulo: string
  descripcion?: string
}

/**
 * Vista genérica para los módulos que todavía no tienen lógica.
 * Mantiene el mismo lenguaje visual del dashboard: superficie oscura,
 * bordes sutiles y tipografía del panel.
 */
export function ModuloProximamente({ titulo, descripcion }: Props) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <EncabezadoPagina
        etiqueta="Módulo del sistema"
        titulo={titulo}
        descripcion={descripcion ?? 'Una nueva sección del taller.'}
        acciones={
          <Link to="/dashboard" className={clasesBoton('secundario')}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a Principal
          </Link>
        }
      />

      <Panel className="flex min-h-[320px] flex-col items-center justify-center px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-panel border border-line bg-white/[0.03] text-muted">
          <Sparkles
            aria-hidden="true"
            className="h-5 w-5"
            strokeWidth={1.7}
          />
        </span>

        <span className="mt-5 inline-flex items-center rounded-full border border-line bg-white/[0.03] px-3 py-1 text-[10px] font-medium tracking-[0.14em] text-faint uppercase">
          Próximamente
        </span>

        <h2 className="mt-4 max-w-2xl text-[18px] leading-7 font-semibold tracking-tight text-foreground">
          {titulo} - Este módulo estará disponible próximamente
        </h2>

        <p className="mt-2 max-w-md text-[12px] leading-5 text-muted">
          Estamos preparando esta sección con el mismo diseño y los mismos
          permisos del panel principal.
        </p>
      </Panel>
    </div>
  )
}
