import { Link } from 'react-router-dom'
import {
  ChevronRight,
  FileCheck2,
  Package,
  Receipt,
  ShieldCheck,
  Timer,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  ATENCION,
  type IconoAtencion,
  type ItemAtencion,
} from '../../lib/mock-dashboard'

const ICONOS: Record<IconoAtencion, LucideIcon> = {
  autorizacion: ShieldCheck,
  detenidos: Timer,
  piezas: Package,
  consumibles: Wrench,
  polizas: FileCheck2,
  saldo: Receipt,
}

interface Props {
  items?: ItemAtencion[]
}

export function AttentionList({ items = ATENCION }: Props) {
  return (
    <section
      className="flex flex-col px-4 py-4 xl:px-6 xl:py-6"
      aria-label="Requiere atención"
    >
      <h2 className="text-[12px] font-semibold tracking-wide text-foreground">
        Requiere atención
      </h2>

      <div className="mt-2 flex flex-col">
        {items.map((item) => {
          const Icono = ICONOS[item.id]

          return (
            <Link
              key={item.id}
              to={item.ruta}
              className="group -mx-2 flex min-h-11 items-center gap-2.5 rounded-panel px-2 py-2 transition hover:bg-white/[0.03]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-panel border border-line bg-white/[0.02]">
                <Icono className="h-3.5 w-3.5 text-muted" strokeWidth={1.7} />
              </span>

              <span className="min-w-0 flex-1 text-[11px] leading-snug text-foreground group-hover:text-white">
                {item.etiqueta}
              </span>

              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.07] px-1.5 text-[10px] font-medium text-muted tabular-nums">
                {item.contador}
              </span>

              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-faint" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
