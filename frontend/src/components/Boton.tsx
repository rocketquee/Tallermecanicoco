import type { ButtonHTMLAttributes } from 'react'
import { clasesBoton } from './estilosBoton'
import type { VarianteBoton } from './estilosBoton'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton
}

export function Boton({
  variante = 'primario',
  className = '',
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={clasesBoton(variante, className)}
      {...props}
    />
  )
}
