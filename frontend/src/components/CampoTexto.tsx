import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string
}

/** Campo de texto con etiqueta y el estilo base del formulario. */
export function CampoTexto({ etiqueta, id, className = '', ...props }: Props) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-muted">
        {etiqueta}
      </span>
      <input
        id={id}
        className={`w-full rounded-panel border border-line bg-white/[0.02] px-3 py-2.5 text-[13px] text-foreground outline-none transition placeholder:text-faint focus:border-line-strong focus:ring-1 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        {...props}
      />
    </label>
  )
}
