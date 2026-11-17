import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string
  descripcion?: string
}

/** Casilla con titulo y descripcion opcional, envuelta en una tarjeta. */
export function CampoCheckbox({
  etiqueta,
  descripcion,
  id,
  className = '',
  ...props
}: Props) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-panel border border-line bg-white/[0.02] px-3.5 py-3 transition hover:border-line-strong ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line bg-white/[0.03] accent-white focus:ring-2 focus:ring-white/20 focus:ring-offset-0"
        {...props}
      />
      <span>
        <span className="block text-[12px] font-medium text-foreground">
          {etiqueta}
        </span>
        {descripcion && (
          <span className="mt-0.5 block text-[11px] leading-5 text-faint">
            {descripcion}
          </span>
        )}
      </span>
    </label>
  )
}
