import { ArrowLeft, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { clasesBoton } from '../../components/ui/estilosBoton'
import { Panel } from '../../components/ui/Panel'

/**
 * 404 real dentro del panel. Antes cualquier ruta desconocida redirigía en
 * silencio al dashboard, lo que ocultaba enlaces rotos.
 */
export function NoEncontrada() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <Panel className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white/[0.03]">
          <SearchX className="h-5 w-5 text-muted" strokeWidth={1.7} />
        </span>

        <div>
          <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
            Error 404
          </p>
          <h1 className="mt-2 text-[26px] leading-tight font-semibold tracking-tight text-foreground">
            Esta pantalla no existe
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-muted">
            La dirección que abriste no corresponde a ningún módulo del
            sistema. Revisa el enlace o vuelve al panel principal.
          </p>
        </div>

        <Link to="/dashboard" className={clasesBoton('primario')}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Principal
        </Link>
      </Panel>
    </div>
  )
}
