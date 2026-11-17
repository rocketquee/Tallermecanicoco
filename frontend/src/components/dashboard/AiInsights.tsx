import { Clock3, MessageSquare } from 'lucide-react'
import { PERSPECTIVA_IA } from '../../lib/mock-dashboard'

export function AiInsights() {
  return (
    <section
      className="flex flex-col gap-4 px-4 py-4 xl:px-6 xl:py-6"
      aria-label={PERSPECTIVA_IA.titulo}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Clock3 className="h-4 w-4 text-muted" strokeWidth={1.7} />
          <h2 className="text-[12px] font-semibold text-foreground">
            {PERSPECTIVA_IA.titulo}
          </h2>
        </div>

        <button
          type="button"
          className="flex items-center gap-1 text-[11px] font-medium text-muted transition hover:text-foreground"
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.7} />
          {PERSPECTIVA_IA.accion}
        </button>
      </div>

      <p className="max-w-[32ch] text-[22px] leading-[1.4] font-medium tracking-tight text-muted text-pretty xl:text-[24px]">
        {PERSPECTIVA_IA.antes}
        <span className="font-semibold text-foreground">
          {PERSPECTIVA_IA.destacado}
        </span>
        {PERSPECTIVA_IA.despues}
      </p>
    </section>
  )
}
