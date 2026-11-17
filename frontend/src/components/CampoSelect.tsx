import type { SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string
}

/** Select con etiqueta, mismo estilo que CampoTexto. */
export function CampoSelect({
  etiqueta,
  id,
  className = '',
  children,
  ...props
}: Props) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-muted">
        {etiqueta}
      </span>
      <select
        id={id}
        className={`w-full rounded-panel border border-line bg-white/[0.02] px-3 py-2.5 text-[13px] text-foreground outline-none transition focus:border-line-strong focus:ring-1 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}
